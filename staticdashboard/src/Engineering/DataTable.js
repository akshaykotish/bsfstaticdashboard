import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, X, ChevronDown, ChevronUp, RotateCcw,
  Building2, MapPin, TrendingUp, AlertTriangle,
  Clock, Target, Zap, Info, RefreshCw,
  Eye, Edit, Plus, Download, Filter,
  DollarSign, Calendar, CheckCircle, AlertCircle,
  Timer, Gauge, IndianRupee, Flag, Maximize2,
  PauseCircle, CreditCard, PlayCircle, TrendingDown,
  Activity, Heart, Award, Hash, Layers
} from 'lucide-react';

// Import components
import Report from './Reports';
import EditRow from '../System/EditRow';
import AddRow from '../System/AddRow';
import FitViewModal from './FitView';

// Import database configurations
import { databaseConfigs, getConfig, getDatabaseNames, generateId, applyCalculations } from '../System/config.js';

// Inject enhanced progress animation styles
const animatedStripesStyle = `
  @keyframes progress-stripes {
    0% { background-position: 0 0; }
    100% { background-position: 40px 0; }
  }
  
  .progress-animated {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 40px 40px;
    animation: progress-stripes 1s linear infinite;
  }
  
  .pace-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .progress-variance {
    font-size: 0.5rem;
    opacity: 0.8;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .sleep-pace-pulse {
    animation: pulse 2s infinite;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('datatable-progress-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'datatable-progress-styles';
  styleSheet.textContent = animatedStripesStyle;
  document.head.appendChild(styleSheet);
}

// Helper functions
const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${(amount / 1000).toFixed(1)}K`;
};

const getProgressStatus = (progress) => {
  if (progress >= 100) return 'Completed';
  if (progress >= 75) return '75-99%';
  if (progress >= 50) return '50-74%';  
  if (progress >= 25) return '25-49%';
  if (progress > 0) return '1-24%';
  return 'Not Started';
};

