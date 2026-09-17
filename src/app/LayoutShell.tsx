"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

/**
 * LayoutShell — client component that conditionally renders the Navbar
 * and Footer based on the current route.
 *
 * Pages that have their own navigation (Home, Login, Register, Dashboard)
 * opt out of the global Navbar and/or Footer.
 */

// Routes that manage their own header (no global Navbar)
const NO_NAVBAR_ROUTES = ["/login", "/register", "/dashboard"];

// Routes that manage their own footer or shouldn't show it
const NO_FOOTER_ROUTES = ["/login", "/register", "/dashboard"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname?.startsWith("/admin/");

  const showNavbar = !NO_NAVBAR_ROUTES.includes(pathname) && !isAdminRoute;
  const showFooter = !NO_FOOTER_ROUTES.includes(pathname) && !isAdminRoute;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className={showNavbar ? "pt-16" : ""}>
        {children}
      </div>
      {showFooter && <Footer />}
    </>
  );
}
