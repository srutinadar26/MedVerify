import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp, Eye, FileText, ArrowRight } from 'lucide-react'
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
    switch (verdict) {
      case 'TRUE': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'FALSE': return 'bg-red-50 text-red-700 border-red-200'
      case 'MISLEADING': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const handleViewResult = (item) => {
    navigate('/results', {
      state: {
        apiResult: {
          claim: item.claim,
          verdict: item.verdict,
          confidence: 0.85,
          timestamp: new Date(item.date).toISOString(),
          explanation: {
            assessment: `Analysis of: "${item.claim}"`,
            evidence: 'Based on available medical evidence and sources.',
            context: 'Please consult healthcare professionals for personalized advice.'
          },
          evidence: [
            {
              source: 'PubMed',
              title: 'Medical evidence review',
              excerpt: 'Current medical literature provides context for evaluating this claim.',
              publication_date: '2025-08-15',
              last_updated: '2026-02-20',
              url: 'https://pubmed.ncbi.nlm.nih.gov',
              relevance: 75,
              domain: 'General Medicine'
            }
          ],
          stats: {
            sourcesAnalyzed: item.sources || 5,
            relevantEvidence: Math.floor((item.sources || 5) * 0.7),
            latestSource: '2026',
            responseTime: '2.1s'
          }
        }
      }
    })
  }

  const filteredData = historyData
    .filter(item => {
      const matchesSearch = item.claim.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterVerdict === 'all' || item.verdict === filterVerdict
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
      }
      if (sortBy === 'verdict') {
        return sortOrder === 'desc' ? b.verdict.localeCompare(a.verdict) : a.verdict.localeCompare(b.verdict)
      }
      if (sortBy === 'sources') {
        return sortOrder === 'desc' ? b.sources - a.sources : a.sources - b.sources
      }
      return 0
    })

  // ---------- SKELETON LOADING ----------
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold gradient-title">Verification History</h1>
          <p className="text-[#64748B] mt-1">View all your past medical claim verifications</p>
        </div>

        {/* Skeleton filter bar */}
        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-teal-50/60 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="w-32 h-10 bg-teal-50/60 rounded-xl animate-pulse" />
              <div className="w-32 h-10 bg-teal-50/60 rounded-xl animate-pulse" />
              <div className="w-10 h-10 bg-teal-50/60 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton table rows */}
        <div className="hidden md:block bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
          <div className="bg-teal-50/40 border-b border-teal-100 px-6 py-4">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 bg-teal-100/70 rounded animate-pulse" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border-b border-teal-50 px-6 py-4">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="h-4 bg-teal-50 rounded animate-pulse" />
                <div className="h-6 w-24 bg-teal-50 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-teal-50 rounded animate-pulse" />
                <div className="h-4 w-16 bg-teal-50 rounded animate-pulse" />
                <div className="h-4 w-14 bg-teal-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton cards for mobile */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4">
              <div className="h-4 bg-teal-50 rounded animate-pulse mb-3 w-3/4" />
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-20 bg-teal-50 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-teal-50 rounded-full animate-pulse" />
              </div>
              <div className="h-9 bg-teal-50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------- ERROR STATE ----------
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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">
          Verification History
          {historyData.length > 0 && (
            <span className="ml-3 text-base font-semibold text-teal-600 align-middle">
              ({historyData.length})
            </span>
          )}
        </h1>
        <p className="text-[#64748B] mt-1">View all your past medical claim verifications</p>
      </div>

      {/* Filter + Search bar */}
      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="px-4 py-2 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-[#0F172A]"
            >
              <option value="all">All Verdicts</option>
              <option value="TRUE">True</option>
              <option value="FALSE">False</option>
              <option value="MISLEADING">Misleading</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-[#0F172A]"
            >
              <option value="date">Sort by Date</option>
              <option value="verdict">Sort by Verdict</option>
              <option value="sources">Sort by Sources</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 border border-teal-100 rounded-xl hover:border-teal-500 transition-colors flex items-center gap-1"
            >
              {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#64748B] mb-4">Showing {filteredData.length} results</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-teal-50/50 border-b border-teal-100">
            <tr>
              {['Claim', 'Verdict', 'Date', 'Sources', 'Action'].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-teal-50 hover:bg-teal-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-[#0F172A] max-w-xs truncate">"{item.claim}"</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                      {item.verdict}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{item.sources} sources</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewResult(item)}
                      className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12">
                  <EmptyState
                    title="No claims match your filters"
                    description="Try adjusting your search or filters."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4">
              <p className="text-sm text-[#0F172A] font-medium mb-2">"{item.claim}"</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                  {item.verdict}
                </span>
                <span className="text-xs text-[#64748B]">{new Date(item.date).toLocaleDateString()}</span>
                <span className="text-xs text-[#64748B]">{item.sources} sources</span>
              </div>
              <button
                onClick={() => handleViewResult(item)}
                className="w-full mt-2 px-4 py-2 btn-primary text-sm"
              >
                View Result
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-teal-100">
            <EmptyState
              title="No claims match your filters"
              description="Try adjusting your search or filters."
            />
          </div>
        )}
      </div>

      {/* Whole-page empty state when no history at all */}
      {historyData.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm py-16 px-6 text-center">
          <EmptyState
            title="No verifications yet"
            description="Verify your first medical claim and it will appear here."
            ctaLabel="Verify a Claim"
            onCta={() => navigate('/verify')}
          />
        </div>
      )}
    </div>
  )
}

// ---------- Small inline empty-state component ----------
function EmptyState({ title, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
        <FileText className="w-8 h-8 text-teal-700" />
      </div>
      <p className="text-base font-semibold text-[#0F172A]">{title}</p>
      <p className="text-sm text-[#64748B] max-w-sm">{description}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-2 inline-flex items-center gap-2 px-6 py-3 btn-primary"
        >
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default History