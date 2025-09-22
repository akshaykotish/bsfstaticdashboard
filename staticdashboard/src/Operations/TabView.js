import React, { useState, useMemo } from 'react';
import { 
  Check, Globe, Briefcase, Zap, Timer, 
  AlertTriangle, PauseCircle, CreditCard, Info, 
  RotateCcw, Layers, DollarSign, Activity, Heart,
  Shield, Box, Route, Building, MoreHorizontal,
  Construction, Navigation, FileText, Hash, Target
} from 'lucide-react';

const TabView = ({ filters, darkMode, rawData = [] }) => {
  // Operations-specific project health options
  const projectHealthOptions = [
    { value: 'ON_TRACK', label: 'On Track', icon: Zap, color: 'green' },
    { value: 'MINOR_DELAY', label: 'Minor Delay', icon: Timer, color: 'yellow' },
    { value: 'MODERATE_DELAY', label: 'Moderate Delay', icon: AlertTriangle, color: 'orange' },
    { value: 'SEVERE_DELAY', label: 'Severe Delay', icon: PauseCircle, color: 'red' }
  ];

  // Operations-specific completion status options
  const completionStatusOptions = [
    { value: 'NOT_STARTED', label: 'Not Started', color: 'red' },
    { value: 'INITIAL', label: 'Initial (0-25%)', color: 'orange' },
    { value: 'IN_PROGRESS', label: 'In Progress (25-50%)', color: 'yellow' },
    { value: 'ADVANCED', label: 'Advanced (50-75%)', color: 'blue' },
    { value: 'NEAR_COMPLETION', label: 'Near Completion (75-99%)', color: 'indigo' },
    { value: 'COMPLETED', label: 'Completed (100%)', color: 'green' }
  ];

  // Operations work category options
  const workCategoryOptions = [
    { value: 'BORDER_OUTPOST', label: 'BOP', icon: Shield, color: 'blue' },
    { value: 'FENCING', label: 'Fencing', icon: Box, color: 'purple' },
    { value: 'ROAD', label: 'Road', icon: Route, color: 'gray' },
    { value: 'BRIDGE', label: 'Bridge', icon: Construction, color: 'orange' },
    { value: 'INFRASTRUCTURE', label: 'Infrastructure', icon: Building, color: 'green' },
    { value: 'OTHER', label: 'Other', icon: MoreHorizontal, color: 'gray' }
  ];

  // Risk level options
  const riskLevelOptions = [
    { value: 'CRITICAL', label: 'Critical', color: 'red' },
    { value: 'HIGH', label: 'High', color: 'orange' },
    { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
    { value: 'LOW', label: 'Low', color: 'green' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'URGENT', label: 'Urgent', icon: Zap, color: 'red' },
    { value: 'HIGH', label: 'High', icon: AlertTriangle, color: 'orange' },
    { value: 'MEDIUM', label: 'Medium', icon: Activity, color: 'blue' },
    { value: 'LOW', label: 'Low', icon: Info, color: 'gray' }
  ];

  // Get available options from filters (these are already cascaded/filtered)
  const availableOptions = useMemo(() => {
    return filters.availableOptions || {
      workTypes: [],
      workCategories: [],
      frontiers: [],
      sectorHQs: [],
      completionStatuses: [],
      projectHealths: [],
      riskLevels: [],
      priorities: [],
      hlecYears: [],
      sourceSheets: []
    };
  }, [filters.availableOptions]);

  // Get all options from raw data for showing totals - FIXED to use processed field names
  const allOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        workTypes: [],
        workCategories: [],
        frontiers: [],
        sectorHQs: [],
        completionStatuses: [],
        projectHealths: [],
        riskLevels: [],
        priorities: [],
        hlecYears: [],
        sourceSheets: []
      };
    }

    return {
      workTypes: [...new Set(rawData.map(d => d.work_type))].filter(Boolean).sort(),
      workCategories: workCategoryOptions.map(w => w.value),
      frontiers: [...new Set(rawData.map(d => d.frontier))].filter(Boolean).sort(),
      sectorHQs: [...new Set(rawData.map(d => d.sector_hq))].filter(Boolean).sort(),
      completionStatuses: completionStatusOptions.map(c => c.value),
      projectHealths: projectHealthOptions.map(h => h.value),
      riskLevels: riskLevelOptions.map(r => r.value),
      priorities: priorityOptions.map(p => p.value),
      hlecYears: [...new Set(rawData.map(d => d.hlec_year_number?.toString()))].filter(Boolean).sort((a, b) => parseInt(b) - parseInt(a)),
      sourceSheets: [...new Set(rawData.map(d => d.source_sheet))].filter(Boolean).sort()
    };
  }, [rawData]);

  // Calculate counts for each option - FIXED to use processed field names
  const getCounts = (field) => {
    const counts = {};
    if (!filters.filteredData) return counts;
    
    filters.filteredData.forEach(item => {
      let value;
      // Special handling for HLEC year
      if (field === 'hlec_year_number') {
        value = item[field]?.toString();
      } else {
        value = item[field];
      }
      
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    
    return counts;
  };

  const counts = useMemo(() => ({
    workTypes: getCounts('work_type'),
    workCategories: getCounts('work_category'),
    frontiers: getCounts('frontier'),
    sectorHQs: getCounts('sector_hq'),
    completionStatuses: getCounts('completion_status'),
    projectHealths: getCounts('project_health'),
    riskLevels: getCounts('risk_level'),
    priorities: getCounts('priority'),
    hlecYears: getCounts('hlec_year_number'),
    sourceSheets: getCounts('source_sheet')
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
      },
      indigo: {
        selected: 'bg-indigo-500 text-white border-indigo-500',
        hover: 'hover:bg-indigo-50 hover:border-indigo-400',
        icon: 'text-indigo-500'
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
      availableOptions.frontiers?.length < allOptions.frontiers?.length ||
      availableOptions.sectorHQs?.length < allOptions.sectorHQs?.length
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
            <Construction size={18} className="text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Operations Fast Filters</h2>
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
        {/* Work Types */}
        <FilterRow
          title="Work Types"
          icon={Construction}
          items={availableOptions.workTypes}
          selectedItems={filters.selectedWorkTypes || []}
          onToggle={(item) => {
            const current = filters.selectedWorkTypes || [];
            if (current.includes(item)) {
              filters.setSelectedWorkTypes(current.filter(i => i !== item));
            } else {
              filters.setSelectedWorkTypes([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedWorkTypes([])}
          onSelectAll={() => filters.setSelectedWorkTypes(availableOptions.workTypes)}
          showCounts={true}
          itemCounts={counts.workTypes}
          isFiltered={availableOptions.workTypes?.length < allOptions.workTypes?.length}
          totalCount={allOptions.workTypes?.length}
        />

        {/* Work Categories */}
        <FilterRow
          title="Work Categories"
          icon={Box}
          items={availableOptions.workCategories}
          selectedItems={filters.selectedWorkCategories || []}
          onToggle={(item) => {
            const current = filters.selectedWorkCategories || [];
            if (current.includes(item)) {
              filters.setSelectedWorkCategories(current.filter(i => i !== item));
            } else {
              filters.setSelectedWorkCategories([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedWorkCategories([])}
          onSelectAll={() => filters.setSelectedWorkCategories(availableOptions.workCategories)}
          showCounts={true}
          itemCounts={counts.workCategories}
          customLabels={Object.fromEntries(workCategoryOptions.map(w => [w.value, w.label]))}
          customColors={Object.fromEntries(workCategoryOptions.map(w => [w.value, w.color]))}
          customIcons={Object.fromEntries(workCategoryOptions.map(w => [w.value, w.icon]))}
          isFiltered={availableOptions.workCategories?.length < allOptions.workCategories?.length}
          totalCount={allOptions.workCategories?.length}
        />

        {/* Frontiers */}
        <FilterRow
          title="Frontiers"
          icon={Globe}
          items={availableOptions.frontiers}
          selectedItems={filters.selectedFrontiers || []}
          onToggle={(item) => {
            const current = filters.selectedFrontiers || [];
            if (current.includes(item)) {
              filters.setSelectedFrontiers(current.filter(i => i !== item));
            } else {
              filters.setSelectedFrontiers([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedFrontiers([])}
          onSelectAll={() => filters.setSelectedFrontiers(availableOptions.frontiers)}
          showCounts={true}
          itemCounts={counts.frontiers}
          isFiltered={availableOptions.frontiers?.length < allOptions.frontiers?.length}
          totalCount={allOptions.frontiers?.length}
        />

        {/* Sector HQs */}
        <FilterRow
          title="Sector HQs"
          icon={Navigation}
          items={availableOptions.sectorHQs}
          selectedItems={filters.selectedSectorHQs || []}
          onToggle={(item) => {
            const current = filters.selectedSectorHQs || [];
            if (current.includes(item)) {
              filters.setSelectedSectorHQs(current.filter(i => i !== item));
            } else {
              filters.setSelectedSectorHQs([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedSectorHQs([])}
          onSelectAll={() => filters.setSelectedSectorHQs(availableOptions.sectorHQs)}
          showCounts={true}
          itemCounts={counts.sectorHQs}
          isFiltered={availableOptions.sectorHQs?.length < allOptions.sectorHQs?.length}
          totalCount={allOptions.sectorHQs?.length}
        />

        {/* Completion Status */}
        <FilterRow
          title="Completion Status"
          icon={Activity}
          items={availableOptions.completionStatuses}
          selectedItems={filters.selectedCompletionStatuses || []}
          onToggle={(item) => {
            const current = filters.selectedCompletionStatuses || [];
            if (current.includes(item)) {
              filters.setSelectedCompletionStatuses(current.filter(i => i !== item));
            } else {
              filters.setSelectedCompletionStatuses([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedCompletionStatuses([])}
          onSelectAll={() => filters.setSelectedCompletionStatuses(availableOptions.completionStatuses)}
          showCounts={true}
          itemCounts={counts.completionStatuses}
          customLabels={Object.fromEntries(completionStatusOptions.map(c => [c.value, c.label]))}
          customColors={Object.fromEntries(completionStatusOptions.map(c => [c.value, c.color]))}
          isFiltered={availableOptions.completionStatuses?.length < allOptions.completionStatuses?.length}
          totalCount={allOptions.completionStatuses?.length}
        />

        {/* Project Health */}
        <FilterRow
          title="Project Health"
          icon={Heart}
          items={availableOptions.projectHealths}
          selectedItems={filters.selectedProjectHealths || []}
          onToggle={(item) => {
            const current = filters.selectedProjectHealths || [];
            if (current.includes(item)) {
              filters.setSelectedProjectHealths(current.filter(i => i !== item));
            } else {
              filters.setSelectedProjectHealths([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedProjectHealths([])}
          onSelectAll={() => filters.setSelectedProjectHealths(availableOptions.projectHealths)}
          showCounts={true}
          itemCounts={counts.projectHealths}
          customLabels={Object.fromEntries(projectHealthOptions.map(h => [h.value, h.label]))}
          customColors={Object.fromEntries(projectHealthOptions.map(h => [h.value, h.color]))}
          customIcons={Object.fromEntries(projectHealthOptions.map(h => [h.value, h.icon]))}
          isFiltered={availableOptions.projectHealths?.length < allOptions.projectHealths?.length}
          totalCount={allOptions.projectHealths?.length}
        />

        {/* Risk Levels */}
        <FilterRow
          title="Risk Levels"
          icon={AlertTriangle}
          items={availableOptions.riskLevels}
          selectedItems={filters.selectedRiskLevels || []}
          onToggle={(item) => {
            const current = filters.selectedRiskLevels || [];
            if (current.includes(item)) {
              filters.setSelectedRiskLevels(current.filter(i => i !== item));
            } else {
              filters.setSelectedRiskLevels([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedRiskLevels([])}
          onSelectAll={() => filters.setSelectedRiskLevels(availableOptions.riskLevels)}
          showCounts={true}
          itemCounts={counts.riskLevels}
          customLabels={Object.fromEntries(riskLevelOptions.map(r => [r.value, r.label]))}
          customColors={Object.fromEntries(riskLevelOptions.map(r => [r.value, r.color]))}
          isFiltered={availableOptions.riskLevels?.length < allOptions.riskLevels?.length}
          totalCount={allOptions.riskLevels?.length}
        />

        {/* Priorities */}
        <FilterRow
          title="Priority Levels"
          icon={Target}
          items={availableOptions.priorities}
          selectedItems={filters.selectedPriorities || []}
          onToggle={(item) => {
            const current = filters.selectedPriorities || [];
            if (current.includes(item)) {
              filters.setSelectedPriorities(current.filter(i => i !== item));
            } else {
              filters.setSelectedPriorities([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedPriorities([])}
          onSelectAll={() => filters.setSelectedPriorities(availableOptions.priorities)}
          showCounts={true}
          itemCounts={counts.priorities}
          customLabels={Object.fromEntries(priorityOptions.map(p => [p.value, p.label]))}
          customColors={Object.fromEntries(priorityOptions.map(p => [p.value, p.color]))}
          customIcons={Object.fromEntries(priorityOptions.map(p => [p.value, p.icon]))}
          isFiltered={availableOptions.priorities?.length < allOptions.priorities?.length}
          totalCount={allOptions.priorities?.length}
        />

        {/* HLEC Years */}
        <FilterRow
          title="HLEC Years"
          icon={FileText}
          items={availableOptions.hlecYears}
          selectedItems={filters.selectedHLECYears || []}
          onToggle={(item) => {
            const current = filters.selectedHLECYears || [];
            if (current.includes(item)) {
              filters.setSelectedHLECYears(current.filter(i => i !== item));
            } else {
              filters.setSelectedHLECYears([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedHLECYears([])}
          onSelectAll={() => filters.setSelectedHLECYears(availableOptions.hlecYears)}
          showCounts={true}
          itemCounts={counts.hlecYears}
          isFiltered={availableOptions.hlecYears?.length < allOptions.hlecYears?.length}
          totalCount={allOptions.hlecYears?.length}
        />

        {/* Source Sheets */}
        <FilterRow
          title="Source Sheets"
          icon={Briefcase}
          items={availableOptions.sourceSheets}
          selectedItems={filters.selectedSourceSheets || []}
          onToggle={(item) => {
            const current = filters.selectedSourceSheets || [];
            if (current.includes(item)) {
              filters.setSelectedSourceSheets(current.filter(i => i !== item));
            } else {
              filters.setSelectedSourceSheets([...current, item]);
            }
          }}
          onClearAll={() => filters.setSelectedSourceSheets([])}
          onSelectAll={() => filters.setSelectedSourceSheets(availableOptions.sourceSheets)}
          showCounts={true}
          itemCounts={counts.sourceSheets}
          isFiltered={availableOptions.sourceSheets?.length < allOptions.sourceSheets?.length}
          totalCount={allOptions.sourceSheets?.length}
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