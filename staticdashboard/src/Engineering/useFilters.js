import { useState, useMemo, useCallback, useEffect } from 'react';

// Import database configurations
let databaseConfigs;
try {
  const configModule = require('../System/config');
  databaseConfigs = configModule.databaseConfigs || configModule.default || configModule;
} catch (error) {
  console.warn('Could not load config.js, using fallback configuration');
  databaseConfigs = {};
}

export const useFilters = (databaseName = 'engineering') => {
  // Get database configuration
  const dbConfig = databaseConfigs[databaseName] || databaseConfigs.engineering || {};
  
  // Basic filter states - all cleared by default
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [rangeFilters, setRangeFilters] = useState({});
  const [dateFilters, setDateFilters] = useState({});
  
  // Store raw data for filtering
  const [rawData, setRawData] = useState([]);
  
  // Flag to track initial load
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filters structure based on config columns
  useEffect(() => {
    if (dbConfig.columns && !isInitialized) {
      const textColumns = {};
      const ranges = {};
      const dates = {};
      
      // Initialize all filters in cleared state
      dbConfig.columns.forEach(col => {
        if (col.type === 'text' || col.type === 'textarea') {
          textColumns[col.name] = []; // Empty array = no filter
        } else if (col.type === 'number') {
          // Will be set with actual min/max when data loads
          ranges[col.name] = { 
            min: 0, 
            max: 100, 
            current: null // null = no filter applied
          };
        } else if (col.type === 'date') {
          dates[col.name] = { 
            enabled: false, // Disabled by default
            start: null, 
            end: null 
          };
        }
      });
      
      // Add derived fields - all cleared by default
      const derivedTextColumns = {
        'status': [],
        'risk_level': [],
        'health_status': [],
        'progress_category': [],
        'priority': []
      };
      
      const derivedRanges = {
        'delay_days': { min: -365, max: 365, current: null },
        'expected_progress': { min: 0, max: 100, current: null },
        'health_score': { min: 0, max: 100, current: null },
        'efficiency_score': { min: 0, max: 100, current: null },
        'quality_score': { min: 0, max: 100, current: null }
      };
      
      setColumnFilters({ ...textColumns, ...derivedTextColumns });
      setRangeFilters({ ...ranges, ...derivedRanges });
      setDateFilters(dates);
      setIsInitialized(true);
    }
  }, [dbConfig, isInitialized]);

  // Update range bounds based on actual data but keep filters cleared
  useEffect(() => {
    if (rawData && rawData.length > 0 && isInitialized) {
      setRangeFilters(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(field => {
          const values = rawData
            .map(d => {
              const val = parseFloat(d[field]);
              return isNaN(val) ? null : val;
            })
            .filter(v => v !== null);
          
          if (values.length > 0) {
            const min = Math.floor(Math.min(...values));
            const max = Math.ceil(Math.max(...values));
            
            updated[field] = {
              min,
              max,
              // Keep current as null (no filter) or use existing if filter is active
              current: prev[field]?.current || null
            };
          }
        });
        
        return updated;
      });
    }
  }, [rawData, isInitialized]);

  // Helper function to parse dates safely
  const parseDate = useCallback((dateString) => {
    if (!dateString || dateString === '' || dateString === 'N/A' || dateString === 'null') {
      return null;
    }
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }, []);

  // Helper function to check if date is in range
  const isDateInRange = useCallback((dateString, startDate, endDate) => {
    const date = parseDate(dateString);
    if (!date) return true; // Include null dates when filter is active
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return date >= start && date <= end;
    } else if (start) {
      return date >= start;
    } else if (end) {
      return date <= end;
    }
    return true;
  }, [parseDate]);

  // Get available options based on current data
  const availableOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {};
    }

    const options = {};
    
    // Get unique values for each potential filter field
    const allFields = new Set([
      ...Object.keys(columnFilters),
      ...dbConfig.columns?.filter(c => c.type === 'text' || c.type === 'textarea').map(c => c.name) || []
    ]);
    
    allFields.forEach(field => {
      const values = [...new Set(rawData.map(d => d[field]))]
        .filter(v => v !== null && v !== undefined && v !== '')
        .sort((a, b) => {
          // Natural sort for better ordering
          return String(a).localeCompare(String(b), undefined, { numeric: true });
        });
      options[field] = values;
    });
    
    return options;
  }, [rawData, columnFilters, dbConfig]);

  // Apply all filters to data
  const applyFilters = useCallback((data) => {
    if (!data || data.length === 0) return [];
    
    let filtered = [...data];
    
    // Text search across searchable fields
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchableFields = dbConfig.columns
        ?.filter(col => col.type === 'text' || col.type === 'textarea' || col.type === 'id')
        .map(col => col.name) || [];
      
      // Add common fields that might not be in config
      searchableFields.push('id', 'name', 'description', 'title', 'remarks');
      
      filtered = filtered.filter(item => 
        searchableFields.some(field => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }
    
    // Apply column filters (multi-select) - only if values selected
    Object.entries(columnFilters).forEach(([field, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter(item => {
          const itemValue = item[field];
          return selectedValues.includes(itemValue);
        });
      }
    });
    
    // Apply range filters - only if modified from default
    Object.entries(rangeFilters).forEach(([field, range]) => {
      if (range && range.current !== null) {
        const [min, max] = range.current;
        filtered = filtered.filter(item => {
          const value = parseFloat(item[field]);
          if (isNaN(value)) return false;
          return value >= min && value <= max;
        });
      }
    });
    
    // Apply date filters - only if enabled
    Object.entries(dateFilters).forEach(([field, filter]) => {
      if (filter && filter.enabled && (filter.start || filter.end)) {
        filtered = filtered.filter(item =>
          isDateInRange(item[field], filter.start, filter.end)
        );
      }
    });
    
    return filtered;
  }, [searchTerm, columnFilters, rangeFilters, dateFilters, dbConfig, isDateInRange]);

  // Get filtered data
  const filteredData = useMemo(() => {
    return applyFilters(rawData);
  }, [rawData, applyFilters]);

  // Set filter for a specific column
  const setColumnFilter = useCallback((column, values) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: Array.isArray(values) ? values : []
    }));
  }, []);

  // Toggle value in column filter
  const toggleColumnFilterValue = useCallback((column, value) => {
    setColumnFilters(prev => {
      const current = prev[column] || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        [column]: newValues
      };
    });
  }, []);

  // Set range filter
  const setRangeFilter = useCallback((field, range) => {
    setRangeFilters(prev => {
      const fieldConfig = prev[field] || { min: 0, max: 100 };
      return {
        ...prev,
        [field]: {
          ...fieldConfig,
          current: range && range.length === 2 ? range : null
        }
      };
    });
  }, []);

  // Set date filter
  const setDateFilter = useCallback((field, config) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: {
        enabled: config.enabled || false,
        start: config.start || null,
        end: config.end || null
      }
    }));
  }, []);

  // Clear all date filters
  const clearAllDateFilters = useCallback(() => {
    setDateFilters(prev => {
      const cleared = {};
      Object.keys(prev).forEach(field => {
        cleared[field] = { enabled: false, start: null, end: null };
      });
      return cleared;
    });
  }, []);

  // Reset all filters to cleared state
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    
    // Clear column filters
    setColumnFilters(prev => {
      const cleared = {};
      Object.keys(prev).forEach(field => {
        cleared[field] = [];
      });
      return cleared;
    });
    
    // Clear range filters (set current to null)
    setRangeFilters(prev => {
      const cleared = {};
      Object.entries(prev).forEach(([field, config]) => {
        cleared[field] = {
          ...config,
          current: null
        };
      });
      return cleared;
    });
    
    // Clear date filters
    clearAllDateFilters();
  }, [clearAllDateFilters]);

  // Get filter state for persistence
  const getFilterState = useCallback(() => ({
    searchTerm,
    columnFilters,
    rangeFilters,
    dateFilters
  }), [searchTerm, columnFilters, rangeFilters, dateFilters]);

  // Load filter state from saved configuration
  const loadFilterState = useCallback((state) => {
    if (state.searchTerm !== undefined) setSearchTerm(state.searchTerm || '');
    if (state.columnFilters !== undefined) setColumnFilters(state.columnFilters || {});
    if (state.rangeFilters !== undefined) setRangeFilters(state.rangeFilters || {});
    if (state.dateFilters !== undefined) setDateFilters(state.dateFilters || {});
  }, []);

  // Quick filter presets
  const setQuickFilter = useCallback((type) => {
    resetFilters();
    
    setTimeout(() => {
      switch(type) {
        case 'critical':
          setColumnFilter('risk_level', ['CRITICAL', 'HIGH']);
          break;
          
        case 'delayed':
          if (rangeFilters.delay_days) {
            setRangeFilter('delay_days', [1, rangeFilters.delay_days.max]);
          }
          break;
          
        case 'completed':
          setColumnFilter('status', ['COMPLETED', 'FINISHED']);
          break;
          
        case 'ongoing':
          setColumnFilter('status', ['ONGOING', 'IN_PROGRESS']);
          if (rangeFilters.physical_progress_percent) {
            setRangeFilter('physical_progress_percent', [1, 99]);
          }
          break;
          
        case 'notStarted':
          setColumnFilter('status', ['NOT_STARTED', 'PENDING']);
          if (rangeFilters.physical_progress_percent) {
            setRangeFilter('physical_progress_percent', [0, 0]);
          }
          break;
          
        case 'highBudget':
          const budgetFields = ['sd_amount_lakh', 'aa_amount_lakh', 'budget_amount', 'contract_amount'];
          const budgetField = budgetFields.find(f => rangeFilters[f]);
          if (budgetField && rangeFilters[budgetField]) {
            const max = rangeFilters[budgetField].max;
            const threshold = max * 0.7; // Top 30%
            setRangeFilter(budgetField, [threshold, max]);
          }
          break;
          
        case 'perfectPace':
          setColumnFilter('health_status', ['PERFECT_PACE', 'ON_TRACK']);
          break;
          
        case 'sleepPace':
          setColumnFilter('health_status', ['SLEEP_PACE', 'SLOW']);
          break;
          
        default:
          console.warn(`Unknown quick filter type: ${type}`);
      }
    }, 0);
  }, [resetFilters, setColumnFilter, setRangeFilter, rangeFilters]);

  // Get filter counts for UI display
  const getFilterCounts = useCallback(() => {
    const counts = {
      total: 0,
      text: searchTerm && searchTerm.trim() !== '' ? 1 : 0,
      columns: 0,
      ranges: 0,
      dates: 0
    };
    
    // Count active column filters
    Object.values(columnFilters).forEach(values => {
      if (values && values.length > 0) counts.columns++;
    });
    
    // Count active range filters
    Object.values(rangeFilters).forEach(range => {
      if (range && range.current !== null) counts.ranges++;
    });
    
    // Count active date filters
    Object.values(dateFilters).forEach(filter => {
      if (filter && filter.enabled) counts.dates++;
    });
    
    counts.total = counts.text + counts.columns + counts.ranges + counts.dates;
    return counts;
  }, [searchTerm, columnFilters, rangeFilters, dateFilters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return getFilterCounts().total > 0;
  }, [getFilterCounts]);

  // Get date bounds from data for a specific field
  const getDateBounds = useCallback((field) => {
    const dates = rawData
      .map(item => parseDate(item[field]))
      .filter(date => date !== null);
    
    if (dates.length === 0) return { min: null, max: null };
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }, [rawData, parseDate]);

  // Date statistics for all date fields
  const dateStatistics = useMemo(() => {
    const stats = {};
    
    if (dbConfig.columns) {
      dbConfig.columns
        .filter(col => col.type === 'date')
        .forEach(col => {
          stats[col.name] = getDateBounds(col.name);
        });
    }
    
    return stats;
  }, [dbConfig, getDateBounds]);

  // Backwards compatibility mappings for existing components
  const backwardsCompatibilityMappings = useMemo(() => ({
    // Status filters
    selectedStatuses: columnFilters.status || [],
    setSelectedStatuses: (values) => setColumnFilter('status', values),
    
    // Risk filters
    selectedRiskLevels: columnFilters.risk_level || [],
    setSelectedRiskLevels: (values) => setColumnFilter('risk_level', values),
    
    // Health filters
    selectedHealthStatuses: columnFilters.health_status || [],
    setSelectedHealthStatuses: (values) => setColumnFilter('health_status', values),
    
    // Progress category filters
    selectedProgressCategories: columnFilters.progress_category || [],
    setSelectedProgressCategories: (values) => setColumnFilter('progress_category', values),
    
    // Budget head filters
    selectedBudgetHeads: columnFilters.budget_head || [],
    setSelectedBudgetHeads: (values) => setColumnFilter('budget_head', values),
    
    // Agency filters
    selectedAgencies: columnFilters.executive_agency || [],
    setSelectedAgencies: (values) => setColumnFilter('executive_agency', values),
    
    // Location filters
    selectedFrontierHQs: columnFilters.ftr_hq_name || [],
    setSelectedFrontierHQs: (values) => setColumnFilter('ftr_hq_name', values),
    selectedSectorHQs: columnFilters.shq_name || [],
    setSelectedSectorHQs: (values) => setColumnFilter('shq_name', values),
    selectedLocations: columnFilters.location || [],
    setSelectedLocations: (values) => setColumnFilter('location', values),
    
    // Contractor filters
    selectedContractors: columnFilters.firm_name || [],
    setSelectedContractors: (values) => setColumnFilter('firm_name', values),
    
    // Scheme filters
    selectedSchemes: columnFilters.name_of_scheme || [],
    setSelectedSchemes: (values) => setColumnFilter('name_of_scheme', values),
    
    // Range filters compatibility
    progressRange: rangeFilters.physical_progress_percent?.current || [0, 100],
    setProgressRange: (range) => setRangeFilter('physical_progress_percent', range),
    
    amountRange: rangeFilters.sd_amount_lakh?.current || [0, 100000],
    setAmountRange: (range) => setRangeFilter('sd_amount_lakh', range),
    
    delayRange: rangeFilters.delay_days?.current || [-365, 365],
    setDelayRange: (range) => setRangeFilter('delay_days', range),
    
    efficiencyRange: rangeFilters.efficiency_score?.current || [0, 100],
    setEfficiencyRange: (range) => setRangeFilter('efficiency_score', range),
    
    healthRange: rangeFilters.health_score?.current || [0, 100],
    setHealthRange: (range) => setRangeFilter('health_score', range),
    
    expectedProgressRange: rangeFilters.expected_progress?.current || [0, 100],
    setExpectedProgressRange: (range) => setRangeFilter('expected_progress', range),
    
    // Toggle functions for backwards compatibility
    toggleStatus: (status) => toggleColumnFilterValue('status', status),
    toggleRiskLevel: (level) => toggleColumnFilterValue('risk_level', level),
    toggleScheme: (scheme) => toggleColumnFilterValue('name_of_scheme', scheme),
    toggleAgency: (agency) => toggleColumnFilterValue('executive_agency', agency),
    toggleFrontierHQ: (hq) => toggleColumnFilterValue('ftr_hq_name', hq),
    toggleSectorHQ: (hq) => toggleColumnFilterValue('shq_name', hq),
    toggleContractor: (contractor) => toggleColumnFilterValue('firm_name', contractor),
    toggleLocation: (location) => toggleColumnFilterValue('location', location),
    toggleProgressCategory: (cat) => toggleColumnFilterValue('progress_category', cat),
    toggleHealthStatus: (status) => toggleColumnFilterValue('health_status', status)
  }), [columnFilters, rangeFilters, setColumnFilter, setRangeFilter, toggleColumnFilterValue]);

  return {
    // Core filter functionality
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilter,
    toggleColumnFilterValue,
    rangeFilters,
    setRangeFilter,
    dateFilters,
    setDateFilter,
    clearAllDateFilters,
    
    // Data management
    rawData,
    setRawData,
    filteredData,
    availableOptions,
    
    // Utility functions
    resetFilters,
    getFilterState,
    loadFilterState,
    setQuickFilter,
    getFilterCounts,
    hasActiveFilters,
    dateStatistics,
    
    // Database configuration
    databaseConfig: dbConfig,
    
    // Backwards compatibility - spread all mappings
    ...backwardsCompatibilityMappings
  };
};