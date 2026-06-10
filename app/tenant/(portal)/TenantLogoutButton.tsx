"use client";

import { useRouter } from "next/navigation";

export default function TenantLogoutButton() {
    const router = useRouter();

    async function logout() {
        await fetch("/api/tenant/logout", {
            method: "POST",
        });

        router.push("/tenant/login");
        router.refresh();
    }

    return (
        <button
            onClick={logout}
            className="rounded-full cursor-pointer bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/20"
        >
            Logout
        </button>
    );
}