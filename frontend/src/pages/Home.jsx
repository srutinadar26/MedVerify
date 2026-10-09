import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, ShieldCheck, Zap, Award, Users, Activity } from 'lucide-react'

function Home() {
  const navigate = useNavigate()

  const exampleClaims = [
    'Lemon water cures diabetes',
    'Vitamin C prevents colds',
    'Turmeric cures cancer',
    '5G causes COVID-19',
  ]

  const handleExampleClick = (claim) => {
    navigate('/verify', { state: { prefillText: claim } })
  }

  // ---- Recently Verified ticker (mock, animated) ----
  const recentPool = [
    { claim: 'Vitamin C prevents colds', verdict: 'MISLEADING' },
    { claim: 'Exercise reduces heart disease risk', verdict: 'TRUE' },
    { claim: 'Green tea burns fat instantly', verdict: 'FALSE' },
    { claim: 'Turmeric cures cancer', verdict: 'MISLEADING' },
    { claim: '8 glasses of water daily is mandatory', verdict: 'FALSE' },
    { claim: 'Mediterranean diet improves heart health', verdict: 'TRUE' },
    { claim: 'Lemon water cures diabetes', verdict: 'MISLEADING' },
    { claim: 'Garlic prevents cancer', verdict: 'MISLEADING' },
  ]

  const [ticker, setTicker] = useState(recentPool.slice(0, 3))
  const [tickIndex, setTickIndex] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => {
        const next = recentPool[tickIndex % recentPool.length]
        setTickIndex((i) => i + 1)
        return [next, ...prev].slice(0, 3)
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [tickIndex])

  const verdictDot = (verdict) => {
    if (verdict === 'TRUE') return 'bg-teal-500'
    if (verdict === 'FALSE') return 'bg-red-500'
    return 'bg-amber-500'
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-white/60 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/80 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass border border-teal-200/60 dark:border-slate-800 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 tracking-wide uppercase">
              AI-Powered Medical Verification
            </span>
            <span className="ml-1 text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full">
              BETA
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6">
            <span className="text-[#0F172A] dark:text-white">Don't just believe it.</span>
            <br />
            <span className="gradient-title">MedVerify it.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#64748B] dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered medical claim verification grounded in trusted medical evidence from PubMed, WHO, and ICMR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              to="/verify"
              className="px-8 py-3.5 btn-primary flex items-center justify-center gap-2 text-base"
            >
              Verify a Claim <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/about"
              className="px-8 py-3.5 bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-800 rounded-xl font-medium text-[#0F172A] dark:text-slate-200 hover:border-teal-500 hover:shadow-soft transition-all flex items-center justify-center gap-2 text-base"
            >
              Explore How It Works
            </Link>
          </div>

          {/* Example claims */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
              Try one of these
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {exampleClaims.map((claim) => (
                <button
                  key={claim}
                  onClick={() => handleExampleClick(claim)}
                  className="text-xs sm:text-sm px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
                             text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700
                             hover:bg-teal-50 dark:hover:bg-slate-800 hover:border-teal-400 hover:shadow-soft
                             transition-all duration-200"
                >
                  "{claim}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Live "Recently Verified" Ticker */}
      <section className="border-y border-teal-100/60 dark:border-slate-800 glass py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
              Recently verified
            </p>
            <span className="flex items-center gap-1 ml-auto text-[10px] text-teal-600 dark:text-teal-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="space-y-2">
            {ticker.map((item, i) => (
              <div
                key={`${item.claim}-${i}`}
                className="flex items-center gap-3 text-sm animate-fade-in"
                style={{ opacity: 1 - i * 0.25 }}
              >
                <span className={`w-2 h-2 rounded-full ${verdictDot(item.verdict)} flex-shrink-0`} />
                <span className="text-[#0F172A] dark:text-slate-200 truncate flex-1">"{item.claim}"</span>
                <span className={`text-xs font-semibold flex-shrink-0 ${
                  item.verdict === 'TRUE' ? 'text-teal-600 dark:text-teal-400'
                  : item.verdict === 'FALSE' ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {item.verdict}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="border-b border-teal-100/60 dark:border-slate-800 glass py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />, value: '50K+', label: 'Claims Verified' },
              { icon: <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />, value: '98%', label: 'Accuracy' },
              { icon: <Zap className="w-6 h-6 text-teal-600 dark:text-teal-400" />, value: '2.1s', label: 'Avg Response' },
              { icon: <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />, value: '10K+', label: 'Active Users' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className="text-2xl md:text-3xl font-extrabold gradient-title">{s.value}</p>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-b border-teal-100/60 dark:border-slate-800 glass py-6">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs text-[#64748B] dark:text-slate-400 text-center mb-4 uppercase tracking-wide font-semibold">
            Evidence-backed verification from trusted sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-600" />
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">PubMed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">WHO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">ICMR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-300" />
              <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">Scientific Literature</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="gradient-title">How It Works</span>
          </h2>
          <p className="text-[#64748B] dark:text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Get evidence-based verification in four simple steps
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Submit', d: 'Enter a claim, URL or upload an image' },
              { n: '02', t: 'Extract', d: 'System identifies and processes the claim' },
              { n: '03', t: 'Verify', d: 'Evidence retrieved from trusted sources' },
              { n: '04', t: 'Explain', d: 'Verdict with evidence and citations' },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-teal-100 dark:border-slate-800 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-slate-800 dark:to-teal-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-teal-700 dark:text-teal-300 font-bold text-xl">{s.n}</span>
                </div>
                <h3 className="font-bold text-[#0F172A] dark:text-slate-100 mb-2">{s.t}</h3>
                <p className="text-sm text-[#64748B] dark:text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="py-16 px-4 glass">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xl p-6 md:p-8">
            <h3 className="text-sm font-medium text-[#64748B] dark:text-slate-400 mb-2">Example Verification</h3>
            <p className="text-lg text-[#0F172A] dark:text-slate-100 mb-6 font-semibold">"Drinking lemon water can cure diabetes."</p>

            <div className="flex items-center gap-3 text-sm text-[#64748B] dark:text-slate-400 mb-6 flex-wrap">
              <div className="flex items-center gap-2"><span className="text-teal-500">✓</span> Claim received</div>
              <span className="text-teal-200 dark:text-slate-600">→</span>
              <div className="flex items-center gap-2"><span className="text-teal-600">◉</span> Evidence retrieved</div>
              <span className="text-teal-200 dark:text-slate-600">→</span>
              <div className="flex items-center gap-2"><span className="text-cyan-500">◉</span> Sources analyzed</div>
              <span className="text-teal-200 dark:text-slate-600">→</span>
              <div className="flex items-center gap-2"><span className="text-teal-700 dark:text-teal-400 font-medium">◆</span> Verdict generated</div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-800/80 dark:to-slate-800/50 rounded-xl p-6 border border-teal-100 dark:border-slate-700">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 px-4 py-1.5 rounded-full text-sm font-bold">
                  MISLEADING
                </div>
                <p className="text-sm text-[#64748B] dark:text-slate-300">Evidence does not support the claim as stated.</p>
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                {['PubMed', 'WHO', 'ICMR'].map((s) => (
                  <span key={s} className="text-xs bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-teal-100 dark:border-slate-700 text-teal-700 dark:text-teal-300 font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-teal-600 to-cyan-400 rounded-3xl p-10 md:p-14 shadow-glow">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to verify a claim?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Get an evidence-based verdict in seconds — free, no signup needed.
          </p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Start Verifying <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home