"use client"

import { AuthContext } from "@/components/AuthProvider"
import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import TopNav from "@/components/TopNav"
import Footer from "@/components/Footer"
import PageLoader from "@/components/PageLoader"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading || !user) return <PageLoader />

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopNav />

      {/* ONLY this should stretch */}
      <main className="flex-1 px-6 pt-4 pb-0 mb-0">
        {children}
      </main>

      <Footer />
    </div>
  )
}