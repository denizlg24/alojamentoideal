import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

async function createHmac(payload: string, secret: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    return Buffer.from(signatureBuffer).toString('hex');
}


export default async function middleware(req: NextRequest) {
    const cookieStore = await cookies()
    const session = cookieStore.get('session_id')
    const res = intlMiddleware(req);

    if (!session) {
        const payload = Date.now().toString();
        const secret = process.env.SESSION_SECRET!;
        const signature = await createHmac(payload, secret);
        const token = `${payload}.${signature}`;
        cookieStore.set({
            name: 'session_id',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        })
    }

    return res;
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

