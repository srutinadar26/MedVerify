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
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return null // Still checking
  }

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
      isConnected 
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-amber-50 text-amber-700 border border-amber-200'
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