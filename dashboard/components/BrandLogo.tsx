"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  imageClassName?: string
  priority?: boolean
  size?: number
}

export default function BrandLogo({ className, imageClassName, priority = false, size = 96 }: BrandLogoProps) {
  // Using a standard img tag to allow natural aspect ratio scaling based on height
  return (
    <div 
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ height: size }}
    >
      <img 
        src="/smarthotellogo.png" 
        alt="SmartHotel Logo" 
        className={imageClassName}
        style={{ height: '100%', width: 'auto' }}
        draggable={false}
      />
    </div>
  )
}
