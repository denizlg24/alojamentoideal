import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import env from './utils/env';

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
    const session = cookieStore.get('session_id');
    const res = intlMiddleware(req);
    const maxAgeMs = 60 * 60 * 24;
    let needsNewSession = false;

    if (session) {
        const [timestamp] = session.value.split('.');
        const createdAt = parseInt(timestamp, 10);
    
        if (isNaN(createdAt) || Date.now() - createdAt > maxAgeMs) {
            needsNewSession = true;
        }
    } else {
        needsNewSession = true;
    }
    
    if (needsNewSession) {
        const random = crypto.randomUUID();
        const payload = `${Date.now()}.${random}`;
        const secret = env.SESSION_SECRET!;
        const signature = await createHmac(payload, secret);
        const token = `${payload}.${signature}`;
        cookieStore.set({
            name: 'session_id',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: maxAgeMs,
            path: '/',
        })
    }

    const user = await getToken({ req, secret: env.AUTH_SECRET, secureCookie: env.AUTH_URL?.startsWith("https") });
    const isLoggedIn = !!user;
    const locale = req.cookies.get('NEXT_LOCALE')?.value || 'en';
    const isAdmin = req.nextUrl.pathname.startsWith(`/${locale}/admin/dashboard`);
    const isLogIn = req.nextUrl.pathname == `/${locale}/admin/login`;
    const isRegister = req.nextUrl.pathname == `/${locale}/admin/register`;
    if (isAdmin && !isLoggedIn) {
        return NextResponse.redirect(new URL(`/${locale}/admin/login`, req.nextUrl));
    }
    if (isLoggedIn && (isLogIn || isRegister)) {
        return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, req.nextUrl));
    }
    return res;
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

