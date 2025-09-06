import React, { useState, useMemo } from 'react';
import { 
  Check, Globe, Briefcase, Zap, Timer, 
  AlertTriangle, PauseCircle, CreditCard, Info, 
  RotateCcw, Layers, DollarSign, Activity, Heart
} from 'lucide-react';

const TabView = ({ filters, darkMode, rawData = [] }) => {
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

  // Get available options from filters (these are already cascaded/filtered)
  const availableOptions = useMemo(() => {
    return filters.availableOptions || {
      budgetHeads: [],
      frontierHQs: [],
      sectorHQs: [],
      schemes: [],
      progressCategories: [],
      healthStatuses: []
    };
  }, [filters.availableOptions]);

  // Get all options from raw data for showing totals
  const allOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        budgetHeads: [],
        frontierHQs: [],
        sectorHQs: [],
        schemes: [],
        progressCategories: [],
        healthStatuses: []
      };
    }

    return {
      budgetHeads: [...new Set(rawData.map(d => d.budget_head))].filter(Boolean).sort(),
      frontierHQs: [...new Set(rawData.map(d => d.ftr_hq))].filter(Boolean).sort(),
      sectorHQs: [...new Set(rawData.map(d => d.shq))].filter(Boolean).sort(),
      schemes: [...new Set(rawData.map(d => d.scheme_name))].filter(Boolean).sort(),
      progressCategories: progressCategoryOptions.map(p => p.value),
      healthStatuses: healthStatusOptions.map(h => h.value)
    };
  }, [rawData]);

  // Calculate counts for each option
  const getCounts = (field) => {
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

  const counts = useMemo(() => ({
    budgetHeads: getCounts('budget_head'),
    frontierHQs: getCounts('ftr_hq'),
    sectorHQs: getCounts('shq'),
    schemes: getCounts('scheme_name'),
    progressCategories: getCounts('progress_category'),
    healthStatuses: getCounts('health_status')
  }), [filters.filteredData]);

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
    items, 
    selectedItems, 
    onToggle, 
    onClearAll,
    onSelectAll,
    showCounts = false,
    itemCounts = {},
    customLabels = {},
    customColors = {},
    customIcons = {},
    isFiltered = false,
    totalCount = 0
  }) => {
    const selectedCount = selectedItems.length;
    const noneSelected = selectedCount === 0;

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
                {isFiltered && totalCount > items.length && (
                  <span className="text-orange-500"> (filtered from {totalCount})</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            {items.length > 0 && (
              <button
                onClick={onSelectAll}
                className="px-2 py-1 text-[10px] font-medium rounded-lg
                         bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50
                         transition-all duration-200"
              >
                All
              </button>
            )}
            {selectedCount > 0 && (
              <button
                onClick={onClearAll}
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
                onClick={() => onToggle(item)}
                count={showCounts ? itemCounts[item] : undefined}
                icon={customIcons[item]}
                color={customColors[item] || 'gray'}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  // Check if cascading is active
  const isCascaded = useMemo(() => {
    return (
      availableOptions.budgetHeads?.length < allOptions.budgetHeads?.length ||
      availableOptions.frontierHQs?.length < allOptions.frontierHQs?.length ||
      availableOptions.sectorHQs?.length < allOptions.sectorHQs?.length ||
      availableOptions.schemes?.length < allOptions.schemes?.length
    );
  }, [availableOptions, allOptions]);

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
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Fast Filter View</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {hasActiveFilters ? 'Showing filtered results' : 'Showing all • Click tabs to filter'}
              {isCascaded && ' • Smart filtering active'}
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

      {/* Filter Rows */}
      <div className="space-y-2">
        {/* Budget Heads */}
        <FilterRow
          title="Budget Heads"
          icon={DollarSign}
          items={availableOptions.budgetHeads}
          selectedItems={filters.selectedBudgetHeads || []}
          onToggle={(item) => {
            const current = filters.selectedBudgetHeads || [];
            if (current.includes(item)) {
              filters.setSelectedBudgetHeads(current.filter(i => i !== item));
            } else {
              filters.setSelectedBudgetHeads([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedBudgetHeads([])}
          onSelectAll={() => filters.setSelectedBudgetHeads(availableOptions.budgetHeads)}
          showCounts={true}
          itemCounts={counts.budgetHeads}
          isFiltered={availableOptions.budgetHeads.length < allOptions.budgetHeads.length}
          totalCount={allOptions.budgetHeads.length}
        />

        {/* Frontier HQs */}
        <FilterRow
          title="Frontier HQs"
          icon={Globe}
          items={availableOptions.frontierHQs}
          selectedItems={filters.selectedFrontierHQs || []}
          onToggle={(item) => {
            const current = filters.selectedFrontierHQs || [];
            if (current.includes(item)) {
              filters.setSelectedFrontierHQs(current.filter(i => i !== item));
            } else {
              filters.setSelectedFrontierHQs([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedFrontierHQs([])}
          onSelectAll={() => filters.setSelectedFrontierHQs(availableOptions.frontierHQs)}
          showCounts={true}
          itemCounts={counts.frontierHQs}
          isFiltered={availableOptions.frontierHQs.length < allOptions.frontierHQs.length}
          totalCount={allOptions.frontierHQs.length}
        />

        {/* Schemes - This will now work because we're using filters directly */}
        <FilterRow
          title="Schemes"
          icon={Briefcase}
          items={availableOptions.schemes}
          selectedItems={filters.selectedSchemes || []}
          onToggle={(item) => {
            const current = filters.selectedSchemes || [];

            if (current.includes(item)) {
              filters.setSelectedSchemes(current.filter(i => i !== item));
            } else {
              filters.setSelectedSchemes([...current, item]);
                console.log(current, item, filters.setSelectedSchemes);
            }
            console.log(filters, item);
          }}
          onClearAll={() => filters.setSelectedSchemes([])}
          onSelectAll={() => filters.setSelectedSchemes(availableOptions.schemes)}
          showCounts={true}
          itemCounts={counts.schemes}
          isFiltered={availableOptions.schemes.length < allOptions.schemes.length}
          totalCount={allOptions.schemes.length}
        />

        {/* Progress Categories */}
        <FilterRow
          title="Physical Progress"
          icon={Activity}
          items={availableOptions.progressCategories}
          selectedItems={filters.selectedProgressCategories || []}
          onToggle={(item) => {
            const current = filters.selectedProgressCategories || [];
            if (current.includes(item)) {
              filters.setSelectedProgressCategories(current.filter(i => i !== item));
            } else {
              filters.setSelectedProgressCategories([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedProgressCategories([])}
          onSelectAll={() => filters.setSelectedProgressCategories(availableOptions.progressCategories)}
          showCounts={true}
          itemCounts={counts.progressCategories}
          customLabels={Object.fromEntries(progressCategoryOptions.map(p => [p.value, p.label]))}
          customColors={{
            'TENDER_PROGRESS': 'gray',
            'TENDERED_NOT_AWARDED': 'yellow',
            'AWARDED_NOT_STARTED': 'orange',
            'NOT_STARTED': 'red',
            'PROGRESS_1_TO_50': 'yellow',
            'PROGRESS_51_TO_71': 'blue',
            'PROGRESS_71_TO_99': 'green',
            'COMPLETED': 'green'
          }}
          isFiltered={availableOptions.progressCategories.length < allOptions.progressCategories.length}
          totalCount={allOptions.progressCategories.length}
        />

        {/* Health Status (Pace) */}
        <FilterRow
          title="Project Health (Pace)"
          icon={Heart}
          items={availableOptions.healthStatuses}
          selectedItems={filters.selectedHealthStatuses || []}
          onToggle={(item) => {
            const current = filters.selectedHealthStatuses || [];
            if (current.includes(item)) {
              filters.setSelectedHealthStatuses(current.filter(i => i !== item));
            } else {
              filters.setSelectedHealthStatuses([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedHealthStatuses([])}
          onSelectAll={() => filters.setSelectedHealthStatuses(availableOptions.healthStatuses)}
          showCounts={true}
          itemCounts={counts.healthStatuses}
          customLabels={Object.fromEntries(healthStatusOptions.map(h => [h.value, h.label]))}
          customColors={Object.fromEntries(healthStatusOptions.map(h => [h.value, h.color]))}
          customIcons={Object.fromEntries(healthStatusOptions.map(h => [h.value, h.icon]))}
          isFiltered={availableOptions.healthStatuses.length < allOptions.healthStatuses.length}
          totalCount={allOptions.healthStatuses.length}
        />
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