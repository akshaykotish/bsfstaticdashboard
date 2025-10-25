import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, Activity, PiggyBank, Wallet,
  CreditCard, Database, Target, Gauge,
  FileText, X, Download, Search, Filter,
  IndianRupee, Banknote, Coins, Receipt,
  RefreshCw, ChevronDown, ChevronUp, Settings,
  Calendar, Clock, Calculator, Hash, Building2,
  MapPin, Layers, Shield, Fingerprint, Key, Edit,
  Plus
} from 'lucide-react';

// Import database configurations from config.js
import { getConfig, generateId, applyCalculations } from '../System/config';

// Import EditRow and AddRow components
import EditRow from '../System/EditRow';
import AddRow from '../System/AddRow';

const API_URL = 'http://localhost:3456';

// Hook to load and process patch data from enggcurrentyear database
export const usePatchEngineeringCYB = (filters = {}) => {
  const [rawPatchData, setRawPatchData] = useState([]);
  const [patchLoading, setPatchLoading] = useState(true);
  const [patchError, setPatchError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [showAddRowModal, setShowAddRowModal] = useState(false);

  console.log('[PatchCYB] Filters received:', filters);
  
  // Get database configuration for enggcurrentyear
  const dbConfig = useMemo(() => getConfig('enggcurrentyear'), []);

  // Enhanced scheme name normalization helper
  const normalizeScheme = useCallback((schemeName) => {
    if (!schemeName) return '';
    return schemeName.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\(|\)|,|\.|\//g, '')
      .trim();
  }, []);

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
        // USING EXACT COLUMN NAMES FROM CONFIG.JS
        const processed = {
          // ID field
          id: processedRow[dbConfig.idField] || `cy_${index + 1}`,
          serial_no: processedRow[dbConfig.idField],
          'S/No.': processedRow[dbConfig.idField],
          
          // Basic Information - EXACT field names from config.js
          ftr_hq_name: processedRow['ftr_hq_name'] || 'Unknown',
          shq_name: processedRow['shq_name'] || '',
          budget_head: processedRow['budget_head'] || 'Unknown',
          'sub_scheme-name': processedRow['sub_scheme-name'] || '',
          executive_agency: processedRow['executive_agency'] || '',
          
          // Legacy field mappings for backward compatibility
          ftr_hq: processedRow['ftr_hq_name'] || 'Unknown',
          sub_scheme_name: processedRow['sub_scheme-name'] || '',
          sub_head: processedRow['sub_scheme-name'] || '',
          scheme_name: processedRow['sub_scheme-name'] || '',
          name_of_scheme: processedRow['sub_scheme-name'] || '',
          
          // Add normalized scheme name for filtering
          normalized_scheme_name: normalizeScheme(processedRow['sub_scheme-name'] || ''),
          
          // Previous Year Financial Data - EXACT field names from config.js
          'Allotment Previous Financila year': cleanNumber(processedRow['Allotment Previous Financila year']),
          'Expdr previous year': cleanNumber(processedRow['Expdr previous year']),
          'Liabilities': cleanNumber(processedRow['Liabilities']),
          
          // Legacy mappings
          allotment_prev_fy: cleanNumber(processedRow['Allotment Previous Financila year']),
          expdr_prev_year: cleanNumber(processedRow['Expdr previous year']),
          liabilities: cleanNumber(processedRow['Liabilities']),
          
          // Current Year Sanctions & Allotments - EXACT field names from config.js
          'Fresh Sanction issued during CFY': cleanNumber(processedRow['Fresh Sanction issued during CFY']),
          'Effective sanction': cleanNumber(processedRow['Effective sanction']),
          'Allotment CFY': cleanNumber(processedRow['Allotment CFY']),
          'Allotment (FY 24-25)': cleanNumber(processedRow['Allotment (FY 24-25)']),
          
          // Legacy mappings
          fresh_sanction_cfy: cleanNumber(processedRow['Fresh Sanction issued during CFY']),
          effective_sanction: cleanNumber(processedRow['Effective sanction']),
          allotment_cfy: cleanNumber(processedRow['Allotment CFY']),
          allotment_fy_24_25: cleanNumber(processedRow['Allotment (FY 24-25)']),
          
          // Current Year Expenditure - EXACT field names from config.js
          'Expdr_as_per_elekha': cleanNumber(processedRow['Expdr_as_per_elekha']),
          '% Age of expdr as per e-lekha': cleanPercentage(processedRow['% Age of expdr as per e-lekha']),
          
          // Legacy mappings
          expdr_elekha: cleanNumber(processedRow['Expdr_as_per_elekha']),
          expdr_elekha_22_07: cleanNumber(processedRow['Expdr_as_per_elekha']),
          expdr_elekha_31_03: cleanNumber(processedRow['Expdr_as_per_elekha']),
          percent_expdr_elekha: cleanPercentage(processedRow['% Age of expdr as per e-lekha']),
          
          // Pending Bills - EXACT field names from config.js
          'Bill pending with PAD': cleanNumber(processedRow['Bill pending with PAD']),
          'Bill pending with HQrs': cleanNumber(processedRow['Bill pending with HQrs']),
          
          // Legacy mappings
          bill_pending_pad: cleanNumber(processedRow['Bill pending with PAD']),
          bill_pending_hqrs: cleanNumber(processedRow['Bill pending with HQrs']),
          
          // Totals & Balance - EXACT field names from config.js
          'Total Expdr as per contengency register': cleanNumber(processedRow['Total Expdr as per contengency register']),
          '% Age of total Expdr': cleanPercentage(processedRow['% Age of total Expdr']),
          'Balance fund': cleanNumber(processedRow['Balance fund']),
          'Expdr plan for balance fund': cleanNumber(processedRow['Expdr plan for balance fund']),
          
          // Legacy mappings
          total_expdr_register: cleanNumber(processedRow['Total Expdr as per contengency register']),
          percent_total_expdr: cleanPercentage(processedRow['% Age of total Expdr']),
          balance_fund: cleanNumber(processedRow['Balance fund']),
          expdr_plan_balance: cleanNumber(processedRow['Expdr plan for balance fund']),
          
          // Additional calculated fields
          utilization_rate: 0,
          pending_bills_total: 0,
          efficiency_score: 0,
          risk_level: 'LOW',
          health_status: 'NORMAL',
          priority: 'NORMAL'
        };

        // Recalculate percentages if not already calculated
        const allotment = processed['Allotment CFY'];
        const totalExpdr = processed['Total Expdr as per contengency register'];
        const expdrElekha = processed['Expdr_as_per_elekha'];
        const pendingPAD = processed['Bill pending with PAD'];
        const pendingHQ = processed['Bill pending with HQrs'];
        
        // Calculate percentages if they're zero (means they weren't in the data)
        if (processed['% Age of expdr as per e-lekha'] === 0 && allotment > 0) {
          processed['% Age of expdr as per e-lekha'] = parseFloat(safeDivide(expdrElekha, allotment, 100).toFixed(2));
          processed.percent_expdr_elekha = processed['% Age of expdr as per e-lekha'];
        }
        
        if (processed['% Age of total Expdr'] === 0 && allotment > 0) {
          processed['% Age of total Expdr'] = parseFloat(safeDivide(totalExpdr, allotment, 100).toFixed(2));
          processed.percent_total_expdr = processed['% Age of total Expdr'];
        }
        
        // Calculate balance fund if not already calculated
        if (processed['Balance fund'] === 0 && allotment > 0) {
          processed['Balance fund'] = Math.max(0, allotment - expdrElekha - pendingPAD - pendingHQ);
          if (isNaN(processed['Balance fund']) || !isFinite(processed['Balance fund'])) {
            processed['Balance fund'] = 0;
          }
          processed.balance_fund = processed['Balance fund'];
        }

        // Calculate derived metrics with NaN prevention
        processed.pending_bills_total = pendingPAD + pendingHQ;
        if (isNaN(processed.pending_bills_total)) {
          processed.pending_bills_total = 0;
        }
        
        // Calculate utilization rate based on e-lekha expenditure
        processed.utilization_rate = parseFloat(safeDivide(expdrElekha, allotment, 100).toFixed(2));
        
        // Calculate efficiency score with NaN prevention
        if (allotment > 0) {
          const utilizationScore = Math.min(100, safeDivide(expdrElekha, allotment, 100));
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
          'Allotment Previous Financila year', 'Expdr previous year', 'Liabilities',
          'Fresh Sanction issued during CFY', 'Effective sanction', 'Allotment CFY',
          'Allotment (FY 24-25)', 'Expdr_as_per_elekha', '% Age of expdr as per e-lekha',
          'Bill pending with PAD', 'Bill pending with HQrs', 
          'Total Expdr as per contengency register', '% Age of total Expdr',
          'Balance fund', 'Expdr plan for balance fund',
          'utilization_rate', 'pending_bills_total', 'efficiency_score'
        ];
        
        numericFields.forEach(field => {
          if (processed[field] !== undefined && (isNaN(processed[field]) || !isFinite(processed[field]))) {
            console.warn(`[PatchCYB] Field ${field} is NaN, setting to 0`);
            processed[field] = 0;
          }
        });
        
        // Debug log for first few records to verify e-lekha values
        if (index < 3) {
          console.log(`[PatchCYB] Record ${index + 1} E-Lekha value:`, {
            raw: processedRow['Expdr_as_per_elekha'],
            processed: processed['Expdr_as_per_elekha'],
            allocation: processed['Allotment CFY'],
            utilization: processed.utilization_rate
          });
        }
        
        return processed;
      });
  }, [dbConfig, normalizeScheme]);

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
          
          // Debug: Check if e-lekha values are properly loaded
          const sampleWithElekha = processedData.find(d => d['Expdr_as_per_elekha'] > 0);
          if (sampleWithElekha) {
            console.log('[PatchCYB] Sample E-Lekha calculation:', {
              elekhaExpdr: sampleWithElekha['Expdr_as_per_elekha'],
              allotment: sampleWithElekha['Allotment CFY'],
              percentElekha: sampleWithElekha['% Age of expdr as per e-lekha'],
              balance: sampleWithElekha['Balance fund'],
              utilizationRate: sampleWithElekha.utilization_rate
            });
          } else {
            console.warn('[PatchCYB] No records found with E-Lekha expenditure > 0');
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

  // Create comprehensive filter object for patch data with enhanced scheme name mapping
  const patchFilters = useMemo(() => {
    const mappedFilters = {
      searchTerm: filters.searchTerm || '',
      selectedBudgetHeads: [],
      selectedFrontierHQs: [],
      selectedSectorHQs: [],
      selectedRiskLevels: [],
      selectedHealthStatuses: [],
      selectedSchemes: [],
      utilizationRange: null,
      selectedExecutiveAgencies: []
    };
    
    // Map budget heads from filters
    if (filters.selectedBudgetHeads?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.selectedBudgetHeads;
    } else if (filters.columnFilters?.budget_head?.length > 0) {
      mappedFilters.selectedBudgetHeads = filters.columnFilters.budget_head;
    }

    // Map frontier HQs - handle both ftr_hq_name and ftr_hq
    if (filters.selectedFrontierHQs?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.selectedFrontierHQs;
    } else if (filters.columnFilters?.ftr_hq_name?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq_name;
    } else if (filters.columnFilters?.ftr_hq?.length > 0) {
      mappedFilters.selectedFrontierHQs = filters.columnFilters.ftr_hq;
    }

    // Map sector HQs if available
    if (filters.selectedSectorHQs?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.selectedSectorHQs;
    } else if (filters.columnFilters?.shq_name?.length > 0) {
      mappedFilters.selectedSectorHQs = filters.columnFilters.shq_name;
    }

    // Map executive agencies
    if (filters.selectedAgencies?.length > 0) {
      mappedFilters.selectedExecutiveAgencies = filters.selectedAgencies;
    } else if (filters.columnFilters?.executive_agency?.length > 0) {
      mappedFilters.selectedExecutiveAgencies = filters.columnFilters.executive_agency;
    }

    // Map risk levels
    if (filters.selectedRiskLevels?.length > 0) {
      mappedFilters.selectedRiskLevels = filters.selectedRiskLevels;
    }

    // Map health statuses
    if (filters.selectedHealthStatuses?.length > 0) {
      mappedFilters.selectedHealthStatuses = filters.selectedHealthStatuses;
    }

    // Map utilization range if available from efficiency range
    if (filters.efficiencyRange && filters.efficiencyRange[0] !== undefined && filters.efficiencyRange[1] !== undefined) {
      mappedFilters.utilizationRange = filters.efficiencyRange;
    }
    
    // Enhanced scheme name mapping - gather from all possible sources
    const schemeNames = [
      ...(filters.selectedSchemes || []),
      ...(filters.columnFilters?.name_of_scheme || []),
      ...(filters.columnFilters?.sub_scheme_name || []),
      ...(filters.columnFilters?.['sub_scheme-name'] || [])
    ];
    
    if (schemeNames.length > 0) {
      // Normalize and deduplicate scheme names
      mappedFilters.selectedSchemes = Array.from(new Set(
        schemeNames
          .filter(Boolean)
          .map(scheme => normalizeScheme(scheme))
      )).filter(Boolean);
      
      console.log('[PatchCYB] Normalized scheme names for patch data:', 
        mappedFilters.selectedSchemes.slice(0, 3), 
        `(${mappedFilters.selectedSchemes.length} total)`
      );
    }
    
    return mappedFilters;
  }, [
    filters.searchTerm,
    filters.selectedBudgetHeads,
    filters.selectedFrontierHQs,
    filters.selectedSectorHQs,
    filters.selectedRiskLevels,
    filters.selectedHealthStatuses,
    filters.selectedSchemes,
    filters.selectedAgencies,
    filters.columnFilters,
    filters.efficiencyRange,
    normalizeScheme
  ]);

  // Apply filters to patch data with enhanced empty cell handling
  const patchData = useMemo(() => {
    if (!rawPatchData || rawPatchData.length === 0) return [];
    
    let filtered = [...rawPatchData];
    
    // Apply search filter
    if (patchFilters?.searchTerm) {
      const searchLower = patchFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.ftr_hq_name && item.ftr_hq_name.toLowerCase().includes(searchLower)) ||
        (item.budget_head && item.budget_head.toLowerCase().includes(searchLower)) ||
        (item['sub_scheme-name'] && item['sub_scheme-name'].toLowerCase().includes(searchLower)) ||
        (item.executive_agency && item.executive_agency.toLowerCase().includes(searchLower)) ||
        (item.shq_name && item.shq_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply budget head filter - only include non-empty values
    if (patchFilters?.selectedBudgetHeads?.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.budget_head || item.budget_head === '' || item.budget_head === 'Unknown') {
          return false;
        }
        return patchFilters.selectedBudgetHeads.includes(item.budget_head);
      });
    }
    
    // Apply frontier HQ filter - only include non-empty values
    if (patchFilters?.selectedFrontierHQs?.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.ftr_hq_name || item.ftr_hq_name === '' || item.ftr_hq_name === 'Unknown') {
          return false;
        }
        return patchFilters.selectedFrontierHQs.includes(item.ftr_hq_name);
      });
    }
    
    // Apply executive agency filter - only include non-empty values
    if (patchFilters?.selectedExecutiveAgencies?.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.executive_agency || item.executive_agency === '') {
          return false;
        }
        return patchFilters.selectedExecutiveAgencies.includes(item.executive_agency);
      });
    }
    
    // Apply scheme filter with enhanced matching logic
    if (patchFilters?.selectedSchemes?.length > 0) {
      filtered = filtered.filter(item => {
        const hasSchemeData = item['sub_scheme-name'] && item['sub_scheme-name'] !== '';
        
        if (!hasSchemeData) {
          return false;
        }
        
        for (const selectedScheme of patchFilters.selectedSchemes) {
          if (!selectedScheme) continue;
          
          if (item.normalized_scheme_name && item.normalized_scheme_name === selectedScheme) {
            return true;
          }
          
          const normalizedField = normalizeScheme(item['sub_scheme-name']);
          if (normalizedField === selectedScheme) {
            return true;
          }
          
          if (normalizedField.includes(selectedScheme) || selectedScheme.includes(normalizedField)) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Apply risk level filter - only include non-empty values
    if (patchFilters?.selectedRiskLevels?.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.risk_level || item.risk_level === '') {
          return false;
        }
        return patchFilters.selectedRiskLevels.includes(item.risk_level);
      });
    }
    
    // Apply health status filter - only include non-empty values
    if (patchFilters?.selectedHealthStatuses?.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.health_status || item.health_status === '') {
          return false;
        }
        return patchFilters.selectedHealthStatuses.includes(item.health_status);
      });
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
    patchFilters,
    normalizeScheme
  ]);

  // Calculate patch metrics with proper balance fund calculation and NaN prevention
  const patchMetrics = useMemo(() => {
    if (!patchData || patchData.length === 0) {
      return {
        totalRecords: 0,
        currentYearAllocation: 0,
        currentYearExpenditure: 0,
        elekhaExpenditure: 0,
        elekhaExpenditureWithPending: 0,
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
    const currentYearAllocation = patchData.reduce((sum, d) => sum + ensureNumber(d['Allotment CFY']), 0) / 100;
    const currentYearExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d['Total Expdr as per contengency register']), 0) / 100;
    const elekhaExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d['Expdr_as_per_elekha']), 0) / 100;
    const pendingBillsPAD = patchData.reduce((sum, d) => sum + ensureNumber(d['Bill pending with PAD']), 0) / 100;
    const pendingBillsHQ = patchData.reduce((sum, d) => sum + ensureNumber(d['Bill pending with HQrs']), 0) / 100;
    const totalPendingBills = pendingBillsPAD + pendingBillsHQ;
    
    // Calculate E-Lekha + Pending bills total
    const elekhaExpenditureWithPending = elekhaExpenditure + totalPendingBills;
    
    // Calculate balance funds properly
    const balanceFunds = Math.max(0, currentYearAllocation - elekhaExpenditureWithPending);
    
    // Additional financial metrics
    const freshSanctions = patchData.reduce((sum, d) => sum + ensureNumber(d['Fresh Sanction issued during CFY']), 0) / 100;
    const previousYearAllocation = patchData.reduce((sum, d) => sum + ensureNumber(d['Allotment Previous Financila year']), 0) / 100;
    const previousYearExpenditure = patchData.reduce((sum, d) => sum + ensureNumber(d['Expdr previous year']), 0) / 100;
    const liabilities = patchData.reduce((sum, d) => sum + ensureNumber(d['Liabilities']), 0) / 100;
    const effectiveSanction = patchData.reduce((sum, d) => sum + ensureNumber(d['Effective sanction']), 0) / 100;
    
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
      elekhaExpenditure: isNaN(elekhaExpenditure) ? 0 : elekhaExpenditure,
      elekhaExpenditureWithPending: isNaN(elekhaExpenditureWithPending) ? 0 : elekhaExpenditureWithPending,
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
      elekhaExpenditure: result.elekhaExpenditure.toFixed(2),
      currentYearAllocation: result.currentYearAllocation.toFixed(2),
      balanceFunds: result.balanceFunds.toFixed(2),
      avgUtilizationRate: result.avgUtilizationRate
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

  // Handle edit row
  const handleEditRow = useCallback((row) => {
    if (!row) return;

    // Find the row index in the raw data
    const rowIndex = rawPatchData.findIndex(r => r['S/No.'] === row['S/No.']);
    
    setSelectedRow(row);
    setSelectedRowId(row['S/No.']);
    setSelectedRowIndex(rowIndex !== -1 ? rowIndex : null);
    setShowEditModal(true);
  }, [rawPatchData]);

  // Handle add new row
  const handleAddRow = useCallback(() => {
    setShowAddRowModal(true);
  }, []);

  // Handle edit success
  const handleEditSuccess = useCallback((updatedRow) => {
    console.log('[PatchCYB] Edit successful:', updatedRow);
    setShowEditModal(false);
    setSelectedRow(null);
    setSelectedRowId(null);
    setSelectedRowIndex(null);
    refreshPatchData();
  }, [refreshPatchData]);

  // Handle add success
  const handleAddSuccess = useCallback((newRow) => {
    console.log('[PatchCYB] Add successful:', newRow);
    setShowAddRowModal(false);
    refreshPatchData();
  }, [refreshPatchData]);

  // Handle delete success
  const handleDeleteSuccess = useCallback((result) => {
    console.log('[PatchCYB] Delete successful:', result);
    setShowEditModal(false);
    setSelectedRow(null);
    setSelectedRowId(null);
    setSelectedRowIndex(null);
    refreshPatchData();
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
    handleEditRow,
    handleAddRow,
    selectedRow,
    setSelectedRow,
    selectedRowId,
    setSelectedRowId,
    selectedRowIndex,
    setSelectedRowIndex,
    showEditModal,
    setShowEditModal,
    showAddRowModal,
    setShowAddRowModal,
    handleEditSuccess,
    handleAddSuccess,
    handleDeleteSuccess,
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

// Enhanced Patch Data Table Component with Edit and Add functionality
const PatchDataTableComponent = ({ 
  data = [], 
  darkMode = false, 
  title = "Current Year Budget Details",
  onClose,
  isModal = false,
  onRefresh,
  onEditRow,
  onAddRow
}) => {
  const [sortField, setSortField] = useState('S/No.');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('standard');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const itemsPerPage = 15;
  
  // Get database configuration
  const dbConfig = useMemo(() => getConfig('enggcurrentyear'), []);

  // Define all available columns with metadata using EXACT field names from config
  const availableColumns = useMemo(() => [
    // Basic Information group
    { id: 'S/No.', field: 'S/No.', header: 'ID', group: 'basic', width: 70, sortable: true, alwaysVisible: true,
      icon: <Fingerprint size={12} className="text-yellow-500" />, format: val => val },
    { id: 'ftr_hq_name', field: 'ftr_hq_name', header: 'Frontier HQ', group: 'basic', width: 120, sortable: true, alwaysVisible: true,
      icon: <Building2 size={12} className="text-purple-500" />, format: val => val },
    { id: 'budget_head', field: 'budget_head', header: 'Budget Head', group: 'basic', width: 120, sortable: true,
      icon: <FileText size={12} className="text-blue-500" />, format: val => val },
    { id: 'sub_scheme-name', field: 'sub_scheme-name', header: 'Sub Scheme Name', group: 'basic', width: 150, sortable: true,
      icon: <FileText size={12} className="text-blue-500" />, format: val => val },
    { id: 'shq_name', field: 'shq_name', header: 'SHQ Name', group: 'basic', width: 120, sortable: true,
      icon: <Building2 size={12} className="text-purple-500" />, format: val => val },
    { id: 'executive_agency', field: 'executive_agency', header: 'Executive Agency', group: 'basic', width: 120, sortable: true,
      icon: <Building2 size={12} className="text-purple-500" />, format: val => val },
      
    // Previous Year group
    { id: 'Allotment Previous Financila year', field: 'Allotment Previous Financila year', header: 'Prev FY Allotment', group: 'previous_year', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Expdr previous year', field: 'Expdr previous year', header: 'Prev Year Expdr', group: 'previous_year', width: 130, sortable: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Liabilities', field: 'Liabilities', header: 'Liabilities', group: 'previous_year', width: 120, sortable: true,
      icon: <AlertCircle size={12} className="text-red-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
      
    // Current Sanctions group
    { id: 'Fresh Sanction issued during CFY', field: 'Fresh Sanction issued during CFY', header: 'Fresh Sanction', group: 'current_sanctions', width: 120, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Effective sanction', field: 'Effective sanction', header: 'Effective Sanction', group: 'current_sanctions', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Allotment CFY', field: 'Allotment CFY', header: 'CFY Allotment', group: 'current_sanctions', width: 130, sortable: true, alwaysVisible: true,
      icon: <Wallet size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Allotment (FY 24-25)', field: 'Allotment (FY 24-25)', header: 'FY 24-25 Allotment', group: 'current_sanctions', width: 130, sortable: true,
      icon: <DollarSign size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
      
    // Current Expenditure group
    { id: 'Expdr_as_per_elekha', field: 'Expdr_as_per_elekha', header: 'E-lekha Expdr', group: 'current_expenditure', width: 130, sortable: true, alwaysVisible: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: '% Age of expdr as per e-lekha', field: '% Age of expdr as per e-lekha', header: 'E-lekha %', group: 'current_expenditure', width: 100, sortable: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${parseFloat(val || 0).toFixed(1)}%` },
    { id: 'utilization_rate', field: 'utilization_rate', header: 'Utilization %', group: 'current_expenditure', width: 110, sortable: true, alwaysVisible: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${parseFloat(val || 0).toFixed(1)}%`,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{parseFloat(row.utilization_rate || 0).toFixed(1)}%</span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                parseFloat(row.utilization_rate || 0) >= 90 ? 'bg-green-500' :
                parseFloat(row.utilization_rate || 0) >= 70 ? 'bg-blue-500' :
                parseFloat(row.utilization_rate || 0) >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, parseFloat(row.utilization_rate || 0))}%` }}
            />
          </div>
        </div>
      )
    },
      
    // Pending group
    { id: 'Bill pending with PAD', field: 'Bill pending with PAD', header: 'Pending PAD', group: 'pending', width: 120, sortable: true,
      icon: <Receipt size={12} className="text-red-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'Bill pending with HQrs', field: 'Bill pending with HQrs', header: 'Pending HQ', group: 'pending', width: 120, sortable: true,
      icon: <Receipt size={12} className="text-red-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: 'pending_bills_total', field: 'pending_bills_total', header: 'Total Pending', group: 'pending', width: 130, sortable: true,
      icon: <Clock size={12} className="text-red-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
      
    // Totals group
    { id: 'Total Expdr as per contengency register', field: 'Total Expdr as per contengency register', header: 'Total Expdr', group: 'totals', width: 130, sortable: true,
      icon: <Calculator size={12} className="text-orange-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
    { id: '% Age of total Expdr', field: '% Age of total Expdr', header: 'Total Expdr %', group: 'totals', width: 100, sortable: true,
      icon: <Gauge size={12} className="text-purple-500" />, format: val => `${parseFloat(val || 0).toFixed(1)}%` },
    { id: 'Balance fund', field: 'Balance fund', header: 'Balance Fund', group: 'totals', width: 120, sortable: true, alwaysVisible: true,
      icon: <PiggyBank size={12} className="text-green-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L`,
      render: (row) => (
        <div>
          <div className="font-medium text-green-600 dark:text-green-400">
            ₹{parseFloat(row['Balance fund'] || 0).toFixed(2)}L
          </div>
          <div className="text-xs text-gray-500">
            {parseFloat(row['Allotment CFY'] || 0) > 0 
              ? `${((parseFloat(row['Balance fund'] || 0) / parseFloat(row['Allotment CFY'] || 0)) * 100).toFixed(1)}% avail`
              : '0% avail'}
            </div>
        </div>
      )
    },
    { id: 'Expdr plan for balance fund', field: 'Expdr plan for balance fund', header: 'Balance Expdr Plan', group: 'totals', width: 140, sortable: true,
      icon: <TrendingUp size={12} className="text-blue-500" />, format: val => `₹${parseFloat(val || 0).toFixed(2)}L` },
      
    // Status group
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
      icon: <Target size={12} className="text-purple-500" />, format: val => `${parseFloat(val || 0).toFixed(1)}%` },
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
    { id: 'previous_year', name: 'Previous Year Data', icon: <Clock size={14} /> },
    { id: 'current_sanctions', name: 'Current Year Sanctions', icon: <DollarSign size={14} /> },
    { id: 'current_expenditure', name: 'Current Year Expenditure', icon: <Calculator size={14} /> },
    { id: 'pending', name: 'Pending Bills', icon: <Receipt size={14} /> },
    { id: 'totals', name: 'Totals & Balance', icon: <Hash size={14} /> },
    { id: 'status', name: 'Status & Analysis', icon: <Activity size={14} /> },
  ], []);

  // Default visible columns by view mode
  const defaultVisibleColumns = useMemo(() => ({
    compact: ['S/No.', 'ftr_hq_name', 'budget_head', 'Allotment CFY', 'Expdr_as_per_elekha', 'utilization_rate', 'Balance fund'],
    standard: ['S/No.', 'ftr_hq_name', 'budget_head', 'sub_scheme-name', 'Allotment CFY', 'Expdr_as_per_elekha', 
               'utilization_rate', 'pending_bills_total', 'Balance fund', 'risk_level', 'health_status'],
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
          (item.ftr_hq_name && item.ftr_hq_name.toLowerCase().includes(search)) ||
          (item.budget_head && item.budget_head.toLowerCase().includes(search)) ||
          (item['sub_scheme-name'] && item['sub_scheme-name'].toLowerCase().includes(search)) ||
          (item['S/No.'] && item['S/No.'].toString().includes(search)) ||
          (item.risk_level && item.risk_level.toLowerCase().includes(search)) ||
          (item.health_status && item.health_status.toLowerCase().includes(search)) ||
          (item.executive_agency && item.executive_agency.toLowerCase().includes(search)) ||
          (item.shq_name && item.shq_name.toLowerCase().includes(search))
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

  // Handle edit row click
  const handleEditRowClick = (row) => {
    // Find the row index in the original data
    const rowIndex = data.findIndex(r => r['S/No.'] === row['S/No.']);
    
    setSelectedRow(row);
    setSelectedRowId(row['S/No.']);
    setSelectedRowIndex(rowIndex !== -1 ? rowIndex : null);
    setShowEditModal(true);
  };

  // Handle add row click
  const handleAddRowClick = () => {
    setShowAddModal(true);
  };

  // Handle edit success
  const handleEditSuccess = (updatedRow) => {
    setShowEditModal(false);
    setSelectedRow(null);
    setSelectedRowId(null);
    setSelectedRowIndex(null);
    
    // Call parent's onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle add success
  const handleAddSuccess = (newRow) => {
    setShowAddModal(false);
    
    // Call parent's onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setShowEditModal(false);
    setSelectedRow(null);
    setSelectedRowId(null);
    setSelectedRowIndex(null);
    
    // Call parent's onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Column selector component
  const ColumnSelector = () => (
    <div className="absolute top-full right-0 mt-1 p-4 rounded-lg shadow-lg z-20 w-72 bg-white border border-gray-200">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">
        Select Columns to Display
      </h3>
      
      <div className="max-h-96 overflow-y-auto pr-2">
        {columnGroups.map(group => (
          <div key={group.id} className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-600">
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
                      isSelected ? 'bg-indigo-50 text-indigo-700' : ''
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
          className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          Reset
        </button>
        <button
          onClick={() => setShowColumnSelector(false)}
          className="px-2 py-1 text-xs rounded bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          Done
        </button>
      </div>
    </div>
  );

  // Render modal view with new 3-part layout
  if (isModal) {
    return (
      <>
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <div className="relative w-[95vw] max-w-[1600px] h-[85vh] bg-white flex flex-col overflow-hidden" 
               style={{ borderRadius: '8px' }}>
            
            {/* HEADER - Fixed 60px height, Pure White Background */}
            <div className="h-[60px] bg-white px-6 flex items-center justify-between border-b border-gray-200">
              {/* Left - Empty */}
              <div className="w-24"></div>
              
              {/* Center - Table Info */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-indigo-500" />
                  <span className="font-medium text-gray-700">{dbConfig.displayName}</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span className="font-medium text-gray-700">{title}</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-green-500" />
                  <span className="font-medium text-gray-700">{processedData.length} entries</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none w-56"
                  />
                </div>
              </div>
              
              {/* Right - Controls */}
              <div className="flex items-center gap-2">
                {/* Add button */}
                <button
                  onClick={handleAddRowClick}
                  className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white transition-colors shadow-sm"
                  title="Add New Record"
                >
                  <Plus size={14} />
                  Add
                </button>
                
                {/* View Mode Selector */}
                <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-2 py-1.5 text-xs font-medium ${
                      viewMode === 'compact'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setViewMode('standard')}
                    className={`px-2 py-1.5 text-xs font-medium ${
                      viewMode === 'standard'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-2 py-1.5 text-xs font-medium ${
                      viewMode === 'detailed'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
                
                {/* Column Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="Select Columns"
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
                    className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
                
                {/* Export Button */}
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  title="Export to CSV"
                >
                  <Download size={14} />
                </button>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* MAIN - Flexible height, Whitesmoke Background */}
            <div className="flex-1 overflow-auto bg-[#f5f5f5]">
              <table className="w-full bg-white">
                <thead className="sticky top-0 bg-gray-50 z-10 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider bg-gray-50">
                      #
                    </th>
                    {selectedColumns.map(column => {
                      const col = availableColumns.find(c => c.id === column);
                      return (
                        <th 
                          key={column}
                          className={`px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider bg-gray-50 ${
                            col?.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                          }`}
                          onClick={() => col?.sortable && handleSort(column)}
                        >
                          <div className="flex items-center gap-1.5">
                            {col?.icon}
                            <span>{col?.header || column.replace(/_/g, ' ')}</span>
                            {sortField === column && (
                              <span className="text-indigo-500 font-bold">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider sticky right-0 bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((row, index) => (
                    <tr 
                      key={row.id || index}
                      className={`hover:bg-gray-50 transition-colors ${
                        row.risk_level === 'CRITICAL' ? 'bg-red-50' :
                        row.risk_level === 'HIGH' ? 'bg-orange-50' :
                        'bg-white'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      {selectedColumns.map(column => {
                        const col = availableColumns.find(c => c.id === column);
                        return (
                          <td key={column} className="px-4 py-3 text-sm text-gray-700">
                            {col && col.render ? (
                              col.render(row)
                            ) : (
                              <div className="truncate max-w-xs" title={row[column]}>
                                {col && typeof col.format === 'function' 
                                  ? col.format(row[column]) 
                                  : row[column] || '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center sticky right-0 bg-white">
                        <button
                          onClick={() => handleEditRowClick(row)}
                          className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                          title="Edit Row"
                        >
                          <Edit size={14} className="text-blue-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER - Fixed 60px height, Pure White Background */}
            <div className="h-[60px] bg-white px-6 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-black font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-black text-white hover:bg-gray-800'
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
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-black text-white hover:bg-gray-800'
                  } transition-colors`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Row Modal - Uses EXACT field names from config */}
        {showEditModal && (
          <EditRow
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            darkMode={darkMode}
            databaseName="enggcurrentyear"
            idField={dbConfig.idField}
            rowId={selectedRowId}
            rowIndex={selectedRowIndex}
            rowData={selectedRow}
            onSuccess={handleEditSuccess}
            onDelete={handleDeleteSuccess}
          />
        )}

        {/* Add Row Modal - Uses EXACT field names from config */}
        {showAddModal && (
          <AddRow
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            darkMode={darkMode}
            databaseName="enggcurrentyear"
            idField={dbConfig.idField}
            onSuccess={handleAddSuccess}
            defaultValues={{}}
          />
        )}
      </>
    );
  }

  // Non-modal embedded view - would implement if needed
  return null;
};

// Export the table component
export const PatchDataTable = PatchDataTableComponent;