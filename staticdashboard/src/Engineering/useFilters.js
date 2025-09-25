import { useState, useMemo, useCallback, useEffect } from 'react';

export const useFilters = () => {
  // Basic filters - now using arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState([]);
  const [selectedBudgetHeads, setSelectedBudgetHeads] = useState([]);
  const [selectedAgencies, setSelectedAgencies] = useState([]);
  const [selectedFrontierHQs, setSelectedFrontierHQs] = useState([]);
  const [selectedSectorHQs, setSelectedSectorHQs] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedSchemes, setSelectedSchemes] = useState([]);
  
  // NEW: Physical progress categories filter
  const [selectedProgressCategories, setSelectedProgressCategories] = useState([]);
  
  // NEW: Health status filter
  const [selectedHealthStatuses, setSelectedHealthStatuses] = useState([]);
  
  // Range filters
  const [progressRange, setProgressRange] = useState([0, 100]);
  const [amountRange, setAmountRange] = useState([0, 1000000]);
  const [delayRange, setDelayRange] = useState([0, 5000]);
  const [efficiencyRange, setEfficiencyRange] = useState([0, 100]);
  const [healthRange, setHealthRange] = useState([0, 100]);
  
  // NEW: Expected progress range filter
  const [expectedProgressRange, setExpectedProgressRange] = useState([0, 100]);
  
  // Date range filters
  const [dateFilters, setDateFilters] = useState({
    tenderDate: { enabled: false, start: null, end: null },
    awardDate: { enabled: false, start: null, end: null },
    acceptanceDate: { enabled: false, start: null, end: null },
    pdcDate: { enabled: false, start: null, end: null },
    revisedPdcDate: { enabled: false, start: null, end: null },
    completionDate: { enabled: false, start: null, end: null }
  });
  
  // Store raw data for filtering
  const [rawData, setRawData] = useState([]);

  // Debug logging for schemes
  useEffect(() => {
    if (selectedSchemes.length > 0) {
      console.log('[useFilters] Schemes selected:', selectedSchemes);
      console.log('[useFilters] Raw data sample:', rawData.slice(0, 3).map(d => ({
        scheme_name: d.scheme_name,
        id: d.id
      })));
    }
  }, [selectedSchemes, rawData]);

  // Helper function to parse dates safely
  const parseDate = useCallback((dateString) => {
    if (!dateString || dateString === '' || dateString === 'N/A') return null;
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
    if (!date) return false;
    
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

  // Set individual date filter
  const setDateFilter = useCallback((filterType, config) => {
    setDateFilters(prev => ({
      ...prev,
      [filterType]: { ...prev[filterType], ...config }
    }));
  }, []);

  // Clear all date filters
  const clearAllDateFilters = useCallback(() => {
    setDateFilters({
      tenderDate: { enabled: false, start: null, end: null },
      awardDate: { enabled: false, start: null, end: null },
      acceptanceDate: { enabled: false, start: null, end: null },
      pdcDate: { enabled: false, start: null, end: null },
      revisedPdcDate: { enabled: false, start: null, end: null },
      completionDate: { enabled: false, start: null, end: null }
    });
  }, []);

  // Get date range bounds from data
  const getDateBounds = useCallback((data, field) => {
    const dates = data
      .map(item => parseDate(item[field]))
      .filter(date => date !== null);
    
    if (dates.length === 0) return { min: null, max: null };
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }, [parseDate]);

  // Calculate date statistics
  const dateStatistics = useMemo(() => {
    if (!rawData || rawData.length === 0) return {};
    
    return {
      tenderDate: getDateBounds(rawData, 'date_tender'),
      awardDate: getDateBounds(rawData, 'date_award'),
      acceptanceDate: getDateBounds(rawData, 'date_acceptance'),
      pdcDate: getDateBounds(rawData, 'pdc_agreement'),
      revisedPdcDate: getDateBounds(rawData, 'revised_pdc'),
      completionDate: getDateBounds(rawData, 'actual_completion_date')
    };
  }, [rawData, getDateBounds]);

  // Compute available options based on current filters
  const availableOptions = useMemo(() => {
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

    // Start with all data
    let filteredForOptions = [...rawData];

    // Apply filters progressively to get available options
    const applyFiltersExcept = (data, exceptFilters = []) => {
      let filtered = [...data];

      // Text search
      if (searchTerm && !exceptFilters.includes('search')) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          item.scheme_name?.toLowerCase().includes(searchLower) ||
          item.work_site?.toLowerCase().includes(searchLower) ||
          item.firm_name?.toLowerCase().includes(searchLower) ||
          item.executive_agency?.toLowerCase().includes(searchLower) ||
          item.budget_head?.toLowerCase().includes(searchLower) ||
          item.serial_no?.toString().includes(searchTerm) ||
          item.ftr_hq?.toLowerCase().includes(searchLower) ||
          item.shq?.toLowerCase().includes(searchLower) ||
          item.remarks?.toLowerCase().includes(searchLower)
        );
      }

      // Apply multi-select filters conditionally
      if (selectedStatuses.length > 0 && !exceptFilters.includes('status')) {
        filtered = filtered.filter(item => selectedStatuses.includes(item.status));
      }

      if (selectedRiskLevels.length > 0 && !exceptFilters.includes('risk')) {
        filtered = filtered.filter(item => selectedRiskLevels.includes(item.risk_level));
      }

      if (selectedBudgetHeads.length > 0 && !exceptFilters.includes('budget')) {
        filtered = filtered.filter(item => selectedBudgetHeads.includes(item.budget_head));
      }

      if (selectedAgencies.length > 0 && !exceptFilters.includes('agency')) {
        filtered = filtered.filter(item => selectedAgencies.includes(item.executive_agency));
      }

      if (selectedFrontierHQs.length > 0 && !exceptFilters.includes('frontier')) {
        filtered = filtered.filter(item => selectedFrontierHQs.includes(item.ftr_hq));
      }

      if (selectedSectorHQs.length > 0 && !exceptFilters.includes('sector')) {
        filtered = filtered.filter(item => selectedSectorHQs.includes(item.shq));
      }

      if (selectedContractors.length > 0 && !exceptFilters.includes('contractor')) {
        filtered = filtered.filter(item => selectedContractors.includes(item.firm_name));
      }

      if (selectedLocations.length > 0 && !exceptFilters.includes('location')) {
        filtered = filtered.filter(item => {
          const location = item.work_site?.split(',')[0]?.trim();
          return selectedLocations.some(selected => 
            location?.toLowerCase().includes(selected.toLowerCase())
          );
        });
      }

      // FIXED: Enhanced scheme filtering with better matching
      if (selectedSchemes.length > 0 && !exceptFilters.includes('scheme')) {
        console.log('[applyFiltersExcept] Filtering by schemes:', selectedSchemes);
        const beforeCount = filtered.length;
        filtered = filtered.filter(item => {
          if (!item.scheme_name) return false;
          // Trim and normalize the scheme name for comparison
          const normalizedItemScheme = item.scheme_name.trim();
          const isIncluded = selectedSchemes.some(scheme => {
            const normalizedSelectedScheme = scheme.trim();
            return normalizedItemScheme === normalizedSelectedScheme;
          });
          return isIncluded;
        });
        console.log(`[applyFiltersExcept] Scheme filter: ${beforeCount} -> ${filtered.length} items`);
      }

      // NEW: Progress categories filter
      if (selectedProgressCategories.length > 0 && !exceptFilters.includes('progressCategory')) {
        filtered = filtered.filter(item => selectedProgressCategories.includes(item.progress_category));
      }

      // NEW: Health status filter
      if (selectedHealthStatuses.length > 0 && !exceptFilters.includes('healthStatus')) {
        filtered = filtered.filter(item => selectedHealthStatuses.includes(item.health_status));
      }

      // Apply range filters
      filtered = filtered.filter(item => {
        const progress = item.physical_progress || 0;
        return progress >= progressRange[0] && progress <= progressRange[1];
      });

      filtered = filtered.filter(item => {
        const amount = item.sanctioned_amount || 0;
        return amount >= amountRange[0] && amount <= amountRange[1];
      });

      filtered = filtered.filter(item => {
        const delay = item.delay_days || 0;
        return delay >= delayRange[0] && delay <= delayRange[1];
      });

      filtered = filtered.filter(item => {
        const efficiency = item.efficiency_score || 0;
        return efficiency >= efficiencyRange[0] && efficiency <= efficiencyRange[1];
      });

      filtered = filtered.filter(item => {
        const health = item.health_score || 0;
        return health >= healthRange[0] && health <= healthRange[1];
      });

      // NEW: Expected progress range filter
      filtered = filtered.filter(item => {
        const expectedProgress = item.expected_progress || 0;
        return expectedProgress >= expectedProgressRange[0] && expectedProgress <= expectedProgressRange[1];
      });

      // Apply date filters
      if (dateFilters.tenderDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item => 
          isDateInRange(item.date_tender, dateFilters.tenderDate.start, dateFilters.tenderDate.end)
        );
      }

      if (dateFilters.awardDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item =>
          isDateInRange(item.date_award, dateFilters.awardDate.start, dateFilters.awardDate.end)
        );
      }

      if (dateFilters.acceptanceDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item =>
          isDateInRange(item.date_acceptance, dateFilters.acceptanceDate.start, dateFilters.acceptanceDate.end)
        );
      }

      if (dateFilters.pdcDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item =>
          isDateInRange(item.pdc_agreement, dateFilters.pdcDate.start, dateFilters.pdcDate.end)
        );
      }

      if (dateFilters.revisedPdcDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item =>
          isDateInRange(item.revised_pdc, dateFilters.revisedPdcDate.start, dateFilters.revisedPdcDate.end)
        );
      }

      if (dateFilters.completionDate.enabled && !exceptFilters.includes('dates')) {
        filtered = filtered.filter(item =>
          isDateInRange(item.actual_completion_date, dateFilters.completionDate.start, dateFilters.completionDate.end)
        );
      }

      return filtered;
    };

    // Compute available options for each filter based on other active filters
    const statusFiltered = applyFiltersExcept(rawData, ['status']);
    const riskFiltered = applyFiltersExcept(rawData, ['risk']);
    const budgetFiltered = applyFiltersExcept(rawData, ['budget']);
    const agencyFiltered = applyFiltersExcept(rawData, ['agency']);
    const frontierFiltered = applyFiltersExcept(rawData, ['frontier']);
    const sectorFiltered = applyFiltersExcept(rawData, ['sector']);
    const contractorFiltered = applyFiltersExcept(rawData, ['contractor']);
    const locationFiltered = applyFiltersExcept(rawData, ['location']);
    const schemeFiltered = applyFiltersExcept(rawData, ['scheme']);
    const progressCategoryFiltered = applyFiltersExcept(rawData, ['progressCategory']);
    const healthStatusFiltered = applyFiltersExcept(rawData, ['healthStatus']);

    return {
      statuses: ['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED', 'TENDER_PROGRESS', 'TENDERED', 'UNKNOWN']
        .filter(status => statusFiltered.some(item => item.status === status)),
      
      riskLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        .filter(level => riskFiltered.some(item => item.risk_level === level)),
      
      budgetHeads: [...new Set(budgetFiltered.map(d => d.budget_head))]
        .filter(Boolean)
        .sort(),
      
      agencies: [...new Set(agencyFiltered.map(d => d.executive_agency))]
        .filter(Boolean)
        .sort(),
      
      frontierHQs: [...new Set(frontierFiltered.map(d => d.ftr_hq))]
        .filter(Boolean)
        .sort(),
      
      sectorHQs: [...new Set(sectorFiltered.map(d => d.shq))]
        .filter(Boolean)
        .sort(),
      
      contractors: [...new Set(contractorFiltered.map(d => d.firm_name))]
        .filter(Boolean)
        .sort(),
      
      locations: [...new Set(locationFiltered.map(d => d.work_site?.split(',')[0]))]
        .filter(Boolean)
        .sort(),
      
      // FIXED: Ensure scheme names are properly extracted and trimmed
      schemes: [...new Set(schemeFiltered.map(d => d.scheme_name?.trim()))]
        .filter(Boolean)
        .sort(),
      
      // NEW: Progress categories
      progressCategories: [
        'TENDER_PROGRESS', 
        'TENDERED_NOT_AWARDED', 
        'AWARDED_NOT_STARTED', 
        'NOT_STARTED',
        'PROGRESS_1_TO_50', 
        'PROGRESS_51_TO_71', 
        'PROGRESS_71_TO_99', 
        'COMPLETED'
      ].filter(category => progressCategoryFiltered.some(item => item.progress_category === category)),
      
      // NEW: Health statuses
      healthStatuses: [
        'PERFECT_PACE',
        'SLOW_PACE',
        'BAD_PACE',
        'SLEEP_PACE',
        'PAYMENT_PENDING',
        'NOT_APPLICABLE'
      ].filter(status => healthStatusFiltered.some(item => item.health_status === status))
    };
  }, [
    rawData,
    searchTerm,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedContractors,
    selectedLocations,
    selectedSchemes,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange,
    expectedProgressRange,
    dateFilters,
    isDateInRange
  ]);

  // Get related mappings for intelligent filtering
  const getRelatedMappings = useCallback(() => {
    if (!rawData || rawData.length === 0) return {};

    const mappings = {
      frontierToSectors: {},
      sectorToFrontier: {},
      frontierToLocations: {},
      sectorToLocations: {},
      agencyToLocations: {},
      contractorToLocations: {},
      budgetToAgencies: {},
      agencyToBudgets: {}
    };

    rawData.forEach(item => {
      const frontier = item.ftr_hq;
      const sector = item.shq;
      const location = item.work_site?.split(',')[0]?.trim();
      const agency = item.executive_agency;
      const contractor = item.firm_name;
      const budget = item.budget_head;

      // Map frontier to sectors
      if (frontier && sector) {
        if (!mappings.frontierToSectors[frontier]) {
          mappings.frontierToSectors[frontier] = new Set();
        }
        mappings.frontierToSectors[frontier].add(sector);

        if (!mappings.sectorToFrontier[sector]) {
          mappings.sectorToFrontier[sector] = frontier;
        }
      }

      // Map frontier to locations
      if (frontier && location) {
        if (!mappings.frontierToLocations[frontier]) {
          mappings.frontierToLocations[frontier] = new Set();
        }
        mappings.frontierToLocations[frontier].add(location);
      }

      // Map sector to locations
      if (sector && location) {
        if (!mappings.sectorToLocations[sector]) {
          mappings.sectorToLocations[sector] = new Set();
        }
        mappings.sectorToLocations[sector].add(location);
      }

      // Map agency to locations
      if (agency && location) {
        if (!mappings.agencyToLocations[agency]) {
          mappings.agencyToLocations[agency] = new Set();
        }
        mappings.agencyToLocations[agency].add(location);
      }

      // Map contractor to locations
      if (contractor && location) {
        if (!mappings.contractorToLocations[contractor]) {
          mappings.contractorToLocations[contractor] = new Set();
        }
        mappings.contractorToLocations[contractor].add(location);
      }

      // Map budget to agencies
      if (budget && agency) {
        if (!mappings.budgetToAgencies[budget]) {
          mappings.budgetToAgencies[budget] = new Set();
        }
        mappings.budgetToAgencies[budget].add(agency);

        if (!mappings.agencyToBudgets[agency]) {
          mappings.agencyToBudgets[agency] = new Set();
        }
        mappings.agencyToBudgets[agency].add(budget);
      }
    });

    // Convert Sets to Arrays for easier use
    Object.keys(mappings).forEach(key => {
      if (typeof mappings[key] === 'object' && !(mappings[key] instanceof Set)) {
        Object.keys(mappings[key]).forEach(subKey => {
          if (mappings[key][subKey] instanceof Set) {
            mappings[key][subKey] = Array.from(mappings[key][subKey]);
          }
        });
      }
    });

    return mappings;
  }, [rawData]);

  // Filter function updated for multi-select including frontier and sector HQs
  const applyFilters = useCallback((data) => {
    let filtered = [...data];
    console.log('[applyFilters] Starting with', filtered.length, 'items');

    // Text search - also search in scheme names
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.scheme_name?.toLowerCase().includes(searchLower) ||
        item.work_site?.toLowerCase().includes(searchLower) ||
        item.firm_name?.toLowerCase().includes(searchLower) ||
        item.executive_agency?.toLowerCase().includes(searchLower) ||
        item.budget_head?.toLowerCase().includes(searchLower) ||
        item.serial_no?.toString().includes(searchTerm) ||
        item.ftr_hq?.toLowerCase().includes(searchLower) ||
        item.shq?.toLowerCase().includes(searchLower) ||
        item.remarks?.toLowerCase().includes(searchLower)
      );
      console.log('[applyFilters] After search:', filtered.length, 'items');
    }

    // FIXED: Enhanced scheme name filter with debugging
    if (selectedSchemes.length > 0) {
      console.log('[applyFilters] Filtering by schemes:', selectedSchemes);
      const beforeCount = filtered.length;
      
      // Create normalized scheme set for faster lookup
      const normalizedSelectedSchemes = new Set(
        selectedSchemes.map(s => s?.trim())
      );
      
      filtered = filtered.filter(item => {
        if (!item.scheme_name) {
          console.log('[applyFilters] Item has no scheme_name:', item.serial_no);
          return false;
        }
        const normalizedItemScheme = item.scheme_name.trim();
        const isIncluded = normalizedSelectedSchemes.has(normalizedItemScheme);
        
        if (!isIncluded && selectedSchemes.length <= 3) {
          // Log details for first few schemes to debug
          console.log('[applyFilters] Scheme not matched:', {
            itemScheme: normalizedItemScheme,
            selectedSchemes: Array.from(normalizedSelectedSchemes)
          });
        }
        
        return isIncluded;
      });
      
      console.log(`[applyFilters] Scheme filter: ${beforeCount} -> ${filtered.length} items`);
    }

    // Multi-select filters - only apply if selections made
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
      console.log('[applyFilters] After status filter:', filtered.length, 'items');
    }

    if (selectedRiskLevels.length > 0) {
      filtered = filtered.filter(item => selectedRiskLevels.includes(item.risk_level));
      console.log('[applyFilters] After risk filter:', filtered.length, 'items');
    }

    if (selectedBudgetHeads.length > 0) {
      filtered = filtered.filter(item => selectedBudgetHeads.includes(item.budget_head));
      console.log('[applyFilters] After budget head filter:', filtered.length, 'items');
    }

    if (selectedAgencies.length > 0) {
      filtered = filtered.filter(item => selectedAgencies.includes(item.executive_agency));
      console.log('[applyFilters] After agency filter:', filtered.length, 'items');
    }

    if (selectedFrontierHQs.length > 0) {
      filtered = filtered.filter(item => selectedFrontierHQs.includes(item.ftr_hq));
      console.log('[applyFilters] After frontier HQ filter:', filtered.length, 'items');
    }

    if (selectedSectorHQs.length > 0) {
      filtered = filtered.filter(item => selectedSectorHQs.includes(item.shq));
      console.log('[applyFilters] After sector HQ filter:', filtered.length, 'items');
    }

    if (selectedContractors.length > 0) {
      filtered = filtered.filter(item => selectedContractors.includes(item.firm_name));
      console.log('[applyFilters] After contractor filter:', filtered.length, 'items');
    }

    if (selectedLocations.length > 0) {
      filtered = filtered.filter(item => {
        const location = item.work_site?.split(',')[0]?.trim();
        return selectedLocations.some(selected => 
          location?.toLowerCase().includes(selected.toLowerCase())
        );
      });
      console.log('[applyFilters] After location filter:', filtered.length, 'items');
    }

    // NEW: Progress category filter
    if (selectedProgressCategories.length > 0) {
      filtered = filtered.filter(item => selectedProgressCategories.includes(item.progress_category));
      console.log('[applyFilters] After progress category filter:', filtered.length, 'items');
    }

    // NEW: Health status filter
    if (selectedHealthStatuses.length > 0) {
      filtered = filtered.filter(item => selectedHealthStatuses.includes(item.health_status));
      console.log('[applyFilters] After health status filter:', filtered.length, 'items');
    }

    // Range filters
    filtered = filtered.filter(item => {
      const progress = item.physical_progress || 0;
      return progress >= progressRange[0] && progress <= progressRange[1];
    });

    filtered = filtered.filter(item => {
      const amount = item.sanctioned_amount || 0;
      return amount >= amountRange[0] && amount <= amountRange[1];
    });

    filtered = filtered.filter(item => {
      const delay = item.delay_days || 0;
      return delay >= delayRange[0] && delay <= delayRange[1];
    });

    filtered = filtered.filter(item => {
      const efficiency = item.efficiency_score || 0;
      return efficiency >= efficiencyRange[0] && efficiency <= efficiencyRange[1];
    });

    filtered = filtered.filter(item => {
      const health = item.health_score || 0;
      return health >= healthRange[0] && health <= healthRange[1];
    });

    // NEW: Expected progress range filter
    filtered = filtered.filter(item => {
      const expectedProgress = item.expected_progress || 0;
      return expectedProgress >= expectedProgressRange[0] && expectedProgress <= expectedProgressRange[1];
    });

    // Date filters
    if (dateFilters.tenderDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.date_tender, dateFilters.tenderDate.start, dateFilters.tenderDate.end)
      );
    }

    if (dateFilters.awardDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.date_award, dateFilters.awardDate.start, dateFilters.awardDate.end)
      );
    }

    if (dateFilters.acceptanceDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.date_acceptance, dateFilters.acceptanceDate.start, dateFilters.acceptanceDate.end)
      );
    }

    if (dateFilters.pdcDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.pdc_agreement, dateFilters.pdcDate.start, dateFilters.pdcDate.end)
      );
    }

    if (dateFilters.revisedPdcDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.revised_pdc, dateFilters.revisedPdcDate.start, dateFilters.revisedPdcDate.end)
      );
    }

    if (dateFilters.completionDate.enabled) {
      filtered = filtered.filter(item =>
        isDateInRange(item.actual_completion_date, dateFilters.completionDate.start, dateFilters.completionDate.end)
      );
    }

    console.log('[applyFilters] Final result:', filtered.length, 'items');
    return filtered;
  }, [
    searchTerm, 
    selectedSchemes,
    selectedStatuses, 
    selectedRiskLevels, 
    selectedBudgetHeads,
    selectedAgencies, 
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedContractors, 
    selectedLocations,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange, 
    amountRange, 
    delayRange, 
    efficiencyRange, 
    healthRange,
    expectedProgressRange,
    dateFilters,
    isDateInRange
  ]);

  // Get filtered data
  const filteredData = useMemo(() => {
    const result = applyFilters(rawData);
    console.log('[filteredData] Computed:', result.length, 'items from', rawData.length, 'raw items');
    return result;
  }, [rawData, applyFilters]);

  // ENHANCED: Wrapped setSelectedSchemes to add logging
  const wrappedSetSelectedSchemes = useCallback((newSchemes) => {
    console.log('[useFilters] setSelectedSchemes called with:', newSchemes);
    setSelectedSchemes(newSchemes);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    console.log('[useFilters] Resetting all filters');
    setSearchTerm('');
    setSelectedSchemes([]);
    setSelectedStatuses([]);
    setSelectedRiskLevels([]);
    setSelectedBudgetHeads([]);
    setSelectedAgencies([]);
    setSelectedFrontierHQs([]);
    setSelectedSectorHQs([]);
    setSelectedContractors([]);
    setSelectedLocations([]);
    setSelectedProgressCategories([]);
    setSelectedHealthStatuses([]);
    setProgressRange([0, 100]);
    
    // Reset amount range to actual data range
    const maxAmount = rawData.length > 0 
      ? Math.max(...rawData.map(d => d.sanctioned_amount || 0))
      : 100000;
    setAmountRange([0, maxAmount]);
    
    setDelayRange([0, 3684]);
    setEfficiencyRange([0, 100]);
    setHealthRange([0, 100]);
    setExpectedProgressRange([0, 100]);
    
    // Reset date filters
    clearAllDateFilters();
  }, [rawData, clearAllDateFilters]);

  // Get current filter state
  const getFilterState = useCallback(() => ({
    searchTerm,
    selectedSchemes,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedContractors,
    selectedLocations,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange,
    expectedProgressRange,
    dateFilters
  }), [
    searchTerm,
    selectedSchemes,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedContractors,
    selectedLocations,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange,
    expectedProgressRange,
    dateFilters
  ]);

  // Load filter state
  const loadFilterState = useCallback((state) => {
    console.log('[useFilters] Loading filter state:', state);
    if (state.searchTerm !== undefined) setSearchTerm(state.searchTerm);
    if (state.selectedSchemes !== undefined) setSelectedSchemes(state.selectedSchemes);
    if (state.selectedStatuses !== undefined) setSelectedStatuses(state.selectedStatuses);
    if (state.selectedRiskLevels !== undefined) setSelectedRiskLevels(state.selectedRiskLevels);
    if (state.selectedBudgetHeads !== undefined) setSelectedBudgetHeads(state.selectedBudgetHeads);
    if (state.selectedAgencies !== undefined) setSelectedAgencies(state.selectedAgencies);
    if (state.selectedFrontierHQs !== undefined) setSelectedFrontierHQs(state.selectedFrontierHQs);
    if (state.selectedSectorHQs !== undefined) setSelectedSectorHQs(state.selectedSectorHQs);
    // Handle legacy selectedFrontiers for backwards compatibility
    if (state.selectedFrontiers !== undefined && state.selectedFrontierHQs === undefined) {
      setSelectedFrontierHQs(state.selectedFrontiers);
    }
    if (state.selectedContractors !== undefined) setSelectedContractors(state.selectedContractors);
    if (state.selectedLocations !== undefined) setSelectedLocations(state.selectedLocations);
    if (state.selectedProgressCategories !== undefined) setSelectedProgressCategories(state.selectedProgressCategories);
    if (state.selectedHealthStatuses !== undefined) setSelectedHealthStatuses(state.selectedHealthStatuses);
    if (state.progressRange !== undefined) setProgressRange(state.progressRange);
    if (state.amountRange !== undefined) setAmountRange(state.amountRange);
    if (state.delayRange !== undefined) setDelayRange(state.delayRange);
    if (state.efficiencyRange !== undefined) setEfficiencyRange(state.efficiencyRange);
    if (state.healthRange !== undefined) setHealthRange(state.healthRange);
    if (state.expectedProgressRange !== undefined) setExpectedProgressRange(state.expectedProgressRange);
    if (state.dateFilters !== undefined) setDateFilters(state.dateFilters);
  }, []);

  // Quick filter presets - Updated with new health and progress filters
  const setQuickFilter = useCallback((type) => {
    console.log('[useFilters] Setting quick filter:', type);
    resetFilters();
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    switch(type) {
      case 'critical':
        setSelectedRiskLevels(['CRITICAL']);
        break;
      case 'delayed':
        setDelayRange([1, 365]);
        break;
      case 'completed':
        setSelectedStatuses(['COMPLETED']);
        break;
      case 'ongoing':
        setProgressRange([1, 99]);
        break;
      case 'notStarted':
        setSelectedStatuses(['NOT_STARTED']);
        break;
      case 'highBudget':
        const maxAmount = rawData.length > 0 
          ? Math.max(...rawData.map(d => d.sanctioned_amount || 0))
          : 100000;
        setAmountRange([50000, maxAmount]);
        break;
      case 'lowHealth':
        setHealthRange([0, 50]);
        break;
      case 'highEfficiency':
        setEfficiencyRange([70, 100]);
        break;
      case 'overdue':
        setDelayRange([90, 365]);
        break;
      case 'nearCompletion':
        setProgressRange([75, 99]);
        break;
      // NEW: Health-based quick filters
      case 'perfectPace':
        setSelectedHealthStatuses(['PERFECT_PACE']);
        break;
      case 'slowPace':
        setSelectedHealthStatuses(['SLOW_PACE']);
        break;
      case 'badPace':
        setSelectedHealthStatuses(['BAD_PACE']);
        break;
      case 'sleepPace':
        setSelectedHealthStatuses(['SLEEP_PACE']);
        break;
      case 'paymentPending':
        setSelectedHealthStatuses(['PAYMENT_PENDING']);
        break;
      case 'tenderProgress':
        setSelectedProgressCategories(['TENDER_PROGRESS']);
        break;
      case 'tenderedNotAwarded':
        setSelectedProgressCategories(['TENDERED_NOT_AWARDED']);
        break;
      case 'awardedNotStarted':
        setSelectedProgressCategories(['AWARDED_NOT_STARTED']);
        break;
      case 'progress1To50':
        setSelectedProgressCategories(['PROGRESS_1_TO_50']);
        break;
      case 'progress51To71':
        setSelectedProgressCategories(['PROGRESS_51_TO_71']);
        break;
      case 'progress71To99':
        setSelectedProgressCategories(['PROGRESS_71_TO_99']);
        break;
      // Date-based quick filters
      case 'recentlyAwarded':
        setDateFilter('awardDate', {
          enabled: true,
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'awardedThisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setDateFilter('awardDate', {
          enabled: true,
          start: yearStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'completedRecently':
        setDateFilter('completionDate', {
          enabled: true,
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'oldProjects':
        setDateFilter('awardDate', {
          enabled: true,
          start: null,
          end: oneYearAgo.toISOString().split('T')[0]
        });
        break;
      default:
        break;
    }
  }, [rawData, resetFilters, setDateFilter]);

  // Toggle individual items in multi-select
  const toggleStatus = useCallback((status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  const toggleRiskLevel = useCallback((level) => {
    setSelectedRiskLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  }, []);

  const toggleScheme = useCallback((scheme) => {
    console.log('[useFilters] toggleScheme called with:', scheme);
    setSelectedSchemes(prev => {
      const newSchemes = prev.includes(scheme)
        ? prev.filter(s => s !== scheme)
        : [...prev, scheme];
      console.log('[useFilters] toggleScheme updating from', prev, 'to', newSchemes);
      return newSchemes;
    });
  }, []);

  const toggleAgency = useCallback((agency) => {
    setSelectedAgencies(prev =>
      prev.includes(agency)
        ? prev.filter(a => a !== agency)
        : [...prev, agency]
    );
  }, []);

  const toggleFrontierHQ = useCallback((frontierHQ) => {
    setSelectedFrontierHQs(prev =>
      prev.includes(frontierHQ)
        ? prev.filter(f => f !== frontierHQ)
        : [...prev, frontierHQ]
    );
  }, []);

  const toggleSectorHQ = useCallback((sectorHQ) => {
    setSelectedSectorHQs(prev =>
      prev.includes(sectorHQ)
        ? prev.filter(s => s !== sectorHQ)
        : [...prev, sectorHQ]
    );
  }, []);

  const toggleContractor = useCallback((contractor) => {
    setSelectedContractors(prev =>
      prev.includes(contractor)
        ? prev.filter(c => c !== contractor)
        : [...prev, contractor]
    );
  }, []);

  const toggleLocation = useCallback((location) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  }, []);

  // NEW: Toggle progress category
  const toggleProgressCategory = useCallback((category) => {
    setSelectedProgressCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  // NEW: Toggle health status
  const toggleHealthStatus = useCallback((status) => {
    setSelectedHealthStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  // Batch operations for multi-select
  const selectAllStatuses = useCallback(() => {
    setSelectedStatuses(['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED', 'TENDER_PROGRESS', 'TENDERED', 'UNKNOWN']);
  }, []);

  const clearAllStatuses = useCallback(() => {
    setSelectedStatuses([]);
  }, []);

  const selectAllRiskLevels = useCallback(() => {
    setSelectedRiskLevels(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
  }, []);

  const clearAllRiskLevels = useCallback(() => {
    setSelectedRiskLevels([]);
  }, []);

  const selectAllSchemes = useCallback(() => {
    if (rawData && rawData.length > 0) {
      const allSchemes = [...new Set(rawData.map(d => d.scheme_name?.trim()))].filter(Boolean);
      console.log('[useFilters] selectAllSchemes:', allSchemes);
      setSelectedSchemes(allSchemes);
    }
  }, [rawData]);

  const clearAllSchemes = useCallback(() => {
    console.log('[useFilters] clearAllSchemes');
    setSelectedSchemes([]);
  }, []);

  const selectAllFrontierHQs = useCallback(() => {
    if (rawData && rawData.length > 0) {
      const allFrontierHQs = [...new Set(rawData.map(d => d.ftr_hq))].filter(Boolean);
      setSelectedFrontierHQs(allFrontierHQs);
    }
  }, [rawData]);

  const clearAllFrontierHQs = useCallback(() => {
    setSelectedFrontierHQs([]);
  }, []);

  const selectAllSectorHQs = useCallback(() => {
    if (rawData && rawData.length > 0) {
      const allSectorHQs = [...new Set(rawData.map(d => d.shq))].filter(Boolean);
      setSelectedSectorHQs(allSectorHQs);
    }
  }, [rawData]);

  const clearAllSectorHQs = useCallback(() => {
    setSelectedSectorHQs([]);
  }, []);

  // NEW: Progress category batch operations
  const selectAllProgressCategories = useCallback(() => {
    setSelectedProgressCategories([
      'TENDER_PROGRESS',
      'TENDERED_NOT_AWARDED',
      'AWARDED_NOT_STARTED',
      'NOT_STARTED',
      'PROGRESS_1_TO_50',
      'PROGRESS_51_TO_71',
      'PROGRESS_71_TO_99',
      'COMPLETED'
    ]);
  }, []);

  const clearAllProgressCategories = useCallback(() => {
    setSelectedProgressCategories([]);
  }, []);

  // NEW: Health status batch operations
  const selectAllHealthStatuses = useCallback(() => {
    setSelectedHealthStatuses([
      'PERFECT_PACE',
      'SLOW_PACE',
      'BAD_PACE',
      'SLEEP_PACE',
      'PAYMENT_PENDING',
      'NOT_APPLICABLE'
    ]);
  }, []);

  const clearAllHealthStatuses = useCallback(() => {
    setSelectedHealthStatuses([]);
  }, []);

  // Get filter counts for UI display - Updated
  const getFilterCounts = useCallback(() => {
    const counts = {
      total: 0,
      text: searchTerm ? 1 : 0,
      schemes: selectedSchemes.length,
      statuses: selectedStatuses.length,
      riskLevels: selectedRiskLevels.length,
      budgetHeads: selectedBudgetHeads.length,
      agencies: selectedAgencies.length,
      frontierHQs: selectedFrontierHQs.length,
      sectorHQs: selectedSectorHQs.length,
      contractors: selectedContractors.length,
      locations: selectedLocations.length,
      progressCategories: selectedProgressCategories.length,
      healthStatuses: selectedHealthStatuses.length,
      ranges: 0,
      dates: 0
    };

    // Count modified ranges
    if (progressRange[0] > 0 || progressRange[1] < 100) counts.ranges++;
    if (amountRange[0] > 0 || (rawData.length > 0 && amountRange[1] < Math.max(...rawData.map(d => d.sanctioned_amount || 0)))) counts.ranges++;
    if (delayRange[0] > 0 || delayRange[1] < 365) counts.ranges++;
    if (efficiencyRange[0] > 0 || efficiencyRange[1] < 100) counts.ranges++;
    if (healthRange[0] > 0 || healthRange[1] < 100) counts.ranges++;
    if (expectedProgressRange[0] > 0 || expectedProgressRange[1] < 100) counts.ranges++;

    // Count active date filters
    Object.values(dateFilters).forEach(filter => {
      if (filter.enabled) counts.dates++;
    });

    counts.total = counts.text + counts.schemes + counts.statuses + counts.riskLevels + 
                   counts.budgetHeads + counts.agencies + counts.frontierHQs + counts.sectorHQs + 
                   counts.contractors + counts.locations + counts.progressCategories + 
                   counts.healthStatuses + counts.ranges + counts.dates;

    return counts;
  }, [
    searchTerm,
    selectedSchemes,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedContractors,
    selectedLocations,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange,
    expectedProgressRange,
    dateFilters,
    rawData
  ]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return getFilterCounts().total > 0;
  }, [getFilterCounts]);

  // Get summary of active filters - Updated
  const getActiveFiltersSummary = useCallback(() => {
    const summary = [];
    
    if (searchTerm) {
      summary.push({ type: 'search', label: `Search: "${searchTerm}"` });
    }
    
    if (selectedSchemes.length > 0) {
      summary.push({ 
        type: 'schemes', 
        label: `${selectedSchemes.length} Scheme${selectedSchemes.length > 1 ? 's' : ''}` 
      });
    }
    
    if (selectedStatuses.length > 0) {
      summary.push({ 
        type: 'statuses', 
        label: `${selectedStatuses.length} Status${selectedStatuses.length > 1 ? 'es' : ''}` 
      });
    }
    
    if (selectedRiskLevels.length > 0) {
      summary.push({ 
        type: 'risk', 
        label: `${selectedRiskLevels.length} Risk Level${selectedRiskLevels.length > 1 ? 's' : ''}` 
      });
    }
    
    if (selectedAgencies.length > 0) {
      summary.push({ 
        type: 'agencies', 
        label: `${selectedAgencies.length} Agenc${selectedAgencies.length > 1 ? 'ies' : 'y'}` 
      });
    }

    if (selectedFrontierHQs.length > 0) {
      summary.push({ 
        type: 'frontierHQs', 
        label: `${selectedFrontierHQs.length} Frontier HQ${selectedFrontierHQs.length > 1 ? 's' : ''}` 
      });
    }

    if (selectedSectorHQs.length > 0) {
      summary.push({ 
        type: 'sectorHQs', 
        label: `${selectedSectorHQs.length} Sector HQ${selectedSectorHQs.length > 1 ? 's' : ''}` 
      });
    }

    if (selectedProgressCategories.length > 0) {
      summary.push({ 
        type: 'progressCategories', 
        label: `${selectedProgressCategories.length} Progress Categor${selectedProgressCategories.length > 1 ? 'ies' : 'y'}` 
      });
    }

    if (selectedHealthStatuses.length > 0) {
      summary.push({ 
        type: 'healthStatuses', 
        label: `${selectedHealthStatuses.length} Health Status${selectedHealthStatuses.length > 1 ? 'es' : ''}` 
      });
    }
    
    if (progressRange[0] > 0 || progressRange[1] < 100) {
      summary.push({ 
        type: 'progress', 
        label: `Progress: ${progressRange[0]}-${progressRange[1]}%` 
      });
    }
    
    if (delayRange[0] > 0 || delayRange[1] < 365) {
      summary.push({ 
        type: 'delay', 
        label: `Delay: ${delayRange[0]}-${delayRange[1]} days` 
      });
    }

    if (expectedProgressRange[0] > 0 || expectedProgressRange[1] < 100) {
      summary.push({ 
        type: 'expectedProgress', 
        label: `Expected Progress: ${expectedProgressRange[0]}-${expectedProgressRange[1]}%` 
      });
    }
    
    // Date filter summaries
    Object.entries(dateFilters).forEach(([key, filter]) => {
      if (filter.enabled) {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        let dateRange = '';
        if (filter.start && filter.end) {
          dateRange = `${new Date(filter.start).toLocaleDateString()} - ${new Date(filter.end).toLocaleDateString()}`;
        } else if (filter.start) {
          dateRange = `After ${new Date(filter.start).toLocaleDateString()}`;
        } else if (filter.end) {
          dateRange = `Before ${new Date(filter.end).toLocaleDateString()}`;
        }
        summary.push({
          type: 'date',
          label: `${label}: ${dateRange}`
        });
      }
    });
    
    return summary;
  }, [
    searchTerm,
    selectedSchemes,
    selectedStatuses,
    selectedRiskLevels,
    selectedAgencies,
    selectedFrontierHQs,
    selectedSectorHQs,
    selectedProgressCategories,
    selectedHealthStatuses,
    progressRange,
    delayRange,
    expectedProgressRange,
    dateFilters
  ]);

  // Backwards compatibility aliases
  const setSelectedFrontiers = setSelectedFrontierHQs;
  const selectedFrontiers = selectedFrontierHQs;
  const toggleFrontier = toggleFrontierHQ;
  const selectAllFrontiers = selectAllFrontierHQs;
  const clearAllFrontiers = clearAllFrontierHQs;

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    selectedSchemes,
    setSelectedSchemes: wrappedSetSelectedSchemes, // Use wrapped version with logging
    selectedStatuses,
    setSelectedStatuses,
    selectedRiskLevels,
    setSelectedRiskLevels,
    selectedBudgetHeads,
    setSelectedBudgetHeads,
    selectedAgencies,
    setSelectedAgencies,
    selectedFrontierHQs,
    setSelectedFrontierHQs,
    selectedSectorHQs,
    setSelectedSectorHQs,
    selectedFrontiers, // Backwards compatibility
    setSelectedFrontiers, // Backwards compatibility
    selectedContractors,
    setSelectedContractors,
    selectedLocations,
    setSelectedLocations,
    selectedProgressCategories,
    setSelectedProgressCategories,
    selectedHealthStatuses,
    setSelectedHealthStatuses,
    
    // Range filters
    progressRange,
    setProgressRange,
    amountRange,
    setAmountRange,
    delayRange,
    setDelayRange,
    efficiencyRange,
    setEfficiencyRange,
    healthRange,
    setHealthRange,
    expectedProgressRange,
    setExpectedProgressRange,
    
    // Date filters
    dateFilters,
    setDateFilter,
    clearAllDateFilters,
    dateStatistics,
    
    // Data
    rawData,
    setRawData,
    filteredData,
    
    // Available options for cascading filters
    availableOptions,
    getRelatedMappings,
    
    // Functions
    resetFilters,
    getFilterState,
    loadFilterState,
    setQuickFilter,
    
    // Multi-select helpers
    toggleStatus,
    toggleRiskLevel,
    toggleScheme,
    toggleAgency,
    toggleFrontierHQ,
    toggleSectorHQ,
    toggleFrontier, // Backwards compatibility
    toggleContractor,
    toggleLocation,
    toggleProgressCategory,
    toggleHealthStatus,
    selectAllStatuses,
    clearAllStatuses,
    selectAllRiskLevels,
    clearAllRiskLevels,
    selectAllSchemes,
    clearAllSchemes,
    selectAllFrontierHQs,
    clearAllFrontierHQs,
    selectAllSectorHQs,
    clearAllSectorHQs,
    selectAllFrontiers, // Backwards compatibility
    clearAllFrontiers, // Backwards compatibility
    selectAllProgressCategories,
    clearAllProgressCategories,
    selectAllHealthStatuses,
    clearAllHealthStatuses,
    
    // Utility functions
    getFilterCounts,
    hasActiveFilters,
    getActiveFiltersSummary
  };
};