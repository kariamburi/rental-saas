// components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <button
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut size={18} />
            </span>
            Logout
        </button>
    );
}