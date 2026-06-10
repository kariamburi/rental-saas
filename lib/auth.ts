import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type AuthUser = {
    id: string;
    companyId: string | null;
    role: string;
    email: string;
    name: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("rental_token")?.value;

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    } catch {
        return null;
    }
}