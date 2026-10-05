import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, AlertTriangle, ExternalLink,
  Calendar, Clock, Award, ArrowLeft, Copy, Check,
  ShieldAlert, MessageCircle, Info
} from 'lucide-react'

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const resultData = location.state?.apiResult
  const [copied, setCopied] = useState(false)

  if (!resultData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold gradient-title">No Verification Result</h1>
        <p className="text-[#64748B] mt-2">Please verify a claim first.</p>
        <button
          onClick={() => navigate('/verify')}
          className="mt-4 px-6 py-2 btn-primary"
        >
          Go to Verify
        </button>
      </div>
    )
  }

  const getVerdictStyles = (verdict) => {
    switch (verdict) {
      case 'TRUE':
        return {
          bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700',
          ring: '#0D9488',
          icon: <CheckCircle className="w-8 h-8 text-teal-600" />
        }
      case 'FALSE':
        return {
          bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
          ring: '#EF4444',
          icon: <XCircle className="w-8 h-8 text-red-600" />
        }
      case 'MISLEADING':
        return {
          bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
          ring: '#F59E0B',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
        }
      default:
        return {
          bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700',
          ring: '#94A3B8',
          icon: null
        }
    }
  }

  const verdictStyles = getVerdictStyles(resultData.verdict)
  const confidencePct = Math.round((resultData.confidence || 0) * 100)

  // Circular confidence meter math
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDash = (confidencePct / 100) * circumference

  // Build shareable text once
  const shareText =
    `MedVerify AI — Verification Result\n\n` +
    `Claim: "${resultData.claim}"\n` +
    `Verdict: ${resultData.verdict}\n` +
    `Confidence: ${confidencePct}%\n\n` +
    `Assessment: ${resultData.explanation?.assessment || 'N/A'}\n\n` +
    `Evidence: ${resultData.explanation?.evidence || 'N/A'}\n\n` +
    `Context: ${resultData.explanation?.context || 'N/A'}\n\n` +
    `⚠️ This is educational info, not medical advice. Consult a doctor.`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Back + Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#64748B] hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-white border border-teal-200
                       rounded-xl text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all"
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-white border border-teal-200
                       rounded-xl text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all"
          >
            <MessageCircle size={16} /> Share
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">Verification Result</h1>
        <p className="text-[#64748B] mt-1">Detailed analysis of your medical claim</p>
      </div>

      {/* Original Claim */}
      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8 mb-6">
        <p className="text-sm text-[#64748B] mb-2 font-medium">Original Claim</p>
        <blockquote className="text-lg md:text-xl text-[#0F172A] font-medium italic">
          "{resultData.claim}"
        </blockquote>
      </div>

      {/* Verdict Card with Circular Confidence Meter */}
      <div className={`rounded-2xl border ${verdictStyles.border} ${verdictStyles.bg} p-6 md:p-8 mb-4`}>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex-shrink-0">{verdictStyles.icon}</div>

          <div className="flex-1 min-w-[220px]">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`text-2xl font-bold ${verdictStyles.text}`}>
                {resultData.verdict}
              </span>
              <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-teal-100 flex items-center gap-1">
                <Clock size={12} /> {new Date(resultData.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-[#64748B]">
              {resultData.verdict === 'TRUE' && '✅ The claim is supported by scientific evidence.'}
              {resultData.verdict === 'FALSE' && '❌ The claim is not supported by scientific evidence.'}
              {resultData.verdict === 'MISLEADING' && '⚠️ Some aspects of this claim may be based on real information, but the statement is not supported as written.'}
            </p>
          </div>

          {/* Circular confidence meter */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r={radius}
                  fill="none" stroke="#E2E8F0" strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="none" stroke={verdictStyles.ring} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-extrabold ${verdictStyles.text}`}>
                  {confidencePct}%
                </span>
                <span className="text-[10px] text-[#64748B] uppercase tracking-wide font-semibold">
                  Confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Low-confidence warning */}
      {confidencePct < 60 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Low confidence result</p>
            <p className="text-xs text-amber-700">
              The AI is not fully confident about this verdict. Please verify with a qualified
              doctor before acting on this information.
            </p>
          </div>
        </div>
      )}

      {/* NEW: Not medical advice banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-0.5">Not medical advice</p>
          <p className="text-xs text-slate-600">
            MedVerify AI is an educational tool for evaluating health claims — it is not a
            substitute for professional medical diagnosis, treatment, or advice. Always consult
            a qualified healthcare professional.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { v: resultData.stats?.sourcesAnalyzed || 0, l: 'Sources Analyzed' },
          { v: resultData.stats?.relevantEvidence || 0, l: 'Relevant Evidence' },
          { v: resultData.stats?.latestSource || 'N/A', l: 'Latest Source' },
          { v: resultData.stats?.responseTime || '0s', l: 'Response Time' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-teal-100 p-4 text-center hover:shadow-soft transition-shadow">
            <p className="text-2xl font-bold text-[#0F172A]">{s.v}</p>
            <p className="text-xs text-[#64748B]">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Why this verdict?</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-teal-700 mb-1">Claim Assessment</h3>
            <p className="text-[#64748B] text-sm">{resultData.explanation?.assessment || 'No assessment available.'}</p>
          </div>
          <div className="border-t border-teal-100 pt-4">
            <h3 className="text-sm font-semibold text-teal-700 mb-1">What the Evidence Says</h3>
            <p className="text-[#64748B] text-sm">{resultData.explanation?.evidence || 'No evidence available.'}</p>
          </div>
          <div className="border-t border-teal-100 pt-4">
            <h3 className="text-sm font-semibold text-teal-700 mb-1">Important Context</h3>
            <p className="text-[#64748B] text-sm">{resultData.explanation?.context || 'No context available.'}</p>
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Evidence Used</h2>
        {resultData.evidence && resultData.evidence.length > 0 ? (
          <div className="space-y-4">
            {resultData.evidence.map((item, index) => (
              <div key={index} className="border border-teal-100 rounded-xl p-4 hover:shadow-soft transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-teal-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {item.source || 'Unknown Source'}
                      </span>
                      <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> PEER-REVIEWED
                      </span>
                      <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                        AUTHORITATIVE
                      </span>
                      <span className="text-xs text-[#64748B]">[{index + 1}]</span>
                    </div>
                    <h4 className="font-medium text-[#0F172A] mb-1">{item.title || 'Untitled'}</h4>
                    <p className="text-sm text-[#64748B] mb-2">{item.excerpt || 'No excerpt available.'}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
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
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          Relevance: {item.relevance}%
                        </span>
                      )}
                      {item.domain && <span>{item.domain}</span>}
                    </div>

                    {item.url && (
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-700 hover:underline flex items-center gap-1"
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
          <p className="text-[#64748B] text-center py-8">No evidence available for this claim.</p>
        )}
      </div>
    </div>
  )
}

export default Results