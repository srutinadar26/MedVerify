import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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

function App() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFA] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#E2E8F0] transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/about" element={<About />} />
        </Routes>
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