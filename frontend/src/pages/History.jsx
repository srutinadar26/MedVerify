import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp, Eye, Loader } from 'lucide-react'
import { getVerificationHistory } from '../services/api'

function History() {
  const navigate = useNavigate()
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerdict, setFilterVerdict] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Fetch history data from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getVerificationHistory()
        setHistoryData(data)
      } catch (err) {
        setError('Failed to load history. Please try again.')
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getVerdictColor = (verdict) => {
    switch(verdict) {
      case 'TRUE': return 'bg-green-50 text-green-700 border-green-200'
      case 'FALSE': return 'bg-red-50 text-red-700 border-red-200'
      case 'MISLEADING': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Handle viewing a specific claim
  const handleViewResult = (item) => {
    // Navigate to results page with the claim data
    navigate('/results', { 
      state: { 
        apiResult: {
          claim: item.claim,
          verdict: item.verdict,
          confidence: 0.85,
          timestamp: new Date(item.date).toISOString(),
          explanation: {
            assessment: `Analysis of: "${item.claim}"`,
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
            sourcesAnalyzed: item.sources || 5,
            relevantEvidence: Math.floor((item.sources || 5) * 0.7),
            latestSource: "2026",
            responseTime: "2.1s"
          }
        }
      } 
    })
  }

  // Filter and sort data
  const filteredData = historyData
    .filter(item => {
      const matchesSearch = item.claim.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterVerdict === 'all' || item.verdict === filterVerdict
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      }
      if (sortBy === 'verdict') {
        return sortOrder === 'desc'
          ? b.verdict.localeCompare(a.verdict)
          : a.verdict.localeCompare(b.verdict)
      }
      if (sortBy === 'sources') {
        return sortOrder === 'desc'
          ? b.sources - a.sources
          : a.sources - b.sources
      }
      return 0
    })

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <Loader className="w-12 h-12 text-[#800020] animate-spin mx-auto mb-4" />
        <p className="text-[#77727F]">Loading history...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">Verification History</h1>
        <p className="text-[#77727F] mt-1">View all your past medical claim verifications</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#77727F] w-4 h-4" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D8D8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9B8C8] focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="px-4 py-2 border border-[#D8D8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9B8C8] focus:border-transparent bg-white text-[#292633]"
            >
              <option value="all">All Verdicts</option>
              <option value="TRUE">True</option>
              <option value="FALSE">False</option>
              <option value="MISLEADING">Misleading</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[#D8D8DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E9B8C8] focus:border-transparent bg-white text-[#292633]"
            >
              <option value="date">Sort by Date</option>
              <option value="verdict">Sort by Verdict</option>
              <option value="sources">Sort by Sources</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 border border-[#D8D8DE] rounded-xl hover:border-[#800020] transition-colors flex items-center gap-1"
            >
              {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[#77727F] mb-4">
        Showing {filteredData.length} results
      </p>

      {/* History Table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#FAF8FC] border-b border-[#D8D8DE]/30">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#77727F] uppercase">Claim</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#77727F] uppercase">Verdict</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#77727F] uppercase">Date</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#77727F] uppercase">Sources</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#77727F] uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-[#D8D8DE]/20 hover:bg-[#FAF8FC] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#292633] max-w-xs truncate">
                    "{item.claim}"
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                      {item.verdict}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#77727F]">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#77727F]">
                    {item.sources} sources
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleViewResult(item)}
                      className="text-[#800020] hover:text-[#E9B8C8] transition-colors flex items-center gap-1 text-sm"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-[#77727F]">
                  No history records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4">
              <p className="text-sm text-[#292633] font-medium mb-2">
                "{item.claim}"
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                  {item.verdict}
                </span>
                <span className="text-xs text-[#77727F]">{new Date(item.date).toLocaleDateString()}</span>
                <span className="text-xs text-[#77727F]">{item.sources} sources</span>
              </div>
              <button 
                onClick={() => handleViewResult(item)}
                className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-[#800020] to-[#E9B8C8] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                View Result
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#DDD6F3]/30">
            <p className="text-[#77727F]">No history records found</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && historyData.length > 0 && (
        <div className="text-center py-12">
          <p className="text-[#77727F]">No results match your filters</p>
          <p className="text-sm text-[#77727F] mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

export default History