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
  Shield, Box, Route, Building, MoreHorizontal,
  Construction, Globe, Navigation, Layers, Hash,
  TrendingDown, Percent, Award, GitBranch, Settings,
  ArrowUp, ArrowDown, MinusCircle, PlusCircle,
  CalendarClock, CalendarCheck, CalendarX, Maximize2
} from 'lucide-react';

// Import the Report component directly
import Report from './Reports';

// Modal Component for Report - A4 Optimized
const ReportModal = ({ isOpen, onClose, projectData, darkMode }) => {
  const modalRef = useRef(null);
  const modalContentRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        ref={modalRef}
        className="relative w-full h-full max-w-[900px] max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp m-4"
        style={{
          maxWidth: 'min(900px, calc(100vw - 2rem))',
          maxHeight: 'calc(100vh - 2rem)',
        }}
      >
        <div 
          ref={modalContentRef}
          className="flex-1 overflow-auto bg-white dark:bg-gray-900"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollPaddingTop: '20px',
            scrollPaddingBottom: '20px'
          }}
        >
          <div className="w-full flex justify-center">
            <div 
              className="w-full max-w-[794px]" 
              style={{
                width: '100%',
                maxWidth: '794px',
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
    's_no', 'name_of_work', 'frontier', 'sector_hq', 'sanctioned_amount_cr',
    'spent_amount_cr', 'completed_percentage', 'completion_status', 'project_health', 'days_to_pdc'
  ]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const tableContainerRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // State for Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState(null);

  // Get work category icon
  const getWorkCategoryIcon = (category) => {
    switch(category) {
      case 'BORDER_OUTPOST': return Shield;
      case 'FENCING': return Box;
      case 'ROAD': return Route;
      case 'BRIDGE': return Construction;
      case 'INFRASTRUCTURE': return Building;
      default: return MoreHorizontal;
    }
  };

  // Format date from Operations format
  const formatOperationsDate = (dateString) => {
    if (!dateString || dateString === '') return 'N/A';
    
    const cleanString = dateString.replace(/'/g, ' ').trim();
    const parts = cleanString.split(' ');
    
    if (parts.length >= 2) {
      const monthMap = {
        'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1,
        'Mar': 2, 'March': 2, 'Apr': 3, 'April': 3,
        'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
        'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8,
        'Oct': 9, 'October': 9, 'Nov': 10, 'November': 10,
        'Dec': 11, 'December': 11
      };
      
      const monthName = parts[0].replace(/[^a-zA-Z]/g, '');
      const year = parseInt(parts[parts.length - 1]);
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        const date = new Date(year, monthMap[monthName], 1);
        return date.toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        });
      }
    }
    
    return dateString;
  };

  // Enhanced Operations-specific columns with additional fields
  const columns = [
    { key: 's_no', label: 'S.No', width: '60px', align: 'center' },
    { key: 'work_type', label: 'Work Type', width: '120px' },
    { key: 'name_of_work', label: 'Work Name', width: '250px', sticky: true },
    { key: 'work_category', label: 'Category', width: '140px', format: 'work_category' },
    { key: 'frontier', label: 'Frontier', width: '100px' },
    { key: 'sector_hq', label: 'Sector HQ', width: '100px' },
    { key: 'length_km', label: 'Length (Km)', width: '90px', align: 'right', format: 'number' },
    { key: 'units_aor', label: 'Units/AOR', width: '90px', align: 'center' },
    { key: 'sanctioned_amount_cr', label: 'Budget (Cr)', width: '100px', align: 'right', format: 'currency_cr' },
    { key: 'spent_amount_cr', label: 'Spent (Cr)', width: '100px', align: 'right', format: 'currency_cr' },
    { key: 'remaining_amount_cr', label: 'Remaining (Cr)', width: '100px', align: 'right', format: 'currency_cr' },
    { key: 'utilization_rate', label: 'Utilization', width: '100px', align: 'center', format: 'utilization' },
    { key: 'completed_percentage', label: 'Progress', width: '120px', align: 'center', format: 'progress' },
    { key: 'completion_status', label: 'Status', width: '140px', align: 'center', format: 'completion_status' },
    { key: 'project_health', label: 'Health', width: '120px', align: 'center', format: 'project_health' },
    { key: 'risk_level', label: 'Risk', width: '100px', align: 'center', format: 'risk_level' },
    { key: 'priority', label: 'Priority', width: '100px', align: 'center', format: 'priority' },
    { key: 'efficiency_score', label: 'Efficiency', width: '100px', align: 'center', format: 'percent' },
    { key: 'hlec_year', label: 'HLEC', width: '100px' },
    { key: 'hlec_meeting', label: 'HLEC Meeting', width: '120px' },
    { key: 'hlec_year_number', label: 'HLEC Year', width: '100px', align: 'center', format: 'year' },
    { key: 'sdc', label: 'SDC', width: '100px', format: 'ops_date' },
    { key: 'pdc', label: 'PDC', width: '100px', format: 'ops_date' },
    { key: 'days_to_pdc', label: 'Days to PDC', width: '120px', align: 'center', format: 'days_to_pdc' },
    { key: 'source_sheet', label: 'Source', width: '100px' },
    { key: 'remarks', label: 'Remarks', width: '200px' }
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

  // Process data
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    let processed = [...data];

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
        
        // Handle numeric values
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Handle string values
        aVal = aVal || '';
        bVal = bVal || '';
        
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

  // Enhanced summary statistics for Operations
  const summaryStats = useMemo(() => {
    if (!processedData || processedData.length === 0) {
      return {
        totalWorks: 0,
        totalBudgetCr: 0,
        totalSpentCr: 0,
        totalRemainingCr: 0,
        completedWorks: 0,
        ongoingWorks: 0,
        notStartedWorks: 0,
        averageCompletion: 0,
        averageUtilization: 0,
        criticalProjects: 0,
        onTrackProjects: 0,
        overdueProjects: 0,
        totalLength: 0
      };
    }

    const totalBudgetCr = processedData.reduce((sum, d) => sum + (d.sanctioned_amount_cr || 0), 0);
    const totalSpentCr = processedData.reduce((sum, d) => sum + (d.spent_amount_cr || 0), 0);
    const totalRemainingCr = processedData.reduce((sum, d) => sum + (d.remaining_amount_cr || 0), 0);
    
    const completedWorks = processedData.filter(d => d.completion_status === 'COMPLETED').length;
    const ongoingWorks = processedData.filter(d => 
      d.completion_status && !['COMPLETED', 'NOT_STARTED'].includes(d.completion_status)
    ).length;
    const notStartedWorks = processedData.filter(d => d.completion_status === 'NOT_STARTED').length;
    
    const averageCompletion = processedData.reduce((sum, d) => 
      sum + ((d.completed_percentage || 0) * 100), 0) / processedData.length;
    
    const averageUtilization = totalBudgetCr > 0 ? (totalSpentCr / totalBudgetCr * 100) : 0;
    
    const criticalProjects = processedData.filter(d => d.risk_level === 'CRITICAL').length;
    const onTrackProjects = processedData.filter(d => d.project_health === 'ON_TRACK').length;
    const overdueProjects = processedData.filter(d => d.days_to_pdc && d.days_to_pdc < 0).length;
    
    const totalLength = processedData.reduce((sum, d) => sum + (d.length_km || 0), 0);

    return {
      totalWorks: processedData.length,
      totalBudgetCr,
      totalSpentCr,
      totalRemainingCr,
      completedWorks,
      ongoingWorks,
      notStartedWorks,
      averageCompletion,
      averageUtilization,
      criticalProjects,
      onTrackProjects,
      overdueProjects,
      totalLength
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
      case 'currency_cr':
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return (
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
            ₹{amount.toFixed(2)} Cr
          </span>
        );

      case 'utilization':
        const sanctioned = row.sanctioned_amount_cr || 0;
        const spent = row.spent_amount_cr || 0;
        const utilization = sanctioned > 0 ? (spent / sanctioned * 100) : 0;
        const utilizationColor = utilization >= 80 ? 'text-green-600' :
                                 utilization >= 60 ? 'text-blue-600' :
                                 utilization >= 40 ? 'text-yellow-600' :
                                 'text-red-600';
        return (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${utilizationColor}`}>
              {utilization.toFixed(1)}%
            </span>
            {utilization > 100 && <ArrowUp size={10} className="text-red-500" />}
          </div>
        );

      case 'work_category':
        const CategoryIcon = getWorkCategoryIcon(value);
        const categoryLabels = {
          'BORDER_OUTPOST': 'BOP',
          'FENCING': 'Fencing',
          'ROAD': 'Road',
          'BRIDGE': 'Bridge',
          'INFRASTRUCTURE': 'Infra',
          'OTHER': 'Other'
        };
        return (
          <div className="flex items-center gap-1">
            <CategoryIcon size={12} className="text-blue-500" />
            <span className="text-[10px] font-medium">{categoryLabels[value] || value}</span>
          </div>
        );

      case 'progress':
        const progressValue = (parseFloat(value) || 0) * 100;
        const progressIcon = progressValue === 100 ? CheckCircle :
                            progressValue >= 75 ? Target :
                            progressValue >= 50 ? Activity :
                            progressValue >= 25 ? PlayCircle :
                            progressValue > 0 ? Timer :
                            PauseCircle;
        const ProgressIcon = progressIcon;
        
        return (
          <div className="flex items-center gap-2">
            <ProgressIcon size={12} className={
              progressValue === 100 ? 'text-green-500' :
              progressValue >= 75 ? 'text-teal-500' :
              progressValue >= 50 ? 'text-blue-500' :
              progressValue >= 25 ? 'text-yellow-500' :
              progressValue > 0 ? 'text-orange-500' :
              'text-gray-400'
            } />
            <div className="flex-1">
              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all bg-gradient-to-r"
                  style={{
                    width: `${Math.min(100, Math.max(0, progressValue))}%`,
                    backgroundImage: progressValue === 100 ? 'linear-gradient(to right, #10b981, #059669)' :
                                    progressValue >= 75 ? 'linear-gradient(to right, #14b8a6, #0d9488)' :
                                    progressValue >= 50 ? 'linear-gradient(to right, #3b82f6, #2563eb)' :
                                    progressValue >= 25 ? 'linear-gradient(to right, #f59e0b, #d97706)' : 
                                    progressValue > 0 ? 'linear-gradient(to right, #fb923c, #ea580c)' :
                                    'linear-gradient(to right, #9ca3af, #6b7280)'
                  }}
                />
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap text-gray-700 dark:text-gray-300 ml-1">
                {progressValue.toFixed(0)}%
              </span>
            </div>
          </div>
        );

      case 'completion_status':
        const statusColors = {
          'NOT_STARTED': 'text-red-600 bg-red-100 dark:bg-red-900/20',
          'INITIAL': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
          'IN_PROGRESS': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
          'ADVANCED': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
          'NEAR_COMPLETION': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
          'COMPLETED': 'text-green-600 bg-green-100 dark:bg-green-900/20'
        };
        
        const statusLabels = {
          'NOT_STARTED': 'Not Started',
          'INITIAL': 'Initial',
          'IN_PROGRESS': 'In Progress',
          'ADVANCED': 'Advanced',
          'NEAR_COMPLETION': 'Near Complete',
          'COMPLETED': 'Completed'
        };
        
        const statusIcons = {
          'NOT_STARTED': PauseCircle,
          'INITIAL': PlayCircle,
          'IN_PROGRESS': Timer,
          'ADVANCED': Activity,
          'NEAR_COMPLETION': Target,
          'COMPLETED': CheckCircle
        };
        
        const StatusIcon = statusIcons[value] || MinusCircle;
        
        return (
          <div className="flex items-center gap-1">
            <StatusIcon size={10} className={statusColors[value]?.split(' ')[0] || 'text-gray-600'} />
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[value] || 'text-gray-600 bg-gray-100'}`}>
              {statusLabels[value] || value}
            </span>
          </div>
        );

      case 'project_health':
        const healthColors = {
          'ON_TRACK': 'text-green-600 bg-green-100 dark:bg-green-900/20',
          'MINOR_DELAY': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
          'MODERATE_DELAY': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
          'SEVERE_DELAY': 'text-red-600 bg-red-100 dark:bg-red-900/20'
        };
        
        const healthLabels = {
          'ON_TRACK': 'On Track',
          'MINOR_DELAY': 'Minor Delay',
          'MODERATE_DELAY': 'Moderate Delay',
          'SEVERE_DELAY': 'Severe Delay'
        };
        
        const healthIcons = {
          'ON_TRACK': Heart,
          'MINOR_DELAY': Clock,
          'MODERATE_DELAY': AlertCircle,
          'SEVERE_DELAY': AlertTriangle
        };
        
        const HealthIcon = healthIcons[value] || MinusCircle;
        
        return (
          <div className="flex items-center gap-1">
            <HealthIcon size={10} className={healthColors[value]?.split(' ')[0] || 'text-gray-600'} />
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${healthColors[value] || 'text-gray-600 bg-gray-100'}`}>
              {healthLabels[value] || value}
            </span>
          </div>
        );

      case 'risk_level':
        const riskColors = {
          'CRITICAL': 'text-red-700 bg-red-100 dark:bg-red-900/20',
          'HIGH': 'text-orange-700 bg-orange-100 dark:bg-orange-900/20',
          'MEDIUM': 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20',
          'LOW': 'text-green-700 bg-green-100 dark:bg-green-900/20'
        };
        
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskColors[value] || 'text-gray-600 bg-gray-100'}`}>
            {value}
          </span>
        );

      case 'priority':
        const priorityColors = {
          'URGENT': 'text-red-700 bg-red-100 dark:bg-red-900/20',
          'HIGH': 'text-orange-700 bg-orange-100 dark:bg-orange-900/20',
          'MEDIUM': 'text-blue-700 bg-blue-100 dark:bg-blue-900/20',
          'LOW': 'text-gray-700 bg-gray-100 dark:bg-gray-900/20'
        };
        
        const priorityIcons = {
          'URGENT': <Zap size={12} />,
          'HIGH': <AlertTriangle size={12} />,
          'MEDIUM': <Activity size={12} />,
          'LOW': <Clock size={12} />
        };
        
        return (
          <div className="flex items-center justify-center gap-1">
            {priorityIcons[value]}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColors[value] || 'text-gray-600 bg-gray-100'}`}>
              {value}
            </span>
          </div>
        );

      case 'days_to_pdc':
        const days = parseInt(value) || 0;
        const isOverdue = days < 0;
        const absdays = Math.abs(days);
        
        const dayColor = isOverdue ? (
          absdays > 365 ? 'text-red-700 font-bold' :
          absdays > 180 ? 'text-red-600 font-bold' :
          absdays > 90 ? 'text-red-500 font-semibold' :
          'text-orange-600 font-semibold'
        ) : (
          days < 30 ? 'text-yellow-600 font-semibold' :
          days < 90 ? 'text-blue-600' :
          days < 180 ? 'text-green-600' :
          'text-gray-600'
        );
        
        const dayIcon = isOverdue ? (
          absdays > 180 ? CalendarX :
          absdays > 90 ? AlertTriangle :
          AlertCircle
        ) : (
          days < 30 ? CalendarClock :
          days < 90 ? Clock :
          CalendarCheck
        );
        
        const DayIcon = dayIcon;
        
        return (
          <div className="flex items-center gap-1.5">
            <DayIcon size={12} className={isOverdue ? 'text-red-500' : 'text-blue-500'} />
            <span className={`text-xs ${dayColor}`}>
              {isOverdue ? (
                <span className="flex items-center gap-1">
                  <span>{absdays}d</span>
                  <span className="text-[10px]">overdue</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>{days}d</span>
                  <span className="text-[10px]">remaining</span>
                </span>
              )}
            </span>
          </div>
        );

      case 'year':
        return value ? (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {value}
          </span>
        ) : '-';

      case 'ops_date':
        return formatOperationsDate(value);

      case 'percent':
        const percentValue = parseFloat(value) || 0;
        return (
          <span className={`font-medium ${
            percentValue >= 80 ? 'text-green-600' :
            percentValue >= 60 ? 'text-blue-600' :
            percentValue >= 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {percentValue.toFixed(1)}%
          </span>
        );

      case 'number':
        return (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {parseFloat(value).toFixed(1)}
          </span>
        );

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
    if (event.target.closest('button')) return;
    
    // Open the report in modal
    openReportModal(row);
  };

  // Function to open report modal
  const openReportModal = (row) => {
    setSelectedProjectForReport(row);
    setReportModalOpen(true);
  };

  const exportTableData = () => {
    const csvContent = [
      selectedColumns.join(','),
      ...processedData.map(row => {
        const values = selectedColumns.map(col => {
          const value = row[col];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        return values.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAmount = (value, inCrores = true) => {
    if (!value || isNaN(value)) return '₹0';
    if (inCrores) return `₹${value.toFixed(2)} Cr`;
    return `₹${(value * 100).toFixed(2)} L`;
  };

  // Expanded Row Details Component - Compact Version
  const ExpandedRowDetails = ({ row }) => {
    const utilizationRate = row.sanctioned_amount_cr > 0 
      ? ((row.spent_amount_cr || 0) / row.sanctioned_amount_cr * 100).toFixed(1)
      : 0;
      
    const costPerKm = row.length_km > 0 
      ? (row.sanctioned_amount_cr / row.length_km).toFixed(2)
      : 'N/A';
      
    const costPerUnit = row.units_aor > 0
      ? (row.sanctioned_amount_cr / row.units_aor).toFixed(2)
      : 'N/A';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Column */}
        <div className="space-y-2">
          {/* Project Overview */}
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
            <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Construction size={10} />
              Project Details
            </h5>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">S.No</p>
                <p className="text-[10px] font-medium">{row.s_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Work Type</p>
                <p className="text-[10px] font-medium truncate" title={row.work_type}>{row.work_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Category</p>
                <div className="text-[10px]">{formatCellValue(row.work_category, 'work_category', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Source</p>
                <p className="text-[10px] font-medium">{row.source_sheet || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">HLEC Meeting</p>
                <p className="text-[10px] font-medium">{row.hlec_meeting || row.hlec_year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">HLEC Year</p>
                <p className="text-[10px] font-medium">{row.hlec_year_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Location & Coverage */}
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
            <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <MapPin size={10} />
              Location
            </h5>
            <div className="grid grid-cols-4 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Frontier</p>
                <p className="text-[10px] font-medium">{row.frontier || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Sector HQ</p>
                <p className="text-[10px] font-medium">{row.sector_hq || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Length</p>
                <p className="text-[10px] font-medium">{row.length_km ? `${row.length_km} km` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Units/AOR</p>
                <p className="text-[10px] font-medium">{row.units_aor || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Progress & Timeline */}
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
            <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Activity size={10} />
              Progress & Timeline
            </h5>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Progress</p>
                <div className="scale-75 origin-left">{formatCellValue(row.completed_percentage, 'progress', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Status</p>
                <div className="scale-75 origin-left">{formatCellValue(row.completion_status, 'completion_status', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">SDC</p>
                <p className="text-[10px] font-medium">{formatOperationsDate(row.sdc)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">PDC</p>
                <p className="text-[10px] font-medium">{formatOperationsDate(row.pdc)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Days to PDC</p>
                <div className="scale-75 origin-left">{formatCellValue(row.days_to_pdc, 'days_to_pdc', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Efficiency</p>
                <p className="text-[10px] font-medium">{row.efficiency_score ? `${row.efficiency_score.toFixed(1)}%` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {/* Financial Details */}
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
            <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <DollarSign size={10} />
              Financial
            </h5>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Sanctioned</p>
                <p className="text-[11px] font-bold text-green-600">₹{row.sanctioned_amount_cr?.toFixed(2) || 0} Cr</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Spent</p>
                <p className="text-[11px] font-bold text-blue-600">₹{row.spent_amount_cr?.toFixed(2) || 0} Cr</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Remaining</p>
                <p className="text-[11px] font-bold text-orange-600">₹{row.remaining_amount_cr?.toFixed(2) || 0} Cr</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Utilization</p>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-bold">{utilizationRate}%</p>
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div 
                      className="h-1 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, utilizationRate)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Cost/Km</p>
                <p className="text-[10px] font-medium">{costPerKm !== 'N/A' ? `₹${costPerKm} Cr` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Cost/Unit</p>
                <p className="text-[10px] font-medium">{costPerUnit !== 'N/A' ? `₹${costPerUnit} Cr` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Health & Risk Assessment */}
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
            <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Heart size={10} />
              Health & Risk
            </h5>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Health</p>
                <div className="scale-75 origin-left">{formatCellValue(row.project_health, 'project_health', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Risk</p>
                <div className="scale-75 origin-left">{formatCellValue(row.risk_level, 'risk_level', row)}</div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Priority</p>
                <div className="scale-75 origin-left">{formatCellValue(row.priority, 'priority', row)}</div>
              </div>
            </div>
          </div>

          {/* Remarks and Action */}
          <div className="space-y-2">
            {row.remarks && (
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'} border`}>
                <h5 className="font-semibold text-[10px] uppercase text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <FileText size={10} />
                  Remarks
                </h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2">{row.remarks}</p>
              </div>
            )}
            
            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReportModal(row);
              }}
              className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 text-[11px] font-medium"
            >
              <Eye size={12} />
              View Full Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden flex flex-col h-full`} style={{ maxWidth }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No operations works found matching your criteria</p>
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
        {/* Header with Stats and Controls */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {/* Enhanced Statistics Row */}
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            <div className="flex items-center gap-2 px-2">
              <Construction size={16} className="text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-gray-100">{summaryStats.totalWorks}</strong> Works
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <DollarSign size={16} className="text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Budget: <strong className="text-green-600 dark:text-green-400">{formatAmount(summaryStats.totalBudgetCr, true)}</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <CreditCard size={16} className="text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Spent: <strong className="text-blue-600 dark:text-blue-400">{formatAmount(summaryStats.totalSpentCr, true)}</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <Percent size={16} className="text-indigo-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Utilization: <strong className="text-indigo-600 dark:text-indigo-400">{summaryStats.averageUtilization.toFixed(1)}%</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <Activity size={16} className="text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Progress: <strong className="text-purple-600 dark:text-purple-400">{summaryStats.averageCompletion.toFixed(0)}%</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Completed: <strong className="text-green-600 dark:text-green-400">{summaryStats.completedWorks}</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Critical: <strong className="text-red-600 dark:text-red-400">{summaryStats.criticalProjects}</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <CalendarX size={16} className="text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Overdue: <strong className="text-orange-600 dark:text-orange-400">{summaryStats.overdueProjects}</strong>
              </span>
            </div>
            
            <div className="text-gray-300 dark:text-gray-600">|</div>
            
            <div className="flex items-center gap-2 px-2">
              <Route size={16} className="text-teal-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Length: <strong className="text-teal-600 dark:text-teal-400">{summaryStats.totalLength.toFixed(1)} km</strong>
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
                placeholder="Search works..."
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
                Columns ({selectedColumns.length})
              </button>
              
              {showColumnSelector && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl z-50 ${
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
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      onClick={() => setSelectedColumns(columns.map(c => c.key))}
                      className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedColumns(['s_no', 'name_of_work', 'frontier', 'sanctioned_amount_cr', 'completed_percentage'])}
                      className="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:opacity-80"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                <React.Fragment key={row.id || row.s_no || index}>
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
                          className={`px-3 py-2 text-${col.align || 'left'} text-xs ${
                            col.sticky ? 'sticky left-0 z-[5] ' + (darkMode ? 'bg-gray-800' : 'bg-white') : ''
                          }`}
                        >
                          {col.key === 'name_of_work' ? (
                            <div className="max-w-xs">
                              <p className="truncate font-medium text-gray-900 dark:text-gray-100 text-xs" title={row[col.key]}>
                                {row[col.key] || 'N/A'}
                              </p>
                              {row.work_type && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{row.work_type}</p>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(row.id || row.s_no || index);
                          }}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Expand"
                        >
                          {expandedRows.includes(row.id || row.s_no || index) ? 
                            <ChevronUp size={14} className="text-gray-600 dark:text-gray-400" /> : 
                            <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRows.includes(row.id || row.s_no || index) && (
                    <tr>
                      <td colSpan={selectedColumns.length + (compareMode ? 2 : 1)} 
                          className={`px-6 py-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <ExpandedRowDetails row={row} />
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
              {searchTerm && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (filtered from {data.length} total)
                </span>
              )}
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
              
              {/* Page number inputs for quick navigation */}
              <div className="flex items-center gap-1">
                {totalPages > 10 ? (
                  <>
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          1
                        </button>
                        {currentPage > 4 && <span className="px-1 text-gray-400">...</span>}
                      </>
                    )}
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 :
                                     currentPage >= totalPages - 2 ? totalPages - 4 + i :
                                     currentPage - 2 + i;
                      
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 text-xs rounded ${
                            pageNum === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  [...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-2 py-1 text-xs rounded ${
                        i + 1 === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                )}
              </div>
              
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
              
              {/* Jump to page */}
              <div className="ml-2 flex items-center gap-1">
                <span className="text-xs text-gray-500">Jump to:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className={`w-12 px-1 py-0.5 text-xs rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-1 focus:ring-blue-400`}
                />
              </div>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages || 1}
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
        
        /* Custom scrollbar */
        .overflow-auto::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .overflow-auto::-webkit-scrollbar-track {
          background: ${darkMode ? '#374151' : '#f3f4f6'};
          border-radius: 4px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#6b7280' : '#d1d5db'};
          border-radius: 4px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#9ca3af' : '#9ca3af'};
        }
      `}</style>
    </>
  );
};

export default DataTable;