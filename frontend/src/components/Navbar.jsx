import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="glass sticky top-0 z-40 border-b border-teal-100/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold gradient-title">MedVerify AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['/', '/verify', '/history', '/insights', '/about'].map((path, i) => {
              const labels = ['Home', 'Verify', 'History', 'Insights', 'About']
              return (
                <Link
                  key={path}
                  to={path}
                  className="text-[#0F172A] dark:text-[#E2E8F0] hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-medium"
                >
                  {labels[i]}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-teal-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            {/* Get Started CTA (desktop) */}
            <Link
              to="/verify"
              className="flex items-center gap-1.5 px-5 py-2 btn-primary text-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-teal-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800 text-teal-700 dark:text-teal-300"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#0F172A] dark:text-[#E2E8F0] p-1.5"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass border-b border-teal-100/60 dark:border-slate-800">
          <div className="px-4 py-3 space-y-2">
            {[
              ['/', 'Home'],
              ['/verify', 'Verify'],
              ['/history', 'History'],
              ['/insights', 'Insights'],
              ['/about', 'About'],
            ].map(([path, label]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className="block text-[#0F172A] dark:text-[#E2E8F0] hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-2 font-medium"
              >
                {label}
              </Link>
            ))}

            <Link
              to="/verify"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 mt-3 px-5 py-3 btn-primary text-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar