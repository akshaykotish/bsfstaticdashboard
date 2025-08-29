import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  Building, TrendingUp, DollarSign, Clock, CheckCircle,
  AlertTriangle, Activity, Users, IndianRupee, Target,
  Calendar, AlertCircle, Info, ArrowUp, ArrowDown
} from 'lucide-react';

const COLORS = {
  primary: ['#f97316', '#fb923c', '#fed7aa'],
  secondary: ['#64748b', '#94a3b8', '#cbd5e1'],
  vibrant: ['#f97316', '#dc2626', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b'],
  gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'],
  budget: {
    allocated: '#3b82f6',
    spent: '#10b981',
    remaining: '#f59e0b',
    overrun: '#ef4444'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7'
  },
  risk: {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#fbbf24',
    LOW: '#10b981'
  }
};

const Overview = ({ data, darkMode, onChartClick, formatAmount, expandedView }) => {
  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        executiveSummary: {
          totalProjects: 0,
          onTrack: 0,
          delayed: 0,
          critical: 0,
          completed: 0,
          notStarted: 0,
          ongoing: 0
        },
        budgetOverview: [],
        monthlyTrend: [],
        riskDistribution: [],
        statusDistribution: [],
        agencyPerformance: []
      };
    }

    // Executive Summary
    const executiveSummary = {
      totalProjects: data.length,
      onTrack: data.filter(d => (!d.delay_days || d.delay_days === 0) && d.physical_progress > 0).length,
      delayed: data.filter(d => d.delay_days && d.delay_days > 0).length,
      critical: data.filter(d => d.risk_level === 'CRITICAL').length,
      completed: data.filter(d => d.physical_progress >= 100).length,
      notStarted: data.filter(d => d.physical_progress === 0).length,
      ongoing: data.filter(d => d.physical_progress > 0 && d.physical_progress < 100).length
    };

    // Budget Overview
    const totalBudget = data.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0) / 100;
    const totalSpent = data.reduce((sum, d) => sum + (d.total_expdr || 0), 0) / 100;
    const totalRemaining = totalBudget - totalSpent;
    
    const budgetOverview = [
      { name: 'Allocated', value: totalBudget, fill: COLORS.budget.allocated },
      { name: 'Spent', value: totalSpent, fill: COLORS.budget.spent },
      { name: 'Remaining', value: totalRemaining, fill: COLORS.budget.remaining }
    ].filter(item => item.value > 0);

    // Monthly Trend Analysis
    const monthlyTrend = [];
    const monthlyData = {};
    
    data.forEach(d => {
      if (d.date_award) {
        const date = new Date(d.date_award);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              projects: 0,
              budget: 0,
              spent: 0,
              completed: 0
            };
          }
          monthlyData[monthKey].projects++;
          monthlyData[monthKey].budget += (d.sanctioned_amount || 0) / 100;
          monthlyData[monthKey].spent += (d.total_expdr || 0) / 100;
          if (d.physical_progress >= 100) monthlyData[monthKey].completed++;
        }
      }
    });

    // Convert to array and sort
    Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => monthlyTrend.push(item));

    // Risk Distribution
    const riskCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    data.forEach(d => {
      if (d.risk_level && riskCounts.hasOwnProperty(d.risk_level)) {
        riskCounts[d.risk_level]++;
      }
    });

    const riskDistribution = Object.entries(riskCounts).map(([level, count]) => ({
      level,
      count,
      percentage: data.length ? ((count / data.length) * 100).toFixed(1) : 0,
      fill: COLORS.risk[level]
    }));

    // Status Distribution
    const statusDistribution = [
      { status: 'Completed', count: executiveSummary.completed, fill: COLORS.status.success },
      { status: 'On Track', count: executiveSummary.onTrack, fill: COLORS.status.info },
      { status: 'Delayed', count: executiveSummary.delayed, fill: COLORS.status.warning },
      { status: 'Not Started', count: executiveSummary.notStarted, fill: COLORS.status.danger }
    ];

    // Agency Performance Summary
    const agencyStats = {};
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyStats[agency]) {
        agencyStats[agency] = {
          name: agency,
          projects: 0,
          budget: 0,
          avgProgress: 0,
          totalProgress: 0
        };
      }
      agencyStats[agency].projects++;
      agencyStats[agency].budget += (d.sanctioned_amount || 0) / 100;
      agencyStats[agency].totalProgress += d.physical_progress || 0;
    });

    const agencyPerformance = Object.values(agencyStats)
      .map(a => ({
        ...a,
        avgProgress: a.projects ? (a.totalProgress / a.projects).toFixed(1) : 0
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 5);

    return {
      executiveSummary,
      budgetOverview,
      monthlyTrend,
      riskDistribution,
      statusDistribution,
      agencyPerformance
    };
  }, [data]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-xl backdrop-blur-sm border ${
          darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-100' : 'bg-white/95 border-orange-200'
        }`}>
          <p className="text-sm font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-semibold">{entry.name}:</span>
              <span className="font-medium">
                {typeof entry.value === 'number' && (entry.name.includes('Budget') || entry.name.includes('Spent'))
                  ? formatAmount(entry.value * 100)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity size={20} className="text-orange-500" />
          Executive Dashboard
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(metrics.executiveSummary).map(([key, value]) => (
            <div 
              key={key} 
              className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-orange-50 hover:bg-orange-100'
              }`}
              onClick={() => onChartClick({ filterType: key }, 'filter')}
            >
              <p className="text-xs text-gray-500 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-gray-500">
                {metrics.executiveSummary.totalProjects ? 
                  ((value / metrics.executiveSummary.totalProjects) * 100).toFixed(0) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Budget Overview Pie Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-green-500" />
            Budget Status
          </h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.budgetOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.budgetOverview.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {metrics.budgetOverview.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{formatAmount(item.value * 100)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Target size={18} className="text-blue-500" />
            Project Status
          </h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count">
                  {metrics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Risk Levels
          </h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count">
                  {metrics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Performance Trend */}
      {metrics.monthlyTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-500" />
            Monthly Performance Trend
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="projects" fill="#3b82f6" name="New Projects" />
                <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Completed" />
                <Line yAxisId="right" type="monotone" dataKey="budget" stroke="#f97316" name="Budget (Cr)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="spent" stroke="#a855f7" name="Spent (Cr)" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Agencies Performance */}
      {metrics.agencyPerformance.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Users size={18} className="text-indigo-500" />
            Top Agencies by Project Count
          </h3>
          <div className="space-y-3">
            {metrics.agencyPerformance.map((agency, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} cursor-pointer hover:scale-[1.02] transition-all`}
                onClick={() => onChartClick({ filterType: 'agency', value: agency.name }, 'filter')}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{agency.name}</span>
                  <span className="text-sm text-gray-500">{agency.projects} projects</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Budget: {formatAmount(agency.budget * 100)}</span>
                  <span>Avg Progress: {agency.avgProgress}%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                    style={{ width: `${agency.avgProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;