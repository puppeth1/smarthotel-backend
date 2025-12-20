"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import PageLoader from "@/components/PageLoader";

export default function LandingPage() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <PageLoader />;
  }

  // If user is logged in, we are redirecting.
  if (user) return <PageLoader />;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white relative overflow-hidden">
      
      {/* Logo Animation Container */}
      <motion.div
        initial={{ 
          scale: 2,
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          position: "fixed",
        }}
        animate={{ 
          scale: 1,
          top: "auto",
          bottom: 16,
          left: 16,
          x: 0,
          y: 0,
        }}
        transition={{
          duration: 1.1,
          ease: "easeInOut"
        }}
        className="z-20"
        onAnimationComplete={() => setAnimationComplete(true)}
      >
        <BrandLogo priority size={72} />
      </motion.div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: animationComplete ? 1 : 0,
          y: animationComplete ? 0 : 20
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6"
      >
        <div className="text-center space-y-6 mt-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              SmartHotel
            </h1>
            <p className="text-lg text-gray-500">
              The intelligent operating system for modern hotels.
            </p>
          </div>

          <div className="space-y-4 pt-8 w-full">
            <Link
              href="/signup"
              className="block w-full bg-black text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="block w-full bg-white text-gray-900 font-semibold py-3.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
          </div>

          <p className="text-xs text-gray-400 pt-12">
            © {new Date().getFullYear()} SmartHotel OS. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
