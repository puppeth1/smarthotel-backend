"use client";

import Link from "next/link";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // If user is logged in, we are redirecting, so don't show the landing page content to avoid flash
  // But due to the effect, it might render for a split second.
  // We can return null if user is present.
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / Branding */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-black rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
            S
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            SmartHotel
          </h1>
          <p className="text-lg text-gray-500">
            The intelligent operating system for modern hotels.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <Link
            href="/signup"
            className="block w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>

        <p className="text-xs text-gray-400 pt-8">
          © {new Date().getFullYear()} SmartHotel OS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
