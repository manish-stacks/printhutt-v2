"use client"
import { axiosInstance } from '@/utils/axios';
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState, FormEvent } from 'react'
import { toast } from 'react-toastify'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

const Login = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const userData = {
            email: (e.currentTarget as HTMLFormElement).email.value,
            password: (e.currentTarget as HTMLFormElement).password.value,
        };

        if (!userData.email || !userData.password) {
            toast.error("Please fill valid details")
            return
        }
        // console.log(userData)
        try {
            setLoading(true);
            const data = await axiosInstance.post('/auth/admin-login', userData);
            const role = data.role;

            if (role === 'admin') {
                toast.success('welcome back admin');
                router.push('/admin/dashboard');
            } else {
                toast.error('Unauthorized access');
            }
        } catch (error) {
            if (error instanceof Error) {

                console.log((error as any).response.data.message)
                toast.error((error as any).response.data.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }

    }

    return (
        <>
            <section className="min-h-screen flex bg-[#0f172a]">

                {/* LEFT SIDE (Brand Panel) */}
                <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
                    <div className="text-center px-10">

                        <h1 className="text-white text-[38px] font-bold leading-[1.2]">
                            Welcome Back Admin
                        </h1>

                        <p className="text-[#94a3b8] mt-4 text-[15px] leading-[26px]">
                            Manage your Print Hutt dashboard, orders, products and customers in one place.
                        </p>

                        <div className="mt-10 text-[#6c7fd8] text-[14px]">
                            ⚡ Fast • Secure • Reliable
                        </div>

                    </div>
                </div>

                {/* RIGHT SIDE (FORM) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-6">

                    <div className="w-full max-w-[420px]">

                        {/* CARD */}
                        <div className="bg-white rounded-[20px] p-[35px] shadow-2xl">

                            {/* LOGO */}
                            <div className="flex justify-center mb-6">
                                <Image
                                    src="/print-hutt-logo.webp"
                                    alt="logo"
                                    width={160}
                                    height={50}
                                    className="w-[150px]"
                                    priority
                                />
                            </div>

                            <h2 className="text-center text-[22px] font-bold text-[#1e293b]">
                                Admin Login
                            </h2>

                            <p className="text-center text-[13px] text-[#64748b] mt-2 mb-8">
                                Sign in to continue
                            </p>

                            {/* FORM */}
                            <form onSubmit={handleLogin} className="space-y-4">

                                <div className="relative">
                                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        className="w-full h-[48px] pl-11 pr-4 rounded-[12px] border border-[#e2e8f0] text-[14px] outline-none focus:border-[#6c7fd8] transition"
                                    />
                                </div>

                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Password"
                                        className="w-full h-[48px] pl-11 pr-11 rounded-[12px] border border-[#e2e8f0] text-[14px] outline-none focus:border-[#6c7fd8] transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#6c7fd8]"
                                    >
                                        {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full h-[48px] rounded-[12px] font-semibold text-white transition flex items-center justify-center gap-2
            bg-[#6c7fd8] hover:bg-[#5566c9]
            ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    {loading && (
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    )}
                                    {loading ? "Signing In..." : "Login"}
                                </button>

                            </form>

                        </div>
                    </div>
                </div>

            </section>
        </>
    )
}

export default Login