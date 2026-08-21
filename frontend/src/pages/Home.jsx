import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8E8EF]/30 via-[#EAE5F7]/20 to-white/50 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#DDD6F3]/30 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#800020]" />
            <span className="text-xs font-medium text-[#77727F]">AI-Powered Medical Verification</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-[#292633]">Don't just believe it.</span>
            <br />
            <span className="gradient-title">MedVerify it.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#77727F] max-w-2xl mx-auto mb-10">
            AI-powered medical claim verification grounded in trusted medical evidence from PubMed, WHO, and ICMR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3.5 bg-gradient-to-r from-[#800020] to-[#E9B8C8] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#800020]/20 transition-all duration-300 flex items-center gap-2">
              Verify a Claim <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-3.5 bg-white border border-[#D8D8DE] rounded-xl font-medium text-[#292633] hover:border-[#800020] hover:shadow-md transition-all duration-300 flex items-center gap-2">
              Explore How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-[#D8D8DE]/30 bg-white/40 backdrop-blur-sm py-6">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs text-[#77727F] text-center mb-4">Evidence-backed verification from trusted sources</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#800020]" />
              <span className="text-sm font-medium text-[#292633]">PubMed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E9B8C8]" />
              <span className="text-sm font-medium text-[#292633]">WHO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#DDD6F3]" />
              <span className="text-sm font-medium text-[#292633]">ICMR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D8D8DE]" />
              <span className="text-sm font-medium text-[#292633]">Scientific Literature</span>
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
          <p className="text-[#77727F] text-center max-w-2xl mx-auto mb-12">
            Get evidence-based verification in four simple steps
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#DDD6F3]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4DDE5] to-[#DDD6F3] rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#800020] font-bold text-xl">01</span>
              </div>
              <h3 className="font-bold text-[#292633] mb-2">Submit</h3>
              <p className="text-sm text-[#77727F]">Enter a claim, URL or upload an image</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#DDD6F3]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4DDE5] to-[#DDD6F3] rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#800020] font-bold text-xl">02</span>
              </div>
              <h3 className="font-bold text-[#292633] mb-2">Extract</h3>
              <p className="text-sm text-[#77727F]">System identifies and processes the claim</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#DDD6F3]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4DDE5] to-[#DDD6F3] rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#800020] font-bold text-xl">03</span>
              </div>
              <h3 className="font-bold text-[#292633] mb-2">Verify</h3>
              <p className="text-sm text-[#77727F]">Evidence retrieved from trusted sources</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#DDD6F3]/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4DDE5] to-[#DDD6F3] rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#800020] font-bold text-xl">04</span>
              </div>
              <h3 className="font-bold text-[#292633] mb-2">Explain</h3>
              <p className="text-sm text-[#77727F]">Verdict with evidence and citations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 px-4 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-xl p-6 md:p-8">
            <h3 className="text-sm font-medium text-[#77727F] mb-2">Example Verification</h3>
            <p className="text-lg text-[#292633] mb-6">"Drinking lemon water can cure diabetes."</p>
            
            <div className="flex items-center gap-3 text-sm text-[#77727F] mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Claim received
              </div>
              <span className="text-[#D8D8DE]">→</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">◉</span> Evidence retrieved
              </div>
              <span className="text-[#D8D8DE]">→</span>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">◉</span> Sources analyzed
              </div>
              <span className="text-[#D8D8DE]">→</span>
              <div className="flex items-center gap-2">
                <span className="text-[#800020] font-medium">◆</span> Verdict generated
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#F8E8EF]/50 to-[#EAE5F7]/50 rounded-xl p-6 border border-[#DDD6F3]/30">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="bg-[#DDD6F3] text-[#292633] px-4 py-1.5 rounded-full text-sm font-bold">
                  MISLEADING
                </div>
                <p className="text-sm text-[#77727F]">Evidence does not support the claim as stated.</p>
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-[#D8D8DE]">PubMed</span>
                <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-[#D8D8DE]">WHO</span>
                <span className="text-xs bg-white/80 px-3 py-1 rounded-full border border-[#D8D8DE]">ICMR</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home