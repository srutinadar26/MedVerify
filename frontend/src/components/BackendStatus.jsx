import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { healthCheck } from '../services/api'

function BackendStatus() {
  const [isConnected, setIsConnected] = useState(null)

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await healthCheck()
      setIsConnected(connected)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) return null

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
      isConnected
        ? 'bg-teal-50 text-teal-700 border-teal-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
    }`}>
      {isConnected ? (
        <><Wifi className="w-3 h-3" /> Backend Connected</>
      ) : (
        <><WifiOff className="w-3 h-3" /> Backend Offline (Mock Mode)</>
      )}
    </div>
  )
}

export default BackendStatus