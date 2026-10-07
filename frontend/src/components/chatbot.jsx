import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { askChatbot } from '../services/api'

const SUGGESTIONS = [
  'Is drinking lemon water a cure for diabetes?',
  'Does vitamin C prevent colds?',
  'Are vaccines linked to autism?',
  'Does turmeric cure cancer?',
]

const INITIAL_MESSAGE = {
  from: 'bot',
  text: "Hi 👋 I'm MediBot — ask me about any health claim and I'll give you an evidence-based answer. In an emergency, I'll show hotlines immediately.",
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open])

  const send = async (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed) return
    setMessages((m) => [...m, { from: 'user', text: trimmed }])
    setInput('')
    setTyping(true)
    try {
      const reply = await askChatbot(trimmed)
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE])
    setInput('')
  }

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-teal-600 to-cyan-400 text-white
                   shadow-glow flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulsing ring when closed */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-cyan-400/40"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(80vh,600px)]
                       bg-white rounded-2xl shadow-2xl border border-teal-100
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-400 text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">MediBot</p>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Online · Evidence-aware
                </p>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={clearChat}
                  aria-label="Clear chat"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <Sparkles size={18} className="opacity-80" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7FAFA]">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isEmergencyMsg = m.from === 'bot' && m.text.startsWith('🚨')
                  return (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                          m.from === 'user'
                            ? 'bg-gradient-to-br from-teal-600 to-cyan-500 text-white rounded-br-sm'
                            : isEmergencyMsg
                              ? 'bg-red-50 text-red-800 border-2 border-red-300 rounded-bl-sm font-medium'
                              : 'bg-white text-[#0F172A] border border-teal-100 rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-teal-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full bg-teal-500"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestion chips */}
              {messages.length === 1 && !typing && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
                  }}
                  className="pt-2"
                >
                  <p className="text-xs text-[#64748B] mb-2 px-1">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <motion.button
                        key={s}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => send(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-teal-50 text-teal-700
                                   border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send() }}
              className="p-3 bg-white border-t border-teal-100 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a health claim…"
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-teal-200
                           focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || typing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-400
                           text-white flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-shadow"
              >
                {typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot