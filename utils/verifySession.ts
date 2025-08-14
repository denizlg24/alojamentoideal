import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function verifySession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_id')
    if (!token) return false;

    const [payload, signature] = token.value.split('.');
    const expectedSig = crypto
        .createHmac('sha256', process.env.SESSION_SECRET!)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
    );
}