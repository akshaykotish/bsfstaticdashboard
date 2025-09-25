import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Calendar, DollarSign, TrendingUp, AlertTriangle,
  Filter, X, ChevronDown, ChevronUp, Sliders, RotateCcw,
  Building2, Users, MapPin, Clock, Package, Target,
  Check, ChevronRight, Sparkles, Zap, Info, RefreshCw,
  FileText, Briefcase, CreditCard, PieChart, Database, Eye,
  Activity, Heart, Gauge, PauseCircle, PlayCircle,
  AlertCircle, CheckCircle, XCircle, Timer, CalendarDays,
  Edit, Plus // Added Edit and Plus icons
} from 'lucide-react';

// Import the Report component directly (not the openProjectReport function)
import Report from './Reports';
// Import the new Edit component
import EditComponent from './Edit';

// Modal Component for Report - A4 Optimized
const ReportModal = ({ isOpen, onClose, projectData, darkMode }) => {
  const modalRef = useRef(null);
  const modalContentRef = useRef(null);
  
  // Handle click outside to close (optional - commented out to prevent accidental closes)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Don't close on outside click for reports to prevent data loss
        // Uncomment below line if you want to enable click-outside-to-close
        // onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose} // Allow backdrop click to close
      />
      
      {/* Modal Container - A4 optimized */}
      <div 
        ref={modalRef}
        className="relative w-full h-full max-w-[900px] max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp m-4"
        style={{
          // Ensure modal doesn't exceed A4 proportions
          maxWidth: 'min(900px, calc(100vw - 2rem))',
          maxHeight: 'calc(100vh - 2rem)',
        }}
      >

        
        {/* Modal Body with Report Component - Scrollable */}
        <div 
          ref={modalContentRef}
          className="flex-1 overflow-auto bg-white dark:bg-gray-900"
          style={{
            // Ensure smooth scrolling
            WebkitOverflowScrolling: 'touch',
            // Add padding to prevent content from touching edges
            scrollPaddingTop: '20px',
            scrollPaddingBottom: '20px'
          }}
        >
          {/* Report Container with proper A4 sizing */}
          <div className="w-full flex justify-center">
            <div 
              className="w-full max-w-[794px]" 
              style={{
                // Ensure report maintains A4 proportions
                width: '100%',
                maxWidth: '794px', // A4 width at 96 DPI
                margin: '0 auto'
              }}
            >
              <Report 
                projectData={projectData} 
                darkMode={darkMode} 
                isInModal={true} 
                onclose={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};


const DataTable = ({ 
  data, 
  darkMode, 
  onRowClick, 
  compareMode, 
  selectedProjects,
  maxHeight = '100%',
  maxWidth = '100%'
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([
    'serial_no', 'scheme_name', 'work_site', 'sanctioned_amount',
    'physical_progress', 'progress_status_display', 'total_expdr', 
    'calculated_time_allowed'
  ]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const tableContainerRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // State for Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState(null);

  // State for Edit Modal - NEW
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [isNewProject, setIsNewProject] = useState(false);

  // Calculate Time Allowed for each project
  const calculateTimeAllowed = (row) => {
    if (!row.date_award || row.date_award === '' || row.date_award === 'N/A') {
      return { days: 0, formatted: 'N/A', status: 'not_started' };
    }

    try {
      const awardDate = new Date(row.date_award);
      if (isNaN(awardDate.getTime())) {
        return { days: 0, formatted: 'Invalid Date', status: 'error' };
      }

      // Use revised PDC if available, otherwise use original PDC
      let targetDate = null;
      let dateType = 'none';
      
      if (row.revised_pdc && row.revised_pdc !== '' && row.revised_pdc !== 'N/A') {
        targetDate = new Date(row.revised_pdc);
        dateType = 'revised';
        if (isNaN(targetDate.getTime())) targetDate = null;
      }
      
      if (!targetDate && row.pdc_agreement && row.pdc_agreement !== '' && row.pdc_agreement !== 'N/A') {
        targetDate = new Date(row.pdc_agreement);
        dateType = 'original';
        if (isNaN(targetDate.getTime())) targetDate = null;
      }

      if (!targetDate) {
        // If no PDC dates, use time_allowed_days if available
        if (row.time_allowed_days && row.time_allowed_days > 0) {
          return { 
            days: row.time_allowed_days, 
            formatted: `${row.time_allowed_days} days (Contract)`,
            status: 'contract'
          };
        }
        return { days: 0, formatted: 'No PDC Set', status: 'no_pdc' };
      }

      // Calculate days between award date and PDC
      const diffTime = targetDate - awardDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const formatString = `${Math.abs(diffDays)} days (${dateType === 'revised' ? 'Revised PDC' : 'PDC'})`;
      
      return {
        days: diffDays,
        formatted: diffDays < 0 ? `Overdue: ${formatString}` : formatString,
        status: diffDays < 0 ? 'overdue' : 'normal',
        dateType: dateType
      };
    } catch (err) {
      console.warn('Error calculating time allowed:', err);
      return { days: 0, formatted: 'Error', status: 'error' };
    }
  };

  // Get progress status display based on actual progress categories
  const getProgressStatusDisplay = (row) => {
    const progress = parseFloat(row.physical_progress) || 0;
    const category = row.progress_category || row.progress_status || '';
    const healthStatus = row.health_status || '';
    
    // Map progress categories to display values
    const categoryMap = {
      'TENDER_PROGRESS': { label: 'Tender in Progress', color: 'text-gray-600', icon: FileText },
      'TENDERED_NOT_AWARDED': { label: 'Tendered (Not Awarded)', color: 'text-yellow-600', icon: PauseCircle },
      'AWARDED_NOT_STARTED': { label: 'Awarded (Not Started)', color: 'text-orange-600', icon: PlayCircle },
      'NOT_STARTED': { label: 'Not Started', color: 'text-red-600', icon: XCircle },
      'PROGRESS_1_TO_50': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-red-500', icon: Activity },
      'PROGRESS_51_TO_71': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-yellow-500', icon: Activity },
      'PROGRESS_71_TO_99': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-blue-500', icon: Target },
      'COMPLETED': { label: 'Completed', color: 'text-green-600', icon: CheckCircle }
    };

    // Map health status for additional context
    const healthMap = {
      'PERFECT_PACE': { label: 'Perfect Pace', color: 'text-green-500', icon: Zap },
      'SLOW_PACE': { label: 'Slow Pace', color: 'text-yellow-500', icon: Timer },
      'BAD_PACE': { label: 'Bad Pace', color: 'text-orange-500', icon: AlertTriangle },
      'SLEEP_PACE': { label: 'Sleep Pace', color: 'text-red-500', icon: PauseCircle },
      'PAYMENT_PENDING': { label: 'Payment Pending', color: 'text-amber-600', icon: CreditCard }
    };

    const categoryInfo = categoryMap[category] || { 
      label: `Progress: ${progress.toFixed(0)}%`, 
      color: 'text-gray-600', 
      icon: Activity 
    };
    
    const healthInfo = healthMap[healthStatus] || null;

    return {
      primary: categoryInfo,
      secondary: healthInfo,
      progress: progress
    };
  };

  const columns = [
    { key: 'serial_no', label: 'S.No', width: '60px', align: 'center' },
    { key: 'scheme_name', label: 'Scheme Name', width: '250px', sticky: true },
    { key: 'budget_head', label: 'Budget Head', width: '150px' },
    { key: 'ftr_hq', label: 'FHQ', width: '80px' },
    { key: 'shq', label: 'SHQ', width: '80px' },
    { key: 'work_site', label: 'Location', width: '200px' },
    { key: 'executive_agency', label: 'Agency', width: '180px' },
    { key: 'firm_name', label: 'Contractor', width: '180px' },
    { key: 'sanctioned_amount', label: 'Budget Allocated', width: '120px', align: 'right', format: 'currency' },
    { key: 'total_expdr', label: 'Expenditure', width: '120px', align: 'right', format: 'currency' },
    { key: 'physical_progress', label: 'Progress', width: '120px', align: 'center', format: 'progress' },
    { key: 'progress_status_display', label: 'Progress Status', width: '180px', align: 'center', format: 'progress_status' },
    { key: 'calculated_time_allowed', label: 'Time Allowed', width: '150px', align: 'center', format: 'time_allowed' },
    { key: 'percent_expdr', label: 'Spent %', width: '80px', align: 'center', format: 'percent' },
    { key: 'status', label: 'Status', width: '120px', align: 'center', format: 'status' },
    { key: 'health_status', label: 'Health', width: '120px', align: 'center', format: 'health' },
    { key: 'date_award', label: 'Award Date', width: '100px', format: 'date' },
    { key: 'pdc_agreement', label: 'PDC', width: '100px', format: 'date' },
    { key: 'revised_pdc', label: 'Revised PDC', width: '100px', format: 'date' },
    { key: 'time_allowed_days', label: 'Contract Days', width: '90px', align: 'center' },
    { key: 'delay_days', label: 'Delay', width: '80px', align: 'center', format: 'delay' }
  ];

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

  // Process data to add calculated fields
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    let processed = data.map(item => ({
      ...item,
      calculated_time_allowed: calculateTimeAllowed(item),
      progress_status_display: getProgressStatusDisplay(item)
    }));

    // Apply search filter
    if (searchTerm) {
      processed = processed.filter(item =>
        Object.values(item || {}).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      processed.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle calculated fields
        if (sortConfig.key === 'calculated_time_allowed') {
          aVal = a.calculated_time_allowed?.days || 0;
          bVal = b.calculated_time_allowed?.days || 0;
        } else if (sortConfig.key === 'progress_status_display') {
          aVal = a.progress_status_display?.progress || 0;
          bVal = b.progress_status_display?.progress || 0;
        }
        
        aVal = aVal || 0;
        bVal = bVal || 0;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const summaryStats = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return {
        totalProjects: 0,
        budgetAllocated: 0,
        budgetExpenditure: 0,
        remainingAmount: 0,
        onTimeProjects: 0,
        delayedProjects: 0,
        averageTimeAllowed: 0
      };
    }

    const onTimeProjects = processedData.filter(d => 
      d.calculated_time_allowed?.status === 'normal' && (d.delay_days || 0) <= 0
    ).length;
    
    const delayedProjects = processedData.filter(d => (d.delay_days || 0) > 0).length;
    
    const validTimeAllowed = processedData
      .filter(d => d.calculated_time_allowed?.days > 0)
      .map(d => d.calculated_time_allowed.days);
    
    const averageTimeAllowed = validTimeAllowed.length > 0
      ? validTimeAllowed.reduce((sum, days) => sum + days, 0) / validTimeAllowed.length
      : 0;

    return {
      totalProjects: processedData.length,
      budgetAllocated: processedData.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0),
      budgetExpenditure: processedData.reduce((sum, d) => sum + (d.total_expdr || 0), 0),
      remainingAmount: processedData.reduce((sum, d) => sum + (d.remaining_amount || 0), 0),
      onTimeProjects,
      delayedProjects,
      averageTimeAllowed: Math.round(averageTimeAllowed)
    };
  }, [processedData]);

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
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all bg-gradient-to-r"
                style={{
                  width: `${Math.min(100, Math.max(0, progressValue))}%`,
                  backgroundImage: progressValue >= 75 ? 'linear-gradient(to right, #10b981, #059669)' :
                                  progressValue >= 50 ? 'linear-gradient(to right, #3b82f6, #2563eb)' :
                                  progressValue >= 25 ? 'linear-gradient(to right, #f59e0b, #d97706)' : 
                                  'linear-gradient(to right, #ef4444, #dc2626)'
                }}
              />
            </div>
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
              {progressValue.toFixed(0)}%
            </span>
          </div>
        );

      case 'progress_status':
        const statusInfo = row.progress_status_display;
        if (!statusInfo) return '-';
        
        const StatusIcon = statusInfo.primary.icon;
        const HealthIcon = statusInfo.secondary?.icon;
        
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <StatusIcon size={14} className={statusInfo.primary.color} />
              <span className={`text-xs font-medium ${statusInfo.primary.color}`}>
                {statusInfo.primary.label}
              </span>
            </div>
            {statusInfo.secondary && (
              <div className="flex items-center gap-1">
                <HealthIcon size={12} className={statusInfo.secondary.color} />
                <span className={`text-[10px] ${statusInfo.secondary.color}`}>
                  {statusInfo.secondary.label}
                </span>
              </div>
            )}
          </div>
        );

      case 'time_allowed':
        const timeData = row.calculated_time_allowed;
        if (!timeData) return '-';
        
        const timeColorClass = timeData.status === 'overdue' ? 'text-red-600 font-bold' :
                              timeData.status === 'no_pdc' ? 'text-gray-500' :
                              timeData.status === 'error' ? 'text-red-500 italic' :
                              'text-gray-700 dark:text-gray-300';
        
        return (
          <div className="flex items-center gap-1">
            {timeData.status === 'overdue' && <AlertCircle size={12} className="text-red-500" />}
            {timeData.status === 'contract' && <CalendarDays size={12} className="text-blue-500" />}
            <span className={`text-xs ${timeColorClass}`}>
              {timeData.formatted}
            </span>
          </div>
        );

      case 'delay':
        const delayDays = parseInt(value) || 0;
        const delayColor = delayDays > 90 ? 'text-red-600 font-bold' :
                          delayDays > 30 ? 'text-orange-600 font-semibold' :
                          delayDays > 0 ? 'text-yellow-600' :
                          'text-green-600';
        
        return (
          <div className="flex items-center gap-1">
            {delayDays > 0 && <Clock size={12} className={delayColor} />}
            <span className={`text-sm ${delayColor}`}>
              {delayDays > 0 ? `${delayDays}d` : 'On Time'}
            </span>
          </div>
        );

      case 'health':
        const healthStatus = value;
        const healthColors = {
          'PERFECT_PACE': 'text-green-600 bg-green-100 dark:bg-green-900/20',
          'SLOW_PACE': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
          'BAD_PACE': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
          'SLEEP_PACE': 'text-red-600 bg-red-100 dark:bg-red-900/20',
          'PAYMENT_PENDING': 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
          'NOT_APPLICABLE': 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
        };
        
        const healthLabels = {
          'PERFECT_PACE': 'Perfect',
          'SLOW_PACE': 'Slow',
          'BAD_PACE': 'Bad',
          'SLEEP_PACE': 'Sleep',
          'PAYMENT_PENDING': 'Payment',
          'NOT_APPLICABLE': 'N/A'
        };
        
        const colorClass = healthColors[healthStatus] || 'text-gray-600 bg-gray-100';
        const label = healthLabels[healthStatus] || healthStatus;
        
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
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

      case 'status':
        const statusIcons = {
          NOT_STARTED: <XCircle size={14} className="text-gray-500" />,
          INITIAL: <Clock size={14} className="text-red-500" />,
          IN_PROGRESS: <TrendingUp size={14} className="text-orange-500" />,
          ADVANCED: <TrendingUp size={14} className="text-blue-500" />,
          NEAR_COMPLETION: <AlertTriangle size={14} className="text-yellow-500" />,
          COMPLETED: <CheckCircle size={14} className="text-green-500" />
        };
        return (
          <div className="flex items-center gap-1 justify-center">
            {statusIcons[value] || <Clock size={14} className="text-gray-500" />}
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {(value || 'UNKNOWN').replace(/_/g, ' ')}
            </span>
          </div>
        );

      case 'date':
        if (!value || value === 'N/A' || value === '') return '-';
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
  
  // Add this function near the other handler functions
const handleRefreshData = () => {
  // If you have a refetch function from parent component, call it
  // Otherwise, you can implement a state update to trigger re-render
  
  // Option 1: If you have access to a refetch function from parent
  // if (props.onRefresh) {
  //   props.onRefresh();
  // }
  
  // Option 2: Force component to re-render by updating a state
  setCurrentPage(1); // Reset to first page
  // You might need to pass a key prop to force re-render
  // or implement a more sophisticated refresh mechanism
  
  console.log('Data refresh requested');
};


  const handleRowClick = (row, event) => {
    if (event.target.closest('button')) return;
    
    // Open the report in modal
    openReportModal(row);
    
    // Also call the original onRowClick if it exists
    if (onRowClick && typeof onRowClick === 'function') {
      openReportModal(row);
    }
  };

  // Function to open report modal
  const openReportModal = (row) => {
    const rowWithCalculatedFields = {
      ...row,
      calculated_time_allowed: row.calculated_time_allowed,
      progress_status_display: row.progress_status_display
    };
    
    setSelectedProjectForReport(rowWithCalculatedFields);
    setReportModalOpen(true);
  };

  // Function to open edit modal - NEW
  const openEditModal = (row, isNew = false) => {
    if (isNew) {
      setSelectedProjectForEdit(null);
      setIsNewProject(true);
    } else {
      const rowWithCalculatedFields = {
        ...row,
        calculated_time_allowed: row.calculated_time_allowed,
        progress_status_display: row.progress_status_display
      };
      setSelectedProjectForEdit(rowWithCalculatedFields);
      setIsNewProject(false);
    }
    setEditModalOpen(true);
  };

  // Handler for save success - NEW
  const handleEditSaveSuccess = (savedData) => {
    // You might want to refresh the data here
    // For example, call a refetch function if available
    console.log('Project saved:', savedData);
    // Add notification or refresh logic here
    window.location.reload(); // Simple refresh for now
  };

  // Handler for delete success - NEW
  const handleEditDeleteSuccess = (deletedData) => {
    // You might want to refresh the data here
    console.log('Project deleted:', deletedData);
    // Add notification or refresh logic here
    window.location.reload(); // Simple refresh for now
  };

  const exportTableData = () => {
    const csvContent = [
      [...selectedColumns, 'calculated_time_allowed_days'].join(','),
      ...processedData.map(row => {
        const values = selectedColumns.map(col => {
          if (col === 'calculated_time_allowed') {
            return row.calculated_time_allowed?.days || 0;
          } else if (col === 'progress_status_display') {
            return row.progress_status_display?.primary?.label || '';
          }
          const value = row[col];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        // Add calculated time allowed days as last column
        values.push(row.calculated_time_allowed?.days || 0);
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAmount = (value) => {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 100) return `₹${(value / 100).toFixed(2)} Cr`;
    return `₹${value.toFixed(2)} L`;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden flex flex-col h-full`} style={{ maxWidth }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No projects found matching your criteria</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden flex flex-col h-full`}
        style={{ maxWidth }}
      >
        {/* Compact Header with Stats and Controls */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {/* Compact Statistics Row */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-gray-100">{summaryStats.totalProjects}</strong> Projects
              </span>
            </div>
            
            <div className="text-gray-400">|</div>
            
            <div className="flex items-center gap-2">
              <Database size={16} className="text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Budget: <strong className="text-blue-600 dark:text-blue-400">{formatAmount(summaryStats.budgetAllocated)}</strong>
              </span>
            </div>
            
            <div className="text-gray-400">|</div>
            
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Spent: <strong className="text-green-600 dark:text-green-400">{formatAmount(summaryStats.budgetExpenditure)}</strong>
              </span>
            </div>
            
            <div className="text-gray-400">|</div>
            
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Avg Time: <strong className="text-purple-600 dark:text-purple-400">{summaryStats.averageTimeAllowed} days</strong>
              </span>
            </div>
            
            <div className="text-gray-400">|</div>
            
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Delayed: <strong className="text-orange-600 dark:text-orange-400">{summaryStats.delayedProjects}</strong>
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
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

            {/* Add New Project Button - NEW */}
            <button
              onClick={() => openEditModal(null, true)}
              className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm transition-all shadow-sm whitespace-nowrap"
            >
              <Plus size={16} />
              <span>Add Project</span>
            </button>

            {/* Export */}
            <button
              onClick={exportTableData}
              className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm transition-all shadow-sm whitespace-nowrap"
            >
              <TrendingUp size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div 
          ref={tableContainerRef}
          className="flex-1 overflow-auto"
          style={{ maxHeight: 'calc(100vh - 240px)' }}
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
                            col.sticky ? 'sticky left-0 z-[5] ' + (darkMode ? 'bg-gray-800' : 'bg-white') : ''
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
                            openReportModal(row);
                          }}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Report"
                        >
                          <Eye size={14} className="text-blue-500" />
                        </button>
                        
                        {/* Edit Button - NEW */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(row, false);
                          }}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <Edit size={14} className="text-green-500" />
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
                          className={`px-6 py-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <div className="space-y-6">
                          {/* Header Section */}
                          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">
                              {row.scheme_name || 'Project Details'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Serial No: {row.serial_no} | Budget Head: {row.budget_head || 'N/A'}
                            </p>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            
                            {/* Basic Information */}
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <h4 className="font-semibold mb-3 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <FileText size={16} />
                                Basic Information
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Source Sheet:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.source_sheet || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Umbrella Scheme:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.umberella_scheme || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Scheme:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.scheme || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">AA/ES Ref:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.aa_es_ref || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">AA/ES Pending:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.aa_es_pending_with || '-'}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Location & Organizations */}
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <h4 className="font-semibold mb-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <MapPin size={16} />
                                Location & Organizations
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">FHQ:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.ftr_hq || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">SHQ:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.shq || '-'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Work Site:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right max-w-[150px] truncate" title={row.work_site}>
                                    {row.work_site || '-'}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Executive Agency:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right max-w-[150px] truncate" title={row.executive_agency}>
                                    {row.executive_agency || '-'}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Contractor:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right max-w-[150px] truncate" title={row.firm_name}>
                                    {row.firm_name || '-'}
                                  </dd>
                                </div>
                              </dl>
                            </div>

                            {/* Financial Details */}
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <h4 className="font-semibold mb-3 text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                <DollarSign size={16} />
                                Financial Details
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Sanctioned Amount:</dt>
                                  <dd className="text-xs font-bold text-blue-600">{formatAmount(row.sanctioned_amount)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Expdr (31 Mar 25):</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatAmount(row.expdr_upto_31mar25)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Current FY Expdr:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatAmount(row.expdr_cfy)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Total Expenditure:</dt>
                                  <dd className="text-xs font-bold text-green-600">{formatAmount(row.total_expdr)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Expenditure %:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.percent_expdr?.toFixed(1) || 0}%</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Remaining:</dt>
                                  <dd className="text-xs font-bold text-orange-600">{formatAmount(row.remaining_amount)}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Timeline & Dates */}
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <h4 className="font-semibold mb-3 text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Calendar size={16} />
                                Timeline & Dates
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Date TS:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.date_ts, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Tender Date:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.date_tender, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Acceptance Date:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.date_acceptance, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Award Date:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.date_award, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">PDC Agreement:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.pdc_agreement, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Revised PDC:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.revised_pdc, 'date')}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Completion Date:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatCellValue(row.actual_completion_date, 'date')}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Progress & Performance */}
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <h4 className="font-semibold mb-3 text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Progress & Performance
                              </h4>
                              <dl className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Physical Progress:</dt>
                                  <dd className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div 
                                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                                        style={{ width: `${Math.min(100, Math.max(0, row.physical_progress || 0))}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{row.physical_progress?.toFixed(0) || 0}%</span>
                                  </dd>
                                </div>
                                <div className="flex justify-between items-center">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Progress Status:</dt>
                                  <dd className="text-xs">
                                    {row.progress_status_display && (
                                      <div className="flex flex-col items-end gap-1">
                                        <span className={`font-medium ${row.progress_status_display.primary.color}`}>
                                          {row.progress_status_display.primary.label}
                                        </span>
                                        {row.progress_status_display.secondary && (
                                          <span className={`text-[10px] ${row.progress_status_display.secondary.color}`}>
                                            ({row.progress_status_display.secondary.label})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Category:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                    {(row.progress_category || 'UNKNOWN').replace(/_/g, ' ')}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Health Status:</dt>
                                  <dd className="text-xs font-medium">
                                    {formatCellValue(row.health_status, 'health', row)}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Expected Progress:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                    {row.expected_progress?.toFixed(1) || 0}%
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Status:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.status || '-'}</dd>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <dt className="text-xs font-semibold text-gray-600 dark:text-gray-400">Time Allowed:</dt>
                                  <dd className={`text-xs font-bold ${
                                    row.calculated_time_allowed?.status === 'overdue' ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {row.calculated_time_allowed?.formatted || 'N/A'}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Contract Days:</dt>
                                  <dd className="text-xs font-medium text-gray-900 dark:text-gray-100">{row.time_allowed_days || 0} days</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Delay Days:</dt>
                                  <dd className={`text-xs font-bold ${(row.delay_days || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {row.delay_days || 0} days
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-600 dark:text-gray-400">Risk Level:</dt>
                                  <dd className="text-xs font-bold text-gray-900 dark:text-gray-100">{row.risk_level || '-'}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Remarks */}
                            {row.remarks && (
                              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} md:col-span-2 lg:col-span-3`}>
                                <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">Remarks</h4>
                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                  {row.remarks}
                                </p>
                              </div>
                            )}
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

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedProjectForReport(null);
        }}
        projectData={selectedProjectForReport}
        darkMode={darkMode}
      />

      {/* Edit Modal - NEW */}
      <EditComponent 
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProjectForEdit(null);
          setIsNewProject(false);
        }}
        projectData={selectedProjectForEdit}
        darkMode={darkMode}
        isNewProject={isNewProject}
        onSaveSuccess={handleEditSaveSuccess}
        onDeleteSuccess={handleEditDeleteSuccess}
        onRefreshData={handleRefreshData} // Add this new prop
      />

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default DataTable;