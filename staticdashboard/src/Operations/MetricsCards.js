import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  // Work Type Icons
  Shield, Construction, Route, Building, MoreHorizontal,
  
  // Budget Icons  
  IndianRupee, CreditCard, Wallet, TrendingUp, TrendingDown, Database,
  
  // Progress Icons
  Activity, PlayCircle, PauseCircle, Timer, Zap, Target,
  
  // Health Icons
  AlertTriangle, Clock, Heart, AlertCircle, Gauge,
  
  // Location Icons
  Globe, Navigation, MapPin, Building2,
  
  // Timeline Icons
  CalendarDays, CalendarClock, CalendarCheck, CalendarX,
  
  // Utility Icons
  ChevronDown, ChevronUp, ChevronRight, Eye, Download, Info,
  MoreVertical, X, Maximize2, Filter, RefreshCw,
  Users, Percent, Package, FileText,
  HelpCircle, Coins, PiggyBank, Banknote, Hash, Grid3x3,
  
  // Additional Icons for new metrics
  Award, Briefcase, GitBranch, Layers, Settings,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  ThermometerSun, Cpu, Battery, Sparkles,
  CheckCircle, XCircle, MinusCircle, PlusCircle,
  ArrowUp, ArrowDown, ArrowRight, TrendingFlat
} from 'lucide-react';

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie
} from 'recharts';

// Import DataTable for drill-down functionality
import DataTable from './DataTable';

