import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Award,
  ArrowLeft
} from 'lucide-react'

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Get the API result from navigation state
  const resultData = location.state?.apiResult

  // If no result data, show a message
  if (!resultData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold gradient-title">No Verification Result</h1>
        <p className="text-[#77727F] mt-2">Please verify a claim first.</p>
        <button 
          onClick={() => navigate('/verify')}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-[#800020] to-[#E9B8C8] text-white rounded-xl hover:shadow-lg transition-all"
        >
          Go to Verify
        </button>
      </div>
    )
  }

  const getVerdictStyles = (verdict) => {
    switch(verdict) {
      case 'TRUE':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />
        }
      case 'FALSE':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <XCircle className="w-8 h-8 text-red-600" />
        }
      case 'MISLEADING':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: null
        }
    }
  }

  const verdictStyles = getVerdictStyles(resultData.verdict)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#77727F] hover:text-[#800020] transition-colors mb-6"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">Verification Result</h1>
        <p className="text-[#77727F] mt-1">Detailed analysis of your medical claim</p>
      </div>

      {/* Original Claim */}
      <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6 md:p-8 mb-6">
        <p className="text-sm text-[#77727F] mb-2 font-medium">Original Claim</p>
        <blockquote className="text-lg md:text-xl text-[#292633] font-medium italic">
          "{resultData.claim}"
        </blockquote>
      </div>

      {/* Verdict Card */}
      <div className={`rounded-2xl border ${verdictStyles.border} ${verdictStyles.bg} p-6 md:p-8 mb-6`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {verdictStyles.icon}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <span className={`text-2xl font-bold ${verdictStyles.text}`}>
                {resultData.verdict}
              </span>
              <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-[#D8D8DE]">
                Confidence: {(resultData.confidence * 100).toFixed(0)}%
              </span>
              <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-[#D8D8DE] flex items-center gap-1">
                <Clock size={12} /> {new Date(resultData.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-[#77727F]">
              {resultData.verdict === 'TRUE' && "✅ The claim is supported by scientific evidence."}
              {resultData.verdict === 'FALSE' && "❌ The claim is not supported by scientific evidence."}
              {resultData.verdict === 'MISLEADING' && "⚠️ Some aspects of this claim may be based on real information, but the statement is not supported as written."}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#DDD6F3]/30 p-4 text-center">
          <p className="text-2xl font-bold text-[#292633]">{resultData.stats?.sourcesAnalyzed || 0}</p>
          <p className="text-xs text-[#77727F]">Sources Analyzed</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDD6F3]/30 p-4 text-center">
          <p className="text-2xl font-bold text-[#292633]">{resultData.stats?.relevantEvidence || 0}</p>
          <p className="text-xs text-[#77727F]">Relevant Evidence</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDD6F3]/30 p-4 text-center">
          <p className="text-2xl font-bold text-[#292633]">{resultData.stats?.latestSource || 'N/A'}</p>
          <p className="text-xs text-[#77727F]">Latest Source</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DDD6F3]/30 p-4 text-center">
          <p className="text-2xl font-bold text-[#292633]">{resultData.stats?.responseTime || '0s'}</p>
          <p className="text-xs text-[#77727F]">Response Time</p>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#292633] mb-4">Why this verdict?</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#800020] mb-1">Claim Assessment</h3>
            <p className="text-[#77727F] text-sm">{resultData.explanation?.assessment || 'No assessment available.'}</p>
          </div>
          <div className="border-t border-[#D8D8DE]/30 pt-4">
            <h3 className="text-sm font-semibold text-[#800020] mb-1">What the Evidence Says</h3>
            <p className="text-[#77727F] text-sm">{resultData.explanation?.evidence || 'No evidence available.'}</p>
          </div>
          <div className="border-t border-[#D8D8DE]/30 pt-4">
            <h3 className="text-sm font-semibold text-[#800020] mb-1">Important Context</h3>
            <p className="text-[#77727F] text-sm">{resultData.explanation?.context || 'No context available.'}</p>
          </div>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-[#292633] mb-4">Evidence Used</h2>
        
        {resultData.evidence && resultData.evidence.length > 0 ? (
          <div className="space-y-4">
            {resultData.evidence.map((item, index) => (
              <div key={index} className="border border-[#DDD6F3]/30 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F4DDE5] to-[#DDD6F3] rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-[#800020]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#292633]">{item.source || 'Unknown Source'}</span>
                      <span className="text-xs bg-[#F4DDE5] px-2 py-0.5 rounded-full text-[#800020]">Authoritative source</span>
                      <span className="text-xs text-[#77727F]">[{index + 1}]</span>
                    </div>
                    <h4 className="font-medium text-[#292633] mb-1">{item.title || 'Untitled'}</h4>
                    <p className="text-sm text-[#77727F] mb-2">{item.excerpt || 'No excerpt available.'}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#77727F]">
                      {item.publication_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> Published: {new Date(item.publication_date).toLocaleDateString()}
                        </span>
                      )}
                      {item.last_updated && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> Updated: {new Date(item.last_updated).toLocaleDateString()}
                        </span>
                      )}
                      {item.relevance && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Relevance: {item.relevance}%
                        </span>
                      )}
                      {item.domain && (
                        <span className="text-[#77727F]">{item.domain}</span>
                      )}
                    </div>
                    
                    {item.url && (
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#800020] hover:underline flex items-center gap-1"
                        >
                          View Source <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#77727F] text-center py-8">No evidence available for this claim.</p>
        )}
      </div>
    </div>
  )
}

export default Results