import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, X, ChevronDown, ChevronUp, RotateCcw,
  Building2, MapPin, TrendingUp, AlertTriangle,
  Clock, Target, Zap, Info, RefreshCw,
  Eye, Edit, Plus, Download, Filter,
  DollarSign, Calendar, CheckCircle, AlertCircle,
  Timer, Gauge, IndianRupee, Flag, Maximize2,
  PauseCircle, CreditCard, PlayCircle, TrendingDown,
  Activity, Heart, Award, Hash, Layers, Columns,
  CheckSquare, Square, List, Grid, FileText,
  Check, Sliders
} from 'lucide-react';

// Import components
import Report from './Reports';
import EditRow from '../System/EditRow';
import AddRow from '../System/AddRow';
import FitViewModal from './FitView';

// Import database configurations and data context
import { databaseConfigs, getConfig, getDatabaseNames, generateId, applyCalculations } from '../System/config';
import { useData } from './useData';

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

// Portal component for dropdown
const DropdownPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  
  return ReactDOM.createPortal(
    children,
    document.body
  );
};

// Multi-select dropdown component
const MultiSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Select...', 
  darkMode = false,
  icon: Icon,
  maxHeight = '300px',
  enableSearch = true,
  disabled = false,
  showCounts = false,
  totalCount = 0,
  isFiltered = false,
  customLabels = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target) && 
          !event.target.closest('.multiselect-dropdown-portal')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const position = {
        left: rect.left,
        width: rect.width,
        top: spaceBelow > 350 || spaceBelow > spaceAbove 
          ? rect.bottom + 4 
          : rect.top - 350 - 4
      };
      
      setDropdownPosition(position);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm || !enableSearch) return options;
    return options.filter(opt => {
      const label = customLabels[opt] || opt;
      return label.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, enableSearch, customLabels]);

  const toggleOption = (option) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length && options.length > 0) return 'All Selected';
    if (value.length === 1) {
      return customLabels[value[0]] || value[0];
    }
    return `${value.length} Selected`;
  };

  const getOptionLabel = (option) => {
    return customLabels[option] || option;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`min-w-[120px] px-2 py-1 border rounded-lg flex items-center justify-between transition-all text-xs ${
          disabled
            ? 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed'
            : darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
              : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
        } ${isOpen && !disabled ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {Icon && <Icon size={12} className={disabled ? 'text-gray-400' : 'text-blue-500'} />}
          <span className="text-xs truncate">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown 
          size={12} 
          className={`transition-transform flex-shrink-0 ml-1 ${
            disabled ? 'text-gray-400' : 'text-gray-400'
          } ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && !disabled && (
        <DropdownPortal>
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className={`multiselect-dropdown-portal fixed rounded-lg shadow-xl overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border z-[9999]`}
            style={{ 
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: '350px'
            }}
          >
            {enableSearch && options.length > 5 && (
              <div className={`p-2 border-b ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              } sticky top-0 z-10`}>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-7 pr-2 py-1.5 text-xs rounded ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                        : 'bg-white placeholder-gray-500 border border-gray-200'
                    } focus:outline-none focus:ring-1 focus:ring-blue-400`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
            } sticky ${enableSearch && options.length > 5 ? 'top-[46px]' : 'top-0'} z-10`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {value.length}/{options.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className={`text-xs font-medium ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Clear
              </button>
            </div>

            <div 
              className={`overflow-y-auto ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`} 
              style={{ maxHeight: '250px' }}
            >
              {filteredOptions.length === 0 ? (
                <div className={`px-3 py-4 text-xs text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-3 py-1.5 hover:${
                      darkMode ? 'bg-gray-700' : 'bg-blue-50'
                    } cursor-pointer transition-colors group`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center w-3.5 h-3.5">
                      <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => toggleOption(option)}
                        className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300 focus:ring-blue-400 cursor-pointer"
                      />
                    </div>
                    <span className={`text-xs truncate flex-1 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`} 
                    title={getOptionLabel(option)}>
                      {getOptionLabel(option)}
                    </span>
                    {value.includes(option) && (
                      <Check size={12} className="text-blue-500 flex-shrink-0" />
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        </DropdownPortal>
      )}
    </>
  );
};

// Range Slider component
const RangeSlider = ({ 
  min = 0, 
  max = 100, 
  step = 1, 
  value = [0, 100], 
  onChange, 
  label, 
  icon: Icon, 
  darkMode = false,
  formatValue,
  unit = ''
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (index, newValue) => {
    const numValue = Number(newValue);
    const updated = [...localValue];
    
    if (index === 0) {
      updated[0] = Math.min(numValue, updated[1]);
    } else {
      updated[1] = Math.max(numValue, updated[0]);
    }
    
    setLocalValue(updated);
    onChange(updated);
  };

  const getTrackStyle = () => {
    const start = ((localValue[0] - min) / (max - min)) * 100;
    const end = ((localValue[1] - min) / (max - min)) * 100;
    return {
      left: `${start}%`,
      width: `${end - start}%`
    };
  };

  const resetRange = () => {
    const resetValue = [min, max];
    setLocalValue(resetValue);
    onChange(resetValue);
  };

  const isModified = localValue[0] !== min || localValue[1] !== max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
          {Icon && <Icon size={12} className="text-blue-500" />}
          {label}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">
            {formatValue ? formatValue(localValue[0]) : `${localValue[0]}${unit}`} - {formatValue ? formatValue(localValue[1]) : `${localValue[1]}${unit}`}
          </span>
          {isModified && (
            <button
              onClick={resetRange}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              title="Reset"
            >
              <RotateCcw size={10} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative pt-1">
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div 
            className="absolute h-1.5 bg-blue-500 rounded-full"
            style={getTrackStyle()}
          />
        </div>
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={(e) => handleChange(0, e.target.value)}
          className="absolute w-full -top-0.5 h-3 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: localValue[0] === max ? 2 : 1 }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => handleChange(1, e.target.value)}
          className="absolute w-full -top-0.5 h-3 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: 2 }}
        />
      </div>
    </div>
  );
};

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

// Format date for display
const formatDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
};

// Enhanced time metrics calculation with proper monthly progress logic
const calculateTimeMetrics = (row, fieldMappings) => {
  // Use fieldMappings to get correct field names
  const getFieldValue = (fieldKey) => {
    const fieldName = fieldMappings[fieldKey];
    return row[fieldName];
  };

  const awardDate = parseDate(getFieldValue('awardDate'));
  const pdcDate = parseDate(getFieldValue('pdcRevised')) || parseDate(getFieldValue('pdcAgreement')) || parseDate(getFieldValue('PDC'));
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
  
  const totalMonths = Math.max(1, Math.round(totalDays / 30.44));
  const elapsedMonths = Math.max(0, Math.floor(elapsedDays / 30.44));
  
  const monthlyProgressRate = 100 / totalMonths;
  const expectedProgress = Math.min(100, elapsedMonths * monthlyProgressRate);
  const actualProgress = parseFloat(getFieldValue('physicalProgress')) || parseFloat(getFieldValue('COMPLETED_PERCENTAGE')) || 0;
  
  const previousMonthProgress = row.previous_month_progress || null;
  const progressHistory = row.progress_history || [];
  
  let isStuck = false;
  if (progressHistory.length >= 2) {
    const recentProgress = progressHistory.slice(-3);
    isStuck = recentProgress.every(p => Math.abs(p - actualProgress) < 1);
  } else if (previousMonthProgress !== null) {
    isStuck = Math.abs(actualProgress - previousMonthProgress) < 0.5;
  }
  
  const actualMonthlyRate = elapsedMonths > 0 ? actualProgress / elapsedMonths : 0;
  
  let paceStatus = 'NOT_APPLICABLE';
  let paceDetails = {};
  
  if (actualProgress >= 100) {
    const expenditurePercent = parseFloat(getFieldValue('expenditurePercent')) || 0;
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
    const progressDifference = actualProgress - expectedProgress;
    const monthsBehind = progressDifference / monthlyProgressRate;
    
    if (isStuck && elapsedMonths >= 2 && actualProgress < 95) {
      paceStatus = 'SLEEP_PACE';
      paceDetails = {
        message: `Stuck at ${actualProgress.toFixed(0)}% for ${Math.floor(elapsedDays / 30)} days`,
        severity: 'critical',
        stuckDuration: Math.floor(elapsedDays / 30),
        progressDifference
      };
    } else if (progressDifference >= -monthlyProgressRate * 0.25) {
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
      paceStatus = 'SLOW_PACE';
      paceDetails = {
        message: `Behind by ${Math.abs(monthsBehind).toFixed(1)} months`,
        severity: 'warning',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind)
      };
    } else if (progressDifference >= -monthlyProgressRate * 2) {
      paceStatus = 'BAD_PACE';
      paceDetails = {
        message: `Critical: ${Math.abs(monthsBehind).toFixed(1)} months behind`,
        severity: 'error',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind)
      };
    } else {
      paceStatus = 'SLEEP_PACE';
      paceDetails = {
        message: `Severely delayed: ${Math.abs(monthsBehind).toFixed(1)} months behind`,
        severity: 'critical',
        progressDifference,
        monthsBehind: Math.abs(monthsBehind),
        requiresIntervention: true
      };
    }
    
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
          {expected !== undefined && expected > 0 && expected < 100 && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
              style={{ left: `${expected}%` }}
              title={`Expected: ${expected.toFixed(0)}%`}
            />
          )}
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

// Function to safely store and retrieve state from localStorage
const getStoredState = (key, databaseName, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(`bsfDashboard_${databaseName}_${key}`);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const storeState = (key, databaseName, value) => {
  try {
    localStorage.setItem(`bsfDashboard_${databaseName}_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error);
  }
};

// Column Selector Modal Component
const ColumnSelectorModal = ({ isOpen, onClose, columns, visibleColumns, onToggleColumn, onResetColumns, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return columns;
    return columns.filter(col => 
      col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [columns, searchTerm]);
  
  const selectAll = () => {
    columns.forEach(col => {
      if (!visibleColumns.includes(col.name)) {
        onToggleColumn(col.name);
      }
    });
  };
  
  const deselectAll = () => {
    columns.forEach(col => {
      if (visibleColumns.includes(col.name)) {
        onToggleColumn(col.name);
      }
    });
  };
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl max-h-[90vh] ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Columns size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Manage Columns
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {visibleColumns.length} of {columns.length} columns visible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className={`px-6 py-3 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
              >
                Deselect All
              </button>
            </div>
            <button
              onClick={onResetColumns}
              className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <RotateCcw size={12} />
              Reset to Default
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredColumns.map(col => (
              <label
                key={col.name}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  darkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-50'
                } ${visibleColumns.includes(col.name) ? 'ring-2 ring-blue-500/30' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.name)}
                  onChange={() => onToggleColumn(col.name)}
                  className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {col.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {col.name}
                  </div>
                </div>
                {visibleColumns.includes(col.name) ? (
                  <CheckSquare size={16} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <Square size={16} className="text-gray-400 flex-shrink-0" />
                )}
              </label>
            ))}
          </div>
          
          {filteredColumns.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No columns found matching "{searchTerm}"
              </p>
            </div>
          )}
        </div>
        
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } flex justify-end gap-2`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Dynamic cell renderer based on column configuration
const DynamicCell = ({ column, value, row, dbConfig, fieldMappings }) => {
  const { type, name } = column;
  
  // Handle different column types
  switch (type) {
    case 'id':
      return (
        <div className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          {value || 'N/A'}
        </div>
      );
      
    case 'number':
      // Check if it's a currency field
      if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('lakh') || name.toLowerCase().includes('cr')) {
        const multiplier = name.toLowerCase().includes('cr') ? 10000000 : 100000;
        return (
          <div className="flex items-center gap-1">
            <IndianRupee size={14} className="text-green-600" />
            <span className="text-sm font-bold text-green-600">
              {formatCurrency(parseFloat(value || 0) * multiplier)}
            </span>
          </div>
        );
      }
      // Check if it's a percentage field
      if (name.toLowerCase().includes('percent') || name.toLowerCase().includes('percentage')) {
        return (
          <span className="text-sm font-semibold text-blue-600">
            {parseFloat(value || 0).toFixed(1)}%
          </span>
        );
      }
      // Regular number
      return (
        <span className="text-sm font-medium text-gray-900">
          {parseFloat(value || 0).toLocaleString()}
        </span>
      );
      
    case 'date':
      return (
        <div className="flex items-center gap-1">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600">
            {formatDate(value)}
          </span>
        </div>
      );
      
    case 'textarea':
      return (
        <div className="max-w-xs">
          <p className="text-xs text-gray-600 truncate" title={value}>
            {value || 'N/A'}
          </p>
        </div>
      );
      
    case 'text':
    default:
      return (
        <span className="text-sm text-gray-900 truncate" title={value}>
          {value || 'N/A'}
        </span>
      );
  }
};

// Create field mappings from config
const createFieldMappings = (dbConfig) => {
  const mappings = {};
  
  if (!dbConfig || !dbConfig.columns) {
    return mappings;
  }
  
  // Create a mapping of logical field names to actual column names
  dbConfig.columns.forEach(col => {
    const colName = typeof col === 'object' ? col.name : col;
    const colLabel = typeof col === 'object' ? col.label : colName;
    
    // Map based on common patterns in column names
    const nameLower = colName.toLowerCase();
    
    // Date fields
    if (nameLower.includes('award') && nameLower.includes('date')) {
      mappings.awardDate = colName;
    } else if (nameLower.includes('tender') && nameLower.includes('date')) {
      mappings.tenderDate = colName;
    } else if (nameLower.includes('pdc') && nameLower.includes('revised')) {
      mappings.pdcRevised = colName;
    } else if (nameLower.includes('pdc') && nameLower.includes('agreement')) {
      mappings.pdcAgreement = colName;
    } else if (nameLower === 'pdc') {
      mappings.PDC = colName;
    }
    
    // Progress fields
    if (nameLower.includes('physical') && nameLower.includes('progress')) {
      mappings.physicalProgress = colName;
    } else if (nameLower.includes('completed') && nameLower.includes('percentage')) {
      mappings.COMPLETED_PERCENTAGE = colName;
    }
    
    // Expenditure fields
    if (nameLower.includes('expenditure') && nameLower.includes('percent')) {
      mappings.expenditurePercent = colName;
    }
  });
  
  return mappings;
};

// Main DataTable Component
const DataTable = ({ 
  data: initialData, 
  darkMode, 
  onRowClick, 
  compareMode, 
  selectedProjects,
  maxHeight = '100%',
  maxWidth = '100%',
  isEmbedded = false,
  onRefreshData,
  databaseName = 'engineering',
  heading,
  subHeading,
  onClose
}) => {

  // Get database configuration
  const dbConfig = useMemo(() => getConfig(databaseName), [databaseName]);
  const idField = useMemo(() => dbConfig?.idField || 'id', [dbConfig]);
  
  // Create field mappings from config
  const fieldMappings = useMemo(() => createFieldMappings(dbConfig), [dbConfig]);

  // Set dynamic heading if not provided
  const tableHeading = heading || dbConfig?.displayName || 'Data Table';
  const tableSubHeading = subHeading || dbConfig?.description || '';

  // Get database data with useData hook
  const {
    rawData: hookData,
    loading: hookLoading,
    error: hookError,
    refetch: hookRefetch,
    updateRecord: hookUpdateRecord,
    addRecord: hookAddRecord,
    deleteRecords: hookDeleteRecords
  } = useData(databaseName);

  // Use combined data approach
  const [localData, setLocalData] = useState(initialData || []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setLocalData(initialData);
    } else if (hookData && hookData.length > 0) {
      setLocalData(hookData);
    }
  }, [initialData, hookData]);

  // Build dynamic column definitions from config
  const allColumnsFromConfig = useMemo(() => {
    const columns = [];
    
    // Add ID column
    columns.push({
      name: 'row_number',
      label: 'S.No',
      type: 'system',
      alwaysVisible: true
    });
    
    // Add columns from database config
    if (dbConfig?.columns) {
      dbConfig.columns.forEach(col => {
        columns.push({
          name: col.name,
          label: col.label || col.name,
          type: col.type || 'text',
          group: col.group,
          calculated: col.calculated || false,
          required: col.required || false
        });
      });
    }
    
    // Add derived columns if certain fields exist
    const hasProgressField = dbConfig?.columns?.some(c => 
      c.name.toLowerCase().includes('progress') || 
      c.name.toLowerCase().includes('percent')
    );
    
    const hasDateFields = dbConfig?.columns?.some(c => c.type === 'date');
    
    if (hasProgressField && hasDateFields) {
      columns.push({
        name: 'paceStatus',
        label: 'Pace Analysis',
        type: 'derived',
        derivedType: 'pace'
      });
      
      columns.push({
        name: 'timeStatus',
        label: 'Time Status',
        type: 'derived',
        derivedType: 'time'
      });
    }
    
    // Add actions column
    columns.push({
      name: 'actions',
      label: 'Actions',
      type: 'system',
      alwaysVisible: true
    });
    
    return columns;
  }, [dbConfig]);

  // Define default visible columns based on config
  const defaultVisibleColumns = useMemo(() => {
    const defaults = ['row_number'];
    
    // Add ID field
    if (idField) {
      defaults.push(idField);
    }
    
    // Add comparison columns if defined in config
    if (dbConfig?.comparisonColumns && dbConfig.comparisonColumns.length > 0) {
      defaults.push(...dbConfig.comparisonColumns);
    } else {
      // Fallback: add first 5 non-ID columns
      const nonIdColumns = allColumnsFromConfig
        .filter(col => col.type !== 'system' && col.type !== 'derived' && col.name !== idField)
        .slice(0, 5)
        .map(col => col.name);
      defaults.push(...nonIdColumns);
    }
    
    // Add derived columns if they exist
    if (allColumnsFromConfig.some(col => col.name === 'paceStatus')) {
      defaults.push('paceStatus');
    }
    if (allColumnsFromConfig.some(col => col.name === 'timeStatus')) {
      defaults.push('timeStatus');
    }
    
    // Always show actions
    defaults.push('actions');
    
    return defaults;
  }, [dbConfig, allColumnsFromConfig, idField]);

  // Initialize state from localStorage
  const [sortConfig, setSortConfig] = useState(() => 
    getStoredState('sortConfig', databaseName, { key: null, direction: 'asc' })
  );
  const [currentPage, setCurrentPage] = useState(() => 
    getStoredState('currentPage', databaseName, 1)
  );
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    getStoredState('itemsPerPage', databaseName, 25)
  );
  const [searchTerm, setSearchTerm] = useState(() => 
    getStoredState('searchTerm', databaseName, '')
  );
  const [showFilters, setShowFilters] = useState(() => 
    getStoredState('showFilters', databaseName, false)
  );
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(() => 
    getStoredState('showAdvancedMetrics', databaseName, false)
  );
  
  // Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fitViewModalOpen, setFitViewModalOpen] = useState(false);
  const [selectedRowForFitView, setSelectedRowForFitView] = useState(null);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState(() => 
    getStoredState('filters', databaseName, {
      columnFilters: {},
      rangeFilters: {},
      dateFilters: {}
    })
  );

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => 
    getStoredState('visibleColumns', databaseName, defaultVisibleColumns)
  );

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnName) => {
    setVisibleColumns(prev => {
      const isVisible = prev.includes(columnName);
      const updated = isVisible 
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName];
      storeState('visibleColumns', databaseName, updated);
      return updated;
    });
  }, [databaseName]);

  // Reset columns to default
  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultVisibleColumns);
    storeState('visibleColumns', databaseName, defaultVisibleColumns);
  }, [databaseName, defaultVisibleColumns]);

  // Store state in localStorage
  useEffect(() => {
    storeState('sortConfig', databaseName, sortConfig);
  }, [sortConfig, databaseName]);

  useEffect(() => {
    storeState('currentPage', databaseName, currentPage);
  }, [currentPage, databaseName]);

  useEffect(() => {
    storeState('itemsPerPage', databaseName, itemsPerPage);
  }, [itemsPerPage, databaseName]);

  useEffect(() => {
    storeState('searchTerm', databaseName, searchTerm);
  }, [searchTerm, databaseName]);

  useEffect(() => {
    storeState('showFilters', databaseName, showFilters);
  }, [showFilters, databaseName]);

  useEffect(() => {
    storeState('showAdvancedMetrics', databaseName, showAdvancedMetrics);
  }, [showAdvancedMetrics, databaseName]);

  useEffect(() => {
    storeState('filters', databaseName, filters);
  }, [filters, databaseName]);

  // Get unique filter options for text columns
  const filterOptions = useMemo(() => {
    const options = {};
    
    if (dbConfig?.columns) {
      dbConfig.columns.forEach(col => {
        if (col.type === 'text' || col.type === 'textarea') {
          const values = [...new Set(localData.map(d => d[col.name]).filter(Boolean))];
          options[col.name] = values.sort();
        }
      });
    }
    
    return options;
  }, [localData, dbConfig]);

  // Get range bounds for number columns
  const rangeBounds = useMemo(() => {
    const bounds = {};
    
    if (dbConfig?.columns) {
      dbConfig.columns.forEach(col => {
        if (col.type === 'number') {
          const values = localData.map(d => parseFloat(d[col.name]) || 0).filter(v => !isNaN(v));
          if (values.length > 0) {
            bounds[col.name] = {
              min: Math.min(...values),
              max: Math.max(...values)
            };
          }
        }
      });
    }
    
    return bounds;
  }, [localData, dbConfig]);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!localData || !Array.isArray(localData)) return [];
    
    let processed = localData.map(item => {
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
    
    // Apply column filters (multi-select)
    if (filters.columnFilters) {
      Object.entries(filters.columnFilters).forEach(([field, values]) => {
        if (values && values.length > 0) {
          processed = processed.filter(item => values.includes(item[field]));
        }
      });
    }
    
    // Apply range filters
    if (filters.rangeFilters) {
      Object.entries(filters.rangeFilters).forEach(([field, range]) => {
        if (range && range.length === 2) {
          processed = processed.filter(item => {
            const value = parseFloat(item[field]) || 0;
            return value >= range[0] && value <= range[1];
          });
        }
      });
    }
    
    // Apply date filters
    if (filters.dateFilters) {
      Object.entries(filters.dateFilters).forEach(([field, dateFilter]) => {
        if (dateFilter && dateFilter.enabled) {
          processed = processed.filter(item => {
            const date = parseDate(item[field]);
            if (!date) return !dateFilter.requireValue;
            
            if (dateFilter.start && date < new Date(dateFilter.start)) return false;
            if (dateFilter.end && date > new Date(dateFilter.end)) return false;
            
            return true;
          });
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      processed.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
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
  }, [localData, searchTerm, sortConfig, dbConfig, databaseName, filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.columnFilters) {
      count += Object.values(filters.columnFilters).filter(v => v && v.length > 0).length;
    }
    if (filters.rangeFilters) {
      Object.entries(filters.rangeFilters).forEach(([field, range]) => {
        const bounds = rangeBounds[field];
        if (bounds && range && (range[0] !== bounds.min || range[1] !== bounds.max)) {
          count++;
        }
      });
    }
    if (filters.dateFilters) {
      count += Object.values(filters.dateFilters).filter(v => v?.enabled).length;
    }
    return count;
  }, [searchTerm, filters, rangeBounds]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleRefreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      if (onRefreshData && typeof onRefreshData === 'function') {
        await onRefreshData();
      }
      if (hookRefetch && typeof hookRefetch === 'function') {
        await hookRefetch();
      }
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setIsRefreshing(false);
    }
  }, [onRefreshData, hookRefetch]);

  const handleDataUpdate = useCallback((updatedData) => {
    setLocalData(prevData => {
      return prevData.map(item => 
        item[idField] === updatedData[idField] ? { ...item, ...updatedData } : item
      );
    });
    
    setEditModalOpen(false);
    setSelectedProjectForEdit(null);
    setSelectedRowId(null);
    
    if (selectedProjectForReport && selectedProjectForReport[idField] === updatedData[idField]) {
      setSelectedProjectForReport({ ...selectedProjectForReport, ...updatedData });
    }
    
    if (hookUpdateRecord && typeof hookUpdateRecord === 'function') {
      const recordIndex = localData.findIndex(item => item[idField] === updatedData[idField]);
      if (recordIndex !== -1) {
        hookUpdateRecord(recordIndex, updatedData).catch(err => 
          console.error("Error syncing update with API:", err)
        );
      }
    }
  }, [idField, localData, selectedProjectForReport, hookUpdateRecord]);

  const handleDeleteSuccess = useCallback((deletedId) => {
    setLocalData(prevData => {
      return prevData.filter(item => item[idField] !== deletedId);
    });
    
    setEditModalOpen(false);
    
    if (selectedProjectForReport && selectedProjectForReport[idField] === deletedId) {
      setReportModalOpen(false);
      setSelectedProjectForReport(null);
    }
    
    if (hookDeleteRecords && typeof hookDeleteRecords === 'function') {
      const recordIndex = localData.findIndex(item => item[idField] === deletedId);
      if (recordIndex !== -1) {
        hookDeleteRecords([recordIndex]).catch(err => 
          console.error("Error syncing deletion with API:", err)
        );
      }
    }
  }, [idField, localData, selectedProjectForReport, hookDeleteRecords]);

  const handleAddSuccess = useCallback((newRecord) => {
    setLocalData(prevData => {
      return [...prevData, newRecord];
    });
    
    setAddModalOpen(false);
    setCurrentPage(1);
    
    if (hookAddRecord && typeof hookAddRecord === 'function') {
      hookAddRecord(newRecord).catch(err => 
        console.error("Error syncing new record with API:", err)
      );
    }
  }, [hookAddRecord]);

  const openReportModal = useCallback((row) => {
    setSelectedProjectForReport(row);
    setReportModalOpen(true);
  }, []);

  const openEditModal = useCallback((row, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedProjectForEdit(row);
    setSelectedRowId(row[idField]);
    setEditModalOpen(true);
  }, [idField]);

  const openAddModal = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const openFitViewModal = useCallback((row) => {
    setSelectedRowForFitView(row);
    setFitViewModalOpen(true);
  }, []);

  const exportTableData = useCallback(() => {
    const headers = visibleColumns
      .map(colName => allColumnsFromConfig.find(c => c.name === colName))
      .filter(Boolean)
      .map(col => col.label);
    
    const rows = processedData.map(row => 
      visibleColumns.map(colName => {
        const value = row[colName];
        return value !== undefined && value !== null ? value : '';
      })
    );
    
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${databaseName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedData, databaseName, visibleColumns, allColumnsFromConfig]);

  const resetFilters = useCallback(() => {
    setFilters({
      columnFilters: {},
      rangeFilters: {},
      dateFilters: {}
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleClose = useCallback(() => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  const handleRowClick = useCallback((row, event) => {
    if (event && event.target.closest('button')) {
      return;
    }
    openReportModal(row);
  }, [openReportModal]);

  // Column filter handlers
  const handleColumnFilterChange = useCallback((columnName, values) => {
    setFilters(prev => ({
      ...prev,
      columnFilters: {
        ...prev.columnFilters,
        [columnName]: values
      }
    }));
    setCurrentPage(1);
  }, []);

  // Range filter handlers
  const handleRangeFilterChange = useCallback((columnName, range) => {
    setFilters(prev => ({
      ...prev,
      rangeFilters: {
        ...prev.rangeFilters,
        [columnName]: range
      }
    }));
    setCurrentPage(1);
  }, []);

  // Get icon for column
  const getColumnIcon = useCallback((column) => {
    const iconMap = {
      text: FileText,
      number: Hash,
      date: Calendar,
      textarea: FileText
    };
    
    // Check for specific field patterns
    const nameLower = column.name.toLowerCase();
    if (nameLower.includes('amount') || nameLower.includes('budget')) return DollarSign;
    if (nameLower.includes('location')) return MapPin;
    if (nameLower.includes('date')) return Calendar;
    if (nameLower.includes('progress')) return TrendingUp;
    if (nameLower.includes('status')) return Activity;
    
    return iconMap[column.type] || FileText;
  }, []);

  // Show loading state
  if ((hookLoading && !localData.length) || (isRefreshing && !localData.length)) {
    return (
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col h-full`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <RefreshCw size={32} className="text-blue-500 animate-spin" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Fetching the latest records...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hookError) {
    return (
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col h-full`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Error Loading Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{hookError.toString()}</p>
            <button
              onClick={handleRefreshData}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!localData || localData.length === 0) {
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
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-800">{tableHeading}</h2>
              {tableSubHeading && (
                <p className="text-xs text-gray-500 mt-0.5">{tableSubHeading}</p>
              )}
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-md mx-4">
              <Search size={16} className="absolute left-2.5 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-300 bg-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setColumnSelectorOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                title="Manage Columns"
              >
                <Columns size={14} />
                Columns
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                  {visibleColumns.length}
                </span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Filter size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                onClick={openAddModal}
                className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 text-xs font-medium shadow-sm"
              >
                <Plus size={14} />
                Add
              </button>

              <button
                onClick={exportTableData}
                className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:opacity-90 flex items-center gap-1.5 text-xs font-medium shadow-sm"
              >
                <Download size={14} />
                Export
              </button>

              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className={`p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${isRefreshing ? 'opacity-50' : ''}`}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>

              {onClose && (
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Filters Section */}
          {showFilters && (
            <div className="mt-3 space-y-3">
              {/* Text Column Filters with Multi-select */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-gray-700">Category Filters</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {Object.entries(filterOptions).map(([field, options]) => {
                    const column = allColumnsFromConfig.find(c => c.name === field);
                    if (!column) return null;
                    
                    return (
                      <MultiSelect
                        key={field}
                        options={options}
                        value={filters.columnFilters?.[field] || []}
                        onChange={(values) => handleColumnFilterChange(field, values)}
                        placeholder={`All ${column.label}`}
                        darkMode={darkMode}
                        icon={getColumnIcon(column)}
                        enableSearch={options.length > 5}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {activeFilterCount > 0 && (
                    <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
                  )}
                </div>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                {allColumnsFromConfig
                  .filter(col => visibleColumns.includes(col.name))
                  .map(col => (
                    <th 
                      key={col.name}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 ${
                        col.type !== 'system' ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => col.type !== 'system' && handleSort(col.name)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        {sortConfig.key === col.name && (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((row, index) => {
                const metrics = calculateTimeMetrics(row, fieldMappings);
                
                return (
                  <tr
                    key={row[idField] || index}
                    className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={(e) => handleRowClick(row, e)}
                  >
                    {allColumnsFromConfig
                      .filter(col => visibleColumns.includes(col.name))
                      .map(col => (
                        <td key={col.name} className="px-4 py-3">
                          {col.name === 'row_number' ? (
                            <span className="text-sm font-medium text-gray-900">
                              {((currentPage - 1) * itemsPerPage) + index + 1}
                            </span>
                          ) : col.name === 'paceStatus' ? (
                            <div className="space-y-1">
                              {(() => {
                                const paceConfig = getPaceConfig(metrics?.paceStatus || 'NOT_STARTED');
                                const PaceIcon = paceConfig.icon;
                                return (
                                  <>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${paceConfig.bgClass} ${paceConfig.textClass} ${paceConfig.pulse ? 'sleep-pace-pulse' : ''}`}>
                                      <PaceIcon size={12} />
                                      {paceConfig.label}
                                    </div>
                                    {metrics?.paceDetails && (
                                      <div className="text-[10px] text-gray-500">
                                        {metrics.paceDetails.message}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : col.name === 'timeStatus' ? (
                            <div className="flex flex-col">
                              {metrics?.isOverdue ? (
                                <div className="flex items-center gap-1 text-red-600">
                                  <Timer size={12} />
                                  <span className="text-xs font-semibold">
                                    Overdue: {Math.abs(metrics.remainingDays)}d
                                  </span>
                                </div>
                              ) : metrics?.remainingDays !== undefined ? (
                                <div className="flex items-center gap-1 text-gray-700">
                                  <Clock size={12} className={metrics.remainingDays < 30 ? 'text-orange-500' : 'text-green-500'} />
                                  <span className="text-xs font-medium">
                                    {metrics.remainingDays}d remaining
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">No timeline</span>
                              )}
                            </div>
                          ) : col.name === 'actions' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReportModal(row);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-all group"
                                title="View Details"
                              >
                                <Eye size={14} className="text-gray-700 group-hover:text-blue-500" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(row, e);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-all group"
                                title="Edit"
                              >
                                <Edit size={14} className="text-gray-700 group-hover:text-green-500" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFitViewModal(row);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-all group"
                                title="Analytics View"
                              >
                                <Maximize2 size={14} className="text-gray-700 group-hover:text-purple-500" />
                              </button>
                            </div>
                          ) : col.type === 'derived' && col.derivedType === 'progress' ? (
                            (() => {
                              // Find the progress field dynamically from config
                              const progressField = dbConfig?.columns?.find(c => {
                                const name = c.name.toLowerCase();
                                return name.includes('physical') && name.includes('progress') ||
                                       name.includes('completed') && name.includes('percentage');
                              });
                              const progress = progressField ? parseFloat(row[progressField.name]) || 0 : 0;
                              return (
                                <ProgressBar 
                                  progress={progress}
                                  expected={metrics?.expectedProgress}
                                  paceStatus={metrics?.paceStatus}
                                />
                              );
                            })()
                          ) : (
                            <DynamicCell 
                              column={col} 
                              value={row[col.name]} 
                              row={row}
                              dbConfig={dbConfig}
                              fieldMappings={fieldMappings}
                            />
                          )}
                        </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                First
              </button>
              
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
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
                      className={`px-2.5 py-1 text-xs rounded font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
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
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedProjectForReport(null);
        }}
        projectData={selectedProjectForReport}
        darkMode={darkMode}
      />

      <EditRow
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProjectForEdit(null);
          setSelectedRowId(null);
        }}
        darkMode={darkMode}
        databaseName={databaseName}
        idField={idField}
        rowId={selectedRowId}
        rowData={selectedProjectForEdit}
        onSuccess={handleDataUpdate}
        onDelete={handleDeleteSuccess}
      />

      <AddRow
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
        }}
        darkMode={darkMode}
        databaseName={databaseName}
        idField={idField}
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

      <ColumnSelectorModal
        isOpen={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        columns={allColumnsFromConfig.filter(c => c.type !== 'system' || c.name === idField)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onResetColumns={resetColumns}
        darkMode={darkMode}
      />
    </>
  );
};

export default DataTable;