import React, { useState, useMemo } from 'react';
import { 
  Check, Globe, Briefcase, Zap, Timer, 
  AlertTriangle, PauseCircle, CreditCard, Info, 
  RotateCcw, Layers, DollarSign, Activity, Heart,
  FileText, MapPin, Building2, Users, Calendar, Hash,
  Navigation, Clock, Target, Package, BookOpen
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

const TabView = ({ filters, darkMode, rawData = [], databaseName = 'engineering' }) => {
  // Get database configuration
  const dbConfig = useMemo(() => {
    return databaseConfigs[databaseName] || databaseConfigs.engineering || {};
  }, [databaseName]);

  // Pace/Health status options with icons and colors
  const healthStatusOptions = [
    { value: 'PERFECT_PACE', label: 'Perfect Pace', icon: Zap, color: 'green' },
    { value: 'SLOW_PACE', label: 'Slow Pace', icon: Timer, color: 'yellow' },
    { value: 'BAD_PACE', label: 'Bad Pace', icon: AlertTriangle, color: 'orange' },
    { value: 'SLEEP_PACE', label: 'Sleep Pace', icon: PauseCircle, color: 'red' },
    { value: 'PAYMENT_PENDING', label: 'Payment Pending', icon: CreditCard, color: 'purple' },
    { value: 'NOT_APPLICABLE', label: 'Not Applicable', icon: Info, color: 'gray' }
  ];

  // Progress category options
  const progressCategoryOptions = [
    { value: 'TENDER_PROGRESS', label: 'Tender in Progress' },
    { value: 'TENDERED_NOT_AWARDED', label: 'Tendered (Not Awarded)' },
    { value: 'AWARDED_NOT_STARTED', label: 'Awarded (Not Started)' },
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'PROGRESS_1_TO_50', label: '1-50% Complete' },
    { value: 'PROGRESS_51_TO_71', label: '51-71% Complete' },
    { value: 'PROGRESS_71_TO_99', label: '71-99% Complete' },
    { value: 'COMPLETED', label: '100% Completed' }
  ];

  // Define only the fields you want to show
  const fieldConfigs = [
    {
      field: 'budget_head',
      title: 'Budget Head',
      icon: DollarSign,
      type: 'column'
    },
    {
      field: 'name_of_scheme',
      title: 'Name of Scheme', 
      icon: Briefcase,
      type: 'column'
    },
    {
      field: 'sub_scheme_name',
      title: 'Sub Scheme Name',
      icon: BookOpen,
      type: 'column'
    },
    {
      field: 'ftr_hq_name',
      title: 'Frontier HQ Name',
      icon: Globe,
      type: 'column'
    },
    {
      field: 'shq_name',
      title: 'SHQ Name',
      icon: Navigation,
      type: 'column'
    },
    {
      field: 'location',
      title: 'Location',
      icon: MapPin,
      type: 'column'
    },
    {
      field: 'executive_agency',
      title: 'Executive Agency',
      icon: Building2,
      type: 'column'
    },
    {
      field: 'health_status',
      title: 'Project Health (Pace)',
      icon: Heart,
      type: 'derived',
      options: healthStatusOptions
    },
    {
      field: 'progress_category',
      title: 'Physical Progress',
      icon: Activity,
      type: 'derived',
      options: progressCategoryOptions
    }
  ];

  // Get available options from filters.availableOptions - now uses cascade filtering
  const getFieldOptions = (field) => {
    // Try from filters first - this now uses cascade filtering!
    if (filters.availableOptions && filters.availableOptions[field]) {
      return filters.availableOptions[field];
    }
    
    // Fallback to extracting from raw data (should not be needed with the improved implementation)
    if (rawData && rawData.length > 0) {
      const uniqueValues = [...new Set(rawData.map(d => d[field]))].filter(Boolean);
      return uniqueValues.sort();
    }
    
    return [];
  };

  // Get all options (unfiltered) for showing totals
  const getAllFieldOptions = (field) => {
    if (!rawData || rawData.length === 0) return [];
    const uniqueValues = [...new Set(rawData.map(d => d[field]))].filter(Boolean);
    return uniqueValues.sort();
  };

  // Calculate counts for each option
  const getFieldCounts = (field) => {
    const counts = {};
    if (!filters.filteredData) return counts;
    
    filters.filteredData.forEach(item => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    
    return counts;
  };

  // Get selected values for a field
  const getSelectedValues = (field) => {
    // Check column filters first
    if (filters.columnFilters && filters.columnFilters[field]) {
      return filters.columnFilters[field];
    }
    
    // Check backwards compatibility properties
    const fieldMappings = {
      'budget_head': filters.selectedBudgetHeads,
      'executive_agency': filters.selectedAgencies,
      'ftr_hq_name': filters.selectedFrontierHQs,
      'shq_name': filters.selectedSectorHQs,
      'name_of_scheme': filters.selectedSchemes,
      'sub_scheme_name': filters.selectedSubSchemes,
      'location': filters.selectedLocations,
      'health_status': filters.selectedHealthStatuses,
      'progress_category': filters.selectedProgressCategories
    };
    
    return fieldMappings[field] || [];
  };

  // Set selected values for a field
  const setSelectedValues = (field, values) => {
    // Try column filter first
    if (filters.setColumnFilter) {
      filters.setColumnFilter(field, values);
      return;
    }
    
    // Fallback to specific setters
    const fieldSetters = {
      'budget_head': filters.setSelectedBudgetHeads,
      'executive_agency': filters.setSelectedAgencies,
      'ftr_hq_name': filters.setSelectedFrontierHQs,
      'shq_name': filters.setSelectedSectorHQs,
      'name_of_scheme': filters.setSelectedSchemes,
      'sub_scheme_name': filters.setSelectedSubSchemes,
      'location': filters.setSelectedLocations,
      'health_status': filters.setSelectedHealthStatuses,
      'progress_category': filters.setSelectedProgressCategories
    };
    
    const setter = fieldSetters[field];
    if (setter && typeof setter === 'function') {
      setter(values);
    }
  };

  // Tab component
  const Tab = ({ label, selected, onClick, count, disabled = false, icon: Icon, color = 'gray' }) => {
    const colorStyles = {
      green: {
        selected: 'bg-green-500 text-white border-green-500',
        hover: 'hover:bg-green-50 hover:border-green-400',
        icon: 'text-green-500'
      },
      yellow: {
        selected: 'bg-yellow-500 text-white border-yellow-500',
        hover: 'hover:bg-yellow-50 hover:border-yellow-400',
        icon: 'text-yellow-500'
      },
      orange: {
        selected: 'bg-orange-500 text-white border-orange-500',
        hover: 'hover:bg-orange-50 hover:border-orange-400',
        icon: 'text-orange-500'
      },
      red: {
        selected: 'bg-red-500 text-white border-red-500',
        hover: 'hover:bg-red-50 hover:border-red-400',
        icon: 'text-red-500'
      },
      purple: {
        selected: 'bg-purple-500 text-white border-purple-500',
        hover: 'hover:bg-purple-50 hover:border-purple-400',
        icon: 'text-purple-500'
      },
      gray: {
        selected: 'bg-gray-600 text-white border-gray-600',
        hover: 'hover:bg-gray-50 hover:border-gray-400',
        icon: 'text-gray-500'
      },
      blue: {
        selected: 'bg-blue-500 text-white border-blue-500',
        hover: 'hover:bg-blue-50 hover:border-blue-400',
        icon: 'text-blue-500'
      }
    };

    const style = colorStyles[color] || colorStyles.gray;

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          px-2.5 py-1.5 rounded-xl border font-medium text-xs
          transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
          flex items-center gap-1.5 whitespace-nowrap
          ${selected 
            ? style.selected + ' shadow-sm'
            : `bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 ${!disabled ? style.hover : 'opacity-50 cursor-not-allowed'}`
          }
        `}
      >
        {Icon && (
          <Icon size={12} className={selected ? 'text-white' : style.icon} />
        )}
        <span className="truncate max-w-[150px]" title={label}>{label}</span>
        {count !== undefined && count > 0 && (
          <span className={`
            px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${selected 
              ? 'bg-white/20 text-white' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
            }
          `}>
            {count}
          </span>
        )}
        {selected && <Check size={10} className="ml-0.5" />}
      </button>
    );
  };

  // Filter row component
  const FilterRow = ({ 
    title, 
    icon: Icon, 
    field,
    config = {}
  }) => {
    // Use cascade filtering through the availableOptions from useFilters
    const items = getFieldOptions(field);
    const allItems = getAllFieldOptions(field);
    const selectedItems = getSelectedValues(field);
    const itemCounts = getFieldCounts(field);
    const isFiltered = items.length < allItems.length;
    
    // Get custom labels and colors for specific field types
    let customLabels = {};
    let customColors = {};
    let customIcons = {};
    
    if (config.options) {
      config.options.forEach(opt => {
        customLabels[opt.value] = opt.label;
        if (opt.color) customColors[opt.value] = opt.color;
        if (opt.icon) customIcons[opt.value] = opt.icon;
      });
    }
    
    // Special handling for progress categories
    if (field === 'progress_category') {
      customColors = {
        'TENDER_PROGRESS': 'gray',
        'TENDERED_NOT_AWARDED': 'yellow',
        'AWARDED_NOT_STARTED': 'orange',
        'NOT_STARTED': 'red',
        'PROGRESS_1_TO_50': 'yellow',
        'PROGRESS_51_TO_71': 'blue',
        'PROGRESS_71_TO_99': 'green',
        'COMPLETED': 'green'
      };
    }
    
    const selectedCount = selectedItems.length;
    const noneSelected = selectedCount === 0;

    const handleToggle = (item) => {
      const current = selectedItems;
      if (current.includes(item)) {
        setSelectedValues(field, current.filter(i => i !== item));
      } else {
        setSelectedValues(field, [...current, item]);
      }
    };

    const handleClearAll = () => {
      setSelectedValues(field, []);
    };

    const handleSelectAll = () => {
      setSelectedValues(field, items);
    };

    return (
      <div className={`
        p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Icon size={14} className="text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {noneSelected ? 'All shown' : `${selectedCount} selected`}
                {items.length > 0 && ` • ${items.length} available`}
                {isFiltered && allItems.length > items.length && (
                  <span className="text-orange-500"> (filtered from {allItems.length})</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            {items.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-2 py-1 text-[10px] font-medium rounded-lg
                         bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50
                         transition-all duration-200"
              >
                All
              </button>
            )}
            {selectedCount > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2 py-1 text-[10px] font-medium rounded-lg
                         bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                         transition-all duration-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic py-1">
              No options available
              {isFiltered && ' (try adjusting other filters)'}
            </div>
          ) : (
            items.map(item => (
              <Tab
                key={item}
                label={customLabels[item] || item}
                selected={selectedItems.includes(item)}
                onClick={() => handleToggle(item)}
                count={itemCounts[item]}
                icon={customIcons[item]}
                color={customColors[item] || 'gray'}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const hasActiveFilters = filters.hasActiveFilters ? filters.hasActiveFilters() : false;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`flex items-center justify-between p-3 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border rounded-xl`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          } rounded-lg border`}>
            <Layers size={18} className="text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Fast Filter View
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {hasActiveFilters ? 'Showing filtered results' : 'Showing all • Click tabs to filter'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          } rounded-lg border`}>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {filters.filteredData?.length || 0} / {rawData.length}
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => filters.resetFilters()}
              className={`px-3 py-1.5 ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'
              } rounded-lg border transition-all duration-200 flex items-center gap-1.5`}
            >
              <RotateCcw size={14} className="text-gray-600 dark:text-gray-300" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Rows - Only showing requested fields */}
      <div className="space-y-2">
        {fieldConfigs.map(config => (
          <FilterRow
            key={config.field}
            title={config.title}
            icon={config.icon}
            field={config.field}
            config={config}
          />
        ))}
      </div>

      {/* Info Panel */}
      <div className={`p-3 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border rounded-xl`}>
        <div className="flex items-start gap-2">
          <Info size={14} className="text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-0.5">How it works</p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">
              Click tabs to filter • Multiple selections allowed • Smart filtering automatically shows related options • Click "All" to select all visible options • Click "Clear" to remove selections
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabView;