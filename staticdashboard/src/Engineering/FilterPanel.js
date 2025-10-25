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
  PlayCircle, Award, Timer, Layers, FileCheck, Hash
} from 'lucide-react';

// Import database configurations
let databaseConfigs;
try {
  const configModule = require('../System/config');
  databaseConfigs = configModule.databaseConfigs || configModule.default || configModule;
} catch (error) {
  console.warn('Could not load config.js, using fallback configuration');
  databaseConfigs = {};
}

// Icon mapping for column types and groups
const iconMapping = {
  // Column types
  text: FileText,
  textarea: FileText,
  number: Hash,
  date: Calendar,
  id: FileText,
  
  // Group icons (from config)
  FileText: FileText,
  MapPin: MapPin,
  DollarSign: DollarSign,
  Calendar: Calendar,
  Hash: Hash,
  Building2: Building2,
  Activity: Activity,
  Clock: Clock,
  Calculator: Hash,
  
  // Field name based icons
  budget: DollarSign,
  amount: DollarSign,
  agency: Building2,
  contractor: Users,
  location: MapPin,
  scheme: Briefcase,
  frontier: Globe,
  ftr: Globe,
  sector: Navigation,
  shq: Navigation,
  progress: TrendingUp,
  delay: Clock,
  health: Heart,
  risk: AlertTriangle,
  status: Package,
  efficiency: Target,
  date: Calendar,
  time: Clock,
  firm: Users,
  executive: Building2
};

