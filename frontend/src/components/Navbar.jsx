import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Menu, X } from 'lucide-react'
import BackendStatus from './BackendStatus'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-[#D8D8DE]/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#800020] to-[#E9B8C8] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-title">MedVerify AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#292633] hover:text-[#800020] transition-colors text-sm font-medium">Home</Link>
            <Link to="/verify" className="text-[#292633] hover:text-[#800020] transition-colors text-sm font-medium">Verify</Link>
            <Link to="/history" className="text-[#292633] hover:text-[#800020] transition-colors text-sm font-medium">History</Link>
            <Link to="/insights" className="text-[#292633] hover:text-[#800020] transition-colors text-sm font-medium">Insights</Link>
            <Link to="/about" className="text-[#292633] hover:text-[#800020] transition-colors text-sm font-medium">About</Link>
          </div>

          {/* Right Side - Only Backend Status */}
          <div className="hidden md:flex items-center gap-4">
            <BackendStatus />
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#292633]"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm border-b border-[#D8D8DE]/30">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" className="block text-[#292633] hover:text-[#800020] transition-colors py-2" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/verify" className="block text-[#292633] hover:text-[#800020] transition-colors py-2" onClick={() => setIsOpen(false)}>Verify</Link>
            <Link to="/history" className="block text-[#292633] hover:text-[#800020] transition-colors py-2" onClick={() => setIsOpen(false)}>History</Link>
            <Link to="/insights" className="block text-[#292633] hover:text-[#800020] transition-colors py-2" onClick={() => setIsOpen(false)}>Insights</Link>
            <Link to="/about" className="block text-[#292633] hover:text-[#800020] transition-colors py-2" onClick={() => setIsOpen(false)}>About</Link>
            <div className="pt-2 border-t border-[#D8D8DE]/30">
              <BackendStatus />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar