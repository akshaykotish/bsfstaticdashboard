import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { getConfig, generateId, applyCalculations } from '../System/config';

const API_URL = 'http://localhost:3456';

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
          
          // Enhanced scheme mapping to use multiple sources
          scheme_name: processedRow['Name of scheme'] || processedRow['Sub head'] || '',
          // Add additional mappings to ensure compatibility
          name_of_scheme: processedRow['Name of scheme'] || processedRow['Sub head'] || '',
          sub_scheme_name: processedRow['Sub head'] || processedRow['Name of scheme'] || '',
          
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

    // Improved scheme name mapping - gather from all possible sources
    const schemeNameSources = [
      ...(filters.selectedSchemes || []),
      ...(filters.columnFilters?.name_of_scheme || []),
      ...(filters.columnFilters?.sub_scheme_name || []),
      ...(filters.columnFilters?.['Name of scheme'] || []),
      ...(filters.columnFilters?.['Sub head'] || [])
    ];

    if (schemeNameSources.length > 0) {
      // Deduplicate scheme names
      mappedFilters.selectedSchemes = Array.from(new Set(
        schemeNameSources.filter(Boolean)
      ));
    }

    console.log('[PatchCYB] Mapped filters:', mappedFilters);
    return mappedFilters;
  }, [filters]);

  // Apply filters to patch data with enhanced empty cell handling
  const patchData = useMemo(() => {
    if (!rawPatchData || rawPatchData.length === 0) return [];
    
    let filtered = [...rawPatchData];
    
    // Apply search filter
    if (patchFilters?.searchTerm) {
      const searchLower = patchFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.ftr_hq && item.ftr_hq.toLowerCase().includes(searchLower)) ||
        (item.budget_head && item.budget_head.toLowerCase().includes(searchLower)) ||
        (item.sub_head && item.sub_head.toLowerCase().includes(searchLower)) ||
        (item.scheme_name && item.scheme_name.toLowerCase().includes(searchLower)) ||
        (item.name_of_scheme && item.name_of_scheme.toLowerCase().includes(searchLower)) ||
        (item.sub_scheme_name && item.sub_scheme_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply budget head filter - only include non-empty values
    if (patchFilters?.selectedBudgetHeads?.length > 0) {
      filtered = filtered.filter(item => 
        item.budget_head && patchFilters.selectedBudgetHeads.includes(item.budget_head)
      );
    }
    
    // Apply frontier HQ filter - only include non-empty values
    if (patchFilters?.selectedFrontierHQs?.length > 0) {
      filtered = filtered.filter(item => 
        item.ftr_hq && patchFilters.selectedFrontierHQs.includes(item.ftr_hq)
      );
    }
    
    // Apply scheme filter with enhanced matching - exclude empty values
    if (patchFilters?.selectedSchemes?.length > 0) {
      filtered = filtered.filter(item => {
        // Check if any scheme field exists
        if (!item.scheme_name && !item.name_of_scheme && !item.sub_scheme_name) {
          return false;
        }
        
        // Check direct matches against any scheme field
        for (const scheme of patchFilters.selectedSchemes) {
          if (!scheme) continue;
          
          // Direct match check against all scheme field variants
          if ((item.scheme_name && item.scheme_name === scheme) || 
              (item.name_of_scheme && item.name_of_scheme === scheme) || 
              (item.sub_scheme_name && item.sub_scheme_name === scheme)) {
            return true;
          }
          
          // Partial match check - either contains the other
          const schemeLower = scheme.toLowerCase();
          if ((item.scheme_name && item.scheme_name.toLowerCase().includes(schemeLower)) ||
              (item.scheme_name && schemeLower.includes(item.scheme_name.toLowerCase())) ||
              (item.name_of_scheme && item.name_of_scheme.toLowerCase().includes(schemeLower)) ||
              (item.name_of_scheme && schemeLower.includes(item.name_of_scheme.toLowerCase())) ||
              (item.sub_scheme_name && item.sub_scheme_name.toLowerCase().includes(schemeLower)) ||
              (item.sub_scheme_name && schemeLower.includes(item.sub_scheme_name.toLowerCase()))) {
            return true;
          }
        }
        return false;
      });
    }
    
    // Apply risk level filter - exclude empty values
    if (patchFilters?.selectedRiskLevels?.length > 0) {
      filtered = filtered.filter(item => 
        item.risk_level && patchFilters.selectedRiskLevels.includes(item.risk_level)
      );
    }
    
    // Apply health status filter - exclude empty values
    if (patchFilters?.selectedHealthStatuses?.length > 0) {
      filtered = filtered.filter(item => 
        item.health_status && patchFilters.selectedHealthStatuses.includes(item.health_status)
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
    patchFilters
  ]);

  // Calculate patch metrics with proper balance fund calculation and NaN prevention
  const patchMetrics = useMemo(() => {
    if (!patchData || patchData.length === 0) {
      return {
        totalRecords: 0,
        currentYearAllocation: 0,
        currentYearExpenditure: 0,
        elekhaExpenditure: 0, // Added E-Lekha expenditure
        elekhaExpenditureWithPending: 0, // Added E-Lekha + Pending bills
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
    
    // Add E-Lekha expenditure calculation
    const elekhaExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d.expdr_elekha_22_07), 0) / 100;
    
    const pendingBillsPAD = patchData.reduce((sum, d) => sum + ensureNumber(d.bill_pending_pad), 0) / 100;
    const pendingBillsHQ = patchData.reduce((sum, d) => sum + ensureNumber(d.bill_pending_hqrs), 0) / 100;
    const totalPendingBills = pendingBillsPAD + pendingBillsHQ;
    
    // Calculate E-Lekha + Pending bills total
    const elekhaExpenditureWithPending = elekhaExpenditure + totalPendingBills;
    
    // Calculate balance funds properly
    const balanceFunds = Math.max(0, currentYearAllocation - elekhaExpenditureWithPending);
    
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
      elekhaExpenditure: isNaN(elekhaExpenditure) ? 0 : elekhaExpenditure, // Added E-Lekha expenditure
      elekhaExpenditureWithPending: isNaN(elekhaExpenditureWithPending) ? 0 : elekhaExpenditureWithPending, // Added E-Lekha + Pending
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
      elekhaExpenditure: result.elekhaExpenditure.toFixed(2),
      elekhaExpenditureWithPending: result.elekhaExpenditureWithPending.toFixed(2),
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

// Updated: Generate metric cards for patch data with the new metrics structure
export const generatePatchBudgetMetrics = (patchMetrics, darkMode = false) => {
  if (!patchMetrics) return [];
  
  // Helper to ensure valid number display
  const formatValue = (value) => {
    const num = parseFloat(value) || 0;
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };
  
  const balanceAmount = formatValue(patchMetrics.balanceFunds);
  const allocationAmount = formatValue(patchMetrics.currentYearAllocation);
  const utilizationRate = formatValue(patchMetrics.avgUtilizationRate);
  const efficiencyScore = formatValue(patchMetrics.avgEfficiencyScore);
  const elekhaExpenditure = formatValue(patchMetrics.elekhaExpenditure);
  const pendingBillsAmount = formatValue(patchMetrics.totalPendingBills);
  const totalExpenditureAmount = formatValue(patchMetrics.elekhaExpenditureWithPending);
  
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
      id: 'cy-elekha-expenditure',
      group: 'budget',
      title: 'CY Expenditure (E-Lekha)',
      value: `₹${elekhaExpenditure.toFixed(2)}Cr`,
      subtitle: `${(elekhaExpenditure / allocationAmount * 100).toFixed(1)}% of allocation`,
      icon: Calculator,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      isPatchData: true,
      percentage: allocationAmount > 0 ? (elekhaExpenditure / allocationAmount * 100) : 0,
      trend: (elekhaExpenditure / allocationAmount * 100) >= 70 ? 'up' : 'down',
      infoText: "Total expenditure booked in e-lekha system for the current financial year.",
      details: {
        'Previous Year Expdr': `₹${formatValue(patchMetrics.previousYearExpenditure).toFixed(2)}Cr`,
        'As of Date': 'July 22, 2025',
        'Utilization Rate': `${(elekhaExpenditure / allocationAmount * 100).toFixed(1)}%`
      }
    },
    {
      id: 'cy-pending-bills',
      group: 'budget',
      title: 'CY Pending Bills',
      value: `₹${pendingBillsAmount.toFixed(2)}Cr`,
      subtitle: `PAD: ₹${formatValue(patchMetrics.pendingBillsPAD).toFixed(2)}Cr | HQ: ₹${formatValue(patchMetrics.pendingBillsHQ).toFixed(2)}Cr`,
      icon: Receipt,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      isPatchData: true,
      alert: pendingBillsAmount > allocationAmount * 0.1,
      severity: pendingBillsAmount > allocationAmount * 0.15 ? 'high' : 'medium',
      infoText: "Bills pending with PAD and Headquarters for processing and payment.",
      details: {
        'Percent of Allocation': allocationAmount > 0 
          ? `${(pendingBillsAmount / allocationAmount * 100).toFixed(1)}%`
          : '0%',
        'Critical Count': patchMetrics.criticalCount,
        'High Risk Count': patchMetrics.highRiskCount
      }
    },
    {
      id: 'cy-total-expenditure',
      group: 'budget',
      title: 'CY Expenditure (E-Lekha + Pending)',
      value: `₹${totalExpenditureAmount.toFixed(2)}Cr`,
      subtitle: `${(totalExpenditureAmount / allocationAmount * 100).toFixed(1)}% of allocation`,
      icon: TrendingUp,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      isPatchData: true,
      percentage: allocationAmount > 0 ? (totalExpenditureAmount / allocationAmount * 100) : 0,
      trend: (totalExpenditureAmount / allocationAmount * 100) >= 80 ? 'up' : 'down',
      infoText: "Total combined expenditure including e-lekha bookings and pending bills.",
      details: {
        'E-Lekha': `₹${elekhaExpenditure.toFixed(2)}Cr`,
        'Pending Bills': `₹${pendingBillsAmount.toFixed(2)}Cr`,
        'Utilization Rate': `${(totalExpenditureAmount / allocationAmount * 100).toFixed(1)}%`
      }
    },
    {
      id: 'cy-balance',
      group: 'budget',
      title: 'CY Balance Fund',
      value: `₹${balanceAmount.toFixed(2)}Cr`,
      subtitle: allocationAmount > 0 
        ? `${(balanceAmount / allocationAmount * 100).toFixed(1)}% available`
        : '0% available',
      icon: PiggyBank,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      isPatchData: true,
      percentage: allocationAmount > 0 ? (balanceAmount / allocationAmount * 100) : 0,
      infoText: "Remaining budget available for utilization in the current financial year (Allocation - E-Lekha - Pending Bills).",
      details: {
        'Optimal Utilized': patchMetrics.optimalUtilized,
        'Time Remaining': 'Q4 FY 2024-25',
        'Allocation': `₹${allocationAmount.toFixed(2)}Cr`,
        'Spent + Pending': `₹${totalExpenditureAmount.toFixed(2)}Cr`
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

// Enhanced Patch Data Table Component with all columns from config
const PatchDataTableComponent = ({ 
  data = [], 
  darkMode = false, 
  title = "Current Year Budget Details",
  onClose,
  isModal = false,
  onRefresh
}) => {
  const [sortField, setSortField] = useState('serial_no');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'compact', 'detailed'
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const itemsPerPage = 15;
  
  // Get database configuration
  const dbConfig = useMemo(() => getConfig('enggcurrentyear'), []);

  // Define all available columns with metadata
  const availableColumns = useMemo(() => [
    // Basic Information group
    { id: 'serial_no', field: 'serial_no', header: 'ID', group: 'basic', width: 70, sortable: true, alwaysVisible: true,
      icon: <Fingerprint size={12} className="text-yellow-500" />, format: val => val },
    { id: 'ftr_hq', field: 'ftr_hq', header: 'Frontier HQ', group: 'basic', width: 120, sortable: true, alwaysVisible: true,
      icon: <Building2 size={12} className="text-purple-500" />, format: val => val },
    { id: 'budget_head', field: 'budget_head', header: 'Budget Head', group: 'basic', width: 120, sortable: true,
      icon: <FileText size={12} className="text-blue-500" />, format: val => val },
    { id: 'sub_head', field: 'sub_head', header: 'Sub Head', group: 'basic', width: 130, sortable: true,
      icon: <FileText size={12} className="text-blue-500" />, format: val => val },
    { id: 'scheme_name', field: 'scheme_name', header: 'Scheme Name', group: 'basic', width: 150, sortable: true,
      icon: <FileText size={12} className="text-blue-500" />, format: val => val },
      
    // Financial Allocations group
    { id: 'allotment_prev_fy', field: 'allotment_prev_fy', header: 'Previous FY Allotment', group: 'allocation', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => formatCurrency(val) },
    { id: 'liabilities', field: 'liabilities', header: 'Liabilities', group: 'allocation', width: 120, sortable: true,
      icon: <AlertCircle size={12} className="text-red-500" />, format: val => formatCurrency(val) },
    { id: 'fresh_sanction_cfy', field: 'fresh_sanction_cfy', header: 'Fresh Sanction', group: 'allocation', width: 120, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => formatCurrency(val) },
    { id: 'effective_sanction', field: 'effective_sanction', header: 'Effective Sanction', group: 'allocation', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => formatCurrency(val) },
    { id: 'allotment_cfy', field: 'allotment_cfy', header: 'Current FY Allotment', group: 'allocation', width: 130, sortable: true, alwaysVisible: true,
      icon: <Wallet size={12} className="text-green-500" />, format: val => formatCurrency(val) },
    { id: 'allotment_fy_24_25', field: 'allotment_fy_24_25', header: 'FY 24-25 Allotment', group: 'allocation', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => formatCurrency(val) },
      
    // Expenditure group
    { id: 'expdr_prev_year', field: 'expdr_prev_year', header: 'Previous Year Expdr', group: 'expenditure', width: 130, sortable: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => formatCurrency(val) },
    { id: 'expdr_elekha_22_07', field: 'expdr_elekha_22_07', header: 'E-lekha Expdr (22/07)', group: 'expenditure', width: 140, sortable: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => formatCurrency(val) },
    { id: 'expdr_elekha_31_03', field: 'expdr_elekha_31_03', header: 'E-lekha Expdr (31/03)', group: 'expenditure', width: 140, sortable: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => formatCurrency(val) },
    { id: 'total_expdr_register', field: 'total_expdr_register', header: 'Total Expenditure', group: 'expenditure', width: 130, sortable: true, alwaysVisible: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => formatCurrency(val) },
    { id: 'percent_expdr_elekha', field: 'percent_expdr_elekha', header: 'E-lekha %', group: 'expenditure', width: 100, sortable: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${ensureNumber(val).toFixed(1)}%` },
    { id: 'percent_total_expdr', field: 'percent_total_expdr', header: 'Total Expdr %', group: 'expenditure', width: 100, sortable: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${ensureNumber(val).toFixed(1)}%` },
    { id: 'utilization_rate', field: 'utilization_rate', header: 'Utilization %', group: 'expenditure', width: 110, sortable: true, alwaysVisible: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${ensureNumber(val).toFixed(1)}%`,
      render: (row) => (
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
      )
    },
      
    // Pending Bills group
    { id: 'bill_pending_pad', field: 'bill_pending_pad', header: 'Bills Pending PAD', group: 'pending', width: 130, sortable: true,
      icon: <Receipt size={12} className="text-red-500" />, format: val => formatCurrency(val) },
    { id: 'bill_pending_hqrs', field: 'bill_pending_hqrs', header: 'Bills Pending HQ', group: 'pending', width: 130, sortable: true,
      icon: <Receipt size={12} className="text-red-500" />, format: val => formatCurrency(val) },
    { id: 'pending_bills_total', field: 'pending_bills_total', header: 'Total Pending Bills', group: 'pending', width: 140, sortable: true,
      icon: <Clock size={12} className="text-red-500" />, format: val => formatCurrency(val) },
      
    // Balance & Planning group
    { id: 'balance_fund', field: 'balance_fund', header: 'Balance Fund', group: 'balance', width: 120, sortable: true, alwaysVisible: true,
      icon: <PiggyBank size={12} className="text-green-500" />, format: val => formatCurrency(val),
      render: (row) => (
        <div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(row.balance_fund)}
          </div>
          <div className="text-xs text-gray-500">
            {ensureNumber(row.allotment_cfy) > 0 
              ? `${((ensureNumber(row.balance_fund) / ensureNumber(row.allotment_cfy)) * 100).toFixed(1)}% avail`
              : '0% avail'}
          </div>
        </div>
      )
    },
    { id: 'expdr_plan_balance', field: 'expdr_plan_balance', header: 'Balance Expdr Plan', group: 'balance', width: 140, sortable: true,
      icon: <TrendingUp size={12} className="text-blue-500" />, format: val => formatCurrency(val) },
      
    // Status & Analysis group
    { id: 'risk_level', field: 'risk_level', header: 'Risk Level', group: 'status', width: 110, sortable: true,
      icon: <AlertTriangle size={12} className="text-yellow-500" />, 
      format: val => val,
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadgeColor(row.risk_level)}`}>
          {row.risk_level}
        </span>
      )
    },
    { id: 'health_status', field: 'health_status', header: 'Health Status', group: 'status', width: 120, sortable: true,
      icon: <Activity size={12} className="text-blue-500" />, 
      format: val => val,
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getHealthBadgeColor(row.health_status)}`}>
          {row.health_status}
        </span>
      )
    },
    { id: 'efficiency_score', field: 'efficiency_score', header: 'Efficiency Score', group: 'status', width: 130, sortable: true,
      icon: <Target size={12} className="text-purple-500" />, format: val => `${ensureNumber(val).toFixed(1)}%` },
    { id: 'priority', field: 'priority', header: 'Priority', group: 'status', width: 100, sortable: true,
      icon: <AlertCircle size={12} className="text-orange-500" />, 
      format: val => val,
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          row.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          row.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {row.priority}
        </span>
      )
    },
  ], []);

  // Define column groups
  const columnGroups = useMemo(() => [
    { id: 'basic', name: 'Basic Information', icon: <FileText size={14} /> },
    { id: 'allocation', name: 'Financial Allocations', icon: <DollarSign size={14} /> },
    { id: 'expenditure', name: 'Expenditure Details', icon: <Calculator size={14} /> },
    { id: 'pending', name: 'Pending Bills', icon: <Clock size={14} /> },
    { id: 'balance', name: 'Balance & Planning', icon: <PiggyBank size={14} /> },
    { id: 'status', name: 'Status & Analysis', icon: <Activity size={14} /> },
  ], []);

  // Default visible columns by view mode
  const defaultVisibleColumns = useMemo(() => ({
    compact: ['serial_no', 'ftr_hq', 'budget_head', 'allotment_cfy', 'total_expdr_register', 'utilization_rate', 'balance_fund'],
    standard: ['serial_no', 'ftr_hq', 'budget_head', 'sub_head', 'scheme_name', 'allotment_cfy', 'total_expdr_register', 
               'utilization_rate', 'pending_bills_total', 'balance_fund', 'risk_level', 'health_status'],
    detailed: availableColumns.map(col => col.id)
  }), [availableColumns]);

  // Initialize selected columns based on view mode
  useEffect(() => {
    setSelectedColumns(defaultVisibleColumns[viewMode]);
  }, [viewMode, defaultVisibleColumns]);

  // Helper to ensure valid number display
  const ensureNumber = (val) => {
    const num = parseFloat(val) || 0;
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  // Format currency values (lakhs to crores)
  const formatCurrency = (value) => {
    const num = ensureNumber(value);
    return `₹${num.toFixed(2)}L`; // Displaying in Lakhs
  };

  // Get risk level badge color
  const getRiskBadgeColor = (risk) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[risk] || colors.LOW;
  };

  // Get health status badge color
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

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.ftr_hq && item.ftr_hq.toLowerCase().includes(search)) ||
          (item.budget_head && item.budget_head.toLowerCase().includes(search)) ||
          (item.sub_head && item.sub_head.toLowerCase().includes(search)) ||
          (item.scheme_name && item.scheme_name.toLowerCase().includes(search)) ||
          (item.name_of_scheme && item.name_of_scheme.toLowerCase().includes(search)) ||
          (item.sub_scheme_name && item.sub_scheme_name.toLowerCase().includes(search)) ||
          (item.serial_no && item.serial_no.toString().includes(search)) ||
          (item.risk_level && item.risk_level.toLowerCase().includes(search)) ||
          (item.health_status && item.health_status.toLowerCase().includes(search))
        );
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
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

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    // Get selected column headers
    const visibleColumns = availableColumns.filter(col => selectedColumns.includes(col.id));
    const headers = visibleColumns.map(col => col.header);
    
    // Format rows for export
    const rows = processedData.map(row => 
      visibleColumns.map(col => {
        const rawValue = row[col.field];
        return col.format ? col.format(rawValue).replace(/[,₹L%]/g, '') : rawValue;
      })
    );
    
    // Create CSV content
    const csvContent = [
      ['Current Year Budget Analysis Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
      headers,
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cy-budget-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle column selection
  const toggleColumnSelection = (colId) => {
    setSelectedColumns(prev => {
      if (prev.includes(colId)) {
        // Don't allow removing always visible columns
        const col = availableColumns.find(c => c.id === colId);
        if (col?.alwaysVisible) return prev;
        return prev.filter(id => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  // Column selector component
  const ColumnSelector = () => (
    <div className={`absolute top-full right-0 mt-1 p-4 rounded-lg shadow-lg z-20 w-72 ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        Select Columns to Display
      </h3>
      
      <div className="max-h-96 overflow-y-auto pr-2">
        {columnGroups.map(group => (
          <div key={group.id} className="mb-4">
            <div className={`flex items-center gap-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {group.icon}
              <span className="text-xs font-medium uppercase">{group.name}</span>
            </div>
            
            <div className="space-y-1.5 ml-6">
              {availableColumns.filter(col => col.group === group.id).map(col => {
                const isSelected = selectedColumns.includes(col.id);
                return (
                  <div 
                    key={col.id}
                    className={`flex items-center gap-2 text-sm py-1 px-2 rounded ${
                      isSelected 
                        ? darkMode 
                          ? 'bg-indigo-900/30 text-indigo-300' 
                          : 'bg-indigo-50 text-indigo-700'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`col-${col.id}`}
                      checked={isSelected}
                      onChange={() => toggleColumnSelection(col.id)}
                      disabled={col.alwaysVisible}
                      className="rounded text-indigo-500 focus:ring-indigo-500"
                    />
                    <label 
                      htmlFor={`col-${col.id}`}
                      className={`flex-1 cursor-pointer flex items-center gap-2 ${
                        col.alwaysVisible ? 'italic' : ''
                      }`}
                    >
                      {col.icon}
                      <span>{col.header}</span>
                      {col.alwaysVisible && (
                        <span className="text-xs text-gray-500">(Required)</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setSelectedColumns(defaultVisibleColumns[viewMode])}
          className={`px-2 py-1 text-xs rounded ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Reset
        </button>
        <button
          onClick={() => setShowColumnSelector(false)}
          className={`px-2 py-1 text-xs rounded ${
            darkMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          Done
        </button>
      </div>
    </div>
  );

  // Render modal view
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
                {/* View Mode Selector */}
                <div className="relative flex items-center border rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      viewMode === 'compact'
                        ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setViewMode('standard')}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      viewMode === 'standard'
                        ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      viewMode === 'detailed'
                        ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
                
                {/* Column Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                    } transition-colors`}
                  >
                    <Layers size={14} />
                    Columns
                  </button>
                  
                  {showColumnSelector && <ColumnSelector />}
                </div>
                
                {/* Refresh Button */}
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
                
                {/* Export Button */}
                <button
                  onClick={exportToCSV}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  } transition-colors`}
                >
                  <Download size={14} />
                  Export
                </button>
                
                {/* Close Button */}
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
            <div className="flex justify-between items-center">
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
              
              <div className="text-sm text-gray-500">
                {processedData.length} records found
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className={`w-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <thead className={`sticky top-0 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              } z-10`}>
                <tr>
                  {availableColumns
                    .filter(col => selectedColumns.includes(col.id))
                    .map(col => (
                      <th 
                        key={col.id}
                        className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          col.sortable ? 'cursor-pointer' : ''
                        }`}
                        style={{ minWidth: col.width }}
                        onClick={() => col.sortable ? handleSort(col.field) : null}
                      >
                        <div className="flex items-center gap-1">
                          {col.icon}
                          <span>{col.header}</span>
                          {col.sortable && sortField === col.field && (
                            <span className="text-indigo-500">
                              {sortDirection === 'asc' ? '↓' : '↑'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={row.id || index}
                    className={`hover:bg-opacity-50 transition-colors ${
                      row.risk_level === 'CRITICAL' ? (darkMode ? 'bg-red-900/10' : 'bg-red-50') :
                      row.risk_level === 'HIGH' ? (darkMode ? 'bg-orange-900/10' : 'bg-orange-50') :
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    {availableColumns
                      .filter(col => selectedColumns.includes(col.id))
                      .map(col => (
                        <td 
                          key={col.id}
                          className="px-3 py-2 text-sm"
                          style={{ maxWidth: col.width * 2 }}
                        >
                          {col.render ? col.render(row) : col.format(row[col.field])}
                        </td>
                      ))}
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

  // Non-modal embedded view - would implement if needed
  return null;
};

// Export the table component
export const PatchDataTable = PatchDataTableComponent;