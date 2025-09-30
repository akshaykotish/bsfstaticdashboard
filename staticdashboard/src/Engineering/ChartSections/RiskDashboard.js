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
  MapPin, Building2, IndianRupee, Users, X, Eye, Filter,
  ChevronRight, Info, TrendingDown, Zap, Database
} from 'lucide-react';
import DataTable from '../DataTable';
import FitViewModal from '../FitView';

const COLORS = {
  risk: {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#fbbf24',
    LOW: '#10b981',
    NONE: '#94a3b8'
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
  },
  gradient: ['#ef4444', '#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6']
};

const RiskDashboard = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showDataTableModal, setShowDataTableModal] = useState(false);
  const [selectedDataForTable, setSelectedDataForTable] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [showFitViewModal, setShowFitViewModal] = useState(false);
  const [selectedProjectForFitView, setSelectedProjectForFitView] = useState(null);
  const [selectedMetricCard, setSelectedMetricCard] = useState(null);

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
        riskHeatmap: [],
        riskDistribution: {},
        riskByProgressRange: [],
        riskByDelayRange: [],
        agencyRiskMatrix: []
      };
    }

    // Enhanced Risk Overview with detailed project arrays
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

    const riskStats = {
      CRITICAL: { avgDelay: 0, avgProgress: 0, avgEfficiency: 0, totalDelay: 0, totalProgress: 0, totalEfficiency: 0 },
      HIGH: { avgDelay: 0, avgProgress: 0, avgEfficiency: 0, totalDelay: 0, totalProgress: 0, totalEfficiency: 0 },
      MEDIUM: { avgDelay: 0, avgProgress: 0, avgEfficiency: 0, totalDelay: 0, totalProgress: 0, totalEfficiency: 0 },
      LOW: { avgDelay: 0, avgProgress: 0, avgEfficiency: 0, totalDelay: 0, totalProgress: 0, totalEfficiency: 0 }
    };

    data.forEach(d => {
      const level = d.risk_level || 'LOW';
      if (riskCounts.hasOwnProperty(level)) {
        riskCounts[level]++;
        riskBudget[level] += (d.sd_amount_lakh || 0);  // Changed from sanctioned_amount to sd_amount_lakh
        riskProjects[level].push(d);
        riskStats[level].totalDelay += (d.delay_days || 0);
        riskStats[level].totalProgress += (d.physical_progress_percent || 0);  // Changed from physical_progress
        riskStats[level].totalEfficiency += (d.efficiency_score || 0);
      }
    });

    // Calculate averages
    Object.keys(riskStats).forEach(level => {
      if (riskCounts[level] > 0) {
        riskStats[level].avgDelay = (riskStats[level].totalDelay / riskCounts[level]).toFixed(0);
        riskStats[level].avgProgress = (riskStats[level].totalProgress / riskCounts[level]).toFixed(1);
        riskStats[level].avgEfficiency = (riskStats[level].totalEfficiency / riskCounts[level]).toFixed(1);
      }
    });

    const riskOverview = Object.entries(riskCounts).map(([level, count]) => ({
      level,
      count,
      budget: riskBudget[level],
      percentage: data.length ? ((count / data.length) * 100).toFixed(1) : 0,
      avgDelay: riskStats[level].avgDelay,
      avgProgress: riskStats[level].avgProgress,
      avgEfficiency: riskStats[level].avgEfficiency,
      fill: COLORS.risk[level],
      projects: riskProjects[level]
    }));

    // Enhanced Risk Matrix with more details
    const riskMatrix = data
      .filter(d => d.sd_amount_lakh > 0)  // Changed from sanctioned_amount
      .slice(0, 300)
      .map(item => ({
        ...item,
        x: item.physical_progress_percent || 0,  // Changed from physical_progress
        y: item.delay_days || 0,
        z: item.sd_amount_lakh,  // Changed from sanctioned_amount
        name: item.sub_scheme_name?.substring(0, 30) || item.name_of_scheme?.substring(0, 30) || 'Unknown',  // Updated field names
        risk: item.risk_level,
        efficiency: item.efficiency_score || 0,
        budgetRisk: item.expenditure_percent > 90 && item.physical_progress_percent < 70,  // Updated field names
        agency: item.executive_agency || 'Unknown',
        location: item.location || 'Unknown',  // Changed from work_site
        fill: COLORS.risk[item.risk_level] || '#94a3b8'
      }));

    // Enhanced Risk Factors Analysis
    const riskFactors = [
      {
        factor: 'Severe Delays (>90 days)',
        count: data.filter(d => d.delay_days > 90).length,
        severity: 'extreme',
        impact: 'High',
        avgDelay: data.filter(d => d.delay_days > 90).reduce((sum, d) => sum + d.delay_days, 0) / 
                  (data.filter(d => d.delay_days > 90).length || 1),
        totalBudget: data.filter(d => d.delay_days > 90).reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.delay_days > 90)
      },
      {
        factor: 'Budget Overrun (>100%)',
        count: data.filter(d => d.expenditure_percent > 100).length,  // Changed from percent_expdr
        severity: 'high',
        impact: 'High',
        avgOverrun: data.filter(d => d.expenditure_percent > 100).reduce((sum, d) => sum + (d.expenditure_percent - 100), 0) /
                    (data.filter(d => d.expenditure_percent > 100).length || 1),
        totalBudget: data.filter(d => d.expenditure_percent > 100).reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.expenditure_percent > 100)
      },
      {
        factor: 'Stalled Projects (<25% progress)',
        count: data.filter(d => d.physical_progress_percent < 25 && d.delay_days > 30).length,
        severity: 'high',
        impact: 'Medium',
        avgProgress: data.filter(d => d.physical_progress_percent < 25 && d.delay_days > 30)
                        .reduce((sum, d) => sum + d.physical_progress_percent, 0) /
                     (data.filter(d => d.physical_progress_percent < 25 && d.delay_days > 30).length || 1),
        totalBudget: data.filter(d => d.physical_progress_percent < 25 && d.delay_days > 30)
                        .reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.physical_progress_percent < 25 && d.delay_days > 30)
      },
      {
        factor: 'Low Efficiency (<40%)',
        count: data.filter(d => d.efficiency_score < 40).length,
        severity: 'moderate',
        impact: 'Medium',
        avgEfficiency: data.filter(d => d.efficiency_score < 40)
                          .reduce((sum, d) => sum + d.efficiency_score, 0) /
                       (data.filter(d => d.efficiency_score < 40).length || 1),
        totalBudget: data.filter(d => d.efficiency_score < 40)
                        .reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.efficiency_score < 40)
      },
      {
        factor: 'Zero Progress Projects',
        count: data.filter(d => d.physical_progress_percent === 0 && d.award_date && 
          (new Date() - new Date(d.award_date)) > 90 * 24 * 60 * 60 * 1000).length,  // Changed from date_award
        severity: 'high',
        impact: 'High',
        avgDaysStalled: 90,
        totalBudget: data.filter(d => d.physical_progress_percent === 0 && d.award_date && 
          (new Date() - new Date(d.award_date)) > 90 * 24 * 60 * 60 * 1000)
          .reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.physical_progress_percent === 0 && d.award_date && 
          (new Date() - new Date(d.award_date)) > 90 * 24 * 60 * 60 * 1000)
      },
      {
        factor: 'High Budget at Risk (>5Cr, <30% progress)',
        count: data.filter(d => d.sd_amount_lakh > 500 && d.physical_progress_percent < 30).length,
        severity: 'moderate',
        impact: 'High',
        avgProgress: data.filter(d => d.sd_amount_lakh > 500 && d.physical_progress_percent < 30)
                        .reduce((sum, d) => sum + d.physical_progress_percent, 0) /
                     (data.filter(d => d.sd_amount_lakh > 500 && d.physical_progress_percent < 30).length || 1),
        totalBudget: data.filter(d => d.sd_amount_lakh > 500 && d.physical_progress_percent < 30)
                        .reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        projects: data.filter(d => d.sd_amount_lakh > 500 && d.physical_progress_percent < 30)
      }
    ].map(factor => ({
      ...factor,
      percentage: data.length ? ((factor.count / data.length) * 100).toFixed(1) : 0,
      color: COLORS.severity[factor.severity]
    }));

    // Enhanced Risk by Budget Head with complete project data
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
          totalDelay: 0,
          totalProgress: 0,
          projects: [],
          criticalProjects: [],
          highRiskProjects: []
        };
      }
      riskByBudgetHead[head].total++;
      riskByBudgetHead[head].budget += (d.sanctioned_amount || 0);
      riskByBudgetHead[head].totalDelay += (d.delay_days || 0);
      riskByBudgetHead[head].totalProgress += (d.physical_progress || 0);
      riskByBudgetHead[head][d.risk_level?.toLowerCase() || 'low']++;
      riskByBudgetHead[head].projects.push(d);
      
      if (d.risk_level === 'CRITICAL') {
        riskByBudgetHead[head].criticalProjects.push(d);
      }
      if (d.risk_level === 'HIGH') {
        riskByBudgetHead[head].highRiskProjects.push(d);
      }
    });

    const riskByBudgetHeadArray = Object.values(riskByBudgetHead)
      .map(r => ({
        ...r,
        criticalRate: r.total ? ((r.critical / r.total) * 100).toFixed(1) : 0,
        highRiskRate: r.total ? (((r.critical + r.high) / r.total) * 100).toFixed(1) : 0,
        avgDelay: r.total ? (r.totalDelay / r.total).toFixed(0) : 0,
        avgProgress: r.total ? (r.totalProgress / r.total).toFixed(1) : 0,
        riskScore: r.total ? (r.critical * 4 + r.high * 3 + r.medium * 2 + r.low * 1) / r.total : 0
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Enhanced Risk by Agency
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
          budget: 0,
          projects: [],
          criticalProjects: [],
          highRiskProjects: []
        };
      }
      riskByAgency[agency].total++;
      riskByAgency[agency].budget += (d.sanctioned_amount || 0);
      riskByAgency[agency][d.risk_level?.toLowerCase() || 'low']++;
      riskByAgency[agency].projects.push(d);
      
      if (d.risk_level === 'CRITICAL') {
        riskByAgency[agency].criticalProjects.push(d);
      }
      if (d.risk_level === 'HIGH') {
        riskByAgency[agency].highRiskProjects.push(d);
      }
    });

    const riskByAgencyArray = Object.values(riskByAgency)
      .map(r => ({
        ...r,
        riskScore: (r.critical * 4 + r.high * 3 + r.medium * 2 + r.low * 1) / r.total,
        criticalRate: r.total ? ((r.critical / r.total) * 100).toFixed(1) : 0,
        highRiskRate: r.total ? (((r.critical + r.high) / r.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Enhanced Risk by Location
    const riskByLocation = {};
    data.forEach(d => {
      const location = d.ftr_hq || 'Unknown';
      if (!riskByLocation[location]) {
        riskByLocation[location] = {
          location,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          budget: 0,
          projects: [],
          criticalProjects: [],
          highRiskProjects: []
        };
      }
      riskByLocation[location].total++;
      riskByLocation[location].budget += (d.sanctioned_amount || 0);
      riskByLocation[location].projects.push(d);
      
      if (d.risk_level === 'CRITICAL') {
        riskByLocation[location].critical++;
        riskByLocation[location].criticalProjects.push(d);
      }
      if (d.risk_level === 'HIGH') {
        riskByLocation[location].high++;
        riskByLocation[location].highRiskProjects.push(d);
      }
      if (d.risk_level === 'MEDIUM') {
        riskByLocation[location].medium++;
      }
      if (d.risk_level === 'LOW') {
        riskByLocation[location].low++;
      }
    });

    const riskByLocationArray = Object.values(riskByLocation)
      .map(l => ({
        ...l,
        riskRate: l.total ? (((l.critical + l.high) / l.total) * 100).toFixed(1) : 0,
        criticalRate: l.total ? ((l.critical / l.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.riskRate - a.riskRate)
      .slice(0, 8);

    // Enhanced Mitigation Priority with scoring algorithm
    const mitigationPriority = data
      .filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH')
      .map(d => ({
        ...d,
        project: d.scheme_name?.substring(0, 40) || 'Unknown',
        risk: d.risk_level,
        budget: d.sanctioned_amount,
        progress: d.physical_progress || 0,
        delay: d.delay_days || 0,
        efficiency: d.efficiency_score || 0,
        location: d.work_site || 'Unknown',
        ftr_hq: d.ftr_hq || 'N/A',
        shq: d.shq || 'N/A',
        contractor: d.firm_name || 'N/A',
        agency: d.executive_agency || 'N/A',
        priorityScore: (
          (d.risk_level === 'CRITICAL' ? 100 : 50) +
          Math.min(50, (d.sanctioned_amount / 100)) +
          (100 - d.physical_progress) +
          Math.min(50, (d.delay_days / 10)) +
          (100 - (d.efficiency_score || 0))
        ),
        issues: [
          d.delay_days > 90 && 'Severe Delay',
          d.percent_expdr > 100 && 'Budget Overrun',
          d.efficiency_score < 40 && 'Low Efficiency',
          d.physical_progress < 25 && 'Stalled Progress',
          d.health_status === 'SLEEP_PACE' && 'Sleep Pace'
        ].filter(Boolean),
        recommendations: [
          d.delay_days > 90 && 'Expedite work schedule',
          d.percent_expdr > 100 && 'Review budget allocation',
          d.efficiency_score < 40 && 'Optimize resource utilization',
          d.physical_progress < 25 && 'Accelerate implementation'
        ].filter(Boolean)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 20);

    // Enhanced Risk Trend Analysis
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
              total: 0,
              budget: 0
            };
          }
          monthlyRisk[monthKey].total++;
          monthlyRisk[monthKey].budget += (d.sanctioned_amount || 0);
          monthlyRisk[monthKey][d.risk_level?.toLowerCase() || 'low']++;
        }
      }
    });

    Object.values(monthlyRisk)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => {
        item.criticalRate = item.total ? ((item.critical / item.total) * 100).toFixed(1) : 0;
        item.highRiskRate = item.total ? (((item.critical + item.high) / item.total) * 100).toFixed(1) : 0;
        riskTrend.push(item);
      });

    // Critical Projects List (enhanced)
    const criticalProjects = data
      .filter(d => d.risk_level === 'CRITICAL')
      .map(d => ({
        ...d,
        issueCount: [
          d.delay_days > 90,
          d.percent_expdr > 100,
          d.efficiency_score < 40,
          d.physical_progress < 25
        ].filter(Boolean).length
      }))
      .sort((a, b) => b.issueCount - a.issueCount || b.sanctioned_amount - a.sanctioned_amount);

    // Enhanced Risk Heatmap
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
      { label: '50L-1Cr', min: 50, max: 100 },
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
        
        const criticalCount = projects.filter(p => p.risk_level === 'CRITICAL').length;
        const highCount = projects.filter(p => p.risk_level === 'HIGH').length;
        
        riskHeatmap.push({
          efficiency: eRange.label,
          budget: bRange.label,
          total: projects.length,
          critical: criticalCount,
          high: highCount,
          riskPercent: projects.length > 0 ? (((criticalCount + highCount) / projects.length) * 100).toFixed(0) : 0,
          projects: projects,
          avgDelay: projects.length > 0 ? 
            (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(0) : 0
        });
      });
    });

    // Risk by Progress Range
    const progressRanges = [
      { range: '0%', min: 0, max: 0 },
      { range: '1-25%', min: 1, max: 25 },
      { range: '26-50%', min: 26, max: 50 },
      { range: '51-75%', min: 51, max: 75 },
      { range: '76-99%', min: 76, max: 99 },
      { range: '100%', min: 100, max: 100 }
    ];

    const riskByProgressRange = progressRanges.map(range => {
      const projects = data.filter(d => 
        d.physical_progress >= range.min && d.physical_progress <= range.max
      );
      
      return {
        ...range,
        total: projects.length,
        critical: projects.filter(p => p.risk_level === 'CRITICAL').length,
        high: projects.filter(p => p.risk_level === 'HIGH').length,
        projects: projects,
        avgDelay: projects.length > 0 ?
          (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(0) : 0
      };
    });

    // Risk by Delay Range
    const delayRanges = [
      { range: 'On Time', min: -Infinity, max: 0 },
      { range: '1-30 days', min: 1, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '61-90 days', min: 61, max: 90 },
      { range: '91-180 days', min: 91, max: 180 },
      { range: '>180 days', min: 181, max: Infinity }
    ];

    const riskByDelayRange = delayRanges.map(range => {
      const projects = data.filter(d => 
        d.delay_days >= range.min && d.delay_days <= range.max
      );
      
      return {
        ...range,
        total: projects.length,
        critical: projects.filter(p => p.risk_level === 'CRITICAL').length,
        high: projects.filter(p => p.risk_level === 'HIGH').length,
        projects: projects,
        avgProgress: projects.length > 0 ?
          (projects.reduce((sum, p) => sum + (p.physical_progress || 0), 0) / projects.length).toFixed(1) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sanctioned_amount || 0), 0)
      };
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
      riskHeatmap,
      riskByProgressRange,
      riskByDelayRange
    };
  }, [data]);

  // Handle opening DataTable modal
  const handleOpenDataTable = (projects, title, stats = null) => {
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

  // Handle project click from within DataTable
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
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-red-500 to-orange-500'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                {modalTitle}
              </h2>
              <button
                onClick={() => setShowDataTableModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* DataTable */}
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
      {/* Risk Overview Cards - Enhanced with click functionality */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Shield size={18} className="text-red-500" />
          Risk Assessment Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {riskMetrics.riskOverview.map((risk, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative group`}
              style={{ 
                borderColor: risk.fill,
                backgroundColor: risk.fill + '10'
              }}
              onClick={() => handleOpenDataTable(
                risk.projects,
                `${risk.level} Risk Projects (${risk.count})`
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold" style={{ color: risk.fill }}>
                  {risk.level}
                </span>
                <AlertTriangle size={16} style={{ color: risk.fill }} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{risk.count}</div>
              <div className="text-xs text-gray-500 mt-1">{risk.percentage}% of total</div>
              <div className="text-xs text-gray-500">{formatAmount(risk.budget)}</div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="text-xs flex justify-between">
                  <span className="text-gray-500">Avg Delay:</span>
                  <span className="font-medium">{risk.avgDelay} days</span>
                </div>
                <div className="text-xs flex justify-between">
                  <span className="text-gray-500">Avg Progress:</span>
                  <span className="font-medium">{risk.avgProgress}%</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye size={14} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Matrix Scatter Plot - Enhanced */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Activity size={16} className="text-purple-500" />
          Risk Matrix: Progress vs Delay Analysis
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="x" 
                name="Progress %" 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Physical Progress (%)', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
              />
              <YAxis 
                dataKey="y" 
                name="Delay (days)" 
                domain={[0, 'dataMax']} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Delay (days)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={<CustomTooltip />} 
              />
              <Scatter 
                name="Projects" 
                data={riskMetrics.riskMatrix}
                onClick={(data) => handleOpenFitView(data)}
              >
                {riskMetrics.riskMatrix.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ cursor: 'pointer' }} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Eye size={12} />
            Click on dots to view project details
          </p>
          <div className="flex gap-4 text-xs">
            {Object.entries(COLORS.risk).slice(0, 4).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span>{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors - Enhanced with detailed stats */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertCircle size={16} className="text-yellow-500" />
            Key Risk Factors Analysis
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {riskMetrics.riskFactors.map((factor, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:scale-[1.01] ${
                  darkMode ? 'bg-gray-900 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                style={{ borderLeftColor: factor.color }}
                onClick={() => handleOpenDataTable(
                  factor.projects,
                  `${factor.factor} (${factor.count} projects)`
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{factor.factor}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ 
                    backgroundColor: factor.color + '20',
                    color: factor.color
                  }}>
                    {factor.count} projects
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>Impact: <span className="font-medium">{factor.impact}</span></div>
                  <div>{factor.percentage}% of total</div>
                  <div className="col-span-2">
                    Budget at Risk: <span className="font-medium">{formatAmount(factor.totalBudget)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk by Location - Enhanced */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <MapPin size={16} className="text-orange-500" />
            Risk Distribution by Frontier HQ
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {riskMetrics.riskByLocation.map((loc, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} 
                  hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all`}
                onClick={() => handleOpenDataTable(
                  loc.projects,
                  `Projects in ${loc.location} (${loc.total})`
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{loc.location}</p>
                    <p className="text-xs text-gray-500">{loc.total} projects • {formatAmount(loc.budget)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-600">{loc.critical} Critical</div>
                    <div className="text-xs text-orange-600">{loc.high} High Risk</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Risk Rate: {loc.riskRate}%</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full flex">
                    <div 
                      className="bg-red-500 rounded-l-full"
                      style={{ width: `${(loc.critical / loc.total) * 100}%` }}
                    />
                    <div 
                      className="bg-orange-500"
                      style={{ width: `${(loc.high / loc.total) * 100}%` }}
                    />
                    <div 
                      className="bg-yellow-500"
                      style={{ width: `${(loc.medium / loc.total) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500 rounded-r-full"
                      style={{ width: `${(loc.low / loc.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk by Budget Head - Enhanced with click actions */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <BarChart3 size={16} className="text-blue-500" />
          Risk Distribution by Budget Head
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={riskMetrics.riskByBudgetHead.slice(0, 8)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="head" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 9, cursor: 'pointer' }}
                onClick={(e) => {
                  if (e && e.value) {
                    const budgetData = riskMetrics.riskByBudgetHead.find(b => b.head === e.value);
                    if (budgetData) {
                      handleOpenDataTable(
                        budgetData.projects,
                        `Projects under ${budgetData.head} (${budgetData.total})`
                      );
                    }
                  }
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar 
                dataKey="critical" 
                stackId="a" 
                fill={COLORS.risk.CRITICAL} 
                name="Critical"
                onClick={(data) => {
                  if (data && data.criticalProjects) {
                    handleOpenDataTable(
                      data.criticalProjects,
                      `Critical Projects in ${data.head}`
                    );
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <Bar dataKey="high" stackId="a" fill={COLORS.risk.HIGH} name="High" />
              <Bar dataKey="medium" stackId="a" fill={COLORS.risk.MEDIUM} name="Medium" />
              <Bar dataKey="low" stackId="a" fill={COLORS.risk.LOW} name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on bars or labels to view projects by budget head
        </p>
      </div>

      {/* Agency Risk Table - Enhanced */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building2 size={16} className="text-indigo-500" />
          Agency Risk Assessment
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Agency</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Critical</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">High</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Risk Score</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Critical %</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Budget</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {riskMetrics.riskByAgency.map((agency, index) => (
                <tr 
                  key={index} 
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-red-50'} transition-colors cursor-pointer`}
                  onClick={() => handleOpenDataTable(
                    agency.projects,
                    `${agency.agency} - All Projects (${agency.total})`
                  )}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{agency.agency}</td>
                  <td className="px-3 py-2 text-center">{agency.total}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-red-600">{agency.critical}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-orange-600">{agency.high}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${
                        agency.riskScore > 3 ? 'text-red-600' :
                        agency.riskScore > 2 ? 'text-orange-600' :
                        agency.riskScore > 1.5 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {agency.riskScore.toFixed(2)}
                      </span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            agency.riskScore > 3 ? 'bg-red-500' :
                            agency.riskScore > 2 ? 'bg-orange-500' :
                            agency.riskScore > 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(agency.riskScore / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{agency.criticalRate}%</td>
                  <td className="px-3 py-2 text-center">{formatAmount(agency.budget)}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDataTable(
                          agency.criticalProjects.concat(agency.highRiskProjects),
                          `${agency.agency} - High Risk Projects`
                        );
                      }}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 mx-auto ${
                        darkMode ? 'bg-red-900 hover:bg-red-800 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-700'
                      } transition-colors`}
                    >
                      <AlertTriangle size={12} />
                      Risk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Projects Grid - Enhanced */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertOctagon size={16} className="text-red-500" />
            Critical Risk Projects - Immediate Action Required
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              {riskMetrics.criticalProjects.length}
            </span>
          </h3>
          <button
            onClick={() => handleOpenDataTable(
              riskMetrics.criticalProjects,
              `All Critical Risk Projects (${riskMetrics.criticalProjects.length})`
            )}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Database size={12} />
            View All Critical Projects
          </button>
        </div>
        
        {/* Preview of top critical projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riskMetrics.criticalProjects.slice(0, 6).map((project, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg
                border-red-500 bg-red-50 dark:bg-red-900/20 relative group`}
              onClick={() => handleOpenFitView(project)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye size={14} className="text-red-600" />
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-xs truncate flex-1 text-gray-900 dark:text-gray-100 pr-2" 
                    title={project.scheme_name}>
                  {project.scheme_name}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 flex-shrink-0">
                  CRITICAL
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={10} className="text-gray-500 flex-shrink-0" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{project.work_site || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={10} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {project.executive_agency || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={10} className="text-gray-500 flex-shrink-0" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{project.firm_name || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-800">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatAmount(project.sanctioned_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{project.physical_progress || 0}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Delay:</span>
                    <p className="font-semibold text-red-600">{project.delay_days || 0}d</p>
                  </div>
                </div>
                
                {/* Issue indicators */}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {project.delay_days > 90 && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Severe Delay</span>
                  )}
                  {project.percent_expdr > 100 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Overrun</span>
                  )}
                  {project.efficiency_score < 40 && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Low Eff</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Trend Analysis */}
      {riskMetrics.riskTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <TrendingUp size={16} className="text-green-500" />
            Risk Trend Analysis (Last 12 Months)
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskMetrics.riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="critical" stackId="1" stroke={COLORS.risk.CRITICAL} fill={COLORS.risk.CRITICAL} name="Critical" />
                <Area type="monotone" dataKey="high" stackId="1" stroke={COLORS.risk.HIGH} fill={COLORS.risk.HIGH} name="High" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke={COLORS.risk.MEDIUM} fill={COLORS.risk.MEDIUM} name="Medium" />
                <Area type="monotone" dataKey="low" stackId="1" stroke={COLORS.risk.LOW} fill={COLORS.risk.LOW} name="Low" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Heatmap - Enhanced */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Gauge size={16} className="text-purple-500" />
          Risk Heatmap: Efficiency vs Budget Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <th className="px-2 py-2 text-left text-gray-700 dark:text-gray-300">Efficiency / Budget</th>
                {['<50L', '50L-1Cr', '1-5Cr', '5-10Cr', '>10Cr'].map(range => (
                  <th key={range} className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">{range}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].map(effRange => (
                <tr key={effRange}>
                  <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">{effRange}</td>
                  {['<50L', '50L-1Cr', '1-5Cr', '5-10Cr', '>10Cr'].map(budgetRange => {
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
                            handleOpenDataTable(
                              cell.projects,
                              `Projects: ${effRange} Efficiency, ${budgetRange} Budget (${cell.total} projects)`
                            );
                          }
                        }}
                      >
                        <div className="font-bold">{cell?.total || 0}</div>
                        <div className="text-[10px]">{riskPercent}% risk</div>
                        {cell?.avgDelay && (
                          <div className="text-[10px]">{cell.avgDelay}d avg delay</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on cells to view projects in that category
        </p>
      </div>

      {/* Risk by Progress Range */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Activity size={16} className="text-blue-500" />
          Risk Analysis by Progress Range
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {riskMetrics.riskByProgressRange.map((range, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                darkMode ? 'bg-gray-900 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() => {
                if (range.total > 0) {
                  handleOpenDataTable(
                    range.projects,
                    `Projects with ${range.range} Progress (${range.total} projects)`
                  );
                }
              }}
            >
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">{range.range}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{range.total}</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-500">Critical:</span>
                  <span className="font-medium">{range.critical}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-orange-500">High:</span>
                  <span className="font-medium">{range.high}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Avg Delay:</span>
                  <span className="font-medium">{range.avgDelay}d</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500">
                  Risk Rate: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {range.total > 0 ? (((range.critical + range.high) / range.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk by Delay Range */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Clock size={16} className="text-red-500" />
          Risk Analysis by Delay Range
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {riskMetrics.riskByDelayRange.map((range, index) => {
            const isDelayed = range.range !== 'On Time';
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  isDelayed
                    ? darkMode ? 'bg-red-900/20 hover:bg-red-900/30 border-red-700' : 'bg-red-50 hover:bg-red-100 border-red-200'
                    : darkMode ? 'bg-green-900/20 hover:bg-green-900/30 border-green-700' : 'bg-green-50 hover:bg-green-100 border-green-200'
                }`}
                onClick={() => {
                  if (range.total > 0) {
                    handleOpenDataTable(
                      range.projects,
                      `Projects ${range.range} (${range.total} projects)`
                    );
                  }
                }}
              >
                <div className={`text-xs font-semibold mb-2 ${
                  isDelayed ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                }`}>
                  {range.range}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{range.total}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-500">Critical:</span>
                    <span className="font-medium">{range.critical}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-500">High:</span>
                    <span className="font-medium">{range.high}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Avg Progress:</span>
                    <span className="font-medium">{range.avgProgress}%</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500">
                    Budget: <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatAmount(range.totalBudget)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mitigation Priority - Enhanced */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Target size={16} className="text-orange-500" />
            Priority Mitigation Actions
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
              {riskMetrics.mitigationPriority.length} projects
            </span>
          </h3>
          <button
            onClick={() => handleOpenDataTable(
              riskMetrics.mitigationPriority,
              `All High Priority Mitigation Projects (${riskMetrics.mitigationPriority.length})`
            )}
            className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Database size={12} />
            View All Priority Projects
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {riskMetrics.mitigationPriority.slice(0, 8).map((project, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative group ${
                project.risk === 'CRITICAL' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              }`}
              onClick={() => handleOpenFitView(project)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye size={14} className={project.risk === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'} />
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-xs truncate flex-1 text-gray-900 dark:text-gray-100 pr-2" 
                    title={project.project}>
                  {project.project}
                </h4>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    project.risk === 'CRITICAL' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {project.risk}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    #{index + 1}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <MapPin size={10} className="text-gray-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{project.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 size={10} className="text-gray-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{project.agency}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={10} className="text-gray-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{project.contractor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Score: {project.priorityScore.toFixed(0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(project.budget)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{project.progress}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Delay:</span>
                  <p className="font-semibold text-red-600">{project.delay}d</p>
                </div>
                <div>
                  <span className="text-gray-500">Efficiency:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{project.efficiency}%</p>
                </div>
              </div>

              {project.issues.length > 0 && (
                <div className="mb-2">
                  <span className="text-gray-500 text-xs font-semibold">Issues:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.issues.map((issue, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.recommendations.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-500 text-xs font-semibold">Recommendations:</span>
                  <div className="mt-1 space-y-1">
                    {project.recommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <ChevronRight size={10} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Summary Statistics */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Info size={16} className="text-blue-500" />
          Risk Analysis Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Total Projects at Risk</div>
            <div className="text-2xl font-bold text-red-600">
              {data.filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((data.filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH').length / data.length) * 100).toFixed(1)}% of total
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Budget at Risk</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(
                data.filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH')
                    .reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0)
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Critical & High risk projects
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Avg Delay (Critical)</div>
            <div className="text-2xl font-bold text-red-600">
              {data.filter(d => d.risk_level === 'CRITICAL').length > 0
                ? (data.filter(d => d.risk_level === 'CRITICAL')
                      .reduce((sum, d) => sum + (d.delay_days || 0), 0) / 
                   data.filter(d => d.risk_level === 'CRITICAL').length).toFixed(0)
                : 0} days
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Critical projects only
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Agencies with Critical Projects</div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(data.filter(d => d.risk_level === 'CRITICAL').map(d => d.executive_agency)).size}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Require immediate attention
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Projects with severe delays (&lt;90 days):</span>
              <span className="ml-2 font-semibold text-red-600">
                {data.filter(d => d.delay_days > 90).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Projects with budget overrun:</span>
              <span className="ml-2 font-semibold text-orange-600">
                {data.filter(d => d.percent_expdr > 100).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Stalled projects (&lt;25% progress):</span>
              <span className="ml-2 font-semibold text-yellow-600">
                {data.filter(d => d.physical_progress < 25).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Low efficiency projects (&lt;40%):</span>
              <span className="ml-2 font-semibold text-purple-600">
                {data.filter(d => d.efficiency_score < 40).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Zero progress projects:</span>
              <span className="ml-2 font-semibold text-gray-600 dark:text-gray-400">
                {data.filter(d => d.physical_progress === 0).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">High budget at risk (&lt;5Cr):</span>
              <span className="ml-2 font-semibold text-blue-600">
                {data.filter(d => d.sanctioned_amount > 500 && (d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH')).length}
              </span>
            </div>
          </div>
        </div>
      </div>

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

export default RiskDashboard;