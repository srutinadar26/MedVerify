import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Link as LinkIcon, Image, Upload, X, Send } from 'lucide-react'
import { verifyTextClaim, verifyUrlClaim, verifyImageClaim } from '../services/api'

function Verify() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleVerify = async () => {
    // Check if there's any input
    const hasText = textInput.trim().length > 0
    const hasUrl = urlInput.trim().length > 0
    const hasImage = imageFile !== null

    if (!hasText && !hasUrl && !hasImage) {
      setError('Please enter a claim, URL, or upload an image.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      let result = null

      if (activeTab === 'text' && hasText) {
        result = await verifyTextClaim(textInput)
      } else if (activeTab === 'url' && hasUrl) {
        result = await verifyUrlClaim(urlInput)
      } else if (activeTab === 'image' && hasImage) {
        result = await verifyImageClaim(imageFile)
      } else {
        // Fallback - use text if available
        result = await verifyTextClaim(textInput || urlInput || 'Image uploaded')
      }

      // Navigate to results with the API response
      navigate('/results', { 
        state: { 
          apiResult: result 
        } 
      })
    } catch (err) {
      // Show error message
      setError(err.message || 'Something went wrong. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="gradient-title">What would you like to verify?</span>
        </h1>
        <p className="text-[#77727F]">
          Check a health claim against evidence from trusted medical sources.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D8D8DE]/30 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'text' 
              ? 'border-[#800020] text-[#800020]' 
              : 'border-transparent text-[#77727F] hover:text-[#292633]'
          }`}
        >
          <MessageSquare size={18} /> Text
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'url' 
              ? 'border-[#800020] text-[#800020]' 
              : 'border-transparent text-[#77727F] hover:text-[#292633]'
          }`}
        >
          <LinkIcon size={18} /> URL
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'image' 
              ? 'border-[#800020] text-[#800020]' 
              : 'border-transparent text-[#77727F] hover:text-[#292633]'
          }`}
        >
          <Image size={18} /> Image
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6 md:p-8">
        {activeTab === 'text' && (
          <div>
            <label className="block text-sm font-medium text-[#292633] mb-2">
              Enter a medical claim
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Example: Drinking warm water every morning prevents cancer."
              className="w-full h-40 p-4 border border-[#D8D8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9B8C8] focus:border-transparent resize-none transition-all"
            />
          </div>
        )}

        {activeTab === 'url' && (
          <div>
            <label className="block text-sm font-medium text-[#292633] mb-2">
              Paste article or webpage URL
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full p-4 border border-[#D8D8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9B8C8] focus:border-transparent transition-all"
            />
          </div>
        )}

        {activeTab === 'image' && (
          <div>
            <label className="block text-sm font-medium text-[#292633] mb-2">
              Upload a screenshot or medical post
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-[#D8D8DE] rounded-xl p-8 text-center hover:border-[#E9B8C8] transition-colors">
                <Upload className="w-12 h-12 text-[#77727F] mx-auto mb-4" />
                <p className="text-[#77727F] mb-2">Drop a screenshot or medical post here</p>
                <p className="text-xs text-[#77727F] mb-4">PNG, JPG or WEBP • OCR supported</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-gradient-to-r from-[#800020] to-[#E9B8C8] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
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

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-[#D8D8DE]/30">
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#800020] to-[#E9B8C8] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#800020]/20 transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Claim <Send size={18} />
              </>
            )}
          </button>
          <button
            onClick={() => {
              setTextInput('')
              setUrlInput('')
              removeImage()
              setError('')
            }}
            className="px-6 py-3 bg-white border border-[#D8D8DE] rounded-xl font-medium text-[#77727F] hover:border-[#800020] hover:text-[#292633] transition-all duration-300"
          >
            Clear
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-[#77727F] text-center mt-4">
          MedVerify is an educational claim-verification tool, not a diagnostic or treatment system.
        </p>
      </div>
    </div>
  )
}

export default Verify