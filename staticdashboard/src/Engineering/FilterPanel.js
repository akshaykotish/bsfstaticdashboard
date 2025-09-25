import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Calendar, DollarSign, TrendingUp, AlertTriangle,
  Filter, X, ChevronDown, ChevronUp, Sliders, RotateCcw,
  Building2, Users, MapPin, Clock, Package, Target,
  Check, ChevronRight, Sparkles, Zap, Info, RefreshCw,
  FileText, Briefcase, Globe, Navigation, Link2, GitBranch,
  CalendarDays, CalendarClock, CalendarCheck, CalendarX,
  Activity, Heart, Gauge, PauseCircle, CreditCard, AlertCircle,
  PlayCircle, Award, Timer, Layers
} from 'lucide-react';

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

// Multi-select dropdown component with Portal and cascading support
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

  // Calculate dropdown position
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
    if (value.length === options.length) return 'All Selected';
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
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-all text-sm ${
          disabled
            ? darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed'
            : darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
              : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
        } ${isOpen && !disabled ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon size={14} className={disabled ? 'text-gray-400' : 'text-blue-500'} />}
          <span className="text-xs truncate">
            {getDisplayText()}
          </span>
          {showCounts && isFiltered && totalCount > options.length && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
            }`}>
              {options.length}/{totalCount}
            </span>
          )}
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform flex-shrink-0 ml-2 ${
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
            {/* Search */}
            {enableSearch && (
              <div className={`p-2 border-b ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              } sticky top-0 z-10`}>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-2.5 text-gray-400" />
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

            {/* Quick Actions */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
            } sticky ${enableSearch ? 'top-[46px]' : 'top-0'} z-10`}>
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
                {isFiltered && totalCount > options.length && (
                  <span className="text-orange-500 ml-1">
                    (filtered)
                  </span>
                )}
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

            {/* Options */}
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
                  {isFiltered && totalCount > 0 ? (
                    <div>
                      <p>No options available with current filters</p>
                      <p className="text-[10px] mt-1 text-orange-500">
                        Try adjusting other filters
                      </p>
                    </div>
                  ) : (
                    'No options found'
                  )}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-3 py-2 hover:${
                      darkMode ? 'bg-gray-700' : 'bg-blue-50'
                    } cursor-pointer transition-colors group`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => toggleOption(option)}
                        className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-400 cursor-pointer"
                      />
                    </div>
                    <span className={`text-xs truncate flex-1 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    } group-hover:${darkMode ? 'text-gray-100' : 'text-gray-900'}`} 
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

// Date Range Picker Component
const DateRangePicker = ({
  label,
  icon: Icon,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  enabled,
  onToggle,
  darkMode,
  placeholder = "Select date range"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayText = () => {
    if (!enabled) return placeholder;
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    } else if (startDate) {
      return `After ${new Date(startDate).toLocaleDateString()}`;
    } else if (endDate) {
      return `Before ${new Date(endDate).toLocaleDateString()}`;
    }
    return 'All dates';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {Icon && <Icon size={14} className="text-purple-500" />}
          {label}
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="ml-2 accent-blue-500"
          />
        </label>
        {enabled && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2 py-1 text-xs rounded-lg ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {enabled && (
        <div className={`p-3 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        } ${isOpen ? '' : 'space-y-2'}`}>
          {!isOpen ? (
            <div className="text-xs font-medium text-center py-1">
              {getDisplayText()}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => {
                      onStartDateChange(e.target.value || null);
                    }}
                    min={minDate}
                    max={maxDate}
                    className={`w-full px-2 py-1 text-xs rounded border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'
                    } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => {
                      onEndDateChange(e.target.value || null);
                    }}
                    min={startDate || minDate}
                    max={maxDate}
                    className={`w-full px-2 py-1 text-xs rounded border ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'
                    } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  onStartDateChange(null);
                  onEndDateChange(null);
                }}
                className={`w-full px-2 py-1 text-xs rounded ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
              >
                Clear Dates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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
  color = 'blue',
  darkMode = false,
  formatValue,
  unit = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

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
  };

  const handleChangeEnd = () => {
    setIsDragging(false);
    onChange(localValue);
  };

  const handleInputChange = (index, value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    const updated = [...localValue];
    if (index === 0) {
      updated[0] = Math.max(min, Math.min(numValue, updated[1]));
    } else {
      updated[1] = Math.min(max, Math.max(numValue, updated[0]));
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

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500'
  };

  const colorTextClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    indigo: 'text-indigo-500',
    orange: 'text-orange-500'
  };

  const colorBgClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {Icon && <Icon size={14} className={colorTextClasses[color]} />}
          {label}
          {isModified && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              Active
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorBgClasses[color]}`}>
            {formatValue ? formatValue(localValue[0]) : `${localValue[0]}${unit}`} - {formatValue ? formatValue(localValue[1]) : `${localValue[1]}${unit}`}
          </span>
          {isModified && (
            <button
              onClick={resetRange}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Reset range"
            >
              <RotateCcw size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative pt-1">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className={`absolute h-2 ${colorClasses[color]} rounded-full transition-all ${
              isDragging ? 'opacity-100' : 'opacity-80'
            }`}
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
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleChangeEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer slider-thumb pointer-events-none"
          style={{ 
            zIndex: localValue[0] === max ? 2 : 1,
            pointerEvents: 'auto'
          }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => handleChange(1, e.target.value)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleChangeEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer slider-thumb pointer-events-none"
          style={{ 
            zIndex: 2,
            pointerEvents: 'auto'
          }}
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Min</label>
          <input
            type="number"
            min={min}
            max={localValue[1]}
            step={step}
            value={localValue[0]}
            onChange={(e) => handleInputChange(0, e.target.value)}
            className={`w-full px-2 py-1 text-xs rounded border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200'
            } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
          />
        </div>
        <span className="text-xs text-gray-500 mt-4">to</span>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Max</label>
          <input
            type="number"
            min={localValue[0]}
            max={max}
            step={step}
            value={localValue[1]}
            onChange={(e) => handleInputChange(1, e.target.value)}
            className={`w-full px-2 py-1 text-xs rounded border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200'
            } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
          />
        </div>
      </div>
    </div>
  );
};

// Main FilterPanel Component
const FilterPanel = ({ filters, darkMode, rawData = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    sliders: false,
    dates: false
  });

  const [selectedSchemes, setSelectedSchemes] = useState([]);
  const [showRelatedInfo, setShowRelatedInfo] = useState(false);
  const [showFilterDetails, setShowFilterDetails] = useState(true);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const applyPreset = (preset) => {
    // Reset all filters first
    filters.resetFilters();
    setSelectedSchemes([]);
    
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

  // Custom labels for user-friendly display
  const progressCategoryLabels = {
    'TENDER_PROGRESS': 'Tender in Progress',
    'TENDERED_NOT_AWARDED': 'Tendered (Not Awarded)',
    'AWARDED_NOT_STARTED': 'Awarded (Not Started)',
    'NOT_STARTED': 'Not Started',
    'PROGRESS_1_TO_50': '1-50% Complete',
    'PROGRESS_51_TO_71': '51-71% Complete',
    'PROGRESS_71_TO_99': '71-99% Complete',
    'COMPLETED': '100% Completed'
  };

  const healthStatusLabels = {
    'PERFECT_PACE': 'Perfect Pace',
    'SLOW_PACE': 'Slow Pace',
    'BAD_PACE': 'Bad Pace',
    'SLEEP_PACE': 'Sleep Pace',
    'PAYMENT_PENDING': 'Payment Pending',
    'NOT_APPLICABLE': 'Not Applicable'
  };

  const statusLabels = {
    'NOT_STARTED': 'Not Started',
    'INITIAL': 'Initial Stage',
    'IN_PROGRESS': 'In Progress',
    'ADVANCED': 'Advanced',
    'NEAR_COMPLETION': 'Near Completion',
    'COMPLETED': 'Completed',
    'TENDER_PROGRESS': 'Tender Progress',
    'TENDERED': 'Tendered',
    'UNKNOWN': 'Unknown'
  };

  const riskLevelLabels = {
    'CRITICAL': 'Critical Risk',
    'HIGH': 'High Risk',
    'MEDIUM': 'Medium Risk',
    'LOW': 'Low Risk'
  };

  const uniqueValues = useMemo(() => {
    return filters.availableOptions || {
      statuses: [],
      riskLevels: [],
      budgetHeads: [],
      agencies: [],
      frontierHQs: [],
      sectorHQs: [],
      contractors: [],
      locations: [],
      schemes: [],
      progressCategories: [],
      healthStatuses: []
    };
  }, [filters.availableOptions]);

  const allOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        statuses: [],
        riskLevels: [],
        budgetHeads: [],
        agencies: [],
        frontierHQs: [],
        sectorHQs: [],
        contractors: [],
        locations: [],
        schemes: [],
        progressCategories: [],
        healthStatuses: []
      };
    }

    return {
      statuses: ['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED', 'TENDER_PROGRESS', 'TENDERED', 'UNKNOWN'],
      riskLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      budgetHeads: [...new Set(rawData.map(d => d.budget_head))].filter(Boolean).sort(),
      agencies: [...new Set(rawData.map(d => d.executive_agency))].filter(Boolean).sort(),
      frontierHQs: [...new Set(rawData.map(d => d.ftr_hq))].filter(Boolean).sort(),
      sectorHQs: [...new Set(rawData.map(d => d.shq))].filter(Boolean).sort(),
      contractors: [...new Set(rawData.map(d => d.firm_name))].filter(Boolean).sort(),
      locations: [...new Set(rawData.map(d => d.work_site?.split(',')[0]))].filter(Boolean).sort(),
      schemes: [...new Set(rawData.map(d => d.scheme_name))].filter(Boolean).sort(),
      progressCategories: [
        'TENDER_PROGRESS', 'TENDERED_NOT_AWARDED', 'AWARDED_NOT_STARTED', 'NOT_STARTED',
        'PROGRESS_1_TO_50', 'PROGRESS_51_TO_71', 'PROGRESS_71_TO_99', 'COMPLETED'
      ],
      healthStatuses: [
        'PERFECT_PACE', 'SLOW_PACE', 'BAD_PACE', 'SLEEP_PACE', 'PAYMENT_PENDING', 'NOT_APPLICABLE'
      ]
    };
  }, [rawData]);

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

  useEffect(() => {
    if (filters.setSelectedSchemes) {
      filters.setSelectedSchemes(selectedSchemes);
    }
  }, [selectedSchemes, filters]);

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
    if (selectedSchemes.length > 0) count++;
    
    // Check if ranges are modified from defaults (0 to max)
    if (filters.progressRange && (filters.progressRange[0] > 0 || filters.progressRange[1] < dataRanges.progressMax)) count++;
    if (filters.amountRange && (filters.amountRange[0] > 0 || filters.amountRange[1] < dataRanges.amountMax)) count++;
    if (filters.delayRange && (filters.delayRange[0] > 0 || filters.delayRange[1] < dataRanges.delayMax)) count++;
    if (filters.efficiencyRange && (filters.efficiencyRange[0] > 0 || filters.efficiencyRange[1] < dataRanges.efficiencyMax)) count++;
    if (filters.healthRange && (filters.healthRange[0] > 0 || filters.healthRange[1] < dataRanges.healthMax)) count++;
    if (filters.expectedProgressRange && (filters.expectedProgressRange[0] > 0 || filters.expectedProgressRange[1] < dataRanges.expectedProgressMax)) count++;
    
    // Count active date filters
    if (filters.dateFilters) {
      Object.values(filters.dateFilters).forEach(filter => {
        if (filter && filter.enabled === true) count++;
      });
    }
    
    return count;
  }, [filters, dataRanges, selectedSchemes]);

  const handleResetAll = () => {
    filters.resetFilters();
    setSelectedSchemes([]);
  };

  const isCascaded = useMemo(() => {
    return (
      uniqueValues.budgetHeads?.length < allOptions.budgetHeads?.length ||
      uniqueValues.agencies?.length < allOptions.agencies?.length ||
      uniqueValues.frontierHQs?.length < allOptions.frontierHQs?.length ||
      uniqueValues.sectorHQs?.length < allOptions.sectorHQs?.length ||
      uniqueValues.contractors?.length < allOptions.contractors?.length ||
      uniqueValues.locations?.length < allOptions.locations?.length ||
      uniqueValues.schemes?.length < allOptions.schemes?.length
    );
  }, [uniqueValues, allOptions]);

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl shadow-sm border ${
      darkMode ? 'border-gray-700' : 'border-gray-100'
    } overflow-visible relative`}>
      
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      } flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
            <Filter size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Smart Filters</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filters.filteredData?.length || 0} of {rawData?.length || 0} projects
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
              {activeFilterCount} active
            </span>
          )}
          {isCascaded && (
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold flex items-center gap-1">
              <Link2 size={10} />
              Linked
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRelatedInfo(!showRelatedInfo)}
            className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            } transition-all`}
            title="Show filter relationships"
          >
            <GitBranch size={12} />
            {showRelatedInfo ? 'Hide' : 'Show'} Links
          </button>
          
          <div className="relative group">
            <button className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            } transition-all`}>
              <Sparkles size={12} />
              Quick Filters
              <ChevronDown size={12} />
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
          
          <button
            onClick={handleResetAll}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-all`}
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        </div>
      </div>

      {/* Filter Relationships Info */}
      {showRelatedInfo && isCascaded && (
        <div className={`px-4 py-3 ${
          darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        } border-b`}>
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-blue-700 dark:text-blue-400">
                Smart Filtering Active
              </p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Options are automatically filtered based on your selections. When you select a Frontier HQ, 
                only related Sector HQs and Locations will be shown. This helps you quickly find relevant projects.
              </p>
              {filters.selectedFrontierHQs?.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400">
                  Currently showing options related to: {filters.selectedFrontierHQs.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, location, agency, contractor, frontier HQ, or sector HQ..."
            value={filters.searchTerm}
            onChange={(e) => filters.setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-200 placeholder-gray-500 text-gray-900'
            } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all`}
          />
          {filters.searchTerm && (
            <button
              onClick={() => filters.setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters Section (REARRANGED) */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('basic')}
          className={`w-full px-4 py-3 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          } transition-all`}
        >
          <span className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Sliders size={14} className="text-blue-500" />
            Category Filters
            {isCascaded && (
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                Smart
              </span>
            )}
            {(filters.selectedProgressCategories?.length > 0 || filters.selectedHealthStatuses?.length > 0) && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                Active
              </span>
            )}
          </span>
          {expandedSections.basic ? 
            <ChevronUp size={16} className="text-gray-400" /> : 
            <ChevronDown size={16} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.basic && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 relative bg-gray-50/50 dark:bg-gray-900/20">
            
            {/* 1. Budget Head */}
            <MultiSelect
              options={uniqueValues.budgetHeads}
              value={filters.selectedBudgetHeads || []}
              onChange={filters.setSelectedBudgetHeads}
              placeholder="All Budget Heads"
              darkMode={darkMode}
              icon={DollarSign}
              showCounts={true}
              totalCount={allOptions.budgetHeads?.length || 0}
              isFiltered={uniqueValues.budgetHeads?.length < allOptions.budgetHeads?.length}
            />

            {/* 2. Frontier HQ */}
            <MultiSelect
              options={uniqueValues.frontierHQs}
              value={filters.selectedFrontierHQs || []}
              onChange={filters.setSelectedFrontierHQs}
              placeholder="All Frontier HQs"
              darkMode={darkMode}
              icon={Globe}
              showCounts={true}
              totalCount={allOptions.frontierHQs?.length || 0}
              isFiltered={uniqueValues.frontierHQs?.length < allOptions.frontierHQs?.length}
            />

            {/* 3. Sector HQ */}
            <MultiSelect
              options={uniqueValues.sectorHQs}
              value={filters.selectedSectorHQs || []}
              onChange={filters.setSelectedSectorHQs}
              placeholder={filters.selectedFrontierHQs?.length > 0 ? "Related Sector HQs" : "All Sector HQs"}
              darkMode={darkMode}
              icon={Navigation}
              showCounts={true}
              totalCount={allOptions.sectorHQs?.length || 0}
              isFiltered={uniqueValues.sectorHQs?.length < allOptions.sectorHQs?.length}
              disabled={false}
            />

            {/* 4. All Schemes */}
            <MultiSelect
              options={uniqueValues.schemes}
              value={selectedSchemes}
              onChange={setSelectedSchemes}
              placeholder="All Schemes"
              darkMode={darkMode}
              icon={Briefcase}
              enableSearch={true}
              showCounts={true}
              totalCount={allOptions.schemes?.length || 0}
              isFiltered={uniqueValues.schemes?.length < allOptions.schemes?.length}
            />

            {/* 5. All Agencies */}
            <MultiSelect
              options={uniqueValues.agencies}
              value={filters.selectedAgencies || []}
              onChange={filters.setSelectedAgencies}
              placeholder="All Agencies"
              darkMode={darkMode}
              icon={Building2}
              showCounts={true}
              totalCount={allOptions.agencies?.length || 0}
              isFiltered={uniqueValues.agencies?.length < allOptions.agencies?.length}
            />

            {/* 6. All Statuses */}
            <MultiSelect
              options={uniqueValues.statuses}
              value={filters.selectedStatuses || []}
              onChange={filters.setSelectedStatuses}
              placeholder="All Statuses"
              darkMode={darkMode}
              icon={Package}
              customLabels={statusLabels}
              showCounts={true}
              totalCount={allOptions.statuses?.length || 0}
              isFiltered={uniqueValues.statuses?.length < allOptions.statuses?.length}
            />

            {/* 7. Physical Progress */}
            <MultiSelect
              options={uniqueValues.progressCategories}
              value={filters.selectedProgressCategories || []}
              onChange={filters.setSelectedProgressCategories}
              placeholder="Physical Progress"
              darkMode={darkMode}
              icon={Activity}
              customLabels={progressCategoryLabels}
              showCounts={true}
              totalCount={allOptions.progressCategories?.length || 0}
              isFiltered={uniqueValues.progressCategories?.length < allOptions.progressCategories?.length}
            />

            {/* 8. All Contractors */}
            <MultiSelect
              options={uniqueValues.contractors}
              value={filters.selectedContractors || []}
              onChange={filters.setSelectedContractors}
              placeholder="All Contractors"
              darkMode={darkMode}
              icon={Users}
              showCounts={true}
              totalCount={allOptions.contractors?.length || 0}
              isFiltered={uniqueValues.contractors?.length < allOptions.contractors?.length}
            />

            {/* 9. All Locations */}
            <MultiSelect
              options={uniqueValues.locations}
              value={filters.selectedLocations || []}
              onChange={filters.setSelectedLocations}
              placeholder={
                filters.selectedFrontierHQs?.length > 0 || filters.selectedSectorHQs?.length > 0
                  ? "Related Locations" 
                  : "All Locations"
              }
              darkMode={darkMode}
              icon={MapPin}
              showCounts={true}
              totalCount={allOptions.locations?.length || 0}
              isFiltered={uniqueValues.locations?.length < allOptions.locations?.length}
            />

            {/* Additional filters that weren't in the list but exist in original code */}
            {/* Health Status (Pace) */}
            <MultiSelect
              options={uniqueValues.healthStatuses}
              value={filters.selectedHealthStatuses || []}
              onChange={filters.setSelectedHealthStatuses}
              placeholder="Project Health"
              darkMode={darkMode}
              icon={Heart}
              customLabels={healthStatusLabels}
              showCounts={true}
              totalCount={allOptions.healthStatuses?.length || 0}
              isFiltered={uniqueValues.healthStatuses?.length < allOptions.healthStatuses?.length}
            />

            {/* Risk Levels */}
            <MultiSelect
              options={uniqueValues.riskLevels}
              value={filters.selectedRiskLevels || []}
              onChange={filters.setSelectedRiskLevels}
              placeholder="All Risk Levels"
              darkMode={darkMode}
              icon={AlertTriangle}
              customLabels={riskLevelLabels}
              showCounts={true}
              totalCount={allOptions.riskLevels?.length || 0}
              isFiltered={uniqueValues.riskLevels?.length < allOptions.riskLevels?.length}
            />
          </div>
        )}
      </div>

      {/* Date Filters Section */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('dates')}
          className={`w-full px-4 py-3 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          } transition-all`}
        >
          <span className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar size={14} className="text-purple-500" />
            Date Filters
            {filters.dateFilters && Object.values(filters.dateFilters).some(f => f.enabled) && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                Active
              </span>
            )}
          </span>
          {expandedSections.dates ? 
            <ChevronUp size={16} className="text-gray-400" /> : 
            <ChevronDown size={16} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.dates && filters.dateFilters && (
          <div className="p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <DateRangePicker
                label="Tender Date"
                icon={CalendarDays}
                startDate={filters.dateFilters.tenderDate?.start}
                endDate={filters.dateFilters.tenderDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.tenderDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.tenderDate?.end
                  };
                  filters.setDateFilter('tenderDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.tenderDate?.enabled || true,
                    start: filters.dateFilters.tenderDate?.start,
                    end: date
                  };
                  filters.setDateFilter('tenderDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.tenderDate?.min}
                maxDate={filters.dateStatistics?.tenderDate?.max}
                enabled={filters.dateFilters.tenderDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.tenderDate?.start || null,
                    end: filters.dateFilters.tenderDate?.end || null
                  };
                  filters.setDateFilter('tenderDate', updatedFilter);
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="Award Date"
                icon={CalendarCheck}
                startDate={filters.dateFilters.awardDate?.start}
                endDate={filters.dateFilters.awardDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.awardDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.awardDate?.end
                  };
                  filters.setDateFilter('awardDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.awardDate?.enabled || true,
                    start: filters.dateFilters.awardDate?.start,
                    end: date
                  };
                  filters.setDateFilter('awardDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.awardDate?.min}
                maxDate={filters.dateStatistics?.awardDate?.max}
                enabled={filters.dateFilters.awardDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.awardDate?.start || null,
                    end: filters.dateFilters.awardDate?.end || null
                  };
                  filters.setDateFilter('awardDate', updatedFilter);
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="PDC Agreement"
                icon={CalendarClock}
                startDate={filters.dateFilters.pdcDate?.start}
                endDate={filters.dateFilters.pdcDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.pdcDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.pdcDate?.end
                  };
                  filters.setDateFilter('pdcDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.pdcDate?.enabled || true,
                    start: filters.dateFilters.pdcDate?.start,
                    end: date
                  };
                  filters.setDateFilter('pdcDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.pdcDate?.min}
                maxDate={filters.dateStatistics?.pdcDate?.max}
                enabled={filters.dateFilters.pdcDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.pdcDate?.start || null,
                    end: filters.dateFilters.pdcDate?.end || null
                  };
                  filters.setDateFilter('pdcDate', updatedFilter);
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="Revised PDC"
                icon={CalendarClock}
                startDate={filters.dateFilters.revisedPdcDate?.start}
                endDate={filters.dateFilters.revisedPdcDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.revisedPdcDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.revisedPdcDate?.end
                  };
                  filters.setDateFilter('revisedPdcDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.revisedPdcDate?.enabled || true,
                    start: filters.dateFilters.revisedPdcDate?.start,
                    end: date
                  };
                  filters.setDateFilter('revisedPdcDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.revisedPdcDate?.min}
                maxDate={filters.dateStatistics?.revisedPdcDate?.max}
                enabled={filters.dateFilters.revisedPdcDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.revisedPdcDate?.start || null,
                    end: filters.dateFilters.revisedPdcDate?.end || null
                  };
                  filters.setDateFilter('revisedPdcDate', updatedFilter);
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="Completion Date"
                icon={CalendarCheck}
                startDate={filters.dateFilters.completionDate?.start}
                endDate={filters.dateFilters.completionDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.completionDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.completionDate?.end
                  };
                  filters.setDateFilter('completionDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.completionDate?.enabled || true,
                    start: filters.dateFilters.completionDate?.start,
                    end: date
                  };
                  filters.setDateFilter('completionDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.completionDate?.min}
                maxDate={filters.dateStatistics?.completionDate?.max}
                enabled={filters.dateFilters.completionDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.completionDate?.start || null,
                    end: filters.dateFilters.completionDate?.end || null
                  };
                  filters.setDateFilter('completionDate', updatedFilter);
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="Acceptance Date"
                icon={CalendarDays}
                startDate={filters.dateFilters.acceptanceDate?.start}
                endDate={filters.dateFilters.acceptanceDate?.end}
                onStartDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.acceptanceDate?.enabled || true,
                    start: date,
                    end: filters.dateFilters.acceptanceDate?.end
                  };
                  filters.setDateFilter('acceptanceDate', updatedFilter);
                }}
                onEndDateChange={(date) => {
                  const updatedFilter = {
                    enabled: filters.dateFilters.acceptanceDate?.enabled || true,
                    start: filters.dateFilters.acceptanceDate?.start,
                    end: date
                  };
                  filters.setDateFilter('acceptanceDate', updatedFilter);
                }}
                minDate={filters.dateStatistics?.acceptanceDate?.min}
                maxDate={filters.dateStatistics?.acceptanceDate?.max}
                enabled={filters.dateFilters.acceptanceDate?.enabled || false}
                onToggle={(enabled) => {
                  const updatedFilter = {
                    enabled: enabled,
                    start: filters.dateFilters.acceptanceDate?.start || null,
                    end: filters.dateFilters.acceptanceDate?.end || null
                  };
                  filters.setDateFilter('acceptanceDate', updatedFilter);
                }}
                darkMode={darkMode}
              />
            </div>

            {/* Clear all dates button */}
            {Object.values(filters.dateFilters).some(f => f.enabled) && (
              <button
                onClick={() => filters.clearAllDateFilters()}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-all`}
              >
                <X size={12} />
                Clear All Date Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Range Filters Section */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('sliders')}
          className={`w-full px-4 py-3 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          } transition-all`}
        >
          <span className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <TrendingUp size={14} className="text-blue-500" />
            Range Filters
          </span>
          {expandedSections.sliders ? 
            <ChevronUp size={16} className="text-gray-400" /> : 
            <ChevronDown size={16} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.sliders && (
          <div className="p-4 space-y-5 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              <RangeSlider
                min={dataRanges.progressMin}
                max={dataRanges.progressMax}
                step={1}
                value={filters.progressRange || [0, 100]}
                onChange={filters.setProgressRange}
                label="Physical Progress Range"
                icon={TrendingUp}
                color="blue"
                darkMode={darkMode}
                formatValue={(v) => `${v}%`}
                unit="%"
              />

              <RangeSlider
                min={dataRanges.amountMin}
                max={dataRanges.amountMax}
                step={1000}
                value={filters.amountRange || [dataRanges.amountMin, dataRanges.amountMax]}
                onChange={filters.setAmountRange}
                label="Budget Range (Lakhs)"
                icon={DollarSign}
                color="green"
                darkMode={darkMode}
                formatValue={(v) => `₹${(v/100).toFixed(0)}L`}
              />

              <RangeSlider
                min={dataRanges.delayMin}
                max={dataRanges.delayMax}
                step={1}
                value={filters.delayRange || [dataRanges.delayMin, dataRanges.delayMax]}
                onChange={filters.setDelayRange}
                label="Delay Range (Days)"
                icon={Clock}
                color="red"
                darkMode={darkMode}
                formatValue={(v) => `${v}d`}
                unit=" days"
              />

              <RangeSlider
                min={dataRanges.efficiencyMin}
                max={dataRanges.efficiencyMax}
                step={1}
                value={filters.efficiencyRange || [0, 100]}
                onChange={filters.setEfficiencyRange}
                label="Efficiency Range"
                icon={Target}
                color="indigo"
                darkMode={darkMode}
                formatValue={(v) => `${v}%`}
                unit="%"
              />

              <RangeSlider
                min={dataRanges.healthMin}
                max={dataRanges.healthMax}
                step={1}
                value={filters.healthRange || [dataRanges.healthMin, dataRanges.healthMax]}
                onChange={filters.setHealthRange}
                label="Health Score Range"
                icon={Heart}
                color="purple"
                darkMode={darkMode}
                formatValue={(v) => `${v}`}
                unit=""
              />

              <RangeSlider
                min={dataRanges.expectedProgressMin}
                max={dataRanges.expectedProgressMax}
                step={1}
                value={filters.expectedProgressRange || [0, 100]}
                onChange={filters.setExpectedProgressRange}
                label="Expected Progress Range"
                icon={Timer}
                color="orange"
                darkMode={darkMode}
                formatValue={(v) => `${v}%`}
                unit="%"
              />
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className={`px-4 py-3 ${
          darkMode ? 'bg-gray-900/50' : 'bg-blue-50/50'
        } flex items-center justify-between`}>
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
            
            {/* Physical Progress Categories */}
            {filters.selectedProgressCategories?.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                {filters.selectedProgressCategories.length} Progress Stage{filters.selectedProgressCategories.length > 1 ? 's' : ''}
              </span>
            )}
            
            {/* Health Statuses */}
            {filters.selectedHealthStatuses?.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                {filters.selectedHealthStatuses.length} Health Status{filters.selectedHealthStatuses.length > 1 ? 'es' : ''}
              </span>
            )}
            
            {/* Date filter badges */}
            {filters.dateFilters && Object.entries(filters.dateFilters).map(([key, filter]) => {
              if (!filter.enabled) return null;
              const label = key.replace(/([A-Z])/g, ' $1').trim();
              return (
                <span key={key} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                  {label}
                </span>
              );
            })}
            
            {selectedSchemes.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                {selectedSchemes.length} Scheme{selectedSchemes.length > 1 ? 's' : ''}
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
            
            {filters.selectedStatuses?.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                {filters.selectedStatuses.length} Status{filters.selectedStatuses.length > 1 ? 'es' : ''}
              </span>
            )}
            
            {filters.selectedRiskLevels?.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                {filters.selectedRiskLevels.length} Risk Level{filters.selectedRiskLevels.length > 1 ? 's' : ''}
              </span>
            )}
            
            {filters.selectedAgencies?.length > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                {filters.selectedAgencies.length} Agenc{filters.selectedAgencies.length > 1 ? 'ies' : 'y'}
              </span>
            )}
            
            {filters.selectedContractors?.length > 0 && (
              <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs rounded-full">
                {filters.selectedContractors.length} Contractor{filters.selectedContractors.length > 1 ? 's' : ''}
              </span>
            )}
            
            {filters.selectedLocations?.length > 0 && (
              <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">
                {filters.selectedLocations.length} Location{filters.selectedLocations.length > 1 ? 's' : ''}
              </span>
            )}
            
            {filters.progressRange && (filters.progressRange[0] > 0 || filters.progressRange[1] < 100) && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                Progress: {filters.progressRange[0]}-{filters.progressRange[1]}%
              </span>
            )}
            
            {filters.amountRange && (filters.amountRange[0] > dataRanges.amountMin || filters.amountRange[1] < dataRanges.amountMax) && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                Budget: ₹{(filters.amountRange[0]/100).toFixed(0)}-{(filters.amountRange[1]/100).toFixed(0)}L
              </span>
            )}
            
            {filters.delayRange && (filters.delayRange[0] > 0 || filters.delayRange[1] < dataRanges.delayMax) && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                Delay: {filters.delayRange[0]}-{filters.delayRange[1]} days
              </span>
            )}
            
            {filters.efficiencyRange && (filters.efficiencyRange[0] > 0 || filters.efficiencyRange[1] < 100) && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                Efficiency: {filters.efficiencyRange[0]}-{filters.efficiencyRange[1]}%
              </span>
            )}
            
            {filters.healthRange && (filters.healthRange[0] > dataRanges.healthMin || filters.healthRange[1] < dataRanges.healthMax) && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                Health: {filters.healthRange[0]}-{filters.healthRange[1]}
              </span>
            )}
            
            {filters.expectedProgressRange && (filters.expectedProgressRange[0] > 0 || filters.expectedProgressRange[1] < 100) && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                Expected: {filters.expectedProgressRange[0]}-{filters.expectedProgressRange[1]}%
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
      )}
    </div>
  );
};

export default FilterPanel;