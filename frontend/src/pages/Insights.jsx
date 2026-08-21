import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

// Mock data for charts
const verdictData = [
  { name: 'True', value: 35 },
  { name: 'False', value: 25 },
  { name: 'Misleading', value: 40 }
]

const COLORS = ['#4CAF50', '#EF5350', '#FFA726']

const activityData = [
  { month: 'Jan', claims: 12 },
  { month: 'Feb', claims: 18 },
  { month: 'Mar', claims: 15 },
  { month: 'Apr', claims: 22 },
  { month: 'May', claims: 28 },
  { month: 'Jun', claims: 30 },
  { month: 'Jul', claims: 45 },
  { month: 'Aug', claims: 52 }
]

const sourceData = [
  { name: 'PubMed', value: 45 },
  { name: 'WHO', value: 28 },
  { name: 'ICMR', value: 18 },
  { name: 'Other', value: 9 }
]

const categoryData = [
  { name: 'Nutrition', value: 30 },
  { name: 'Diseases', value: 25 },
  { name: 'Medication', value: 20 },
  { name: 'Lifestyle', value: 15 },
  { name: 'Preventive', value: 10 }
]

const sourceColors = ['#800020', '#E9B8C8', '#DDD6F3', '#D8D8DE']

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-title">Insights Dashboard</h1>
        <p className="text-[#77727F] mt-1">Analytics and trends from your medical claim verifications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#292633]">245</p>
          <p className="text-xs text-[#77727F]">Total Claims Verified</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">35%</p>
          <p className="text-xs text-[#77727F]">True Claims</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-500">25%</p>
          <p className="text-xs text-[#77727F]">False Claims</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">40%</p>
          <p className="text-xs text-[#77727F]">Misleading Claims</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verdict Distribution - Donut Chart */}
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#292633] mb-4">Verdict Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Activity - Line Chart */}
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#292633] mb-4">Verification Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="claims" 
                  stroke="#800020" 
                  strokeWidth={2}
                  dot={{ fill: '#E9B8C8', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evidence Sources - Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#292633] mb-4">Evidence Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#800020">
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={sourceColors[index % sourceColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claim Categories - Pie Chart */}
        <div className="bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#292633] mb-4">Claim Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timeline Chart - Full Width */}
      <div className="mt-6 bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#292633] mb-4">Verification Trends Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="True" 
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ fill: '#4CAF50', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="False" 
                stroke="#EF5350" 
                strokeWidth={2}
                dot={{ fill: '#EF5350', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Misleading" 
                stroke="#FFA726" 
                strokeWidth={2}
                dot={{ fill: '#FFA726', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart - Full Width */}
      <div className="mt-6 bg-white rounded-2xl border border-[#DDD6F3]/30 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#292633] mb-4">Performance Metrics</h3>
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
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="MedVerify AI" dataKey="A" stroke="#800020" fill="#E9B8C8" fillOpacity={0.6} />
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