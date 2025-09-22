import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export const useFilters = () => {
  // Text search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Multi-select filters for Operations
  const [selectedWorkTypes, setSelectedWorkTypes] = useState([]);
  const [selectedWorkCategories, setSelectedWorkCategories] = useState([]);
  const [selectedFrontiers, setSelectedFrontiers] = useState([]);
  const [selectedSectorHQs, setSelectedSectorHQs] = useState([]);
  const [selectedCompletionStatuses, setSelectedCompletionStatuses] = useState([]);
  const [selectedProjectHealths, setSelectedProjectHealths] = useState([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedHLECYears, setSelectedHLECYears] = useState([]);
  const [selectedSourceSheets, setSelectedSourceSheets] = useState([]);
  
  // Range filters
  const [completionRange, setCompletionRange] = useState([0, 100]); // Percentage 0-100
  const [amountRangeCr, setAmountRangeCr] = useState([0, 10000]); 
  const [lengthRangeKm, setLengthRangeKm] = useState([0, 5000]); 
  const [unitsRange, setUnitsRange] = useState([0, 1000]); 
  const [efficiencyRange, setEfficiencyRange] = useState([0, 100]); 
  const [daysToPDCRange, setDaysToPDCRange] = useState([-1825, 3650]); 
  
  // Date filters
  const [sdcFilter, setSDCFilter] = useState({ enabled: false, start: null, end: null });
  const [pdcFilter, setPDCFilter] = useState({ enabled: false, start: null, end: null });
  
  // Store raw data
  const [rawData, setRawData] = useState([]);

  // Performance optimization - cache date parsing results
  const parsedDatesCache = useRef(new Map());
  
  // Helper to parse Operations date formats with caching
  const parseOperationsDate = useCallback((dateString) => {
    if (!dateString || dateString === '') return null;
    
    // Check cache first
    if (parsedDatesCache.current.has(dateString)) {
      return parsedDatesCache.current.get(dateString);
    }
    
    const cleanString = dateString.replace(/'/g, ' ').trim();
    const parts = cleanString.split(' ');
    
    let result = null;
    
    if (parts.length >= 1) {
      const monthMap = {
        'Jan': 0, 'January': 0,
        'Feb': 1, 'February': 1,
        'Mar': 2, 'March': 2,
        'Apr': 3, 'April': 3,
        'May': 4,
        'Jun': 5, 'June': 5,
        'Jul': 6, 'July': 6,
        'Aug': 7, 'August': 7,
        'Sep': 8, 'September': 8,
        'Oct': 9, 'October': 9,
        'Nov': 10, 'November': 10,
        'Dec': 11, 'December': 11
      };
      
      const monthName = parts[0].replace(/[^a-zA-Z]/g, '');
      const year = parts.length > 1 ? parseInt(parts[parts.length - 1]) : new Date().getFullYear();
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        result = new Date(year, monthMap[monthName], 1);
      }
    }
    
    // Cache the result
    parsedDatesCache.current.set(dateString, result);
    return result;
  }, []);

  // Check if date is in range
  const isDateInRange = useCallback((dateString, startDate, endDate) => {
    const date = parseOperationsDate(dateString);
    if (!date) return true;
    
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
  }, [parseOperationsDate]);

  // Performance optimization - memoize filter function creation
  const createFilterFunction = useCallback((exceptFilters = []) => {
    return (item) => {
      // Text search - use processed field names
      if (searchTerm && !exceptFilters.includes('search')) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          item.name_of_work?.toLowerCase().includes(searchLower) ||
          item.frontier?.toLowerCase().includes(searchLower) ||
          item.sector_hq?.toLowerCase().includes(searchLower) ||
          item.work_type?.toLowerCase().includes(searchLower) ||
          item.remarks?.toLowerCase().includes(searchLower) ||
          item.s_no?.toString().includes(searchTerm)
        )) return false;
      }

      // Apply multi-select filters using processed field names
      if (selectedWorkTypes.length > 0 && !exceptFilters.includes('workType')) {
        if (!selectedWorkTypes.includes(item.work_type)) return false;
      }

      if (selectedWorkCategories.length > 0 && !exceptFilters.includes('workCategory')) {
        if (!selectedWorkCategories.includes(item.work_category)) return false;
      }

      if (selectedFrontiers.length > 0 && !exceptFilters.includes('frontier')) {
        if (!selectedFrontiers.includes(item.frontier)) return false;
      }

      if (selectedSectorHQs.length > 0 && !exceptFilters.includes('sectorHQ')) {
        if (!selectedSectorHQs.includes(item.sector_hq)) return false;
      }

      if (selectedCompletionStatuses.length > 0 && !exceptFilters.includes('completionStatus')) {
        if (!selectedCompletionStatuses.includes(item.completion_status)) return false;
      }

      if (selectedProjectHealths.length > 0 && !exceptFilters.includes('projectHealth')) {
        if (!selectedProjectHealths.includes(item.project_health)) return false;
      }

      if (selectedRiskLevels.length > 0 && !exceptFilters.includes('riskLevel')) {
        if (!selectedRiskLevels.includes(item.risk_level)) return false;
      }

      if (selectedPriorities.length > 0 && !exceptFilters.includes('priority')) {
        if (!selectedPriorities.includes(item.priority)) return false;
      }

      if (selectedHLECYears.length > 0 && !exceptFilters.includes('hlecYear')) {
        const hlecYear = item.hlec_year_number?.toString();
        if (!hlecYear || !selectedHLECYears.includes(hlecYear)) return false;
      }

      if (selectedSourceSheets.length > 0 && !exceptFilters.includes('sourceSheet')) {
        if (!selectedSourceSheets.includes(item.source_sheet)) return false;
      }

      // Apply range filters - convert percentage to 0-100 scale for UI
      const completion = (parseFloat(item.completed_percentage) || 0) * 100;
      if (completion < completionRange[0] || completion > completionRange[1]) return false;

      const amount = parseFloat(item.sanctioned_amount_cr) || 0;
      if (amount < amountRangeCr[0] || amount > amountRangeCr[1]) return false;

      const length = parseFloat(item.length_km) || 0;
      if (length < lengthRangeKm[0] || length > lengthRangeKm[1]) return false;

      const units = parseFloat(item.units_aor) || 0;
      if (units < unitsRange[0] || units > unitsRange[1]) return false;

      const efficiency = item.efficiency_score || 0;
      if (efficiency < efficiencyRange[0] || efficiency > efficiencyRange[1]) return false;

      const days = item.days_to_pdc ?? 0;
      if (days < daysToPDCRange[0] || days > daysToPDCRange[1]) return false;

      // Apply date filters
      if (sdcFilter.enabled && !exceptFilters.includes('dates')) {
        if (!isDateInRange(item.sdc, sdcFilter.start, sdcFilter.end)) return false;
      }

      if (pdcFilter.enabled && !exceptFilters.includes('dates')) {
        if (!isDateInRange(item.pdc, pdcFilter.start, pdcFilter.end)) return false;
      }

      return true;
    };
  }, [
    searchTerm,
    selectedWorkTypes,
    selectedWorkCategories,
    selectedFrontiers,
    selectedSectorHQs,
    selectedCompletionStatuses,
    selectedProjectHealths,
    selectedRiskLevels,
    selectedPriorities,
    selectedHLECYears,
    selectedSourceSheets,
    completionRange,
    amountRangeCr,
    lengthRangeKm,
    unitsRange,
    efficiencyRange,
    daysToPDCRange,
    sdcFilter,
    pdcFilter,
    isDateInRange
  ]);

  // Performance optimization - use more efficient filtering for available options
  const availableOptions = useMemo(() => {
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

    // Performance optimization - batch all filtering operations
    const filterFunctions = {
      workType: createFilterFunction(['workType']),
      workCategory: createFilterFunction(['workCategory']),
      frontier: createFilterFunction(['frontier']),
      sectorHQ: createFilterFunction(['sectorHQ']),
      completionStatus: createFilterFunction(['completionStatus']),
      projectHealth: createFilterFunction(['projectHealth']),
      riskLevel: createFilterFunction(['riskLevel']),
      priority: createFilterFunction(['priority']),
      hlecYear: createFilterFunction(['hlecYear']),
      sourceSheet: createFilterFunction(['sourceSheet'])
    };

    // Single pass through data for all filters
    const results = {
      workTypes: new Set(),
      workCategories: new Set(),
      frontiers: new Set(),
      sectorHQs: new Set(),
      completionStatuses: new Set(),
      projectHealths: new Set(),
      riskLevels: new Set(),
      priorities: new Set(),
      hlecYears: new Set(),
      sourceSheets: new Set()
    };

    // Process all items in a single loop
    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      
      if (filterFunctions.workType(item) && item.work_type) {
        results.workTypes.add(item.work_type);
      }
      
      if (filterFunctions.workCategory(item) && item.work_category) {
        results.workCategories.add(item.work_category);
      }
      
      if (filterFunctions.frontier(item) && item.frontier) {
        results.frontiers.add(item.frontier);
      }
      
      if (filterFunctions.sectorHQ(item) && item.sector_hq) {
        results.sectorHQs.add(item.sector_hq);
      }
      
      if (filterFunctions.completionStatus(item) && item.completion_status) {
        results.completionStatuses.add(item.completion_status);
      }
      
      if (filterFunctions.projectHealth(item) && item.project_health) {
        results.projectHealths.add(item.project_health);
      }
      
      if (filterFunctions.riskLevel(item) && item.risk_level) {
        results.riskLevels.add(item.risk_level);
      }
      
      if (filterFunctions.priority(item) && item.priority) {
        results.priorities.add(item.priority);
      }
      
      if (filterFunctions.hlecYear(item) && item.hlec_year_number) {
        results.hlecYears.add(item.hlec_year_number.toString());
      }
      
      if (filterFunctions.sourceSheet(item) && item.source_sheet) {
        results.sourceSheets.add(item.source_sheet);
      }
    }

    // Convert sets to sorted arrays
    return {
      workTypes: Array.from(results.workTypes).sort(),
      workCategories: ['BORDER_OUTPOST', 'FENCING', 'ROAD', 'BRIDGE', 'INFRASTRUCTURE', 'OTHER']
        .filter(cat => results.workCategories.has(cat)),
      frontiers: Array.from(results.frontiers).sort(),
      sectorHQs: Array.from(results.sectorHQs).sort(),
      completionStatuses: ['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED']
        .filter(status => results.completionStatuses.has(status)),
      projectHealths: ['ON_TRACK', 'MINOR_DELAY', 'MODERATE_DELAY', 'SEVERE_DELAY']
        .filter(health => results.projectHealths.has(health)),
      riskLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        .filter(level => results.riskLevels.has(level)),
      priorities: ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
        .filter(priority => results.priorities.has(priority)),
      hlecYears: Array.from(results.hlecYears)
        .sort((a, b) => parseInt(b) - parseInt(a)),
      sourceSheets: Array.from(results.sourceSheets).sort()
    };
  }, [rawData, createFilterFunction]);

  // Get related mappings for intelligent filtering - optimized version
  const getRelatedMappings = useCallback(() => {
    if (!rawData || rawData.length === 0) return {};

    const mappings = {
      frontierToSectors: {},
      sectorToFrontier: {},
      workTypeToFrontiers: {},
      frontierToWorkTypes: {}
    };

    // Single pass through data
    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      const frontier = item.frontier;
      const sector = item.sector_hq;
      const workType = item.work_type;

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

      // Map work type to frontiers
      if (workType && frontier) {
        if (!mappings.workTypeToFrontiers[workType]) {
          mappings.workTypeToFrontiers[workType] = new Set();
        }
        mappings.workTypeToFrontiers[workType].add(frontier);

        if (!mappings.frontierToWorkTypes[frontier]) {
          mappings.frontierToWorkTypes[frontier] = new Set();
        }
        mappings.frontierToWorkTypes[frontier].add(workType);
      }
    }

    // Convert Sets to Arrays
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

  // Main filter function - optimized version
  const applyFilters = useCallback((data) => {
    if (!data || data.length === 0) return [];
    
    const filterFn = createFilterFunction([]);
    return data.filter(filterFn);
  }, [createFilterFunction]);

  // Get filtered data - optimized with memoization
  const filteredData = useMemo(() => {
    return applyFilters(rawData);
  }, [rawData, applyFilters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedWorkTypes([]);
    setSelectedWorkCategories([]);
    setSelectedFrontiers([]);
    setSelectedSectorHQs([]);
    setSelectedCompletionStatuses([]);
    setSelectedProjectHealths([]);
    setSelectedRiskLevels([]);
    setSelectedPriorities([]);
    setSelectedHLECYears([]);
    setSelectedSourceSheets([]);
    setCompletionRange([0, 100]);
    
    const maxAmount = rawData.length > 0 
      ? Math.max(...rawData.map(d => parseFloat(d.sanctioned_amount_cr) || 0))
      : 10000;
    setAmountRangeCr([0, maxAmount]);
    
    const maxLength = rawData.length > 0
      ? Math.max(...rawData.map(d => parseFloat(d.length_km) || 0).filter(v => v > 0))
      : 5000;
    setLengthRangeKm([0, maxLength]);
    
    const maxUnits = rawData.length > 0
      ? Math.max(...rawData.map(d => parseFloat(d.units_aor) || 0))
      : 1000;
    setUnitsRange([0, maxUnits]);
    
    setEfficiencyRange([0, 100]);
    setDaysToPDCRange([-1825, 3650]);
    setSDCFilter({ enabled: false, start: null, end: null });
    setPDCFilter({ enabled: false, start: null, end: null });
    
    // Clear date cache
    parsedDatesCache.current.clear();
  }, [rawData]);

  // Quick filter presets
  const setQuickFilter = useCallback((type) => {
    resetFilters();
    
    switch(type) {
      case 'critical':
        setSelectedRiskLevels(['CRITICAL']);
        break;
      case 'completed':
        setCompletionRange([95, 100]);
        break;
      case 'ongoing':
        setCompletionRange([1, 94]);
        break;
      case 'notStarted':
        setCompletionRange([0, 1]);
        break;
      case 'bop':
        setSelectedWorkCategories(['BORDER_OUTPOST']);
        break;
      case 'highBudget':
        const maxAmount = rawData.length > 0 
          ? Math.max(...rawData.map(d => parseFloat(d.sanctioned_amount_cr) || 0))
          : 10000;
        setAmountRangeCr([50, maxAmount]);
        break;
      case 'onTrack':
        setSelectedProjectHealths(['ON_TRACK']);
        break;
      case 'severeDelay':
        setSelectedProjectHealths(['SEVERE_DELAY']);
        break;
      case 'urgent':
        setSelectedPriorities(['URGENT', 'HIGH']);
        break;
      case 'nearPDC':
        setDaysToPDCRange([0, 90]);
        break;
      case 'overduePDC':
        setDaysToPDCRange([-1825, -1]);
        break;
      default:
        break;
    }
  }, [rawData, resetFilters]);

  // Get filter state
  const getFilterState = useCallback(() => ({
    searchTerm,
    selectedWorkTypes,
    selectedWorkCategories,
    selectedFrontiers,
    selectedSectorHQs,
    selectedCompletionStatuses,
    selectedProjectHealths,
    selectedRiskLevels,
    selectedPriorities,
    selectedHLECYears,
    selectedSourceSheets,
    completionRange,
    amountRangeCr,
    lengthRangeKm,
    unitsRange,
    efficiencyRange,
    daysToPDCRange,
    sdcFilter,
    pdcFilter
  }), [
    searchTerm,
    selectedWorkTypes,
    selectedWorkCategories,
    selectedFrontiers,
    selectedSectorHQs,
    selectedCompletionStatuses,
    selectedProjectHealths,
    selectedRiskLevels,
    selectedPriorities,
    selectedHLECYears,
    selectedSourceSheets,
    completionRange,
    amountRangeCr,
    lengthRangeKm,
    unitsRange,
    efficiencyRange,
    daysToPDCRange,
    sdcFilter,
    pdcFilter
  ]);

  // Load filter state
  const loadFilterState = useCallback((state) => {
    if (state.searchTerm !== undefined) setSearchTerm(state.searchTerm);
    if (state.selectedWorkTypes !== undefined) setSelectedWorkTypes(state.selectedWorkTypes);
    if (state.selectedWorkCategories !== undefined) setSelectedWorkCategories(state.selectedWorkCategories);
    if (state.selectedFrontiers !== undefined) setSelectedFrontiers(state.selectedFrontiers);
    if (state.selectedSectorHQs !== undefined) setSelectedSectorHQs(state.selectedSectorHQs);
    if (state.selectedCompletionStatuses !== undefined) setSelectedCompletionStatuses(state.selectedCompletionStatuses);
    if (state.selectedProjectHealths !== undefined) setSelectedProjectHealths(state.selectedProjectHealths);
    if (state.selectedRiskLevels !== undefined) setSelectedRiskLevels(state.selectedRiskLevels);
    if (state.selectedPriorities !== undefined) setSelectedPriorities(state.selectedPriorities);
    if (state.selectedHLECYears !== undefined) setSelectedHLECYears(state.selectedHLECYears);
    if (state.selectedSourceSheets !== undefined) setSelectedSourceSheets(state.selectedSourceSheets);
    if (state.completionRange !== undefined) setCompletionRange(state.completionRange);
    if (state.amountRangeCr !== undefined) setAmountRangeCr(state.amountRangeCr);
    if (state.lengthRangeKm !== undefined) setLengthRangeKm(state.lengthRangeKm);
    if (state.unitsRange !== undefined) setUnitsRange(state.unitsRange);
    if (state.efficiencyRange !== undefined) setEfficiencyRange(state.efficiencyRange);
    if (state.daysToPDCRange !== undefined) setDaysToPDCRange(state.daysToPDCRange);
    if (state.sdcFilter !== undefined) setSDCFilter(state.sdcFilter);
    if (state.pdcFilter !== undefined) setPDCFilter(state.pdcFilter);
  }, []);

  // Get filter counts
  const getFilterCounts = useCallback(() => {
    const counts = {
      total: 0,
      text: searchTerm ? 1 : 0,
      workTypes: selectedWorkTypes.length,
      workCategories: selectedWorkCategories.length,
      frontiers: selectedFrontiers.length,
      sectorHQs: selectedSectorHQs.length,
      completionStatuses: selectedCompletionStatuses.length,
      projectHealths: selectedProjectHealths.length,
      riskLevels: selectedRiskLevels.length,
      priorities: selectedPriorities.length,
      hlecYears: selectedHLECYears.length,
      sourceSheets: selectedSourceSheets.length,
      ranges: 0,
      dates: 0
    };

    // Count modified ranges
    const maxAmount = rawData.length > 0 
      ? Math.max(...rawData.map(d => parseFloat(d.sanctioned_amount_cr) || 0))
      : 10000;
    const maxLength = rawData.length > 0
      ? Math.max(...rawData.map(d => parseFloat(d.length_km) || 0).filter(v => v > 0))
      : 5000;
    const maxUnits = rawData.length > 0
      ? Math.max(...rawData.map(d => parseFloat(d.units_aor) || 0))
      : 1000;

    if (completionRange[0] > 0 || completionRange[1] < 100) counts.ranges++;
    if (amountRangeCr[0] > 0 || amountRangeCr[1] < maxAmount) counts.ranges++;
    if (lengthRangeKm[0] > 0 || lengthRangeKm[1] < maxLength) counts.ranges++;
    if (unitsRange[0] > 0 || unitsRange[1] < maxUnits) counts.ranges++;
    if (efficiencyRange[0] > 0 || efficiencyRange[1] < 100) counts.ranges++;
    if (daysToPDCRange[0] > -1825 || daysToPDCRange[1] < 3650) counts.ranges++;
    if (sdcFilter.enabled) counts.dates++;
    if (pdcFilter.enabled) counts.dates++;

    counts.total = Object.values(counts).reduce((a, b) => a + b, 0) - counts.total;

    return counts;
  }, [
    searchTerm,
    selectedWorkTypes,
    selectedWorkCategories,
    selectedFrontiers,
    selectedSectorHQs,
    selectedCompletionStatuses,
    selectedProjectHealths,
    selectedRiskLevels,
    selectedPriorities,
    selectedHLECYears,
    selectedSourceSheets,
    completionRange,
    amountRangeCr,
    lengthRangeKm,
    unitsRange,
    efficiencyRange,
    daysToPDCRange,
    sdcFilter,
    pdcFilter,
    rawData
  ]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return getFilterCounts().total > 0;
  }, [getFilterCounts]);

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    selectedWorkTypes,
    setSelectedWorkTypes,
    selectedWorkCategories,
    setSelectedWorkCategories,
    selectedFrontiers,
    setSelectedFrontiers,
    selectedSectorHQs,
    setSelectedSectorHQs,
    selectedCompletionStatuses,
    setSelectedCompletionStatuses,
    selectedProjectHealths,
    setSelectedProjectHealths,
    selectedRiskLevels,
    setSelectedRiskLevels,
    selectedPriorities,
    setSelectedPriorities,
    selectedHLECYears,
    setSelectedHLECYears,
    selectedSourceSheets,
    setSelectedSourceSheets,
    
    // Range filters
    completionRange,
    setCompletionRange,
    amountRangeCr,
    setAmountRangeCr,
    lengthRangeKm,
    setLengthRangeKm,
    unitsRange,
    setUnitsRange,
    efficiencyRange,
    setEfficiencyRange,
    daysToPDCRange,
    setDaysToPDCRange,
    
    // Date filters
    sdcFilter,
    setSDCFilter,
    pdcFilter,
    setPDCFilter,
    
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
    
    // Utility functions
    getFilterCounts,
    hasActiveFilters
  };
};