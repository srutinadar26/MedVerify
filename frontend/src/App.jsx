import React, { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Chatbot from './components/Chatbot'
import Home from './pages/Home'
import Verify from './pages/Verify'
import Results from './pages/Results'
import History from './pages/History'
import Insights from './pages/Insights'
import About from './pages/About'

// Wrapper that gives every page a smooth fade+slide transition
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const [toast, setToast] = useState(null)
  const location = useLocation()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFA]">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/verify" element={<PageTransition><Verify /></PageTransition>} />
            <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
            <Route path="/history" element={<PageTransition><History /></PageTransition>} />
            <Route path="/insights" element={<PageTransition><Insights /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <Chatbot />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App