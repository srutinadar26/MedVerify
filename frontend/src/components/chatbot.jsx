import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, Trash2 } from 'lucide-react'
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
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-teal-600 to-cyan-400 text-white
                   shadow-glow hover:scale-105 active:scale-95 transition-all
                   animate-bubble-pulse flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(80vh,600px)]
                     bg-white rounded-2xl shadow-2xl border border-teal-100
                     flex flex-col overflow-hidden animate-chat-pop"
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
            {messages.map((m, i) => {
              const isEmergencyMsg = m.from === 'bot' && m.text.startsWith('🚨')
              return (
                <div
                  key={i}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-msg-in`}
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
                </div>
              )
            })}

            {typing && (
              <div className="flex justify-start animate-msg-in">
                <div className="bg-white border border-teal-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-teal-500" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-teal-500" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-teal-500" />
                </div>
              </div>
            )}

            {messages.length === 1 && !typing && (
              <div className="pt-2">
                <p className="text-xs text-[#64748B] mb-2 px-1">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-teal-50 text-teal-700
                                 border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
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
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-400
                         text-white flex items-center justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:shadow-glow transition-all"
            >
              {typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot