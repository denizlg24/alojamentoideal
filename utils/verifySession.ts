import { cookies } from 'next/headers';
import crypto from 'crypto';
import env from './env';

export async function verifySession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_id')
    if (!token) return false;

    const [random, payload, signature] = token.value.split('.');
    const expectedSig = crypto
        .createHmac('sha256', env.SESSION_SECRET!)
        .update(`${random}.${payload}`)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
    );
}