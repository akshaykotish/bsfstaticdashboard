import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Calendar, DollarSign, TrendingUp, AlertTriangle,
  Filter, X, ChevronDown, ChevronUp, Sliders, RotateCcw,
  Building2, Users, MapPin, Clock, Package, Target,
  Check, ChevronRight, Sparkles, Zap, Info
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
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-all ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-650' 
            : 'bg-white border-gray-300 text-gray-900 hover:border-orange-400'
        } ${isOpen ? 'ring-2 ring-orange-400 border-orange-400' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon size={16} className="text-orange-500 flex-shrink-0" />}
          <span className="text-sm truncate">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <DropdownPortal>
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className={`multiselect-dropdown-portal fixed rounded-lg shadow-2xl overflow-hidden ${
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
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            } sticky top-0 z-10`}>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-2 py-1.5 text-sm rounded ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                      : 'bg-gray-50 placeholder-gray-500'
                  } focus:outline-none focus:ring-1 focus:ring-orange-400`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            } sticky top-[50px] z-10`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll();
                }}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
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
                <div className={`px-3 py-4 text-sm text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-3 py-2 hover:${
                      darkMode ? 'bg-gray-700' : 'bg-orange-50'
                    } cursor-pointer transition-colors group`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => toggleOption(option)}
                        className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-400 cursor-pointer"
                      />
                    </div>
                    <span className={`text-sm truncate flex-1 ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    } group-hover:${darkMode ? 'text-gray-100' : 'text-gray-900'}`} 
                    title={option}>
                      {option}
                    </span>
                    {value.includes(option) && (
                      <Check size={14} className="text-orange-500 flex-shrink-0" />
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

// Smooth range slider component
const RangeSlider = ({ 
  min = 0, 
  max = 100, 
  step = 1, 
  value = [0, 100], 
  onChange, 
  label, 
  icon: Icon, 
  color = 'orange',
  darkMode = false,
  formatValue
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (index, newValue) => {
    const updated = [...localValue];
    updated[index] = Number(newValue);
    
    if (index === 0 && updated[0] > updated[1]) {
      updated[0] = updated[1];
    }
    if (index === 1 && updated[1] < updated[0]) {
      updated[1] = updated[0];
    }
    
    setLocalValue(updated);
  };

  const handleChangeEnd = () => {
    onChange(localValue);
  };

  const getTrackStyle = () => {
    const start = ((localValue[0] - min) / (max - min)) * 100;
    const end = ((localValue[1] - min) / (max - min)) * 100;
    return {
      left: `${start}%`,
      width: `${end - start}%`
    };
  };

  const colorClasses = {
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold flex items-center gap-2">
          {Icon && <Icon size={16} className={`text-${color}-500`} />}
          {label}
        </label>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
          {formatValue ? formatValue(localValue[0]) : localValue[0]} - {formatValue ? formatValue(localValue[1]) : localValue[1]}
        </span>
      </div>
      
      <div className="relative pt-1">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className={`absolute h-2 ${colorClasses[color]} rounded-full transition-all`}
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
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: localValue[0] === max ? 2 : 1 }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => handleChange(1, e.target.value)}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer slider-thumb"
        />
      </div>
      
      <div className="flex gap-2">
        <input
          type="number"
          min={min}
          max={localValue[1]}
          value={localValue[0]}
          onChange={(e) => handleChange(0, e.target.value)}
          onBlur={handleChangeEnd}
          className={`w-full px-2 py-1 text-xs rounded border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
          } focus:ring-1 focus:ring-orange-400`}
        />
        <span className="text-gray-500">to</span>
        <input
          type="number"
          min={localValue[0]}
          max={max}
          value={localValue[1]}
          onChange={(e) => handleChange(1, e.target.value)}
          onBlur={handleChangeEnd}
          className={`w-full px-2 py-1 text-xs rounded border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
          } focus:ring-1 focus:ring-orange-400`}
        />
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
    { name: 'Critical Projects', icon: AlertTriangle, filters: { riskLevels: ['CRITICAL'] } },
    { name: 'Delayed > 90 days', icon: Clock, filters: { delayRange: [90, 365] } },
    { name: 'High Budget', icon: DollarSign, filters: { amountRange: [50000, 1000000] } },
    { name: 'Near Completion', icon: Target, filters: { progressRange: [75, 99] } },
    { name: 'Stalled Projects', icon: Package, filters: { progressRange: [1, 25], delayRange: [30, 365] } }
  ]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const applyPreset = (preset) => {
    filters.resetFilters();
    Object.entries(preset.filters).forEach(([key, value]) => {
      switch(key) {
        case 'riskLevels':
          filters.setSelectedRiskLevels(value);
          break;
        case 'delayRange':
          filters.setDelayRange(value);
          break;
        case 'amountRange':
          filters.setAmountRange(value);
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

  const maxAmount = useMemo(() => {
    if (!rawData || rawData.length === 0) return 100000;
    return Math.max(...rawData.map(d => d.sanctioned_amount || 0));
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
    if (filters.progressRange[0] > 0 || filters.progressRange[1] < 100) count++;
    if (filters.amountRange[0] > 0 || filters.amountRange[1] < maxAmount) count++;
    if (filters.delayRange[0] > 0 || filters.delayRange[1] < 365) count++;
    return count;
  }, [filters, maxAmount]);

  return (
    <div className={`${
      darkMode ? 'bg-gray-800/90' : 'bg-white/90'
    } backdrop-blur rounded-xl shadow-lg border ${
      darkMode ? 'border-gray-700' : 'border-orange-200'
    } overflow-visible relative`}>
      
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50'
      } flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-orange-500 rounded-lg">
            <Filter size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Smart Filters</h2>
            <p className="text-xs text-gray-500">
              {filters.filteredData?.length || 0} of {rawData?.length || 0} projects
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-orange-100 hover:bg-orange-200'
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
                  className={`w-full px-3 py-2.5 text-left text-sm hover:${
                    darkMode ? 'bg-gray-700' : 'bg-orange-50'
                  } transition-colors flex items-center gap-2`}
                >
                  <preset.icon size={14} className="text-orange-500" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={filters.resetFilters}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-all`}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, location, agency, or contractor..."
            value={filters.searchTerm}
            onChange={(e) => filters.setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-300 placeholder-gray-500'
            } focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all`}
          />
          {filters.searchTerm && (
            <button
              onClick={() => filters.setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('basic')}
          className={`w-full px-4 py-3 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-orange-50'
          } transition-all`}
        >
          <span className="font-semibold flex items-center gap-2">
            <Sliders size={16} className="text-orange-500" />
            Category Filters
          </span>
          {expandedSections.basic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.basic && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative">
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
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('sliders')}
          className={`w-full px-4 py-3 flex justify-between items-center hover:${
            darkMode ? 'bg-gray-700/50' : 'bg-orange-50'
          } transition-all`}
        >
          <span className="font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" />
            Range Filters
          </span>
          {expandedSections.sliders ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.sliders && (
          <div className="p-4 space-y-6">
            <RangeSlider
              min={0}
              max={100}
              value={filters.progressRange}
              onChange={filters.setProgressRange}
              label="Progress Range"
              icon={TrendingUp}
              color="orange"
              darkMode={darkMode}
              formatValue={(v) => `${v}%`}
            />

            <RangeSlider
              min={0}
              max={maxAmount}
              step={1000}
              value={filters.amountRange}
              onChange={filters.setAmountRange}
              label="Budget Range"
              icon={DollarSign}
              color="green"
              darkMode={darkMode}
              formatValue={(v) => `₹${(v/100).toFixed(0)}L`}
            />

            <RangeSlider
              min={0}
              max={365}
              value={filters.delayRange}
              onChange={filters.setDelayRange}
              label="Delay Range"
              icon={Clock}
              color="red"
              darkMode={darkMode}
              formatValue={(v) => `${v}d`}
            />

            <RangeSlider
              min={0}
              max={100}
              value={filters.efficiencyRange || [0, 100]}
              onChange={filters.setEfficiencyRange}
              label="Efficiency Range"
              icon={Target}
              color="blue"
              darkMode={darkMode}
              formatValue={(v) => `${v}%`}
            />

            <RangeSlider
              min={0}
              max={100}
              value={filters.healthRange || [0, 100]}
              onChange={filters.setHealthRange}
              label="Health Score Range"
              icon={AlertTriangle}
              color="purple"
              darkMode={darkMode}
              formatValue={(v) => `${v}`}
            />
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className={`px-4 py-3 ${
          darkMode ? 'bg-gray-900/50' : 'bg-orange-50'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Active:</span>
            {filters.searchTerm && (
              <span className="px-2 py-1 bg-white dark:bg-gray-700 text-xs rounded-full flex items-center gap-1">
                <Search size={10} />
                "{filters.searchTerm}"
                <button onClick={() => filters.setSearchTerm('')}>
                  <X size={10} />
                </button>
              </span>
            )}
            {filters.selectedStatuses?.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                {filters.selectedStatuses.length} Status
              </span>
            )}
            {filters.selectedRiskLevels?.length > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                {filters.selectedRiskLevels.length} Risk
              </span>
            )}
            {filters.selectedAgencies?.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                {filters.selectedAgencies.length} Agency
              </span>
            )}
          </div>
          <button
            onClick={filters.resetFilters}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;