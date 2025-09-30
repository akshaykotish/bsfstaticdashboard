import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, Activity, PiggyBank, Wallet,
  CreditCard, Database, Target, Gauge,
  FileText, X, Download, Search, Filter,
  IndianRupee, Banknote, Coins, Receipt,
  RefreshCw, ChevronDown, ChevronUp, Settings,
  Calendar, Clock, Calculator, Hash, Building2,
  MapPin, Layers, Shield, Fingerprint, Key
} from 'lucide-react';

// Import database configurations from config.js
import { databaseConfigs, getConfig, getDatabaseNames, generateId, applyCalculations } from '../System/config';

const API_URL = 'http://172.21.188.201:3456';

// Hook to load and process patch data from enggcurrentyear database
export const usePatchEngineeringCYB = (filters = {}) => {
  const [rawPatchData, setRawPatchData] = useState([]);
  const [patchLoading, setPatchLoading] = useState(true);
  const [patchError, setPatchError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  console.log('[PatchCYB] Filters received:', filters);
  
  // Get database configuration for enggcurrentyear
  const dbConfig = useMemo(() => getConfig('enggcurrentyear'), []);

  // Process data using config-based calculations
  const processPatchData = useCallback((data) => {
    return data
      .filter(row => row && row[dbConfig.idField])
      .map((row, index) => {
        // Apply calculations from config if available
        let processedRow = { ...row };
        if (dbConfig.calculations) {
          processedRow = applyCalculations('enggcurrentyear', processedRow);
        }
        
        // Enhanced numeric cleaning helper with NaN prevention
        const cleanNumber = (val) => {
          if (val === null || val === undefined || val === '' || val === 'NIL' || val === 'N/A' || val === '-') {
            return 0;
          }
          
          if (typeof val === 'string') {
            // Remove all non-numeric characters except decimal point and minus sign
            val = val.replace(/[^0-9.-]/g, '').trim();
            if (val === '' || val === '-' || val === '.') return 0;
          }
          
          const num = parseFloat(val);
          // Ensure we never return NaN
          return isNaN(num) || !isFinite(num) ? 0 : num;
        };

        // Enhanced percentage cleaning helper with NaN prevention
        const cleanPercentage = (val) => {
          if (val === null || val === undefined || val === '' || val === 'NIL' || val === 'N/A' || val === '-') {
            return 0;
          }
          
          // Convert to string and clean
          const cleaned = String(val).replace(/[^0-9.-]/g, '').trim();
          if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
          
          const num = parseFloat(cleaned);
          // Ensure we never return NaN and clamp between 0-100 for percentages
          if (isNaN(num) || !isFinite(num)) return 0;
          return Math.min(100, Math.max(0, num));
        };

        // Safe division helper to prevent NaN from division
        const safeDivide = (numerator, denominator, multiplier = 1) => {
          const num = cleanNumber(numerator);
          const denom = cleanNumber(denominator);
          
          if (denom === 0 || isNaN(denom) || !isFinite(denom)) {
            return 0;
          }
          
          const result = (num / denom) * multiplier;
          return isNaN(result) || !isFinite(result) ? 0 : result;
        };

        // Map config column names to processed fields with proper cleaning
        const processed = {
          id: processedRow[dbConfig.idField] || `cy_${index + 1}`,
          serial_no: processedRow[dbConfig.idField],
          
          // Map using config column names
          ftr_hq: processedRow['Name of Ftr HQ'] || 'Unknown',
          budget_head: processedRow['Budget head'] || 'Unknown',
          sub_head: processedRow['Sub head'] || '',
          // Improved scheme mapping to use multiple sources
          scheme_name: processedRow['Name of scheme'] || processedRow['Sub head'] || '',
          
          // Financial values (assuming in lakhs) - all properly cleaned
          allotment_prev_fy: cleanNumber(processedRow['Allotment Previous Financila year']),
          expdr_prev_year: cleanNumber(processedRow['Expdr previous year']),
          liabilities: cleanNumber(processedRow['Liabilities']),
          fresh_sanction_cfy: cleanNumber(processedRow['Fresh Sanction issued during CFY']),
          effective_sanction: cleanNumber(processedRow['Effective sanction']),
          allotment_cfy: cleanNumber(processedRow['Allotment CFY']),
          allotment_fy_24_25: cleanNumber(processedRow['Allotment  (FY 24-25)']),
          
          // Expenditure fields - properly cleaned
          expdr_elekha_22_07: cleanNumber(processedRow['Expdr booked as per e-lekha as on 22/07/25']),
          expdr_elekha_31_03: cleanNumber(processedRow['Expdr booked as per e-lekha as on 31/03/25']),
          total_expdr_register: cleanNumber(processedRow['Total Expdr as per contengency register']),
          percent_expdr_elekha: 0, // Will calculate below
          percent_total_expdr: 0, // Will calculate below
          
          // Pending bills - properly cleaned
          bill_pending_pad: cleanNumber(processedRow['Bill pending with PAD']),
          bill_pending_hqrs: cleanNumber(processedRow['Bill pending with HQrs']),
          
          // Balance fund - will calculate below
          balance_fund: 0,
          expdr_plan_balance: cleanNumber(processedRow['Expdr plan for balance fund']),
          
          // Additional calculated fields
          utilization_rate: 0,
          pending_bills_total: 0,
          efficiency_score: 0,
          risk_level: 'LOW',
          health_status: 'NORMAL',
          priority: 'NORMAL'
        };

        // Recalculate percentages to ensure no NaN values
        const allotment = processed.allotment_cfy;
        const totalExpdr = processed.total_expdr_register;
        const expdrElekha = processed.expdr_elekha_22_07;
        const pendingPAD = processed.bill_pending_pad;
        const pendingHQ = processed.bill_pending_hqrs;
        
        // Calculate percentages using safe division
        processed.percent_expdr_elekha = parseFloat(safeDivide(expdrElekha, allotment, 100).toFixed(2));
        processed.percent_total_expdr = parseFloat(safeDivide(totalExpdr, allotment, 100).toFixed(2));
        
        // Calculate balance fund properly with NaN prevention
        processed.balance_fund = Math.max(0, allotment - totalExpdr - pendingPAD - pendingHQ);
        if (isNaN(processed.balance_fund) || !isFinite(processed.balance_fund)) {
          processed.balance_fund = 0;
        }

        // Calculate derived metrics with NaN prevention
        processed.pending_bills_total = pendingPAD + pendingHQ;
        if (isNaN(processed.pending_bills_total)) {
          processed.pending_bills_total = 0;
        }
        
        // Calculate utilization rate with safe division
        processed.utilization_rate = parseFloat(safeDivide(totalExpdr, allotment, 100).toFixed(2));
        
        // Calculate efficiency score with NaN prevention
        if (allotment > 0) {
          const utilizationScore = Math.min(100, safeDivide(totalExpdr, allotment, 100));
          const pendingScore = processed.pending_bills_total > 0 
            ? Math.max(0, 100 - safeDivide(processed.pending_bills_total, allotment, 50))
            : 100;
          
          const effScore = (utilizationScore + pendingScore) / 2;
          processed.efficiency_score = parseFloat(
            (isNaN(effScore) || !isFinite(effScore) ? 0 : effScore).toFixed(2)
          );
        } else {
          processed.efficiency_score = 0;
        }
        
        // Ensure efficiency score is valid
        if (isNaN(processed.efficiency_score) || !isFinite(processed.efficiency_score)) {
          processed.efficiency_score = 0;
        }
        
        // Determine risk level based on utilization and pending bills
        const utilizationNum = processed.utilization_rate;
        const pendingRatio = safeDivide(processed.pending_bills_total, allotment, 1);
        
        if (utilizationNum < 30 && pendingRatio > 0.2) {
          processed.risk_level = 'CRITICAL';
          processed.priority = 'HIGH';
        } else if (utilizationNum < 50 || pendingRatio > 0.15) {
          processed.risk_level = 'HIGH';
          processed.priority = 'HIGH';
        } else if (utilizationNum < 70 || pendingRatio > 0.1) {
          processed.risk_level = 'MEDIUM';
          processed.priority = 'MEDIUM';
        } else {
          processed.risk_level = 'LOW';
          processed.priority = 'LOW';
        }
        
        // Determine health status
        if (utilizationNum >= 90 && pendingRatio < 0.05) {
          processed.health_status = 'EXCELLENT';
        } else if (utilizationNum >= 70 && pendingRatio < 0.1) {
          processed.health_status = 'GOOD';
        } else if (utilizationNum >= 50) {
          processed.health_status = 'NORMAL';
        } else if (utilizationNum >= 30) {
          processed.health_status = 'POOR';
        } else {
          processed.health_status = 'CRITICAL';
        }
        
        // Final validation - ensure all numeric fields are valid numbers
        const numericFields = [
          'allotment_prev_fy', 'expdr_prev_year', 'liabilities', 'fresh_sanction_cfy',
          'effective_sanction', 'allotment_cfy', 'allotment_fy_24_25', 'expdr_elekha_22_07',
          'expdr_elekha_31_03', 'total_expdr_register', 'percent_expdr_elekha',
          'percent_total_expdr', 'bill_pending_pad', 'bill_pending_hqrs', 'balance_fund',
          'expdr_plan_balance', 'utilization_rate', 'pending_bills_total', 'efficiency_score'
        ];
        
        numericFields.forEach(field => {
          if (isNaN(processed[field]) || !isFinite(processed[field])) {
            console.warn(`[PatchCYB] Field ${field} is NaN, setting to 0`);
            processed[field] = 0;
          }
        });
        
        return processed;
      });
  }, [dbConfig]);

  // Load patch data from server API
  useEffect(() => {
    let mounted = true;

    const loadPatchData = async () => {
      try {
        setPatchLoading(true);
        setPatchError(null);
        
        // Load from server API endpoint
        const response = await fetch(`${API_URL}/api/csv/enggcurrentyear/rows?all=true`);
        
        if (!response.ok) {
          throw new Error(`Failed to load CY budget data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (mounted) {
          const processedData = processPatchData(result.rows || []);
          setRawPatchData(processedData);
          setLastUpdate(new Date());
          console.log('[PatchCYB] Loaded', processedData.length, 'CY budget records from server');
          
          // Debug: Check if balance_fund is properly calculated
          const sampleWithBalance = processedData.find(d => d.balance_fund > 0);
          if (sampleWithBalance) {
            console.log('[PatchCYB] Sample balance_fund calculation:', {
              allotment: sampleWithBalance.allotment_cfy,
              expenditure: sampleWithBalance.total_expdr_register,
              pendingBills: sampleWithBalance.pending_bills_total,
              balance: sampleWithBalance.balance_fund,
              utilizationRate: sampleWithBalance.utilization_rate,
              percentExpdr: sampleWithBalance.percent_total_expdr
            });
          }
        }
        
      } catch (err) {
        console.error('[PatchCYB] Error loading data:', err);
        if (mounted) {
          setPatchError(err.message);
        }
      } finally {
        if (mounted) {
          setPatchLoading(false);
        }
      }
    };

    loadPatchData();

    return () => {
      mounted = false;
    };
  }, [processPatchData]);

  // Create comprehensive filter mapping for patch data
  const patchFilters = useMemo(() => {
    if (!filters) return {};
    
    const mappedFilters = {
      searchTerm: filters.searchTerm || '',
      selectedBudgetHeads: [],
      selectedFrontierHQs: [],
      selectedSectorHQs: [],
      selectedRiskLevels: [],
      selectedHealthStatuses: [],
      selectedSchemes: [], // Will map to scheme_name and sub_scheme_name
      utilizationRange: null
    };

    // Map budget heads from filters
    // Note: The patch data uses 'budget_head' field after processing
    if (filters.selectedBudgetHeads?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.selectedBudgetHeads;
    } else if (filters.columnFilters?.budget_head?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.columnFilters.budget_head;
    } else if (filters.columnFilters?.['Budget head']?.length > 0) {
      // Handle direct column name from enggcurrentyear
      mappedFilters.selectedBudgetHeads = filters.columnFilters['Budget head'];
    }

    // Map frontier HQs - patch data uses 'ftr_hq' field
    if (filters.selectedFrontierHQs?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.selectedFrontierHQs;
    } else if (filters.columnFilters?.ftr_hq_name?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq_name;
    } else if (filters.columnFilters?.['Name of Ftr HQ']?.length > 0) {
      // Handle direct column name from enggcurrentyear
      mappedFilters.selectedFrontierHQs = filters.columnFilters['Name of Ftr HQ'];
    } else if (filters.columnFilters?.ftr_hq?.length > 0) {
      // Handle transformed field name
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq;
    }

    // Map sector HQs if available (not in patch data, but keep for consistency)
    if (filters.selectedSectorHQs?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.selectedSectorHQs;
    } else if (filters.columnFilters?.shq_name?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.columnFilters.shq_name;
    }

    // Map risk levels
    if (filters.selectedRiskLevels?.length > 0) {
      mappedFilters.selectedRiskLevels = filters.selectedRiskLevels;
    } else if (filters.columnFilters?.risk_level?.length > 0) {
      mappedFilters.selectedRiskLevels = filters.columnFilters.risk_level;
    }

    // Map health statuses
    if (filters.selectedHealthStatuses?.length > 0) {
      mappedFilters.selectedHealthStatuses = filters.selectedHealthStatuses;
    } else if (filters.columnFilters?.health_status?.length > 0) {
      mappedFilters.selectedHealthStatuses = filters.columnFilters.health_status;
    }

    // Map utilization range
    if (filters.rangeFilters?.utilization_rate?.current) {
      mappedFilters.utilizationRange = filters.rangeFilters.utilization_rate.current;
    } else if (filters.rangeFilters?.['% Age of total Expdr']?.current) {
      // Handle direct column name for utilization
      mappedFilters.utilizationRange = filters.rangeFilters['% Age of total Expdr'].current;
    }

    // Map scheme names and sub-scheme names - NEW MAPPING
    if (filters.selectedSchemes?.length > 0) {
      mappedFilters.selectedSchemes = filters.selectedSchemes;
    } else if (filters.columnFilters?.['Name of scheme']?.length > 0) {
      mappedFilters.selectedSchemes = filters.columnFilters['Name of scheme'];
    } else if (filters.columnFilters?.name_of_scheme?.length > 0) {
      mappedFilters.selectedSchemes = filters.columnFilters.name_of_scheme;
    }
    
    // Add mapping for sub_scheme_name to name_of_scheme - NEW MAPPING
    if (filters.columnFilters?.sub_scheme_name?.length > 0) {
      // If we already have schemes, merge with sub schemes
      if (mappedFilters.selectedSchemes && mappedFilters.selectedSchemes.length > 0) {
        mappedFilters.selectedSchemes = [
          ...mappedFilters.selectedSchemes,
          ...filters.columnFilters.sub_scheme_name
        ];
      } else {
        mappedFilters.selectedSchemes = filters.columnFilters.sub_scheme_name;
      }
    } else if (filters.columnFilters?.['Sub scheme name']?.length > 0) {
      // If we already have schemes, merge with sub schemes
      if (mappedFilters.selectedSchemes && mappedFilters.selectedSchemes.length > 0) {
        mappedFilters.selectedSchemes = [
          ...mappedFilters.selectedSchemes,
          ...filters.columnFilters['Sub scheme name']
        ];
      } else {
        mappedFilters.selectedSchemes = filters.columnFilters['Sub scheme name'];
      }
    }

    console.log('[MetricsCards] Mapped patch filters:', mappedFilters);
    return mappedFilters;
  }, [filters]);

  // Apply filters to patch data
  const patchData = useMemo(() => {
    if (!rawPatchData || rawPatchData.length === 0) return [];
    
    let filtered = [...rawPatchData];
    
    // Apply search filter
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.ftr_hq?.toLowerCase().includes(searchLower) ||
        item.budget_head?.toLowerCase().includes(searchLower) ||
        item.sub_head?.toLowerCase().includes(searchLower) ||
        item.scheme_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply budget head filter
    if (patchFilters?.selectedBudgetHeads?.length > 0) {
      filtered = filtered.filter(item => 
        patchFilters.selectedBudgetHeads.includes(item.budget_head)
      );
    }
    
    // Apply frontier HQ filter
    if (patchFilters?.selectedFrontierHQs?.length > 0) {
      filtered = filtered.filter(item => 
        patchFilters.selectedFrontierHQs.includes(item.ftr_hq)
      );
    }
    
    // Apply scheme filter if present - IMPROVED MATCHING
    if (patchFilters?.selectedSchemes?.length > 0) {
      filtered = filtered.filter(item => {
        // Direct match
        if (patchFilters.selectedSchemes.includes(item.scheme_name)) {
          return true;
        }
        
        // Partial match - check if any scheme contains the item's scheme name or vice versa
        return patchFilters.selectedSchemes.some(scheme => 
          (scheme && item.scheme_name && 
           (scheme.includes(item.scheme_name) || item.scheme_name.includes(scheme)))
        );
      });
    }
    
    // Apply risk level filter
    if (patchFilters?.selectedRiskLevels?.length > 0) {
      filtered = filtered.filter(item => 
        patchFilters.selectedRiskLevels.includes(item.risk_level)
      );
    }
    
    // Apply health status filter
    if (patchFilters?.selectedHealthStatuses?.length > 0) {
      filtered = filtered.filter(item => 
        patchFilters.selectedHealthStatuses.includes(item.health_status)
      );
    }
    
    // Apply utilization range filter
    if (patchFilters?.utilizationRange && Array.isArray(patchFilters.utilizationRange) && patchFilters.utilizationRange.length === 2) {
      const [min, max] = patchFilters.utilizationRange;
      filtered = filtered.filter(item => {
        const util = parseFloat(item.utilization_rate) || 0;
        return util >= min && util <= max;
      });
    }
    
    console.log('[PatchCYB] Filtered data:', filtered.length, 'of', rawPatchData.length, 'records');
    
    return filtered;
  }, [
    rawPatchData, 
    filters?.searchTerm, 
    patchFilters
  ]);

  // Calculate patch metrics with proper balance fund calculation and NaN prevention
  const patchMetrics = useMemo(() => {
    if (!patchData || patchData.length === 0) {
      return {
        totalRecords: 0,
        currentYearAllocation: 0,
        currentYearExpenditure: 0,
        pendingBillsPAD: 0,
        pendingBillsHQ: 0,
        totalPendingBills: 0,
        balanceFunds: 0,
        freshSanctions: 0,
        previousYearAllocation: 0,
        previousYearExpenditure: 0,
        liabilities: 0,
        effectiveSanction: 0,
        avgUtilizationRate: 0,
        avgEfficiencyScore: 0,
        criticalCount: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        underUtilized: 0,
        overUtilized: 0,
        optimalUtilized: 0,
        excellentHealth: 0,
        goodHealth: 0,
        normalHealth: 0,
        poorHealth: 0,
        criticalHealth: 0,
        topUtilizers: [],
        bottomUtilizers: [],
        largestPendingBills: []
      };
    }
    
    const total = patchData.length;
    
    // Helper to ensure valid numbers
    const ensureNumber = (val) => {
      const num = parseFloat(val) || 0;
      return isNaN(num) || !isFinite(num) ? 0 : num;
    };
    
    // Sum up financial metrics (convert from lakhs to crores)
    const currentYearAllocation = patchData.reduce((sum, d) => sum + ensureNumber(d.allotment_cfy), 0) / 100;
    const currentYearExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d.total_expdr_register), 0) / 100;
    const pendingBillsPAD = patchData.reduce((sum, d) => sum + ensureNumber(d.bill_pending_pad), 0) / 100;
    const pendingBillsHQ = patchData.reduce((sum, d) => sum + ensureNumber(d.bill_pending_hqrs), 0) / 100;
    const totalPendingBills = pendingBillsPAD + pendingBillsHQ;
    
    // Calculate balance funds properly
    const balanceFunds = patchData.reduce((sum, d) => sum + ensureNumber(d.balance_fund), 0) / 100;
    
    // Additional financial metrics
    const freshSanctions = patchData.reduce((sum, d) => sum + ensureNumber(d.fresh_sanction_cfy), 0) / 100;
    const previousYearAllocation = patchData.reduce((sum, d) => sum + ensureNumber(d.allotment_prev_fy), 0) / 100;
    const previousYearExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d.expdr_prev_year), 0) / 100;
    const liabilities = patchData.reduce((sum, d) => sum + ensureNumber(d.liabilities), 0) / 100;
    const effectiveSanction = patchData.reduce((sum, d) => sum + ensureNumber(d.effective_sanction), 0) / 100;
    
    // Calculate averages with NaN prevention
    const avgUtilizationRate = total > 0 
      ? patchData.reduce((sum, d) => sum + ensureNumber(d.utilization_rate), 0) / total
      : 0;
    
    const avgEfficiencyScore = total > 0
      ? patchData.reduce((sum, d) => sum + ensureNumber(d.efficiency_score), 0) / total
      : 0;
    
    // Count risk levels
    const criticalCount = patchData.filter(d => d.risk_level === 'CRITICAL').length;
    const highRiskCount = patchData.filter(d => d.risk_level === 'HIGH').length;
    const mediumRiskCount = patchData.filter(d => d.risk_level === 'MEDIUM').length;
    const lowRiskCount = patchData.filter(d => d.risk_level === 'LOW').length;
    
    // Utilization categories
    const underUtilized = patchData.filter(d => ensureNumber(d.utilization_rate) < 50).length;
    const overUtilized = patchData.filter(d => ensureNumber(d.utilization_rate) > 90).length;
    const optimalUtilized = patchData.filter(d => {
      const util = ensureNumber(d.utilization_rate);
      return util >= 50 && util <= 90;
    }).length;
    
    // Health status counts
    const excellentHealth = patchData.filter(d => d.health_status === 'EXCELLENT').length;
    const goodHealth = patchData.filter(d => d.health_status === 'GOOD').length;
    const normalHealth = patchData.filter(d => d.health_status === 'NORMAL').length;
    const poorHealth = patchData.filter(d => d.health_status === 'POOR').length;
    const criticalHealth = patchData.filter(d => d.health_status === 'CRITICAL').length;
    
    // Top and bottom performers
    const sortedByUtilization = [...patchData].sort((a, b) => 
      ensureNumber(b.utilization_rate) - ensureNumber(a.utilization_rate)
    );
    const topUtilizers = sortedByUtilization.slice(0, 5);
    const bottomUtilizers = sortedByUtilization.slice(-5).reverse();
    
    // Largest pending bills
    const largestPendingBills = [...patchData]
      .sort((a, b) => ensureNumber(b.pending_bills_total) - ensureNumber(a.pending_bills_total))
      .slice(0, 5);
    
    // Ensure all returned values are valid numbers
    const result = {
      totalRecords: total,
      currentYearAllocation: isNaN(currentYearAllocation) ? 0 : currentYearAllocation,
      currentYearExpenditure: isNaN(currentYearExpenditure) ? 0 : currentYearExpenditure,
      pendingBillsPAD: isNaN(pendingBillsPAD) ? 0 : pendingBillsPAD,
      pendingBillsHQ: isNaN(pendingBillsHQ) ? 0 : pendingBillsHQ,
      totalPendingBills: isNaN(totalPendingBills) ? 0 : totalPendingBills,
      balanceFunds: isNaN(balanceFunds) ? 0 : balanceFunds,
      freshSanctions: isNaN(freshSanctions) ? 0 : freshSanctions,
      previousYearAllocation: isNaN(previousYearAllocation) ? 0 : previousYearAllocation,
      previousYearExpenditure: isNaN(previousYearExpenditure) ? 0 : previousYearExpenditure,
      liabilities: isNaN(liabilities) ? 0 : liabilities,
      effectiveSanction: isNaN(effectiveSanction) ? 0 : effectiveSanction,
      avgUtilizationRate: isNaN(avgUtilizationRate) ? '0.00' : avgUtilizationRate.toFixed(2),
      avgEfficiencyScore: isNaN(avgEfficiencyScore) ? '0.00' : avgEfficiencyScore.toFixed(2),
      criticalCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      underUtilized,
      overUtilized,
      optimalUtilized,
      excellentHealth,
      goodHealth,
      normalHealth,
      poorHealth,
      criticalHealth,
      topUtilizers,
      bottomUtilizers,
      largestPendingBills
    };
    
    // Debug log for metrics
    console.log('[PatchCYB] Metrics calculated:', {
      totalRecords: result.totalRecords,
      balanceFunds: result.balanceFunds.toFixed(2),
      currentYearAllocation: result.currentYearAllocation.toFixed(2),
      currentYearExpenditure: result.currentYearExpenditure.toFixed(2),
      totalPendingBills: result.totalPendingBills.toFixed(2),
      avgUtilizationRate: result.avgUtilizationRate,
      avgEfficiencyScore: result.avgEfficiencyScore
    });
    
    return result;
  }, [patchData]);

  // Refresh data from server
  const refreshPatchData = useCallback(async () => {
    setPatchLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/csv/enggcurrentyear/rows?all=true`);
      if (!response.ok) throw new Error('Failed to refresh data');
      
      const result = await response.json();
      const processedData = processPatchData(result.rows || []);
      setRawPatchData(processedData);
      setLastUpdate(new Date());
      setPatchError(null);
      console.log('[PatchCYB] Data refreshed:', processedData.length, 'records');
      return processedData;
    } catch (err) {
      setPatchError(err.message);
      throw err;
    } finally {
      setPatchLoading(false);
    }
  }, [processPatchData]);

  // Update single record
  const updatePatchRecord = useCallback(async (index, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/csv/enggcurrentyear/rows/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update record');
      
      const result = await response.json();
      
      // Refresh data after update
      await refreshPatchData();
      
      return result;
    } catch (err) {
      console.error('[PatchCYB] Error updating record:', err);
      throw err;
    }
  }, [refreshPatchData]);

  // Add new record
  const addPatchRecord = useCallback(async (newRecord) => {
    try {
      // Generate ID if not provided
      if (!newRecord[dbConfig.idField]) {
        newRecord[dbConfig.idField] = generateId('enggcurrentyear', Date.now(), rawPatchData.length + 1);
      }
      
      const response = await fetch(`${API_URL}/api/csv/enggcurrentyear/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRecord)
      });
      
      if (!response.ok) throw new Error('Failed to add record');
      
      const result = await response.json();
      
      // Refresh data after adding
      await refreshPatchData();
      
      return result;
    } catch (err) {
      console.error('[PatchCYB] Error adding record:', err);
      throw err;
    }
  }, [dbConfig, rawPatchData.length, refreshPatchData]);

  // Delete record
  const deletePatchRecord = useCallback(async (index) => {
    try {
      const response = await fetch(`${API_URL}/api/csv/enggcurrentyear/rows/${index}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete record');
      
      const result = await response.json();
      
      // Refresh data after deletion
      await refreshPatchData();
      
      return result;
    } catch (err) {
      console.error('[PatchCYB] Error deleting record:', err);
      throw err;
    }
  }, [refreshPatchData]);

  return {
    patchData,
    patchMetrics,
    patchLoading,
    patchError,
    rawPatchData,
    lastUpdate,
    dbConfig,
    refreshPatchData,
    updatePatchRecord,
    addPatchRecord,
    deletePatchRecord,
    PatchDataTable: PatchDataTableComponent
  };
};

// Generate metric cards for patch data with enhanced details and fixed balance funds
export const generatePatchBudgetMetrics = (patchMetrics, darkMode = false) => {
  if (!patchMetrics) return [];
  
  // Helper to ensure valid number display
  const formatValue = (value) => {
    const num = parseFloat(value) || 0;
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };
  
  // Use balanceFunds (note the 's') as it's the correct property name
  const balanceAmount = formatValue(patchMetrics.balanceFunds);
  const allocationAmount = formatValue(patchMetrics.currentYearAllocation);
  const utilizationRate = formatValue(patchMetrics.avgUtilizationRate);
  const efficiencyScore = formatValue(patchMetrics.avgEfficiencyScore);
  
  return [
    {
      id: 'cy-allocation',
      group: 'budget',
      title: 'CY Allocation',
      value: `₹${allocationAmount.toFixed(2)}Cr`,
      subtitle: `${patchMetrics.totalRecords} heads`,
      icon: Wallet,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      isPatchData: true,
      percentage: 100,
      trend: allocationAmount > patchMetrics.previousYearAllocation ? 'up' : 'down',
      trendValue: patchMetrics.previousYearAllocation > 0 
        ? ((allocationAmount - patchMetrics.previousYearAllocation) / patchMetrics.previousYearAllocation * 100).toFixed(1)
        : 0,
      infoText: "Total budget allocated for the current financial year across all budget heads.",
      details: {
        'Previous Year': `₹${formatValue(patchMetrics.previousYearAllocation).toFixed(2)}Cr`,
        'Fresh Sanctions': `₹${formatValue(patchMetrics.freshSanctions).toFixed(2)}Cr`,
        'Effective Sanction': `₹${formatValue(patchMetrics.effectiveSanction).toFixed(2)}Cr`
      }
    },
    {
      id: 'cy-expenditure',
      group: 'budget',
      title: 'CY Expenditure',
      value: `₹${formatValue(patchMetrics.currentYearExpenditure).toFixed(2)}Cr`,
      subtitle: `${utilizationRate}% utilized`,
      icon: CreditCard,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      isPatchData: true,
      percentage: utilizationRate,
      trend: utilizationRate >= 70 ? 'up' : 'down',
      infoText: "Total expenditure in the current financial year including e-lekha bookings and pending bills.",
      details: {
        'Previous Year Expdr': `₹${formatValue(patchMetrics.previousYearExpenditure).toFixed(2)}Cr`,
        'Efficiency Score': `${efficiencyScore}%`,
        'Under Utilized': patchMetrics.underUtilized,
        'Over Utilized': patchMetrics.overUtilized
      }
    },
    {
      id: 'cy-pending-bills',
      group: 'budget',
      title: 'CY Pending Bills',
      value: `₹${formatValue(patchMetrics.totalPendingBills).toFixed(2)}Cr`,
      subtitle: `PAD: ₹${formatValue(patchMetrics.pendingBillsPAD).toFixed(2)}Cr | HQ: ₹${formatValue(patchMetrics.pendingBillsHQ).toFixed(2)}Cr`,
      icon: Receipt,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      isPatchData: true,
      alert: patchMetrics.totalPendingBills > allocationAmount * 0.1,
      severity: patchMetrics.totalPendingBills > allocationAmount * 0.15 ? 'high' : 'medium',
      infoText: "Bills pending with PAD and Headquarters for processing and payment.",
      details: {
        'Percent of Allocation': allocationAmount > 0 
          ? `${(formatValue(patchMetrics.totalPendingBills) / allocationAmount * 100).toFixed(1)}%`
          : '0%',
        'Critical Count': patchMetrics.criticalCount
      }
    },
    {
      id: 'cy-balance',
      group: 'budget',
      title: 'CY Balance Funds',
      value: `₹${balanceAmount.toFixed(2)}Cr`,
      subtitle: allocationAmount > 0 
        ? `${(balanceAmount / allocationAmount * 100).toFixed(1)}% available`
        : '0% available',
      icon: PiggyBank,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      isPatchData: true,
      percentage: allocationAmount > 0 ? (balanceAmount / allocationAmount * 100) : 0,
      infoText: "Remaining budget available for utilization in the current financial year (Allocation - Expenditure - Pending Bills).",
      details: {
        'Optimal Utilized': patchMetrics.optimalUtilized,
        'Time Remaining': 'Q4 FY 2024-25',
        'Allocation': `₹${allocationAmount.toFixed(2)}Cr`,
        'Spent + Pending': `₹${(formatValue(patchMetrics.currentYearExpenditure) + formatValue(patchMetrics.totalPendingBills)).toFixed(2)}Cr`
      }
    },
    {
      id: 'cy-liabilities',
      group: 'budget',
      title: 'CY Liabilities',
      value: `₹${formatValue(patchMetrics.liabilities).toFixed(2)}Cr`,
      subtitle: allocationAmount > 0 
        ? `${(formatValue(patchMetrics.liabilities) / allocationAmount * 100).toFixed(1)}% of allocation`
        : '0% of allocation',
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      isPatchData: true,
      alert: patchMetrics.liabilities > allocationAmount * 0.2,
      severity: patchMetrics.liabilities > allocationAmount * 0.3 ? 'critical' : 'high',
      infoText: "Liabilities carried forward from previous years that need to be cleared.",
      details: {
        'High Risk Count': patchMetrics.highRiskCount,
        'Critical Count': patchMetrics.criticalCount
      }
    },
    {
      id: 'cy-efficiency',
      group: 'performance',
      title: 'CY Efficiency Score',
      value: `${efficiencyScore}%`,
      subtitle: `${patchMetrics.excellentHealth + patchMetrics.goodHealth} performing well`,
      icon: Target,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      isPatchData: true,
      percentage: efficiencyScore,
      trend: efficiencyScore >= 70 ? 'up' : 'down',
      infoText: "Overall efficiency score based on utilization and pending bills.",
      details: {
        'Excellent': patchMetrics.excellentHealth,
        'Good': patchMetrics.goodHealth,
        'Normal': patchMetrics.normalHealth,
        'Poor': patchMetrics.poorHealth,
        'Critical': patchMetrics.criticalHealth
      }
    }
  ];
};

// Enhanced Patch Data Table Component with config integration
const PatchDataTableComponent = ({ 
  data = [], 
  darkMode = false, 
  title = "Current Year Budget Details",
  onClose,
  isModal = false,
  onRowEdit,
  onRowDelete,
  onRefresh
}) => {
  const [sortField, setSortField] = useState('serial_no');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  const itemsPerPage = 20;
  
  // Get database configuration
  const dbConfig = useMemo(() => getConfig('enggcurrentyear'), []);

  // Helper to ensure valid number display
  const ensureNumber = (val) => {
    const num = parseFloat(val) || 0;
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.ftr_hq?.toLowerCase().includes(search) ||
        item.budget_head?.toLowerCase().includes(search) ||
        item.sub_head?.toLowerCase().includes(search) ||
        item.scheme_name?.toLowerCase().includes(search)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    
    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'S.No',
      'Frontier HQ',
      'Budget Head',
      'Sub Head',
      'Scheme Name',
      'Allocation CFY',
      'Total Expenditure',
      'Utilization %',
      'Pending Bills (Total)',
      'Balance Fund',
      'Risk Level',
      'Health Status'
    ];
    
    const rows = processedData.map(row => [
      row.serial_no,
      row.ftr_hq,
      row.budget_head,
      row.sub_head || '',
      row.scheme_name || '',
      ensureNumber(row.allotment_cfy).toFixed(2),
      ensureNumber(row.total_expdr_register).toFixed(2),
      ensureNumber(row.utilization_rate).toFixed(2),
      ensureNumber(row.pending_bills_total).toFixed(2),
      ensureNumber(row.balance_fund).toFixed(2),
      row.risk_level,
      row.health_status
    ]);
    
    const csvContent = [
      ['Current Year Budget Analysis Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
      headers,
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cy-budget-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    const num = ensureNumber(value);
    return `₹${(num / 100).toFixed(2)}Cr`;
  };

  const getRiskBadgeColor = (risk) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[risk] || colors.LOW;
  };

  const getHealthBadgeColor = (health) => {
    const colors = {
      EXCELLENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      GOOD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      NORMAL: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      POOR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[health] || colors.NORMAL;
  };

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className={`relative w-[95vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          {/* Header with Config Icon */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-indigo-500 to-indigo-600'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-white" />
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                    {title}
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-indigo-100'}`}>
                    Database: {dbConfig.displayName} | {processedData.length} entries
                  </p>
                </div>
                <Key size={16} className="text-yellow-400" title={`ID Field: ${dbConfig.idField}`} />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdvancedView(!showAdvancedView)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  } transition-colors`}
                >
                  <Layers size={14} />
                  {showAdvancedView ? 'Simple' : 'Advanced'}
                </button>
                
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                    } transition-colors`}
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                )}
                
                <button
                  onClick={exportToCSV}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  } transition-colors`}
                >
                  <Download size={14} />
                  Export
                </button>
                
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-700'
                  } transition-colors`}
                >
                  <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`px-6 py-3 border-b ${
            darkMode ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Frontier HQ, Budget Head, Sub Head, or Scheme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-100 placeholder-gray-400 border-gray-600' 
                    : 'bg-white placeholder-gray-500 border-gray-200'
                } border focus:ring-2 focus:ring-indigo-400 focus:outline-none`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className={`w-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <thead className={`sticky top-0 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              } z-10`}>
                <tr>
                  {/* Table headers based on config */}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('serial_no')}>
                    <div className="flex items-center gap-1">
                      <Fingerprint size={12} className="text-yellow-500" />
                      ID
                      {sortField === 'serial_no' && (
                        <span className="text-indigo-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Building2 size={12} className="text-purple-500" />
                      Location
                    </div>
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <FileText size={12} className="text-blue-500" />
                      Budget Details
                    </div>
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('allotment_cfy')}>
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} className="text-green-500" />
                      Allocation
                      {sortField === 'allotment_cfy' && (
                        <span className="text-indigo-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calculator size={12} className="text-orange-500" />
                      Expenditure
                    </div>
                  </th>
                  
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('utilization_rate')}>
                    <div className="flex items-center gap-1">
                      <Gauge size={12} className="text-purple-500" />
                      Utilization
                      {sortField === 'utilization_rate' && (
                        <span className="text-indigo-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  
                  {showAdvancedView && (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-red-500" />
                          Pending Bills
                        </div>
                      </th>
                      
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('balance_fund')}>
                        <div className="flex items-center gap-1">
                          <PiggyBank size={12} className="text-green-500" />
                          Balance
                          {sortField === 'balance_fund' && (
                            <span className="text-indigo-500">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Shield size={12} className="text-yellow-500" />
                          Status
                        </div>
                      </th>
                    </>
                  )}
                  
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-opacity-50 transition-colors ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{row.serial_no}</span>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">{row.ftr_hq}</div>
                        {row.scheme_name && (
                          <div className="text-xs text-gray-500">{row.scheme_name}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">{row.budget_head}</div>
                        {row.sub_head && (
                          <div className="text-xs text-gray-500">{row.sub_head}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 text-sm font-medium">
                      {formatCurrency(row.allotment_cfy)}
                    </td>
                    
                    <td className="px-3 py-2 text-sm">
                      <div className="space-y-1">
                        <div>{formatCurrency(row.total_expdr_register)}</div>
                        <div className="text-xs text-gray-500">
                          Prev: {formatCurrency(row.expdr_prev_year)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ensureNumber(row.utilization_rate).toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              ensureNumber(row.utilization_rate) >= 90 ? 'bg-green-500' :
                              ensureNumber(row.utilization_rate) >= 70 ? 'bg-blue-500' :
                              ensureNumber(row.utilization_rate) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, ensureNumber(row.utilization_rate))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    
                    {showAdvancedView && (
                      <>
                        <td className="px-3 py-2 text-sm">
                          <div className="space-y-1">
                            <div className="text-xs font-medium">
                              Total: {formatCurrency(row.pending_bills_total)}
                            </div>
                            <div className="text-xs text-gray-500">
                              PAD: {formatCurrency(row.bill_pending_pad)}
                            </div>
                            <div className="text-xs text-gray-500">
                              HQ: {formatCurrency(row.bill_pending_hqrs)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(row.balance_fund)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ensureNumber(row.allotment_cfy) > 0 
                              ? `${((ensureNumber(row.balance_fund) / ensureNumber(row.allotment_cfy)) * 100).toFixed(1)}% avail`
                              : '0% avail'}
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 text-sm">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadgeColor(row.risk_level)}`}>
                              {row.risk_level}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getHealthBadgeColor(row.health_status)}`}>
                              {row.health_status}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    
                    <td className="px-3 py-2 text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onRowEdit && (
                          <button
                            onClick={() => onRowEdit(row, index)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                            title="Edit"
                          >
                            <Settings size={14} className="text-blue-500" />
                          </button>
                        )}
                        {onRowDelete && (
                          <button
                            onClick={() => onRowDelete(row, index)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            <X size={14} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-3 border-t ${
            darkMode ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-50'
          } flex items-center justify-between`}>
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 
                  ? i + 1 
                  : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === pageNum
                        ? 'bg-indigo-500 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-modal embedded view
  return null;
};

// Export the table component
export const PatchDataTable = PatchDataTableComponent;