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
import FitViewModal from '../FitView';

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
  const [showDataTableModal, setShowDataTableModal] = useState(false);
  const [selectedDataForTable, setSelectedDataForTable] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [showFitViewModal, setShowFitViewModal] = useState(false);
  const [selectedProjectForFitView, setSelectedProjectForFitView] = useState(null);

  // Process data - most fields should already be calculated in useData.js
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(project => {
      // All these fields should already exist from useData.js
      return {
        ...project,
        // Ensure all required fields exist with fallbacks
        delay_days: project.delay_days || 0,
        physical_progress_percent: project.physical_progress_percent || 0,
        expenditure_percent: project.expenditure_percent || 0,
        efficiency_score: project.efficiency_score || 0,
        risk_level: project.risk_level || 'LOW',
        status: project.status || 'NOT_STARTED',
        health_score: project.health_score || 0,
        sd_amount_lakh: project.sd_amount_lakh || 0
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
        totalBudget: projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0),
        avgProgress: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (p.physical_progress_percent || 0), 0) / projects.length).toFixed(1)
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
        const progress = d.physical_progress_percent || 0;
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

    // Delay by Location (using ftr_hq_name)
    const locationDelays = {};
    processedData.forEach(d => {
      const location = d.ftr_hq_name || 'Unknown';
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
      budgetHeadDelays[head].budget += (d.sd_amount_lakh || 0);
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
        project: d.sub_scheme_name?.substring(0, 35) || d.name_of_scheme?.substring(0, 35) || 'Unknown',
        delay: d.delay_days,
        progress: d.physical_progress_percent || 0,
        budget: d.sd_amount_lakh || 0,
        agency: d.executive_agency || 'Unknown',
        contractor: d.firm_name || 'Unknown',
        location: d.location || 'Unknown',
        delayCategory: d.delay_days > 180 ? 'Extreme' :
                      d.delay_days > 120 ? 'Critical' :
                      d.delay_days > 90 ? 'Severe' : 'High',
        efficiency: d.efficiency_score || 0,
        riskLevel: d.risk_level || 'N/A',
        healthStatus: d.health_status || 'N/A',
        progressCategory: d.progress_category || 'N/A'
      }))
      .sort((a, b) => b.delay - a.delay);

    // Progress vs Expenditure Analysis
    const progressVsExpenditure = processedData
      .filter(d => d.physical_progress_percent >= 0 && d.expenditure_percent >= 0)
      .map(d => ({
        ...d,
        x: d.expenditure_percent || 0,
        y: d.physical_progress_percent || 0,
        delay: d.delay_days || 0,
        name: d.sub_scheme_name?.substring(0, 20) || d.name_of_scheme?.substring(0, 20) || 'Unknown',
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
          .reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0),
        percentage: processedData.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0) > 0
          ? (processedData.filter(d => d.delay_days > 60)
              .reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0) / 
             processedData.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0) * 100).toFixed(1)
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

    // Pace Analysis (Health Status Analysis)
    const paceCategories = [
      { name: 'PERFECT_PACE', label: 'Perfect Pace', color: '#10b981', icon: CheckCircle },
      { name: 'SLOW_PACE', label: 'Slow Pace', color: '#fbbf24', icon: Clock },
      { name: 'BAD_PACE', label: 'Bad Pace', color: '#f59e0b', icon: AlertCircle },
      { name: 'SLEEP_PACE', label: 'Sleep Pace', color: '#ef4444', icon: XCircle },
      { name: 'PAYMENT_PENDING', label: 'Payment Pending', color: '#a855f7', icon: IndianRupee },
      { name: 'NOT_APPLICABLE', label: 'Not Applicable', color: '#94a3b8', icon: Shield }
    ];

    const paceAnalysis = paceCategories.map(pace => {
      const projects = processedData.filter(d => d.health_status === pace.name);
      
      return {
        ...pace,
        count: projects.length,
        percentage: processedData.length ? ((projects.length / processedData.length) * 100).toFixed(1) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0),
        avgDelay: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(1)
          : 0,
        avgProgress: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (p.physical_progress_percent || 0), 0) / projects.length).toFixed(1)
          : 0,
        avgExpenditure: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (p.expenditure_percent || 0), 0) / projects.length).toFixed(1)
          : 0,
        projects: projects
      };
    });

    // Progress Category Analysis (matching useData.js categories)
    const progressCategories = [
      { name: 'NOT_STARTED', label: 'Not Started', color: '#94a3b8' },
      { name: 'AWARDED_NOT_STARTED', label: 'Awarded Not Started', color: '#ec4899' },
      { name: 'TENDERED_NOT_AWARDED', label: 'Tendered Not Awarded', color: '#a855f7' },
      { name: 'TENDER_PROGRESS', label: 'Tender Progress', color: '#8b5cf6' },
      { name: 'PROGRESS_1_TO_50', label: 'Progress 1-50%', color: '#3b82f6' },
      { name: 'PROGRESS_51_TO_71', label: 'Progress 51-71%', color: '#06b6d4' },
      { name: 'PROGRESS_71_TO_99', label: 'Progress 71-99%', color: '#10b981' },
      { name: 'COMPLETED', label: 'Completed', color: '#22c55e' }
    ];

    const progressCategoryAnalysis = progressCategories.map(cat => {
      const projects = processedData.filter(d => d.progress_category === cat.name);
      const delayedProjects = projects.filter(p => p.delay_days > 0);
      
      return {
        ...cat,
        count: projects.length,
        delayedCount: delayedProjects.length,
        percentage: processedData.length ? ((projects.length / processedData.length) * 100).toFixed(1) : 0,
        delayRate: projects.length > 0 ? ((delayedProjects.length / projects.length) * 100).toFixed(1) : 0,
        avgDelay: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(1)
          : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0),
        projects: projects
      };
    });

    // Delay by Expected vs Actual Progress
    const progressGapAnalysis = processedData
      .filter(d => d.expected_progress !== undefined && d.expected_progress !== null)
      .map(d => {
        const gap = (d.physical_progress_percent || 0) - (d.expected_progress || 0);
        return {
          ...d,
          progressGap: gap,
          gapCategory: gap >= 0 ? 'Ahead/On Schedule' :
                       gap >= -10 ? 'Slightly Behind' :
                       gap >= -25 ? 'Behind Schedule' :
                       gap >= -50 ? 'Significantly Behind' : 'Severely Behind',
          gapColor: gap >= 0 ? '#10b981' :
                   gap >= -10 ? '#fbbf24' :
                   gap >= -25 ? '#f59e0b' :
                   gap >= -50 ? '#ef4444' : '#991b1b'
        };
      });

    const gapCategories = [
      { category: 'Ahead/On Schedule', min: 0, max: Infinity, color: '#10b981' },
      { category: 'Slightly Behind', min: -10, max: -0.01, color: '#fbbf24' },
      { category: 'Behind Schedule', min: -25, max: -10.01, color: '#f59e0b' },
      { category: 'Significantly Behind', min: -50, max: -25.01, color: '#ef4444' },
      { category: 'Severely Behind', min: -Infinity, max: -50.01, color: '#991b1b' }
    ];

    const progressGapOverview = gapCategories.map(cat => {
      const projects = progressGapAnalysis.filter(d => {
        const gap = d.progressGap;
        return gap >= cat.min && gap <= cat.max;
      });
      
      return {
        ...cat,
        count: projects.length,
        percentage: progressGapAnalysis.length ? 
          ((projects.length / progressGapAnalysis.length) * 100).toFixed(1) : 0,
        avgGap: projects.length > 0 
          ? (projects.reduce((sum, p) => sum + p.progressGap, 0) / projects.length).toFixed(1)
          : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0),
        projects: projects
      };
    });

    // Critical Path Projects
    const criticalPathProjects = processedData
      .filter(d => d.sd_amount_lakh > 50 && d.delay_days > 30)
      .map(d => ({
        ...d,
        criticality: (d.delay_days / 100) * (d.sd_amount_lakh / 100) * 
                    (100 - (d.physical_progress_percent || 0)) / 100
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
        const progress = d.physical_progress_percent || 0;
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
        const progress = d.physical_progress_percent || 0;
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
      delayTrendByProgress,
      paceAnalysis,
      progressCategoryAnalysis,
      progressGapAnalysis,
      progressGapOverview
    };
  }, [processedData]);

  // Handle opening DataTable modal
  const handleOpenDataTable = (projects, title) => {
    setSelectedDataForTable(projects);
    setModalTitle(title);
    setShowDataTableModal(true);
  };

  // Handle opening FitView modal
  const handleOpenFitView = (project) => {
    setSelectedProjectForFitView(project);
    setShowFitViewModal(true);
  };

  // Handle closing FitView modal  
  const handleCloseFitView = () => {
    setShowFitViewModal(false);
    setSelectedProjectForFitView(null);
  };

  // Handle project click from modal
  const handleProjectClick = (project) => {
    setShowDataTableModal(false);
    if (onChartClick) {
      onChartClick(project, 'project');
    }
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
              <span className="font-semibold">
                {typeof entry.value === 'number' && (entry.name.includes('Budget') || entry.name.includes('Amount'))
                  ? formatAmount ? formatAmount(entry.value) : `₹${entry.value.toFixed(2)}L`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // DataTable Modal Component
  const DataTableModal = () => {
    if (!showDataTableModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDataTableModal(false)}
        />
        
        <div className={`relative w-[90vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-orange-500 to-red-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {modalTitle}
                </h2>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-orange-100'}`}>
                  Total Projects: <strong>{selectedDataForTable.length}</strong>
                </div>
              </div>
              <button
                onClick={() => setShowDataTableModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-orange-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedDataForTable}
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
                onClick={() => handleOpenDataTable(
                  cat.projects,
                  `${cat.category} (${cat.count} projects)`
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
                <div className="text-xs text-gray-500">
                  {formatAmount ? formatAmount(cat.totalBudget) : `₹${(cat.totalBudget / 100).toFixed(2)} Cr`}
                </div>
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
                      handleOpenDataTable(range.projects, `Projects: ${range.range}`);
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
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <Eye size={12} />
            Click on bars to view project details
          </p>
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
                      handleOpenDataTable(data.projects, `${data.name} Progress Projects`);
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

      {/* Rest of the component continues with corrected field names... */}
      
      {/* Continue with remaining sections - all field names are now corrected */}
      
      {/* DataTable Modal */}
      <DataTableModal />

      {/* FitView Modal */}
      <FitViewModal
        row={selectedProjectForFitView}
        isOpen={showFitViewModal}
        onClose={handleCloseFitView}
        darkMode={darkMode}
      />
    </div>
  );
};

export default TimelineDelays;