// Get icon for a field
const getFieldIcon = (columnConfig, dbConfig) => {
  // Check group icon first
  if (columnConfig.group && dbConfig?.columnGroups?.[columnConfig.group]?.icon) {
    const iconName = dbConfig.columnGroups[columnConfig.group].icon;
    return iconMapping[iconName] || FileText;
  }
  
  // Check field name patterns
  const fieldLower = columnConfig.name.toLowerCase();
  for (const [pattern, icon] of Object.entries(iconMapping)) {
    if (fieldLower.includes(pattern)) {
      return icon;
    }
  }
  
  // Default by type
  return iconMapping[columnConfig.type] || FileText;
};

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

  // Show a filtered indicator when available options are less than total options
  const isFilteredByOthers = options.length < totalCount;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg flex items-center justify-between transition-all text-sm ${
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
          {Icon && <Icon size={16} className={disabled ? 'text-gray-400' : 'text-blue-500'} />}
          <span className="text-sm truncate">
            {getDisplayText()}
          </span>
          {isFilteredByOthers && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">
              Filtered
            </span>
          )}
        </div>
        <ChevronDown 
          size={16} 
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
            {enableSearch && (
              <div className={`p-2 border-b ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              } sticky top-0 z-10`}>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-2 py-2 text-sm rounded ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                        : 'bg-white placeholder-gray-500 border border-gray-200'
                    } focus:outline-none focus:ring-1 focus:ring-blue-400`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between px-4 py-2 border-b ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
            } sticky ${enableSearch ? 'top-[52px]' : 'top-0'} z-10`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {value.length}/{options.length}
                {isFilteredByOthers && totalCount > 0 && ` of ${totalCount}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className={`text-sm font-medium ${
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
                <div className={`px-4 py-6 text-sm text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-2.5 px-4 py-2.5 hover:${
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
                    <span className={`text-sm truncate flex-1 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`} 
                    title={getOptionLabel(option)}>
                      {getOptionLabel(option)}
                    </span>
                    {showCounts && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {value.includes(option) && (
                          <Check size={14} className="text-blue-500 flex-shrink-0" />
                        )}
                      </span>
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {Icon && <Icon size={16} className="text-blue-500" />}
          {label}
          {isModified && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              Active
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`}>
            {formatValue ? formatValue(localValue[0]) : `${localValue[0]}${unit}`} - {formatValue ? formatValue(localValue[1]) : `${localValue[1]}${unit}`}
          </span>
          {isModified && (
            <button
              onClick={resetRange}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Reset range"
            >
              <RotateCcw size={14} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative pt-1">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className={`absolute h-2 bg-blue-500 rounded-full transition-all ${
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
    </div>
  );
};

// Main FilterPanel Component
const FilterPanel = ({ filters, darkMode, rawData = [], databaseName = 'engineering' }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    sliders: false,
    dates: false
  });

  // Get database configuration
  const dbConfig = useMemo(() => {
    return databaseConfigs[databaseName] || databaseConfigs.engineering || {};
  }, [databaseName]);

  // Group columns by type
  const columnsByType = useMemo(() => {
    const grouped = {
      text: [],
      number: [],
      date: [],
      textarea: []
    };
    
    if (dbConfig.columns) {
      dbConfig.columns.forEach(col => {
        if (col.type && grouped[col.type]) {
          grouped[col.type].push(col);
        }
      });
    }
    
    return grouped;
  }, [dbConfig]);

  // Get available options for text columns from cascade filters
  const availableOptions = useMemo(() => {
    if (!filters || !filters.availableOptions) {
      // Fallback if filters not yet initialized
      const options = {};
      
      if (rawData && rawData.length > 0) {
        columnsByType.text.forEach(col => {
          const values = [...new Set(rawData.map(d => d[col.name]))].filter(Boolean);
          options[col.name] = values.sort();
        });
        
        // Add derived fields
        options.status = [...new Set(rawData.map(d => d.status))].filter(Boolean).sort();
        options.risk_level = [...new Set(rawData.map(d => d.risk_level))].filter(Boolean).sort();
        options.health_status = [...new Set(rawData.map(d => d.health_status))].filter(Boolean).sort();
        options.progress_category = [...new Set(rawData.map(d => d.progress_category))].filter(Boolean).sort();
      }
      
      return options;
    }
    
    return filters.availableOptions;
  }, [filters, rawData, columnsByType]);

  // Get all unfiltered options for each field
  const allOptions = useMemo(() => {
    const options = {};
    
    if (rawData && rawData.length > 0) {
      columnsByType.text.forEach(col => {
        const values = [...new Set(rawData.map(d => d[col.name]))].filter(Boolean);
        options[col.name] = values.sort();
      });
      
      // Add derived fields
      options.status = [...new Set(rawData.map(d => d.status))].filter(Boolean).sort();
      options.risk_level = [...new Set(rawData.map(d => d.risk_level))].filter(Boolean).sort();
      options.health_status = [...new Set(rawData.map(d => d.health_status))].filter(Boolean).sort();
      options.progress_category = [...new Set(rawData.map(d => d.progress_category))].filter(Boolean).sort();
    }
    
    return options;
  }, [rawData, columnsByType]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const activeFilterCount = useMemo(() => {
    return filters.getFilterCounts ? filters.getFilterCounts().total : 0;
  }, [filters]);

  const handleResetAll = () => {
    filters.resetFilters();
  };

  // Filter presets
  const filterPresets = [
    { 
      name: 'Critical Projects', 
      icon: AlertTriangle,
      action: () => filters.setQuickFilter('critical')
    },
    { 
      name: 'Perfect Pace', 
      icon: Zap,
      action: () => filters.setQuickFilter('perfectPace')
    },
    { 
      name: 'Sleep Pace', 
      icon: PauseCircle,
      action: () => filters.setQuickFilter('sleepPace')
    },
    { 
      name: 'Not Started', 
      icon: PlayCircle,
      action: () => filters.setQuickFilter('notStarted')
    },
    { 
      name: 'Ongoing', 
      icon: Activity,
      action: () => filters.setQuickFilter('ongoing')
    },
    { 
      name: 'Completed', 
      icon: CalendarCheck,
      action: () => filters.setQuickFilter('completed')
    },
    { 
      name: 'Delayed', 
      icon: Clock,
      action: () => filters.setQuickFilter('delayed')
    },
    { 
      name: 'High Budget', 
      icon: DollarSign,
      action: () => filters.setQuickFilter('highBudget')
    }
  ];

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl shadow-sm border ${
      darkMode ? 'border-gray-700' : 'border-gray-100'
    } overflow-visible relative`}>
      
      {/* Header */}
      <div className={`px-5 py-4 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      } flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
            <Filter size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Filters</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filters.filteredData?.length || 0} of {rawData?.length || 0} records
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            } transition-all`}>
              <Sparkles size={14} />
              Quick Filters
              <ChevronDown size={14} />
            </button>
            <div className={`absolute top-full mt-2 right-0 w-60 rounded-lg shadow-xl z-50 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all`}>
              {filterPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={preset.action}
                  className={`w-full px-4 py-3 text-left text-sm hover:${
                    darkMode ? 'bg-gray-700' : 'bg-blue-50'
                  } transition-colors flex items-center gap-2.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  <preset.icon size={14} className="text-blue-500" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleResetAll}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-all`}
          >
            <RotateCcw size={14} />
            Reset All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${dbConfig.displayName || 'records'}...`}
            value={filters.searchTerm}
            onChange={(e) => filters.setSearchTerm(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 text-sm rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-200 placeholder-gray-500 text-gray-900'
            } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all`}
          />
          {filters.searchTerm && (
            <button
              onClick={() => filters.setSearchTerm('')}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters Section */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('basic')}
          className={`w-full px-5 py-4 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          } transition-all`}
        >
          <span className="text-base font-semibold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
            <Sliders size={16} className="text-blue-500" />
            Category Filters
          </span>
          {expandedSections.basic ? 
            <ChevronUp size={18} className="text-gray-400" /> : 
            <ChevronDown size={18} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.basic && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 relative bg-gray-50/50 dark:bg-gray-900/20">
            
            {/* Text columns as multi-select dropdowns */}
            {columnsByType.text.map(col => (
              <MultiSelect
                key={col.name}
                options={availableOptions[col.name] || []}
                value={filters.columnFilters?.[col.name] || []}
                onChange={(values) => filters.setColumnFilter(col.name, values)}
                placeholder={`All ${col.label || col.name}`}
                darkMode={darkMode}
                icon={getFieldIcon(col, dbConfig)}
                enableSearch={true}
                totalCount={allOptions[col.name]?.length || 0}
                isFiltered={availableOptions[col.name]?.length < (allOptions[col.name]?.length || 0)}
              />
            ))}
            
            {/* Add derived fields */}
            {availableOptions.status?.length > 0 && (
              <MultiSelect
                options={availableOptions.status}
                value={filters.columnFilters?.status || []}
                onChange={(values) => filters.setColumnFilter('status', values)}
                placeholder="All Statuses"
                darkMode={darkMode}
                icon={Package}
                totalCount={allOptions.status?.length || 0}
                isFiltered={availableOptions.status?.length < (allOptions.status?.length || 0)}
              />
            )}
            
            {availableOptions.risk_level?.length > 0 && (
              <MultiSelect
                options={availableOptions.risk_level}
                value={filters.columnFilters?.risk_level || []}
                onChange={(values) => filters.setColumnFilter('risk_level', values)}
                placeholder="All Risk Levels"
                darkMode={darkMode}
                icon={AlertTriangle}
                totalCount={allOptions.risk_level?.length || 0}
                isFiltered={availableOptions.risk_level?.length < (allOptions.risk_level?.length || 0)}
              />
            )}
            
            {availableOptions.health_status?.length > 0 && (
              <MultiSelect
                options={availableOptions.health_status}
                value={filters.columnFilters?.health_status || []}
                onChange={(values) => filters.setColumnFilter('health_status', values)}
                placeholder="All Health Status"
                darkMode={darkMode}
                icon={Heart}
                totalCount={allOptions.health_status?.length || 0}
                isFiltered={availableOptions.health_status?.length < (allOptions.health_status?.length || 0)}
              />
            )}
            
            {availableOptions.progress_category?.length > 0 && (
              <MultiSelect
                options={availableOptions.progress_category}
                value={filters.columnFilters?.progress_category || []}
                onChange={(values) => filters.setColumnFilter('progress_category', values)}
                placeholder="Progress Categories"
                darkMode={darkMode}
                icon={Activity}
                totalCount={allOptions.progress_category?.length || 0}
                isFiltered={availableOptions.progress_category?.length < (allOptions.progress_category?.length || 0)}
              />
            )}
          </div>
        )}
      </div>

      {/* Date Filters Section */}
      {columnsByType.date.length > 0 && (
        <div className="border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toggleSection('dates')}
            className={`w-full px-5 py-4 flex justify-between items-center hover:${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            } transition-all`}
          >
            <span className="text-base font-semibold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
              <Calendar size={16} className="text-purple-500" />
              Date Filters
            </span>
            {expandedSections.dates ? 
              <ChevronUp size={18} className="text-gray-400" /> : 
              <ChevronDown size={18} className="text-gray-400" />
            }
          </button>
          
          {expandedSections.dates && filters.dateFilters && (
            <div className="p-5 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columnsByType.date.map(col => {
                  const dateFilter = filters.dateFilters[col.name] || {};
                  const dateBounds = filters.dateStatistics?.[col.name] || {};
                  const FieldIcon = getFieldIcon(col, dbConfig);
                  
                  return (
                    <div key={col.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <FieldIcon size={16} className="text-purple-500" />
                          {col.label || col.name}
                          <input
                            type="checkbox"
                            checked={dateFilter.enabled || false}
                            onChange={(e) => filters.setDateFilter(col.name, {
                              ...dateFilter,
                              enabled: e.target.checked
                            })}
                            className="ml-2 w-4 h-4 accent-blue-500"
                          />
                        </label>
                      </div>
                      
                      {dateFilter.enabled && (
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                              <input
                                type="date"
                                value={dateFilter.start || ''}
                                onChange={(e) => filters.setDateFilter(col.name, {
                                  ...dateFilter,
                                  start: e.target.value || null
                                })}
                                min={dateBounds.min}
                                max={dateBounds.max}
                                className={`w-full px-2.5 py-1.5 text-sm rounded border ${
                                  darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'
                                } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                              <input
                                type="date"
                                value={dateFilter.end || ''}
                                onChange={(e) => filters.setDateFilter(col.name, {
                                  ...dateFilter,
                                  end: e.target.value || null
                                })}
                                min={dateFilter.start || dateBounds.min}
                                max={dateBounds.max}
                                className={`w-full px-2.5 py-1.5 text-sm rounded border ${
                                  darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'
                                } focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {Object.values(filters.dateFilters).some(f => f?.enabled) && (
                <button
                  onClick={() => filters.clearAllDateFilters()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-all`}
                >
                  <X size={14} />
                  Clear All Date Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Range Filters Section */}
      {(columnsByType.number.length > 0 || Object.keys(filters.rangeFilters || {}).length > 0) && (
        <div className="border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toggleSection('sliders')}
            className={`w-full px-5 py-4 flex justify-between items-center hover:${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            } transition-all`}
          >
            <span className="text-base font-semibold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
              <TrendingUp size={16} className="text-blue-500" />
              Range Filters
            </span>
            {expandedSections.sliders ? 
              <ChevronUp size={18} className="text-gray-400" /> : 
              <ChevronDown size={18} className="text-gray-400" />
            }
          </button>
          
          {expandedSections.sliders && (
            <div className="p-5 space-y-6 bg-gray-50/50 dark:bg-gray-900/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Number columns as range sliders */}
                {columnsByType.number.map(col => {
                  const range = filters.rangeFilters?.[col.name] || { min: 0, max: 100, current: [0, 100] };
                  const FieldIcon = getFieldIcon(col, dbConfig);
                  
                  return (
                    <RangeSlider
                      key={col.name}
                      min={range.min}
                      max={range.max}
                      step={col.name.includes('percent') ? 1 : range.max > 1000 ? 100 : 1}
                      value={range.current || [range.min, range.max]}
                      onChange={(newRange) => filters.setRangeFilter(col.name, newRange)}
                      label={col.label || col.name}
                      icon={FieldIcon}
                      darkMode={darkMode}
                      formatValue={col.name.includes('lakh') ? (v) => `₹${(v/100).toFixed(0)}L` : null}
                      unit={col.name.includes('percent') ? '%' : col.name.includes('days') ? ' days' : ''}
                    />
                  );
                })}
                
                {/* Add derived range filters */}
                {filters.rangeFilters?.delay_days && (
                  <RangeSlider
                    min={filters.rangeFilters.delay_days.min}
                    max={filters.rangeFilters.delay_days.max}
                    step={1}
                    value={filters.rangeFilters.delay_days.current || [filters.rangeFilters.delay_days.min, filters.rangeFilters.delay_days.max]}
                    onChange={(newRange) => filters.setRangeFilter('delay_days', newRange)}
                    label="Delay (Days)"
                    icon={Clock}
                    darkMode={darkMode}
                    unit=" days"
                  />
                )}
                
                {filters.rangeFilters?.efficiency_score && (
                  <RangeSlider
                    min={0}
                    max={100}
                    step={1}
                    value={filters.rangeFilters.efficiency_score.current || [0, 100]}
                    onChange={(newRange) => filters.setRangeFilter('efficiency_score', newRange)}
                    label="Efficiency Score"
                    icon={Target}
                    darkMode={darkMode}
                    unit="%"
                  />
                )}
                
                {filters.rangeFilters?.health_score && (
                  <RangeSlider
                    min={0}
                    max={100}
                    step={1}
                    value={filters.rangeFilters.health_score.current || [0, 100]}
                    onChange={(newRange) => filters.setRangeFilter('health_score', newRange)}
                    label="Health Score"
                    icon={Heart}
                    darkMode={darkMode}
                    unit=""
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className={`px-5 py-4 ${
          darkMode ? 'bg-gray-900/50' : 'bg-blue-50/50'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-500">Active:</span>
            
            {filters.searchTerm && (
              <span className="px-2.5 py-1 bg-white dark:bg-gray-700 text-sm rounded-full flex items-center gap-1.5 shadow-sm">
                <Search size={12} />
                "{filters.searchTerm}"
                <button onClick={() => filters.setSearchTerm('')} className="ml-1">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {Object.entries(filters.columnFilters || {}).map(([field, values]) => {
              if (!values || values.length === 0) return null;
              const col = dbConfig.columns?.find(c => c.name === field);
              return (
                <span key={field} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full">
                  {values.length} {col?.label || field}
                </span>
              );
            })}
            
            {Object.entries(filters.rangeFilters || {}).map(([field, range]) => {
              if (!range || !range.current || (range.current[0] === range.min && range.current[1] === range.max)) return null;
              const col = dbConfig.columns?.find(c => c.name === field);
              return (
                <span key={field} className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                  {col?.label || field}: {range.current[0]}-{range.current[1]}
                </span>
              );
            })}
            
            {Object.entries(filters.dateFilters || {}).map(([field, filter]) => {
              if (!filter?.enabled) return null;
              const col = dbConfig.columns?.find(c => c.name === field);
              return (
                <span key={field} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full">
                  {col?.label || field}
                </span>
              );
            })}
          </div>
          
          <button
            onClick={handleResetAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
          >
            <X size={14} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;