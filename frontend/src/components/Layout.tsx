"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import AdminLayout from "./admin/AdminLayout";
import AOS from "aos";
import "aos/dist/aos.css";
import "animate.css";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true, 
    });
  }, []);

  if (isAdminRoute) return <AdminLayout>{children}</AdminLayout>;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export default Layout;