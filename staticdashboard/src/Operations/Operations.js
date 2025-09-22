import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Shield, Construction, Route, Bridge, Building, MoreHorizontal,
  TrendingUp, IndianRupee, Clock, CheckCircle, AlertCircle,
  Activity, Briefcase, Download, RefreshCw, Globe, Navigation,
  Gauge, AlertTriangle, Settings, Bell, Filter, Save, Share2,
  Printer, Moon, Sun, X, ChevronDown, Eye, Maximize2, Minimize2,
  Grid3x3, Search, Database, BarChart3, Users, MapPin, Calendar,
  Building2, Target, GitBranch, FileText, Menu, Home, LogOut,
  HelpCircle, Link2, Info, Layers, Heart, Zap, PauseCircle,
  CreditCard, Timer, CalendarDays, CalendarClock, CalendarCheck,
  CalendarX, Award, Package, Cpu, ThermometerSun, Sparkles
} from 'lucide-react';
import { useDataOperations } from './useData';
import { useFilters } from './useFilters';
import FilterPanel from './FilterPanel';
import MetricsCards from './MetricsCards';
import ChartTabs from './ChartTabs';
import DataTable from './DataTable';
import Modal from './Modal';
import AISuggestions from './AISuggestions';
import TabView from './TabView';
import { calculateMetrics, exportData, printReport } from './utils';

// Cookie utility functions
const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Helper function to format currency amounts
const formatAmount = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 100) {
    return `₹${absValue.toFixed(2)} Cr`;
  } else if (absValue >= 1) {
    return `₹${absValue.toFixed(2)} Cr`;
  } else {
    return `₹${(absValue * 100).toFixed(2)} L`;
  }
};

// Helper function to format percentage
const formatPercentage = (value) => {
  if (!value) return '0%';
  const percentValue = value <= 1 ? value * 100 : value;
  return `${percentValue.toFixed(1)}%`;
};

