"use server";
import { signIn } from "@/auth";
import { verifySession } from "@/utils/verifySession";
import { AuthError } from "next-auth";

export async function authenticate(
    formData: { email: string; password: string }
) {
    if (!(await verifySession())) {
        return { name: "ServerError", message: "server-error" }
    }
    try {
        await signIn("credentials", { ...formData, redirect: false });
        return true;
    } catch (error) {
        if (error instanceof AuthError) {
            return { name: "CredentialsSignin", message: error.message };
        }
        return { name: "ServerError", message: "server-error" };
    }
}