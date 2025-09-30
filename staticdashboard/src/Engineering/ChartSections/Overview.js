import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  Building, TrendingUp, DollarSign, Clock, CheckCircle,
  AlertTriangle, Activity, Users, IndianRupee, Target,
  Calendar, AlertCircle, Info, ArrowUp, ArrowDown,
  X, Eye
} from 'lucide-react';
import DataTable from '../DataTable';

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
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);

  // Calculate comprehensive metrics with correct field mappings
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
        agencyPerformance: [],
        agencyProjects: {}
      };
    }

    // Executive Summary - using correct field names
    const executiveSummary = {
      totalProjects: data.length,
      onTrack: data.filter(d => (!d.delay_days || d.delay_days === 0) && d.physical_progress_percent > 0).length,
      delayed: data.filter(d => d.delay_days && d.delay_days > 0).length,
      critical: data.filter(d => d.risk_level === 'CRITICAL').length,
      completed: data.filter(d => d.physical_progress_percent >= 100).length,
      notStarted: data.filter(d => d.physical_progress_percent === 0).length,
      ongoing: data.filter(d => d.physical_progress_percent > 0 && d.physical_progress_percent < 100).length
    };

    // Budget Overview - using sd_amount_lakh and expenditure fields
    const totalBudget = data.reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0);
    const totalSpent = data.reduce((sum, d) => sum + (d.expenditure_total || 0), 0);
    const totalRemaining = totalBudget - totalSpent;
    
    const budgetOverview = [
      { name: 'Allocated', value: totalBudget, fill: COLORS.budget.allocated },
      { name: 'Spent', value: totalSpent, fill: COLORS.budget.spent },
      { name: 'Remaining', value: totalRemaining, fill: COLORS.budget.remaining }
    ].filter(item => item.value > 0);

    // Monthly Trend Analysis - using award_date
    const monthlyTrend = [];
    const monthlyData = {};
    
    data.forEach(d => {
      if (d.award_date) {
        const date = new Date(d.award_date);
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
          monthlyData[monthKey].budget += (d.sd_amount_lakh || 0);
          monthlyData[monthKey].spent += (d.expenditure_total || 0);
          if (d.physical_progress_percent >= 100) monthlyData[monthKey].completed++;
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

    // Agency Performance Summary with project lists
    const agencyStats = {};
    const agencyProjects = {};
    
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyStats[agency]) {
        agencyStats[agency] = {
          name: agency,
          projects: 0,
          budget: 0,
          avgProgress: 0,
          totalProgress: 0,
          completed: 0,
          delayed: 0,
          critical: 0,
          onTrack: 0
        };
        agencyProjects[agency] = [];
      }
      agencyStats[agency].projects++;
      agencyStats[agency].budget += (d.sd_amount_lakh || 0);
      agencyStats[agency].totalProgress += d.physical_progress_percent || 0;
      
      // Store complete project data for modal
      agencyProjects[agency].push(d);
      
      // Calculate additional stats
      if (d.physical_progress_percent >= 100) agencyStats[agency].completed++;
      if (d.delay_days > 0) agencyStats[agency].delayed++;
      if (d.risk_level === 'CRITICAL') agencyStats[agency].critical++;
      if ((!d.delay_days || d.delay_days === 0) && d.physical_progress_percent > 0) agencyStats[agency].onTrack++;
    });

    const agencyPerformance = Object.values(agencyStats)
      .map(a => ({
        ...a,
        avgProgress: a.projects ? (a.totalProgress / a.projects).toFixed(1) : 0,
        completionRate: a.projects ? ((a.completed / a.projects) * 100).toFixed(1) : 0,
        delayRate: a.projects ? ((a.delayed / a.projects) * 100).toFixed(1) : 0,
        onTrackRate: a.projects ? ((a.onTrack / a.projects) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 5);

    return {
      executiveSummary,
      budgetOverview,
      monthlyTrend,
      riskDistribution,
      statusDistribution,
      agencyPerformance,
      agencyProjects
    };
  }, [data]);

  // Handle agency click to show modal
  const handleAgencyClick = (agencyName) => {
    const projects = metrics.agencyProjects[agencyName] || [];
    const stats = metrics.agencyPerformance.find(a => a.name === agencyName) || 
                   Object.values(metrics.agencyProjects).find((_, agency) => agency === agencyName);
    
    setSelectedAgency({
      name: agencyName,
      projects: projects,
      stats: stats
    });
    setShowAgencyModal(true);
  };

  // Handle project click from within agency modal
  const handleProjectClick = (project) => {
    setShowAgencyModal(false);
    onChartClick(project, 'project');
  };

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
                  ? formatAmount(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Agency Projects Modal
  const AgencyProjectsModal = () => {
    if (!showAgencyModal || !selectedAgency) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAgencyModal(false)}
        />
        
        <div className={`relative w-[90vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {selectedAgency.name} - Project Portfolio
                </h2>
                {selectedAgency.stats && (
                  <div className={`flex flex-wrap gap-4 text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                    <span>Total Projects: <strong>{selectedAgency.projects.length}</strong></span>
                    <span>•</span>
                    <span>Completed: <strong>{selectedAgency.stats.completed || 0}</strong></span>
                    <span>•</span>
                    <span>Avg Progress: <strong>{selectedAgency.stats.avgProgress || 0}%</strong></span>
                    <span>•</span>
                    <span>On Track: <strong>{selectedAgency.stats.onTrackRate || 0}%</strong></span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAgencyModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {selectedAgency.stats && (
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Total Budget</p>
                  <p className="text-lg font-bold">{formatAmount(selectedAgency.stats.budget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Projects</p>
                  <p className="text-lg font-bold">{selectedAgency.projects.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Completed</p>
                  <p className="text-lg font-bold text-green-600">{selectedAgency.stats.completed || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">On Track</p>
                  <p className="text-lg font-bold text-blue-600">{selectedAgency.stats.onTrack || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Delayed</p>
                  <p className="text-lg font-bold text-orange-600">{selectedAgency.stats.delayed || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Critical</p>
                  <p className="text-lg font-bold text-red-600">{selectedAgency.stats.critical || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* DataTable */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedAgency.projects}
              darkMode={darkMode}
              onRowClick={handleProjectClick}
              compareMode={false}
              selectedProjects={[]}
              isEmbedded={true}
              maxHeight="100%"
            />
          </div>
        </div>
      </div>
    );
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
                <span className="font-bold">{formatAmount(item.value)}</span>
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
                <Line yAxisId="right" type="monotone" dataKey="budget" stroke="#f97316" name="Budget (Lakh)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="spent" stroke="#a855f7" name="Spent (Lakh)" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Agencies Performance - Enhanced with click functionality */}
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
                onClick={() => handleAgencyClick(agency.name)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{agency.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{agency.projects} projects</span>
                    <Eye size={14} className="text-blue-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Budget: {formatAmount(agency.budget)}</span>
                  <span>Avg Progress: {agency.avgProgress}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-1 font-medium text-green-600">{agency.completed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">On Track:</span>
                    <span className="ml-1 font-medium text-blue-600">{agency.onTrack}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Delayed:</span>
                    <span className="ml-1 font-medium text-orange-600">{agency.delayed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Critical:</span>
                    <span className="ml-1 font-medium text-red-600">{agency.critical}</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                    style={{ width: `${agency.avgProgress}%` }}
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                  <p className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Click to view all {agency.projects} projects with filters & search</span>
                    <ArrowUp size={12} className="text-blue-500" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agency Projects Modal */}
      <AgencyProjectsModal />
    </div>
  );
};

export default Overview;