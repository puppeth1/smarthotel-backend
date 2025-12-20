"use client"

import { motion } from "framer-motion"
import BrandLogo from "./BrandLogo"

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <motion.div
        animate={{ rotateY: [0, 180] }}
        transition={{ 
          duration: 1.6, 
          ease: "easeInOut", 
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="w-28 h-28"
        style={{ perspective: 1000 }}
      >
        <BrandLogo priority size={110} />
      </motion.div>
    </div>
  )
}
