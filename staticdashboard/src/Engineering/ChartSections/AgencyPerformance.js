import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import {
  Users, Building2, TrendingUp, Award, AlertTriangle,
  Clock, IndianRupee, Target, Activity, BarChart3,
  CheckCircle, XCircle, Gauge, Shield, MapPin,
  X, Eye, Download, Filter, ArrowUpDown
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  performance: {
    excellent: '#10b981',
    good: '#3b82f6',
    average: '#f59e0b',
    poor: '#ef4444'
  },
  agencies: ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1'],
  metrics: {
    progress: '#3b82f6',
    efficiency: '#10b981',
    budget: '#f59e0b',
    timeline: '#8b5cf6',
    quality: '#ec4899'
  }
};

const AgencyPerformance = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);

  const agencyMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        agencyOverview: [],
        performanceRadar: [],
        budgetComparison: [],
        completionRates: [],
        delayAnalysis: [],
        riskDistribution: [],
        topPerformers: [],
        bottomPerformers: [],
        efficiencyMatrix: [],
        agencyProjects: {}
      };
    }

    // Aggregate data by agency
    const agencies = {};
    const agencyProjects = {};
    
    data.forEach(item => {
      const agency = item.executive_agency || 'Unknown';
      if (!agencies[agency]) {
        agencies[agency] = {
          name: agency,
          projects: 0,
          allocated: 0,
          spent: 0,
          completed: 0,
          delayed: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          onTrack: 0,
          totalProgress: 0,
          totalEfficiency: 0,
          totalDelay: 0,
          notStarted: 0,
          projectList: []
        };
        agencyProjects[agency] = [];
      }
      
      agencies[agency].projects++;
      agencies[agency].allocated += (item.sd_amount_lakh || 0);
      agencies[agency].spent += (item.expenditure_total || 0);
      agencies[agency].totalProgress += item.physical_progress_percent || 0;
      agencies[agency].totalEfficiency += item.efficiency_score || 0;
      agencies[agency].totalDelay += item.delay_days || 0;
      agencies[agency].projectList.push(item);
      
      // Store complete project data for modal
      agencyProjects[agency].push(item);
      
      if (item.physical_progress_percent >= 100) agencies[agency].completed++;
      if (item.physical_progress_percent === 0) agencies[agency].notStarted++;
      if (item.delay_days > 0) agencies[agency].delayed++;
      if (item.delay_days === 0 && item.physical_progress_percent > 0) agencies[agency].onTrack++;
      
      // Risk level distribution
      if (item.risk_level === 'CRITICAL') agencies[agency].critical++;
      else if (item.risk_level === 'HIGH') agencies[agency].high++;
      else if (item.risk_level === 'MEDIUM') agencies[agency].medium++;
      else if (item.risk_level === 'LOW') agencies[agency].low++;
    });

    // Calculate derived metrics
    const agencyOverview = Object.values(agencies)
      .map(a => ({
        ...a,
        avgProgress: a.projects ? (a.totalProgress / a.projects).toFixed(1) : 0,
        avgEfficiency: a.projects ? (a.totalEfficiency / a.projects).toFixed(1) : 0,
        avgDelay: a.projects ? (a.totalDelay / a.projects).toFixed(1) : 0,
        utilization: a.allocated ? ((a.spent / a.allocated) * 100).toFixed(1) : 0,
        completionRate: a.projects ? ((a.completed / a.projects) * 100).toFixed(1) : 0,
        delayRate: a.projects ? ((a.delayed / a.projects) * 100).toFixed(1) : 0,
        criticalRate: a.projects ? ((a.critical / a.projects) * 100).toFixed(1) : 0,
        onTrackRate: a.projects ? ((a.onTrack / a.projects) * 100).toFixed(1) : 0,
        performanceScore: a.projects ? (
          (a.totalProgress / a.projects) * 0.3 +
          (a.totalEfficiency / a.projects) * 0.3 +
          ((a.completed / a.projects) * 100) * 0.2 +
          ((1 - a.critical / a.projects) * 100) * 0.2
        ).toFixed(1) : 0
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);

    // Top 5 agencies for radar chart
    const topAgencies = agencyOverview.slice(0, 5);
    const radarMetrics = ['Progress', 'Efficiency', 'Utilization', 'On Track', 'Completion'];
    
    const performanceRadar = radarMetrics.map(metric => {
      const dataPoint = { metric };
      topAgencies.forEach(agency => {
        const agencyKey = agency.name.length > 15 ? agency.name.substring(0, 15) : agency.name;
        switch(metric) {
          case 'Progress':
            dataPoint[agencyKey] = parseFloat(agency.avgProgress);
            break;
          case 'Efficiency':
            dataPoint[agencyKey] = parseFloat(agency.avgEfficiency);
            break;
          case 'Utilization':
            dataPoint[agencyKey] = parseFloat(agency.utilization);
            break;
          case 'On Track':
            dataPoint[agencyKey] = parseFloat(agency.onTrackRate);
            break;
          case 'Completion':
            dataPoint[agencyKey] = parseFloat(agency.completionRate);
            break;
        }
      });
      return dataPoint;
    });

    // Budget comparison
    const budgetComparison = agencyOverview
      .slice(0, 10)
      .map(a => ({
        agency: a.name.length > 20 ? a.name.substring(0, 20) : a.name,
        fullName: a.name,
        allocated: parseFloat(a.allocated.toFixed(2)),
        spent: parseFloat(a.spent.toFixed(2)),
        remaining: parseFloat((a.allocated - a.spent).toFixed(2)),
        utilization: parseFloat(a.utilization)
      }));

    // Completion rates comparison
    const completionRates = agencyOverview
      .map(a => ({
        agency: a.name.length > 20 ? a.name.substring(0, 20) : a.name,
        fullName: a.name,
        completed: a.completed,
        ongoing: a.projects - a.completed - a.notStarted,
        notStarted: a.notStarted,
        total: a.projects,
        rate: parseFloat(a.completionRate)
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);

    // Risk distribution by agency
    const riskDistribution = agencyOverview
      .filter(a => a.projects > 5)
      .map(a => ({
        agency: a.name.length > 20 ? a.name.substring(0, 20) : a.name,
        fullName: a.name,
        critical: a.critical,
        high: a.high,
        medium: a.medium,
        low: a.low,
        criticalRate: parseFloat(a.criticalRate)
      }))
      .sort((a, b) => b.criticalRate - a.criticalRate)
      .slice(0, 8);

    // Top and bottom performers
    const topPerformers = agencyOverview.slice(0, 5);
    const bottomPerformers = agencyOverview
      .filter(a => a.projects > 5)
      .slice(-5)
      .reverse();

    // Efficiency matrix
    const efficiencyMatrix = agencyOverview
      .filter(a => a.projects > 5)
      .map(a => ({
        ...a,
        x: parseFloat(a.avgProgress),
        y: parseFloat(a.avgEfficiency),
        z: a.projects,
        name: a.name.length > 20 ? a.name.substring(0, 20) : a.name,
        fullName: a.name,
        budget: a.allocated,
        fill: parseFloat(a.performanceScore) > 70 ? COLORS.performance.excellent :
              parseFloat(a.performanceScore) > 50 ? COLORS.performance.good :
              parseFloat(a.performanceScore) > 30 ? COLORS.performance.average :
              COLORS.performance.poor
      }));

    return {
      agencyOverview,
      performanceRadar,
      budgetComparison,
      completionRates,
      riskDistribution,
      topPerformers,
      bottomPerformers,
      efficiencyMatrix,
      agencyProjects
    };
  }, [data]);

  // Handle agency click to show modal
  const handleAgencyClick = (agencyName) => {
    const projects = agencyMetrics.agencyProjects[agencyName] || [];
    setSelectedAgency({
      name: agencyName,
      projects: projects,
      stats: agencyMetrics.agencyOverview.find(a => a.name === agencyName)
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
        <div className={`p-2 rounded-lg shadow-lg backdrop-blur-sm border ${
          darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-100' : 'bg-white/95 border-gray-200'
        }`}>
          <p className="text-xs font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Agency Projects Modal using DataTable
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
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {selectedAgency.name} - Projects Portfolio
                </h2>
                {selectedAgency.stats && (
                  <div className={`flex flex-wrap gap-4 text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                    <span>Total Projects: <strong>{selectedAgency.stats.projects}</strong></span>
                    <span>•</span>
                    <span>Completed: <strong>{selectedAgency.stats.completed}</strong></span>
                    <span>•</span>
                    <span>Avg Progress: <strong>{selectedAgency.stats.avgProgress}%</strong></span>
                    <span>•</span>
                    <span>Performance Score: <strong>{selectedAgency.stats.performanceScore}</strong></span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAgencyModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {selectedAgency.stats && (
            <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Total Budget</p>
                  <p className="text-base font-bold">{formatAmount(selectedAgency.stats.allocated)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Spent</p>
                  <p className="text-base font-bold">{formatAmount(selectedAgency.stats.spent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Utilization</p>
                  <p className="text-base font-bold">{selectedAgency.stats.utilization}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">On Track</p>
                  <p className="text-base font-bold text-green-600">{selectedAgency.stats.onTrackRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Delayed</p>
                  <p className="text-base font-bold text-orange-600">{selectedAgency.stats.delayRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Critical Projects</p>
                  <p className="text-base font-bold text-red-600">{selectedAgency.stats.critical}</p>
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
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Agency Performance Overview */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Users size={18} className="text-blue-500" />
          Agency Performance Dashboard
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={agencyMetrics.agencyOverview.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 9, cursor: 'pointer' }}
                onClick={(e) => e && e.value && handleAgencyClick(e.value)}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar 
                yAxisId="left" 
                dataKey="projects" 
                fill="#3b82f6" 
                name="Projects"
                onClick={(data) => handleAgencyClick(data.name)}
                style={{ cursor: 'pointer' }}
              />
              <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Completed" />
              <Line yAxisId="right" type="monotone" dataKey="performanceScore" stroke="#3b82f6" name="Performance Score" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#8b5cf6" name="Avg Progress %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on agency names or bars to view detailed project list with search and filters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar */}
        {agencyMetrics.performanceRadar.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Target size={16} className="text-purple-500" />
              Top 5 Agencies Performance Comparison
            </h3>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={agencyMetrics.performanceRadar}>
                  <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  {agencyMetrics.topPerformers.slice(0, 5).map((agency, index) => {
                    const agencyKey = agency.name.length > 15 ? agency.name.substring(0, 15) : agency.name;
                    return (
                      <Radar
                        key={agency.name}
                        name={agencyKey}
                        dataKey={agencyKey}
                        stroke={COLORS.agencies[index]}
                        fill={COLORS.agencies[index]}
                        fillOpacity={0.3}
                      />
                    );
                  })}
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Efficiency Matrix */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity size={16} className="text-green-500" />
            Agency Efficiency Matrix
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="x" name="Avg Progress %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" name="Avg Efficiency %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter 
                  name="Agencies" 
                  data={agencyMetrics.efficiencyMatrix}
                  onClick={(data) => handleAgencyClick(data.fullName || data.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {agencyMetrics.efficiencyMatrix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2">Click on dots to explore agency projects</p>
        </div>
      </div>

      {/* Budget Allocation by Agency */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <IndianRupee size={16} className="text-green-500" />
          Agency Budget Allocation vs Utilization
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agencyMetrics.budgetComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="agency" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 9, cursor: 'pointer' }}
                onClick={(e) => e && e.value && handleAgencyClick(agencyMetrics.budgetComparison.find(a => a.agency === e.value)?.fullName || e.value)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="allocated" fill="#3b82f6" name="Allocated (Lakh)" onClick={(data) => handleAgencyClick(data.fullName)} style={{ cursor: 'pointer' }} />
              <Bar dataKey="spent" fill="#10b981" name="Spent (Lakh)" />
              <Bar dataKey="remaining" fill="#f59e0b" name="Remaining (Lakh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution by Agency */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Shield size={16} className="text-red-500" />
          Risk Distribution by Agency
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agencyMetrics.riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="agency" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 9, cursor: 'pointer' }}
                onClick={(e) => e && e.value && handleAgencyClick(agencyMetrics.riskDistribution.find(a => a.agency === e.value)?.fullName || e.value)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
              <Bar dataKey="high" stackId="a" fill="#f59e0b" name="High" />
              <Bar dataKey="medium" stackId="a" fill="#fbbf24" name="Medium" />
              <Bar dataKey="low" stackId="a" fill="#10b981" name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top vs Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Award size={16} className="text-green-500" />
            Top Performing Agencies
          </h3>
          <div className="space-y-3">
            {agencyMetrics.topPerformers.map((agency, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                }`}
                onClick={() => handleAgencyClick(agency.name)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{agency.name}</span>
                  <span className="text-green-600 font-bold text-base">{agency.performanceScore}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Projects:</span>
                    <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{agency.projects}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{agency.avgProgress}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">On Track:</span>
                    <span className="ml-1 font-medium text-green-600">{agency.onTrackRate}%</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-green-300 dark:border-green-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Click to view all {agency.projects} projects</span>
                    <Eye size={12} className="text-green-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Performers */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            Agencies Needing Attention
          </h3>
          <div className="space-y-3">
            {agencyMetrics.bottomPerformers.map((agency, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => handleAgencyClick(agency.name)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{agency.name}</span>
                  <span className="text-red-600 font-bold text-base">{agency.performanceScore}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Projects:</span>
                    <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{agency.projects}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Delayed:</span>
                    <span className="ml-1 font-medium text-red-600">{agency.delayRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Critical:</span>
                    <span className="ml-1 font-medium text-red-600">{agency.criticalRate}%</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Click to analyze {agency.projects} projects</span>
                    <Eye size={12} className="text-red-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Rates Table */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <CheckCircle size={16} className="text-blue-500" />
          Agency Completion Rates
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Agency</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Completed</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Ongoing</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Not Started</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Completion Rate</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {agencyMetrics.completionRates.map((agency, index) => (
                <tr 
                  key={index} 
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} transition-colors`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{agency.agency}</td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{agency.total}</td>
                  <td className="px-3 py-2 text-center text-green-600 font-medium">{agency.completed}</td>
                  <td className="px-3 py-2 text-center text-blue-600">{agency.ongoing}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{agency.notStarted}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold text-xs ${
                        agency.rate > 50 ? 'text-green-600' :
                        agency.rate > 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {agency.rate}%
                      </span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            agency.rate > 50 ? 'bg-green-500' :
                            agency.rate > 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${agency.rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleAgencyClick(agency.fullName)}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 mx-auto ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'
                      } transition-colors text-blue-600 dark:text-blue-400`}
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agency Projects Modal using DataTable */}
      <AgencyProjectsModal />
    </div>
  );
};

export default AgencyPerformance;