import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building, TrendingUp, DollarSign, Clock, CheckCircle, 
  AlertCircle, Activity, Briefcase, Download, RefreshCw,
  IndianRupee, Gauge, AlertTriangle, Settings, Bell,
  Filter, Save, Share2, Printer, Moon, Sun, X,
  ChevronDown, Eye, Maximize2, Minimize2, Grid3x3,
  Search, Database, BarChart3, Users, MapPin,
  Calendar, Building2, Target, Shield, GitBranch,
  FileText, Menu, Home, LogOut, HelpCircle, Link2, Info, Layers
} from 'lucide-react';
import { useData } from './useData';
import { useFilters } from './useFilters';
import FilterPanel from './FilterPanel';
import MetricsCards from './MetricsCards';
import ChartTabs from './ChartTabs';
import DataTable from './DataTable';
import Modal from './Modal';
import AISuggestions from './AISuggestions';
import TabView from './TabView';
import { calculateMetrics, exportData, printReport } from './utils';
// Import statements for icons
import { 
  Sparkles, PauseCircle, PlayCircle, CreditCard, Zap
} from 'lucide-react';


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

// Helper function to format currency amounts properly
const formatAmount = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 10000) {
    return `₹${(value / 100).toFixed(2)} Cr`;
  } else if (absValue >= 100) {
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 1) {
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 0.01) {
    return `₹${(value * 100).toFixed(2)} K`;
  } else {
    return `₹${(value * 100).toFixed(2)} K`;
  }
};

