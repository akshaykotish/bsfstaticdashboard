import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap
} from 'recharts';
import {
  Target, Gauge, Activity, TrendingUp,
  Zap, Award, Clock, IndianRupee,
  BarChart3, AlertTriangle, CheckCircle, Building2,
  X, Eye, Filter, ArrowUpDown, Search, Download,
  Shield, Users, MapPin, Package, AlertCircle
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  efficiency: {
    excellent: '#10b981',
    good: '#3b82f6',
    average: '#f59e0b',
    poor: '#ef4444',
    critical: '#991b1b'
  },
  metrics: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  gradient: {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444'
  }
};

const EfficiencyMetrics = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showEfficiencyModal, setShowEfficiencyModal] = useState(false);
  const [selectedEfficiencyData, setSelectedEfficiencyData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const efficiencyData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        overallEfficiency: {},
        efficiencyDistribution: [],
        efficiencyByBudgetHead: [],
        efficiencyByAgency: [],
        efficiencyCorrelation: [],
        topPerformers: [],
        bottomPerformers: [],
        efficiencyTrend: [],
        efficiencyFactors: [],
        efficiencyByLocation: [],
        efficiencyByContractor: [],
        efficiencyProjectsMap: {}
      };
    }

    // Store projects by efficiency category
    const efficiencyProjectsMap = {};

    // Overall Efficiency Metrics with project arrays
    const totalProjects = data.length;
    const avgEfficiency = data.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / totalProjects;
    
    const excellentProjects = data.filter(d => d.efficiency_score >= 80);
    const goodProjects = data.filter(d => d.efficiency_score >= 60 && d.efficiency_score < 80);
    const averageProjects = data.filter(d => d.efficiency_score >= 40 && d.efficiency_score < 60);
    const poorProjects = data.filter(d => d.efficiency_score < 40);

    efficiencyProjectsMap['Excellent'] = excellentProjects;
    efficiencyProjectsMap['Good'] = goodProjects;
    efficiencyProjectsMap['Average'] = averageProjects;
    efficiencyProjectsMap['Poor'] = poorProjects;

    const overallEfficiency = {
      avgScore: avgEfficiency.toFixed(1),
      excellent: excellentProjects.length,
      good: goodProjects.length,
      average: averageProjects.length,
      poor: poorProjects.length,
      excellentRate: ((excellentProjects.length / totalProjects) * 100).toFixed(1),
      goodRate: ((goodProjects.length / totalProjects) * 100).toFixed(1),
      averageRate: ((averageProjects.length / totalProjects) * 100).toFixed(1),
      poorRate: ((poorProjects.length / totalProjects) * 100).toFixed(1),
      excellentProjects,
      goodProjects,
      averageProjects,
      poorProjects
    };

    // Efficiency Distribution with project arrays
    const efficiencyRanges = [
      { range: '0-20%', min: 0, max: 20, color: COLORS.efficiency.critical },
      { range: '21-40%', min: 21, max: 40, color: COLORS.efficiency.poor },
      { range: '41-60%', min: 41, max: 60, color: COLORS.efficiency.average },
      { range: '61-80%', min: 61, max: 80, color: COLORS.efficiency.good },
      { range: '81-100%', min: 81, max: 100, color: COLORS.efficiency.excellent }
    ];

    const efficiencyDistribution = efficiencyRanges.map(range => {
      const rangeProjects = data.filter(d => 
        d.efficiency_score >= range.min && d.efficiency_score <= range.max
      );
      
      efficiencyProjectsMap[range.range] = rangeProjects;
      
      return {
        ...range,
        count: rangeProjects.length,
        budget: rangeProjects.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0) / 100,
        projects: rangeProjects
      };
    });

    // Efficiency by Budget Head with project arrays
    const budgetHeadEfficiency = {};
    data.forEach(d => {
      const head = d.budget_head || 'Unspecified';
      if (!budgetHeadEfficiency[head]) {
        budgetHeadEfficiency[head] = {
          head,
          projects: 0,
          totalEfficiency: 0,
          budget: 0,
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
          projectList: []
        };
      }
      budgetHeadEfficiency[head].projects++;
      budgetHeadEfficiency[head].totalEfficiency += d.efficiency_score || 0;
      budgetHeadEfficiency[head].budget += (d.sanctioned_amount || 0) / 100;
      budgetHeadEfficiency[head].projectList.push(d);
      
      if (d.efficiency_score >= 80) budgetHeadEfficiency[head].excellent++;
      else if (d.efficiency_score >= 60) budgetHeadEfficiency[head].good++;
      else if (d.efficiency_score >= 40) budgetHeadEfficiency[head].average++;
      else budgetHeadEfficiency[head].poor++;
    });

    const efficiencyByBudgetHead = Object.values(budgetHeadEfficiency)
      .map(h => ({
        ...h,
        avgEfficiency: h.projects ? (h.totalEfficiency / h.projects).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency);

    // Efficiency by Agency with project arrays
    const agencyEfficiency = {};
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyEfficiency[agency]) {
        agencyEfficiency[agency] = {
          agency,
          projects: 0,
          totalEfficiency: 0,
          totalProgress: 0,
          totalBudgetUsed: 0,
          projectList: []
        };
      }
      agencyEfficiency[agency].projects++;
      agencyEfficiency[agency].totalEfficiency += d.efficiency_score || 0;
      agencyEfficiency[agency].totalProgress += d.physical_progress || 0;
      agencyEfficiency[agency].totalBudgetUsed += d.percent_expdr || 0;
      agencyEfficiency[agency].projectList.push(d);
    });

    const efficiencyByAgency = Object.values(agencyEfficiency)
      .map(a => ({
        ...a,
        avgEfficiency: a.projects ? (a.totalEfficiency / a.projects).toFixed(1) : 0,
        avgProgress: a.projects ? (a.totalProgress / a.projects).toFixed(1) : 0,
        avgBudgetUsed: a.projects ? (a.totalBudgetUsed / a.projects).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
      .slice(0, 10);

    // Efficiency by Location
    const locationEfficiency = {};
    data.forEach(d => {
      const location = d.ftr_hq || 'Unknown';
      if (!locationEfficiency[location]) {
        locationEfficiency[location] = {
          location,
          projects: 0,
          totalEfficiency: 0,
          excellentCount: 0,
          poorCount: 0,
          projectList: []
        };
      }
      locationEfficiency[location].projects++;
      locationEfficiency[location].totalEfficiency += d.efficiency_score || 0;
      locationEfficiency[location].projectList.push(d);
      
      if (d.efficiency_score >= 80) locationEfficiency[location].excellentCount++;
      if (d.efficiency_score < 40) locationEfficiency[location].poorCount++;
    });

    const efficiencyByLocation = Object.values(locationEfficiency)
      .map(l => ({
        ...l,
        avgEfficiency: l.projects ? (l.totalEfficiency / l.projects).toFixed(1) : 0,
        excellentRate: l.projects ? ((l.excellentCount / l.projects) * 100).toFixed(1) : 0,
        poorRate: l.projects ? ((l.poorCount / l.projects) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
      .slice(0, 10);

    // Efficiency by Contractor
    const contractorEfficiency = {};
    data.forEach(d => {
      const contractor = d.firm_name || 'Unknown';
      if (!contractorEfficiency[contractor]) {
        contractorEfficiency[contractor] = {
          contractor,
          projects: 0,
          totalEfficiency: 0,
          totalBudget: 0,
          projectList: []
        };
      }
      contractorEfficiency[contractor].projects++;
      contractorEfficiency[contractor].totalEfficiency += d.efficiency_score || 0;
      contractorEfficiency[contractor].totalBudget += (d.sanctioned_amount || 0) / 100;
      contractorEfficiency[contractor].projectList.push(d);
    });

    const efficiencyByContractor = Object.values(contractorEfficiency)
      .filter(c => c.projects > 2)
      .map(c => ({
        ...c,
        avgEfficiency: c.projects ? (c.totalEfficiency / c.projects).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
      .slice(0, 15);

    // Efficiency Correlation (Progress vs Budget vs Time)
    const efficiencyCorrelation = data
      .filter(d => d.sanctioned_amount > 0)
      .slice(0, 100)
      .map(d => ({
        ...d,
        x: d.physical_progress || 0,
        y: d.percent_expdr || 0,
        z: d.efficiency_score || 0,
        name: d.scheme_name?.substring(0, 20) || 'Unknown',
        delay: d.delay_days || 0,
        fill: d.efficiency_score >= 80 ? COLORS.efficiency.excellent :
              d.efficiency_score >= 60 ? COLORS.efficiency.good :
              d.efficiency_score >= 40 ? COLORS.efficiency.average :
              COLORS.efficiency.poor
      }));

    // Top and Bottom Performers - Keep all original data
    const sortedByEfficiency = data
      .filter(d => d.sanctioned_amount > 100)
      .sort((a, b) => b.efficiency_score - a.efficiency_score);

    const topPerformers = sortedByEfficiency
      .slice(0, 10)
      .map(d => ({
        ...d, // Keep all original data
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        efficiency: d.efficiency_score?.toFixed(1) || 0,
        progress: d.physical_progress || 0,
        budgetUsed: d.percent_expdr || 0,
        budget: (d.sanctioned_amount / 100).toFixed(2),
        agency: d.executive_agency || 'Unknown'
      }));

    const bottomPerformers = sortedByEfficiency
      .slice(-10)
      .reverse()
      .map(d => ({
        ...d, // Keep all original data
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        efficiency: d.efficiency_score?.toFixed(1) || 0,
        progress: d.physical_progress || 0,
        budgetUsed: d.percent_expdr || 0,
        budget: (d.sanctioned_amount / 100).toFixed(2),
        agency: d.executive_agency || 'Unknown',
        issues: [
          d.delay_days > 60 && 'Delayed',
          d.percent_expdr > 100 && 'Over Budget',
          d.physical_progress < 25 && 'Low Progress'
        ].filter(Boolean).join(', ')
      }));

    // Efficiency Trend
    const efficiencyTrend = [];
    const monthlyEfficiency = {};
    
    data.forEach(d => {
      if (d.date_award) {
        const date = new Date(d.date_award);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyEfficiency[monthKey]) {
            monthlyEfficiency[monthKey] = {
              month: monthKey,
              totalEfficiency: 0,
              projects: 0,
              excellentCount: 0,
              poorCount: 0,
              projectList: []
            };
          }
          monthlyEfficiency[monthKey].totalEfficiency += d.efficiency_score || 0;
          monthlyEfficiency[monthKey].projects++;
          monthlyEfficiency[monthKey].projectList.push(d);
          if (d.efficiency_score >= 80) monthlyEfficiency[monthKey].excellentCount++;
          if (d.efficiency_score < 40) monthlyEfficiency[monthKey].poorCount++;
        }
      }
    });

    Object.values(monthlyEfficiency)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => {
        item.avgEfficiency = item.projects ? (item.totalEfficiency / item.projects).toFixed(1) : 0;
        item.excellentRate = item.projects ? ((item.excellentCount / item.projects) * 100).toFixed(1) : 0;
        item.poorRate = item.projects ? ((item.poorCount / item.projects) * 100).toFixed(1) : 0;
        efficiencyTrend.push(item);
      });

    // Efficiency Factors Radar
    const efficiencyFactors = [
      { factor: 'Budget Utilization', score: (100 - Math.abs(50 - avgEfficiency)).toFixed(1) },
      { factor: 'Timeline Adherence', score: ((data.filter(d => d.delay_days === 0).length / totalProjects) * 100).toFixed(1) },
      { factor: 'Progress Rate', score: (data.reduce((sum, d) => sum + (d.physical_progress || 0), 0) / totalProjects).toFixed(1) },
      { factor: 'Quality Score', score: ((data.filter(d => d.efficiency_score >= 60).length / totalProjects) * 100).toFixed(1) },
      { factor: 'Resource Optimization', score: avgEfficiency.toFixed(1) }
    ];

    return {
      overallEfficiency,
      efficiencyDistribution,
      efficiencyByBudgetHead,
      efficiencyByAgency,
      efficiencyCorrelation,
      topPerformers,
      bottomPerformers,
      efficiencyTrend,
      efficiencyFactors,
      efficiencyByLocation,
      efficiencyByContractor,
      efficiencyProjectsMap
    };
  }, [data]);

  // Handle efficiency data click to show modal
  const handleEfficiencyClick = (title, projects, stats = null) => {
    setSelectedEfficiencyData({
      title,
      projects,
      stats
    });
    setShowEfficiencyModal(true);
  };

  // Handle project click from modal
  const handleProjectClick = (project) => {
    setShowEfficiencyModal(false);
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

  // Efficiency Projects Modal using DataTable
  const EfficiencyProjectsModal = () => {
    if (!showEfficiencyModal || !selectedEfficiencyData) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEfficiencyModal(false)}
        />
        
        <div className={`relative w-[90vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {selectedEfficiencyData.title}
                </h2>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                  Total Projects: <strong>{selectedEfficiencyData.projects.length}</strong>
                  {selectedEfficiencyData.stats && (
                    <>
                      {selectedEfficiencyData.stats.avgEfficiency && (
                        <span className="ml-4">Avg Efficiency: <strong>{selectedEfficiencyData.stats.avgEfficiency}%</strong></span>
                      )}
                      {selectedEfficiencyData.stats.totalBudget && (
                        <span className="ml-4">Total Budget: <strong>₹{(selectedEfficiencyData.stats.totalBudget / 100).toFixed(2)} Cr</strong></span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEfficiencyModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {selectedEfficiencyData.stats && Object.keys(selectedEfficiencyData.stats).length > 0 && (
            <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {selectedEfficiencyData.stats.excellent !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Excellent</p>
                    <p className="text-base font-bold text-green-600">{selectedEfficiencyData.stats.excellent}</p>
                  </div>
                )}
                {selectedEfficiencyData.stats.good !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Good</p>
                    <p className="text-base font-bold text-blue-600">{selectedEfficiencyData.stats.good}</p>
                  </div>
                )}
                {selectedEfficiencyData.stats.average !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Average</p>
                    <p className="text-base font-bold text-yellow-600">{selectedEfficiencyData.stats.average}</p>
                  </div>
                )}
                {selectedEfficiencyData.stats.poor !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Poor</p>
                    <p className="text-base font-bold text-red-600">{selectedEfficiencyData.stats.poor}</p>
                  </div>
                )}
                {selectedEfficiencyData.stats.avgProgress !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Avg Progress</p>
                    <p className="text-base font-bold">{selectedEfficiencyData.stats.avgProgress}%</p>
                  </div>
                )}
                {selectedEfficiencyData.stats.avgBudgetUsed !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Budget Used</p>
                    <p className="text-base font-bold">{selectedEfficiencyData.stats.avgBudgetUsed}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedEfficiencyData.projects}
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
      {/* Overall Efficiency Dashboard */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Gauge size={18} className="text-purple-500" />
          Efficiency Performance Dashboard
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-purple-600">{efficiencyData.overallEfficiency.avgScore}%</div>
            <div className="text-xs text-gray-500 mt-1">Average Score</div>
          </div>
          {[
            { label: 'Excellent', count: efficiencyData.overallEfficiency.excellent, rate: efficiencyData.overallEfficiency.excellentRate, color: COLORS.efficiency.excellent, projects: efficiencyData.overallEfficiency.excellentProjects },
            { label: 'Good', count: efficiencyData.overallEfficiency.good, rate: efficiencyData.overallEfficiency.goodRate, color: COLORS.efficiency.good, projects: efficiencyData.overallEfficiency.goodProjects },
            { label: 'Average', count: efficiencyData.overallEfficiency.average, rate: efficiencyData.overallEfficiency.averageRate, color: COLORS.efficiency.average, projects: efficiencyData.overallEfficiency.averageProjects },
            { label: 'Poor', count: efficiencyData.overallEfficiency.poor, rate: efficiencyData.overallEfficiency.poorRate, color: COLORS.efficiency.poor, projects: efficiencyData.overallEfficiency.poorProjects }
          ].map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105`}
              style={{ borderColor: item.color, backgroundColor: item.color + '10' }}
              onClick={() => handleEfficiencyClick(
                `${item.label} Efficiency Projects (${item.count})`,
                item.projects || [],
                { avgEfficiency: efficiencyData.overallEfficiency.avgScore }
              )}
            >
              <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-xs font-medium mt-1">{item.rate}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BarChart3 size={16} className="text-blue-500" />
            Efficiency Distribution
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={efficiencyData.efficiencyDistribution}
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    const range = efficiencyData.efficiencyDistribution.find(r => r.range === data.activeLabel);
                    if (range && range.projects) {
                      handleEfficiencyClick(
                        `Efficiency Range: ${range.range} (${range.count} projects)`,
                        range.projects,
                        { totalBudget: range.budget * 100 }
                      );
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" style={{ cursor: 'pointer' }}>
                  {efficiencyData.efficiencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <Eye size={12} />
            Click on bars to view projects in each efficiency range
          </p>
        </div>

        {/* Efficiency Factors Radar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Target size={16} className="text-green-500" />
            Efficiency Factors Analysis
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={efficiencyData.efficiencyFactors}>
                <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Efficiency Correlation Scatter */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Activity size={16} className="text-indigo-500" />
          Efficiency Correlation: Progress vs Budget Utilization
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="x" name="Progress %" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="y" name="Budget Used %" domain={[0, 120]} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter 
                name="Projects" 
                data={efficiencyData.efficiencyCorrelation}
                onClick={(data) => onChartClick(data, 'project')}
              >
                {efficiencyData.efficiencyCorrelation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ cursor: 'pointer' }} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">Click on dots to view project details</p>
      </div>

      {/* Agency Efficiency Comparison */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building2 size={16} className="text-orange-500" />
          Agency Efficiency Performance
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={efficiencyData.efficiencyByAgency}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const agency = efficiencyData.efficiencyByAgency.find(a => a.agency === data.activeLabel);
                  if (agency && agency.projectList) {
                    handleEfficiencyClick(
                      `${agency.agency} - Efficiency Analysis`,
                      agency.projectList,
                      { 
                        avgEfficiency: agency.avgEfficiency,
                        avgProgress: agency.avgProgress,
                        avgBudgetUsed: agency.avgBudgetUsed
                      }
                    );
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="agency" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="avgEfficiency" fill="#8b5cf6" name="Avg Efficiency %" style={{ cursor: 'pointer' }} />
              <Bar dataKey="avgProgress" fill="#3b82f6" name="Avg Progress %" />
              <Line type="monotone" dataKey="avgBudgetUsed" stroke="#f97316" name="Avg Budget Used %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on bars to view detailed project list for each agency
        </p>
      </div>

      {/* Location Efficiency Analysis */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <MapPin size={16} className="text-red-500" />
          Efficiency by Frontier HQ
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={efficiencyData.efficiencyByLocation}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const location = efficiencyData.efficiencyByLocation.find(l => l.location === data.activeLabel);
                  if (location && location.projectList) {
                    handleEfficiencyClick(
                      `${location.location} - Projects`,
                      location.projectList,
                      { 
                        avgEfficiency: location.avgEfficiency,
                        excellentRate: location.excellentRate,
                        poorRate: location.poorRate
                      }
                    );
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="avgEfficiency" fill="#8b5cf6" name="Avg Efficiency %" style={{ cursor: 'pointer' }} />
              <Bar dataKey="excellentRate" fill="#10b981" name="Excellent Rate %" />
              <Bar dataKey="poorRate" fill="#ef4444" name="Poor Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contractor Efficiency Performance */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Users size={16} className="text-cyan-500" />
          Top Contractors by Efficiency
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={efficiencyData.efficiencyByContractor}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const contractor = efficiencyData.efficiencyByContractor.find(c => c.contractor === data.activeLabel);
                  if (contractor && contractor.projectList) {
                    handleEfficiencyClick(
                      `${contractor.contractor} - Projects`,
                      contractor.projectList,
                      { 
                        avgEfficiency: contractor.avgEfficiency,
                        totalBudget: contractor.totalBudget * 100
                      }
                    );
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="contractor" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="avgEfficiency" fill="#06b6d4" name="Avg Efficiency %" style={{ cursor: 'pointer' }} />
              <Bar yAxisId="left" dataKey="projects" fill="#94a3b8" name="Projects" />
              <Line yAxisId="right" type="monotone" dataKey="totalBudget" stroke="#f97316" name="Budget (Cr)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on bars to view contractor's project portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Award size={16} className="text-green-500" />
            Top Efficiency Performers
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {efficiencyData.topPerformers.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                }`}
                onClick={() => onChartClick(project, 'project')}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold truncate flex-1 text-gray-900 dark:text-gray-100">{project.project}</span>
                  <span className="text-green-600 font-bold text-xs">{project.efficiency}%</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-gray-700 dark:text-gray-300">Progress: {project.progress}%</div>
                  <div className="text-gray-700 dark:text-gray-300">Budget: {project.budgetUsed}%</div>
                  <div className="text-gray-700 dark:text-gray-300">₹{project.budget} Cr</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const allTopPerformers = data
                .filter(d => d.sanctioned_amount > 100)
                .sort((a, b) => b.efficiency_score - a.efficiency_score)
                .slice(0, 50);
              handleEfficiencyClick('All Top Performing Projects', allTopPerformers);
            }}
            className="mt-3 w-full px-3 py-2 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={14} />
            View All Top Performers
          </button>
        </div>

        {/* Bottom Performers */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            Low Efficiency Projects
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {efficiencyData.bottomPerformers.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => onChartClick(project, 'project')}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold truncate flex-1 text-gray-900 dark:text-gray-100">{project.project}</span>
                  <span className="text-red-600 font-bold text-xs">{project.efficiency}%</span>
                </div>
                <div className="mt-2 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-gray-700 dark:text-gray-300">Progress: {project.progress}%</div>
                    <div className="text-gray-700 dark:text-gray-300">Budget: {project.budgetUsed}%</div>
                    <div className="text-gray-700 dark:text-gray-300">₹{project.budget} Cr</div>
                  </div>
                  {project.issues && (
                    <div className="mt-1 text-red-600">Issues: {project.issues}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const allBottomPerformers = data
                .filter(d => d.sanctioned_amount > 100)
                .sort((a, b) => a.efficiency_score - b.efficiency_score)
                .slice(0, 50);
              handleEfficiencyClick('All Low Efficiency Projects', allBottomPerformers);
            }}
            className="mt-3 w-full px-3 py-2 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={14} />
            View All Low Performers
          </button>
        </div>
      </div>

      {/* Efficiency Trend */}
      {efficiencyData.efficiencyTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <TrendingUp size={16} className="text-purple-500" />
            Efficiency Trend Analysis
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={efficiencyData.efficiencyTrend}
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    const month = efficiencyData.efficiencyTrend.find(m => m.month === data.activeLabel);
                    if (month && month.projectList) {
                      handleEfficiencyClick(
                        `Projects from ${month.month}`,
                        month.projectList,
                        { 
                          avgEfficiency: month.avgEfficiency,
                          excellentRate: month.excellentRate,
                          poorRate: month.poorRate
                        }
                      );
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="avgEfficiency" stroke="#8b5cf6" name="Avg Efficiency %" strokeWidth={2} />
                <Line type="monotone" dataKey="excellentRate" stroke="#10b981" name="Excellent Rate %" strokeWidth={2} />
                <Line type="monotone" dataKey="poorRate" stroke="#ef4444" name="Poor Rate %" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <Eye size={12} />
            Click on data points to view projects from specific months
          </p>
        </div>
      )}

      {/* Budget Head Efficiency Treemap */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Package size={16} className="text-indigo-500" />
          Efficiency by Budget Head
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={efficiencyData.efficiencyByBudgetHead.map(h => ({
                name: h.head,
                size: h.projects,
                value: parseFloat(h.avgEfficiency),
                excellent: h.excellent,
                poor: h.poor,
                projectList: h.projectList
              }))}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
              content={({ root, depth, x, y, width, height, index, name, value, excellent, poor, projectList }) => {
                const fontSize = width > 50 && height > 30 ? 11 : 9;
                const color = value > 80 ? COLORS.efficiency.excellent :
                            value > 60 ? COLORS.efficiency.good :
                            value > 40 ? COLORS.efficiency.average : COLORS.efficiency.poor;
                
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: color,
                        fillOpacity: 0.8,
                        stroke: darkMode ? '#374151' : '#fff',
                        strokeWidth: 2,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (projectList && projectList.length > 0) {
                          handleEfficiencyClick(
                            `${name} - Projects`,
                            projectList,
                            { 
                              avgEfficiency: value,
                              excellent: excellent,
                              poor: poor
                            }
                          );
                        }
                      }}
                    />
                    {width > 50 && height > 30 && (
                      <>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 - 10}
                          fill={darkMode ? '#fff' : '#000'}
                          fontSize={fontSize}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {name}
                        </text>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 + 5}
                          fill={darkMode ? '#e5e7eb' : '#374151'}
                          fontSize={fontSize - 2}
                          textAnchor="middle"
                        >
                          Eff: {value}%
                        </text>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 + 18}
                          fill={darkMode ? '#e5e7eb' : '#374151'}
                          fontSize={fontSize - 2}
                          textAnchor="middle"
                        >
                          E:{excellent} P:{poor}
                        </text>
                      </>
                    )}
                  </g>
                );
              }}
            />
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Size represents number of projects, color shows average efficiency. Click to explore projects.
        </p>
      </div>

      {/* Quick Stats */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Zap size={16} className="text-yellow-500" />
          Efficiency Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">High Efficiency</span>
              <CheckCircle size={14} className="text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-500">
              {data.filter(d => d.efficiency_score >= 80).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Score ≥ 80%
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Low Efficiency</span>
              <AlertCircle size={14} className="text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-500">
              {data.filter(d => d.efficiency_score < 40).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Score &lt; 40%
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Optimal Projects</span>
              <Target size={14} className="text-purple-500" />
            </div>
            <p className="text-xl font-bold text-purple-500">
              {data.filter(d => d.efficiency_score >= 60 && d.efficiency_score <= 100 && d.delay_days === 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Efficient & On Time
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Budget Impact</span>
              <IndianRupee size={14} className="text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-500">
              ₹{(data.filter(d => d.efficiency_score < 60)
                .reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0) / 100).toFixed(2)} Cr
            </p>
            <p className="text-xs text-gray-500 mt-1">
              In low efficiency projects
            </p>
          </div>
        </div>
      </div>

      {/* Efficiency Projects Modal */}
      <EfficiencyProjectsModal />
    </div>
  );
};

export default EfficiencyMetrics;