const Operations = () => {
  // State Management
  const [darkMode, setDarkMode] = useState(() => {
    const saved = getCookie('operations_darkMode');
    return saved === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedWorks, setSelectedWorks] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    const saved = getCookie('operations_viewMode');
    return saved || 'dashboard';
  });
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [layoutMode, setLayoutMode] = useState('default');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilterInfo, setShowFilterInfo] = useState(false);

  // Custom hooks for data and filters
  const { rawData, loading, error, refetch, lastUpdate, dataStats } = useDataOperations();
  const filters = useFilters();

  // Save preferences to cookies when they change
  useEffect(() => {
    setCookie('operations_darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    setCookie('operations_viewMode', viewMode);
  }, [viewMode]);

  // Initialize filters with raw data
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      console.log('Operations: Raw data loaded', {
        count: rawData.length,
        sample: rawData[0],
        fields: Object.keys(rawData[0] || {})
      });
      
      filters.setRawData(rawData);
      
      const amounts = rawData.map(d => d.sanctioned_amount_cr || 0);
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 0) {
        filters.setAmountRangeCr([0, maxAmount]);
      }

      if (rawData.length > 0) {
        generateInsights(rawData);
      }
    }
  }, [rawData]);

  // Get filtered data from filters
  const filteredData = filters.filteredData || [];

  // Get filter relationships for display
  const filterRelationships = useMemo(() => {
    if (!filters.getRelatedMappings) return null;
    return filters.getRelatedMappings();
  }, [filters]);

  // Check if cascading is active
  const isCascadingActive = useMemo(() => {
    return (
      filters.selectedFrontiers?.length > 0 ||
      filters.selectedSectorHQs?.length > 0 ||
      filters.selectedWorkTypes?.length > 0 ||
      filters.selectedWorkCategories?.length > 0
    );
  }, [filters.selectedFrontiers, filters.selectedSectorHQs, filters.selectedWorkTypes, filters.selectedWorkCategories]);

  // Calculate metrics with proper amount handling
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalWorks: 0,
        totalSanctionedCr: 0,
        totalSpentCr: 0,
        remainingBudgetCr: 0,
        avgProgress: 0,
        avgEfficiency: 0,
        avgHealthScore: 0,
        completedWorks: 0,
        ongoingWorks: 0,
        notStartedWorks: 0,
        criticalProjects: 0,
        onTrackProjects: 0,
        utilizationRate: 0,
        completionRate: 0,
        criticalRate: 0,
        highRiskProjects: 0,
        mediumRiskProjects: 0,
        lowRiskProjects: 0,
        totalFrontiers: 0,
        totalSectorHQs: 0,
        totalWorkTypes: 0,
        avgLengthKm: 0,
        totalUnitsAOR: 0,
        overdueProjects: 0,
        nearPDCProjects: 0,
        urgentPriority: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        bopProjects: 0,
        fencingProjects: 0,
        roadProjects: 0,
        bridgeProjects: 0,
        infrastructureProjects: 0,
        onTrackCount: 0,
        minorDelayCount: 0,
        moderateDelayCount: 0,
        severeDelayCount: 0
      };
    }

    const total = filteredData.length;
    const totalSanctioned = filteredData.reduce((sum, item) => sum + (item.sanctioned_amount_cr || 0), 0);
    const totalSpent = filteredData.reduce((sum, item) => sum + (item.spent_amount_cr || 0), 0);
    const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remaining_amount_cr || 0), 0);
    const avgProgress = filteredData.reduce((sum, item) => sum + ((item.completed_percentage || 0) * 100), 0) / total;
    const avgEfficiency = filteredData.reduce((sum, item) => sum + (item.efficiency_score || 0), 0) / total;
    const avgHealthScore = avgEfficiency; // Using efficiency as health proxy for Operations
    
    const completedWorks = filteredData.filter(item => item.completion_status === 'COMPLETED').length;
    const ongoingWorks = filteredData.filter(item => 
      item.completion_status && !['COMPLETED', 'NOT_STARTED'].includes(item.completion_status)
    ).length;
    const notStartedWorks = filteredData.filter(item => item.completion_status === 'NOT_STARTED').length;
    
    const criticalProjects = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
    const highRiskProjects = filteredData.filter(item => item.risk_level === 'HIGH').length;
    const mediumRiskProjects = filteredData.filter(item => item.risk_level === 'MEDIUM').length;
    const lowRiskProjects = filteredData.filter(item => item.risk_level === 'LOW').length;
    
    // Project health counts
    const onTrackProjects = filteredData.filter(item => item.project_health === 'ON_TRACK').length;
    const minorDelayCount = filteredData.filter(item => item.project_health === 'MINOR_DELAY').length;
    const moderateDelayCount = filteredData.filter(item => item.project_health === 'MODERATE_DELAY').length;
    const severeDelayCount = filteredData.filter(item => item.project_health === 'SEVERE_DELAY').length;
    
    // Priority counts
    const urgentPriority = filteredData.filter(item => item.priority === 'URGENT').length;
    const highPriority = filteredData.filter(item => item.priority === 'HIGH').length;
    const mediumPriority = filteredData.filter(item => item.priority === 'MEDIUM').length;
    const lowPriority = filteredData.filter(item => item.priority === 'LOW').length;
    
    // Work category counts
    const bopProjects = filteredData.filter(item => item.work_category === 'BORDER_OUTPOST').length;
    const fencingProjects = filteredData.filter(item => item.work_category === 'FENCING').length;
    const roadProjects = filteredData.filter(item => item.work_category === 'ROAD').length;
    const bridgeProjects = filteredData.filter(item => item.work_category === 'BRIDGE').length;
    const infrastructureProjects = filteredData.filter(item => item.work_category === 'INFRASTRUCTURE').length;
    
    // PDC status
    const overdueProjects = filteredData.filter(item => item.days_to_pdc && item.days_to_pdc < 0).length;
    const nearPDCProjects = filteredData.filter(item => item.days_to_pdc >= 0 && item.days_to_pdc <= 90).length;
    
    // Calculate unique counts
    const uniqueFrontiers = new Set(
      filteredData
        .map(item => item.frontier)
        .filter(frontier => frontier && frontier !== '' && frontier !== 'Unknown')
    );
    
    const uniqueSectorHQs = new Set(
      filteredData
        .map(item => item.sector_hq)
        .filter(sector => sector && sector !== '' && sector !== 'Unknown')
    );
    
    const uniqueWorkTypes = new Set(
      filteredData
        .map(item => item.work_type)
        .filter(type => type && type !== '' && type !== 'UNKNOWN')
    );
    
    // Calculate average length and total units
    const avgLengthKm = filteredData
      .filter(item => item.length_km)
      .reduce((sum, item) => sum + item.length_km, 0) / 
      filteredData.filter(item => item.length_km).length || 0;
    
    const totalUnitsAOR = filteredData.reduce((sum, item) => sum + (item.units_aor || 0), 0);
    
    return {
      totalWorks: total,
      totalSanctionedCr: totalSanctioned,
      totalSpentCr: totalSpent,
      remainingBudgetCr: totalRemaining,
      avgProgress: avgProgress.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      completedWorks,
      ongoingWorks,
      notStartedWorks,
      criticalProjects,
      highRiskProjects,
      mediumRiskProjects,
      lowRiskProjects,
      onTrackProjects,
      onTrackCount: onTrackProjects,
      minorDelayCount,
      moderateDelayCount,
      severeDelayCount,
      utilizationRate: totalSanctioned ? ((totalSpent / totalSanctioned) * 100).toFixed(1) : 0,
      completionRate: total ? ((completedWorks / total) * 100).toFixed(1) : 0,
      criticalRate: total ? ((criticalProjects / total) * 100).toFixed(1) : 0,
      totalFrontiers: uniqueFrontiers.size,
      totalSectorHQs: uniqueSectorHQs.size,
      totalWorkTypes: uniqueWorkTypes.size,
      avgLengthKm: avgLengthKm.toFixed(1),
      totalUnitsAOR,
      overdueProjects,
      nearPDCProjects,
      urgentPriority,
      highPriority,
      mediumPriority,
      lowPriority,
      bopProjects,
      fencingProjects,
      roadProjects,
      bridgeProjects,
      infrastructureProjects
    };
  }, [filteredData]);

  // Filter presets for Operations
  const [filterPresets] = useState([
    { 
      name: 'Critical Projects', 
      icon: AlertTriangle, 
      filters: { 
        riskLevels: ['CRITICAL']
      } 
    },
    { 
      name: 'Border Outposts', 
      icon: Shield, 
      filters: { 
        workCategories: ['BORDER_OUTPOST']
      } 
    },
    { 
      name: 'On Track', 
      icon: Zap, 
      filters: { 
        projectHealths: ['ON_TRACK']
      } 
    },
    { 
      name: 'Severe Delays', 
      icon: AlertCircle, 
      filters: { 
        projectHealths: ['SEVERE_DELAY']
      } 
    },
    { 
      name: 'Not Started', 
      icon: Package, 
      filters: { 
        completionStatuses: ['NOT_STARTED']
      } 
    },
    { 
      name: 'Near Completion', 
      icon: Target, 
      filters: { 
        completionStatuses: ['NEAR_COMPLETION']
      } 
    },
    { 
      name: 'Completed', 
      icon: CheckCircle, 
      filters: { 
        completionStatuses: ['COMPLETED']
      } 
    },
    { 
      name: 'High Budget (>50 Cr)', 
      icon: IndianRupee, 
      filters: { 
        amountRangeCr: [50, Infinity]
      } 
    },
    { 
      name: 'Urgent Priority', 
      icon: Zap, 
      filters: { 
        priorities: ['URGENT', 'HIGH']
      } 
    },
    { 
      name: 'Overdue PDC', 
      icon: CalendarX, 
      filters: { 
        daysToPDCRange: [-1825, -1]
      } 
    }
  ]);

  // Data range calculations
  const dataRanges = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        amountMin: 0,
        amountMax: 1000,
        lengthMin: 0,
        lengthMax: 1000,
        unitsMin: 0,
        unitsMax: 500,
        efficiencyMin: 0,
        efficiencyMax: 100,
        progressMin: 0,
        progressMax: 100
      };
    }

    const amounts = rawData.map(d => d.sanctioned_amount_cr || 0);
    const lengths = rawData.map(d => d.length_km || 0);
    const units = rawData.map(d => d.units_aor || 0);
    const efficiency = rawData.map(d => d.efficiency_score || 0);
    const progress = rawData.map(d => (d.completed_percentage || 0) * 100);

    return {
      amountMin: 0,
      amountMax: Math.ceil(Math.max(...amounts, 100)),
      lengthMin: 0,
      lengthMax: Math.ceil(Math.max(...lengths, 100)),
      unitsMin: 0,
      unitsMax: Math.ceil(Math.max(...units, 100)),
      efficiencyMin: 0,
      efficiencyMax: 100,
      progressMin: 0,
      progressMax: 100
    };
  }, [rawData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        refetch();
        addNotification('Data refreshed', 'info');
      }, refreshInterval * 60000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refetch]);

  // Check for critical projects and add notifications
  useEffect(() => {
    const criticalWorks = filteredData.filter(p => p.risk_level === 'CRITICAL');
    if (criticalWorks.length > 5) {
      addNotification(
        `${criticalWorks.length} works require immediate attention`,
        'warning'
      );
    }
  }, [filteredData]);

  // Helper Functions
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
  };

  const generateInsights = (data) => {
    const insights = [];
    
    const criticalCount = data.filter(d => d.risk_level === 'CRITICAL').length;
    if (criticalCount > data.length * 0.2) {
      insights.push({
        type: 'critical',
        message: `${criticalCount} works (${(criticalCount/data.length * 100).toFixed(1)}%) are in critical state`,
        action: 'Review resource allocation'
      });
    }

    const totalBudget = data.reduce((sum, d) => sum + (d.sanctioned_amount_cr || 0), 0);
    const totalSpent = data.reduce((sum, d) => sum + (d.spent_amount_cr || 0), 0);
    const utilization = (totalSpent / totalBudget * 100);
    if (utilization < 50) {
      insights.push({
        type: 'budget',
        message: `Low budget utilization at ${utilization.toFixed(1)}%`,
        action: 'Accelerate fund disbursement'
      });
    }

    const severeDelays = data.filter(d => d.project_health === 'SEVERE_DELAY').length;
    if (severeDelays > data.length * 0.3) {
      insights.push({
        type: 'delay',
        message: `${severeDelays} works with severe delays`,
        action: 'Review work execution'
      });
    }

    return insights;
  };

  const applyPreset = (preset) => {
    // Reset all filters first
    filters.resetFilters();
    
    // Apply preset filters
    Object.entries(preset.filters).forEach(([key, value]) => {
      switch(key) {
        case 'riskLevels':
          filters.setSelectedRiskLevels(value);
          break;
        case 'projectHealths':
          filters.setSelectedProjectHealths(value);
          break;
        case 'completionStatuses':
          filters.setSelectedCompletionStatuses(value);
          break;
        case 'workCategories':
          filters.setSelectedWorkCategories(value);
          break;
        case 'priorities':
          filters.setSelectedPriorities(value);
          break;
        case 'daysToPDCRange':
          filters.setDaysToPDCRange(value);
          break;
        case 'amountRangeCr':
          const maxAmount = Math.max(...(rawData.map(d => d.sanctioned_amount_cr || 0)), 100);
          filters.setAmountRangeCr([value[0], value[1] === Infinity ? maxAmount : Math.min(value[1], maxAmount)]);
          break;
        case 'completionRange':
          filters.setCompletionRange(value);
          break;
        default:
          break;
      }
    });
  };

  // Handler Functions
  const handleWorkSelect = useCallback((work) => {
    console.log('Operations: handleWorkSelect called', { 
      work, 
      compareMode,
      hasRequiredFields: !!(work?.s_no && work?.name_of_work)
    });
    
    if (!work) {
      console.error('Operations: No work data provided to handleWorkSelect');
      return;
    }
    
    if (compareMode) {
      setSelectedWorks(prev => {
        const exists = prev.find(p => p.id === work.id);
        if (exists) {
          return prev.filter(p => p.id !== work.id);
        }
        if (prev.length < 5) {
          return [...prev, work];
        }
        addNotification('Maximum 5 works can be compared', 'warning');
        return prev;
      });
    } else {
      const workWithDefaults = {
        ...work,
        s_no: work.s_no || 'N/A',
        name_of_work: work.name_of_work || 'Unknown Work',
        work_type: work.work_type || 'N/A',
        frontier: work.frontier || 'N/A',
        sector_hq: work.sector_hq || 'N/A',
        completed_percentage: work.completed_percentage || 0,
        efficiency_score: work.efficiency_score || 0,
        days_to_pdc: work.days_to_pdc || 0,
        risk_level: work.risk_level || 'LOW',
        completion_status: work.completion_status || 'NOT_STARTED',
        priority: work.priority || 'LOW',
        sanctioned_amount_cr: work.sanctioned_amount_cr || 0,
        spent_amount_cr: work.spent_amount_cr || 0,
        remaining_amount_cr: work.remaining_amount_cr || 0
      };
      
      console.log('Operations: Setting selected work and opening modal', workWithDefaults);
      setSelectedWork(workWithDefaults);
      setModalOpen(true);
      setModalAnimating(true);
    }
  }, [compareMode]);

  // Handler for drill-down from MetricsCards
  const handleDrillDown = useCallback((typeOrId, dataOrFilter) => {
    let drillData = [];
    
    // If data is already provided (from MetricsCards), use it directly
    if (Array.isArray(dataOrFilter)) {
      drillData = dataOrFilter;
    } else {
      // Otherwise filter based on type
      switch(typeOrId) {
        case 'critical':
          drillData = filteredData.filter(d => d.risk_level === 'CRITICAL');
          break;
        case 'severe-delay':
          drillData = filteredData.filter(d => d.project_health === 'SEVERE_DELAY');
          break;
        case 'completed':
          drillData = filteredData.filter(d => d.completion_status === 'COMPLETED');
          break;
        case 'ongoing':
          drillData = filteredData.filter(d => 
            d.completion_status && !['COMPLETED', 'NOT_STARTED'].includes(d.completion_status)
          );
          break;
        case 'notstarted':
        case 'not-started':
          drillData = filteredData.filter(d => d.completion_status === 'NOT_STARTED');
          break;
        case 'high-risk':
          drillData = filteredData.filter(d => d.risk_level === 'HIGH');
          break;
        case 'overdue':
          drillData = filteredData.filter(d => d.days_to_pdc && d.days_to_pdc < 0);
          break;
        case 'near-pdc':
          drillData = filteredData.filter(d => d.days_to_pdc >= 0 && d.days_to_pdc <= 90);
          break;
        case 'bop':
          drillData = filteredData.filter(d => d.work_category === 'BORDER_OUTPOST');
          break;
        case 'fencing':
          drillData = filteredData.filter(d => d.work_category === 'FENCING');
          break;
        case 'road':
          drillData = filteredData.filter(d => d.work_category === 'ROAD');
          break;
        default:
          drillData = filteredData;
      }
    }
    
    // Instead of opening a drill-down modal, switch to table view with the filtered data
    if (typeOrId && drillData.length > 0) {
      // Apply a quick filter based on the drill-down type
      filters.setQuickFilter(typeOrId);
      setViewMode('table');
      addNotification(`Showing ${drillData.length} works`, 'info');
    }
  }, [filteredData, filters]);

  const closeWorkModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => {
      setModalAnimating(false);
      setSelectedWork(null);
    }, 300);
  }, []);

  const handleExport = useCallback((format = 'csv') => {
    exportData(filteredData, format, metrics);
    addNotification(`Data exported as ${format.toUpperCase()}`, 'success');
  }, [filteredData, metrics]);

  const handleExportReport = useCallback((data, reportType) => {
    const reportContent = {
      type: reportType,
      data: data,
      metrics: metrics,
      generatedAt: new Date().toISOString(),
      filters: filters.getFilterState()
    };
    
    const jsonData = JSON.stringify(reportContent, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations-report-${reportType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification(`Report exported: ${reportType}`, 'success');
  }, [metrics, filters]);

  const handlePrintReport = useCallback((data, reportType) => {
    printReport(data, metrics, reportType);
    addNotification('Print preview opened', 'info');
  }, [metrics]);

  const handlePrint = useCallback(() => {
    handlePrintReport(filteredData, activeTab);
  }, [filteredData, activeTab, handlePrintReport]);

  const saveCurrentFilters = useCallback(() => {
    const filterSet = {
      id: Date.now(),
      name: `Filter Set ${savedFilters.length + 1}`,
      timestamp: new Date(),
      filters: filters.getFilterState()
    };
    setSavedFilters(prev => [...prev, filterSet]);
    addNotification('Filters saved successfully', 'success');
  }, [savedFilters, filters]);

  const loadFilterSet = useCallback((filterSet) => {
    filters.loadFilterState(filterSet.filters);
    addNotification(`Loaded: ${filterSet.name}`, 'success');
  }, [filters]);

  const shareAnalytics = useCallback(async () => {
    const shareData = {
      title: 'Operations Analytics Report',
      text: `Total Works: ${metrics.totalWorks}, Budget: ${formatAmount(metrics.totalSanctionedCr)}`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        addNotification('Analytics shared successfully', 'success');
      } else {
        navigator.clipboard.writeText(shareData.url);
        addNotification('Link copied to clipboard', 'success');
      }
    } catch (err) {
      addNotification('Failed to share', 'error');
    }
  }, [metrics]);

  const handleResetAll = () => {
    filters.resetFilters();
  };

  const activeFilterCount = useMemo(() => {
    return filters.getFilterCounts ? filters.getFilterCounts().total : 0;
  }, [filters]);

  // Component Functions
  const QuickActionsPanel = () => (
    <div className={`fixed bottom-4 right-4 z-40 ${
      showQuickActions ? 'block' : 'hidden'
    }`}>
      <div className={`${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-xl shadow-2xl p-4 border ${
        darkMode ? 'border-gray-700' : 'border-blue-200'
      }`}>
        <h3 className="text-sm font-bold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              filters.setQuickFilter('critical');
              setViewMode('table');
            }}
            className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            View Critical Works
          </button>
          <button
            onClick={() => {
              filters.setQuickFilter('severeDelay');
              setViewMode('table');
            }}
            className="w-full px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            View Severe Delays
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Switch to Table View
          </button>
          <button
            onClick={handleExport}
            className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );

  const FilterInfoPanel = () => {
    if (!showFilterInfo || !isCascadingActive) return null;

    return (
      <div className={`fixed bottom-20 left-4 z-30 max-w-sm ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-xl shadow-2xl p-4 border ${
        darkMode ? 'border-gray-700' : 'border-blue-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Link2 size={14} className="text-blue-500" />
            Filter Relationships
          </h3>
          <button
            onClick={() => setShowFilterInfo(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="space-y-2 text-xs">
          {filters.selectedFrontiers?.length > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold text-blue-700 dark:text-blue-400">
                Frontier: {filters.selectedFrontiers.join(', ')}
              </p>
              {filterRelationships?.frontierToSectors && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  → Showing {filters.selectedFrontiers.map(f => 
                    filterRelationships.frontierToSectors[f]?.length || 0
                  ).reduce((a, b) => a + b, 0)} related sectors
                </p>
              )}
            </div>
          )}
          
          {filters.selectedWorkCategories?.length > 0 && (
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p className="font-semibold text-purple-700 dark:text-purple-400">
                Category: {filters.selectedWorkCategories.map(c => {
                  const labels = {
                    'BORDER_OUTPOST': 'BOP',
                    'FENCING': 'Fencing',
                    'ROAD': 'Road',
                    'BRIDGE': 'Bridge',
                    'INFRASTRUCTURE': 'Infrastructure',
                    'OTHER': 'Other'
                  };
                  return labels[c] || c;
                }).join(', ')}
              </p>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Smart filtering automatically shows only related options when you select filters.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (viewMode === 'fastfilter') {
      return (
        <>
          {/* Tab View for Fast Filtering */}
          <TabView
            filters={filters}
            darkMode={darkMode}
            rawData={rawData}
          />

          {/* Metrics Cards */}
          <MetricsCards 
            metrics={metrics} 
            darkMode={darkMode}
            filteredData={filteredData}
            onMetricClick={handleDrillDown}
            onProjectSelect={handleWorkSelect}
          />

          {/* Chart Tabs */}
          <ChartTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredData={filteredData}
            rawData={rawData}
            darkMode={darkMode}
            compareMode={compareMode}
            selectedProjects={selectedWorks}
            onProjectSelect={handleWorkSelect}
            onDrillDown={handleDrillDown}
            filters={filters}
            setModalProject={setSelectedWork}
            setModalOpen={setModalOpen}
            onExportReport={handleExportReport}
            onPrintReport={handlePrintReport}
          />
        </>
      );
    }

    // Default content for other view modes
    return (
      <>
        {/* Metrics Cards */}
        <MetricsCards 
          metrics={metrics} 
          darkMode={darkMode}
          filteredData={filteredData}
          onMetricClick={handleDrillDown}
          onProjectSelect={handleWorkSelect}
        />

        {/* Main Content Based on View Mode */}
        {viewMode === 'dashboard' && (
          <ChartTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredData={filteredData}
            rawData={rawData}
            darkMode={darkMode}
            compareMode={compareMode}
            selectedProjects={selectedWorks}
            onProjectSelect={handleWorkSelect}
            onDrillDown={handleDrillDown}
            filters={filters}
            setModalProject={setSelectedWork}
            setModalOpen={setModalOpen}
            onExportReport={handleExportReport}
            onPrintReport={handlePrintReport}
          />
        )}

        {viewMode === 'table' && (
          <div className="w-full">
            <DataTable
              data={filteredData}
              darkMode={darkMode}
              onRowClick={handleWorkSelect}
              compareMode={compareMode}
              selectedProjects={selectedWorks}
            />
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED'].map(status => (
              <div key={status} className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl shadow-sm p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider flex items-center justify-between">
                  {status.replace(/_/g, ' ')}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {filteredData.filter(p => p.completion_status === status).length}
                  </span>
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredData
                    .filter(p => p.completion_status === status)
                    .slice(0, 20)
                    .map(work => (
                      <div
                        key={work.id}
                        onClick={() => handleWorkSelect(work)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                        } ${selectedWorks.find(p => p.id === work.id) ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <p className="text-sm font-semibold mb-1 truncate">
                          {work.name_of_work}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatAmount(work.sanctioned_amount_cr)}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            work.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            work.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            work.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {work.risk_level}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${(work.completed_percentage || 0) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500 truncate">{work.frontier}</span>
                          {work.days_to_pdc && work.days_to_pdc < 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                              <Clock size={10} />
                              {Math.abs(work.days_to_pdc)}d overdue
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100'
      }`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className={`w-full h-full border-4 ${
              darkMode ? 'border-gray-700 border-t-blue-500' : 'border-blue-200 border-t-blue-500'
            } rounded-full animate-spin`}></div>
          </div>
          <p className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Loading Operations Analytics...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100'
      }`}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className={`text-lg font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className={`min-h-screen transition-colors duration-300 relative z-0 ${
      darkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100'
    }`}>
      <div className={`p-4 lg:p-6 ${layoutMode === 'compact' ? 'max-w-[1600px]' : 'max-w-[1920px]'} mx-auto relative z-10`}>
        <div className="space-y-6">
          {/* Header */}
          <div className={`${
            darkMode ? 'bg-gray-800/90' : 'bg-white'
          } backdrop-blur rounded-2xl shadow-sm p-6 border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <Construction size={28} className="text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Operations Analytics Hub
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 flex items-center gap-3`}>
                    <span className="flex items-center gap-1">
                      <Activity size={14} className="text-green-500" />
                      {metrics.totalWorks} Works
                    </span>
                    <span>•</span>
                    <span>{formatAmount(metrics.totalSanctionedCr)}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleString()}</span>
                    {isCascadingActive && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-orange-500">
                          <Link2 size={12} />
                          Smart Filters Active
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* View Mode Toggle - Updated with Fast Filter option */}
                <div className="flex rounded-lg overflow-hidden shadow-sm">
                  {['dashboard', 'table', 'kanban', 'fastfilter'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-2 text-sm capitalize ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      } hover:opacity-90 transition-all flex items-center gap-1`}
                    >
                      {mode === 'fastfilter' && <Layers size={14} />}
                      {mode === 'fastfilter' ? 'Fast Filter' : mode}
                    </button>
                  ))}
                </div>

                {/* Filter Info Toggle */}
                {isCascadingActive && viewMode !== 'fastfilter' && (
                  <button
                    onClick={() => setShowFilterInfo(!showFilterInfo)}
                    className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                      showFilterInfo 
                        ? 'bg-orange-500 text-white' 
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Link2 size={16} />
                    Filter Links
                  </button>
                )}

                {/* Compare Mode */}
                <button
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setSelectedWorks([]);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                    compareMode 
                      ? 'bg-green-500 text-white' 
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <GitBranch size={16} />
                  {compareMode ? 'Exit Compare' : 'Compare'}
                </button>

                {/* Action Buttons */}
                <button
                  onClick={() => {
                    filters.resetFilters();
                    setSelectedWorks([]);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-2 ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <RefreshCw size={16} />
                  Reset
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 text-sm text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600"
                >
                  <Download size={16} />
                  Export
                </button>

                {/* Quick Filters Dropdown */}
                <div className="relative group">
                  <button className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-green-50 hover:bg-green-100 text-green-700'
                  } transition-all`}>
                    <Sparkles size={14} />
                    Quick Filters
                    <ChevronDown size={14} />
                  </button>
                  <div className={`absolute top-full mt-2 right-0 w-56 rounded-lg shadow-xl z-50 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all`}>
                    {filterPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyPreset(preset)}
                        className={`w-full px-3 py-2.5 text-left text-xs hover:${
                          darkMode ? 'bg-gray-700' : 'bg-green-50'
                        } transition-colors flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <preset.icon size={12} className="text-green-500" />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Cascading Filter Info Banner */}
          {isCascadingActive && filters.availableOptions && viewMode !== 'fastfilter' && (
            <div className={`${
              darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
            } rounded-xl p-3 border flex items-center gap-3`}>
              <Info size={16} className="text-green-500 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Smart Filtering Active:
                </span>
                <span className={darkMode ? 'text-gray-300 ml-2' : 'text-gray-600 ml-2'}>
                  {filters.selectedFrontiers?.length > 0 && (
                    <>Showing options related to {filters.selectedFrontiers.join(', ')} frontier{filters.selectedFrontiers.length > 1 ? 's' : ''}. </>
                  )}
                  {filters.availableOptions.sectorHQs?.length} sectors, {filters.availableOptions.workTypes?.length} work types available.
                </span>
              </div>
              <button
                onClick={() => filters.resetFilters()}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Filter Panel */}
          {viewMode !== 'fastfilter' && (
            <FilterPanel filters={filters} darkMode={darkMode} rawData={rawData} />
          )}

          {/* Main Content */}
          {renderMainContent()}

          {/* Work Detail Modal */}
          {modalOpen && selectedWork && (
            <>
              <div 
                className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={closeWorkModal}
              />
              <div className="fixed inset-0 z-[100001] overflow-y-auto animate-fadeIn">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="animate-modalZoomIn">
                    <Modal
                      isOpen={modalOpen}
                      onClose={closeWorkModal}
                      project={selectedWork}
                      darkMode={darkMode}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Filter Info Panel */}
          {viewMode !== 'fastfilter' && <FilterInfoPanel />}

          {/* Quick Actions Panel */}
          <QuickActionsPanel />

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && viewMode !== 'fastfilter' && (
            <div className={`fixed bottom-4 left-4 right-4 max-w-[1920px] mx-auto z-20 ${
              darkMode ? 'bg-gray-800/95' : 'bg-white/95'
            } backdrop-blur rounded-xl shadow-lg p-3 border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500">Active:</span>
                  
                  {filters.searchTerm && (
                    <span className="px-2 py-0.5 bg-white dark:bg-gray-700 text-xs rounded-full flex items-center gap-1 shadow-sm">
                      <Search size={10} />
                      "{filters.searchTerm}"
                      <button onClick={() => filters.setSearchTerm('')} className="ml-1">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  
                  {filters.selectedWorkCategories?.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                      {filters.selectedWorkCategories.length} Categor{filters.selectedWorkCategories.length > 1 ? 'ies' : 'y'}
                    </span>
                  )}
                  
                  {filters.selectedCompletionStatuses?.length > 0 && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                      {filters.selectedCompletionStatuses.length} Status{filters.selectedCompletionStatuses.length > 1 ? 'es' : ''}
                    </span>
                  )}
                  
                  {filters.selectedProjectHealths?.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                      {filters.selectedProjectHealths.length} Health Status{filters.selectedProjectHealths.length > 1 ? 'es' : ''}
                    </span>
                  )}
                  
                  {filters.selectedFrontiers?.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      {filters.selectedFrontiers.length} Frontier{filters.selectedFrontiers.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {filters.selectedSectorHQs?.length > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded-full">
                      {filters.selectedSectorHQs.length} Sector{filters.selectedSectorHQs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleResetAll}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Comparison Panel */}
          {compareMode && selectedWorks.length > 0 && (
            <div className={`fixed bottom-4 left-4 right-4 max-w-[1920px] mx-auto z-30 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-lg p-4 border ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            } transform transition-all duration-300 animate-slide-up`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Comparing {selectedWorks.length} Works</h3>
                <button
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedWorks([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {selectedWorks.map(work => (
                  <div key={work.id} className={`min-w-[250px] p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className="text-sm font-semibold truncate">{work.name_of_work}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span className="font-medium">{formatPercentage(work.completed_percentage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Budget:</span>
                        <span className="font-medium">{formatAmount(work.sanctioned_amount_cr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk:</span>
                        <span className={`font-medium ${
                          work.risk_level === 'CRITICAL' ? 'text-red-600' :
                          work.risk_level === 'HIGH' ? 'text-orange-600' :
                          work.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {work.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('comparison')}
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-all text-sm"
              >
                View Detailed Comparison
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalZoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-modalZoomIn {
          animation: modalZoomIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Operations;