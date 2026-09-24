"use client";
import React, { ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Aos from "aos";
import AppLayout from "./App";
import AdminLayout from "./Admin";
import { APP_VERSION } from "@/config/appVersion";
import { useFreeGiftGuard } from "@/hooks/useFreeGiftGuard";
import { useUserStore } from "@/store/useUserStore";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useFreeGiftGuard();
  const hasRun = useRef(false);
  const fetchUserDetails = useUserStore((s) => s.fetchUserDetails);

  // Reload pe access token in-memory hone se null ho jaata hai — isliye header
  // stale 'Login' dikhata tha. Yahan server se real auth state laate hain
  // (refresh cookie se /auth/me), silent (guest pe toast nahi). isLoggedIn
  // server ke hisaab se set hota hai → header turant sahi.
  const authChecked = useRef(false);
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;
    fetchUserDetails(true).catch(() => { });
  }, [fetchUserDetails]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const storedVersion = localStorage.getItem("APP_VERSION");

    if (storedVersion !== APP_VERSION) {

      //  FULL RESET
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies (JS accessible)
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      localStorage.setItem("APP_VERSION", APP_VERSION);

      // Redirect to login / home
      //window.location.replace("/login"); // or "/"
    }
  }, []);



  const pathname = usePathname();
  const isAdminRoute = pathname!.startsWith("/admin");

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
    });
  }, []);



  const blacklists = [
    "/admin",
    "/admin/login"
  ]

  const isBlacklist = blacklists.includes(pathname!)

  if (isBlacklist) {
    return (<>{children}</>)
  }




  if (isAdminRoute) {
    return (
      <>
        <AdminLayout>
          {children}
        </AdminLayout>
      </>
    )
  }

  return (
    <>
      <AppLayout >
        {children}
      </AppLayout >
    </>
  );
};

export default Layout;