import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, Activity, PiggyBank, Wallet,
  CreditCard, Database, Target, Gauge,
  FileText, X, Download, Search, Filter,
  IndianRupee, Banknote, Coins, Receipt
} from 'lucide-react';

// Hook to load and process patch data from enggcurrentyear.csv
// Takes the same filters object structure as MetricsCards
export const usePatchEngineeringCYB = (filters = {}) => {
  const [rawPatchData, setRawPatchData] = useState([]);
  const [patchLoading, setPatchLoading] = useState(true);
  const [patchError, setPatchError] = useState(null);

  // Process CSV data
  const processPatchData = useCallback((data) => {
    return data
      .filter(row => row && (row['S/No.'] || row.ftr_hq || row.budget_head))
      .map((row, index) => {
        // Clean numeric values
        const cleanNumber = (val) => {
          if (val === null || val === undefined || val === '' || val === 'NIL') return 0;
          if (typeof val === 'string') {
            val = val.replace(/,/g, '').replace(/₹/g, '').trim();
            if (val === '-' || val === 'N/A') return 0;
          }
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        // Clean percentage values
        const cleanPercentage = (val) => {
          if (!val || val === 'NIL' || val === '-') return 0;
          const cleaned = String(val).replace(/%/g, '').replace(/,/g, '').trim();
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        const processed = {
          id: `cy_${index + 1}`,
          serial_no: row['S/No.'] || index + 1,
          ftr_hq: row.ftr_hq || 'Unknown',
          budget_head: row.budget_head || 'Unknown',
          sub_head: row['Sub head'] || '',
          
          // Financial values (assuming in lakhs)
          allotment_prev_fy: cleanNumber(row['Allotment Previous Financial year']),
          expdr_prev_year: cleanNumber(row['Expdr previous year']),
          liabilities: cleanNumber(row['Liabilities']),
          fresh_sanction_cfy: cleanNumber(row['Fresh Sanction issued during CFY']),
          effective_sanction: cleanNumber(row['Effective sanction']),
          allotment: cleanNumber(row['Allotment']),
          expdr_elekha: cleanNumber(row['Expdr booked as per e-lekha as on 22/07/25']),
          percent_expdr_elekha: cleanPercentage(row['% Age of expdr as per e-lekha']),
          bill_pending_pad: cleanNumber(row['Bill pending with PAD']),
          bill_pending_hqrs: cleanNumber(row['Bill pending with HQrs']),
          total_expdr: cleanNumber(row['Total Expdr']),
          percent_total_expdr: cleanPercentage(row['% Age of total Expdr']),
          balance_fund: cleanNumber(row['Balance fund']),
          
          // Calculated fields
          utilization_rate: 0,
          pending_bills_total: 0,
          efficiency_score: 0,
          risk_level: 'LOW'
        };

        // Calculate derived metrics
        processed.pending_bills_total = processed.bill_pending_pad + processed.bill_pending_hqrs;
        processed.utilization_rate = processed.allotment > 0 
          ? ((processed.total_expdr / processed.allotment) * 100).toFixed(2)
          : 0;
        
        // Calculate efficiency score
        if (processed.allotment > 0) {
          const utilizationScore = Math.min(100, (processed.total_expdr / processed.allotment) * 100);
          const pendingScore = processed.pending_bills_total > 0 
            ? Math.max(0, 100 - (processed.pending_bills_total / processed.allotment) * 50) 
            : 100;
          processed.efficiency_score = ((utilizationScore + pendingScore) / 2).toFixed(2);
        }
        
        // Determine risk level based on utilization and pending bills
        if (processed.utilization_rate < 30 && processed.pending_bills_total > processed.allotment * 0.2) {
          processed.risk_level = 'CRITICAL';
        } else if (processed.utilization_rate < 50 || processed.pending_bills_total > processed.allotment * 0.15) {
          processed.risk_level = 'HIGH';
        } else if (processed.utilization_rate < 70 || processed.pending_bills_total > processed.allotment * 0.1) {
          processed.risk_level = 'MEDIUM';
        } else {
          processed.risk_level = 'LOW';
        }
        
        return processed;
      });
  }, []);

  // Load patch data from CSV - only once on mount
  useEffect(() => {
    let mounted = true;

    const loadPatchData = async () => {
      try {
        setPatchLoading(true);
        setPatchError(null);
        
        const response = await fetch('/enggcurrentyear.csv');
        
        if (!response.ok) {
          throw new Error(`Failed to load CY patch data: ${response.status}`);
        }
        
        const fileContent = await response.text();
        
        // Parse CSV
        const Papa = await import('papaparse');
        const result = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', '|', ';']
        });
        
        if (result.errors.length > 0) {
          console.warn('CY CSV parsing warnings:', result.errors);
        }
        
        if (mounted) {
          const processedData = processPatchData(result.data);
          setRawPatchData(processedData);
          console.log('[PatchCYB] Loaded', processedData.length, 'CY budget records');
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
  }, []); // Empty array - load only once

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
        item.sub_head?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply budget head filter
    if (filters?.selectedBudgetHeads?.length > 0) {
      filtered = filtered.filter(item => 
        filters.selectedBudgetHeads.includes(item.budget_head)
      );
    }
    
    // Apply frontier HQ filter
    if (filters?.selectedFrontierHQs?.length > 0) {
      filtered = filtered.filter(item => 
        filters.selectedFrontierHQs.includes(item.ftr_hq)
      );
    }
    
    // Note: Other filters don't apply as the CY data doesn't have those fields
    
    return filtered;
  }, [
    rawPatchData, 
    filters?.searchTerm, 
    filters?.selectedBudgetHeads, 
    filters?.selectedFrontierHQs
  ]);

  // Calculate patch metrics
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
        optimalUtilized: 0
      };
    }
    
    const total = patchData.length;
    
    // Sum up financial metrics (convert from lakhs to crores)
    const currentYearAllocation = patchData.reduce((sum, d) => sum + d.allotment, 0) / 100;
    const currentYearExpenditure = patchData.reduce((sum, d) => sum + d.total_expdr, 0) / 100;
    const pendingBillsPAD = patchData.reduce((sum, d) => sum + d.bill_pending_pad, 0) / 100;
    const pendingBillsHQ = patchData.reduce((sum, d) => sum + d.bill_pending_hqrs, 0) / 100;
    const totalPendingBills = pendingBillsPAD + pendingBillsHQ;
    const balanceFunds = patchData.reduce((sum, d) => sum + d.balance_fund, 0) / 100;
    const freshSanctions = patchData.reduce((sum, d) => sum + d.fresh_sanction_cfy, 0) / 100;
    const previousYearAllocation = patchData.reduce((sum, d) => sum + d.allotment_prev_fy, 0) / 100;
    const previousYearExpenditure = patchData.reduce((sum, d) => sum + d.expdr_prev_year, 0) / 100;
    const liabilities = patchData.reduce((sum, d) => sum + d.liabilities, 0) / 100;
    const effectiveSanction = patchData.reduce((sum, d) => sum + d.effective_sanction, 0) / 100;
    
    // Calculate averages
    const avgUtilizationRate = total > 0 
      ? patchData.reduce((sum, d) => sum + parseFloat(d.utilization_rate || 0), 0) / total
      : 0;
    
    const avgEfficiencyScore = total > 0
      ? patchData.reduce((sum, d) => sum + parseFloat(d.efficiency_score || 0), 0) / total
      : 0;
    
    // Count risk levels
    const criticalCount = patchData.filter(d => d.risk_level === 'CRITICAL').length;
    const highRiskCount = patchData.filter(d => d.risk_level === 'HIGH').length;
    const mediumRiskCount = patchData.filter(d => d.risk_level === 'MEDIUM').length;
    const lowRiskCount = patchData.filter(d => d.risk_level === 'LOW').length;
    
    // Utilization categories
    const underUtilized = patchData.filter(d => parseFloat(d.utilization_rate) < 50).length;
    const overUtilized = patchData.filter(d => parseFloat(d.utilization_rate) > 90).length;
    const optimalUtilized = patchData.filter(d => 
      parseFloat(d.utilization_rate) >= 50 && parseFloat(d.utilization_rate) <= 90
    ).length;
    
    return {
      totalRecords: total,
      currentYearAllocation,
      currentYearExpenditure,
      pendingBillsPAD,
      pendingBillsHQ,
      totalPendingBills,
      balanceFunds,
      freshSanctions,
      previousYearAllocation,
      previousYearExpenditure,
      liabilities,
      effectiveSanction,
      avgUtilizationRate: avgUtilizationRate.toFixed(2),
      avgEfficiencyScore: avgEfficiencyScore.toFixed(2),
      criticalCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      underUtilized,
      overUtilized,
      optimalUtilized
    };
  }, [patchData]);

  return {
    patchData,
    patchMetrics,
    patchLoading,
    patchError,
    rawPatchData,
    PatchDataTable: PatchDataTableComponent
  };
};

// Generate metric cards for patch data
export const generatePatchBudgetMetrics = (patchMetrics, darkMode = false) => {
  if (!patchMetrics) return [];
  
  return [
    {
      id: 'cy-allocation',
      group: 'budget',
      title: 'CY Allocation',
      value: `₹${patchMetrics.currentYearAllocation.toFixed(2)}Cr`,
      subtitle: `${patchMetrics.totalRecords} heads`,
      icon: Wallet,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      isPatchData: true,
      percentage: 100,
      infoText: "Total budget allocated for the current financial year across all budget heads."
    },
    {
      id: 'cy-expenditure',
      group: 'budget',
      title: 'CY Expenditure',
      value: `₹${patchMetrics.currentYearExpenditure.toFixed(2)}Cr`,
      subtitle: `${patchMetrics.avgUtilizationRate}% utilized`,
      icon: CreditCard,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      isPatchData: true,
      percentage: parseFloat(patchMetrics.avgUtilizationRate),
      infoText: "Total expenditure in the current financial year including e-lekha bookings and pending bills."
    },
    {
      id: 'cy-pending-bills',
      group: 'budget',
      title: 'CY Pending Bills',
      value: `₹${patchMetrics.totalPendingBills.toFixed(2)}Cr`,
      subtitle: `PAD: ₹${patchMetrics.pendingBillsPAD.toFixed(2)}Cr`,
      icon: Receipt,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      isPatchData: true,
      alert: patchMetrics.totalPendingBills > patchMetrics.currentYearAllocation * 0.1,
      infoText: "Bills pending with PAD and Headquarters for processing and payment."
    },
    {
      id: 'cy-balance',
      group: 'budget',
      title: 'CY Balance Funds',
      value: `₹${patchMetrics.balanceFunds.toFixed(2)}Cr`,
      subtitle: 'Available',
      icon: PiggyBank,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      isPatchData: true,
      infoText: "Remaining budget available for utilization in the current financial year."
    },
    {
      id: 'cy-fresh-sanctions',
      group: 'budget',
      title: 'CY Fresh Sanctions',
      value: `₹${patchMetrics.freshSanctions.toFixed(2)}Cr`,
      subtitle: 'New approvals',
      icon: CheckCircle,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      isPatchData: true,
      infoText: "Fresh sanctions issued during the current financial year for new projects."
    },
    {
      id: 'cy-liabilities',
      group: 'budget',
      title: 'CY Liabilities',
      value: `₹${patchMetrics.liabilities.toFixed(2)}Cr`,
      subtitle: 'Carried forward',
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      isPatchData: true,
      alert: patchMetrics.liabilities > patchMetrics.currentYearAllocation * 0.2,
      infoText: "Liabilities carried forward from previous years that need to be cleared."
    }
  ];
};

// Patch Data Table Component
const PatchDataTableComponent = ({ 
  data = [], 
  darkMode = false, 
  title = "Current Year Budget Details",
  onClose,
  isModal = false 
}) => {
  const [sortField, setSortField] = useState('serial_no');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.ftr_hq?.toLowerCase().includes(search) ||
        item.budget_head?.toLowerCase().includes(search) ||
        item.sub_head?.toLowerCase().includes(search)
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
      'S.No', 'Frontier HQ', 'Budget Head', 'Sub Head',
      'Allocation', 'Expenditure', 'Utilization %', 'Balance',
      'Pending Bills PAD', 'Pending Bills HQ', 'Risk Level'
    ];
    
    const rows = processedData.map(row => [
      row.serial_no,
      row.ftr_hq,
      row.budget_head,
      row.sub_head,
      row.allotment.toFixed(2),
      row.total_expdr.toFixed(2),
      row.utilization_rate,
      row.balance_fund.toFixed(2),
      row.bill_pending_pad.toFixed(2),
      row.bill_pending_hqrs.toFixed(2),
      row.risk_level
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cy-budget-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    return `₹${(value / 100).toFixed(2)}Cr`;
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
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-indigo-500 to-indigo-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {title}
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-indigo-100'}`}>
                  Showing {processedData.length} budget entries
                </p>
              </div>
              
              <div className="flex items-center gap-3">
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
                placeholder="Search by Frontier HQ, Budget Head, or Sub Head..."
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
                  {[
                    { field: 'serial_no', label: 'S.No', width: 'w-16' },
                    { field: 'ftr_hq', label: 'Frontier HQ', width: 'w-32' },
                    { field: 'budget_head', label: 'Budget Head', width: 'w-40' },
                    { field: 'sub_head', label: 'Sub Head', width: 'w-40' },
                    { field: 'allotment', label: 'Allocation', width: 'w-28' },
                    { field: 'total_expdr', label: 'Expenditure', width: 'w-28' },
                    { field: 'utilization_rate', label: 'Utilization', width: 'w-24' },
                    { field: 'balance_fund', label: 'Balance', width: 'w-28' },
                    { field: 'pending_bills_total', label: 'Pending Bills', width: 'w-28' },
                    { field: 'risk_level', label: 'Risk', width: 'w-24' }
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className={`${col.width} px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field && (
                          <span className="text-indigo-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {paginatedData.map((row) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-opacity-50 transition-colors ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2 text-sm">{row.serial_no}</td>
                    <td className="px-3 py-2 text-sm font-medium">{row.ftr_hq}</td>
                    <td className="px-3 py-2 text-sm">{row.budget_head}</td>
                    <td className="px-3 py-2 text-sm">{row.sub_head}</td>
                    <td className="px-3 py-2 text-sm font-medium">
                      {formatCurrency(row.allotment)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {formatCurrency(row.total_expdr)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.utilization_rate}%</span>
                        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500"
                            style={{ width: `${Math.min(100, row.utilization_rate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {formatCurrency(row.balance_fund)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="text-xs">
                        <div>{formatCurrency(row.pending_bills_total)}</div>
                        <div className="text-gray-500">
                          PAD: {formatCurrency(row.bill_pending_pad)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadgeColor(row.risk_level)}`}>
                        {row.risk_level}
                      </span>
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
  return null; // Return null for now since we're only using modal view
};

// Export the table component
export const PatchDataTable = PatchDataTableComponent;