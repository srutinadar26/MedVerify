import React from 'react'
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts'

const verdictData = [
  { name: 'True', value: 35 },
  { name: 'False', value: 25 },
  { name: 'Misleading', value: 40 }
]
const COLORS = ['#0D9488', '#EF4444', '#F59E0B']

const activityData = [
  { month: 'Jan', claims: 12 }, { month: 'Feb', claims: 18 },
  { month: 'Mar', claims: 15 }, { month: 'Apr', claims: 22 },
  { month: 'May', claims: 28 }, { month: 'Jun', claims: 30 },
  { month: 'Jul', claims: 45 }, { month: 'Aug', claims: 52 }
]

const sourceData = [
  { name: 'PubMed', value: 45 },
  { name: 'WHO', value: 28 },
  { name: 'ICMR', value: 18 },
  { name: 'Other', value: 9 }
]
const sourceColors = ['#0D9488', '#14B8A6', '#22D3EE', '#99F6E4']

const categoryData = [
  { name: 'Nutrition', value: 30 },
  { name: 'Diseases', value: 25 },
  { name: 'Medication', value: 20 },
  { name: 'Lifestyle', value: 15 },
  { name: 'Preventive', value: 10 }
]

const timelineData = [
  { year: '2022', True: 5, False: 8, Misleading: 7 },
  { year: '2023', True: 12, False: 10, Misleading: 15 },
  { year: '2024', True: 18, False: 15, Misleading: 22 },
  { year: '2025', True: 25, False: 20, Misleading: 30 },
  { year: '2026', True: 35, False: 25, Misleading: 40 }
]

function Insights() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">Insights Dashboard</h1>
        <p className="text-[#64748B] dark:text-slate-400 mt-1">Analytics and trends from your medical claim verifications</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#0F172A] dark:text-slate-100">245</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400">Total Claims Verified</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">35%</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400">True Claims</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">25%</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400">False Claims</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">40%</p>
          <p className="text-xs text-[#64748B] dark:text-slate-400">Misleading Claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Verdict Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={verdictData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {verdictData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Verification Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="claims" stroke="#0D9488" strokeWidth={2}
                  dot={{ fill: '#14B8A6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Evidence Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0D9488">
                  {sourceData.map((entry, index) => (
                    <Cell key={index} fill={sourceColors[index % sourceColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Claim Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Verification Trends Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
              <XAxis dataKey="year" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="True" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 4 }} />
              <Line type="monotone" dataKey="False" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} />
              <Line type="monotone" dataKey="Misleading" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 mb-4">Performance Metrics</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={[
              { subject: 'Accuracy', A: 92, fullMark: 100 },
              { subject: 'Speed', A: 88, fullMark: 100 },
              { subject: 'Sources', A: 85, fullMark: 100 },
              { subject: 'Relevance', A: 90, fullMark: 100 },
              { subject: 'User Trust', A: 95, fullMark: 100 },
              { subject: 'Coverage', A: 82, fullMark: 100 }
            ]}>
              <PolarGrid stroke="#94A3B8" opacity={0.3} />
              <PolarAngleAxis dataKey="subject" stroke="#94A3B8" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" />
              <Radar name="MedVerify AI" dataKey="A" stroke="#0D9488" fill="#5EEAD4" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Insights