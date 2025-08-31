import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Calendar, DollarSign, TrendingUp, AlertTriangle,
  Filter, X, ChevronDown, ChevronUp, Sliders, RotateCcw,
  Building2, Users, MapPin, Clock, Package, Target,
  Check, ChevronRight, Sparkles, Zap, Info, RefreshCw
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

// Multi-select dropdown component with Portal
const MultiSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Select...', 
  darkMode = false,
  icon: Icon,
  maxHeight = '300px'
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
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

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
    if (value.length === 1) return value[0];
    return `${value.length} Selected`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-all text-sm ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
        } ${isOpen ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon size={14} className="text-blue-500 flex-shrink-0" />}
          <span className="text-xs truncate">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform flex-shrink-0 ml-2 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
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

            {/* Quick Actions */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
            } sticky top-[46px] z-10`}>
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
                  No options found
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
                    title={option}>
                      {option}
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

// Enhanced Range Slider component with proper min/max filtering
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
      // Min slider
      updated[0] = Math.min(numValue, updated[1]);
    } else {
      // Max slider
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
        
        {/* Min slider */}
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
        
        {/* Max slider */}
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

const FilterPanel = ({ filters, darkMode, rawData = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    sliders: false
  });

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
    },
    { 
      name: 'Near Completion', 
      icon: Target, 
      filters: { 
        progressRange: [75, 100],
        amountRange: [0, Infinity],
        delayRange: [0, 365]
      } 
    },
    { 
      name: 'Stalled Projects', 
      icon: Package, 
      filters: { 
        progressRange: [1, 25], 
        delayRange: [30, 365],
        amountRange: [0, Infinity]
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
    
    // Apply preset filters
    Object.entries(preset.filters).forEach(([key, value]) => {
      switch(key) {
        case 'riskLevels':
          filters.setSelectedRiskLevels(value);
          break;
        case 'delayRange':
          // Ensure max doesn't exceed data max
          const maxDelay = Math.max(...(rawData.map(d => d.delay_days || 0)), 365);
          filters.setDelayRange([value[0], Math.min(value[1], maxDelay)]);
          break;
        case 'amountRange':
          // Ensure max doesn't exceed data max
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

  const uniqueValues = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        statuses: [],
        riskLevels: [],
        budgetHeads: [],
        agencies: [],
        frontiers: [],
        contractors: [],
        locations: []
      };
    }

    return {
      statuses: ['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED'],
      riskLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      budgetHeads: [...new Set(rawData.map(d => d.budget_head))].filter(Boolean).sort(),
      agencies: [...new Set(rawData.map(d => d.executive_agency))].filter(Boolean).sort(),
      frontiers: [...new Set([
        ...rawData.map(d => d.ftr_hq),
        ...rawData.map(d => d.shq)
      ])].filter(Boolean).sort(),
      contractors: [...new Set(rawData.map(d => d.firm_name))].filter(Boolean).sort(),
      locations: [...new Set(rawData.map(d => d.work_site?.split(',')[0]))].filter(Boolean).sort()
    };
  }, [rawData]);

  // Calculate actual data ranges
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
        healthMax: 100
      };
    }

    const amounts = rawData.map(d => d.sanctioned_amount || 0);
    const delays = rawData.map(d => d.delay_days || 0);
    const progress = rawData.map(d => d.physical_progress || 0);
    const efficiency = rawData.map(d => d.efficiency_score || 0);
    const health = rawData.map(d => d.health_score || 0);

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
      healthMax: Math.max(...health, 100)
    };
  }, [rawData]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.selectedStatuses?.length > 0) count++;
    if (filters.selectedRiskLevels?.length > 0) count++;
    if (filters.selectedBudgetHeads?.length > 0) count++;
    if (filters.selectedAgencies?.length > 0) count++;
    if (filters.selectedFrontiers?.length > 0) count++;
    if (filters.selectedContractors?.length > 0) count++;
    if (filters.selectedLocations?.length > 0) count++;
    
    // Check if ranges are modified from defaults
    if (filters.progressRange && (filters.progressRange[0] > 0 || filters.progressRange[1] < 100)) count++;
    if (filters.amountRange && (filters.amountRange[0] > dataRanges.amountMin || filters.amountRange[1] < dataRanges.amountMax)) count++;
    if (filters.delayRange && (filters.delayRange[0] > 0 || filters.delayRange[1] < dataRanges.delayMax)) count++;
    if (filters.efficiencyRange && (filters.efficiencyRange[0] > 0 || filters.efficiencyRange[1] < 100)) count++;
    if (filters.healthRange && (filters.healthRange[0] > dataRanges.healthMin || filters.healthRange[1] < dataRanges.healthMax)) count++;
    
    return count;
  }, [filters, dataRanges]);

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
        </div>
        
        <div className="flex items-center gap-2">
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
            onClick={filters.resetFilters}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-all`}
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, location, agency, or contractor..."
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

      {/* Basic Filters Section */}
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
          </span>
          {expandedSections.basic ? 
            <ChevronUp size={16} className="text-gray-400" /> : 
            <ChevronDown size={16} className="text-gray-400" />
          }
        </button>
        
        {expandedSections.basic && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 relative bg-gray-50/50 dark:bg-gray-900/20">
            <MultiSelect
              options={uniqueValues.statuses}
              value={filters.selectedStatuses || []}
              onChange={filters.setSelectedStatuses}
              placeholder="All Statuses"
              darkMode={darkMode}
              icon={Package}
            />

            <MultiSelect
              options={uniqueValues.riskLevels}
              value={filters.selectedRiskLevels || []}
              onChange={filters.setSelectedRiskLevels}
              placeholder="All Risk Levels"
              darkMode={darkMode}
              icon={AlertTriangle}
            />

            <MultiSelect
              options={uniqueValues.budgetHeads}
              value={filters.selectedBudgetHeads || []}
              onChange={filters.setSelectedBudgetHeads}
              placeholder="All Budget Heads"
              darkMode={darkMode}
              icon={DollarSign}
            />

            <MultiSelect
              options={uniqueValues.agencies}
              value={filters.selectedAgencies || []}
              onChange={filters.setSelectedAgencies}
              placeholder="All Agencies"
              darkMode={darkMode}
              icon={Building2}
            />

            <MultiSelect
              options={uniqueValues.frontiers}
              value={filters.selectedFrontiers || []}
              onChange={filters.setSelectedFrontiers}
              placeholder="All Frontiers"
              darkMode={darkMode}
              icon={MapPin}
            />

            <MultiSelect
              options={uniqueValues.contractors}
              value={filters.selectedContractors || []}
              onChange={filters.setSelectedContractors}
              placeholder="All Contractors"
              darkMode={darkMode}
              icon={Users}
            />

            <MultiSelect
              options={uniqueValues.locations}
              value={filters.selectedLocations || []}
              onChange={filters.setSelectedLocations}
              placeholder="All Locations"
              darkMode={darkMode}
              icon={MapPin}
            />
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
                label="Progress Range"
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
                value={filters.delayRange || [0, dataRanges.delayMax]}
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
                icon={AlertTriangle}
                color="purple"
                darkMode={darkMode}
                formatValue={(v) => `${v}`}
                unit=""
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
            {filters.selectedStatuses?.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                {filters.selectedStatuses.length} Status
              </span>
            )}
            {filters.selectedRiskLevels?.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                {filters.selectedRiskLevels.length} Risk
              </span>
            )}
            {filters.selectedAgencies?.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                {filters.selectedAgencies.length} Agency
              </span>
            )}
            {(filters.progressRange && (filters.progressRange[0] > 0 || filters.progressRange[1] < 100)) && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                Progress: {filters.progressRange[0]}-{filters.progressRange[1]}%
              </span>
            )}
            {(filters.amountRange && (filters.amountRange[0] > dataRanges.amountMin || filters.amountRange[1] < dataRanges.amountMax)) && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                Budget filtered
              </span>
            )}
            {(filters.delayRange && (filters.delayRange[0] > 0 || filters.delayRange[1] < dataRanges.delayMax)) && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                Delay: {filters.delayRange[0]}-{filters.delayRange[1]} days
              </span>
            )}
          </div>
          <button
            onClick={filters.resetFilters}
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