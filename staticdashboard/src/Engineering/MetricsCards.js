import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  // Projects Icons
  Briefcase, FileText, CheckCircle, XCircle, Calendar, Award,
  
  // Budget Icons  
  IndianRupee, CreditCard, Wallet, TrendingUp, TrendingDown, Database,
  
  // Progress Icons
  Activity, PlayCircle, PauseCircle, Timer, Zap, Target,
  
  // Health Icons
  AlertTriangle, Clock, Heart, Shield, Gauge, AlertCircle,
  
  // Timeline Icons
  CalendarDays, CalendarClock, CalendarCheck, CalendarX,
  
  // Utility Icons
  ChevronDown, ChevronUp, ChevronRight, Eye, Download, Info,
  MoreVertical, X, Maximize2, Filter, RefreshCw, Building2,
  Users, MapPin, Percent, Package, Cpu, ThermometerSun,
  GitBranch, Layers, FileText as FileTextIcon, Bell, Search,
  HelpCircle, Coins, PiggyBank, Banknote, DollarSign, Receipt
} from 'lucide-react';

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie
} from 'recharts';
import DataTable from './DataTable';
import { usePatchEngineeringCYB, generatePatchBudgetMetrics, PatchDataTable } from './patchEngineeringCYB';

// Import database configurations
let databaseConfigs;
try {
  const configModule = require('../System/config');
  databaseConfigs = configModule.databaseConfigs || configModule.default || configModule;
} catch (error) {
  console.warn('Could not load config.js, using fallback configuration');
  databaseConfigs = {};
}

