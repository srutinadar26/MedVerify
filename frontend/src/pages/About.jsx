import React, { useState } from 'react'
import {
  Shield, Brain, FileSearch, Database, Network, CheckCircle,
  ArrowRight, Sparkles, BookOpen, RefreshCw, Zap
} from 'lucide-react'

function About() {
  const [activeStep, setActiveStep] = useState(null)

  const pipelineSteps = [
    { id: 1, icon: <FileSearch className="w-6 h-6" />, title: 'User Input', description: 'Submit a claim as text, URL, or image', color: 'from-teal-100 to-cyan-100' },
    { id: 2, icon: <Brain className="w-6 h-6" />, title: 'Preprocessing', description: 'Clean and extract the core medical claim', color: 'from-cyan-100 to-teal-100' },
    { id: 3, icon: <Database className="w-6 h-6" />, title: 'Evidence Retrieval', description: 'Search trusted medical databases', color: 'from-teal-100 to-cyan-100' },
    { id: 4, icon: <Network className="w-6 h-6" />, title: 'RAG Processing', description: 'Retrieve and generate with AI', color: 'from-cyan-100 to-teal-100' },
    { id: 5, icon: <Shield className="w-6 h-6" />, title: 'Verification', description: 'Analyze evidence and generate verdict', color: 'from-teal-100 to-cyan-100' },
    { id: 6, icon: <CheckCircle className="w-6 h-6" />, title: 'Result', description: 'Verdict + Explanation + Citations', color: 'from-teal-600 to-cyan-400' },
  ]

  const knowledgeBaseSteps = [
    { icon: <BookOpen className="w-5 h-5" />, title: 'Approved Sources', description: 'PubMed, WHO, ICMR' },
    { icon: <RefreshCw className="w-5 h-5" />, title: 'Scheduled Update', description: 'Regular content refresh' },
    { icon: <Zap className="w-5 h-5" />, title: 'Change Detection', description: 'Track new publications' },
    { icon: <Database className="w-5 h-5" />, title: 'Chunking', description: 'Split content into pieces' },
    { icon: <Brain className="w-5 h-5" />, title: 'Embeddings', description: 'Convert to vectors' },
    { icon: <Network className="w-5 h-5" />, title: 'Vector Database', description: 'Store for retrieval' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 glass border border-teal-200/60 rounded-full px-4 py-1.5 mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">How MedVerify AI Works</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold gradient-title">About MedVerify AI</h1>
        <p className="text-[#64748B] mt-3 max-w-2xl mx-auto">
          AI-powered medical claim verification grounded in trusted medical evidence
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-3">What is MedVerify AI?</h2>
        <p className="text-[#64748B] leading-relaxed">
          MedVerify AI is an intelligent medical misinformation verification platform that helps users
          distinguish between accurate health information and misleading claims. By combining
          <span className="text-teal-700 font-medium"> Retrieval-Augmented Generation (RAG)</span> with
          trusted medical sources like <span className="font-medium">PubMed</span>,
          <span className="font-medium"> WHO</span>, and <span className="font-medium">ICMR</span>,
          we provide evidence-backed verdicts with clear explanations and citations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-6">How the AI Works</h2>
        <div className="relative">
          <div className="hidden md:flex items-center justify-between relative">
            <div className="absolute left-[8%] right-[8%] top-1/2 h-0.5 bg-gradient-to-r from-teal-600 via-cyan-400 to-teal-200 -translate-y-1/2" />
            {pipelineSteps.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10 cursor-pointer"
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-teal-700 shadow-md hover:shadow-glow transition-all duration-300 ${
                  activeStep === step.id ? 'scale-110 shadow-glow' : ''
                }`}>
                  {step.icon}
                </div>
                <p className="text-xs font-medium text-[#0F172A] mt-2 text-center">{step.title}</p>
                {activeStep === step.id && (
                  <div className="absolute top-20 bg-white border border-teal-100 rounded-lg p-3 shadow-lg w-48 text-center z-20">
                    <p className="text-xs text-[#64748B]">{step.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="md:hidden space-y-4">
            {pipelineSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-teal-700 shadow-md`}>
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0F172A]">{step.title}</p>
                  <p className="text-xs text-[#64748B]">{step.description}</p>
                </div>
                {index < pipelineSteps.length - 1 && <ArrowRight className="w-4 h-4 text-teal-200 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-3">Trusted Evidence</h2>
        <p className="text-[#64748B] leading-relaxed mb-6">
          MedVerify AI retrieves evidence from approved, authoritative medical sources to ensure accuracy and reliability.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <BookOpen className="w-6 h-6 text-teal-600" />, name: 'PubMed', desc: '30M+ citations' },
            { icon: <Shield className="w-6 h-6 text-teal-600" />, name: 'WHO', desc: 'Global health data' },
            { icon: <Network className="w-6 h-6 text-teal-600" />, name: 'ICMR', desc: 'Indian guidelines' },
            { icon: <Zap className="w-6 h-6 text-teal-600" />, name: 'Scientific Lit', desc: 'Peer-reviewed' },
          ].map((s) => (
            <div key={s.name} className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 text-center border border-teal-100">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                {s.icon}
              </div>
              <p className="font-semibold text-[#0F172A] text-sm">{s.name}</p>
              <p className="text-xs text-[#64748B]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-3">Dynamic Knowledge Base</h2>
        <p className="text-[#64748B] leading-relaxed mb-6">
          Our knowledge base continuously updates to ensure you get the most current medical evidence.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {knowledgeBaseSteps.map((step, index) => (
            <div key={index} className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-teal-100 hover:shadow-soft transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center text-teal-700">
                  {step.icon}
                </div>
                <p className="font-semibold text-[#0F172A] text-sm">{step.title}</p>
              </div>
              <p className="text-xs text-[#64748B]">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center gap-2 mt-6 text-teal-200 flex-wrap">
          {['Sources', 'Update', 'Detect', 'Chunk', 'Embed', 'Vector DB'].map((t, i, arr) => (
            <React.Fragment key={t}>
              <span className="text-xs text-[#64748B]">{t}</span>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4" />}
            </React.Fragment>
          ))}
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs text-teal-700 font-medium">Retriever</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-[#64748B]">
          MedVerify AI is an educational claim-verification tool, not a diagnostic or treatment system.
          <br />
          Always consult healthcare professionals for medical advice.
        </p>
      </div>
    </div>
  )
}

export default About