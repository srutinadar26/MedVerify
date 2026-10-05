import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Twitter, Github, Linkedin, Mail, Heart } from 'lucide-react'

function Footer() {
  const year = new Date().getFullYear()

  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Verify a Claim', to: '/verify' },
        { label: 'History', to: '/history' },
        { label: 'Insights', to: '/insights' },
        { label: 'How It Works', to: '/about' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'PubMed', href: 'https://pubmed.ncbi.nlm.nih.gov' },
        { label: 'WHO', href: 'https://www.who.int' },
        { label: 'ICMR', href: 'https://www.icmr.gov.in' },
        { label: 'Health News', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Contact', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press Kit', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Use', href: '#' },
        { label: 'Medical Disclaimer', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ],
    },
  ]

  return (
    <footer className="glass border-t border-teal-100/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top: Brand + Columns */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand block (wider on desktop) */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-glow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold gradient-title">MedVerify AI</span>
            </Link>
            <p className="text-sm text-[#64748B] leading-relaxed mb-4 max-w-xs">
              AI-powered medical claim verification grounded in trusted evidence from PubMed,
              WHO, and ICMR.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Twitter size={16} />, label: 'Twitter', href: '#' },
                { icon: <Github size={16} />, label: 'GitHub', href: 'https://github.com/saffaaa23/MedVerify-AI' },
                { icon: <Linkedin size={16} />, label: 'LinkedIn', href: '#' },
                { icon: <Mail size={16} />, label: 'Email', href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white border border-teal-100 flex items-center justify-center
                             text-[#64748B] hover:text-teal-700 hover:border-teal-400 hover:shadow-soft
                             transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-[#64748B] hover:text-teal-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.href?.startsWith('http') ? '_blank' : undefined}
                        rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-sm text-[#64748B] hover:text-teal-700 transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges strip */}
        <div className="border-t border-teal-100/60 pt-8 pb-6">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider text-center mb-4">
            Evidence sourced from trusted authorities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {['PubMed', 'WHO', 'ICMR', 'Cochrane', 'NHS'].map((source) => (
              <span
                key={source}
                className="text-xs font-semibold text-[#0F172A] opacity-60 hover:opacity-100 transition-opacity"
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong className="font-semibold">⚠️ Medical Disclaimer:</strong>{' '}
            MedVerify AI is an educational tool for evaluating the accuracy of health claims.
            It is <strong>not</strong> a substitute for professional medical diagnosis,
            treatment, or advice from a qualified healthcare provider. Always consult a doctor
            before making any health-related decisions. In case of emergency, call your local
            emergency number immediately.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-teal-100/60 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#64748B] text-center md:text-left">
            © {year} MedVerify AI. All rights reserved.
          </p>
          <p className="text-xs text-[#64748B] flex items-center gap-1">
            Made with <Heart size={12} className="text-teal-600 fill-teal-600" /> for safer health information
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer