import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronUp, ChevronDown, Search, Download, Filter,
  ArrowUpDown, Eye, Edit, Trash, CheckCircle, XCircle,
  AlertTriangle, Clock, IndianRupee, TrendingUp, MapPin,
  Building2, Users, Calendar, FileText, MoreVertical, X
} from 'lucide-react';

const DataTable = ({ 
  data, 
  darkMode, 
  onRowClick, 
  compareMode, 
  selectedProjects,
  isEmbedded = false, // New prop to detect if table is in a modal
  maxHeight = '100%', // Customizable max height for scroll
  maxWidth = '100%' // New prop for max width control
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([
    'serial_no', 'scheme_name', 'work_site', 'sanctioned_amount',
    'physical_progress', 'delay_days', 'risk_level', 'health_score'
  ]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const tableContainerRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);

  const columns = [
    { key: 'serial_no', label: 'S.No', width: '50px', align: 'center' },
    { key: 'scheme_name', label: 'Scheme Name', width: '200px', sticky: true },
    { key: 'budget_head', label: 'Budget Head', width: '120px' },
    { key: 'ftr_hq', label: 'FHQ', width: '80px' },
    { key: 'shq', label: 'SHQ', width: '80px' },
    { key: 'work_site', label: 'Location', width: '180px' },
    { key: 'executive_agency', label: 'Agency', width: '150px' },
    { key: 'firm_name', label: 'Contractor', width: '150px' },
    { key: 'sanctioned_amount', label: 'Budget', width: '100px', align: 'right', format: 'currency' },
    { key: 'physical_progress', label: 'Progress', width: '100px', align: 'center', format: 'progress' },
    { key: 'efficiency_score', label: 'Efficiency', width: '80px', align: 'center', format: 'percent' },
    { key: 'delay_days', label: 'Delay', width: '80px', align: 'center', format: 'days' },
    { key: 'risk_level', label: 'Risk', width: '80px', align: 'center', format: 'badge' },
    { key: 'health_score', label: 'Health', width: '80px', align: 'center', format: 'score' },
    { key: 'status', label: 'Status', width: '100px', align: 'center', format: 'status' },
    { key: 'total_expdr', label: 'Spent', width: '100px', align: 'right', format: 'currency' },
    { key: 'percent_expdr', label: 'Spent %', width: '80px', align: 'center', format: 'percent' },
    { key: 'date_award', label: 'Award Date', width: '100px', format: 'date' },
    { key: 'pdc_agreement', label: 'PDC', width: '100px', format: 'date' },
    { key: 'time_allowed_days', label: 'Time', width: '80px', align: 'center' }
  ];

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        setIsSticky(tableContainerRef.current.scrollTop > 0);
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item || {}).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || 0;
        const bVal = b[sortConfig.key] || 0;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatCellValue = (value, format, row) => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        // Check if value is already in lakhs or needs conversion
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return (
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ₹{amount >= 100 ? `${(amount / 100).toFixed(2)} Cr` : `${amount.toFixed(2)} L`}
          </span>
        );

      case 'progress':
        const progressValue = parseFloat(value) || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full transition-all bg-gradient-to-r"
                style={{
                  width: `${Math.min(100, Math.max(0, progressValue))}%`,
                  backgroundImage: progressValue >= 75 ? 'linear-gradient(to right, #10b981, #059669)' :
                                  progressValue >= 50 ? 'linear-gradient(to right, #3b82f6, #2563eb)' :
                                  progressValue >= 25 ? 'linear-gradient(to right, #f59e0b, #d97706)' : 
                                  'linear-gradient(to right, #ef4444, #dc2626)'
                }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
              {progressValue.toFixed(0)}%
            </span>
          </div>
        );

      case 'percent':
        const percentValue = parseFloat(value) || 0;
        return (
          <span className={`font-medium ${
            percentValue > 80 ? 'text-green-600' :
            percentValue > 60 ? 'text-blue-600' :
            percentValue > 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {percentValue.toFixed(1)}%
          </span>
        );

      case 'days':
        const daysValue = parseInt(value) || 0;
        if (daysValue === 0) {
          return <span className="text-green-600 font-medium">On Time</span>;
        }
        return (
          <span className={`font-medium ${
            daysValue > 90 ? 'text-red-600' :
            daysValue > 30 ? 'text-orange-600' : 'text-yellow-600'
          }`}>
            {daysValue}d
          </span>
        );

      case 'badge':
        const badgeColors = {
          CRITICAL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
          HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
          MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
          LOW: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
            badgeColors[value] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
          }`}>
            {value || 'N/A'}
          </span>
        );

      case 'status':
        const statusIcons = {
          NOT_STARTED: <XCircle size={12} className="text-gray-500" />,
          INITIAL: <Clock size={12} className="text-red-500" />,
          IN_PROGRESS: <TrendingUp size={12} className="text-orange-500" />,
          ADVANCED: <TrendingUp size={12} className="text-blue-500" />,
          NEAR_COMPLETION: <AlertTriangle size={12} className="text-yellow-500" />,
          COMPLETED: <CheckCircle size={12} className="text-green-500" />
        };
        return (
          <div className="flex items-center gap-1 justify-center">
            {statusIcons[value] || <Clock size={12} className="text-gray-500" />}
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {(value || 'UNKNOWN').replace(/_/g, ' ')}
            </span>
          </div>
        );

      case 'score':
        const scoreValue = parseFloat(value) || 0;
        return (
          <div className="flex items-center justify-center">
            <span className={`font-bold ${
              scoreValue > 80 ? 'text-green-600' :
              scoreValue > 60 ? 'text-blue-600' :
              scoreValue > 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {scoreValue.toFixed(0)}
            </span>
          </div>
        );

      case 'date':
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch {
          return value;
        }

      default:
        return value || '-';
    }
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const isProjectSelected = (project) => {
    if (!selectedProjects || !Array.isArray(selectedProjects)) return false;
    return selectedProjects.some(p => p?.id === project?.id);
  };

  const handleRowClick = (row, event) => {
    // Prevent triggering when clicking on action buttons
    if (event.target.closest('button')) return;
    
    if (onRowClick && typeof onRowClick === 'function') {
      onRowClick(row);
    }
  };

  const exportTableData = () => {
    const csvContent = [
      selectedColumns.join(','),
      ...processedData.map(row =>
        selectedColumns.map(col => {
          const value = row[col];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} ${!isEmbedded ? 'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700' : ''} p-8`}>
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No projects found matching your criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} ${!isEmbedded ? 'rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700' : ''} overflow-hidden flex flex-col h-full`}
      style={{ maxWidth: isEmbedded ? '100%' : maxWidth }}
    >
      {/* Table Header - Fixed to remove w-[90vw] that causes overflow */}
      {!isEmbedded && (
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex-shrink-0`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Project Data Table</h2>
            
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-white border-gray-200 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none`}
                />
              </div>

              {/* Items per page */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-200'
                } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none`}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              {/* Column Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <Filter size={16} />
                  Columns
                </button>
                
                {showColumnSelector && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 ${
                    darkMode ? 'bg-gray-900' : 'bg-white'
                  } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-3 max-h-96 overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select Columns</span>
                      <button
                        onClick={() => setShowColumnSelector(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {columns.map(col => (
                        <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns([...selectedColumns, col.key]);
                              } else {
                                setSelectedColumns(selectedColumns.filter(k => k !== col.key));
                              }
                            }}
                            className="accent-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export */}
              <button
                onClick={exportTableData}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm transition-all shadow-sm whitespace-nowrap"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar for embedded mode */}
      {isEmbedded && (
        <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex-shrink-0`}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 pr-3 py-1.5 rounded-lg border text-sm w-full ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-200 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none`}
              />
            </div>
            <button
              onClick={exportTableData}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 text-sm transition-all shadow-sm flex items-center gap-1 whitespace-nowrap"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Content with Scroll */}
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto"
        style={{ maxHeight: isEmbedded ? maxHeight : 'calc(100vh - 300px)' }}
      >
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} sticky top-0 z-10 ${
            isSticky ? 'shadow-md' : ''
          }`}>
            <tr>
              {compareMode && (
                <th className="px-3 py-2 text-left">
                  <input type="checkbox" disabled className="accent-blue-500" />
                </th>
              )}
              {columns
                .filter(col => selectedColumns.includes(col.key))
                .map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 text-${col.align || 'left'} ${
                      col.sticky ? 'sticky left-0 z-20 ' + (darkMode ? 'bg-gray-900' : 'bg-gray-50') : ''
                    }`}
                    style={{ minWidth: col.width }}
                  >
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </button>
                  </th>
                ))}
              <th className={`px-3 py-2 text-center sticky right-0 z-20 ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <span className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Actions</span>
              </th>
            </tr>
          </thead>
          
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {paginatedData.map((row, index) => (
              <React.Fragment key={row.id || row.serial_no || index}>
                <tr
                  className={`${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
                  } cursor-pointer transition-colors ${
                    isProjectSelected(row) ? 'bg-blue-100 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={(e) => handleRowClick(row, e)}
                >
                  {compareMode && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isProjectSelected(row)}
                        onChange={() => {}}
                        className="accent-blue-500"
                      />
                    </td>
                  )}
                  {columns
                    .filter(col => selectedColumns.includes(col.key))
                    .map(col => (
                      <td
                        key={col.key}
                        className={`px-3 py-2 text-${col.align || 'left'} text-sm ${
                          col.sticky ? 'sticky left-0 z-10 ' + (darkMode ? 'bg-gray-800' : 'bg-white') : ''
                        }`}
                      >
                        {col.key === 'scheme_name' ? (
                          <div className="max-w-xs">
                            <p className="truncate font-medium text-gray-900 dark:text-gray-100" title={row[col.key]}>
                              {row[col.key] || 'N/A'}
                            </p>
                            {row.budget_head && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.budget_head}</p>
                            )}
                          </div>
                        ) : (
                          formatCellValue(row[col.key], col.format, row)
                        )}
                      </td>
                    ))}
                  <td className={`px-3 py-2 text-center sticky right-0 z-10 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row, { target: document.body });
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} className="text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(row.id || row.serial_no || index);
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Expand"
                      >
                        {expandedRows.includes(row.id || row.serial_no || index) ? 
                          <ChevronUp size={14} className="text-gray-600 dark:text-gray-400" /> : 
                          <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Row Details */}
                {expandedRows.includes(row.id || row.serial_no || index) && (
                  <tr>
                    <td colSpan={selectedColumns.length + (compareMode ? 2 : 1)} 
                        className={`px-4 py-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400 text-sm">Project Details</h4>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">AA/ES Ref:</span> {row.aa_es_ref || 'N/A'}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Date Tender:</span> {formatCellValue(row.date_tender, 'date')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Revised PDC:</span> {formatCellValue(row.revised_pdc, 'date')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Actual Completion:</span> {formatCellValue(row.actual_completion_date, 'date')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400 text-sm">Financial Details</h4>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Expenditure (31 Mar 25):</span> {formatCellValue(row.expdr_upto_31mar25, 'currency')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Current FY Exp:</span> {formatCellValue(row.expdr_cfy, 'currency')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Remaining:</span> {formatCellValue(row.remaining_amount, 'currency')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Progress Status:</span> {row.progress_status || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400 text-sm">Performance Metrics</h4>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Efficiency Score:</span> {formatCellValue(row.efficiency_score, 'percent')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Health Score:</span> {formatCellValue(row.health_score, 'score')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Priority:</span> {row.priority || 'N/A'}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Remarks:</span> {row.remarks || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex-shrink-0`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-xs rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-sm'
              } transition-all`}
            >
              First
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-xs rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-sm'
              } transition-all`}
            >
              Prev
            </button>
            
            <span className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2 py-1 text-xs rounded-lg ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-sm'
              } transition-all`}
            >
              Next
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2 py-1 text-xs rounded-lg ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-sm'
              } transition-all`}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;