const Engineering = () => {
  // State Management
  const [darkMode, setDarkMode] = useState(() => {
    const saved = getCookie('engineering_darkMode');
    return saved === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    const saved = getCookie('engineering_viewMode');
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
  const { rawData, loading, error, refetch, lastUpdate, dataStats } = useData();
  const filters = useFilters();

  // Save preferences to cookies when they change
  useEffect(() => {
    setCookie('engineering_darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    setCookie('engineering_viewMode', viewMode);
  }, [viewMode]);

  // Initialize filters with raw data
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      console.log('Engineering: Raw data loaded', {
        count: rawData.length,
        sample: rawData[0],
        fields: Object.keys(rawData[0] || {})
      });
      
      filters.setRawData(rawData);
      
      const amounts = rawData.map(d => d.sanctioned_amount || 0);
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 0) {
        filters.setAmountRange([0, maxAmount]);
      }

      if (rawData.length > 0) {
        generateInsights(rawData);
      }
    }
  }, [rawData]);

  // Get filtered data from filters
  const filteredData = filters.filteredData || [];
  
  // Normalized scheme name helper function to improve matching
  const normalizeScheme = useCallback((schemeName) => {
    if (!schemeName) return '';
    return schemeName.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\(|\)|,|\.|\//g, '')
      .trim();
  }, []);

  // Create comprehensive filter object for patch data with enhanced scheme name mapping
  const patchFilters = useMemo(() => {
    const mappedFilters = {
      searchTerm: filters.searchTerm || '',
      selectedBudgetHeads: filters.selectedBudgetHeads || [],
      selectedFrontierHQs: filters.selectedFrontierHQs || [],
      selectedSectorHQs: filters.selectedSectorHQs || [],
      selectedRiskLevels: filters.selectedRiskLevels || [],
      selectedHealthStatuses: filters.selectedHealthStatuses || [],
      selectedSchemes: [],
      utilizationRange: null
    };
    
    // Enhanced scheme name mapping
    if (filters.selectedSchemes?.length > 0 || filters.columnFilters?.name_of_scheme?.length > 0 || 
        filters.columnFilters?.sub_scheme_name?.length > 0) {
      
      // Gather scheme names from all possible sources
      const schemeNames = [
        ...(filters.selectedSchemes || []),
        ...(filters.columnFilters?.name_of_scheme || []),
        ...(filters.columnFilters?.sub_scheme_name || []),
        ...(filters.columnFilters?.['Name of scheme'] || []),
        ...(filters.columnFilters?.['Sub head'] || [])
      ];
      
      // Normalize and deduplicate scheme names
      mappedFilters.selectedSchemes = Array.from(new Set(
        schemeNames
          .filter(Boolean)
          .map(scheme => normalizeScheme(scheme))
      )).filter(Boolean);
      
      console.log('[Engineering] Normalized scheme names for patch data:', 
        mappedFilters.selectedSchemes.slice(0, 3), 
        `(${mappedFilters.selectedSchemes.length} total)`
      );
    }
    
    // Map utilization range if available from efficiency range
    if (filters.efficiencyRange && filters.efficiencyRange[0] !== undefined && filters.efficiencyRange[1] !== undefined) {
      mappedFilters.utilizationRange = filters.efficiencyRange;
    }
    
    // Log for debugging
    console.log('[Engineering] Mapped patch filters:', {
      searchTerm: mappedFilters.searchTerm,
      budgetHeads: mappedFilters.selectedBudgetHeads.length,
      frontierHQs: mappedFilters.selectedFrontierHQs.length,
      schemes: mappedFilters.selectedSchemes.length
    });
    
    return mappedFilters;
  }, [
    filters.searchTerm,
    filters.selectedBudgetHeads,
    filters.selectedFrontierHQs,
    filters.selectedSectorHQs,
    filters.selectedRiskLevels,
    filters.selectedHealthStatuses,
    filters.selectedSchemes,
    filters.columnFilters,
    filters.efficiencyRange,
    normalizeScheme
  ]);

  // Enhanced patch data processor with scheme name matching
  const processPatchData = useCallback((data) => {
    if (!data) return [];
    
    return data.map(item => {
      // Add normalized scheme names for better matching
      if (item.scheme_name || item.sub_head) {
        item.normalized_scheme_name = normalizeScheme(item.scheme_name || '') || 
                                       normalizeScheme(item.sub_head || '');
      }
      return item;
    });
  }, [normalizeScheme]);

  // Get filter relationships for display
  const filterRelationships = useMemo(() => {
    if (!filters.getRelatedMappings) return null;
    return filters.getRelatedMappings();
  }, [filters]);

  // Check if cascading is active
  const isCascadingActive = useMemo(() => {
    return (
      filters.selectedFrontierHQs?.length > 0 ||
      filters.selectedSectorHQs?.length > 0 ||
      filters.selectedAgencies?.length > 0 ||
      filters.selectedBudgetHeads?.length > 0
    );
  }, [filters.selectedFrontierHQs, filters.selectedSectorHQs, filters.selectedAgencies, filters.selectedBudgetHeads]);

  // Calculate metrics with proper amount handling
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalProjects: 0,
        totalSanctionedCr: 0,
        totalExpenditureCr: 0,
        remainingBudgetCr: 0,
        avgProgress: 0,
        avgEfficiency: 0,
        avgHealthScore: 0,
        completed: 0,
        ongoing: 0,
        notStarted: 0,
        critical: 0,
        delayed: 0,
        onTrack: 0,
        utilizationRate: 0,
        completionRate: 0,
        delayRate: 0,
        criticalRate: 0,
        activeAgencies: 0,
        totalContractors: 0,
        totalLocations: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        avgDuration: 0,
        completedThisMonth: 0,
        completedThisQuarter: 0,
        completedThisYear: 0,
        delayedUnder30: 0,
        delayed30to90: 0,
        delayedOver90: 0
      };
    }

    const total = filteredData.length;
    const totalSanctioned = filteredData.reduce((sum, item) => sum + (item.sanctioned_amount || 0), 0) / 100;
    const totalExpenditure = filteredData.reduce((sum, item) => sum + (item.total_expdr || 0), 0) / 100;
    const avgProgress = filteredData.reduce((sum, item) => sum + (item.physical_progress || 0), 0) / total;
    const avgEfficiency = filteredData.reduce((sum, item) => sum + (item.efficiency_score || 0), 0) / total;
    const avgHealthScore = filteredData.reduce((sum, item) => sum + (item.health_score || 0), 0) / total;
    
    const completed = filteredData.filter(item => item.physical_progress >= 100).length;
    const ongoing = filteredData.filter(item => item.physical_progress > 0 && item.physical_progress < 100).length;
    const notStarted = filteredData.filter(item => item.physical_progress === 0).length;
    
    const critical = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
    const highRisk = filteredData.filter(item => item.risk_level === 'HIGH').length;
    const mediumRisk = filteredData.filter(item => item.risk_level === 'MEDIUM').length;
    const lowRisk = filteredData.filter(item => item.risk_level === 'LOW').length;
    
    const delayed = filteredData.filter(item => item.delay_days > 0).length;
    const onTrack = filteredData.filter(item => item.delay_days === 0 && item.physical_progress > 0).length;
    
    const delayedUnder30 = filteredData.filter(item => item.delay_days > 0 && item.delay_days <= 30).length;
    const delayed30to90 = filteredData.filter(item => item.delay_days > 30 && item.delay_days <= 90).length;
    const delayedOver90 = filteredData.filter(item => item.delay_days > 90).length;
    
    // Calculate unique organization counts
    const uniqueAgencies = new Set(
      filteredData
        .map(item => item.executive_agency)
        .filter(agency => agency && agency !== '' && agency !== 'N/A' && agency !== 'Unknown Agency')
    );
    
    const uniqueContractors = new Set(
      filteredData
        .map(item => item.firm_name)
        .filter(contractor => contractor && contractor !== '' && contractor !== 'N/A' && contractor !== 'Unknown Contractor')
    );
    
    const uniqueLocations = new Set(
      filteredData
        .map(item => {
          const location = item.work_site;
          if (!location || location === '' || location === 'N/A' || location === 'Unknown Location') return null;
          return location.split(',')[0].trim();
        })
        .filter(loc => loc !== null)
    );
    
    // Calculate average duration
    const avgDuration = filteredData
      .filter(item => item.time_allowed_days)
      .reduce((sum, item) => sum + item.time_allowed_days, 0) / 
      filteredData.filter(item => item.time_allowed_days).length || 0;
    
    // Calculate recent completions
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const completedThisMonth = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      return completionDate.getMonth() === thisMonth && completionDate.getFullYear() === thisYear;
    }).length;
    
    const completedThisQuarter = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      const quarter = Math.floor(completionDate.getMonth() / 3);
      const currentQuarter = Math.floor(thisMonth / 3);
      return quarter === currentQuarter && completionDate.getFullYear() === thisYear;
    }).length;
    
    const completedThisYear = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      return completionDate.getFullYear() === thisYear;
    }).length;
    
    return {
      totalProjects: total,
      totalSanctionedCr: totalSanctioned,
      totalExpenditureCr: totalExpenditure,
      remainingBudgetCr: totalSanctioned - totalExpenditure,
      avgProgress: avgProgress.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      completed,
      ongoing,
      notStarted,
      critical,
      highRisk,
      mediumRisk,
      lowRisk,
      delayed,
      onTrack,
      utilizationRate: totalSanctioned ? ((totalExpenditure / totalSanctioned) * 100).toFixed(1) : 0,
      completionRate: total ? ((completed / total) * 100).toFixed(1) : 0,
      delayRate: total ? ((delayed / total) * 100).toFixed(1) : 0,
      criticalRate: total ? ((critical / total) * 100).toFixed(1) : 0,
      activeAgencies: uniqueAgencies.size,
      totalContractors: uniqueContractors.size,
      totalLocations: uniqueLocations.size,
      avgDuration: Math.round(avgDuration),
      completedThisMonth,
      completedThisQuarter,
      completedThisYear,
      delayedUnder30,
      delayed30to90,
      delayedOver90
    };
  }, [filteredData]);

  // Filter presets
  const [filterPresets] = useState([
    { 
      name: 'Critical Projects', 
      icon: AlertTriangle, 
      filters: { 
        riskLevels: ['CRITICAL'],
        progressRange: [0, 100],
        amountRange: [0, Infinity],
        delayRange: [0, 365]
      } 
    },
    { 
      name: 'Perfect Pace Projects', 
      icon: Zap, 
      filters: { 
        healthStatuses: ['PERFECT_PACE']
      } 
    },
    { 
      name: 'Sleep Pace Projects', 
      icon: PauseCircle, 
      filters: { 
        healthStatuses: ['SLEEP_PACE']
      } 
    },
    { 
      name: 'Payment Pending', 
      icon: CreditCard, 
      filters: { 
        healthStatuses: ['PAYMENT_PENDING']
      } 
    },
    { 
      name: 'Not Yet Started', 
      icon: PlayCircle, 
      filters: { 
        progressCategories: ['AWARDED_NOT_STARTED', 'NOT_STARTED']
      } 
    },
    { 
      name: 'Halfway Complete', 
      icon: Activity, 
      filters: { 
        progressCategories: ['PROGRESS_51_TO_71']
      } 
    },
    { 
      name: 'Nearly Done', 
      icon: Target, 
      filters: { 
        progressCategories: ['PROGRESS_71_TO_99']
      } 
    },
    { 
      name: 'Tendered Not Awarded', 
      icon: FileText, 
      filters: { 
        progressCategories: ['TENDERED_NOT_AWARDED']
      } 
    },
    { 
      name: 'Delayed > 90 days', 
      icon: Clock, 
      filters: { 
        delayRange: [90, 365],
        progressRange: [0, 100],
        amountRange: [0, Infinity]
      } 
    },
    { 
      name: 'High Budget (>500L)', 
      icon: DollarSign, 
      filters: { 
        amountRange: [50000, Infinity],
        progressRange: [0, 100],
        delayRange: [0, 365]
      } 
    }
  ]);

  // Data range calculations
  const dataRanges = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        amountMin: 0,
        amountMax: 100000,
        delayMin: 0,
        delayMax: 365,
        progressMin: 0,
        progressMax: 100,
        efficiencyMin: 0,
        efficiencyMax: 100,
        healthMin: 0,
        healthMax: 100,
        expectedProgressMin: 0,
        expectedProgressMax: 100
      };
    }

    const amounts = rawData.map(d => d.sanctioned_amount || 0);
    const delays = rawData.map(d => d.delay_days || 0);
    const progress = rawData.map(d => d.physical_progress || 0);
    const efficiency = rawData.map(d => d.efficiency_score || 0);
    const health = rawData.map(d => d.health_score || 0);
    const expectedProgress = rawData.map(d => d.expected_progress || 0);

    return {
      amountMin: Math.min(...amounts),
      amountMax: Math.max(...amounts, 100000),
      delayMin: 0,
      delayMax: Math.max(...delays, 365),
      progressMin: 0,
      progressMax: 100,
      efficiencyMin: 0,
      efficiencyMax: 100,
      healthMin: Math.min(...health, 0),
      healthMax: Math.max(...health, 100),
      expectedProgressMin: 0,
      expectedProgressMax: 100
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
    const criticalProjects = filteredData.filter(p => p.risk_level === 'CRITICAL');
    if (criticalProjects.length > 5) {
      addNotification(
        `${criticalProjects.length} projects require immediate attention`,
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
        message: `${criticalCount} projects (${(criticalCount/data.length * 100).toFixed(1)}%) are in critical state`,
        action: 'Review resource allocation'
      });
    }

    const totalBudget = data.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0);
    const totalSpent = data.reduce((sum, d) => sum + (d.total_expdr || 0), 0);
    const utilization = (totalSpent / totalBudget * 100);
    if (utilization < 50) {
      insights.push({
        type: 'budget',
        message: `Low budget utilization at ${utilization.toFixed(1)}%`,
        action: 'Accelerate fund disbursement'
      });
    }

    const delayedProjects = data.filter(d => d.delay_days > 30).length;
    if (delayedProjects > data.length * 0.3) {
      insights.push({
        type: 'delay',
        message: `${delayedProjects} projects delayed by more than 30 days`,
        action: 'Review contractor performance'
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
        case 'healthStatuses':
          filters.setSelectedHealthStatuses(value);
          break;
        case 'progressCategories':
          filters.setSelectedProgressCategories(value);
          break;
        case 'delayRange':
          const maxDelay = Math.max(...(rawData.map(d => d.delay_days || 0)), 365);
          filters.setDelayRange([value[0], Math.min(value[1], maxDelay)]);
          break;
        case 'amountRange':
          const maxAmount = Math.max(...(rawData.map(d => d.sanctioned_amount || 0)), 100000);
          filters.setAmountRange([value[0], value[1] === Infinity ? maxAmount : Math.min(value[1], maxAmount)]);
          break;
        case 'progressRange':
          filters.setProgressRange(value);
          break;
        default:
          break;
      }
    });
  };

  // Handler Functions
  const handleProjectSelect = useCallback((project) => {
    console.log('Engineering: handleProjectSelect called', { 
      project, 
      compareMode,
      hasRequiredFields: !!(project?.serial_no && project?.scheme_name)
    });
    
    if (!project) {
      console.error('Engineering: No project data provided to handleProjectSelect');
      return;
    }
    
    if (compareMode) {
      setSelectedProjects(prev => {
        const exists = prev.find(p => p.id === project.id);
        if (exists) {
          return prev.filter(p => p.id !== project.id);
        }
        if (prev.length < 5) {
          return [...prev, project];
        }
        addNotification('Maximum 5 projects can be compared', 'warning');
        return prev;
      });
    } else {
      const projectWithDefaults = {
        ...project,
        serial_no: project.serial_no || 'N/A',
        scheme_name: project.scheme_name || 'Unknown Project',
        budget_head: project.budget_head || 'N/A',
        work_site: project.work_site || 'N/A',
        executive_agency: project.executive_agency || 'N/A',
        firm_name: project.firm_name || 'N/A',
        physical_progress: project.physical_progress || 0,
        efficiency_score: project.efficiency_score || 0,
        health_score: project.health_score || 0,
        delay_days: project.delay_days || 0,
        risk_level: project.risk_level || 'LOW',
        status: project.status || 'NOT_STARTED',
        priority: project.priority || 'LOW',
        sanctioned_amount: project.sanctioned_amount || 0,
        total_expdr: project.total_expdr || 0,
        percent_expdr: project.percent_expdr || 0,
        remaining_amount: project.remaining_amount || 0,
        // Add normalized scheme name if not already present
        normalized_scheme_name: project.normalized_scheme_name || 
                                normalizeScheme(project.scheme_name || '') || 
                                normalizeScheme(project.sub_scheme_name || '')
      };
      
      console.log('Engineering: Setting selected project and opening modal', projectWithDefaults);
      setSelectedProject(projectWithDefaults);
      setModalOpen(true);
      setModalAnimating(true);
    }
  }, [compareMode, normalizeScheme]);

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
        case 'delayed':
          drillData = filteredData.filter(d => (d.delay_days || 0) > 0);
          break;
        case 'completed':
          drillData = filteredData.filter(d => d.physical_progress >= 100);
          break;
        case 'ongoing':
          drillData = filteredData.filter(d => d.physical_progress > 0 && d.physical_progress < 100);
          break;
        case 'notstarted':
        case 'not-started':
          drillData = filteredData.filter(d => d.physical_progress === 0);
          break;
        case 'high-risk':
          drillData = filteredData.filter(d => d.risk_level === 'HIGH');
          break;
        case 'overdue':
          drillData = filteredData.filter(d => d.delay_days > 90);
          break;
        case 'near-completion':
          drillData = filteredData.filter(d => d.physical_progress >= 75 && d.physical_progress < 100);
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
      addNotification(`Showing ${drillData.length} projects`, 'info');
    }
  }, [filteredData, filters]);

  const closeProjectModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => {
      setModalAnimating(false);
      setSelectedProject(null);
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
    a.download = `report-${reportType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification(`Report exported: ${reportType}`, 'success');
  }, [metrics, filters]);

  const handlePrintReport = useCallback((data, reportType) => {
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Engineering Report - ${reportType} - ${new Date().toLocaleDateString()}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            line-height: 1.6;
          }
          h1 { 
            color: #3b82f6; 
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          h2 { 
            color: #333; 
            margin-top: 30px;
            background: #f5f5f5;
            padding: 10px;
            border-left: 4px solid #3b82f6;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background-color: #3b82f6; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
          }
          .metric-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #3b82f6; 
          }
          .metric-label { 
            color: #666; 
            font-size: 14px;
            margin-bottom: 5px;
          }
          .page-break { 
            page-break-after: always; 
          }
          @media print { 
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Engineering Analytics Report</h1>
        <p><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${filteredData.length} projects</p>
        
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Projects</div>
            <div class="metric-value">${metrics.totalProjects}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Budget</div>
            <div class="metric-value">${formatAmount(metrics.totalSanctionedCr * 100)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Completion Rate</div>
            <div class="metric-value">${metrics.completionRate}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Critical Projects</div>
            <div class="metric-value">${metrics.critical}</div>
          </div>
        </div>
        
        <div class="page-break"></div>
        
        <h2>Project Details</h2>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Scheme Name</th>
              <th>Location</th>
              <th>Agency</th>
              <th>Budget</th>
              <th>Progress (%)</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.slice(0, 50).map(project => `
              <tr>
                <td>${project.serial_no}</td>
                <td>${project.scheme_name}</td>
                <td>${project.work_site}</td>
                <td>${project.executive_agency}</td>
                <td>${formatAmount(project.sanctioned_amount)}</td>
                <td>${project.physical_progress}%</td>
                <td>${project.risk_level}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 50px; text-align: center; color: #666;">
          End of Report - Total Records: ${filteredData.length}
        </p>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    addNotification('Print preview opened', 'info');
  }, [filteredData, metrics]);

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
      title: 'Engineering Analytics Report',
      text: `Total Projects: ${metrics.totalProjects}, Budget: ${formatAmount(metrics.totalSanctionedCr * 100)}`,
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
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.selectedStatuses?.length > 0) count++;
    if (filters.selectedRiskLevels?.length > 0) count++;
    if (filters.selectedBudgetHeads?.length > 0) count++;
    if (filters.selectedAgencies?.length > 0) count++;
    if (filters.selectedFrontierHQs?.length > 0) count++;
    if (filters.selectedSectorHQs?.length > 0) count++;
    if (filters.selectedContractors?.length > 0) count++;
    if (filters.selectedLocations?.length > 0) count++;
    if (filters.selectedProgressCategories?.length > 0) count++;
    if (filters.selectedHealthStatuses?.length > 0) count++;
    if (filters.selectedSchemes?.length > 0) count++;
    
    // Check if ranges are modified from defaults
    if (filters.progressRange && (filters.progressRange[0] > 0 || filters.progressRange[1] < 100)) count++;
    if (filters.amountRange && (filters.amountRange[0] > dataRanges.amountMin || filters.amountRange[1] < dataRanges.amountMax)) count++;
    if (filters.delayRange && (filters.delayRange[0] > 0 || filters.delayRange[1] < dataRanges.delayMax)) count++;
    if (filters.efficiencyRange && (filters.efficiencyRange[0] > 0 || filters.efficiencyRange[1] < 100)) count++;
    if (filters.healthRange && (filters.healthRange[0] > dataRanges.healthMin || filters.healthRange[1] < dataRanges.healthMax)) count++;
    if (filters.expectedProgressRange && (filters.expectedProgressRange[0] > 0 || filters.expectedProgressRange[1] < 100)) count++;
    
    // Count active date filters
    if (filters.dateFilters) {
      Object.values(filters.dateFilters).forEach(filter => {
        if (filter && filter.enabled === true) count++;
      });
    }
    
    return count;
  }, [filters, dataRanges]);

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
            View Critical Projects
          </button>
          <button
            onClick={() => {
              filters.setQuickFilter('delayed');
              setViewMode('table');
            }}
            className="w-full px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            View Delayed Projects
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
          {filters.selectedFrontierHQs?.length > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold text-blue-700 dark:text-blue-400">
                Frontier: {filters.selectedFrontierHQs.join(', ')}
              </p>
              {filterRelationships?.frontierToSectors && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  → Showing {filters.selectedFrontierHQs.map(f => 
                    filterRelationships.frontierToSectors[f]?.length || 0
                  ).reduce((a, b) => a + b, 0)} related sectors
                </p>
              )}
            </div>
          )}
          
          {filters.selectedAgencies?.length > 0 && (
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p className="font-semibold text-purple-700 dark:text-purple-400">
                Agency: {filters.selectedAgencies[0]}
                {filters.selectedAgencies.length > 1 && ` +${filters.selectedAgencies.length - 1}`}
              </p>
            </div>
          )}
          
          {filters.selectedSchemes?.length > 0 && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="font-semibold text-green-700 dark:text-green-400">
                Schemes: {filters.selectedSchemes.length > 0 ? 
                  (filters.selectedSchemes[0].length > 25 ? 
                    `${filters.selectedSchemes[0].substring(0, 25)}...` : 
                    filters.selectedSchemes[0]) : 
                  'None'} 
                {filters.selectedSchemes.length > 1 && ` +${filters.selectedSchemes.length - 1} more`}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                <strong>Note:</strong> Scheme names will also match with sub-scheme names across databases.
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
            normalizeScheme={normalizeScheme}
          />

          {/* Metrics Cards - Pass patchFilters */}
          <MetricsCards 
            metrics={metrics} 
            darkMode={darkMode}
            filteredData={filteredData}
            onMetricClick={handleDrillDown}
            onProjectSelect={handleProjectSelect}
            filters={patchFilters}
            processPatchData={processPatchData}
          />

          {/* Chart Tabs */}
          <ChartTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredData={filteredData}
            rawData={rawData}
            darkMode={darkMode}
            compareMode={compareMode}
            selectedProjects={selectedProjects}
            onProjectSelect={handleProjectSelect}
            onDrillDown={handleDrillDown}
            filters={filters}
            setModalProject={setSelectedProject}
            setModalOpen={setModalOpen}
            onExportReport={handleExportReport}
            onPrintReport={handlePrintReport}
            normalizeScheme={normalizeScheme}
          />
        </>
      );
    }

    // Default content for other view modes
    return (
      <>
        {/* Metrics Cards - Pass patchFilters */}
        <MetricsCards 
          metrics={metrics} 
          darkMode={darkMode}
          filteredData={filteredData}
          onMetricClick={handleDrillDown}
          onProjectSelect={handleProjectSelect}
          filters={patchFilters}
          processPatchData={processPatchData}
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
            selectedProjects={selectedProjects}
            onProjectSelect={handleProjectSelect}
            onDrillDown={handleDrillDown}
            filters={filters}
            setModalProject={setSelectedProject}
            setModalOpen={setModalOpen}
            onExportReport={handleExportReport}
            onPrintReport={handlePrintReport}
            normalizeScheme={normalizeScheme}
          />
        )}

        {viewMode === 'table' && (
          <div className="w-full">
            <DataTable
              data={filteredData}
              darkMode={darkMode}
              onRowClick={handleProjectSelect}
              compareMode={compareMode}
              selectedProjects={selectedProjects}
              normalizeScheme={normalizeScheme}
            />
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {['NOT_STARTED', 'IN_PROGRESS', 'ADVANCED', 'COMPLETED'].map(status => (
              <div key={status} className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl shadow-sm p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider flex items-center justify-between">
                  {status.replace('_', ' ')}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {filteredData.filter(p => {
                      if (status === 'NOT_STARTED') return p.physical_progress === 0;
                      if (status === 'IN_PROGRESS') return p.physical_progress > 0 && p.physical_progress <= 50;
                      if (status === 'ADVANCED') return p.physical_progress > 50 && p.physical_progress < 100;
                      if (status === 'COMPLETED') return p.physical_progress >= 100;
                      return false;
                    }).length}
                  </span>
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredData
                    .filter(p => {
                      if (status === 'NOT_STARTED') return p.physical_progress === 0;
                      if (status === 'IN_PROGRESS') return p.physical_progress > 0 && p.physical_progress <= 50;
                      if (status === 'ADVANCED') return p.physical_progress > 50 && p.physical_progress < 100;
                      if (status === 'COMPLETED') return p.physical_progress >= 100;
                      return false;
                    })
                    .slice(0, 20)
                    .map(project => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                        } ${selectedProjects.find(p => p.id === project.id) ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <p className="text-sm font-semibold mb-1 truncate">
                          {project.scheme_name}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatAmount(project.sanctioned_amount)}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {project.risk_level}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${project.physical_progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500 truncate">{project.executive_agency}</span>
                          {project.delay_days > 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                              <Clock size={10} />
                              {project.delay_days}d
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
            Loading Engineering Analytics...
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
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Building size={28} className="text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Engineering Analytics Hub
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 flex items-center gap-3`}>
                    <span className="flex items-center gap-1">
                      <Activity size={14} className="text-green-500" />
                      {metrics.totalProjects} Projects
                    </span>
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
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
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
                    setSelectedProjects([]);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                    compareMode 
                      ? 'bg-blue-500 text-white' 
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
                    setSelectedProjects([]);
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
                  className="px-4 py-2 text-sm text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  <Download size={16} />
                  Export
                </button>

                {/* Quick Filters Dropdown */}
                <div className="relative group">
                  <button className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
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
                          darkMode ? 'bg-gray-700' : 'bg-blue-50'
                        } transition-colors flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <preset.icon size={12} className="text-blue-500" />
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

          {/* Scheme Name Mapping Info Banner - NEW ADDITION */}
          {(patchFilters.selectedSchemes.length > 0 || (filters.selectedSchemes?.length > 0)) && (
            <div className={`${
              darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
            } rounded-xl p-3 border flex items-center gap-3`}>
              <Info size={16} className="text-green-500 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Enhanced Scheme Mapping Active:
                </span>
                <span className={darkMode ? 'text-gray-300 ml-2' : 'text-gray-600 ml-2'}>
                  Filtering will match scheme names with sub-scheme names across both databases for more comprehensive results.
                  {patchFilters.selectedSchemes.length > 0 && ` Currently filtering with ${patchFilters.selectedSchemes.length} scheme name patterns.`}
                </span>
              </div>
              <button
                onClick={() => {
                  filters.setSelectedSchemes([]);
                  if (filters.columnFilters?.name_of_scheme) {
                    filters.setColumnFilter('name_of_scheme', []);
                  }
                  if (filters.columnFilters?.sub_scheme_name) {
                    filters.setColumnFilter('sub_scheme_name', []);
                  }
                }}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Clear Scheme Filters
              </button>
            </div>
          )}

          {/* Cascading Filter Info Banner */}
          {isCascadingActive && filters.availableOptions && viewMode !== 'fastfilter' && (
            <div className={`${
              darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
            } rounded-xl p-3 border flex items-center gap-3`}>
              <Info size={16} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-blue-700 dark:text-blue-400">
                  Smart Filtering Active:
                </span>
                <span className={darkMode ? 'text-gray-300 ml-2' : 'text-gray-600 ml-2'}>
                  {filters.selectedFrontierHQs?.length > 0 && (
                    <>Showing options related to {filters.selectedFrontierHQs.join(', ')} frontier HQ{filters.selectedFrontierHQs.length > 1 ? 's' : ''}. </>
                  )}
                  {filters.availableOptions.sectorHQs?.length} sectors, {filters.availableOptions.locations?.length} locations available.
                </span>
              </div>
              <button
                onClick={() => filters.resetFilters()}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Filter Panel */}
          {viewMode !== 'fastfilter' && (
            <FilterPanel 
              filters={filters} 
              darkMode={darkMode} 
              rawData={rawData}
              normalizeScheme={normalizeScheme}
            />
          )}

          {/* Main Content */}
          {renderMainContent()}

          {/* Project Detail Modal */}
          {modalOpen && selectedProject && (
            <>
              <div 
                className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={closeProjectModal}
              />
              <div className="fixed inset-0 z-[100001] overflow-y-auto animate-fadeIn">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="animate-modalZoomIn">
                    <Modal
                      isOpen={modalOpen}
                      onClose={closeProjectModal}
                      project={selectedProject}
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
                  
                  {filters.selectedSchemes?.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                      {filters.selectedSchemes.length} Scheme{filters.selectedSchemes.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {filters.selectedProgressCategories?.length > 0 && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                      {filters.selectedProgressCategories.length} Progress Stage{filters.selectedProgressCategories.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {filters.selectedHealthStatuses?.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                      {filters.selectedHealthStatuses.length} Health Status{filters.selectedHealthStatuses.length > 1 ? 'es' : ''}
                    </span>
                  )}
                  
                  {filters.selectedBudgetHeads?.length > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      {filters.selectedBudgetHeads.length} Budget Head{filters.selectedBudgetHeads.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {filters.selectedFrontierHQs?.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      {filters.selectedFrontierHQs.length} Frontier HQ{filters.selectedFrontierHQs.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {filters.selectedSectorHQs?.length > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded-full">
                      {filters.selectedSectorHQs.length} Sector HQ{filters.selectedSectorHQs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleResetAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Comparison Panel */}
          {compareMode && selectedProjects.length > 0 && (
            <div className={`fixed bottom-4 left-4 right-4 max-w-[1920px] mx-auto z-30 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-lg p-4 border ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            } transform transition-all duration-300 animate-slide-up`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Comparing {selectedProjects.length} Projects</h3>
                <button
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedProjects([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {selectedProjects.map(project => (
                  <div key={project.id} className={`min-w-[250px] p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className="text-sm font-semibold truncate">{project.scheme_name}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span className="font-medium">{project.physical_progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Budget:</span>
                        <span className="font-medium">{formatAmount(project.sanctioned_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk:</span>
                        <span className={`font-medium ${
                          project.risk_level === 'CRITICAL' ? 'text-red-600' :
                          project.risk_level === 'HIGH' ? 'text-orange-600' :
                          project.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {project.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('comparison')}
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all text-sm"
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

export default Engineering;