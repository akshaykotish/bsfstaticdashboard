import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap, FunnelChart, Funnel
} from 'recharts';
import {
  Shield, AlertTriangle, AlertCircle, Clock,
  TrendingUp, Target, Activity, BarChart3,
  AlertOctagon, CheckCircle, XCircle, Gauge,
  MapPin, Building2, IndianRupee, Users, X, Eye, Filter
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  risk: {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#fbbf24',
    LOW: '#10b981'
  },
  factors: {
    delay: '#ef4444',
    budget: '#f59e0b',
    progress: '#3b82f6',
    efficiency: '#a855f7',
    quality: '#10b981'
  },
  severity: {
    extreme: '#991b1b',
    high: '#dc2626',
    moderate: '#f59e0b',
    low: '#fbbf24',
    minimal: '#10b981'
  }
};

const RiskDashboard = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedRiskData, setSelectedRiskData] = useState(null);

  const riskMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        riskOverview: [],
        riskMatrix: [],
        riskFactors: [],
        riskByBudgetHead: [],
        riskByAgency: [],
        riskByLocation: [],
        mitigationPriority: [],
        riskTrend: [],
        criticalProjects: [],
        riskHeatmap: []
      };
    }

    // Risk Overview with project arrays
    const riskCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    const riskBudget = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    const riskProjects = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };

    data.forEach(d => {
      if (d.risk_level && riskCounts.hasOwnProperty(d.risk_level)) {
        riskCounts[d.risk_level]++;
        riskBudget[d.risk_level] += (d.sanctioned_amount || 0) / 100;
        riskProjects[d.risk_level].push(d);
      }
    });

    const riskOverview = Object.entries(riskCounts).map(([level, count]) => ({
      level,
      count,
      budget: riskBudget[level],
      percentage: data.length ? ((count / data.length) * 100).toFixed(1) : 0,
      fill: COLORS.risk[level],
      projects: riskProjects[level]
    }));

    // Risk Matrix
    const riskMatrix = data
      .slice(0, 200)
      .map(item => ({
        ...item,
        x: item.physical_progress || 0,
        y: item.delay_days || 0,
        z: item.sanctioned_amount / 100,
        name: item.scheme_name?.substring(0, 20) || 'Unknown',
        risk: item.risk_level,
        efficiency: item.efficiency_score || 0,
        budgetRisk: item.percent_expdr > 90 && item.physical_progress < 70,
        fill: COLORS.risk[item.risk_level] || '#94a3b8'
      }));

    // Risk Factors Analysis with project data
    const riskFactors = [
      {
        factor: 'Severe Delays (>90 days)',
        count: data.filter(d => d.delay_days > 90).length,
        severity: 'extreme',
        impact: 'High',
        projects: data.filter(d => d.delay_days > 90)
      },
      {
        factor: 'Budget Overrun',
        count: data.filter(d => d.percent_expdr > 100).length,
        severity: 'high',
        impact: 'High',
        projects: data.filter(d => d.percent_expdr > 100)
      },
      {
        factor: 'Low Progress (<25%)',
        count: data.filter(d => d.physical_progress < 25 && d.delay_days > 30).length,
        severity: 'high',
        impact: 'Medium',
        projects: data.filter(d => d.physical_progress < 25 && d.delay_days > 30)
      },
      {
        factor: 'Low Efficiency (<40%)',
        count: data.filter(d => d.efficiency_score < 40).length,
        severity: 'moderate',
        impact: 'Medium',
        projects: data.filter(d => d.efficiency_score < 40)
      },
      {
        factor: 'Stagnant Projects',
        count: data.filter(d => d.physical_progress === 0 && d.date_award && 
          (new Date() - new Date(d.date_award)) > 90 * 24 * 60 * 60 * 1000).length,
        severity: 'high',
        impact: 'High',
        projects: data.filter(d => d.physical_progress === 0 && d.date_award && 
          (new Date() - new Date(d.date_award)) > 90 * 24 * 60 * 60 * 1000)
      },
      {
        factor: 'High Budget Low Progress',
        count: data.filter(d => d.sanctioned_amount > 5000 && d.physical_progress < 30).length,
        severity: 'moderate',
        impact: 'High',
        projects: data.filter(d => d.sanctioned_amount > 5000 && d.physical_progress < 30)
      }
    ].map(factor => ({
      ...factor,
      percentage: data.length ? ((factor.count / data.length) * 100).toFixed(1) : 0,
      color: COLORS.severity[factor.severity]
    }));

    // Risk by Budget Head
    const riskByBudgetHead = {};
    data.forEach(d => {
      const head = d.budget_head || 'Unspecified';
      if (!riskByBudgetHead[head]) {
        riskByBudgetHead[head] = {
          head,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          budget: 0,
          projects: []
        };
      }
      riskByBudgetHead[head].total++;
      riskByBudgetHead[head].budget += (d.sanctioned_amount || 0) / 100;
      riskByBudgetHead[head][d.risk_level?.toLowerCase() || 'low']++;
      riskByBudgetHead[head].projects.push(d);
    });

    const riskByBudgetHeadArray = Object.values(riskByBudgetHead)
      .map(r => ({
        ...r,
        criticalRate: r.total ? ((r.critical / r.total) * 100).toFixed(1) : 0,
        highRiskRate: r.total ? (((r.critical + r.high) / r.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.criticalRate - a.criticalRate)
      .slice(0, 10);

    // Risk by Agency
    const riskByAgency = {};
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!riskByAgency[agency]) {
        riskByAgency[agency] = {
          agency,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          projects: []
        };
      }
      riskByAgency[agency].total++;
      riskByAgency[agency][d.risk_level?.toLowerCase() || 'low']++;
      riskByAgency[agency].projects.push(d);
    });

    const riskByAgencyArray = Object.values(riskByAgency)
      .map(r => ({
        ...r,
        riskScore: (r.critical * 4 + r.high * 3 + r.medium * 2 + r.low * 1) / r.total,
        criticalRate: r.total ? ((r.critical / r.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Risk by Location (Frontier HQ)
    const riskByLocation = {};
    data.forEach(d => {
      const location = d.ftr_hq || 'Unknown';
      if (!riskByLocation[location]) {
        riskByLocation[location] = {
          location,
          total: 0,
          critical: 0,
          high: 0,
          projects: [],
          criticalProjects: []
        };
      }
      riskByLocation[location].total++;
      riskByLocation[location].projects.push(d);
      if (d.risk_level === 'CRITICAL') {
        riskByLocation[location].critical++;
        riskByLocation[location].criticalProjects.push(d);
      }
      if (d.risk_level === 'HIGH') riskByLocation[location].high++;
    });

    const riskByLocationArray = Object.values(riskByLocation)
      .map(l => ({
        ...l,
        riskRate: l.total ? (((l.critical + l.high) / l.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.riskRate - a.riskRate)
      .slice(0, 8);

    // Mitigation Priority
    const mitigationPriority = data
      .filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH')
      .map(d => ({
        ...d,
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        risk: d.risk_level,
        budget: d.sanctioned_amount / 100,
        progress: d.physical_progress || 0,
        delay: d.delay_days || 0,
        efficiency: d.efficiency_score || 0,
        location: d.work_site || 'Unknown',
        ftr_hq: d.ftr_hq || 'N/A',
        shq: d.shq || 'N/A',
        contractor: d.firm_name || 'N/A',
        priorityScore: (
          (d.risk_level === 'CRITICAL' ? 100 : 50) +
          (d.sanctioned_amount / 1000) +
          (100 - d.physical_progress) +
          (d.delay_days / 10)
        ),
        issues: [
          d.delay_days > 90 && 'Severe Delay',
          d.percent_expdr > 100 && 'Budget Overrun',
          d.efficiency_score < 40 && 'Low Efficiency',
          d.physical_progress < 25 && 'Low Progress'
        ].filter(Boolean)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 20);

    // Risk Trend Analysis
    const riskTrend = [];
    const monthlyRisk = {};
    
    data.forEach(d => {
      if (d.date_award) {
        const date = new Date(d.date_award);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyRisk[monthKey]) {
            monthlyRisk[monthKey] = {
              month: monthKey,
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              total: 0
            };
          }
          monthlyRisk[monthKey].total++;
          monthlyRisk[monthKey][d.risk_level?.toLowerCase() || 'low']++;
        }
      }
    });

    Object.values(monthlyRisk)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => {
        item.criticalRate = item.total ? ((item.critical / item.total) * 100).toFixed(1) : 0;
        riskTrend.push(item);
      });

    // Critical Projects List
    const criticalProjects = data
      .filter(d => d.risk_level === 'CRITICAL')
      .sort((a, b) => b.sanctioned_amount - a.sanctioned_amount);

    // Risk Heatmap
    const riskHeatmap = [];
    const efficiencyRanges = [
      { label: '0-20%', min: 0, max: 20 },
      { label: '21-40%', min: 21, max: 40 },
      { label: '41-60%', min: 41, max: 60 },
      { label: '61-80%', min: 61, max: 80 },
      { label: '81-100%', min: 81, max: 100 }
    ];
    
    const budgetRanges = [
      { label: '<50L', min: 0, max: 50 },
      { label: '50-100L', min: 50, max: 100 },
      { label: '1-5Cr', min: 100, max: 500 },
      { label: '5-10Cr', min: 500, max: 1000 },
      { label: '>10Cr', min: 1000, max: Infinity }
    ];

    efficiencyRanges.forEach(eRange => {
      budgetRanges.forEach(bRange => {
        const projects = data.filter(d => 
          (d.efficiency_score || 0) >= eRange.min && (d.efficiency_score || 0) <= eRange.max &&
          (d.sanctioned_amount || 0) >= bRange.min && (d.sanctioned_amount || 0) <= bRange.max
        );
        
        const criticalCount = projects.filter(p => p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH').length;
        
        riskHeatmap.push({
          efficiency: eRange.label,
          budget: bRange.label,
          total: projects.length,
          critical: criticalCount,
          riskPercent: projects.length > 0 ? ((criticalCount / projects.length) * 100).toFixed(0) : 0,
          projects: projects
        });
      });
    });

    return {
      riskOverview,
      riskMatrix,
      riskFactors,
      riskByBudgetHead: riskByBudgetHeadArray,
      riskByAgency: riskByAgencyArray,
      riskByLocation: riskByLocationArray,
      mitigationPriority,
      riskTrend,
      criticalProjects,
      riskHeatmap
    };
  }, [data]);

  // Handle risk data click
  const handleRiskClick = (title, projects, stats = null) => {
    setSelectedRiskData({
      title,
      projects,
      stats
    });
    setShowRiskModal(true);
  };

  // Handle project click from modal
  const handleProjectClick = (project) => {
    setShowRiskModal(false);
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
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Risk Projects Modal using DataTable
  const RiskProjectsModal = () => {
    if (!showRiskModal || !selectedRiskData) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRiskModal(false)}
        />
        
        <div className={`relative w-[70vw] max-w-[1400px] h-[70vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-red-500 to-orange-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {selectedRiskData.title}
                </h2>
                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-red-100'}`}>
                  Total Projects: <strong>{selectedRiskData.projects.length}</strong>
                </div>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Stats Summary if available */}
          {selectedRiskData.stats && (
            <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedRiskData.stats.critical !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Critical</p>
                    <p className="text-lg font-bold text-red-600">{selectedRiskData.stats.critical}</p>
                  </div>
                )}
                {selectedRiskData.stats.high !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">High Risk</p>
                    <p className="text-lg font-bold text-orange-600">{selectedRiskData.stats.high}</p>
                  </div>
                )}
                {selectedRiskData.stats.avgDelay !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Avg Delay</p>
                    <p className="text-lg font-bold">{selectedRiskData.stats.avgDelay} days</p>
                  </div>
                )}
                {selectedRiskData.stats.totalBudget !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Total Budget</p>
                    <p className="text-lg font-bold">{formatAmount(selectedRiskData.stats.totalBudget)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DataTable */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedRiskData.projects}
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
      {/* Risk Overview Cards */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-red-500" />
          Risk Assessment Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {riskMetrics.riskOverview.map((risk, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105`}
              style={{ 
                borderColor: risk.fill,
                backgroundColor: risk.fill + '10'
              }}
              onClick={() => handleRiskClick(
                `${risk.level} Risk Projects (${risk.count})`,
                risk.projects,
                { totalBudget: risk.budget * 100 }
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold" style={{ color: risk.fill }}>
                  {risk.level}
                </span>
                <AlertTriangle size={16} style={{ color: risk.fill }} />
              </div>
              <div className="text-2xl font-bold">{risk.count}</div>
              <div className="text-xs text-gray-500 mt-1">{risk.percentage}% of total</div>
              <div className="text-xs text-gray-500">₹{risk.budget.toFixed(2)} Cr</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Matrix Scatter Plot */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Activity size={18} className="text-purple-500" />
          Risk Matrix: Progress vs Delay
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="x" name="Progress %" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="y" name="Delay (days)" domain={[0, 'dataMax']} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                name="Projects" 
                data={riskMetrics.riskMatrix}
                onClick={(data) => onChartClick(data, 'project')}
              >
                {riskMetrics.riskMatrix.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ cursor: 'pointer' }} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">Click on dots to view project details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-500" />
            Key Risk Factors
          </h3>
          <div className="space-y-3">
            {riskMetrics.riskFactors.map((factor, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:scale-[1.01] ${
                  darkMode ? 'bg-gray-900 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                style={{ borderLeftColor: factor.color }}
                onClick={() => handleRiskClick(
                  `${factor.factor} (${factor.count} projects)`,
                  factor.projects
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{factor.factor}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ 
                    backgroundColor: factor.color + '20',
                    color: factor.color
                  }}>
                    {factor.count} projects
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Impact: {factor.impact}</span>
                  <span>{factor.percentage}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk by Location */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            Risk by Frontier HQ
          </h3>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {riskMetrics.riskByLocation.map((loc, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} 
                  hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all`}
                onClick={() => handleRiskClick(
                  `Projects in ${loc.location} (${loc.total})`,
                  loc.projects,
                  { critical: loc.critical, high: loc.high }
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">{loc.location}</p>
                    <p className="text-xs text-gray-500">{loc.total} projects</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{loc.critical} Critical</div>
                    <div className="text-xs text-orange-600">{loc.high} High Risk</div>
                    <div className="text-xs font-medium">Risk Rate: {loc.riskRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk by Budget Head */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          Risk Distribution by Budget Head
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={riskMetrics.riskByBudgetHead.slice(0, 8)}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const budgetData = riskMetrics.riskByBudgetHead.find(b => b.head === data.activeLabel);
                  if (budgetData) {
                    handleRiskClick(
                      `Projects under ${budgetData.head} (${budgetData.total})`,
                      budgetData.projects,
                      { 
                        critical: budgetData.critical,
                        high: budgetData.high,
                        totalBudget: budgetData.budget * 100
                      }
                    );
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="head" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill={COLORS.risk.CRITICAL} name="Critical" />
              <Bar dataKey="high" stackId="a" fill={COLORS.risk.HIGH} name="High" />
              <Bar dataKey="medium" stackId="a" fill={COLORS.risk.MEDIUM} name="Medium" />
              <Bar dataKey="low" stackId="a" fill={COLORS.risk.LOW} name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={14} />
          Click on bars to view projects by budget head
        </p>
      </div>

      {/* Critical Projects Section */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-500" />
            Critical Risk Projects - Immediate Action Required
          </h3>
          <button
            onClick={() => handleRiskClick(
              `All Critical Risk Projects (${riskMetrics.criticalProjects.length})`,
              riskMetrics.criticalProjects
            )}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Eye size={14} />
            View All {riskMetrics.criticalProjects.length} Critical Projects
          </button>
        </div>
        
        {/* Preview of top critical projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskMetrics.criticalProjects.slice(0, 6).map((project, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] 
                border-red-500 bg-red-50 dark:bg-red-900/20`}
              onClick={() => onChartClick(project, 'project')}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm truncate flex-1" title={project.scheme_name}>
                  {project.scheme_name}
                </h4>
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  CRITICAL
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-gray-500" />
                  <span className="truncate">{project.work_site || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-gray-500" />
                  <span>FHQ: {project.ftr_hq || 'N/A'} | SHQ: {project.shq || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-gray-500" />
                  <span className="truncate">{project.firm_name || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-800">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <p className="font-semibold">₹{(project.sanctioned_amount / 100).toFixed(2)}Cr</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="font-semibold">{project.physical_progress || 0}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delay:</span>
                    <p className="font-semibold text-red-600">{project.delay_days || 0}d</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Trend */}
      {riskMetrics.riskTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Risk Trend Analysis
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskMetrics.riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke={COLORS.risk.CRITICAL} fill={COLORS.risk.CRITICAL} name="Critical" />
                <Area type="monotone" dataKey="high" stackId="1" stroke={COLORS.risk.HIGH} fill={COLORS.risk.HIGH} name="High" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke={COLORS.risk.MEDIUM} fill={COLORS.risk.MEDIUM} name="Medium" />
                <Area type="monotone" dataKey="low" stackId="1" stroke={COLORS.risk.LOW} fill={COLORS.risk.LOW} name="Low" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Heatmap */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Gauge size={18} className="text-purple-500" />
          Risk Heatmap: Efficiency vs Budget
        </h3>
        <div className="overflow-x-auto" style={{ maxHeight: '300px' }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <th className="px-2 py-2 text-left">Efficiency / Budget</th>
                {['<50L', '50-100L', '1-5Cr', '5-10Cr', '>10Cr'].map(range => (
                  <th key={range} className="px-2 py-2 text-center">{range}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].map(effRange => (
                <tr key={effRange}>
                  <td className="px-2 py-2 font-medium">{effRange}</td>
                  {['<50L', '50-100L', '1-5Cr', '5-10Cr', '>10Cr'].map(budgetRange => {
                    const cell = riskMetrics.riskHeatmap.find(
                      h => h.efficiency === effRange && h.budget === budgetRange
                    );
                    const riskPercent = parseInt(cell?.riskPercent || 0);
                    const bgColor = riskPercent > 60 ? '#ef4444' :
                                   riskPercent > 40 ? '#f59e0b' :
                                   riskPercent > 20 ? '#fbbf24' : '#10b981';
                    
                    return (
                      <td 
                        key={budgetRange}
                        className="px-2 py-2 text-center cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: bgColor + '30',
                          color: bgColor
                        }}
                        onClick={() => {
                          if (cell && cell.total > 0) {
                            handleRiskClick(
                              `Projects: ${effRange} Efficiency, ${budgetRange} Budget (${cell.total})`,
                              cell.projects
                            );
                          }
                        }}
                      >
                        <div className="font-bold">{cell?.total || 0}</div>
                        <div className="text-[10px]">{riskPercent}% risk</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Click on cells to view projects in that category</p>
      </div>

      {/* Mitigation Priority */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Target size={18} className="text-orange-500" />
            Priority Mitigation Actions
          </h3>
          <button
            onClick={() => handleRiskClick(
              `All High Priority Projects (${riskMetrics.mitigationPriority.length})`,
              riskMetrics.mitigationPriority
            )}
            className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Eye size={14} />
            View All Priority Projects
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {riskMetrics.mitigationPriority.slice(0, 6).map((project, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                project.risk === 'CRITICAL' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              }`}
              onClick={() => onChartClick(project, 'project')}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm truncate flex-1" title={project.project}>
                  {project.project}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  project.risk === 'CRITICAL' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {project.risk}
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-gray-500" />
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-gray-500" />
                  <span>FHQ: {project.ftr_hq} | SHQ: {project.shq}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-gray-500" />
                  <span className="truncate">{project.contractor}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <p className="font-semibold">₹{project.budget}Cr</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="font-semibold">{project.progress}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delay:</span>
                    <p className="font-semibold text-red-600">{project.delay}d</p>
                  </div>
                </div>
                {project.issues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-500 text-xs">Issues:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.issues.map((issue, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Projects Modal using DataTable */}
      <RiskProjectsModal />
    </div>
  );
};

export default RiskDashboard;