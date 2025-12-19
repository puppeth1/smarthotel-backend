"use client";

import { AuthContext } from "@/components/AuthProvider";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return (
    <div className="flex flex-col h-screen bg-bg">
      <TopNav />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
