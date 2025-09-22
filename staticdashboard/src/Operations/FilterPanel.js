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
  PlayCircle, Award, Timer, Layers, Shield, Box, Home,
  Construction, Route, Building, MoreHorizontal
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

// Range Slider component - FIXED for proper percentage handling
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

// Main FilterPanel Component for Operations
const FilterPanel = ({ filters, darkMode, rawData = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    sliders: false,
    dates: false
  });

  const [showRelatedInfo, setShowRelatedInfo] = useState(false);

  // Filter presets for Operations
  const filterPresets = [
    { 
      name: 'Critical Projects', 
      icon: AlertTriangle, 
      action: () => filters.setQuickFilter('critical')
    },
    { 
      name: 'Completed Works', 
      icon: Check, 
      action: () => filters.setQuickFilter('completed')
    },
    { 
      name: 'Ongoing Works', 
      icon: Activity, 
      action: () => filters.setQuickFilter('ongoing')
    },
    { 
      name: 'Not Started', 
      icon: PlayCircle, 
      action: () => filters.setQuickFilter('notStarted')
    },
    { 
      name: 'Border Outposts', 
      icon: Shield, 
      action: () => filters.setQuickFilter('bop')
    },
    { 
      name: 'High Budget (>50 Cr)', 
      icon: DollarSign, 
      action: () => filters.setQuickFilter('highBudget')
    },
    { 
      name: 'On Track', 
      icon: Target, 
      action: () => filters.setQuickFilter('onTrack')
    },
    { 
      name: 'Severe Delays', 
      icon: AlertCircle, 
      action: () => filters.setQuickFilter('severeDelay')
    },
    { 
      name: 'Urgent Priority', 
      icon: Zap, 
      action: () => filters.setQuickFilter('urgent')
    },
    { 
      name: 'Near PDC', 
      icon: Clock, 
      action: () => filters.setQuickFilter('nearPDC')
    },
    { 
      name: 'Overdue PDC', 
      icon: CalendarX, 
      action: () => filters.setQuickFilter('overduePDC')
    }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const applyPreset = (preset) => {
    if (preset.action) {
      preset.action();
    }
  };

  // Custom labels for user-friendly display
  const workCategoryLabels = {
    'BORDER_OUTPOST': 'Border Outpost (BOP)',
    'FENCING': 'Border Fencing',
    'ROAD': 'Border Roads',
    'BRIDGE': 'Bridges',
    'INFRASTRUCTURE': 'Infrastructure',
    'OTHER': 'Other Works'
  };

  const completionStatusLabels = {
    'NOT_STARTED': 'Not Started',
    'INITIAL': 'Initial Stage (0-25%)',
    'IN_PROGRESS': 'In Progress (25-50%)',
    'ADVANCED': 'Advanced (50-75%)',
    'NEAR_COMPLETION': 'Near Completion (75-99%)',
    'COMPLETED': 'Completed (100%)'
  };

  const projectHealthLabels = {
    'ON_TRACK': 'On Track',
    'MINOR_DELAY': 'Minor Delay',
    'MODERATE_DELAY': 'Moderate Delay',
    'SEVERE_DELAY': 'Severe Delay'
  };

  const riskLevelLabels = {
    'CRITICAL': 'Critical Risk',
    'HIGH': 'High Risk',
    'MEDIUM': 'Medium Risk',
    'LOW': 'Low Risk'
  };

  const priorityLabels = {
    'URGENT': 'Urgent Priority',
    'HIGH': 'High Priority',
    'MEDIUM': 'Medium Priority',
    'LOW': 'Low Priority'
  };

  const dataRanges = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        amountMin: 0,
        amountMax: 1000,
        lengthMin: 0,
        lengthMax: 1000,
        unitsMin: 0,
        unitsMax: 500
      };
    }

    const amounts = rawData.map(d => d.sanctioned_amount_cr || 0);
    const lengths = rawData.map(d => d.length_km || 0);
    const units = rawData.map(d => d.units_aor || 0);

    return {
      amountMin: 0,
      amountMax: Math.ceil(Math.max(...amounts, 100)),
      lengthMin: 0,
      lengthMax: Math.ceil(Math.max(...lengths, 100)),
      unitsMin: 0,
      unitsMax: Math.ceil(Math.max(...units, 100))
    };
  }, [rawData]);

  const activeFilterCount = useMemo(() => {
    return filters.getFilterCounts ? filters.getFilterCounts().total : 0;
  }, [filters]);

  const isCascaded = useMemo(() => {
    if (!filters.availableOptions || !rawData || rawData.length === 0) return false;
    
    const allFrontiers = [...new Set(rawData.map(d => d.frontier))].filter(Boolean);
    const allSectors = [...new Set(rawData.map(d => d.sector_hq))].filter(Boolean);
    
    return (
      filters.availableOptions.frontiers?.length < allFrontiers.length ||
      filters.availableOptions.sectorHQs?.length < allSectors.length
    );
  }, [filters.availableOptions, rawData]);

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
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Operations Filters</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filters.filteredData?.length || 0} of {rawData?.length || 0} works
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
              Smart
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
            onClick={() => filters.resetFilters()}
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
                Options are automatically filtered based on your selections. When you select a Frontier, 
                only related Sector HQs will be shown. This helps you quickly find relevant works.
              </p>
              {filters.selectedFrontiers?.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400">
                  Currently showing options related to: {filters.selectedFrontiers.join(', ')}
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
            placeholder="Search by work name, frontier, sector, type, or remarks..."
            value={filters.searchTerm || ''}
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

      {/* Category Filters Section */}
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
          </span>
          {expandedSections.basic ? 
            <ChevronUp size={16} className="text-gray-400" /> : 
            <ChevronDown size={16} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.basic && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 relative bg-gray-50/50 dark:bg-gray-900/20">
            
            {/* Work Type */}
            <MultiSelect
              options={filters.availableOptions?.workTypes || []}
              value={filters.selectedWorkTypes || []}
              onChange={filters.setSelectedWorkTypes}
              placeholder="All Work Types"
              darkMode={darkMode}
              icon={Construction}
              enableSearch={true}
            />

            {/* Work Category */}
            <MultiSelect
              options={filters.availableOptions?.workCategories || []}
              value={filters.selectedWorkCategories || []}
              onChange={filters.setSelectedWorkCategories}
              placeholder="All Work Categories"
              darkMode={darkMode}
              icon={Box}
              customLabels={workCategoryLabels}
            />

            {/* Frontier */}
            <MultiSelect
              options={filters.availableOptions?.frontiers || []}
              value={filters.selectedFrontiers || []}
              onChange={filters.setSelectedFrontiers}
              placeholder="All Frontiers"
              darkMode={darkMode}
              icon={Globe}
              enableSearch={true}
            />

            {/* Sector HQ */}
            <MultiSelect
              options={filters.availableOptions?.sectorHQs || []}
              value={filters.selectedSectorHQs || []}
              onChange={filters.setSelectedSectorHQs}
              placeholder={filters.selectedFrontiers?.length > 0 ? "Related Sector HQs" : "All Sector HQs"}
              darkMode={darkMode}
              icon={Navigation}
              enableSearch={true}
            />

            {/* Completion Status */}
            <MultiSelect
              options={filters.availableOptions?.completionStatuses || []}
              value={filters.selectedCompletionStatuses || []}
              onChange={filters.setSelectedCompletionStatuses}
              placeholder="All Completion Statuses"
              darkMode={darkMode}
              icon={Activity}
              customLabels={completionStatusLabels}
            />

            {/* Project Health */}
            <MultiSelect
              options={filters.availableOptions?.projectHealths || []}
              value={filters.selectedProjectHealths || []}
              onChange={filters.setSelectedProjectHealths}
              placeholder="All Health Statuses"
              darkMode={darkMode}
              icon={Heart}
              customLabels={projectHealthLabels}
            />

            {/* Risk Level */}
            <MultiSelect
              options={filters.availableOptions?.riskLevels || []}
              value={filters.selectedRiskLevels || []}
              onChange={filters.setSelectedRiskLevels}
              placeholder="All Risk Levels"
              darkMode={darkMode}
              icon={AlertTriangle}
              customLabels={riskLevelLabels}
            />

            {/* Priority */}
            <MultiSelect
              options={filters.availableOptions?.priorities || []}
              value={filters.selectedPriorities || []}
              onChange={filters.setSelectedPriorities}
              placeholder="All Priorities"
              darkMode={darkMode}
              icon={Zap}
              customLabels={priorityLabels}
            />

            {/* HLEC Year */}
            <MultiSelect
              options={filters.availableOptions?.hlecYears || []}
              value={filters.selectedHLECYears || []}
              onChange={filters.setSelectedHLECYears}
              placeholder="All HLEC Years"
              darkMode={darkMode}
              icon={CalendarDays}
              enableSearch={false}
            />

            {/* Source Sheet */}
            <MultiSelect
              options={filters.availableOptions?.sourceSheets || []}
              value={filters.selectedSourceSheets || []}
              onChange={filters.setSelectedSourceSheets}
              placeholder="All Source Sheets"
              darkMode={darkMode}
              icon={FileText}
              enableSearch={true}
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
            {(filters.sdcFilter?.enabled || filters.pdcFilter?.enabled) && (
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
        
        {expandedSections.dates && (
          <div className="p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <DateRangePicker
                label="SDC (Scheduled Date of Commencement)"
                icon={CalendarCheck}
                startDate={filters.sdcFilter?.start}
                endDate={filters.sdcFilter?.end}
                onStartDateChange={(date) => {
                  filters.setSDCFilter({
                    ...filters.sdcFilter,
                    start: date
                  });
                }}
                onEndDateChange={(date) => {
                  filters.setSDCFilter({
                    ...filters.sdcFilter,
                    end: date
                  });
                }}
                enabled={filters.sdcFilter?.enabled || false}
                onToggle={(enabled) => {
                  filters.setSDCFilter({
                    ...filters.sdcFilter,
                    enabled: enabled
                  });
                }}
                darkMode={darkMode}
              />

              <DateRangePicker
                label="PDC (Probable Date of Completion)"
                icon={CalendarClock}
                startDate={filters.pdcFilter?.start}
                endDate={filters.pdcFilter?.end}
                onStartDateChange={(date) => {
                  filters.setPDCFilter({
                    ...filters.pdcFilter,
                    start: date
                  });
                }}
                onEndDateChange={(date) => {
                  filters.setPDCFilter({
                    ...filters.pdcFilter,
                    end: date
                  });
                }}
                enabled={filters.pdcFilter?.enabled || false}
                onToggle={(enabled) => {
                  filters.setPDCFilter({
                    ...filters.pdcFilter,
                    enabled: enabled
                  });
                }}
                darkMode={darkMode}
              />
            </div>
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
              
              {/* Completion Range - FIXED to 0-100 scale */}
              <RangeSlider
                min={0}
                max={100}
                step={1}
                value={filters.completionRange || [0, 100]}
                onChange={filters.setCompletionRange}
                label="Completion Percentage"
                icon={TrendingUp}
                color="blue"
                darkMode={darkMode}
                formatValue={(v) => `${v}%`}
                unit="%"
              />

              {/* Budget Range */}
              <RangeSlider
                min={dataRanges.amountMin}
                max={dataRanges.amountMax}
                step={0.1}
                value={filters.amountRangeCr || [dataRanges.amountMin, dataRanges.amountMax]}
                onChange={filters.setAmountRangeCr}
                label="Sanctioned Amount (Crores)"
                icon={DollarSign}
                color="green"
                darkMode={darkMode}
                formatValue={(v) => `₹${v.toFixed(1)}Cr`}
              />

              {/* Length Range */}
              <RangeSlider
                min={dataRanges.lengthMin}
                max={dataRanges.lengthMax}
                step={1}
                value={filters.lengthRangeKm || [dataRanges.lengthMin, dataRanges.lengthMax]}
                onChange={filters.setLengthRangeKm}
                label="Length (Km)"
                icon={Route}
                color="purple"
                darkMode={darkMode}
                formatValue={(v) => `${v} km`}
                unit=" km"
              />

              {/* Units/AOR Range */}
              <RangeSlider
                min={dataRanges.unitsMin}
                max={dataRanges.unitsMax}
                step={1}
                value={filters.unitsRange || [dataRanges.unitsMin, dataRanges.unitsMax]}
                onChange={filters.setUnitsRange}
                label="Units/AOR"
                icon={Building2}
                color="orange"
                darkMode={darkMode}
                formatValue={(v) => `${v}`}
                unit=""
              />

              {/* Efficiency Score */}
              <RangeSlider
                min={0}
                max={100}
                step={1}
                value={filters.efficiencyRange || [0, 100]}
                onChange={filters.setEfficiencyRange}
                label="Efficiency Score"
                icon={Gauge}
                color="indigo"
                darkMode={darkMode}
                formatValue={(v) => `${v}%`}
                unit="%"
              />

              {/* Days to PDC */}
              <RangeSlider
                min={-365}
                max={1825}
                step={1}
                value={filters.daysToPDCRange || [-365, 1825]}
                onChange={filters.setDaysToPDCRange}
                label="Days to PDC"
                icon={Timer}
                color="red"
                darkMode={darkMode}
                formatValue={(v) => v < 0 ? `${Math.abs(v)}d overdue` : `${v}d`}
                unit=" days"
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
            
            {filters.getFilterCounts && (() => {
              const counts = filters.getFilterCounts();
              const badges = [];
              
              if (counts.workTypes > 0) {
                badges.push(
                  <span key="workTypes" className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    {counts.workTypes} Work Type{counts.workTypes > 1 ? 's' : ''}
                  </span>
                );
              }
              
              if (counts.workCategories > 0) {
                badges.push(
                  <span key="workCategories" className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                    {counts.workCategories} Categor{counts.workCategories > 1 ? 'ies' : 'y'}
                  </span>
                );
              }
              
              if (counts.frontiers > 0) {
                badges.push(
                  <span key="frontiers" className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    {counts.frontiers} Frontier{counts.frontiers > 1 ? 's' : ''}
                  </span>
                );
              }
              
              if (counts.ranges > 0) {
                badges.push(
                  <span key="ranges" className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                    {counts.ranges} Range Filter{counts.ranges > 1 ? 's' : ''}
                  </span>
                );
              }
              
              if (counts.dates > 0) {
                badges.push(
                  <span key="dates" className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                    {counts.dates} Date Filter{counts.dates > 1 ? 's' : ''}
                  </span>
                );
              }
              
              return badges;
            })()}
          </div>
          
          <button
            onClick={() => filters.resetFilters()}
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