import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { ok: false, error: "Email and password are required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "Invalid login details" },
                { status: 401 }
            );
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return NextResponse.json(
                { ok: false, error: "Invalid login details" },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            {
                id: user.id,
                companyId: user.companyId,
                role: user.role,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        const res = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        });

        res.cookies.set("rental_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { ok: false, error: "Server error" },
            { status: 500 }
        );
    }
}