const MetricsCards = ({ metrics, darkMode, onMetricClick, filteredData = [], onProjectSelect }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedMetricGroup, setSelectedMetricGroup] = useState('all');
  const [showTrends, setShowTrends] = useState(true);
  const [cardSize, setCardSize] = useState('normal');
  const [showInfoTooltips, setShowInfoTooltips] = useState(true);
  const [viewLayout, setViewLayout] = useState('grid'); // grid, list, compact
  
  // States for drill-down functionality
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  // Generate mock trend data for mini charts
  const generateTrendData = (baseValue, variance = 10) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        day: i,
        value: baseValue + (Math.random() - 0.5) * variance
      });
    }
    return data;
  };

  // Safe number formatting
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Format currency in Crores
  const formatCurrency = (value) => {
    const num = safeNumber(value, 0);
    if (num >= 100) {
      return `₹${num.toFixed(1)} Cr`;
    } else if (num >= 1) {
      return `₹${num.toFixed(2)} Cr`;
    } else {
      return `₹${(num * 100).toFixed(1)} L`;
    }
  };

  // Format percentage
  const formatPercentage = (value) => {
    const num = safeNumber(value, 0);
    return `${num.toFixed(1)}%`;
  };

  // Format number with K/M suffix
  const formatCompactNumber = (value) => {
    const num = safeNumber(value, 0);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Calculate all metrics from filteredData
  const calculatedMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        // Works Overview
        totalWorks: 0,
        bopWorks: 0,
        fencingWorks: 0,
        roadWorks: 0,
        bridgeWorks: 0,
        infrastructureWorks: 0,
        otherWorks: 0,
        
        // Budget Metrics
        totalSanctionedCr: 0,
        totalSpentCr: 0,
        remainingBudgetCr: 0,
        utilizationRate: 0,
        avgWorkBudgetCr: 0,
        highBudgetWorks: 0,
        mediumBudgetWorks: 0,
        lowBudgetWorks: 0,
        budgetVariance: 0,
        costOverruns: 0,
        
        // Progress Metrics
        completedWorks: 0,
        nearCompletionWorks: 0,
        advancedWorks: 0,
        inProgressWorks: 0,
        initialStageWorks: 0,
        notStartedWorks: 0,
        avgProgress: 0,
        progressVariance: 0,
        
        // Health & Risk Metrics
        criticalRiskWorks: 0,
        highRiskWorks: 0,
        mediumRiskWorks: 0,
        lowRiskWorks: 0,
        onTrackWorks: 0,
        minorDelayWorks: 0,
        moderateDelayWorks: 0,
        severeDelayWorks: 0,
        avgEfficiency: 0,
        healthScore: 0,
        
        // Priority Metrics
        urgentPriorityWorks: 0,
        highPriorityWorks: 0,
        mediumPriorityWorks: 0,
        lowPriorityWorks: 0,
        
        // Location Metrics
        totalFrontiers: 0,
        totalSectorHQs: 0,
        avgLengthKm: 0,
        totalLengthKm: 0,
        totalUnitsAOR: 0,
        frontiersWithHighRisk: 0,
        sectorsWithDelays: 0,
        
        // Timeline Metrics
        overdueWorks: 0,
        nearPDCWorks: 0,
        withinScheduleWorks: 0,
        avgDaysToPDC: 0,
        
        // HLEC Metrics
        totalHLECYears: 0,
        recentHLECWorks: 0,
        oldHLECWorks: 0,
        avgHLECYear: 0,
        
        // Performance Metrics
        performanceIndex: 0,
        productivityScore: 0,
        qualityScore: 0,
        timelinessScore: 0,
        
        // Financial Health
        budgetHealthScore: 0,
        spendingEfficiency: 0,
        costPerKm: 0,
        costPerUnit: 0
      };
    }

    const total = filteredData.length;
    
    // Work Category Counts
    const bopWorks = filteredData.filter(d => {
      const wt = (d.work_type || '').toUpperCase();
      return wt.includes('BOP') || d.work_category === 'BORDER_OUTPOST';
    }).length;
    
    const fencingWorks = filteredData.filter(d => {
      const wt = (d.work_type || '').toUpperCase();
      return wt.includes('FENCE') || wt.includes('BFL') || d.work_category === 'FENCING';
    }).length;
    
    const roadWorks = filteredData.filter(d => {
      const wt = (d.work_type || '').toUpperCase();
      return wt.includes('ROAD') || wt.includes('AXIAL') || wt.includes('LATERAL') || wt.includes('LINK') || d.work_category === 'ROAD';
    }).length;
    
    const bridgeWorks = filteredData.filter(d => {
      const wt = (d.work_type || '').toUpperCase();
      return wt.includes('BRIDGE') || d.work_category === 'BRIDGE';
    }).length;
    
    const infrastructureWorks = filteredData.filter(d => {
      const wt = (d.work_type || '').toUpperCase();
      return wt.includes('INFRASTRUCTURE') || d.work_category === 'INFRASTRUCTURE';
    }).length;
    
    const otherWorks = total - bopWorks - fencingWorks - roadWorks - bridgeWorks - infrastructureWorks;
    
    // Budget Calculations
    const totalSanctionedCr = filteredData.reduce((sum, d) => sum + (d.sanctioned_amount_cr || 0), 0);
    const totalSpentCr = filteredData.reduce((sum, d) => sum + (d.spent_amount_cr || 0), 0);
    const remainingBudgetCr = filteredData.reduce((sum, d) => sum + (d.remaining_amount_cr || 0), 0);
    const utilizationRate = totalSanctionedCr > 0 ? (totalSpentCr / totalSanctionedCr * 100) : 0;
    const avgWorkBudgetCr = total > 0 ? totalSanctionedCr / total : 0;
    const highBudgetWorks = filteredData.filter(d => d.sanctioned_amount_cr > 50).length;
    const mediumBudgetWorks = filteredData.filter(d => d.sanctioned_amount_cr > 10 && d.sanctioned_amount_cr <= 50).length;
    const lowBudgetWorks = filteredData.filter(d => d.sanctioned_amount_cr <= 10).length;
    
    // Budget variance and overruns
    const budgetVariances = filteredData.map(d => {
      const expected = d.sanctioned_amount_cr * (d.completed_percentage || 0);
      const actual = d.spent_amount_cr || 0;
      return actual - expected;
    });
    const budgetVariance = budgetVariances.reduce((sum, v) => sum + Math.abs(v), 0) / total;
    const costOverruns = filteredData.filter(d => d.spent_amount_cr > d.sanctioned_amount_cr).length;
    
    // Progress Calculations
    const completedWorks = filteredData.filter(d => d.completion_status === 'COMPLETED').length;
    const nearCompletionWorks = filteredData.filter(d => d.completion_status === 'NEAR_COMPLETION').length;
    const advancedWorks = filteredData.filter(d => d.completion_status === 'ADVANCED').length;
    const inProgressWorks = filteredData.filter(d => d.completion_status === 'IN_PROGRESS').length;
    const initialStageWorks = filteredData.filter(d => d.completion_status === 'INITIAL').length;
    const notStartedWorks = filteredData.filter(d => d.completion_status === 'NOT_STARTED').length;
    const avgProgress = total > 0 
      ? filteredData.reduce((sum, d) => sum + ((d.completed_percentage || 0) * 100), 0) / total 
      : 0;
    
    // Progress variance
    const progressValues = filteredData.map(d => (d.completed_percentage || 0) * 100);
    const progressMean = avgProgress;
    const progressVariance = total > 0
      ? Math.sqrt(progressValues.reduce((sum, v) => sum + Math.pow(v - progressMean, 2), 0) / total)
      : 0;
    
    // Health & Risk Calculations
    const criticalRiskWorks = filteredData.filter(d => d.risk_level === 'CRITICAL').length;
    const highRiskWorks = filteredData.filter(d => d.risk_level === 'HIGH').length;
    const mediumRiskWorks = filteredData.filter(d => d.risk_level === 'MEDIUM').length;
    const lowRiskWorks = filteredData.filter(d => d.risk_level === 'LOW').length;
    const onTrackWorks = filteredData.filter(d => d.project_health === 'ON_TRACK').length;
    const minorDelayWorks = filteredData.filter(d => d.project_health === 'MINOR_DELAY').length;
    const moderateDelayWorks = filteredData.filter(d => d.project_health === 'MODERATE_DELAY').length;
    const severeDelayWorks = filteredData.filter(d => d.project_health === 'SEVERE_DELAY').length;
    const avgEfficiency = total > 0 
      ? filteredData.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / total 
      : 0;
    
    // Health Score calculation
    const healthScore = total > 0
      ? ((onTrackWorks * 100) + (minorDelayWorks * 70) + (moderateDelayWorks * 40) + (severeDelayWorks * 10)) / total
      : 0;
    
    // Priority Calculations
    const urgentPriorityWorks = filteredData.filter(d => d.priority === 'URGENT').length;
    const highPriorityWorks = filteredData.filter(d => d.priority === 'HIGH').length;
    const mediumPriorityWorks = filteredData.filter(d => d.priority === 'MEDIUM').length;
    const lowPriorityWorks = filteredData.filter(d => d.priority === 'LOW').length;
    
    // Location Calculations
    const uniqueFrontiers = new Set(filteredData.map(d => d.frontier).filter(f => f && f !== 'Unknown'));
    const uniqueSectorHQs = new Set(filteredData.map(d => d.sector_hq).filter(s => s && s !== 'Unknown'));
    const totalLengthKm = filteredData.reduce((sum, d) => sum + (d.length_km || 0), 0);
    const avgLengthKm = filteredData.filter(d => d.length_km > 0).length > 0
      ? totalLengthKm / filteredData.filter(d => d.length_km > 0).length
      : 0;
    const totalUnitsAOR = filteredData.reduce((sum, d) => sum + (d.units_aor || 0), 0);
    
    // Frontiers and sectors with issues
    const frontiersWithHighRisk = new Set(
      filteredData.filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH')
        .map(d => d.frontier).filter(Boolean)
    ).size;
    
    const sectorsWithDelays = new Set(
      filteredData.filter(d => d.project_health === 'SEVERE_DELAY' || d.project_health === 'MODERATE_DELAY')
        .map(d => d.sector_hq).filter(Boolean)
    ).size;
    
    // Timeline Calculations
    const overdueWorks = filteredData.filter(d => d.days_to_pdc && d.days_to_pdc < 0).length;
    const nearPDCWorks = filteredData.filter(d => d.days_to_pdc >= 0 && d.days_to_pdc <= 90).length;
    const withinScheduleWorks = filteredData.filter(d => d.days_to_pdc && d.days_to_pdc > 90).length;
    const avgDaysToPDC = filteredData.filter(d => d.days_to_pdc !== null && d.days_to_pdc !== undefined).length > 0
      ? filteredData.filter(d => d.days_to_pdc !== null && d.days_to_pdc !== undefined)
          .reduce((sum, d) => sum + d.days_to_pdc, 0) / 
        filteredData.filter(d => d.days_to_pdc !== null && d.days_to_pdc !== undefined).length
      : 0;
    
    // HLEC Calculations
    const uniqueHLECYears = new Set(filteredData.map(d => d.hlec_year_number).filter(Boolean));
    const currentYear = new Date().getFullYear();
    const recentHLECWorks = filteredData.filter(d => 
      d.hlec_year_number && d.hlec_year_number >= currentYear - 2
    ).length;
    const oldHLECWorks = filteredData.filter(d => 
      d.hlec_year_number && d.hlec_year_number < currentYear - 5
    ).length;
    const avgHLECYear = filteredData.filter(d => d.hlec_year_number).length > 0
      ? filteredData.filter(d => d.hlec_year_number)
          .reduce((sum, d) => sum + d.hlec_year_number, 0) / 
        filteredData.filter(d => d.hlec_year_number).length
      : 0;
    
    // Performance Metrics
    const performanceIndex = (avgProgress * 0.4) + (avgEfficiency * 0.3) + 
      ((100 - (criticalRiskWorks / Math.max(1, total)) * 100) * 0.3);
    
    const productivityScore = totalLengthKm > 0 
      ? (totalLengthKm / totalSanctionedCr) * 100 
      : 0;
    
    const qualityScore = total > 0
      ? ((completedWorks / total) * 100 * 0.5) + 
        ((onTrackWorks / total) * 100 * 0.5)
      : 0;
    
    const timelinessScore = total > 0
      ? 100 - ((overdueWorks / total) * 100)
      : 100;
    
    // Financial Health
    const budgetHealthScore = (utilizationRate * 0.5) + 
      ((100 - (costOverruns / Math.max(1, total)) * 100) * 0.5);
    
    const spendingEfficiency = totalSanctionedCr > 0
      ? (totalSpentCr / totalSanctionedCr) * avgProgress
      : 0;
    
    const costPerKm = totalLengthKm > 0
      ? totalSanctionedCr / totalLengthKm
      : 0;
    
    const costPerUnit = totalUnitsAOR > 0
      ? totalSanctionedCr / totalUnitsAOR
      : 0;
    
    return {
      // Works Overview
      totalWorks: total,
      bopWorks,
      fencingWorks,
      roadWorks,
      bridgeWorks,
      infrastructureWorks,
      otherWorks,
      
      // Budget Metrics
      totalSanctionedCr,
      totalSpentCr,
      remainingBudgetCr,
      utilizationRate,
      avgWorkBudgetCr,
      highBudgetWorks,
      mediumBudgetWorks,
      lowBudgetWorks,
      budgetVariance,
      costOverruns,
      
      // Progress Metrics
      completedWorks,
      nearCompletionWorks,
      advancedWorks,
      inProgressWorks,
      initialStageWorks,
      notStartedWorks,
      avgProgress,
      progressVariance,
      
      // Health & Risk Metrics
      criticalRiskWorks,
      highRiskWorks,
      mediumRiskWorks,
      lowRiskWorks,
      onTrackWorks,
      minorDelayWorks,
      moderateDelayWorks,
      severeDelayWorks,
      avgEfficiency,
      healthScore,
      
      // Priority Metrics
      urgentPriorityWorks,
      highPriorityWorks,
      mediumPriorityWorks,
      lowPriorityWorks,
      
      // Location Metrics
      totalFrontiers: uniqueFrontiers.size,
      totalSectorHQs: uniqueSectorHQs.size,
      avgLengthKm,
      totalLengthKm,
      totalUnitsAOR,
      frontiersWithHighRisk,
      sectorsWithDelays,
      
      // Timeline Metrics
      overdueWorks,
      nearPDCWorks,
      withinScheduleWorks,
      avgDaysToPDC,
      
      // HLEC Metrics
      totalHLECYears: uniqueHLECYears.size,
      recentHLECWorks,
      oldHLECWorks,
      avgHLECYear,
      
      // Performance Metrics
      performanceIndex,
      productivityScore,
      qualityScore,
      timelinessScore,
      
      // Financial Health
      budgetHealthScore,
      spendingEfficiency,
      costPerKm,
      costPerUnit
    };
  }, [filteredData]);

  // Get filtered data based on metric type
  const getMetricData = (metricId) => {
    if (!filteredData || filteredData.length === 0) return [];

    switch (metricId) {
      // Works Overview
      case 'total-works':
        return filteredData;
      case 'bop-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return wt.includes('BOP') || d.work_category === 'BORDER_OUTPOST';
        });
      case 'fencing-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return wt.includes('FENCE') || wt.includes('BFL') || d.work_category === 'FENCING';
        });
      case 'road-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return wt.includes('ROAD') || wt.includes('AXIAL') || wt.includes('LATERAL') || wt.includes('LINK') || d.work_category === 'ROAD';
        });
      case 'bridge-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return wt.includes('BRIDGE') || d.work_category === 'BRIDGE';
        });
      case 'infrastructure-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return wt.includes('INFRASTRUCTURE') || d.work_category === 'INFRASTRUCTURE';
        });
      case 'other-works':
        return filteredData.filter(d => {
          const wt = (d.work_type || '').toUpperCase();
          return !wt.includes('BOP') && !wt.includes('FENCE') && !wt.includes('BFL') && 
                 !wt.includes('ROAD') && !wt.includes('AXIAL') && !wt.includes('LATERAL') && 
                 !wt.includes('LINK') && !wt.includes('BRIDGE') && !wt.includes('INFRASTRUCTURE');
        });
        
      // Budget
      case 'high-budget':
        return filteredData.filter(d => d.sanctioned_amount_cr > 50);
      case 'medium-budget':
        return filteredData.filter(d => d.sanctioned_amount_cr > 10 && d.sanctioned_amount_cr <= 50);
      case 'low-budget':
        return filteredData.filter(d => d.sanctioned_amount_cr <= 10);
      case 'cost-overruns':
        return filteredData.filter(d => d.spent_amount_cr > d.sanctioned_amount_cr);
        
      // Progress
      case 'completed':
        return filteredData.filter(d => d.completion_status === 'COMPLETED');
      case 'near-completion':
        return filteredData.filter(d => d.completion_status === 'NEAR_COMPLETION');
      case 'advanced':
        return filteredData.filter(d => d.completion_status === 'ADVANCED');
      case 'in-progress':
        return filteredData.filter(d => d.completion_status === 'IN_PROGRESS');
      case 'initial-stage':
        return filteredData.filter(d => d.completion_status === 'INITIAL');
      case 'not-started':
        return filteredData.filter(d => d.completion_status === 'NOT_STARTED');
        
      // Health & Risk
      case 'critical-risk':
        return filteredData.filter(d => d.risk_level === 'CRITICAL');
      case 'high-risk':
        return filteredData.filter(d => d.risk_level === 'HIGH');
      case 'medium-risk':
        return filteredData.filter(d => d.risk_level === 'MEDIUM');
      case 'low-risk':
        return filteredData.filter(d => d.risk_level === 'LOW');
      case 'on-track':
        return filteredData.filter(d => d.project_health === 'ON_TRACK');
      case 'minor-delay':
        return filteredData.filter(d => d.project_health === 'MINOR_DELAY');
      case 'moderate-delay':
        return filteredData.filter(d => d.project_health === 'MODERATE_DELAY');
      case 'severe-delay':
        return filteredData.filter(d => d.project_health === 'SEVERE_DELAY');
        
      // Priority
      case 'urgent-priority':
        return filteredData.filter(d => d.priority === 'URGENT');
      case 'high-priority':
        return filteredData.filter(d => d.priority === 'HIGH');
      case 'medium-priority':
        return filteredData.filter(d => d.priority === 'MEDIUM');
      case 'low-priority':
        return filteredData.filter(d => d.priority === 'LOW');
        
      // Timeline
      case 'overdue':
        return filteredData.filter(d => d.days_to_pdc && d.days_to_pdc < 0);
      case 'near-pdc':
        return filteredData.filter(d => d.days_to_pdc >= 0 && d.days_to_pdc <= 90);
      case 'within-schedule':
        return filteredData.filter(d => d.days_to_pdc && d.days_to_pdc > 90);
        
      // HLEC
      case 'recent-hlec':
        const currentYear = new Date().getFullYear();
        return filteredData.filter(d => d.hlec_year_number && d.hlec_year_number >= currentYear - 2);
      case 'old-hlec':
        const year = new Date().getFullYear();
        return filteredData.filter(d => d.hlec_year_number && d.hlec_year_number < year - 5);
        
      // Location-based
      case 'frontiers-risk':
        return filteredData.filter(d => d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH');
      case 'sectors-delay':
        return filteredData.filter(d => d.project_health === 'SEVERE_DELAY' || d.project_health === 'MODERATE_DELAY');
        
      default:
        return filteredData;
    }
  };

  // Handle metric click
  const handleMetricClick = (metric) => {
    const data = getMetricData(metric.id);
    
    // Set drill-down data for modal
    if (data && data.length > 0) {
      setDrillDownData(data);
      setDrillDownTitle(`${metric.title} - ${metric.value} ${metric.subtitle || ''}`);
      setSelectedMetric(metric);
      setShowDrillDown(true);
    }
    
    // Also call the parent handler if provided
    if (onMetricClick) {
      onMetricClick(metric.id, data);
    }
  };

  // Close drill-down modal
  const closeDrillDown = () => {
    setShowDrillDown(false);
    setSelectedMetric(null);
    setDrillDownData([]);
    setDrillDownTitle('');
  };

  // Define all sections with metrics
  const worksMetrics = [
    {
      id: 'total-works',
      group: 'works',
      title: 'Total Works',
      value: calculatedMetrics.totalWorks || 0,
      subtitle: `Budget: ${formatCurrency(calculatedMetrics.totalSanctionedCr)}`,
      icon: Construction,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      percentage: 100,
      sparkline: generateTrendData(calculatedMetrics.totalWorks || 0, 5),
      infoText: "Total number of border infrastructure works being tracked across all categories and stages."
    },
    {
      id: 'bop-works',
      group: 'works',
      title: 'Border Outposts',
      value: calculatedMetrics.bopWorks || 0,
      subtitle: `${((calculatedMetrics.bopWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: Shield,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      infoText: "Border Outpost (BOP) construction projects for security forces deployment."
    },
    {
      id: 'fencing-works',
      group: 'works',
      title: 'Border Fencing/BFL',
      value: calculatedMetrics.fencingWorks || 0,
      subtitle: `${((calculatedMetrics.fencingWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: Package,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Border fencing and Border Fence Lighting (BFL) projects for perimeter security."
    },
    {
      id: 'road-works',
      group: 'works',
      title: 'Roads',
      value: calculatedMetrics.roadWorks || 0,
      subtitle: `${((calculatedMetrics.roadWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: Route,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Road construction including Axial Roads, Lateral Roads, and Link Roads for border connectivity."
    },
    {
      id: 'bridge-works',
      group: 'works',
      title: 'Bridges',
      value: calculatedMetrics.bridgeWorks || 0,
      subtitle: `${((calculatedMetrics.bridgeWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: Construction,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Bridge construction projects for crossing rivers and difficult terrain."
    },
    {
      id: 'infrastructure-works',
      group: 'works',
      title: 'Infrastructure',
      value: calculatedMetrics.infrastructureWorks || 0,
      subtitle: `${((calculatedMetrics.infrastructureWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: Building,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      infoText: "General infrastructure projects including buildings and facilities."
    },
    {
      id: 'other-works',
      group: 'works',
      title: 'Other Works',
      value: calculatedMetrics.otherWorks || 0,
      subtitle: `${((calculatedMetrics.otherWorks / Math.max(1, calculatedMetrics.totalWorks)) * 100).toFixed(1)}%`,
      icon: MoreHorizontal,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      infoText: "Miscellaneous infrastructure works including special projects."
    }
  ];

  const budgetMetrics = [
    {
      id: 'total-budget',
      group: 'budget',
      title: 'Total Sanctioned',
      value: formatCurrency(calculatedMetrics.totalSanctionedCr),
      subtitle: `${calculatedMetrics.totalWorks} works`,
      icon: IndianRupee,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      sparkline: generateTrendData(calculatedMetrics.totalSanctionedCr || 0, 100),
      infoText: "Total sanctioned budget for all border infrastructure works."
    },
    {
      id: 'spent-budget',
      group: 'budget',
      title: 'Total Spent',
      value: formatCurrency(calculatedMetrics.totalSpentCr),
      subtitle: `${formatPercentage(calculatedMetrics.utilizationRate)} utilized`,
      icon: CreditCard,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      percentage: calculatedMetrics.utilizationRate,
      infoText: "Actual expenditure across all works based on completion progress."
    },
    {
      id: 'remaining-budget',
      group: 'budget',
      title: 'Remaining Budget',
      value: formatCurrency(calculatedMetrics.remainingBudgetCr),
      subtitle: 'Available',
      icon: Wallet,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      infoText: "Budget yet to be utilized for ongoing and planned works."
    },
    {
      id: 'avg-budget',
      group: 'budget',
      title: 'Average per Work',
      value: formatCurrency(calculatedMetrics.avgWorkBudgetCr),
      subtitle: 'Per work',
      icon: Coins,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Average sanctioned amount per work across all categories."
    },
    {
      id: 'high-budget',
      group: 'budget',
      title: 'High Value Works',
      value: calculatedMetrics.highBudgetWorks || 0,
      subtitle: '>₹50 Cr',
      icon: Banknote,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      infoText: "Works with sanctioned budget exceeding ₹50 crores requiring special monitoring."
    },
    {
      id: 'medium-budget',
      group: 'budget',
      title: 'Medium Budget',
      value: calculatedMetrics.mediumBudgetWorks || 0,
      subtitle: '₹10-50 Cr',
      icon: Database,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      infoText: "Works with budget between ₹10-50 crores."
    },
    {
      id: 'low-budget',
      group: 'budget',
      title: 'Small Works',
      value: calculatedMetrics.lowBudgetWorks || 0,
      subtitle: '≤₹10 Cr',
      icon: PiggyBank,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      infoText: "Smaller works with budget up to ₹10 crores."
    },
    {
      id: 'cost-overruns',
      group: 'budget',
      title: 'Cost Overruns',
      value: calculatedMetrics.costOverruns || 0,
      subtitle: 'Works',
      icon: TrendingUp,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: calculatedMetrics.costOverruns > 0,
      infoText: "Works where spending has exceeded the sanctioned budget."
    }
  ];

  const progressMetrics = [
    {
      id: 'completed',
      group: 'progress',
      title: 'Completed',
      value: calculatedMetrics.completedWorks || 0,
      subtitle: '100%',
      icon: CalendarCheck,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Works that have achieved 100% physical completion."
    },
    {
      id: 'near-completion',
      group: 'progress',
      title: 'Near Completion',
      value: calculatedMetrics.nearCompletionWorks || 0,
      subtitle: '75-99%',
      icon: Target,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      infoText: "Works between 75-99% completion requiring final push."
    },
    {
      id: 'advanced',
      group: 'progress',
      title: 'Advanced Stage',
      value: calculatedMetrics.advancedWorks || 0,
      subtitle: '50-75%',
      icon: Activity,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Works that are 50-75% complete and progressing well."
    },
    {
      id: 'in-progress',
      group: 'progress',
      title: 'In Progress',
      value: calculatedMetrics.inProgressWorks || 0,
      subtitle: '25-50%',
      icon: Timer,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Works in active execution between 25-50% completion."
    },
    {
      id: 'initial-stage',
      group: 'progress',
      title: 'Initial Stage',
      value: calculatedMetrics.initialStageWorks || 0,
      subtitle: '1-25%',
      icon: PlayCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Works that have just started with less than 25% progress."
    },
    {
      id: 'not-started',
      group: 'progress',
      title: 'Not Started',
      value: calculatedMetrics.notStartedWorks || 0,
      subtitle: '0%',
      icon: PauseCircle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: calculatedMetrics.notStartedWorks > calculatedMetrics.totalWorks * 0.3,
      infoText: "Works yet to commence physical execution."
    },
    {
      id: 'avg-progress',
      group: 'progress',
      title: 'Average Progress',
      value: `${formatPercentage(calculatedMetrics.avgProgress)}`,
      subtitle: 'Overall',
      icon: Gauge,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      percentage: calculatedMetrics.avgProgress,
      infoText: "Average physical progress across all works."
    },
    {
      id: 'progress-variance',
      group: 'progress',
      title: 'Progress Spread',
      value: `±${formatPercentage(calculatedMetrics.progressVariance)}`,
      subtitle: 'Std Dev',
      icon: BarChart3,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      infoText: "Standard deviation in progress across all works."
    }
  ];

  const healthMetrics = [
    {
      id: 'critical-risk',
      group: 'health',
      title: 'Critical Risk',
      value: calculatedMetrics.criticalRiskWorks || 0,
      subtitle: 'Urgent attention',
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: true,
      pulse: calculatedMetrics.criticalRiskWorks > 5,
      infoText: "Works facing critical issues requiring immediate management intervention."
    },
    {
      id: 'high-risk',
      group: 'health',
      title: 'High Risk',
      value: calculatedMetrics.highRiskWorks || 0,
      subtitle: 'Monitor closely',
      icon: AlertCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Works with significant risk factors needing close monitoring."
    },
    {
      id: 'medium-risk',
      group: 'health',
      title: 'Medium Risk',
      value: calculatedMetrics.mediumRiskWorks || 0,
      subtitle: 'Watch',
      icon: Clock,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Works with moderate risk requiring periodic review."
    },
    {
      id: 'low-risk',
      group: 'health',
      title: 'Low Risk',
      value: calculatedMetrics.lowRiskWorks || 0,
      subtitle: 'Stable',
      icon: Heart,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Works progressing smoothly with minimal risk."
    },
    {
      id: 'on-track',
      group: 'health',
      title: 'On Track',
      value: calculatedMetrics.onTrackWorks || 0,
      subtitle: 'As planned',
      icon: Zap,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      infoText: "Works progressing as per schedule without delays."
    },
    {
      id: 'minor-delay',
      group: 'health',
      title: 'Minor Delays',
      value: calculatedMetrics.minorDelayWorks || 0,
      subtitle: 'Manageable',
      icon: Clock,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Works with minor delays that can be managed."
    },
    {
      id: 'moderate-delay',
      group: 'health',
      title: 'Moderate Delays',
      value: calculatedMetrics.moderateDelayWorks || 0,
      subtitle: 'Attention needed',
      icon: CalendarClock,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Works with moderate delays requiring intervention."
    },
    {
      id: 'severe-delay',
      group: 'health',
      title: 'Severe Delay',
      value: calculatedMetrics.severeDelayWorks || 0,
      subtitle: 'Major delays',
      icon: CalendarX,
      color: 'red',
      gradient: 'from-red-600 to-red-700',
      alert: calculatedMetrics.severeDelayWorks > 0,
      infoText: "Works facing severe delays affecting completion timeline."
    },
    {
      id: 'efficiency-score',
      group: 'health',
      title: 'Avg Efficiency',
      value: `${calculatedMetrics.avgEfficiency.toFixed(1)}%`,
      subtitle: 'Performance',
      icon: Gauge,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      percentage: calculatedMetrics.avgEfficiency,
      infoText: "Average efficiency score based on progress and timeline adherence."
    },
    {
      id: 'health-score',
      group: 'health',
      title: 'Health Score',
      value: `${calculatedMetrics.healthScore.toFixed(1)}%`,
      subtitle: 'Overall health',
      icon: Heart,
      color: 'pink',
      gradient: 'from-pink-500 to-pink-600',
      percentage: calculatedMetrics.healthScore,
      infoText: "Overall project portfolio health score."
    }
  ];

  const locationMetrics = [
    {
      id: 'frontiers',
      group: 'location',
      title: 'Frontiers',
      value: calculatedMetrics.totalFrontiers || 0,
      subtitle: 'Border regions',
      icon: Globe,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Number of distinct frontier regions where works are being executed."
    },
    {
      id: 'sector-hqs',
      group: 'location',
      title: 'Sector HQs',
      value: calculatedMetrics.totalSectorHQs || 0,
      subtitle: 'Command centers',
      icon: Navigation,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Number of sector headquarters managing the works."
    },
    {
      id: 'total-length',
      group: 'location',
      title: 'Total Length',
      value: `${calculatedMetrics.totalLengthKm.toFixed(1)} km`,
      subtitle: 'Infrastructure',
      icon: Route,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Total length of linear infrastructure (roads, fencing) being developed."
    },
    {
      id: 'avg-length',
      group: 'location',
      title: 'Avg Length',
      value: `${calculatedMetrics.avgLengthKm.toFixed(1)} km`,
      subtitle: 'Per work',
      icon: Layers,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      infoText: "Average length per linear infrastructure work."
    },
    {
      id: 'units-aor',
      group: 'location',
      title: 'Units/AOR',
      value: calculatedMetrics.totalUnitsAOR || 0,
      subtitle: 'Coverage',
      icon: Building2,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Total units or areas of responsibility covered."
    },
    {
      id: 'frontiers-risk',
      group: 'location',
      title: 'At-Risk Frontiers',
      value: calculatedMetrics.frontiersWithHighRisk || 0,
      subtitle: 'High risk areas',
      icon: MapPin,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: calculatedMetrics.frontiersWithHighRisk > 0,
      infoText: "Frontiers with critical or high-risk works."
    },
    {
      id: 'sectors-delay',
      group: 'location',
      title: 'Delayed Sectors',
      value: calculatedMetrics.sectorsWithDelays || 0,
      subtitle: 'With delays',
      icon: Users,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      infoText: "Sectors with works experiencing delays."
    }
  ];

  const priorityMetrics = [
    {
      id: 'urgent-priority',
      group: 'priority',
      title: 'Urgent Priority',
      value: calculatedMetrics.urgentPriorityWorks || 0,
      subtitle: 'Immediate',
      icon: Zap,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: calculatedMetrics.urgentPriorityWorks > 10,
      infoText: "Works requiring immediate execution due to strategic importance."
    },
    {
      id: 'high-priority',
      group: 'priority',
      title: 'High Priority',
      value: calculatedMetrics.highPriorityWorks || 0,
      subtitle: 'Important',
      icon: AlertCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Important works requiring expedited execution."
    },
    {
      id: 'medium-priority',
      group: 'priority',
      title: 'Medium Priority',
      value: calculatedMetrics.mediumPriorityWorks || 0,
      subtitle: 'Standard',
      icon: Activity,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Works with standard priority for regular execution."
    },
    {
      id: 'low-priority',
      group: 'priority',
      title: 'Low Priority',
      value: calculatedMetrics.lowPriorityWorks || 0,
      subtitle: 'Routine',
      icon: Info,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      infoText: "Routine works that can proceed at normal pace."
    }
  ];

  const timelineMetrics = [
    {
      id: 'overdue',
      group: 'timeline',
      title: 'Overdue Works',
      value: calculatedMetrics.overdueWorks || 0,
      subtitle: 'Past PDC',
      icon: CalendarX,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: calculatedMetrics.overdueWorks > 0,
      infoText: "Works that have crossed their probable date of completion."
    },
    {
      id: 'near-pdc',
      group: 'timeline',
      title: 'Near PDC',
      value: calculatedMetrics.nearPDCWorks || 0,
      subtitle: 'Next 90 days',
      icon: CalendarClock,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Works approaching completion deadline in next 90 days."
    },
    {
      id: 'within-schedule',
      group: 'timeline',
      title: 'Within Schedule',
      value: calculatedMetrics.withinScheduleWorks || 0,
      subtitle: 'On time',
      icon: CalendarCheck,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Works progressing within planned timeline."
    },
    {
      id: 'avg-days-pdc',
      group: 'timeline',
      title: 'Avg Days to PDC',
      value: calculatedMetrics.avgDaysToPDC.toFixed(0) || 0,
      subtitle: 'Days remaining',
      icon: Timer,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Average days remaining to probable date of completion."
    },
    {
      id: 'hlec-years',
      group: 'timeline',
      title: 'HLEC Meetings',
      value: calculatedMetrics.totalHLECYears || 0,
      subtitle: 'Approval years',
      icon: FileText,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Number of distinct HLEC meetings where works were approved."
    },
    {
      id: 'recent-hlec',
      group: 'timeline',
      title: 'Recent HLEC',
      value: calculatedMetrics.recentHLECWorks || 0,
      subtitle: 'Last 2 years',
      icon: CalendarDays,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      infoText: "Works approved in recent HLEC meetings."
    },
    {
      id: 'old-hlec',
      group: 'timeline',
      title: 'Old HLEC',
      value: calculatedMetrics.oldHLECWorks || 0,
      subtitle: '>5 years',
      icon: Clock,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      infoText: "Works approved more than 5 years ago."
    }
  ];

  const performanceMetrics = [
    {
      id: 'performance-index',
      group: 'performance',
      title: 'Performance Index',
      value: `${calculatedMetrics.performanceIndex.toFixed(1)}%`,
      subtitle: 'Overall',
      icon: Award,
      color: 'gold',
      gradient: 'from-yellow-400 to-yellow-600',
      percentage: calculatedMetrics.performanceIndex,
      infoText: "Composite performance index based on progress, efficiency, and risk."
    },
    {
      id: 'productivity-score',
      group: 'performance',
      title: 'Productivity',
      value: `${calculatedMetrics.productivityScore.toFixed(1)}`,
      subtitle: 'Km/Cr',
      icon: Cpu,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Productivity measured as km of infrastructure per crore spent."
    },
    {
      id: 'quality-score',
      group: 'performance',
      title: 'Quality Score',
      value: `${calculatedMetrics.qualityScore.toFixed(1)}%`,
      subtitle: 'Standards',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      percentage: calculatedMetrics.qualityScore,
      infoText: "Quality score based on completion and health status."
    },
    {
      id: 'timeliness-score',
      group: 'performance',
      title: 'Timeliness',
      value: `${calculatedMetrics.timelinessScore.toFixed(1)}%`,
      subtitle: 'Schedule adherence',
      icon: Clock,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      percentage: calculatedMetrics.timelinessScore,
      infoText: "Percentage of works within scheduled timeline."
    }
  ];

  const financialMetrics = [
    {
      id: 'budget-health',
      group: 'financial',
      title: 'Budget Health',
      value: `${calculatedMetrics.budgetHealthScore.toFixed(1)}%`,
      subtitle: 'Financial status',
      icon: ThermometerSun,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      percentage: calculatedMetrics.budgetHealthScore,
      infoText: "Overall financial health of the project portfolio."
    },
    {
      id: 'spending-efficiency',
      group: 'financial',
      title: 'Spend Efficiency',
      value: `${calculatedMetrics.spendingEfficiency.toFixed(1)}%`,
      subtitle: 'Value for money',
      icon: Sparkles,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      percentage: calculatedMetrics.spendingEfficiency,
      infoText: "Efficiency of spending relative to progress achieved."
    },
    {
      id: 'cost-per-km',
      group: 'financial',
      title: 'Cost per Km',
      value: formatCurrency(calculatedMetrics.costPerKm),
      subtitle: 'Infrastructure',
      icon: Route,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Average cost per kilometer of linear infrastructure."
    },
    {
      id: 'cost-per-unit',
      group: 'financial',
      title: 'Cost per Unit',
      value: formatCurrency(calculatedMetrics.costPerUnit),
      subtitle: 'AOR/Unit',
      icon: Building2,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Average cost per unit or area of responsibility."
    },
    {
      id: 'budget-variance',
      group: 'financial',
      title: 'Budget Variance',
      value: formatCurrency(calculatedMetrics.budgetVariance),
      subtitle: 'Average deviation',
      icon: GitBranch,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Average budget variance across all works."
    }
  ];

  // Group metrics for filtering
  const metricGroups = {
    all: [...worksMetrics, ...budgetMetrics, ...progressMetrics, ...healthMetrics, ...locationMetrics, ...priorityMetrics, ...timelineMetrics, ...performanceMetrics, ...financialMetrics],
    works: worksMetrics,
    budget: budgetMetrics,
    progress: progressMetrics,
    health: healthMetrics,
    location: locationMetrics,
    priority: priorityMetrics,
    timeline: timelineMetrics,
    performance: performanceMetrics,
    financial: financialMetrics
  };

  // MetricCard Component
  const MetricCard = ({ metric, isMain = false, size = 'normal' }) => {
    const isHovered = hoveredCard === metric.id;
    const [showInfo, setShowInfo] = useState(false);

    const cardSizes = {
      compact: 'p-3',
      normal: 'p-4',
      large: 'p-6'
    };

    return (
      <div
        onClick={() => handleMetricClick(metric)}
        onMouseEnter={() => setHoveredCard(metric.id)}
        onMouseLeave={() => {
          setHoveredCard(null);
          setShowInfo(false);
        }}
        className={`
          relative rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer
          ${darkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
            : 'bg-white border-gray-100 hover:bg-gray-50'
          }
          ${cardSizes[size]}
          hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5
          ${metric.alert ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
          ${metric.pulse ? 'animate-pulse' : ''}
        `}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-[0.03] rounded-2xl pointer-events-none`} />
        
        {/* Alert indicator */}
        {metric.alert && (
          <div className="absolute -top-1 -right-1 z-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>
        )}
        
        <div className="relative">
          {/* Main card content */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {metric.title}
                </span>
              </div>
            </div>
            
            {/* Main icon */}
            <div className={`rounded-xl bg-gradient-to-br ${metric.gradient} shadow-sm ${
              size === 'compact' ? 'p-2' : 'p-2.5'
            }`}>
              <metric.icon size={size === 'compact' ? 14 : isMain ? 18 : 16} className="text-white" />
            </div>
          </div>
          
          {/* Value display */}
          <div className={`${
            size === 'compact' ? 'text-base' : isMain ? 'text-xl' : 'text-lg'
          } font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          } mb-1`}>
            {metric.value}
          </div>
          
          {metric.subtitle && size !== 'compact' && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {metric.subtitle}
            </div>
          )}
          {/* Progress bar */}
          {metric.percentage !== undefined && size !== 'compact' && (
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full bg-gradient-to-r ${metric.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
              />
            </div>
          )}
          
          {/* Sparkline chart */}
          {metric.sparkline && showTrends && size === 'normal' && (
            <div className="mt-3 h-8 pointer-events-none opacity-50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metric.sparkline}>
                  <defs>
                    <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="none"
                    fill={`url(#gradient-${metric.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Help Icon */}
        {showInfoTooltips && metric.infoText && size !== 'compact' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setShowInfo(true);
            }}
            className={`absolute bottom-2 right-2 p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors z-20`}
          >
            <HelpCircle size={14} className="text-gray-400" />
          </button>
        )}
        
        {/* Info Tooltip */}
        {showInfo && metric.infoText && (
          <div 
            className={`absolute bottom-10 right-0 w-64 p-3 rounded-xl shadow-2xl ${
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } border z-[9999]`}
            style={{ maxWidth: '250px' }}
          >
            <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
              {metric.infoText}
            </p>
          </div>
        )}
      </div>
    );
  };

  // List View Card Component
  const ListViewCard = ({ metric }) => {
    return (
      <div
        onClick={() => handleMetricClick(metric)}
        className={`
          flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer
          ${darkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
            : 'bg-white border-gray-100 hover:bg-gray-50'
          }
          hover:shadow-md
        `}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`rounded-lg bg-gradient-to-br ${metric.gradient} p-2`}>
            <metric.icon size={20} className="text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {metric.title}
              </h4>
              {metric.alert && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
              {metric.infoText}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {metric.value}
          </div>
          {metric.subtitle && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {metric.subtitle}
            </div>
          )}
        </div>
        
        {metric.percentage !== undefined && (
          <div className="ml-4 w-24">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${metric.gradient}`}
                style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Drill-down Modal Component
  const DrillDownModal = () => {
    if (!showDrillDown || !drillDownData || drillDownData.length === 0) return null;

    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeDrillDown}
        />
        
        <div className={`relative w-[95vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-green-500 to-green-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {drillDownTitle}
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-green-100'}`}>
                  Showing {drillDownData.length} works - Click on any row to view details
                </p>
              </div>
              <button
                onClick={closeDrillDown}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-green-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Use DataTable component for the table display */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={drillDownData}
              darkMode={darkMode}
              onRowClick={(row) => {
                // Close drill-down modal first
                closeDrillDown();
                
                // Then trigger project selection if handler exists
                if (onProjectSelect) {
                  onProjectSelect(row);
                }
              }}
              compareMode={false}
              selectedProjects={[]}
              maxHeight="calc(85vh - 100px)"
              maxWidth="100%"
            />
          </div>
        </div>
      </div>
    );
  };

  // Section Component for grouping metrics
  const MetricSection = ({ title, icon: Icon, color, metrics }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
      <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      } overflow-hidden`}>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-3 ${
            darkMode ? 'bg-gray-900/50 border-gray-700' : `bg-${color}-50 border-${color}-100`
          } border-b flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center`}>
              <Icon size={16} className="text-white" />
            </div>
            <h3 className="font-semibold capitalize">{title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              {metrics.length} metrics
            </span>
          </div>
          <ChevronDown 
            size={20} 
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        
        {isExpanded && (
          <div className={`p-4 ${
            viewLayout === 'list' ? 'space-y-2' : `grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
                : cardSize === 'large'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`
          }`}>
            {metrics.map((metric) => (
              viewLayout === 'list' 
                ? <ListViewCard key={metric.id} metric={metric} />
                : <MetricCard key={metric.id} metric={metric} size={cardSize} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      } shadow-sm border`}>
        {/* Group Filter */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            View:
          </span>
          <div className="flex gap-1 flex-wrap">
            {Object.keys(metricGroups).map(group => (
              <button
                key={group}
                onClick={() => setSelectedMetricGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedMetricGroup === group
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
        
        {/* Options */}
        <div className="flex items-center gap-3">
          {/* Layout Toggle */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setViewLayout('grid')}
              className={`px-2 py-1 ${
                viewLayout === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Grid3x3 size={14} />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`px-2 py-1 ${
                viewLayout === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Layers size={14} />
            </button>
          </div>
          
          {/* Size Toggle (only for grid view) */}
          {viewLayout === 'grid' && (
            <select
              value={cardSize}
              onChange={(e) => setCardSize(e.target.value)}
              className={`px-2 py-1 rounded-lg text-xs ${
                darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-blue-400`}
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          )}
          
          {/* Info Toggle */}
          <button
            onClick={() => setShowInfoTooltips(!showInfoTooltips)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              showInfoTooltips
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Info size={12} />
            Help
          </button>
          
          {/* Trends Toggle */}
          {viewLayout === 'grid' && (
            <button
              onClick={() => setShowTrends(!showTrends)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                showTrends
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity size={12} />
              Trends
            </button>
          )}
          
          {/* Refresh Button */}
          <button
            onClick={() => {
              // Trigger a refresh of data if needed
              window.location.reload();
            }}
            className={`p-1.5 rounded-lg transition-all ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Refresh Metrics"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className={`flex flex-wrap gap-3 p-3 rounded-xl ${
        darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-r from-blue-50 to-green-50'
      } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 px-3 py-1">
          <Construction size={16} className="text-blue-500" />
          <span className="text-sm">
            <strong>{calculatedMetrics.totalWorks}</strong> Total Works
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1">
          <IndianRupee size={16} className="text-green-500" />
          <span className="text-sm">
            <strong>{formatCurrency(calculatedMetrics.totalSanctionedCr)}</strong> Budget
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1">
          <Activity size={16} className="text-purple-500" />
          <span className="text-sm">
            <strong>{formatPercentage(calculatedMetrics.avgProgress)}</strong> Avg Progress
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1">
          <Heart size={16} className="text-pink-500" />
          <span className="text-sm">
            <strong>{formatPercentage(calculatedMetrics.healthScore)}</strong> Health Score
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm">
            <strong>{calculatedMetrics.criticalRiskWorks}</strong> Critical
          </span>
        </div>
      </div>

      {/* Metrics Display */}
      {selectedMetricGroup === 'all' ? (
        // Show all sections with headers
        <div className="space-y-6">
          {Object.entries({
            works: { icon: Construction, color: 'blue', metrics: worksMetrics },
            budget: { icon: IndianRupee, color: 'green', metrics: budgetMetrics },
            progress: { icon: Activity, color: 'purple', metrics: progressMetrics },
            health: { icon: Heart, color: 'red', metrics: healthMetrics },
            location: { icon: Globe, color: 'indigo', metrics: locationMetrics },
            priority: { icon: Zap, color: 'orange', metrics: priorityMetrics },
            timeline: { icon: CalendarDays, color: 'cyan', metrics: timelineMetrics },
            performance: { icon: Award, color: 'yellow', metrics: performanceMetrics },
            financial: { icon: ThermometerSun, color: 'emerald', metrics: financialMetrics }
          }).map(([key, section]) => (
            <MetricSection
              key={key}
              title={key}
              icon={section.icon}
              color={section.color}
              metrics={section.metrics}
            />
          ))}
        </div>
      ) : (
        // Show single section without header
        <div className={`${
          viewLayout === 'list' ? 'space-y-2' : `grid gap-4 ${
            cardSize === 'compact' 
              ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
              : cardSize === 'large'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`
        }`}>
          {metricGroups[selectedMetricGroup].map((metric) => (
            viewLayout === 'list' 
              ? <ListViewCard key={metric.id} metric={metric} />
              : <MetricCard key={metric.id} metric={metric} size={cardSize} />
          ))}
        </div>
      )}

      {/* Drill-down Modal */}
      <DrillDownModal />
    </div>
  );
};

export default MetricsCards;