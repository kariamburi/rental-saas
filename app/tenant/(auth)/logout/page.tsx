"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Phone } from "lucide-react";

export default function TenantLoginPage() {
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/tenant/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Login failed");
                return;
            }

            router.push("/tenant/dashboard");
            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-xl">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                        <Building2 size={28} />
                    </div>

                    <h1 className="mt-5 text-3xl font-black">Tenant Portal</h1>
                    <p className="mt-2 text-sm font-semibold text-slate-300">
                        Sign in using your registered phone number.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 p-6">
                    {error && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                            Phone Number
                        </label>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                            <Phone size={18} className="text-emerald-600" />
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Example: 0712345678"
                                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading || !phone}
                        className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </main>
    );
}