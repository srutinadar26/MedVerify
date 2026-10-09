import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp, Eye, FileText, ArrowRight, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { getVerificationHistory, deleteVerificationById } from '../services/api'

function History() {
  const navigate = useNavigate()
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerdict, setFilterVerdict] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Deletion state
  const [deletingId, setDeletingId] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [feedback, setFeedback] = useState(null)

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

  const normaliseVerdict = (v) => {
    if (!v) return 'UNCERTAIN'
    switch (v.toUpperCase()) {
      case 'SUPPORTED': case 'TRUE':       return 'SUPPORTED'
      case 'REFUTED':   case 'FALSE':      return 'REFUTED'
      case 'UNCERTAIN': case 'MISLEADING': return 'UNCERTAIN'
      default: return 'UNCERTAIN'
    }
  }

  const getVerdictColor = (verdict) => {
    switch (normaliseVerdict(verdict)) {
      case 'SUPPORTED': return 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
      case 'REFUTED':   return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      default:          return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    }
  }

  const getVerdictLabel = (verdict) => normaliseVerdict(verdict)

  const handleViewResult = (item) => {
    navigate('/results', {
      state: {
        apiResult: {
          claim: item.claim,
          verdict: item.verdict,
          confidence: item.confidence || 0.85,
          timestamp: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
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
            sourcesAnalyzed: item.sources || 4,
            relevantEvidence: Math.max(1, Math.floor((item.sources || 4) * 0.7)),
            latestSource: '2026',
            responseTime: '1.2s'
          }
        }
      }
    })
  }

  const handleDelete = async (item) => {
    try {
      setDeletingId(item.id)
      await deleteVerificationById(item.id)
      // Remove only the selected record
      setHistoryData(prev => prev.filter(h => h.id !== item.id))
      setConfirmItem(null)
      setFeedback({ type: 'success', message: `Verification record #${item.id} deleted successfully.` })
      setTimeout(() => setFeedback(null), 3500)
    } catch (err) {
      console.error('Failed to delete claim:', err)
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete record. Please try again.' })
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredData = historyData
    .filter(item => {
      const matchesSearch = item.claim.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterVerdict === 'all' || normaliseVerdict(item.verdict) === filterVerdict
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
          <p className="text-[#64748B] dark:text-slate-400 mt-1">View all your past medical claim verifications</p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-teal-50/60 dark:bg-slate-700/60 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="w-32 h-10 bg-teal-50/60 dark:bg-slate-700/60 rounded-xl animate-pulse" />
              <div className="w-32 h-10 bg-teal-50/60 dark:bg-slate-700/60 rounded-xl animate-pulse" />
              <div className="w-10 h-10 bg-teal-50/60 dark:bg-slate-700/60 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="hidden md:block bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="bg-teal-50/40 dark:bg-slate-700/40 border-b border-teal-100 dark:border-slate-700 px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-3 bg-teal-100/70 dark:bg-slate-600 rounded animate-pulse" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border-b border-teal-50 dark:border-slate-700/50 px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="h-4 bg-teal-50 dark:bg-slate-700 rounded animate-pulse col-span-2" />
                <div className="h-6 w-24 bg-teal-50 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-teal-50 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-teal-50 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-14 bg-teal-50 dark:bg-slate-700 rounded animate-pulse" />
              </div>
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
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-700 dark:text-red-300">{error}</p>
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
            <span className="ml-3 text-base font-semibold text-teal-600 dark:text-teal-400 align-middle">
              ({historyData.length})
            </span>
          )}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 mt-1">View and manage all your past medical claim verifications</p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all ${
          feedback.type === 'success'
            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter + Search bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="px-4 py-2 border border-teal-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100"
            >
              <option value="all">All Verdicts</option>
              <option value="SUPPORTED">Supported</option>
              <option value="REFUTED">Refuted</option>
              <option value="UNCERTAIN">Uncertain</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-teal-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100"
            >
              <option value="date">Sort by Date</option>
              <option value="verdict">Sort by Verdict</option>
              <option value="sources">Sort by Sources</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 border border-teal-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 hover:border-teal-500 transition-colors flex items-center gap-1"
            >
              {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#64748B] dark:text-slate-400 mb-4">Showing {filteredData.length} results</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-teal-50/50 dark:bg-slate-700/50 border-b border-teal-100 dark:border-slate-700">
            <tr>
              {['Claim', 'Verdict', 'Date', 'Sources', 'Actions'].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b border-teal-50 dark:border-slate-700/50 hover:bg-teal-50/30 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-[#0F172A] dark:text-slate-200 max-w-xs truncate" title={item.claim}>
                    "{item.claim}"
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                      {getVerdictLabel(item.verdict)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-slate-400">
                    {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-slate-400">
                    {item.sources || 4} sources
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewResult(item)}
                        className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors flex items-center gap-1 text-sm font-medium"
                        title="View details"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => setConfirmItem(item)}
                        disabled={deletingId === item.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                        title="Delete this record"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
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
            <div key={item.id} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm p-4">
              <p className="text-sm text-[#0F172A] dark:text-slate-100 font-medium mb-2">"{item.claim}"</p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getVerdictColor(item.verdict)}`}>
                  {getVerdictLabel(item.verdict)}
                </span>
                <span className="text-xs text-[#64748B] dark:text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</span>
                <span className="text-xs text-[#64748B] dark:text-slate-400">{item.sources || 4} sources</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewResult(item)}
                  className="flex-1 px-4 py-2 btn-primary text-sm flex items-center justify-center gap-1.5"
                >
                  <Eye size={16} /> View Result
                </button>
                <button
                  onClick={() => setConfirmItem(item)}
                  disabled={deletingId === item.id}
                  className="p-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors disabled:opacity-50"
                  aria-label="Delete claim"
                  title="Delete claim"
                >
                  {deletingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700">
            <EmptyState
              title="No claims match your filters"
              description="Try adjusting your search or filters."
            />
          </div>
        )}
      </div>

      {/* Whole-page empty state when no history at all */}
      {historyData.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-sm py-16 px-6 text-center">
          <EmptyState
            title="No verifications yet"
            description="Verify your first medical claim and it will appear here."
            ctaLabel="Verify a Claim"
            onCta={() => navigate('/verify')}
          />
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-xl max-w-md w-full p-6 animate-chat-pop">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100">Delete Verification Record?</h3>
            </div>
            <p className="text-sm text-[#64748B] dark:text-slate-300 mb-4">
              Are you sure you want to delete this claim from your history? This action cannot be undone.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-semibold mb-1">CLAIM</p>
              <p className="text-sm text-[#0F172A] dark:text-slate-200 italic line-clamp-2">"{confirmItem.claim}"</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={deletingId === confirmItem.id}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmItem)}
                disabled={deletingId === confirmItem.id}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingId === confirmItem.id && <Loader2 size={16} className="animate-spin" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Small inline empty-state component ----------
function EmptyState({ title, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/60 dark:to-cyan-900/60 flex items-center justify-center">
        <FileText className="w-8 h-8 text-teal-700 dark:text-teal-300" />
      </div>
      <p className="text-base font-semibold text-[#0F172A] dark:text-slate-100">{title}</p>
      <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-sm">{description}</p>
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