// Parse dates safely
const parseDate = (dateStr) => {
  if (!dateStr || dateStr === '' || dateStr === 'N/A') return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// Enhanced time metrics calculation with proper monthly progress logic
const calculateTimeMetrics = (row) => {
  const awardDate = parseDate(row.award_date);
  const pdcDate = parseDate(row.pdc_revised) || parseDate(row.pdc_agreement);
  const today = new Date();
  
  if (!awardDate) {
    return {
      paceStatus: 'NOT_STARTED',
      paceDetails: { message: 'Not yet awarded', severity: 'info' }
    };
  }
  
  if (!pdcDate) {
    return {
      paceStatus: 'NO_TIMELINE',
      paceDetails: { message: 'No PDC set', severity: 'warning' }
    };
  }
  
  const totalDays = Math.floor((pdcDate - awardDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor((today - awardDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.floor((pdcDate - today) / (1000 * 60 * 60 * 24));
  
  // Calculate months for pace determination
  const totalMonths = Math.max(1, Math.round(totalDays / 30.44));
  const elapsedMonths = Math.max(0, Math.floor(elapsedDays / 30.44));
  
  // Monthly expected progress rate (e.g., for 12 months = 8.33% per month)
  const monthlyProgressRate = 100 / totalMonths;
  
  // Expected progress based on elapsed time
  const expectedProgress = Math.min(100, elapsedMonths * monthlyProgressRate);
  const actualProgress = parseFloat(row.physical_progress_percent) || 0;
  
  // Track progress history for stuck detection (would need actual historical data)
  const previousMonthProgress = row.previous_month_progress || null;
  const progressHistory = row.progress_history || [];
  
  // Check if progress is stuck (same as previous period)
  let isStuck = false;
  if (progressHistory.length >= 2) {
    const recentProgress = progressHistory.slice(-3);
    isStuck = recentProgress.every(p => Math.abs(p - actualProgress) < 1);
  } else if (previousMonthProgress !== null) {
    isStuck = Math.abs(actualProgress - previousMonthProgress) < 0.5;
  }
  
  // Calculate monthly progress achieved
  const actualMonthlyRate = elapsedMonths > 0 ? actualProgress / elapsedMonths : 0;
  
  // Determine pace status with enhanced logic
  let paceStatus = 'NOT_APPLICABLE';
  let paceDetails = {};
  
  // Check for payment pending (completed but not fully paid)
  if (actualProgress >= 100) {
    const expenditurePercent = parseFloat(row.expenditure_percent) || 0;
    if (expenditurePercent < 100) {
      paceStatus = 'PAYMENT_PENDING';
      paceDetails = {
        message: `Payment at ${expenditurePercent.toFixed(0)}%`,
        severity: 'warning',
        expenditurePercent
      };
    } else {
      paceStatus = 'COMPLETED';
      paceDetails = {
        message: 'Project completed',
        severity: 'success',
        completionDays: totalDays - remainingDays
      };
    }
  } else if (elapsedMonths === 0) {
    // Just started (within first month)
    if (actualProgress >= monthlyProgressRate * 0.5) {
      paceStatus = 'PERFECT_PACE';
      paceDetails = {
        message: 'Strong start',
        severity: 'success'
      };
    } else {
      paceStatus = 'SLOW_START';
      paceDetails = {
        message: 'Recently started',
        severity: 'info'
      };
    }
  } else {
    // Calculate progress variance
    const progressDifference = actualProgress - expectedProgress;
    const monthsBehind = progressDifference / monthlyProgressRate;
    
    // Check for stuck/sleep pace
    if (isStuck && elapsedMonths >= 2 && actualProgress < 95) {
      paceStatus = 'SLEEP_PACE';
      paceDetails = {
        message: `Stuck at ${actualProgress.toFixed(0)}% for ${Math.floor(elapsedDays / 30)} days`,
        severity: 'critical',
        stuckDuration: Math.floor(elapsedDays / 30),
        progressDifference
      };
    } else if (progressDifference >= -monthlyProgressRate * 0.25) {
      // Within quarter month tolerance - Perfect Pace
      paceStatus = 'PERFECT_PACE';
      paceDetails = {
        message: progressDifference >= 0 ? 
          `Ahead by ${Math.abs(monthsBehind).toFixed(1)} months` : 
          'On track',
        severity: 'success',
        progressDifference,
        monthsAhead: Math.max(0, monthsBehind)
      };
    } else if (progressDifference >= -monthlyProgressRate * 1) {
      // Within one month delay - Slow Pace
      paceStatus = 'SLOW_PACE';
      paceDetails = {
        message: `Behind by ${Math.abs(monthsBehind).toFixed(1)} months`,
        severity: 'warning',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind)
      };
    } else if (progressDifference >= -monthlyProgressRate * 2) {
      // Within two months delay - Bad Pace
      paceStatus = 'BAD_PACE';
      paceDetails = {
        message: `Critical: ${Math.abs(monthsBehind).toFixed(1)} months behind`,
        severity: 'error',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind)
      };
    } else {
      // More than two months behind - Sleep Pace
      paceStatus = 'SLEEP_PACE';
      paceDetails = {
        message: `Severely delayed: ${Math.abs(monthsBehind).toFixed(1)} months behind`,
        severity: 'critical',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind),
        requiresIntervention: true
      };
    }
    
    // Add monthly rate info
    paceDetails.monthlyRate = {
      expected: monthlyProgressRate,
      actual: actualMonthlyRate,
      efficiency: (actualMonthlyRate / monthlyProgressRate * 100).toFixed(1)
    };
  }
  
  return {
    totalDays,
    elapsedDays,
    remainingDays,
    totalMonths,
    elapsedMonths,
    monthlyProgressRate,
    expectedProgress,
    actualProgress,
    progressRatio: expectedProgress > 0 ? (actualProgress / expectedProgress) : 0,
    progressDifference: actualProgress - expectedProgress,
    paceStatus,
    paceDetails,
    isOverdue: remainingDays < 0,
    isStuck,
    actualMonthlyRate,
    daysPerPercent: elapsedDays > 0 && actualProgress > 0 ? (elapsedDays / actualProgress).toFixed(1) : null
  };
};

// Get pace configuration with enhanced details
const getPaceConfig = (paceStatus) => {
  const configs = {
    'PERFECT_PACE': { 
      label: 'Perfect Pace', 
      shortLabel: 'Perfect',
      color: 'green', 
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-400',
      icon: Zap,
      priority: 1
    },
    'SLOW_PACE': { 
      label: 'Slow Pace', 
      shortLabel: 'Slow',
      color: 'yellow', 
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
      priority: 2
    },
    'BAD_PACE': { 
      label: 'Bad Pace', 
      shortLabel: 'Bad',
      color: 'orange', 
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-700 dark:text-orange-400',
      icon: AlertCircle,
      priority: 3
    },
    'SLEEP_PACE': { 
      label: 'Sleep Pace', 
      shortLabel: 'Sleep',
      color: 'red', 
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-400',
      icon: PauseCircle,
      priority: 4,
      pulse: true
    },
    'PAYMENT_PENDING': { 
      label: 'Payment Pending', 
      shortLabel: 'Payment',
      color: 'purple', 
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      textClass: 'text-purple-700 dark:text-purple-400',
      icon: CreditCard,
      priority: 2
    },
    'COMPLETED': { 
      label: 'Completed', 
      shortLabel: 'Done',
      color: 'blue', 
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-400',
      icon: CheckCircle,
      priority: 0
    },
    'NOT_STARTED': { 
      label: 'Not Started', 
      shortLabel: 'Not Started',
      color: 'gray', 
      bgClass: 'bg-gray-100 dark:bg-gray-900/30',
      textClass: 'text-gray-700 dark:text-gray-400',
      icon: PlayCircle,
      priority: 5
    },
    'NO_TIMELINE': { 
      label: 'No Timeline', 
      shortLabel: 'No PDC',
      color: 'gray', 
      bgClass: 'bg-gray-100 dark:bg-gray-900/30',
      textClass: 'text-gray-700 dark:text-gray-400',
      icon: Calendar,
      priority: 5
    },
    'SLOW_START': { 
      label: 'Slow Start', 
      shortLabel: 'Starting',
      color: 'blue', 
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-400',
      icon: Activity,
      priority: 2
    },
    'NOT_APPLICABLE': { 
      label: 'Not Applicable', 
      shortLabel: 'N/A',
      color: 'gray', 
      bgClass: 'bg-gray-100 dark:bg-gray-900/30',
      textClass: 'text-gray-700 dark:text-gray-400',
      icon: Info,
      priority: 6
    }
  };
  return configs[paceStatus] || configs.NOT_APPLICABLE;
};

// Progress bar component with enhanced visualization
const ProgressBar = ({ progress, expected, paceStatus, showAnimation = true }) => {
  const isDelayed = progress < expected - 5;
  const isAhead = progress > expected + 5;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-bold ${
          progress >= 100 ? 'text-green-600' :
          progress >= 75 ? 'text-blue-600' :
          progress >= 50 ? 'text-yellow-600' :
          progress >= 25 ? 'text-orange-600' :
          progress > 0 ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {progress.toFixed(0)}%
        </span>
        {expected !== undefined && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            Expected: {expected.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="relative">
        <div className="w-full h-[3px] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Expected progress indicator */}
          {expected !== undefined && expected > 0 && expected < 100 && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
              style={{ left: `${expected}%` }}
              title={`Expected: ${expected.toFixed(0)}%`}
            />
          )}
          {/* Actual progress bar */}
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progress >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
              isAhead ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              isDelayed ? 'bg-gradient-to-r from-red-500 to-orange-500' :
              'bg-gradient-to-r from-blue-500 to-blue-600'
            } ${showAnimation && progress > 0 && progress < 100 ? 'progress-animated' : ''}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
      {/* Progress variance indicator */}
      {expected !== undefined && Math.abs(progress - expected) > 5 && (
        <div className={`text-[10px] mt-0.5 ${
          isDelayed ? 'text-red-500' : 'text-green-500'
        }`}>
          {isDelayed ? '▼' : '▲'} {Math.abs(progress - expected).toFixed(0)}% {isDelayed ? 'behind' : 'ahead'}
        </div>
      )}
    </div>
  );
};

// Memoized Report Modal
const ReportModal = React.memo(({ isOpen, onClose, projectData, darkMode }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full max-w-[900px] max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp m-4">
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[794px]">
              <Report 
                projectData={projectData} 
                darkMode={darkMode} 
                isInModal={true} 
                onclose={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

// Main DataTable Component
const DataTable = ({ 
  data, 
  darkMode, 
  onRowClick, 
  compareMode, 
  selectedProjects,
  maxHeight = '100%',
  maxWidth = '100%',
  isEmbedded = false,
  onRefreshData,
  databaseName = 'engineering'
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  // Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fitViewModalOpen, setFitViewModalOpen] = useState(false);
  const [selectedRowForFitView, setSelectedRowForFitView] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    frontier: '',
    sector: '',
    paceStatus: '',
    progressStatus: ''
  });

  // Get database configuration
  const dbConfig = useMemo(() => getConfig(databaseName), [databaseName]);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    let processed = data.map(item => {
      if (dbConfig && dbConfig.calculations) {
        return applyCalculations(databaseName, item);
      }
      return item;
    });

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      processed = processed.filter(item =>
        Object.values(item || {}).some(value =>
          value?.toString().toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply filters
    if (filters.frontier) {
      processed = processed.filter(item => item.ftr_hq_name === filters.frontier);
    }
    
    if (filters.sector) {
      processed = processed.filter(item => item.shq_name === filters.sector);
    }
    
    if (filters.paceStatus) {
      processed = processed.filter(item => {
        const metrics = calculateTimeMetrics(item);
        return metrics?.paceStatus === filters.paceStatus;
      });
    }
    
    if (filters.progressStatus) {
      processed = processed.filter(item => {
        const progress = parseFloat(item.physical_progress_percent) || 0;
        const status = getProgressStatus(progress);
        return status === filters.progressStatus;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      processed.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Special handling for pace status
        if (sortConfig.key === 'paceStatus') {
          const aMetrics = calculateTimeMetrics(a);
          const bMetrics = calculateTimeMetrics(b);
          const aPriority = getPaceConfig(aMetrics?.paceStatus).priority;
          const bPriority = getPaceConfig(bMetrics?.paceStatus).priority;
          return sortConfig.direction === 'asc' ? aPriority - bPriority : bPriority - aPriority;
        }
        
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return processed;
  }, [data, searchTerm, sortConfig, dbConfig, databaseName, filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // Get unique values for filters
  const uniqueFrontiers = [...new Set(processedData.map(row => row.ftr_hq_name).filter(Boolean))];
  const uniqueSectors = [...new Set(processedData.map(row => row.shq_name).filter(Boolean))];
  const uniquePaceStatuses = ['PERFECT_PACE', 'SLOW_PACE', 'BAD_PACE', 'SLEEP_PACE', 'PAYMENT_PENDING', 'COMPLETED', 'NOT_STARTED'];

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    const paceDistribution = {};
    let totalExpectedProgress = 0;
    let totalActualProgress = 0;
    let criticalCount = 0;
    let onTrackCount = 0;
    
    processedData.forEach(row => {
      const metrics = calculateTimeMetrics(row);
      if (metrics) {
        paceDistribution[metrics.paceStatus] = (paceDistribution[metrics.paceStatus] || 0) + 1;
        totalExpectedProgress += metrics.expectedProgress || 0;
        totalActualProgress += metrics.actualProgress || 0;
        
        if (metrics.paceStatus === 'SLEEP_PACE' || metrics.paceStatus === 'BAD_PACE') {
          criticalCount++;
        } else if (metrics.paceStatus === 'PERFECT_PACE') {
          onTrackCount++;
        }
      }
    });
    
    return {
      paceDistribution,
      avgExpectedProgress: processedData.length > 0 ? totalExpectedProgress / processedData.length : 0,
      avgActualProgress: processedData.length > 0 ? totalActualProgress / processedData.length : 0,
      criticalCount,
      onTrackCount,
      totalProjects: processedData.length
    };
  }, [processedData]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleRefreshData = useCallback(() => {
    setCurrentPage(1);
    if (onRefreshData && typeof onRefreshData === 'function') {
      onRefreshData();
    }
  }, [onRefreshData]);

  const openReportModal = useCallback((row) => {
    setSelectedProjectForReport(row);
    setReportModalOpen(true);
  }, []);

  const openEditModal = useCallback((row, index, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedProjectForEdit(row);
    setEditRowIndex(index);
    setEditModalOpen(true);
  }, []);

  const openAddModal = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const openFitViewModal = useCallback((row) => {
    setSelectedRowForFitView(row);
    setFitViewModalOpen(true);
  }, []);

  const handleEditSaveSuccess = useCallback(() => {
    setEditModalOpen(false);
    handleRefreshData();
  }, [handleRefreshData]);

  const handleAddSuccess = useCallback(() => {
    setAddModalOpen(false);
    handleRefreshData();
  }, [handleRefreshData]);

  const exportTableData = useCallback(() => {
    const csvContent = [
      ['S.No', 'Scheme Name', 'Frontier', 'Sector', 'Project Cost', 'Total Expense', 'Progress %', 'Expected %', 'Pace Status', 'Monthly Rate', 'Time Status', 'Days Per %'],
      ...processedData.map((row, index) => {
        const metrics = calculateTimeMetrics(row);
        return [
          index + 1,
          row.sub_scheme_name || row.name_of_scheme || '',
          row.ftr_hq_name || '',
          row.shq_name || '',
          row.sd_amount_lakh || 0,
          (parseFloat(row.expenditure_previous_fy || 0) + parseFloat(row.expenditure_current_fy || 0)).toFixed(2),
          row.physical_progress_percent || 0,
          metrics?.expectedProgress?.toFixed(1) || 0,
          metrics?.paceStatus || 'N/A',
          metrics?.actualMonthlyRate?.toFixed(2) || 0,
          metrics?.isOverdue ? `Overdue by ${Math.abs(metrics.remainingDays)} days` : `${metrics?.remainingDays || 0} days remaining`,
          metrics?.daysPerPercent || 'N/A'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${databaseName}-pace-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedData, databaseName]);

  if (!data || data.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col h-full`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No records found in the database</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Add First Record
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col h-full`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Advanced Metrics Toggle */}
              <button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                } ${showAdvancedMetrics ? 'ring-2 ring-purple-500' : ''}`}
                title="Show Advanced Metrics"
              >
                <Gauge size={16} />
                Metrics
              </button>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                } ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Filter size={16} />
                Filters
                {(filters.frontier || filters.sector || filters.paceStatus || filters.progressStatus) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>

              {/* Items per page */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-blue-500`}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              {/* Action Buttons */}
              <button
                onClick={openAddModal}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add
              </button>

              <button
                onClick={exportTableData}
                className="px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={handleRefreshData}
                className={`p-2 rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          
          {/* Advanced Metrics Panel */}
          {showAdvancedMetrics && (
            <div className={`mt-4 p-3 rounded-lg ${
              darkMode ? 'bg-gray-900' : 'bg-gray-50'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">{aggregateStats.totalProjects}</div>
                  <div className="text-gray-500">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">{aggregateStats.onTrackCount}</div>
                  <div className="text-gray-500">On Track</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-red-600">{aggregateStats.criticalCount}</div>
                  <div className="text-gray-500">Critical</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-purple-600">
                    {aggregateStats.avgActualProgress.toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Avg Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-orange-600">
                    {aggregateStats.avgExpectedProgress.toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Avg Expected</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-lg ${
                    aggregateStats.avgActualProgress >= aggregateStats.avgExpectedProgress 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(aggregateStats.avgActualProgress - aggregateStats.avgExpectedProgress).toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Variance</div>
                </div>
              </div>
              
              {/* Pace Distribution */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold mb-2">Pace Distribution</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(aggregateStats.paceDistribution).map(([status, count]) => {
                    const config = getPaceConfig(status);
                    return (
                      <div 
                        key={status}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bgClass} ${config.textClass}`}
                      >
                        <config.icon size={10} />
                        <span className="font-semibold">{count}</span>
                        <span>{config.shortLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-3 rounded-lg ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  value={filters.frontier}
                  onChange={(e) => setFilters(prev => ({ ...prev, frontier: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Frontiers</option>
                  {uniqueFrontiers.map(frontier => (
                    <option key={frontier} value={frontier}>{frontier}</option>
                  ))}
                </select>
                
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Sectors</option>
                  {uniqueSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                
                <select
                  value={filters.progressStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, progressStatus: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Progress</option>
                  <option value="Completed">Completed (100%)</option>
                  <option value="75-99%">Near Completion (75-99%)</option>
                  <option value="50-74%">Advanced (50-74%)</option>
                  <option value="25-49%">In Progress (25-49%)</option>
                  <option value="1-24%">Early Stage (1-24%)</option>
                  <option value="Not Started">Not Started (0%)</option>
                </select>
                
                <select
                  value={filters.paceStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paceStatus: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300'
                  } focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Pace Status</option>
                  {uniquePaceStatuses.map(status => {
                    const config = getPaceConfig(status);
                    return (
                      <option key={status} value={status}>{config.label}</option>
                    );
                  })}
                </select>
                
                <button
                  onClick={() => setFilters({ frontier: '', sector: '', paceStatus: '', progressStatus: '' })}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  #
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('sub_scheme_name')}
                >
                  <div className="flex items-center gap-2">
                    Scheme Name
                    {sortConfig.key === 'sub_scheme_name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Location
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('sd_amount_lakh')}
                >
                  <div className="flex items-center gap-2">
                    Project Cost
                    {sortConfig.key === 'sd_amount_lakh' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Expense
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('physical_progress_percent')}
                >
                  <div className="flex items-center gap-2">
                    Progress
                    {sortConfig.key === 'physical_progress_percent' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('paceStatus')}
                >
                  <div className="flex items-center gap-2">
                    Pace Analysis
                    {sortConfig.key === 'paceStatus' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Time Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((row, index) => {
                const metrics = calculateTimeMetrics(row);
                const paceConfig = getPaceConfig(metrics?.paceStatus || 'NOT_STARTED');
                const PaceIcon = paceConfig.icon;
                
                const sanctioned = parseFloat(row.sd_amount_lakh) || 0;
                const expPrev = parseFloat(row.expenditure_previous_fy) || 0;
                const expCurr = parseFloat(row.expenditure_current_fy) || 0;
                const totalExpense = expPrev + expCurr;
                const utilization = sanctioned > 0 ? (totalExpense / sanctioned * 100) : 0;
                const progress = parseFloat(row.physical_progress_percent) || 0;
                
                return (
                  <tr
                    key={row[dbConfig?.idField] || index}
                    className={`${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    } cursor-pointer transition-colors ${
                      metrics?.paceStatus === 'SLEEP_PACE' ? 'bg-red-50/10 dark:bg-red-900/10' : ''
                    }`}
                    onClick={(e) => {
                      if (!e.target.closest('button')) {
                        openReportModal(row);
                      }
                    }}
                  >
                    {/* Serial Number */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </td>
                    
                    {/* Scheme Name */}
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {row.sub_scheme_name || row.name_of_scheme || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {row.work_description || 'No description'}
                        </p>
                      </div>
                    </td>
                    
                    {/* Location */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-1">
                          <Building2 size={12} className="text-purple-500" />
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {row.ftr_hq_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {row.shq_name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Project Cost */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} className="text-green-600" />
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(sanctioned * 100000)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Total Expense */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(totalExpense * 100000)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {utilization.toFixed(1)}% utilized
                        </div>
                      </div>
                    </td>
                    
                    {/* Enhanced Progress Display */}
                    <td className="px-4 py-3">
                      <ProgressBar 
                        progress={progress}
                        expected={metrics?.expectedProgress}
                        paceStatus={metrics?.paceStatus}
                      />
                    </td>
                    
                    {/* Enhanced Pace Analysis */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                          ${paceConfig.bgClass} ${paceConfig.textClass} ${paceConfig.pulse ? 'sleep-pace-pulse' : ''}`}
                        >
                          <PaceIcon size={12} />
                          {paceConfig.label}
                        </div>
                        
                        {metrics?.paceDetails && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {metrics.paceDetails.message}
                            {metrics.monthlyRate && metrics.elapsedMonths > 0 && (
                              <div className="mt-0.5">
                                Rate: {metrics.actualMonthlyRate?.toFixed(1)}%/mo 
                                (Need: {metrics.monthlyProgressRate?.toFixed(1)}%/mo)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Time Status with Enhanced Details */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {metrics?.isOverdue ? (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <Timer size={12} />
                            <span className="text-xs font-semibold">
                              Overdue: {Math.abs(metrics.remainingDays)}d
                            </span>
                          </div>
                        ) : metrics?.remainingDays !== undefined ? (
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Clock size={12} className={metrics.remainingDays < 30 ? 'text-orange-500' : 'text-green-500'} />
                            <span className="text-xs font-medium">
                              {metrics.remainingDays}d remaining
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No timeline</span>
                        )}
                        
                        {row.pdc_revised || row.pdc_agreement ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Flag size={10} className="text-gray-400" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              PDC: {new Date(row.pdc_revised || row.pdc_agreement).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : null}
                        
                        {metrics?.daysPerPercent && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            {metrics.daysPerPercent} days/%
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportModal(row);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all group"
                          title="View Details"
                        >
                          <Eye size={14} className="text-gray-700 dark:text-gray-300 group-hover:text-blue-500" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const actualIndex = processedData.findIndex(r => r[dbConfig?.idField] === row[dbConfig?.idField]);
                            openEditModal(row, actualIndex, e);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all group"
                          title="Edit"
                        >
                          <Edit size={14} className="text-gray-700 dark:text-gray-300 group-hover:text-green-500" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openFitViewModal(row);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all group"
                          title="Analytics View"
                        >
                          <Maximize2 size={14} className="text-gray-700 dark:text-gray-300 group-hover:text-purple-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
              {aggregateStats.criticalCount > 0 && (
                <span className="ml-2 text-red-600 font-semibold">
                  ({aggregateStats.criticalCount} critical)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-sm rounded font-medium ${
                  currentPage === 1
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                First
              </button>
              
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-sm rounded font-medium ${
                  currentPage === 1
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }).filter(Boolean)}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1.5 text-sm rounded font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                Next
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1.5 text-sm rounded font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {typeof Report !== 'undefined' && (
        <ReportModal 
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setSelectedProjectForReport(null);
          }}
          projectData={selectedProjectForReport}
          darkMode={darkMode}
        />
      )}

      <EditRow
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProjectForEdit(null);
          setEditRowIndex(null);
        }}
        darkMode={darkMode}
        databaseName={databaseName}
        idField={dbConfig?.idField}
        rowIndex={editRowIndex}
        rowData={selectedProjectForEdit}
        onSuccess={handleEditSaveSuccess}
        onDelete={handleEditSaveSuccess}
      />

      <AddRow
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
        }}
        darkMode={darkMode}
        databaseName={databaseName}
        idField={dbConfig?.idField}
        onSuccess={handleAddSuccess}
        defaultValues={{}}
      />

      <FitViewModal
        row={selectedRowForFitView}
        isOpen={fitViewModalOpen}
        onClose={() => {
          setFitViewModalOpen(false);
          setSelectedRowForFitView(null);
        }}
        darkMode={darkMode}
      />
    </>
  );
};

export default DataTable;