// API Service - Ready for Backend Integration
// Change this URL when your backend is ready

const API_BASE_URL = 'http://localhost:8000/api' // ← UPDATE THIS WITH REAL BACKEND URL

// ============================================
// MOCK DATA (Fallback when backend is not available)
// ============================================

const mockHistoryData = [
  {
    id: 1,
    claim: "Vitamin C prevents all viral infections",
    verdict: "MISLEADING",
    date: "2026-08-18",
    sources: 6,
    status: "completed"
  },
  {
    id: 2,
    claim: "Green tea burns fat instantly",
    verdict: "FALSE",
    date: "2026-08-15",
    sources: 4,
    status: "completed"
  },
  {
    id: 3,
    claim: "Regular exercise reduces heart disease risk",
    verdict: "TRUE",
    date: "2026-08-12",
    sources: 8,
    status: "completed"
  },
  {
    id: 4,
    claim: "Eating garlic prevents cancer",
    verdict: "MISLEADING",
    date: "2026-08-10",
    sources: 5,
    status: "completed"
  },
  {
    id: 5,
    claim: "Drinking 8 glasses of water daily is mandatory",
    verdict: "FALSE",
    date: "2026-08-08",
    sources: 3,
    status: "completed"
  },
  {
    id: 6,
    claim: "Mediterranean diet improves heart health",
    verdict: "TRUE",
    date: "2026-08-05",
    sources: 7,
    status: "completed"
  }
]

// ============================================
// VERIFY CLAIM ENDPOINTS
// ============================================

// Verify a text claim
export const verifyTextClaim = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock data:', error)
    // Return mock data as fallback
    return {
      claim: text,
      verdict: ["TRUE", "FALSE", "MISLEADING"][Math.floor(Math.random() * 3)],
      confidence: 0.70 + Math.random() * 0.25,
      timestamp: new Date().toISOString(),
      explanation: {
        assessment: `Analysis of: "${text}"`,
        evidence: "Based on available medical evidence and sources.",
        context: "Please consult healthcare professionals for personalized advice."
      },
      evidence: [
        {
          source: "PubMed",
          title: "Medical evidence review",
          excerpt: "Current medical literature provides context for evaluating this claim.",
          publication_date: "2025-08-15",
          last_updated: "2026-02-20",
          url: "https://pubmed.ncbi.nlm.nih.gov",
          relevance: 75,
          domain: "General Medicine"
        }
      ],
      stats: {
        sourcesAnalyzed: 8,
        relevantEvidence: 5,
        latestSource: "2026",
        responseTime: (1.5 + Math.random() * 1.5).toFixed(1) + "s"
      }
    }
  }
}

// Verify a URL claim
export const verifyUrlClaim = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock data:', error)
    return {
      claim: `URL: ${url}`,
      verdict: "MISLEADING",
      confidence: 0.80,
      timestamp: new Date().toISOString(),
      explanation: {
        assessment: "URL verification requires backend processing.",
        evidence: "Please connect to the backend for full URL analysis.",
        context: "URL verification is currently in demo mode."
      },
      evidence: [
        {
          source: "PubMed",
          title: "URL content analysis",
          excerpt: "Unable to analyze URL without backend connection.",
          publication_date: "2025-08-15",
          last_updated: "2026-02-20",
          url: url,
          relevance: 50,
          domain: "General"
        }
      ],
      stats: {
        sourcesAnalyzed: 3,
        relevantEvidence: 2,
        latestSource: "2026",
        responseTime: "1.2s"
      }
    }
  }
}

// Verify an image claim
export const verifyImageClaim = async (imageFile) => {
  try {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await fetch(`${API_BASE_URL}/verify/image`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock data:', error)
    return {
      claim: `Image: ${imageFile.name}`,
      verdict: "MISLEADING",
      confidence: 0.75,
      timestamp: new Date().toISOString(),
      explanation: {
        assessment: "Image verification requires backend processing.",
        evidence: "Please connect to the backend for OCR and analysis.",
        context: "Image verification is currently in demo mode."
      },
      evidence: [
        {
          source: "PubMed",
          title: "Image content analysis",
          excerpt: "Unable to analyze image without backend connection.",
          publication_date: "2025-08-15",
          last_updated: "2026-02-20",
          url: "https://pubmed.ncbi.nlm.nih.gov",
          relevance: 45,
          domain: "General"
        }
      ],
      stats: {
        sourcesAnalyzed: 2,
        relevantEvidence: 1,
        latestSource: "2026",
        responseTime: "1.5s"
      }
    }
  }
}

// ============================================
// HISTORY ENDPOINTS
// ============================================

// Get verification history
export const getVerificationHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock history:', error)
    // Return mock history as fallback
    return mockHistoryData
  }
}

// Get specific verification by ID
export const getVerificationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock data:', error)
    // Return mock data as fallback
    const item = mockHistoryData.find(item => item.id === parseInt(id))
    return item || mockHistoryData[0]
  }
}

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Get analytics data
export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock analytics:', error)
    // Return mock analytics as fallback
    return {
      verdictData: [
        { name: 'True', value: 35 },
        { name: 'False', value: 25 },
        { name: 'Misleading', value: 40 }
      ],
      activityData: [
        { month: 'Jan', claims: 12 },
        { month: 'Feb', claims: 18 },
        { month: 'Mar', claims: 15 },
        { month: 'Apr', claims: 22 },
        { month: 'May', claims: 28 },
        { month: 'Jun', claims: 30 },
        { month: 'Jul', claims: 45 },
        { month: 'Aug', claims: 52 }
      ],
      sourceData: [
        { name: 'PubMed', value: 45 },
        { name: 'WHO', value: 28 },
        { name: 'ICMR', value: 18 },
        { name: 'Other', value: 9 }
      ],
      categoryData: [
        { name: 'Nutrition', value: 30 },
        { name: 'Diseases', value: 25 },
        { name: 'Medication', value: 20 },
        { name: 'Lifestyle', value: 15 },
        { name: 'Preventive', value: 10 }
      ],
      timelineData: [
        { year: '2022', True: 5, False: 8, Misleading: 7 },
        { year: '2023', True: 12, False: 10, Misleading: 15 },
        { year: '2024', True: 18, False: 15, Misleading: 22 },
        { year: '2025', True: 25, False: 20, Misleading: 30 },
        { year: '2026', True: 35, False: 25, Misleading: 40 }
      ],
      summary: {
        total: 245,
        truePercent: 35,
        falsePercent: 25,
        misleadingPercent: 40
      }
    }
  }
}

// ============================================
// HEALTH CHECK
// ============================================

// Check if backend is running
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    })
    
    return response.ok
  } catch (error) {
    console.error('Backend not available:', error)
    return false
  }
}