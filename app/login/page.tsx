"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.error || "Login failed");
                return;
            }

            if (data.user?.role === "SUPER_ADMIN") {
                router.push("/dashboard");
            } else if (data.user?.role === "COMPANY_ADMIN") {
                router.push("/dashboard/company");
            } else {
                router.push("/dashboard/company");
            }

            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f6fb] px-4">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-slate-300/50 blur-3xl" />

            <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl lg:grid-cols-2">
                <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                            <Building2 size={30} />
                        </div>

                        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                            Property Suite
                        </p>

                        <h1 className="mt-4 text-4xl font-black leading-tight">
                            Smart rental property management.
                        </h1>

                        <p className="mt-4 max-w-md text-slate-300">
                            Manage landlords, properties, units, tenants, invoices, payments,
                            arrears and reports from one premium dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <MiniStat title="Units" value="Track" />
                        <MiniStat title="Rent" value="Collect" />
                        <MiniStat title="Reports" value="Analyze" />
                    </div>
                </section>

                <section className="p-6 sm:p-10">
                    <div className="mx-auto max-w-md">
                        <div className="mb-8 lg:hidden">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Building2 size={26} />
                            </div>
                        </div>

                        <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600">
                            Rental SaaS
                        </p>
                        <h2 className="mt-3 text-3xl font-black text-slate-950">
                            Sign in to continue
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Access your property management dashboard.
                        </p>

                        <form onSubmit={handleLogin} className="mt-8 space-y-5">
                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                                    <Mail size={18} className="text-emerald-600" />
                                    <input
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        placeholder="admin@company.co.ke"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Password
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                                    <LockKeyhole size={18} className="text-emerald-600" />
                                    <input
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="text-slate-400 transition hover:text-emerald-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs font-semibold text-slate-400">
                            Powered by Craft Inventors
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

function MiniStat({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400">{title}</p>
            <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
    );
}