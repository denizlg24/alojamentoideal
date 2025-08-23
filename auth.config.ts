import type { NextAuthConfig } from 'next-auth';
import env from './utils/env';

export const authConfig = {
    secret: env.AUTH_SECRET,
    providers: [],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.user.email = token.email!;
            }
            return session;
        }
    },
    pages: {
        signIn: '/admin/login',
    },
} satisfies NextAuthConfig;