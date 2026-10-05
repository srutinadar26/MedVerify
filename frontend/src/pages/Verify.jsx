import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageSquare, Link as LinkIcon, Image, Upload, X, Send,
  Mic, MicOff, Clock
} from 'lucide-react'
import { verifyTextClaim, verifyUrlClaim, verifyImageClaim } from '../services/api'

const RECENT_KEY = 'medverify_recent_claims'

// Check if Web Speech API is available
const speechSupported = () =>
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('text')
  const [textInput, setTextInput] = useState(location.state?.prefillText || '')
  const [urlInput, setUrlInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [recentClaims, setRecentClaims] = useState([])

  // Load recent claims on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
      setRecentClaims(Array.isArray(saved) ? saved.slice(0, 3) : [])
    } catch {
      setRecentClaims([])
    }
  }, [])

  const addToRecent = (claim) => {
    if (!claim || !claim.trim()) return
    const trimmed = claim.trim()
    const next = [trimmed, ...recentClaims.filter((c) => c !== trimmed)].slice(0, 3)
    setRecentClaims(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {}
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // ---- Voice input via Web Speech API ----
  const startListening = () => {
    if (!speechSupported()) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => {
      setListening(false)
      setError('Could not hear you. Please try again.')
    }
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }

  const handleVerify = async () => {
    const hasText = textInput.trim().length > 0
    const hasUrl = urlInput.trim().length > 0
    const hasImage = imageFile !== null

    if (!hasText && !hasUrl && !hasImage) {
      setError('Please enter a claim, URL, or upload an image.')
      return
    }

    setError('')
    setIsLoading(true)

    // Remember the claim text for next time
    if (hasText) addToRecent(textInput)
    else if (hasUrl) addToRecent(urlInput)

    try {
      let result = null
      if (activeTab === 'text' && hasText) result = await verifyTextClaim(textInput)
      else if (activeTab === 'url' && hasUrl) result = await verifyUrlClaim(urlInput)
      else if (activeTab === 'image' && hasImage) result = await verifyImageClaim(imageFile)
      else result = await verifyTextClaim(textInput || urlInput || 'Image uploaded')

      navigate('/results', { state: { apiResult: result } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecentClick = (claim) => {
    setActiveTab('text')
    setTextInput(claim)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="gradient-title">What would you like to verify?</span>
        </h1>
        <p className="text-[#64748B]">
          Check a health claim against evidence from trusted medical sources.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-teal-100 mb-6 overflow-x-auto">
        {[
          { id: 'text', label: 'Text', icon: <MessageSquare size={18} /> },
          { id: 'url', label: 'URL', icon: <LinkIcon size={18} /> },
          { id: 'image', label: 'Image', icon: <Image size={18} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8">
        {activeTab === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#0F172A]">
                Enter a medical claim
              </label>
              <button
                type="button"
                onClick={listening ? undefined : startListening}
                disabled={listening}
                title={listening ? 'Listening…' : 'Speak your claim'}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  listening
                    ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                    : 'bg-white border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-400'
                }`}
              >
                {listening ? (
                  <><MicOff size={14} /> Listening…</>
                ) : (
                  <><Mic size={14} /> Speak</>
                )}
              </button>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Example: Drinking warm water every morning prevents cancer."
              className="w-full h-40 p-4 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none transition-all"
            />

            {/* Recent claims */}
            {recentClaims.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-[#64748B] font-medium">
                  <Clock size={12} /> Recent:
                </span>
                {recentClaims.map((claim) => (
                  <button
                    key={claim}
                    type="button"
                    onClick={() => handleRecentClick(claim)}
                    className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700
                               border border-teal-200 hover:bg-teal-100 transition-colors
                               max-w-[220px] truncate"
                    title={claim}
                  >
                    {claim}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'url' && (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Paste article or webpage URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full p-4 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
          </div>
        )}

        {activeTab === 'image' && (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Upload a screenshot or medical post</label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-teal-200 rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
                <Upload className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <p className="text-[#64748B] mb-2">Drop a screenshot or medical post here</p>
                <p className="text-xs text-[#64748B] mb-4">PNG, JPG or WEBP • OCR supported</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 btn-primary inline-block text-sm">Choose File</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Uploaded" className="max-h-64 rounded-xl mx-auto" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                >
                  <X size={20} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-teal-100">
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 btn-primary flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>Verify Claim <Send size={18} /></>
            )}
          </button>
          <button
            onClick={() => {
              setTextInput('')
              setUrlInput('')
              removeImage()
              setError('')
            }}
            className="px-6 py-3 bg-white border border-teal-200 rounded-xl font-medium text-[#64748B] hover:border-teal-500 hover:text-[#0F172A] transition-all"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-[#64748B] text-center mt-4">
          MedVerify is an educational claim-verification tool, not a diagnostic or treatment system.
        </p>
      </div>
    </div>
  )
}

export default Verify