const MetricsCards = ({ 
  metrics, 
  darkMode, 
  onMetricClick, 
  filteredData = [], 
  onProjectSelect, 
  filters, 
  databaseName = 'engineering' 
}) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedMetricGroup, setSelectedMetricGroup] = useState('all');
  const [showTrends, setShowTrends] = useState(true);
  const [cardSize, setCardSize] = useState('normal');
  const [showDetails, setShowDetails] = useState(false);
  const [showInfoTooltips, setShowInfoTooltips] = useState(true);
  const [showPatchData, setShowPatchData] = useState(true);
  
  // States for drill-down functionality
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  const [showPatchTable, setShowPatchTable] = useState(false);

  // Get database configuration
  const dbConfig = useMemo(() => {
    return databaseConfigs[databaseName] || databaseConfigs.engineering || {};
  }, [databaseName]);

  // Create comprehensive filter mapping for patch data
  const patchFilters = useMemo(() => {
    if (!filters) return {};
    
    
  console.log(filters, filteredData);

    const mappedFilters = {
      searchTerm: filters.searchTerm || '',
      selectedBudgetHeads: [],
      selectedFrontierHQs: [],
      selectedSectorHQs: [],
      selectedRiskLevels: [],
      selectedHealthStatuses: [],
      utilizationRange: null
    };

    // Map budget heads from filters
    // Note: The patch data uses 'budget_head' field after processing
    if (filters.selectedBudgetHeads?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.selectedBudgetHeads;
    } else if (filters.columnFilters?.budget_head?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.columnFilters.budget_head;
    } else if (filters.columnFilters?.['Budget head']?.length > 0) {
      // Handle direct column name from enggcurrentyear
      mappedFilters.selectedBudgetHeads = filters.columnFilters['Budget head'];
    }

    // Map frontier HQs - patch data uses 'ftr_hq' field
    if (filters.selectedFrontierHQs?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.selectedFrontierHQs;
    } else if (filters.columnFilters?.ftr_hq_name?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq_name;
    } else if (filters.columnFilters?.['Name of Ftr HQ']?.length > 0) {
      // Handle direct column name from enggcurrentyear
      mappedFilters.selectedFrontierHQs = filters.columnFilters['Name of Ftr HQ'];
    } else if (filters.columnFilters?.ftr_hq?.length > 0) {
      // Handle transformed field name
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq;
    }

    // Map sector HQs if available (not in patch data, but keep for consistency)
    if (filters.selectedSectorHQs?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.selectedSectorHQs;
    } else if (filters.columnFilters?.shq_name?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.columnFilters.shq_name;
    }

    // Map risk levels
    if (filters.selectedRiskLevels?.length > 0) {
      mappedFilters.selectedRiskLevels = filters.selectedRiskLevels;
    } else if (filters.columnFilters?.risk_level?.length > 0) {
      mappedFilters.selectedRiskLevels = filters.columnFilters.risk_level;
    }

    // Map health statuses
    if (filters.selectedHealthStatuses?.length > 0) {
      mappedFilters.selectedHealthStatuses = filters.selectedHealthStatuses;
    } else if (filters.columnFilters?.health_status?.length > 0) {
      mappedFilters.selectedHealthStatuses = filters.columnFilters.health_status;
    }

    // Map utilization range
    if (filters.rangeFilters?.utilization_rate?.current) {
      mappedFilters.utilizationRange = filters.rangeFilters.utilization_rate.current;
    } else if (filters.rangeFilters?.['% Age of total Expdr']?.current) {
      // Handle direct column name for utilization
      mappedFilters.utilizationRange = filters.rangeFilters['% Age of total Expdr'].current;
    }

    // Additional mappings for scheme names if present
    if (filters.selectedSchemes?.length > 0) {
      mappedFilters.selectedSchemes = filters.selectedSchemes;
    } else if (filters.columnFilters?.['Name of scheme']?.length > 0) {
      mappedFilters.selectedSchemes = filters.columnFilters['Name of scheme'];
    } else if (filters.columnFilters?.name_of_scheme?.length > 0) {
      mappedFilters.selectedSchemes = filters.columnFilters.name_of_scheme;
    }

    console.log('[MetricsCards] Mapped patch filters:', mappedFilters);
    console.log('[MetricsCards] Original filters:', filters);
    return mappedFilters;
  }, [filters]);
  

  // Load patch data using the hook with mapped filters
  const { 
    patchData,
    patchMetrics, 
    patchLoading, 
    patchError,
    rawPatchData,
    PatchDataTable: PatchTable,
    refreshPatchData
  } = usePatchEngineeringCYB(patchFilters);

  // Store previous metrics to prevent unnecessary recalculations
  const prevMetricsRef = useRef({});
  const [displayMetrics, setDisplayMetrics] = useState({});

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

  // Format currency - values are already in lakhs from useData.js
  const formatCurrency = (value) => {
    const num = safeNumber(value, 0);
    if (num >= 100) {
      return `₹${(num / 100).toFixed(2)} Cr`;
    }
    return `₹${num.toFixed(2)} L`;
  };

  // Create field name mappings from config
  const fieldMappings = useMemo(() => {
    const mappings = {
      // Basic fields
      id: dbConfig.idField || 's_no',
      aaEsRef: 'aa_es_reference',
      
      // Financial fields
      sanctionedAmount: 'sd_amount_lakh',
      totalExpdr: 'expenditure_total',
      expdrCfy: 'expenditure_current_fy',
      expdrUpto31Mar25: 'expenditure_previous_fy',
      expenditurePercent: 'expenditure_percent',
      remainingAmount: 'remaining_amount',
      
      // Date fields
      dateTender: 'tender_date',
      dateAward: 'award_date',
      pdcAgreement: 'pdc_agreement',
      pdcRevised: 'pdc_revised',
      actualCompletionDate: 'completion_date_actual',
      
      // Progress fields
      physicalProgress: 'physical_progress_percent',
      timeAllowedDays: 'time_allowed_days',
      
      // Organization fields
      executiveAgency: 'executive_agency',
      firmName: 'firm_name',
      workSite: 'location',
      ftrHq: 'ftr_hq_name',
      shq: 'shq_name',
      budgetHead: 'budget_head',
      nameOfScheme: 'name_of_scheme'
    };

    // Override mappings based on actual config columns if available
    if (dbConfig.columns) {
      dbConfig.columns.forEach(col => {
        const name = col.name.toLowerCase();
        
        // Map common patterns
        if (name.includes('aa_es') || name.includes('aa/es')) {
          mappings.aaEsRef = col.name;
        } else if (name.includes('sanctioned') && name.includes('amount')) {
          mappings.sanctionedAmount = col.name;
        } else if (name.includes('total') && name.includes('exp')) {
          mappings.totalExpdr = col.name;
        } else if (name.includes('current') && name.includes('exp')) {
          mappings.expdrCfy = col.name;
        } else if (name.includes('previous') && name.includes('exp')) {
          mappings.expdrUpto31Mar25 = col.name;
        }
      });
    }

    return mappings;
  }, [dbConfig]);

  // Helper function to safely access field values
  const getFieldValue = (row, fieldKey, defaultValue = null) => {
    const fieldName = fieldMappings[fieldKey];
    return row?.[fieldName] ?? defaultValue;
  };

  // Calculate all metrics from filteredData using field mappings
  const calculatedMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        // Projects Section
        totalProjects: 0,
        sanctionedProjects: 0,
        notSanctioned: 0,
        tenderNotCalled: 0,
        underCodalFormality: 0,
        awarded: 0,
        tendersCalled: 0,  // New metric for tenders called
        
        // Budget Section
        totalBudget: 0,
        totalExpenditure: 0,
        currentYearBudget: 0,
        currentYearExpenditure: 0,
        previousYearExpenditure: 0,
        quarterlyExpenditure: 0,
        allocatedBudget: 0,
        remainingBudget: 0,
        unutilizedBudget: 0,
        overBudgetProjects: 0,
        utilizationRate: 0,
        
        // Progress Section
        tenderProgress: 0,
        tenderedNotAwarded: 0,
        awardedNotStarted: 0,
        progress1To50: 0,
        progress51To71: 0,
        progress71To99: 0,
        completed: 0,
        recentlyAwarded: 0,
        awardedThisYear: 0,
        completedRecently: 0,
        oldProjects: 0,
        
        // Health Section
        critical: 0,
        highRisk: 0,
        delayed: 0,
        ongoing: 0,
        notStarted: 0,
        highBudget: 0,
        lowHealth: 0,
        highEfficiency: 0,
        overdue: 0,
        nearCompletion: 0,
        perfectPace: 0,
        slowPace: 0,
        badPace: 0,
        sleepPace: 0,
        paymentPending: 0,
        
        // Timeline Section
        currentYearProjects: 0,
        lastQuarterProjects: 0,
        lastYearProjects: 0,
        
        // Keep existing metrics
        avgProgress: 0,
        avgEfficiency: 0,
        avgHealthScore: 0,
        mediumRisk: 0,
        lowRisk: 0,
        onTrack: 0,
        activeAgencies: 0,
        totalContractors: 0,
        totalLocations: 0,
        completionRate: 0,
        delayRate: 0,
        criticalRate: 0
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    // Projects Metrics - using mapped field names
    const totalProjects = filteredData.length;
    const sanctionedProjects = filteredData.filter(d => {
      const aaEs = getFieldValue(d, 'aaEsRef', '');
      return aaEs && aaEs !== '';
    }).length;
    const notSanctioned = filteredData.filter(d => {
      const aaEs = getFieldValue(d, 'aaEsRef', '');
      return !aaEs || aaEs === '';
    }).length;
    const tenderNotCalled = filteredData.filter(d => {
      const aaEs = getFieldValue(d, 'aaEsRef', '');
      const tenderDate = getFieldValue(d, 'dateTender', '');
      const progress = getFieldValue(d, 'physicalProgress', 0);
      return aaEs && aaEs !== '' && 
        (!tenderDate || tenderDate === '') && 
        progress === 0;
    }).length;
    
    // New metric: Tenders Called - tender date is filled but award date is empty
    const tendersCalled = filteredData.filter(d => {
      const tenderDate = getFieldValue(d, 'dateTender', '');
      const awardDate = getFieldValue(d, 'dateAward', '');
      return tenderDate && tenderDate !== '' && 
        (!awardDate || awardDate === '');
    }).length;
    
    const underCodalFormality = filteredData.filter(d => {
      const aaEs = getFieldValue(d, 'aaEsRef', '');
      const awardDate = getFieldValue(d, 'dateAward', '');
      return aaEs && aaEs !== '' && 
        (!awardDate || awardDate === '');
    }).length;
    const awarded = filteredData.filter(d => {
      const aaEs = getFieldValue(d, 'aaEsRef', '');
      const awardDate = getFieldValue(d, 'dateAward', '');
      return aaEs && aaEs !== '' && 
        awardDate && awardDate !== '';
    }).length;

    // Budget Metrics - using mapped field names
    const totalBudget = filteredData
        .reduce((sum, d) => sum + (getFieldValue(d, 'sanctionedAmount', 0) || 0), 0);

    const totalExpenditure = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'totalExpdr', 0) || 0), 0);

    const currentYearExpenditure = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'expdrCfy', 0) || 0), 0);

    // Current Year Budget (budget for projects started this year)
    const currentYearBudget = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const awardDate = getFieldValue(d, 'dateAward');
          if (!aaEs || aaEs === '') return false;
          if (!awardDate) return false;
          try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award.getFullYear() === currentYear;
          } catch {
            return false;
          }
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'sanctionedAmount', 0) || 0), 0);

    // Previous Year Expenditure
    const previousYearExpenditure = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'expdrUpto31Mar25', 0) || 0), 0);

    // Quarterly Expenditure (current quarter)
    const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
    const quarterlyExpenditure = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const awardDate = getFieldValue(d, 'dateAward');
          if (!aaEs || aaEs === '') return false;
          if (!awardDate) return false;
          try {
            const award = new Date(awardDate);
            return award >= quarterStart;
          } catch {
            return false;
          }
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'totalExpdr', 0) || 0), 0);

    // Unutilized Budget
    const unutilizedBudget = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const progress = getFieldValue(d, 'physicalProgress', 0);
          return aaEs && aaEs !== '' && progress >= 100;
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'remainingAmount', 0) || 0), 0);

    // Over Budget Projects
    const overBudgetProjects = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const expdr = getFieldValue(d, 'totalExpdr', 0);
          const sanctioned = getFieldValue(d, 'sanctionedAmount', 0);
          return aaEs && aaEs !== '' && expdr > sanctioned;
        })
        .length;

    const allocatedBudget = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        })
        .reduce((sum, d) => sum + (getFieldValue(d, 'sanctionedAmount', 0) || 0), 0);

    const remainingBudget = filteredData
        .filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        })
        .reduce((sum, d) => {
          const sanctioned = getFieldValue(d, 'sanctionedAmount', 0) || 0;
          const expdr = getFieldValue(d, 'totalExpdr', 0) || 0;
          return sum + Math.max(0, sanctioned - expdr);
        }, 0);

    // Progress Categories - using progress_category from useData.js
    const tenderProgress = filteredData.filter(d => 
        d.progress_category === 'TENDER_PROGRESS'
    ).length;

    const tenderedNotAwarded = filteredData.filter(d => 
        d.progress_category === 'TENDERED_NOT_AWARDED'
    ).length;

    const awardedNotStarted = filteredData.filter(d => 
        d.progress_category === 'AWARDED_NOT_STARTED'
    ).length;

    const progress1To50 = filteredData.filter(d => 
        d.progress_category === 'PROGRESS_1_TO_50'
    ).length;

    const progress51To71 = filteredData.filter(d => 
        d.progress_category === 'PROGRESS_51_TO_71'
    ).length;

    const progress71To99 = filteredData.filter(d => 
        d.progress_category === 'PROGRESS_71_TO_99'
    ).length;

    const completed = filteredData.filter(d => 
        d.progress_category === 'COMPLETED'
    ).length;

    // Recent metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const yearStart = new Date(currentYear, 0, 1);

    const recentlyAwarded = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award >= thirtyDaysAgo;
        } catch {
            return false;
        }
    }).length;

    const awardedThisYear = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award >= yearStart;
        } catch {
            return false;
        }
    }).length;

    const completedRecently = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const completionDate = getFieldValue(d, 'actualCompletionDate');
        const progress = getFieldValue(d, 'physicalProgress', 0);
        if (!aaEs || aaEs === '') return false;
        if (!completionDate || progress < 100) return false;
        try {
            const completion = new Date(completionDate);
            return !isNaN(completion.getTime()) && completion >= ninetyDaysAgo;
        } catch {
            return false;
        }
    }).length;

    const oldProjects = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            if (isNaN(award.getTime())) return false;
            const ageInDays = (now - award) / (1000 * 60 * 60 * 24);
            return ageInDays > 365;
        } catch {
            return false;
        }
    }).length;

    // Health Metrics - using pre-calculated values from useData.js
    const critical = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.risk_level === 'CRITICAL';
    }).length;

    const highRisk = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.risk_level === 'HIGH';
    }).length;

    const mediumRisk = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.risk_level === 'MEDIUM';
    }).length;

    const lowRisk = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.risk_level === 'LOW';
    }).length;

    const delayed = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        (d.delay_days || 0) > 0;
    }).length;

    const ongoing = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const progress = getFieldValue(d, 'physicalProgress', 0);
        return aaEs && aaEs !== '' &&
        progress > 0 && progress < 100;
    }).length;

    const notStarted = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const progress = getFieldValue(d, 'physicalProgress', 0);
        return aaEs && aaEs !== '' &&
        progress === 0;
    }).length;

    const highBudget = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const amount = getFieldValue(d, 'sanctionedAmount', 0);
        return aaEs && aaEs !== '' &&
        amount > 500; // 500 lakhs = 5 crores
    }).length;

    const lowHealth = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        (d.health_score || 0) < 50;
    }).length;

    const highEfficiency = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        (d.efficiency_score || 0) > 80;
    }).length;

    const overdue = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.delay_days > 90;
    }).length;

    const nearCompletion = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const progress = getFieldValue(d, 'physicalProgress', 0);
        return aaEs && aaEs !== '' &&
        progress >= 75 && progress < 100;
    }).length;

    const onTrack = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const progress = getFieldValue(d, 'physicalProgress', 0);
        return aaEs && aaEs !== '' &&
        d.delay_days === 0 && progress > 0;
    }).length;

    // Pace categories - using health_status from useData.js
    const perfectPace = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.health_status === 'PERFECT_PACE';
    }).length;

    const slowPace = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.health_status === 'SLOW_PACE';
    }).length;

    const badPace = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.health_status === 'BAD_PACE';
    }).length;

    const sleepPace = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.health_status === 'SLEEP_PACE';
    }).length;

    const paymentPending = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '' &&
        d.health_status === 'PAYMENT_PENDING';
    }).length;

    // Timeline Metrics
    const currentYearProjects = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award.getFullYear() === currentYear;
        } catch {
            return false;
        }
    }).length;

    const lastQuarterProjects = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            if (isNaN(award.getTime())) return false;
            const projectQuarter = Math.floor(award.getMonth() / 3);
            const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
            const checkYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
            return award.getFullYear() === checkYear && projectQuarter === lastQuarter;
        } catch {
            return false;
        }
    }).length;

    const lastYearProjects = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        const awardDate = getFieldValue(d, 'dateAward');
        if (!aaEs || aaEs === '') return false;
        if (!awardDate) return false;
        try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award.getFullYear() === currentYear - 1;
        } catch {
            return false;
        }
    }).length;

    // Calculate averages and other metrics (only for sanctioned projects)
    const sanctionedData = filteredData.filter(d => {
        const aaEs = getFieldValue(d, 'aaEsRef', '');
        return aaEs && aaEs !== '';
    });
    const sanctionedCount = sanctionedData.length;

    const avgProgress = sanctionedCount > 0 
        ? sanctionedData.reduce((sum, d) => sum + (getFieldValue(d, 'physicalProgress', 0) || 0), 0) / sanctionedCount 
        : 0;

    const avgEfficiency = sanctionedCount > 0 
        ? sanctionedData.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / sanctionedCount 
        : 0;

    const avgHealthScore = sanctionedCount > 0 
        ? sanctionedData.reduce((sum, d) => sum + (d.health_score || 0), 0) / sanctionedCount 
        : 0;

    // Calculate unique organizations (only for sanctioned projects)
    const uniqueAgencies = new Set(sanctionedData.map(d => getFieldValue(d, 'executiveAgency')).filter(Boolean));
    const uniqueContractors = new Set(sanctionedData.map(d => getFieldValue(d, 'firmName')).filter(Boolean));
    const uniqueLocations = new Set(sanctionedData.map(d => getFieldValue(d, 'workSite')?.split(',')[0]).filter(Boolean));

    return {
      // Projects
      totalProjects,
      sanctionedProjects,
      notSanctioned,
      tenderNotCalled,
      underCodalFormality,
      awarded,
      tendersCalled, // New metric added
      
      // Budget
      totalBudget,
      totalExpenditure,
      currentYearBudget,
      currentYearExpenditure,
      previousYearExpenditure,
      quarterlyExpenditure,
      allocatedBudget,
      remainingBudget,
      unutilizedBudget,
      overBudgetProjects,
      utilizationRate: totalBudget > 0 ? (totalExpenditure / totalBudget * 100) : 0,
      
      // Progress
      tenderProgress,
      tenderedNotAwarded,
      awardedNotStarted,
      progress1To50,
      progress51To71,
      progress71To99,
      completed,
      recentlyAwarded,
      awardedThisYear,
      completedRecently,
      oldProjects,
      
      // Health
      critical,
      highRisk,
      mediumRisk,
      lowRisk,
      delayed,
      ongoing,
      notStarted,
      highBudget,
      lowHealth,
      highEfficiency,
      overdue,
      nearCompletion,
      onTrack,
      perfectPace,
      slowPace,
      badPace,
      sleepPace,
      paymentPending,
      
      // Timeline
      currentYearProjects,
      lastQuarterProjects,
      lastYearProjects,
      
      // Other metrics
      avgProgress: avgProgress.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      activeAgencies: uniqueAgencies.size,
      totalContractors: uniqueContractors.size,
      totalLocations: uniqueLocations.size,
      completionRate: totalProjects > 0 ? (completed / totalProjects * 100).toFixed(1) : 0,
      delayRate: totalProjects > 0 ? (delayed / totalProjects * 100).toFixed(1) : 0,
      criticalRate: totalProjects > 0 ? (critical / totalProjects * 100).toFixed(1) : 0
    };
  }, [filteredData, fieldMappings]);

  // Update display metrics only when calculated metrics actually change
  useEffect(() => {
    const hasChanged = Object.keys(calculatedMetrics).some(key => {
      return prevMetricsRef.current[key] !== calculatedMetrics[key];
    });

    if (hasChanged) {
      prevMetricsRef.current = calculatedMetrics;
      setDisplayMetrics(calculatedMetrics);
    }
  }, [calculatedMetrics]);

  // Initialize display metrics on mount
  useEffect(() => {
    if (Object.keys(displayMetrics).length === 0) {
      setDisplayMetrics(calculatedMetrics);
      prevMetricsRef.current = calculatedMetrics;
    }
  }, []);

  // Get filtered data based on metric type - using mapped field names
  const getMetricData = useCallback((metricId) => {
    if (!filteredData || filteredData.length === 0) return [];

    switch (metricId) {
      // Projects Section
      case 'total-projects':
        return filteredData;
      case 'sanctioned':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '';
        });
      case 'not-sanctioned':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return !aaEs || aaEs === '';
        });
      case 'tender-not-called':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const tenderDate = getFieldValue(d, 'dateTender', '');
          const progress = getFieldValue(d, 'physicalProgress', 0);
          return aaEs && aaEs !== '' &&
            (!tenderDate || tenderDate === '') && 
            progress === 0;
        });
      case 'tenders-called':  // New metric - tenders called
        return filteredData.filter(d => {
          const tenderDate = getFieldValue(d, 'dateTender', '');
          const awardDate = getFieldValue(d, 'dateAward', '');
          return tenderDate && tenderDate !== '' && 
            (!awardDate || awardDate === '');
        });
      case 'codal':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const awardDate = getFieldValue(d, 'dateAward', '');
          return aaEs && aaEs !== '' &&
            (!awardDate || awardDate === '');
        });
      case 'awarded':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const awardDate = getFieldValue(d, 'dateAward', '');
          return aaEs && aaEs !== '' &&
            awardDate && awardDate !== '';
        });
        
      // Progress Section - using progress_category from useData.js
      case 'tender-progress':
        return filteredData.filter(d => d.progress_category === 'TENDER_PROGRESS');
      case 'tendered-not-awarded':
        return filteredData.filter(d => d.progress_category === 'TENDERED_NOT_AWARDED');
      case 'awarded-not-started':
        return filteredData.filter(d => d.progress_category === 'AWARDED_NOT_STARTED');
      case 'progress-1-50':
        return filteredData.filter(d => d.progress_category === 'PROGRESS_1_TO_50');
      case 'progress-51-71':
        return filteredData.filter(d => d.progress_category === 'PROGRESS_51_TO_71');
      case 'progress-71-99':
        return filteredData.filter(d => d.progress_category === 'PROGRESS_71_TO_99');
      case 'completed':
      case 'progress-completed':
        return filteredData.filter(d => d.progress_category === 'COMPLETED');
      case 'recently-awarded':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const awardDate = getFieldValue(d, 'dateAward');
          if (!aaEs || aaEs === '') return false;
          if (!awardDate) return false;
          try {
            const award = new Date(awardDate);
            return !isNaN(award.getTime()) && award >= thirtyDaysAgo;
          } catch {
            return false;
          }
        });
      
      // Health Section - using pre-calculated fields from useData.js
      case 'critical':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.risk_level === 'CRITICAL';
        });
      case 'high-risk':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.risk_level === 'HIGH';
        });
      case 'delayed':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          (d.delay_days || 0) > 0;
        });
      case 'ongoing':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const progress = getFieldValue(d, 'physicalProgress', 0);
          return aaEs && aaEs !== '' &&
          progress > 0 && progress < 100;
        });
      case 'notstarted':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const progress = getFieldValue(d, 'physicalProgress', 0);
          return aaEs && aaEs !== '' &&
          progress === 0;
        });
      case 'perfect-pace':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.health_status === 'PERFECT_PACE';
        });
      case 'slow-pace':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.health_status === 'SLOW_PACE';
        });
      case 'bad-pace':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.health_status === 'BAD_PACE';
        });
      case 'sleep-pace':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          return aaEs && aaEs !== '' &&
          d.health_status === 'SLEEP_PACE';
        });
        
      // Budget Section
      case 'total-budget':
        return filteredData;
      case 'expenditure':
        return filteredData.filter(d => {
          const aaEs = getFieldValue(d, 'aaEsRef', '');
          const expdr = getFieldValue(d, 'totalExpdr', 0);
          return aaEs && aaEs !== '' &&
          (expdr || 0) > 0;
        });
      
      default:
        return filteredData;
    }
  }, [filteredData, fieldMappings]);

  // Handle metric click
  const handleMetricClick = useCallback((metric) => {
    if (metric.isPatchData) {
      // For patch metrics, show the patch data table
      setSelectedMetric(metric);
      setDrillDownTitle(`${metric.title} - ${metric.value} ${metric.subtitle || ''}`);
      setDrillDownData(patchData);
      setShowDrillDown(true);
      console.log('[MetricsCard] Opening patch data view:', patchData.length, 'entries');
    } else {
      // For regular metrics, show filtered project data
      const data = getMetricData(metric.id);
      setDrillDownData(data);
      setDrillDownTitle(`${metric.title} - ${metric.value} ${metric.subtitle || ''}`);
      setSelectedMetric(metric);
      setShowDrillDown(true);
      console.log('[MetricsCard] Opening project data view:', data.length, 'entries for', metric.id);
    }
  }, [patchData, getMetricData]);

  // Close drill-down modal
  const closeDrillDown = useCallback(() => {
    setShowDrillDown(false);
    setSelectedMetric(null);
    setDrillDownData([]);
    setDrillDownTitle('');
  }, []);

  // Define all sections with metrics
  const projectsMetrics = useMemo(() => [
    {
      id: 'total-projects',
      group: 'projects',
      title: 'Total Projects',
      value: displayMetrics.totalProjects || 0,
      subtitle: `Budget: ${formatCurrency(displayMetrics.totalBudget || 0)}`,
      icon: Briefcase,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      trend: 12,
      trendDirection: 'up',
      details: {
        'Sanctioned': displayMetrics.sanctionedProjects || 0,
        'Not Sanctioned': displayMetrics.notSanctioned || 0,
        'Awarded': displayMetrics.awarded || 0,
        'Total Budget': formatCurrency(displayMetrics.totalBudget || 0)
      },
      sparkline: generateTrendData(displayMetrics.totalProjects || 0, 5),
      percentage: 100,
      alert: false,
      priority: 1,
      infoText: "This shows the total number of projects currently being tracked in the system, along with their combined budget allocation."
    },
    {
      id: 'sanctioned',
      group: 'projects',
      title: 'Sanctioned Projects',
      value: displayMetrics.sanctionedProjects || 0,
      subtitle: 'AA/ES approved',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      percentage: safeNumber((displayMetrics.sanctionedProjects / Math.max(1, displayMetrics.totalProjects)) * 100),
      infoText: "Projects that have received Administrative Approval (AA) and Expenditure Sanction (ES) from the government."
    },
    {
      id: 'not-sanctioned',
      group: 'projects',
      title: 'Not Sanctioned',
      value: displayMetrics.notSanctioned || 0,
      subtitle: 'AA/ES pending',
      icon: XCircle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: displayMetrics.notSanctioned > displayMetrics.totalProjects * 0.3,
      infoText: "Projects waiting for official government approval."
    },
    {
      id: 'awarded',
      group: 'projects',
      title: 'Work Awarded',
      value: displayMetrics.awarded || 0,
      subtitle: `${safeNumber((displayMetrics.awarded / Math.max(1, displayMetrics.totalProjects)) * 100).toFixed(1)}%`,
      icon: Award,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      sparkline: generateTrendData(displayMetrics.awarded || 0, 3),
      infoText: "Projects where contractors have been officially selected and contracts signed."
    },
    {
      id: 'codal',
      group: 'projects',
      title: 'Under Codal Formality',
      value: displayMetrics.underCodalFormality || 0,
      subtitle: 'Award pending',
      icon: FileText,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Projects undergoing legal and procedural checks before final contractor selection."
    },
    // New metric for Tenders Called
    {
      id: 'tenders-called',
      group: 'projects',
      title: 'Tenders Called',
      value: displayMetrics.tendersCalled || 0,
      subtitle: 'Awaiting award',
      icon: FileText,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Projects where tender has been called but award is not yet given."
    },
    {
      id: 'tender-not-called',
      group: 'projects',
      title: 'Tender Yet to Call',
      value: displayMetrics.tenderNotCalled || 0,
      subtitle: 'No tender date',
      icon: Calendar,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Projects approved but haven't started the bidding process."
    },
  ], [displayMetrics]);

  const budgetMetrics = useMemo(() => {
    const baseMetrics = [
      {
        id: 'total-budget',
        group: 'budget',
        title: 'Scheme Amount',
        value: formatCurrency(displayMetrics.totalBudget || 0),
        subtitle: `${displayMetrics.totalProjects || 0} projects`,
        icon: IndianRupee,
        color: 'green',
        gradient: 'from-green-500 to-green-600',
        sparkline: generateTrendData(displayMetrics.totalBudget || 0, 100),
        infoText: "The total amount of money allocated for all projects."
      },
      {
        id: 'allocated',
        group: 'budget',
        title: 'Sanctioned Issue',
        value: formatCurrency(displayMetrics.allocatedBudget || 0),
        subtitle: 'Sanctioned projects',
        icon: Wallet,
        color: 'purple',
        gradient: 'from-purple-500 to-purple-600',
        infoText: "Budget assigned to projects that have received official approval."
      },
      {
        id: 'expenditure',
        group: 'budget',
        title: 'Total Expenditure',
        value: formatCurrency(displayMetrics.totalExpenditure || 0),
        subtitle: `${safeNumber(displayMetrics.utilizationRate || 0).toFixed(1)}% utilized`,
        icon: CreditCard,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        percentage: displayMetrics.utilizationRate || 0,
        infoText: "The actual amount of money spent so far on all projects."
      },
      {
        id: 'current-year-expenditure',
        group: 'budget',
        title: 'Expenditure Current FY',
        value: formatCurrency(displayMetrics.currentYearExpenditure || 0),
        subtitle: `${displayMetrics.currentYearBudget ? 
          ((displayMetrics.currentYearExpenditure / displayMetrics.currentYearBudget) * 100).toFixed(1) : 0}% utilized`,
        icon: Coins,
        color: 'cyan',
        gradient: 'from-cyan-500 to-cyan-600',
        percentage: displayMetrics.currentYearBudget > 0 
          ? ((displayMetrics.currentYearExpenditure / displayMetrics.currentYearBudget) * 100)
          : 0,
        sparkline: generateTrendData(displayMetrics.currentYearExpenditure || 0, 20),
        infoText: "Actual expenditure in the current financial year."
      },
      {
        id: 'quarterly-expenditure',
        group: 'budget',
        title: 'Quarterly Spending',
        value: formatCurrency(displayMetrics.quarterlyExpenditure || 0),
        subtitle: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
        icon: PiggyBank,
        color: 'emerald',
        gradient: 'from-emerald-500 to-emerald-600',
        infoText: "Expenditure in the current quarter."
      },
      {
        id: 'remaining',
        group: 'budget',
        title: 'Remaining Budget',
        value: formatCurrency(displayMetrics.remainingBudget || 0),
        subtitle: 'Available',
        icon: Database,
        color: 'amber',
        gradient: 'from-amber-500 to-amber-600',
        infoText: "The amount of money left to be spent."
      },
      {
        id: 'unutilized',
        group: 'budget',
        title: 'Unutilized Budget',
        value: formatCurrency(displayMetrics.unutilizedBudget || 0),
        subtitle: 'Completed projects',
        icon: AlertCircle,
        color: 'orange',
        gradient: 'from-orange-500 to-orange-600',
        alert: displayMetrics.unutilizedBudget > displayMetrics.totalBudget * 0.05,
        infoText: "Budget remaining unutilized after project completion."
      },
      {
        id: 'over-budget',
        group: 'budget',
        title: 'Over Budget Projects',
        value: displayMetrics.overBudgetProjects || 0,
        subtitle: 'Cost overrun',
        icon: AlertTriangle,
        color: 'red',
        gradient: 'from-red-500 to-red-600',
        alert: displayMetrics.overBudgetProjects > 0,
        infoText: "Number of projects where actual expenditure has exceeded the sanctioned budget."
      },
      {
        id: 'high-budget',
        group: 'budget',
        title: 'High Budget Projects',
        value: displayMetrics.highBudget || 0,
        subtitle: '>₹5 Cr',
        icon: IndianRupee,
        color: 'purple',
        gradient: 'from-purple-500 to-purple-600',
        infoText: "Projects with budget exceeding ₹5 crores."
      }
    ];
    
    // Add patch data metrics if enabled and data is loaded
    if (showPatchData && !patchLoading && patchMetrics) {
      const patchBudgetMetrics = generatePatchBudgetMetrics(patchMetrics, darkMode);
      
      // Add a divider for Current Year metrics
      const metricsWithDivider = [
        ...baseMetrics,
        // Current Year divider
        {
          id: 'current-year-divider',
          group: 'budget',
          title: 'Current Year',
          value: '',
          subtitle: `Financial Year ${new Date().getFullYear()}`,
          icon: CalendarDays,
          color: 'indigo',
          gradient: 'from-indigo-500 to-indigo-600',
          isDivider: true, // Add flag to identify as divider
          infoText: "Data for the current financial year from patch file."
        },
        ...patchBudgetMetrics
      ];
      
      return metricsWithDivider;
    }
    
    return baseMetrics;
  }, [displayMetrics, showPatchData, patchLoading, patchMetrics, darkMode]);

  const progressMetrics = useMemo(() => [
    {
      id: 'tender-progress',
      group: 'progress',
      title: 'Tender Progress',
      value: displayMetrics.tenderProgress || 0,
      icon: Activity,
      color: 'slate',
      gradient: 'from-slate-500 to-slate-600',
      infoText: "Projects in the tender preparation stage."
    },
    {
      id: 'tendered-not-awarded',
      group: 'progress',
      title: 'Tendered Not Awarded',
      value: displayMetrics.tenderedNotAwarded || 0,
      icon: PauseCircle,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Projects where bidding is complete but no contractor selected yet."
    },
    {
      id: 'awarded-not-started',
      group: 'progress',
      title: 'Awarded but Not Started',
      value: displayMetrics.awardedNotStarted || 0,
      icon: PlayCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Projects where contractor is selected but physical work hasn't begun."
    },
    {
      id: 'progress-1-50',
      group: 'progress',
      title: 'Progress 1-50%',
      value: displayMetrics.progress1To50 || 0,
      icon: Activity,
      color: 'red',
      gradient: 'from-red-500 to-orange-500',
      infoText: "Projects in early to mid-stage of completion."
    },
    {
      id: 'progress-51-71',
      group: 'progress',
      title: 'Progress 51-70%',
      value: displayMetrics.progress51To71 || 0,
      icon: Activity,
      color: 'yellow',
      gradient: 'from-yellow-500 to-green-500',
      infoText: "Projects that are more than halfway done."
    },
    {
      id: 'progress-71-99',
      group: 'progress',
      title: 'Progress 71-99%',
      value: displayMetrics.progress71To99 || 0,
      icon: Target,
      color: 'blue',
      gradient: 'from-blue-500 to-green-500',
      infoText: "Projects nearing completion."
    },
    {
      id: 'progress-completed',
      group: 'progress',
      title: 'Completed',
      value: displayMetrics.completed || 0,
      subtitle: '100% done',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      sparkline: generateTrendData(displayMetrics.completed || 0, 2),
      percentage: safeNumber((displayMetrics.completed / Math.max(1, displayMetrics.totalProjects)) * 100),
      infoText: "Projects that have finished all work."
    },
    {
      id: 'recently-awarded',
      group: 'progress',
      title: 'Recently Awarded',
      value: displayMetrics.recentlyAwarded || 0,
      subtitle: 'Last 30 days',
      icon: Award,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Projects where contracts were signed in the last 30 days."
    },
    {
      id: 'awarded-year',
      group: 'progress',
      title: 'Awarded This Year',
      value: displayMetrics.awardedThisYear || 0,
      subtitle: new Date().getFullYear(),
      icon: Calendar,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      infoText: "All projects that received contractor awards in the current year."
    },
    {
      id: 'completed-recently',
      group: 'progress',
      title: 'Recently Completed',
      value: displayMetrics.completedRecently || 0,
      subtitle: 'Last 90 days',
      icon: CheckCircle,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      infoText: "Projects finished in the last 90 days."
    },
    {
      id: 'old-projects',
      group: 'progress',
      title: 'Old Projects',
      value: displayMetrics.oldProjects || 0,
      subtitle: '> 1 year',
      icon: Clock,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      infoText: "Projects started more than a year ago but not complete."
    },
  ], [displayMetrics]);

  const healthMetrics = useMemo(() => [
    {
      id: 'critical',
      group: 'health',
      title: 'Critical',
      value: displayMetrics.critical || 0,
      subtitle: `${safeNumber(displayMetrics.criticalRate || 0).toFixed(1)}%`,
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      alert: true,
      pulse: displayMetrics.critical > 10,
      infoText: "Projects facing severe issues that need immediate attention."
    },
    {
      id: 'high-risk',
      group: 'health',
      title: 'High Risk',
      value: displayMetrics.highRisk || 0,
      icon: AlertCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      infoText: "Projects with significant risk factors."
    },
    {
      id: 'delayed',
      group: 'health',
      title: 'Delayed',
      value: displayMetrics.delayed || 0,
      subtitle: `${safeNumber(displayMetrics.delayRate || 0).toFixed(1)}%`,
      icon: Clock,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      infoText: "Projects running behind their planned schedule."
    },
    {
      id: 'completed',
      group: 'health',
      title: 'Completed',
      value: displayMetrics.completed || 0,
      subtitle: `${safeNumber(displayMetrics.completionRate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      infoText: "Projects that have finished all work."
    },
    {
      id: 'ongoing',
      group: 'health',
      title: 'Ongoing',
      value: displayMetrics.ongoing || 0,
      icon: Activity,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      infoText: "Projects where work is actively in progress."
    },
    {
      id: 'notstarted',
      group: 'health',
      title: 'Not Started',
      value: displayMetrics.notStarted || 0,
      icon: Package,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      infoText: "Projects with zero physical progress."
    },
    {
      id: 'perfect-pace',
      group: 'health',
      title: 'Perfect Pace',
      value: displayMetrics.perfectPace || 0,
      icon: Gauge,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      infoText: "Projects progressing as planned or ahead of schedule."
    },
    {
      id: 'slow-pace',
      group: 'health',
      title: 'Slow Pace',
      value: displayMetrics.slowPace || 0,
      icon: Timer,
      color: 'yellow',
      gradient: 'from-yellow-500 to-amber-600',
      infoText: "Projects progressing slower than planned (75-95% of expected)."
    },
    {
      id: 'bad-pace',
      group: 'health',
      title: 'Bad Pace',
      value: displayMetrics.badPace || 0,
      icon: AlertCircle,
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      infoText: "Projects significantly behind schedule (50-75% of expected)."
    },
    {
      id: 'sleep-pace',
      group: 'health',
      title: 'Sleep Pace',
      value: displayMetrics.sleepPace || 0,
      icon: PauseCircle,
      color: 'red',
      gradient: 'from-red-500 to-red-700',
      infoText: "Projects moving extremely slowly (<50% of expected)."
    }
  ], [displayMetrics]);

  const timelineMetrics = useMemo(() => [
    {
      id: 'current-year',
      group: 'timeline',
      title: 'Current Year Projects',
      value: displayMetrics.currentYearProjects || 0,
      subtitle: `FY ${new Date().getFullYear()}`,
      icon: CalendarDays,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      sparkline: generateTrendData(displayMetrics.currentYearProjects || 0, 5),
      infoText: "Projects started in the current financial year."
    },
    {
      id: 'last-quarter',
      group: 'timeline',
      title: 'Last Quarter Projects',
      value: displayMetrics.lastQuarterProjects || 0,
      subtitle: `Q${Math.max(1, Math.floor((new Date().getMonth()) / 3))}`,
      icon: CalendarClock,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      infoText: "Projects initiated in the previous quarter."
    },
    {
      id: 'last-year',
      group: 'timeline',
      title: 'Last Year Projects',
      value: displayMetrics.lastYearProjects || 0,
      subtitle: `FY ${new Date().getFullYear() - 1}`,
      icon: CalendarCheck,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      infoText: "Projects from the previous financial year."
    }
  ], [displayMetrics]);

  // Group metrics for filtering
  const metricGroups = useMemo(() => ({
    all: [...projectsMetrics, ...budgetMetrics, ...progressMetrics, ...healthMetrics, ...timelineMetrics],
    projects: projectsMetrics,
    budget: budgetMetrics,
    progress: progressMetrics,
    health: healthMetrics,
    timeline: timelineMetrics
  }), [projectsMetrics, budgetMetrics, progressMetrics, healthMetrics, timelineMetrics]);

  const getColorClass = (color) => {
    const colors = {
      blue: 'text-blue-500',
      orange: 'text-orange-500',
      green: 'text-green-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      cyan: 'text-cyan-500',
      slate: 'text-slate-500',
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      teal: 'text-teal-500',
      emerald: 'text-emerald-500',
      violet: 'text-violet-500',
      fuchsia: 'text-fuchsia-500',
      lime: 'text-lime-500',
      gray: 'text-gray-500',
      sky: 'text-sky-500'
    };
    return colors[color] || 'text-gray-500';
  };

  // MetricCard Component with stable values
  const MetricCard = ({ metric, isMain = true, size = 'normal' }) => {
    const isHovered = hoveredCard === metric.id;
    const showDetailPopup = isHovered && metric.details;
    const [showInfo, setShowInfo] = useState(false);
    const cardRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });

    // Calculate popup position when hovering
    useEffect(() => {
      if (showDetailPopup && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [showDetailPopup]);

    const cardSizes = {
      compact: 'p-3',
      normal: 'p-4',
      large: 'p-6'
    };

    // For divider cards
    if (metric.isDivider) {
      return (
        <div className={`col-span-full ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50'} rounded-xl p-3 my-2`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
              <metric.icon size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {metric.title}
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {metric.subtitle}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          ref={cardRef}
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
            ${metric.isPatchData ? 'border-l-4 border-l-indigo-500' : ''}
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

          {/* Patch Data Indicator */}
          {metric.isPatchData && (
            <div className="absolute top-2 right-3">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                CY
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
                  {metric.group && size !== 'compact' && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {metric.group}
                    </span>
                  )}
                </div>
                
                {showTrends && metric.trendValue !== undefined && metric.trendValue !== 0 && size !== 'compact' && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                          metric.trend === 'up' 
                              ? (metric.alert ? 'text-red-500' : 'text-green-500')
                              : (metric.alert ? 'text-green-500' : 'text-red-500')
                      }`}>
                          {metric.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span className="text-[10px]">{Math.abs(parseFloat(metric.trendValue)).toFixed(1)}%</span>
                      </div>
                  )}
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
                        <stop offset="5%" stopColor={getColorClass(metric.color).replace('text-', '#')} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={getColorClass(metric.color).replace('text-', '#')} stopOpacity={0}/>
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
              onMouseLeave={() => setShowInfo(false)}
              className={`absolute bottom-2 right-2 p-1 rounded-full ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors z-20`}
            >
              <HelpCircle size={14} className="text-gray-400" />
            </button>
          )}
          
          {/* Info Tooltip */}
          {showInfo && metric.infoText && (
            <>
              <div className="fixed inset-0 z-[9998] pointer-events-none" />
              <div 
                className={`absolute bottom-10 right-0 w-64 p-3 rounded-xl shadow-2xl ${
                  darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                } border z-[9999]`}
                style={{ maxWidth: '250px' }}
              >
                <div 
                  className="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent"
                  style={{ 
                    borderTopColor: darkMode ? '#111827' : '#ffffff',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
                  }}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  {metric.infoText}
                </p>
              </div>
            </>
          )}

          {/* More options button */}
          {size !== 'compact' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`absolute top-3 right-3 p-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <MoreVertical size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Detail popup using fixed positioning */}
        {showDetailPopup && (
          <div 
            className={`fixed p-3 rounded-xl shadow-xl ${
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } border z-[99999]`}
            style={{ 
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              width: `${popupPosition.width}px`,
              minWidth: '200px'
            }}
          >
            <div className="space-y-2">
              {Object.entries(metric.details).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <ChevronRight size={10} />
                    {key}:
                  </span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
            
            <button className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}>
              <Eye size={12} />
              View Details
            </button>
          </div>
        )}
      </>
    );
  };

  // Drill-down Modal Component
  const DrillDownModal = () => {
    if (!showDrillDown) return null;

    // Handle modal close
    const handleClose = () => {
      closeDrillDown();
    };

    // Handle row selection
    const handleRowClick = (row) => {
      // Only handle clicks for project data, not patch data
      if (!selectedMetric?.isPatchData) {
        handleClose();
        if (onProjectSelect) {
          onProjectSelect(row);
        } else if (onMetricClick) {
          onMetricClick('project', row);
        }
      }
    };

    // Render patch data table using dedicated component for patch metrics
    if (selectedMetric?.isPatchData && PatchTable) {
      return (
        <PatchTable
          data={patchData}
          darkMode={darkMode}
          title={drillDownTitle}
          onClose={handleClose}
          isModal={true}
        />
      );
    }

    // Render regular project data table
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal Container */}
        <div className={`relative w-[98vw] max-w-[1600px] h-[88vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          {/* Header */}
          <div className={`px-3 py-2 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {drillDownTitle} &nbsp;
                  <span className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                    (Showing {drillDownData.length} projects)
                  </span>
                </h2>
                
              </div>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={drillDownData}
              darkMode={darkMode}
              onRowClick={handleRowClick}
              compareMode={false}
              selectedProjects={[]}
              isEmbedded={true}
              maxHeight="calc(85vh - 80px)"
              maxWidth="100%"
              databaseName={databaseName}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" style={{ position: 'relative' }}>
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
          {/* Patch Data Toggle (only for budget section) */}
          {(selectedMetricGroup === 'budget' || selectedMetricGroup === 'all') && (
            <button
              onClick={() => setShowPatchData(!showPatchData)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                showPatchData
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle Current Year Budget patch data"
            >
              <DollarSign size={12} />
              CY Patch
              {patchLoading && <RefreshCw size={10} className="animate-spin ml-1" />}
              {patchError && <AlertCircle size={10} className="text-red-400 ml-1" />}
            </button>
          )}
          
          {/* Size Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
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
          </div>
          
          {/* Info Tooltips Toggle */}
          <button
            onClick={() => setShowInfoTooltips(!showInfoTooltips)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              showInfoTooltips
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Toggle information tooltips"
          >
            <Info size={12} />
            Help
          </button>
          
          {/* Trends Toggle */}
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
          
          {/* Expand Toggle */}
          <button
            onClick={() => setExpandedView(!expandedView)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {expandedView ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expandedView ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Metrics Display */}
      {selectedMetricGroup === 'all' ? (
        // Show all sections with headers
        <div className="space-y-6">
          {/* Projects Section */}
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          } overflow-hidden`}>
            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-blue-50 border-blue-100'} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Briefcase size={16} className="text-white" />
                </div>
                <h3 className="font-semibold">{dbConfig.displayName ? 'Projects' : 'Projects'}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {projectsMetrics.length} metrics
                </span>
              </div>
              {showInfoTooltips && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info size={12} />
                  <span>Click on metrics to view detailed data</span>
                </div>
              )}
            </div>
            <div className={`p-4 grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
                : cardSize === 'large'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
              {projectsMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} isMain={metric.id === 'total-projects'} size={cardSize} />
              ))}
            </div>
          </div>

          {/* Budget Section */}
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          } overflow-hidden`}>
            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-green-50 border-green-100'} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <IndianRupee size={16} className="text-white" />
                </div>
                <h3 className="font-semibold">Financial</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {budgetMetrics.filter(m => !m.isDivider).length} metrics
                </span>
              </div>
            </div>
            <div className={`p-4 grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : cardSize === 'large'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {budgetMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} isMain={metric.id === 'total-budget'} size={cardSize} />
              ))}
            </div>
          </div>

          {/* Progress Section */}
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          } overflow-hidden`}>
            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-purple-50 border-purple-100'} border-b`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Activity size={16} className="text-white" />
                </div>
                <h3 className="font-semibold">Progress</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {progressMetrics.length} metrics
                </span>
              </div>
            </div>
            <div className={`p-4 grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : cardSize === 'large'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {progressMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} isMain={metric.id === 'progress-completed'} size={cardSize} />
              ))}
            </div>
          </div>

          {/* Health Section */}
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          } overflow-hidden`}>
            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-red-50 border-red-100'} border-b`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <h3 className="font-semibold">Health</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {healthMetrics.length} metrics
                </span>
              </div>
            </div>
            <div className={`p-4 grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : cardSize === 'large'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {healthMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} isMain={['critical', 'delayed'].includes(metric.id)} size={cardSize} />
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-sm border ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          } overflow-hidden`}>
            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-indigo-50 border-indigo-100'} border-b`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <CalendarDays size={16} className="text-white" />
                </div>
                <h3 className="font-semibold">Timeline</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {timelineMetrics.length} metrics
                </span>
              </div>
            </div>
            <div className={`p-4 grid gap-3 ${
              cardSize === 'compact' 
                ? 'grid-cols-3' 
                : cardSize === 'large'
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {timelineMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} isMain={true} size={cardSize} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Show single section
        <div className={`grid gap-4 ${
          cardSize === 'compact' 
            ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
            : cardSize === 'large'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : selectedMetricGroup === 'timeline'
            ? 'grid-cols-1 md:grid-cols-3'
            : selectedMetricGroup === 'budget'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}>
          {metricGroups[selectedMetricGroup].map((metric) => (
            <MetricCard 
              key={metric.id} 
              metric={metric} 
              isMain={
                ['total-projects', 'total-budget', 'critical', 'completed', 'delayed', 'progress-completed'].includes(metric.id)
              } 
              size={cardSize} 
            />
          ))}
        </div>
      )}

      {/* Info Banner when tooltips are enabled */}
      {showInfoTooltips && (
        <div className={`p-3 rounded-xl flex items-start gap-3 ${
          darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        } border`}>
          <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
              Understanding the Metrics
            </p>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Click on any metric card to view detailed project data. Hover over the help icon (?) on each card for explanations. 
              The table view provides sorting, filtering, and export capabilities for comprehensive data analysis.
              {showPatchData && ' CY Patch metrics (marked with blue border) show current year budget data from the patch file.'}
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats Bar */}
      <div className={`flex flex-wrap items-center justify-center gap-4 p-3 rounded-xl ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'
      } text-xs border`}>
        <div className="flex items-center gap-2">
          <Info size={14} className="text-blue-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Last Updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-red-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            System Health: {safeNumber(displayMetrics.avgHealthScore || 0, 0).toFixed(0)}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-orange-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Alerts: {(displayMetrics.critical || 0) + (displayMetrics.overdue || 0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-purple-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Risk: C:{displayMetrics.critical || 0} H:{displayMetrics.highRisk || 0} M:{displayMetrics.mediumRisk || 0} L:{displayMetrics.lowRisk || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-green-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Organizations: {displayMetrics.activeAgencies || 0} agencies, {displayMetrics.totalContractors || 0} contractors
          </span>
        </div>
        {showPatchData && !patchLoading && !patchError && patchMetrics && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-indigo-500" />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              CY Patch: ₹{((patchMetrics?.currentYearAllocation || 0)).toFixed(2)}Cr allocated
            </span>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      <DrillDownModal />
    </div>
  );
};

export default MetricsCards;