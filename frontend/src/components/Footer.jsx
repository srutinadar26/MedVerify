import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Mail, Heart } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      icon: 'X',
      label: 'Twitter',
      href: 'https://twitter.com/',
    },
    {
      icon: 'GH',
      label: 'GitHub',
      href: 'https://github.com/saffaaa23/MedVerify-AI',
    },
    {
      icon: 'in',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/',
    },
    {
      icon: <Mail size={16} />,
      label: 'Email',
      href: 'mailto:medverify.ai@gmail.com',
    },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield size={24} className="text-white" />
              </div>

              <span className="text-xl font-bold text-white">
                MedVerify AI
              </span>
            </div>

            <p className="text-sm leading-6 text-gray-400">
              An AI-powered medical misinformation verification platform
              designed to help users evaluate health-related claims using
              machine learning, trusted medical sources, and evidence-based
              retrieval.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  {typeof social.icon === 'string' ? (
                    <span className="text-xs font-bold">
                      {social.icon}
                    </span>
                  ) : (
                    social.icon
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Product
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-400 transition-colors"
                >
                  Verify Claim
                </Link>
              </li>

              <li>
                <Link
                  to="/history"
                  className="hover:text-blue-400 transition-colors"
                >
                  Verification History
                </Link>
              </li>

              <li>
                <Link
                  to="/analytics"
                  className="hover:text-blue-400 transition-colors"
                >
                  Analytics
                </Link>
              </li>

              <li>
                <Link
                  to="/chat"
                  className="hover:text-blue-400 transition-colors"
                >
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Trusted Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Trusted Resources
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.who.int/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  World Health Organization
                </a>
              </li>

              <li>
                <a
                  href="https://www.icmr.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Indian Council of Medical Research
                </a>
              </li>

              <li>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  PubMed
                </a>
              </li>

              <li>
                <a
                  href="https://www.ncbi.nlm.nih.gov/pmc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  PubMed Central
                </a>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Technology
            </h3>

            <ul className="space-y-3 text-sm">
              <li>Machine Learning Classification</li>
              <li>FAISS Vector Search</li>
              <li>NLI Re-ranking</li>
              <li>Retrieval-Augmented Generation</li>
              <li>Django REST API</li>
              <li>React + Vite</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <p className="text-sm text-gray-500 text-center md:text-left">
              © {currentYear} MedVerify AI. All rights reserved.
            </p>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>Built with</span>

              <Heart
                size={14}
                className="text-red-500 fill-red-500 mx-1"
              />

              <span>for safer health information.</span>
            </div>

          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer