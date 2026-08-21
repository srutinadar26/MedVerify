import React from 'react'
import { Shield } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-[#D8D8DE]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#800020]" />
            <span className="text-sm font-medium gradient-title">MedVerify AI</span>
          </div>
          <p className="text-xs text-[#77727F] text-center">
            © 2026 MedVerify AI — AI-powered medical claim verification
          </p>
          <div className="flex gap-4 text-xs text-[#77727F]">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer