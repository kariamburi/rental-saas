import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();

    cookieStore.delete("tenant_id");
    cookieStore.delete("tenant_company_id");

    return NextResponse.json({ ok: true });
}