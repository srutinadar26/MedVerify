import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, AlertTriangle, ExternalLink,
  Calendar, Clock, Award, ArrowLeft, Copy, Check,
  ShieldAlert, MessageCircle, Info, Cpu, Sparkles, ShieldCheck, AlertCircle
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

  // Normalise verdict: backend returns SUPPORTED/REFUTED/MIXED/UNCERTAIN
  // Legacy UI may also pass TRUE/FALSE/MISLEADING
  const normaliseVerdict = (v) => {
    if (!v) return 'UNCERTAIN'
    switch (v.toUpperCase()) {
      case 'SUPPORTED': case 'TRUE':      return 'SUPPORTED'
      case 'REFUTED':   case 'FALSE':     return 'REFUTED'
      case 'MIXED':                       return 'MIXED'
      case 'UNCERTAIN': case 'MISLEADING': return 'UNCERTAIN'
      default: return 'UNCERTAIN'
    }
  }

  const getVerdictStyles = (rawVerdict) => {
    const verdict = normaliseVerdict(rawVerdict)
    switch (verdict) {
      case 'SUPPORTED':
        return {
          bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300',
          ring: '#0D9488',
          label: 'SUPPORTED',
          icon: <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />,
          desc: '✅ This claim is supported by scientific evidence.',
        }
      case 'REFUTED':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300',
          ring: '#EF4444',
          label: 'REFUTED',
          icon: <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />,
          desc: '❌ This claim is not supported by scientific evidence.',
        }
      case 'MIXED':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300',
          ring: '#F97316',
          label: 'MIXED EVIDENCE',
          icon: <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
          desc: '⚡ Scientific literature shows conflicting or context-dependent results, or in-vitro correlation without proven clinical efficacy.',
        }
      default:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300',
          ring: '#F59E0B',
          label: 'UNCERTAIN',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
          desc: '⚠️ Evidence on this claim is conflicting or insufficient for a definitive verdict.',
        }
    }
  }

  const displayVerdict = normaliseVerdict(resultData.verdict)
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

      {/* Original Claim & Extracted Assertion */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-semibold">
            {resultData.original_input ? 'Original User Input' : 'Analyzed Medical Claim'}
          </p>
          {resultData.claim_type && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              {resultData.claim_type}
            </span>
          )}
        </div>
        <blockquote className="text-sm md:text-base text-[#0F172A] dark:text-slate-200 font-medium italic leading-relaxed break-words">
          &ldquo;{resultData.original_input || resultData.claim}&rdquo;
        </blockquote>

        {/* If original_input differs from extracted claim, show primary extracted claim */}
        {resultData.original_input && resultData.original_input !== resultData.claim && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
              Primary Extracted Empirical Assertion:
            </p>
            <p className="text-sm text-[#0F172A] dark:text-slate-200 font-medium">
              &ldquo;{resultData.claim}&rdquo;
            </p>
          </div>
        )}

        {/* Required Evidence needed for verification */}
        {resultData.needed_evidence && (
          <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-teal-700 dark:text-teal-400">Required Scientific Evidence: </span>
            <span>{resultData.needed_evidence}</span>
          </div>
        )}

        {/* Article title for URL mode */}
        {resultData.extracted_article_title && (
          <p className="mt-2 text-xs text-[#64748B] dark:text-slate-400">
            <span className="font-semibold">Source article:</span>{' '}
            <span className="italic">{resultData.extracted_article_title}</span>
          </p>
        )}

        {/* OCR extracted text for image mode */}
        {resultData.input_type === 'image' && resultData.extracted_text && (
          <details className="mt-3">
            <summary className="text-xs font-medium text-teal-600 dark:text-teal-400 cursor-pointer hover:underline">
              Show OCR-extracted text ({resultData.ocr_word_count || '?'} words)
            </summary>
            <pre className="mt-2 text-xs text-[#64748B] dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 rounded-lg p-3 max-h-48 overflow-auto">
              {resultData.extracted_text}
            </pre>
          </details>
        )}
      </div>

      {/* Multiple Sub-claims Section (when compound input contained multiple distinct claims) */}
      {resultData.extracted_claims && resultData.extracted_claims.length > 1 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-5 mb-6">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-slate-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Individually Analyzed Sub-Claims ({resultData.extracted_claims.length})
          </h3>
          <div className="space-y-3">
            {resultData.extracted_claims.map((sub, idx) => {
              const subStyles = getVerdictStyles(sub.verdict)
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-200">
                      Claim {idx + 1}: &ldquo;{sub.claim}&rdquo;
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subStyles.bg} ${subStyles.text} border ${subStyles.border} flex-shrink-0`}>
                      {sub.verdict} ({Math.round((sub.confidence || 0) * 100)}%)
                    </span>
                  </div>
                  {sub.summary && (
                    <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1">
                      {sub.summary}
                    </p>
                  )}
                  {sub.needed_evidence && (
                    <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 italic">
                      Needed: {sub.needed_evidence}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Verdict Card with Circular Confidence Meter */}
      <div className={`rounded-2xl border ${verdictStyles.border} ${verdictStyles.bg} p-6 md:p-8 mb-4`}>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex-shrink-0">{verdictStyles.icon}</div>

          <div className="flex-1 min-w-[220px]">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`text-2xl font-bold ${verdictStyles.text}`}>
                {verdictStyles.label}
              </span>
              <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-teal-100 flex items-center gap-1">
                <Clock size={12} />
                {resultData.timestamp
                  ? new Date(resultData.timestamp).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
            <p className="text-[#64748B]">{verdictStyles.desc}</p>
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

      {/* Low-confidence warning */}
      {confidencePct < 60 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Low confidence result</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              The AI is not fully confident about this verdict. Please verify with a qualified
              doctor before acting on this information.
            </p>
          </div>
        </div>
      )}

      {/* Educational disclaimer banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">Educational Health Disclaimer</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            MedVerify AI is an educational decision-support tool that cross-checks public claims against indexed scientific literature.
            It does not provide personal medical diagnosis, treatment protocols, or clinical consultations. Always consult a licensed healthcare professional for medical decisions.
          </p>
        </div>
      </div>

      {/* Verification Pipeline: ML Classifier vs. LLM Evidence Analysis */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#0F172A] dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Verification Pipeline & Model Breakdown
          </h2>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
            resultData.pipeline_mode === 'llm_assisted' || resultData.llm_analysis?.available
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
          }`}>
            <Sparkles size={12} />
            {resultData.pipeline_mode === 'llm_assisted' || resultData.llm_analysis?.available
              ? 'LLM-Assisted Pipeline'
              : 'Deterministic Evidence-Only Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Component 1: ML Classifier */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Cpu size={14} className="text-teal-600" /> ML Text Classifier
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {resultData.classifier?.model || 'DistilBERT / TF-IDF'}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Statistical Prediction:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (resultData.classifier?.label || '').toUpperCase() === 'TRUE'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                      : (resultData.classifier?.label || '').toUpperCase() === 'FALSE'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {resultData.classifier?.label || 'UNSPECIFIED'}
                  </span>
                </div>
                <span className="text-base font-extrabold text-[#0F172A] dark:text-slate-100">
                  {resultData.classifier
                    ? `${Math.round(Math.max(resultData.classifier.true_probability || 0, resultData.classifier.false_probability || 0) * 100)}%`
                    : 'N/A'}
                </span>
              </div>

              {/* ML Probability Bar */}
              {resultData.classifier && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(Math.max(resultData.classifier.true_probability || 0, resultData.classifier.false_probability || 0) * 100)}%`
                    }}
                  />
                </div>
              )}

              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">
                Evaluates claim syntax and phrasing patterns learned from medical misinformation datasets. Maintained as a separate statistical signal.
              </p>
            </div>
            {resultData.classifier && (
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
                <span>True prob: {Math.round((resultData.classifier.true_probability || 0) * 100)}%</span>
                <span>False prob: {Math.round((resultData.classifier.false_probability || 0) * 100)}%</span>
              </div>
            )}
          </div>

          {/* Component 2: Evidence Grounding & LLM Analysis */}
          <div className="border border-teal-200 dark:border-teal-900 rounded-xl p-4 bg-teal-50/40 dark:bg-teal-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                  {resultData.llm_analysis?.available ? 'LLM Evidence Analysis' : 'RAG Evidence Engine'}
                </span>
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300">
                  {resultData.llm_analysis?.available
                    ? `${resultData.llm_analysis.provider.toUpperCase()} (${resultData.llm_analysis.model})`
                    : 'FAISS + DeBERTa NLI'}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Evidence Verdict:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${verdictStyles.bg} ${verdictStyles.text} border ${verdictStyles.border}`}>
                    {resultData.verdict}
                  </span>
                </div>
                <span className="text-base font-extrabold text-[#0F172A] dark:text-slate-100">
                  {confidencePct}%
                </span>
              </div>

              {/* Evidence Confidence Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>

              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">
                {resultData.llm_analysis?.available
                  ? 'Grounded strictly in peer-reviewed passages retrieved from WHO, ICMR, and PubMed. Cannot fabricate sources or outside facts.'
                  : 'Synthesized via semantic vector retrieval and bidirectional cross-encoder NLI without external LLM API.'}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-teal-200/60 dark:border-teal-900/60 flex items-center justify-between text-[11px] text-teal-800 dark:text-teal-300">
              <span>Grounding: Strict Evidence Only</span>
              {resultData.llm_analysis?.latency_ms ? (
                <span>LLM latency: {resultData.llm_analysis.latency_ms}ms</span>
              ) : (
                <span>Deterministic Fallback</span>
              )}
            </div>
          </div>
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
          <div key={i} className="bg-white dark:bg-slate-800/90 rounded-xl border border-teal-100 dark:border-slate-700 p-4 text-center hover:shadow-soft transition-shadow">
            <p className="text-2xl font-bold text-[#0F172A] dark:text-slate-100">{s.v}</p>
            <p className="text-xs text-[#64748B] dark:text-slate-400">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-slate-100 mb-4">Why this verdict?</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">Claim Assessment</h3>
            <p className="text-[#64748B] dark:text-slate-300 text-sm">{resultData.explanation?.assessment || 'No assessment available.'}</p>
          </div>
          <div className="border-t border-teal-100 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">What the Evidence Says</h3>
            <p className="text-[#64748B] dark:text-slate-300 text-sm">{resultData.explanation?.evidence || 'No evidence available.'}</p>
          </div>
          <div className="border-t border-teal-100 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">Important Context</h3>
            <p className="text-[#64748B] dark:text-slate-300 text-sm">{resultData.explanation?.context || 'No context available.'}</p>
          </div>
        </div>
      </div>

      {/* Limitations and Evidence Boundaries */}
      {resultData.limitations && resultData.limitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Limitations & Scope of Evidence
          </h2>
          <ul className="space-y-2">
            {resultData.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-[#64748B] dark:text-slate-300">
                <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence — split into SUPPORTS / CONTRADICTS / NEUTRAL */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-slate-100 mb-4">Evidence Used</h2>
        {resultData.evidence && resultData.evidence.length > 0 ? (
          <div className="space-y-6">
            {/* Supporting */}
            {(resultData.supporting_evidence || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-2">
                  <CheckCircle size={14} /> Supporting Evidence ({resultData.supporting_evidence.length})
                </h3>
                <div className="space-y-3">
                  {resultData.supporting_evidence.map((item, idx) => (
                    <EvidenceCard key={`s-${idx}`} item={item} index={idx} />
                  ))}
                </div>
              </div>
            )}
            {/* Contradicting */}
            {(resultData.contradicting_evidence || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <XCircle size={14} /> Contradicting Evidence ({resultData.contradicting_evidence.length})
                </h3>
                <div className="space-y-3">
                  {resultData.contradicting_evidence.map((item, idx) => (
                    <EvidenceCard key={`c-${idx}`} item={item} index={idx} />
                  ))}
                </div>
              </div>
            )}
            {/* Neutral / unclassified */}
            {(() => {
              const neutral = resultData.evidence.filter(e => !['SUPPORTS','CONTRADICTS'].includes(e.relationship))
              return neutral.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> Related Evidence ({neutral.length})
                  </h3>
                  <div className="space-y-3">
                    {neutral.map((item, idx) => (
                      <EvidenceCard key={`n-${idx}`} item={item} index={idx} />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <p className="text-[#64748B] text-center py-8">No evidence available for this claim.</p>
        )}

        {/* Additional claims from image multi-claim */}
        {resultData.input_type === 'image' && resultData.additional_claims && resultData.additional_claims.length > 0 && (
          <div className="mt-8 border-t border-teal-100 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-200 mb-3">Other Claims Found in Image</h3>
            <div className="space-y-2">
              {resultData.additional_claims.map((extra, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    extra.verdict === 'SUPPORTED' ? 'bg-teal-100 text-teal-800'
                    : extra.verdict === 'REFUTED' ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                  }`}>{extra.verdict}</span>
                  <p className="text-sm text-[#0F172A] dark:text-slate-200 italic flex-1">&ldquo;{extra.claim}&rdquo;</p>
                  <span className="text-xs text-[#64748B]">{Math.round((extra.confidence || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Evidence Card Sub-component ─────────────────────────────────────────────

function EvidenceCard({ item, index }) {
  return (
    <div className="border border-teal-100 dark:border-slate-700 dark:bg-slate-800/60 rounded-xl p-4 hover:shadow-soft transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/60 dark:to-cyan-900/60 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-teal-700 dark:text-teal-300" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
              {item.source || 'Unknown Source'}
            </span>
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 ${
              item.source_provenance === 'external_live' ? 'bg-blue-600' : 'bg-teal-700'
            }`}>
              <ShieldCheck size={10} />
              {item.source_provenance === 'external_live' ? 'LIVE PUBMED' : 'LOCAL INDEXED CORPUS'}
            </span>
            {item.relationship && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                item.relationship === 'SUPPORTS'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
                  : item.relationship === 'CONTRADICTS'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                  : item.relationship === 'PARTIALLY_SUPPORTS' || item.relationship === 'MIXED'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {item.relationship}
              </span>
            )}
            <span className="text-xs text-[#64748B] dark:text-slate-400">[{index + 1}]</span>
          </div>
          <h4 className="font-medium text-[#0F172A] dark:text-slate-200 mb-1">{item.title || 'Untitled'}</h4>
          <p className="text-sm text-[#64748B] dark:text-slate-300 mb-2">{item.excerpt || 'No excerpt available.'}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
            {item.publication_date ? (
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Published: {item.publication_date}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Calendar size={14} /> Clinical Reference Guideline
              </span>
            )}
            {item.relevance && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Retrieval match: {item.relevance}%
              </span>
            )}
            {item.domain && <span>{item.domain}</span>}
            {item.chunk_id && (
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                ID: {item.chunk_id}
              </span>
            )}
          </div>
          {item.url && (
            <div className="mt-3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                View Source Document <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Results