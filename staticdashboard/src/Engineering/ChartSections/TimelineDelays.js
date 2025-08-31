import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar,
  Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  Calendar, Clock, Timer, AlertTriangle,
  TrendingUp, Target, Activity, BarChart3,
  AlertCircle, CheckCircle, XCircle, Gauge, Building2,
  CalendarDays, TimerOff, Hourglass, MapPin, Users,
  IndianRupee, X, Eye, Filter, ArrowUpRight, ArrowDownRight,
  TrendingDown, Zap, Shield, Package
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  delay: {
    onTime: '#10b981',
    minor: '#fbbf24',
    moderate: '#f59e0b',
    severe: '#ef4444',
    critical: '#991b1b'
  },
  timeline: {
    early: '#10b981',
    onSchedule: '#3b82f6',
    behindSchedule: '#f59e0b',
    severelyBehind: '#ef4444'
  },
  phases: {
    notStarted: '#94a3b8',
    foundation: '#ec4899',
    structure: '#a855f7',
    finishing: '#3b82f6',
    finalStage: '#10b981',
    completed: '#22c55e'
  },
  months: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']
};

const TimelineDelays = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedDelayData, setSelectedDelayData] = useState(null);

  // Helper function to calculate delay days
  const calculateDelayDays = (project) => {
    if (!project) return 0;
    
    const today = new Date();
    
    // Try different date combinations to calculate delay
    if (project.actual_completion_date && project.pdc_agreement) {
      const actualDate = new Date(project.actual_completion_date);
      const pdcDate = new Date(project.pdc_agreement);
      if (!isNaN(actualDate.getTime()) && !isNaN(pdcDate.getTime())) {
        const delay = Math.floor((actualDate - pdcDate) / (1000 * 60 * 60 * 24));
        return Math.max(0, delay);
      }
    }
    
    // For ongoing projects, check against revised PDC or original PDC
    const targetDate = project.revised_pdc ? new Date(project.revised_pdc) : 
                      project.pdc_agreement ? new Date(project.pdc_agreement) : null;
    
    if (targetDate && !isNaN(targetDate.getTime()) && targetDate < today) {
      // Project is past its target date
      const delay = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
      return Math.max(0, delay);
    }
    
    // Check if we can calculate from time allowed
    if (project.date_award && project.time_allowed_days) {
      const awardDate = new Date(project.date_award);
      if (!isNaN(awardDate.getTime())) {
        const expectedEndDate = new Date(awardDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + parseInt(project.time_allowed_days));
        
        if (expectedEndDate < today) {
          const delay = Math.floor((today - expectedEndDate) / (1000 * 60 * 60 * 24));
          return Math.max(0, delay);
        }
      }
    }
    
    return 0;
  };

  // Process data to add calculated fields
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(project => {
      const delayDays = calculateDelayDays(project);
      const progress = parseFloat(project.physical_progress) || 0;
      const expenditure = parseFloat(project.percent_expdr) || 0;
      
      // Calculate efficiency
      const efficiency = expenditure > 0 ? Math.min(100, (progress / expenditure) * 100) : 
                        progress > 0 ? 100 : 0;
      
      // Determine risk level based on multiple factors
      let riskLevel = 'LOW';
      if (delayDays > 90 || (expenditure > 80 && progress < 50)) {
        riskLevel = 'CRITICAL';
      } else if (delayDays > 60 || (expenditure > 60 && progress < 40)) {
        riskLevel = 'HIGH';
      } else if (delayDays > 30 || (expenditure > 40 && progress < 30)) {
        riskLevel = 'MEDIUM';
      }
      
      // Determine status
      let status = 'NOT_STARTED';
      if (progress >= 100) status = 'COMPLETED';
      else if (progress >= 75) status = 'NEAR_COMPLETION';
      else if (progress >= 50) status = 'ADVANCED';
      else if (progress >= 25) status = 'IN_PROGRESS';
      else if (progress > 0) status = 'INITIAL';
      
      return {
        ...project,
        delay_days: delayDays,
        status: status,
        efficiency_score: efficiency,
        risk_level: riskLevel,
        health_score: Math.max(0, 100 - (delayDays / 3.65))
      };
    });
  }, [data]);

  const timelineMetrics = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return {
        delayOverview: [],
        delayDistribution: [],
        delayByPhase: [],
        delayByAgency: [],
        delayByBudgetHead: [],
        delayByLocation: [],
        delayByContractor: [],
        severeDelays: [],
        progressVsExpenditure: [],
        delayImpactAnalysis: [],
        criticalPathProjects: [],
        delayProjectsMap: {},
        projectsByProgress: [],
        delayTrendByProgress: []
      };
    }

    // Store projects by delay category
    const delayProjectsMap = {};

    // Delay Overview
    const delayCategories = [
      { category: 'On Time', min: -Infinity, max: 0, color: COLORS.delay.onTime, icon: CheckCircle },
      { category: 'Minor Delay', min: 1, max: 30, color: COLORS.delay.minor, icon: Clock },
      { category: 'Moderate Delay', min: 31, max: 60, color: COLORS.delay.moderate, icon: AlertCircle },
      { category: 'Severe Delay', min: 61, max: 90, color: COLORS.delay.severe, icon: AlertTriangle },
      { category: 'Critical Delay', min: 91, max: Infinity, color: COLORS.delay.critical, icon: XCircle }
    ];

    const delayOverview = delayCategories.map(cat => {
      const projects = processedData.filter(d => {
        const delay = d.delay_days || 0;
        return delay >= cat.min && delay <= cat.max;
      });
      
      delayProjectsMap[cat.category] = projects;
      
      return {
        ...cat,
        count: projects.length,
        percentage: processedData.length ? ((projects.length / processedData.length) * 100).toFixed(1) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.sanctioned_amount) || 0), 0),
        avgProgress: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (parseFloat(p.physical_progress) || 0), 0) / projects.length).toFixed(1)
          : 0,
        projects: projects
      };
    });

    // Delay Distribution
    const delayRanges = [
      { range: 'On Time', min: -Infinity, max: 0 },
      { range: '1-15 days', min: 1, max: 15 },
      { range: '16-30 days', min: 16, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '61-90 days', min: 61, max: 90 },
      { range: '91-180 days', min: 91, max: 180 },
      { range: '>180 days', min: 181, max: Infinity }
    ];

    const delayDistribution = delayRanges.map(range => {
      const rangeProjects = processedData.filter(d => {
        const delay = d.delay_days || 0;
        return delay >= range.min && delay <= range.max;
      });
      
      return {
        ...range,
        count: rangeProjects.length,
        projects: rangeProjects
      };
    });

    // Delay by Project Phase
    const phases = [
      { phase: 'Not Started', progressMin: 0, progressMax: 0, color: COLORS.phases.notStarted },
      { phase: 'Initial (1-25%)', progressMin: 1, progressMax: 25, color: COLORS.phases.foundation },
      { phase: 'In Progress (26-50%)', progressMin: 26, progressMax: 50, color: COLORS.phases.structure },
      { phase: 'Advanced (51-75%)', progressMin: 51, progressMax: 75, color: COLORS.phases.finishing },
      { phase: 'Near Completion (76-99%)', progressMin: 76, progressMax: 99, color: COLORS.phases.finalStage },
      { phase: 'Completed', progressMin: 100, progressMax: 100, color: COLORS.phases.completed }
    ];

    const delayByPhase = phases.map(phase => {
      const phaseProjects = processedData.filter(d => {
        const progress = parseFloat(d.physical_progress) || 0;
        return progress >= phase.progressMin && progress <= phase.progressMax;
      });
      
      const delayedProjects = phaseProjects.filter(p => (p.delay_days || 0) > 0);
      
      return {
        ...phase,
        projects: phaseProjects.length,
        avgDelay: phaseProjects.length > 0
          ? (phaseProjects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / phaseProjects.length).toFixed(1)
          : 0,
        delayedCount: delayedProjects.length,
        delayRate: phaseProjects.length > 0
          ? ((delayedProjects.length / phaseProjects.length) * 100).toFixed(1)
          : 0,
        projectList: phaseProjects
      };
    });

    // Delay by Agency
    const agencyDelays = {};
    processedData.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyDelays[agency]) {
        agencyDelays[agency] = {
          agency,
          totalProjects: 0,
          delayedProjects: 0,
          totalDelay: 0,
          onTimeProjects: 0,
          projects: []
        };
      }
      agencyDelays[agency].totalProjects++;
      agencyDelays[agency].projects.push(d);
      
      if (d.delay_days > 0) {
        agencyDelays[agency].delayedProjects++;
        agencyDelays[agency].totalDelay += d.delay_days;
      } else {
        agencyDelays[agency].onTimeProjects++;
      }
    });

    const delayByAgency = Object.values(agencyDelays)
      .map(a => ({
        ...a,
        avgDelay: a.delayedProjects > 0 
          ? (a.totalDelay / a.delayedProjects).toFixed(1)
          : 0,
        delayRate: a.totalProjects > 0
          ? ((a.delayedProjects / a.totalProjects) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => parseFloat(b.avgDelay) - parseFloat(a.avgDelay))
      .slice(0, 10);

    // Delay by Location
    const locationDelays = {};
    processedData.forEach(d => {
      const location = d.ftr_hq || 'Unknown';
      if (!locationDelays[location]) {
        locationDelays[location] = {
          location,
          totalProjects: 0,
          delayedProjects: 0,
          totalDelay: 0,
          projects: []
        };
      }
      locationDelays[location].totalProjects++;
      locationDelays[location].projects.push(d);
      
      if (d.delay_days > 0) {
        locationDelays[location].delayedProjects++;
        locationDelays[location].totalDelay += d.delay_days;
      }
    });

    const delayByLocation = Object.values(locationDelays)
      .map(l => ({
        ...l,
        avgDelay: l.delayedProjects > 0 
          ? (l.totalDelay / l.delayedProjects).toFixed(1)
          : 0,
        delayRate: l.totalProjects > 0
          ? ((l.delayedProjects / l.totalProjects) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => parseFloat(b.avgDelay) - parseFloat(a.avgDelay))
      .slice(0, 8);

    // Delay by Contractor
    const contractorDelays = {};
    processedData.forEach(d => {
      const contractor = d.firm_name || 'Unknown';
      if (!contractorDelays[contractor]) {
        contractorDelays[contractor] = {
          contractor,
          totalProjects: 0,
          delayedProjects: 0,
          totalDelay: 0,
          projects: []
        };
      }
      contractorDelays[contractor].totalProjects++;
      contractorDelays[contractor].projects.push(d);
      
      if (d.delay_days > 0) {
        contractorDelays[contractor].delayedProjects++;
        contractorDelays[contractor].totalDelay += d.delay_days;
      }
    });

    const delayByContractor = Object.values(contractorDelays)
      .filter(c => c.totalProjects > 2)
      .map(c => ({
        ...c,
        avgDelay: c.delayedProjects > 0 
          ? (c.totalDelay / c.delayedProjects).toFixed(1)
          : 0,
        performanceScore: c.totalProjects > 0
          ? (100 - (c.delayedProjects / c.totalProjects * 100)).toFixed(1)
          : 100
      }))
      .sort((a, b) => parseFloat(b.avgDelay) - parseFloat(a.avgDelay))
      .slice(0, 10);

    // Delay by Budget Head
    const budgetHeadDelays = {};
    processedData.forEach(d => {
      const head = d.budget_head || 'Unspecified';
      if (!budgetHeadDelays[head]) {
        budgetHeadDelays[head] = {
          head,
          totalProjects: 0,
          delayedProjects: 0,
          totalDelay: 0,
          budget: 0,
          projects: []
        };
      }
      budgetHeadDelays[head].totalProjects++;
      budgetHeadDelays[head].budget += parseFloat(d.sanctioned_amount) || 0;
      budgetHeadDelays[head].projects.push(d);
      
      if (d.delay_days > 0) {
        budgetHeadDelays[head].delayedProjects++;
        budgetHeadDelays[head].totalDelay += d.delay_days;
      }
    });

    const delayByBudgetHead = Object.values(budgetHeadDelays)
      .map(h => ({
        ...h,
        avgDelay: h.delayedProjects > 0 
          ? (h.totalDelay / h.delayedProjects).toFixed(1)
          : 0,
        delayRate: h.totalProjects > 0
          ? ((h.delayedProjects / h.totalProjects) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => parseFloat(b.avgDelay) - parseFloat(a.avgDelay));

    // Severe Delays List
    const severeDelays = processedData
      .filter(d => d.delay_days > 60)
      .map(d => ({
        ...d,
        project: d.scheme_name?.substring(0, 35) || 'Unknown',
        delay: d.delay_days,
        progress: parseFloat(d.physical_progress) || 0,
        budget: parseFloat(d.sanctioned_amount) || 0,
        agency: d.executive_agency || 'Unknown',
        contractor: d.firm_name || 'Unknown',
        location: d.work_site || 'Unknown',
        delayCategory: d.delay_days > 180 ? 'Extreme' :
                      d.delay_days > 120 ? 'Critical' :
                      d.delay_days > 90 ? 'Severe' : 'High',
        efficiency: d.efficiency_score || 0,
        riskLevel: d.risk_level || 'N/A'
      }))
      .sort((a, b) => b.delay - a.delay);

    // Progress vs Expenditure Analysis (Alternative to Timeline Adherence)
    const progressVsExpenditure = processedData
      .filter(d => parseFloat(d.physical_progress) >= 0 && parseFloat(d.percent_expdr) >= 0)
      .map(d => ({
        ...d,
        x: parseFloat(d.percent_expdr) || 0,
        y: parseFloat(d.physical_progress) || 0,
        delay: d.delay_days || 0,
        name: d.scheme_name?.substring(0, 20) || 'Unknown',
        efficiency: d.efficiency_score,
        color: d.delay_days > 60 ? COLORS.delay.severe :
               d.delay_days > 30 ? COLORS.delay.moderate :
               d.delay_days > 0 ? COLORS.delay.minor : COLORS.delay.onTime
      }));

    // Delay Impact Analysis
    const delayImpactAnalysis = [
      {
        impact: 'Schedule Impact',
        value: processedData.filter(d => d.delay_days > 0).length,
        percentage: processedData.length > 0 
          ? (processedData.filter(d => d.delay_days > 0).length / processedData.length * 100).toFixed(1)
          : 0,
        color: '#ef4444'
      },
      {
        impact: 'Budget at Risk',
        value: processedData.filter(d => d.delay_days > 60)
          .reduce((sum, p) => sum + (parseFloat(p.sanctioned_amount) || 0), 0),
        percentage: processedData.reduce((sum, p) => sum + (parseFloat(p.sanctioned_amount) || 0), 0) > 0
          ? (processedData.filter(d => d.delay_days > 60)
              .reduce((sum, p) => sum + (parseFloat(p.sanctioned_amount) || 0), 0) / 
             processedData.reduce((sum, p) => sum + (parseFloat(p.sanctioned_amount) || 0), 0) * 100).toFixed(1)
          : 0,
        color: '#f59e0b'
      },
      {
        impact: 'Critical Delays',
        value: processedData.filter(d => d.delay_days > 90).length,
        percentage: processedData.length > 0
          ? (processedData.filter(d => d.delay_days > 90).length / processedData.length * 100).toFixed(1)
          : 0,
        color: '#991b1b'
      }
    ];

    // Critical Path Projects
    const criticalPathProjects = processedData
      .filter(d => parseFloat(d.sanctioned_amount) > 50 && d.delay_days > 30)
      .map(d => ({
        ...d,
        criticality: (d.delay_days / 100) * (parseFloat(d.sanctioned_amount) / 100) * 
                    (100 - parseFloat(d.physical_progress || 0)) / 100
      }))
      .sort((a, b) => b.criticality - a.criticality)
      .slice(0, 20);

    // Projects by Progress Range (for pie chart)
    const progressRanges = [
      { name: 'Not Started', min: 0, max: 0, color: '#94a3b8' },
      { name: '1-25%', min: 1, max: 25, color: '#ec4899' },
      { name: '26-50%', min: 26, max: 50, color: '#a855f7' },
      { name: '51-75%', min: 51, max: 75, color: '#3b82f6' },
      { name: '76-99%', min: 76, max: 99, color: '#10b981' },
      { name: 'Completed', min: 100, max: 100, color: '#22c55e' }
    ];

    const projectsByProgress = progressRanges.map(range => {
      const projects = processedData.filter(d => {
        const progress = parseFloat(d.physical_progress) || 0;
        return progress >= range.min && progress <= range.max;
      });
      return {
        ...range,
        value: projects.length,
        projects: projects
      };
    });

    // Delay Trend by Progress Range
    const delayTrendByProgress = progressRanges.map(range => {
      const projects = processedData.filter(d => {
        const progress = parseFloat(d.physical_progress) || 0;
        return progress >= range.min && progress <= range.max;
      });
      
      const delayedCount = projects.filter(p => p.delay_days > 0).length;
      const avgDelay = projects.length > 0
        ? projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length
        : 0;
      
      return {
        progress: range.name,
        totalProjects: projects.length,
        delayedProjects: delayedCount,
        avgDelay: avgDelay.toFixed(1),
        delayRate: projects.length > 0 ? (delayedCount / projects.length * 100).toFixed(1) : 0
      };
    });

    return {
      delayOverview,
      delayDistribution,
      delayByPhase,
      delayByAgency,
      delayByBudgetHead,
      delayByLocation,
      delayByContractor,
      severeDelays,
      progressVsExpenditure,
      delayImpactAnalysis,
      criticalPathProjects,
      delayProjectsMap,
      projectsByProgress,
      delayTrendByProgress
    };
  }, [processedData]);

  // Handle delay data click to show modal
  const handleDelayClick = (title, projects, stats = null) => {
    setSelectedDelayData({
      title,
      projects,
      stats
    });
    setShowDelayModal(true);
  };

  // Handle project click from modal
  const handleProjectClick = (project) => {
    setShowDelayModal(false);
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

  // Delay Projects Modal
  const DelayProjectsModal = () => {
    if (!showDelayModal || !selectedDelayData) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDelayModal(false)}
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
                  {selectedDelayData.title}
                </h2>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                  Total Projects: <strong>{selectedDelayData.projects.length}</strong>
                </div>
              </div>
              <button
                onClick={() => setShowDelayModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedDelayData.projects}
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
      {/* Delay Overview Cards */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Clock size={18} className="text-orange-500" />
          Timeline & Delay Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {timelineMetrics.delayOverview.map((cat, index) => {
            const IconComponent = cat.icon || Clock;
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105`}
                style={{ 
                  borderColor: cat.color,
                  backgroundColor: cat.color + '10'
                }}
                onClick={() => handleDelayClick(
                  `${cat.category} (${cat.count} projects)`,
                  cat.projects
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold" style={{ color: cat.color }}>
                    {cat.category}
                  </span>
                  <IconComponent size={14} style={{ color: cat.color }} />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{cat.count}</div>
                <div className="text-xs text-gray-500 mt-1">{cat.percentage}%</div>
                <div className="text-xs text-gray-500">₹{(cat.totalBudget / 100).toFixed(2)} Cr</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delay Distribution Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BarChart3 size={16} className="text-blue-500" />
            Delay Distribution
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={timelineMetrics.delayDistribution}
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    const range = timelineMetrics.delayDistribution.find(r => r.range === data.activeLabel);
                    if (range && range.projects.length > 0) {
                      handleDelayClick(`Projects: ${range.range}`, range.projects);
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f97316" name="Projects">
                  {timelineMetrics.delayDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.min <= 0 ? COLORS.delay.onTime :
                            entry.min <= 30 ? COLORS.delay.minor :
                            entry.min <= 60 ? COLORS.delay.moderate :
                            entry.min <= 90 ? COLORS.delay.severe : COLORS.delay.critical}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Progress Stage */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity size={16} className="text-purple-500" />
            Projects by Progress Stage
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timelineMetrics.projectsByProgress}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => {
                    if (data && data.projects) {
                      handleDelayClick(`${data.name} Progress Projects`, data.projects);
                    }
                  }}
                >
                  {timelineMetrics.projectsByProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Delay by Project Phase */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <TrendingUp size={16} className="text-green-500" />
          Delay Analysis by Project Phase
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={timelineMetrics.delayByPhase}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const phase = timelineMetrics.delayByPhase.find(p => p.phase === data.activeLabel);
                  if (phase && phase.projectList.length > 0) {
                    handleDelayClick(`${phase.phase} Projects`, phase.projectList);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="phase" angle={-20} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="projects" fill="#3b82f6" name="Total Projects" />
              <Bar yAxisId="left" dataKey="delayedCount" fill="#ef4444" name="Delayed Projects" />
              <Line yAxisId="right" type="monotone" dataKey="avgDelay" stroke="#f59e0b" name="Avg Delay (days)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress vs Expenditure Scatter Plot */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Gauge size={16} className="text-purple-500" />
          Progress vs Expenditure Analysis
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="x" 
                name="Expenditure %" 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Expenditure (%)', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
              />
              <YAxis 
                dataKey="y" 
                name="Progress %" 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Physical Progress (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name="Projects" 
                data={timelineMetrics.progressVsExpenditure}
                onClick={(data) => onChartClick(data, 'project')}
              >
                {timelineMetrics.progressVsExpenditure.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                ))}
              </Scatter>
              {/* Ideal line (diagonal) */}
              <Line 
                data={[{x: 0, y: 0}, {x: 100, y: 100}]} 
                stroke="#94a3b8" 
                strokeDasharray="5 5" 
                dot={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Points above the diagonal line indicate good efficiency (progress &gt; expenditure). 
          Color indicates delay severity.
        </p>
      </div>

      {/* Agency Delay Performance */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building2 size={16} className="text-indigo-500" />
          Agency Delay Performance
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={timelineMetrics.delayByAgency}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  const agency = timelineMetrics.delayByAgency.find(a => a.agency === data.activeLabel);
                  if (agency) {
                    handleDelayClick(`${agency.agency} Projects`, agency.projects);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="agency" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="delayedProjects" fill="#ef4444" name="Delayed" />
              <Bar dataKey="onTimeProjects" fill="#10b981" name="On Time" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severe Delays Table */}
      {timelineMetrics.severeDelays.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <AlertTriangle size={16} className="text-orange-500" />
              Projects with Severe Delays (&gt;60 days)
            </h3>
            <button
              onClick={() => handleDelayClick(
                `All Severely Delayed Projects (${timelineMetrics.severeDelays.length})`,
                timelineMetrics.severeDelays
              )}
              className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Eye size={12} />
              View All {timelineMetrics.severeDelays.length} Projects
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Project</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Delay</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Progress</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Efficiency</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Budget (Cr)</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Risk</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Category</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {timelineMetrics.severeDelays.slice(0, 8).map((project, index) => (
                  <tr 
                    key={index} 
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} cursor-pointer transition-colors`}
                    onClick={() => onChartClick(project, 'project')}
                  >
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-medium truncate max-w-[250px] text-gray-900 dark:text-gray-100" title={project.project}>
                          {project.project}
                        </p>
                        <p className="text-xs text-gray-500">{project.location}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-red-600">{project.delay} days</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-blue-500"
                            style={{ width: `${Math.min(100, project.progress)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium text-xs ${
                        project.efficiency > 70 ? 'text-green-600' :
                        project.efficiency > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {project.efficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">₹{(project.budget / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        project.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        project.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        project.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        project.delayCategory === 'Extreme' ? 'bg-purple-100 text-purple-700' :
                        project.delayCategory === 'Critical' ? 'bg-red-100 text-red-700' :
                        project.delayCategory === 'Severe' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.delayCategory}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delay by Budget Head Treemap */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Package size={16} className="text-indigo-500" />
          Delay Analysis by Budget Head
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={timelineMetrics.delayByBudgetHead.map(h => ({
                name: h.head,
                size: h.totalProjects,
                value: parseFloat(h.avgDelay),
                delayRate: h.delayRate,
                projects: h.projects
              }))}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
              content={({ root, depth, x, y, width, height, index, name, value, delayRate, projects }) => {
                const fontSize = width > 50 && height > 30 ? 11 : 9;
                const color = value > 60 ? COLORS.delay.severe :
                            value > 30 ? COLORS.delay.moderate :
                            value > 0 ? COLORS.delay.minor : COLORS.delay.onTime;
                
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
                        if (projects && projects.length > 0) {
                          handleDelayClick(`${name} Projects`, projects);
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
                          Avg: {value}d
                        </text>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 + 18}
                          fill={darkMode ? '#e5e7eb' : '#374151'}
                          fontSize={fontSize - 2}
                          textAnchor="middle"
                        >
                          {delayRate}% delayed
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
          Size represents number of projects, color intensity shows average delay severity. Click to explore.
        </p>
      </div>

      {/* Quick Delay Statistics */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Zap size={16} className="text-yellow-500" />
          Quick Delay Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Delayed</span>
              <AlertTriangle size={14} className="text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-500">
              {processedData.filter(d => d.delay_days > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {processedData.length > 0 
                ? ((processedData.filter(d => d.delay_days > 0).length / processedData.length) * 100).toFixed(1)
                : 0}% of all projects
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Average Delay</span>
              <Clock size={14} className="text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-500">
              {processedData.filter(d => d.delay_days > 0).length > 0
                ? (processedData.filter(d => d.delay_days > 0).reduce((sum, d) => sum + d.delay_days, 0) / 
                   processedData.filter(d => d.delay_days > 0).length).toFixed(1)
                : 0} days
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For delayed projects only
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Max Delay</span>
              <TimerOff size={14} className="text-purple-500" />
            </div>
            <p className="text-xl font-bold text-purple-500">
              {Math.max(0, ...processedData.map(d => d.delay_days || 0))} days
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Longest delay in portfolio
            </p>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Budget Impact</span>
              <IndianRupee size={14} className="text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-500">
              ₹{(processedData.filter(d => d.delay_days > 30)
                .reduce((sum, d) => sum + (parseFloat(d.sanctioned_amount) || 0), 0) / 100).toFixed(2)} Cr
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Budget in delayed projects (&gt;30d)
            </p>
          </div>
        </div>
      </div>

      {/* Delay Trend Indicators */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <TrendingDown size={16} className="text-red-500" />
          Delay Trend Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border-l-4 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`} style={{ borderLeftColor: '#10b981' }}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight size={14} className="text-green-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Improving</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Projects showing reduced delays in recent months
            </p>
            <p className="text-base font-bold text-green-600 mt-2">
              Monitor Closely
            </p>
          </div>

          <div className={`p-3 rounded-lg border-l-4 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`} style={{ borderLeftColor: '#f59e0b' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Stable</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Projects maintaining consistent delay patterns
            </p>
            <p className="text-base font-bold text-orange-600 mt-2">
              {processedData.filter(d => d.delay_days > 0 && d.delay_days <= 30).length} Projects
            </p>
          </div>

          <div className={`p-3 rounded-lg border-l-4 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`} style={{ borderLeftColor: '#ef4444' }}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight size={14} className="text-red-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Worsening</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Projects with increasing delays requiring attention
            </p>
            <p className="text-base font-bold text-red-600 mt-2">
              {processedData.filter(d => d.delay_days > 90).length} Critical
            </p>
          </div>
        </div>
      </div>

      {/* Delay Projects Modal */}
      <DelayProjectsModal />
    </div>
  );
};

export default TimelineDelays;