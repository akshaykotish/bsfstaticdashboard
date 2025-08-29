import { useState, useMemo, useCallback } from 'react';

export const useFilters = () => {
  // Basic filters - now using arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState([]);
  const [selectedBudgetHeads, setSelectedBudgetHeads] = useState([]);
  const [selectedAgencies, setSelectedAgencies] = useState([]);
  const [selectedFrontiers, setSelectedFrontiers] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  
  // Range filters
  const [progressRange, setProgressRange] = useState([0, 100]);
  const [amountRange, setAmountRange] = useState([0, 100000]);
  const [delayRange, setDelayRange] = useState([0, 365]);
  const [efficiencyRange, setEfficiencyRange] = useState([0, 100]);
  const [healthRange, setHealthRange] = useState([0, 100]);
  
  // Store raw data for filtering
  const [rawData, setRawData] = useState([]);

  // Filter function updated for multi-select
  const applyFilters = useCallback((data) => {
    let filtered = [...data];

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.scheme_name?.toLowerCase().includes(searchLower) ||
        item.work_site?.toLowerCase().includes(searchLower) ||
        item.firm_name?.toLowerCase().includes(searchLower) ||
        item.executive_agency?.toLowerCase().includes(searchLower) ||
        item.budget_head?.toLowerCase().includes(searchLower) ||
        item.serial_no?.toString().includes(searchTerm)
      );
    }

    // Multi-select filters - only apply if selections made
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
    }

    if (selectedRiskLevels.length > 0) {
      filtered = filtered.filter(item => selectedRiskLevels.includes(item.risk_level));
    }

    if (selectedBudgetHeads.length > 0) {
      filtered = filtered.filter(item => selectedBudgetHeads.includes(item.budget_head));
    }

    if (selectedAgencies.length > 0) {
      filtered = filtered.filter(item => selectedAgencies.includes(item.executive_agency));
    }

    if (selectedFrontiers.length > 0) {
      filtered = filtered.filter(item => 
        selectedFrontiers.includes(item.ftr_hq) || selectedFrontiers.includes(item.shq)
      );
    }

    if (selectedContractors.length > 0) {
      filtered = filtered.filter(item => selectedContractors.includes(item.firm_name));
    }

    if (selectedLocations.length > 0) {
      filtered = filtered.filter(item => {
        const location = item.work_site?.split(',')[0]?.trim();
        return selectedLocations.some(selected => 
          location?.toLowerCase().includes(selected.toLowerCase())
        );
      });
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

    return filtered;
  }, [
    searchTerm, 
    selectedStatuses, 
    selectedRiskLevels, 
    selectedBudgetHeads,
    selectedAgencies, 
    selectedFrontiers, 
    selectedContractors, 
    selectedLocations,
    progressRange, 
    amountRange, 
    delayRange, 
    efficiencyRange, 
    healthRange
  ]);

  // Get filtered data
  const filteredData = useMemo(() => {
    return applyFilters(rawData);
  }, [rawData, applyFilters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedRiskLevels([]);
    setSelectedBudgetHeads([]);
    setSelectedAgencies([]);
    setSelectedFrontiers([]);
    setSelectedContractors([]);
    setSelectedLocations([]);
    setProgressRange([0, 100]);
    
    // Reset amount range to actual data range
    const maxAmount = rawData.length > 0 
      ? Math.max(...rawData.map(d => d.sanctioned_amount || 0))
      : 100000;
    setAmountRange([0, maxAmount]);
    
    setDelayRange([0, 365]);
    setEfficiencyRange([0, 100]);
    setHealthRange([0, 100]);
  }, [rawData]);

  // Get current filter state
  const getFilterState = useCallback(() => ({
    searchTerm,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontiers,
    selectedContractors,
    selectedLocations,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange
  }), [
    searchTerm,
    selectedStatuses,
    selectedRiskLevels,
    selectedBudgetHeads,
    selectedAgencies,
    selectedFrontiers,
    selectedContractors,
    selectedLocations,
    progressRange,
    amountRange,
    delayRange,
    efficiencyRange,
    healthRange
  ]);

  // Load filter state
  const loadFilterState = useCallback((state) => {
    if (state.searchTerm !== undefined) setSearchTerm(state.searchTerm);
    if (state.selectedStatuses !== undefined) setSelectedStatuses(state.selectedStatuses);
    if (state.selectedRiskLevels !== undefined) setSelectedRiskLevels(state.selectedRiskLevels);
    if (state.selectedBudgetHeads !== undefined) setSelectedBudgetHeads(state.selectedBudgetHeads);
    if (state.selectedAgencies !== undefined) setSelectedAgencies(state.selectedAgencies);
    if (state.selectedFrontiers !== undefined) setSelectedFrontiers(state.selectedFrontiers);
    if (state.selectedContractors !== undefined) setSelectedContractors(state.selectedContractors);
    if (state.selectedLocations !== undefined) setSelectedLocations(state.selectedLocations);
    if (state.progressRange !== undefined) setProgressRange(state.progressRange);
    if (state.amountRange !== undefined) setAmountRange(state.amountRange);
    if (state.delayRange !== undefined) setDelayRange(state.delayRange);
    if (state.efficiencyRange !== undefined) setEfficiencyRange(state.efficiencyRange);
    if (state.healthRange !== undefined) setHealthRange(state.healthRange);
  }, []);

  // Quick filter presets
  const setQuickFilter = useCallback((type) => {
    resetFilters();
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
      case 'budget':
        const maxAmount = rawData.length > 0 
          ? Math.max(...rawData.map(d => d.sanctioned_amount || 0))
          : 100000;
        setAmountRange([50000, maxAmount]);
        break;
      case 'health':
        setHealthRange([0, 50]);
        break;
      default:
        break;
    }
  }, [rawData, resetFilters]);

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

  // Batch operations for multi-select
  const selectAllStatuses = useCallback(() => {
    setSelectedStatuses(['NOT_STARTED', 'INITIAL', 'IN_PROGRESS', 'ADVANCED', 'NEAR_COMPLETION', 'COMPLETED']);
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

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    selectedRiskLevels,
    setSelectedRiskLevels,
    selectedBudgetHeads,
    setSelectedBudgetHeads,
    selectedAgencies,
    setSelectedAgencies,
    selectedFrontiers,
    setSelectedFrontiers,
    selectedContractors,
    setSelectedContractors,
    selectedLocations,
    setSelectedLocations,
    
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
    
    // Data
    rawData,
    setRawData,
    filteredData,
    
    // Functions
    resetFilters,
    getFilterState,
    loadFilterState,
    setQuickFilter,
    
    // Multi-select helpers
    toggleStatus,
    toggleRiskLevel,
    selectAllStatuses,
    clearAllStatuses,
    selectAllRiskLevels,
    clearAllRiskLevels
  };
};