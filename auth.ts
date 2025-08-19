import NextAuth, { CredentialsSignin } from "next-auth"
import credentials from 'next-auth/providers/credentials';
import { connectDB } from "./lib/mongodb";
import AdminModel from "./models/Admin";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    session: {
        strategy: "jwt",
    },
    providers: [credentials({
        name: "Credentials",
        id: "credentials",
        credentials: {
            email: { label: "email", type: "text" },
            password: { label: "password", type: "password" },
        },
        async authorize(credentials) {
            await connectDB();
            if (!credentials?.email || !credentials?.password) {
                throw new CredentialsSignin("email-password-missing");
            }
            const emailFind = await AdminModel.findOne({
                email: credentials.email,
            });
            const account = emailFind;
            if (!account) throw new CredentialsSignin("no-account");

            const isValid = await bcrypt.compare(credentials.password as string, account.password);
            if (!isValid) throw new CredentialsSignin("wrong-password");
            const user = account.toObject();
            if (!user.emailVerified) {
                throw new CredentialsSignin("not-verified");
            }
            return {
                id: user.sub,
                email: user.email,
            };
        },
    })],
})