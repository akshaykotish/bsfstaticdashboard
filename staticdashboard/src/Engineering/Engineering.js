import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building, TrendingUp, DollarSign, Clock, CheckCircle, 
  AlertCircle, Activity, Briefcase, Download, RefreshCw,
  IndianRupee, Gauge, AlertTriangle, Settings, Bell,
  Filter, Save, Share2, Printer, Moon, Sun, X,
  ChevronDown, Eye, Maximize2, Minimize2, Grid3x3,
  Search, Database, BarChart3, Users, MapPin,
  Calendar, Building2, Target, Shield, GitBranch,
  FileText, Menu, Home, LogOut, HelpCircle
} from 'lucide-react';
import { useData } from './useData';
import { useFilters } from './useFilters';
import FilterPanel from './FilterPanel';
import MetricsCards from './MetricsCards';
import ChartTabs from './ChartTabs';
import DataTable from './DataTable';
import Modal from './Modal';
import AISuggestions from './AISuggestions';
import { calculateMetrics, exportData, printReport } from './utils';

// Helper function to format currency amounts properly
const formatAmount = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  
  // Value is already in lakhs from CSV
  const absValue = Math.abs(value);
  
  if (absValue >= 10000) {
    // Convert to crores (1 crore = 100 lakhs)
    return `₹${(value / 100).toFixed(2)} Cr`;
  } else if (absValue >= 100) {
    // Keep in lakhs for values >= 1 crore (100 lakhs)
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 1) {
    // For smaller lakh values
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 0.01) {
    // Convert to thousands (1 lakh = 100 thousands)
    return `₹${(value * 100).toFixed(2)} K`;
  } else {
    return `₹${(value * 100).toFixed(2)} K`;
  }
};

const Engineering = () => {
  // State Management
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDownModal, setShowDrillDownModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState('default');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Custom hooks for data and filters
  const { rawData, loading, error, refetch, lastUpdate, dataStats } = useData();
  const filters = useFilters();

  // Initialize filters with raw data
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      console.log('Engineering: Raw data loaded', {
        count: rawData.length,
        sample: rawData[0],
        fields: Object.keys(rawData[0] || {})
      });
      
      filters.setRawData(rawData);
      
      const amounts = rawData.map(d => d.sanctioned_amount || 0);
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 0) {
        filters.setAmountRange([0, maxAmount]);
      }

      if (rawData.length > 0) {
        generateInsights(rawData);
      }
    }
  }, [rawData]);

  // Get filtered data from filters
  const filteredData = filters.filteredData || [];

  // Calculate metrics with proper amount handling and organization counts
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalProjects: 0,
        totalSanctionedCr: 0,
        totalExpenditureCr: 0,
        remainingBudgetCr: 0,
        avgProgress: 0,
        avgEfficiency: 0,
        avgHealthScore: 0,
        completed: 0,
        ongoing: 0,
        notStarted: 0,
        critical: 0,
        delayed: 0,
        onTrack: 0,
        utilizationRate: 0,
        completionRate: 0,
        delayRate: 0,
        criticalRate: 0,
        activeAgencies: 0,
        totalContractors: 0,
        totalLocations: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        avgDuration: 0,
        completedThisMonth: 0,
        completedThisQuarter: 0,
        completedThisYear: 0,
        delayedUnder30: 0,
        delayed30to90: 0,
        delayedOver90: 0
      };
    }

    const total = filteredData.length;
    // All amounts in CSV are in lakhs, convert to crores for display
    const totalSanctioned = filteredData.reduce((sum, item) => sum + (item.sanctioned_amount || 0), 0) / 100;
    const totalExpenditure = filteredData.reduce((sum, item) => sum + (item.total_expdr || 0), 0) / 100;
    const avgProgress = filteredData.reduce((sum, item) => sum + (item.physical_progress || 0), 0) / total;
    const avgEfficiency = filteredData.reduce((sum, item) => sum + (item.efficiency_score || 0), 0) / total;
    const avgHealthScore = filteredData.reduce((sum, item) => sum + (item.health_score || 0), 0) / total;
    
    const completed = filteredData.filter(item => item.physical_progress >= 100).length;
    const ongoing = filteredData.filter(item => item.physical_progress > 0 && item.physical_progress < 100).length;
    const notStarted = filteredData.filter(item => item.physical_progress === 0).length;
    
    const critical = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
    const highRisk = filteredData.filter(item => item.risk_level === 'HIGH').length;
    const mediumRisk = filteredData.filter(item => item.risk_level === 'MEDIUM').length;
    const lowRisk = filteredData.filter(item => item.risk_level === 'LOW').length;
    
    const delayed = filteredData.filter(item => item.delay_days > 0).length;
    const onTrack = filteredData.filter(item => item.delay_days === 0 && item.physical_progress > 0).length;
    
    const delayedUnder30 = filteredData.filter(item => item.delay_days > 0 && item.delay_days <= 30).length;
    const delayed30to90 = filteredData.filter(item => item.delay_days > 30 && item.delay_days <= 90).length;
    const delayedOver90 = filteredData.filter(item => item.delay_days > 90).length;
    
    // Calculate unique organization counts
    const uniqueAgencies = new Set(
      filteredData
        .map(item => item.executive_agency)
        .filter(agency => agency && agency !== '' && agency !== 'N/A' && agency !== 'Unknown Agency')
    );
    
    const uniqueContractors = new Set(
      filteredData
        .map(item => item.firm_name)
        .filter(contractor => contractor && contractor !== '' && contractor !== 'N/A' && contractor !== 'Unknown Contractor')
    );
    
    const uniqueLocations = new Set(
      filteredData
        .map(item => {
          const location = item.work_site;
          if (!location || location === '' || location === 'N/A' || location === 'Unknown Location') return null;
          return location.split(',')[0].trim();
        })
        .filter(loc => loc !== null)
    );
    
    // Calculate average duration
    const avgDuration = filteredData
      .filter(item => item.time_allowed_days)
      .reduce((sum, item) => sum + item.time_allowed_days, 0) / 
      filteredData.filter(item => item.time_allowed_days).length || 0;
    
    // Calculate recent completions
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const completedThisMonth = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      return completionDate.getMonth() === thisMonth && completionDate.getFullYear() === thisYear;
    }).length;
    
    const completedThisQuarter = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      const quarter = Math.floor(completionDate.getMonth() / 3);
      const currentQuarter = Math.floor(thisMonth / 3);
      return quarter === currentQuarter && completionDate.getFullYear() === thisYear;
    }).length;
    
    const completedThisYear = filteredData.filter(item => {
      if (item.physical_progress < 100 || !item.actual_completion_date) return false;
      const completionDate = new Date(item.actual_completion_date);
      return completionDate.getFullYear() === thisYear;
    }).length;
    
    return {
      totalProjects: total,
      totalSanctionedCr: totalSanctioned,
      totalExpenditureCr: totalExpenditure,
      remainingBudgetCr: totalSanctioned - totalExpenditure,
      avgProgress: avgProgress.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      completed,
      ongoing,
      notStarted,
      critical,
      highRisk,
      mediumRisk,
      lowRisk,
      delayed,
      onTrack,
      utilizationRate: totalSanctioned ? ((totalExpenditure / totalSanctioned) * 100).toFixed(1) : 0,
      completionRate: total ? ((completed / total) * 100).toFixed(1) : 0,
      delayRate: total ? ((delayed / total) * 100).toFixed(1) : 0,
      criticalRate: total ? ((critical / total) * 100).toFixed(1) : 0,
      activeAgencies: uniqueAgencies.size,
      totalContractors: uniqueContractors.size,
      totalLocations: uniqueLocations.size,
      avgDuration: Math.round(avgDuration),
      completedThisMonth,
      completedThisQuarter,
      completedThisYear,
      delayedUnder30,
      delayed30to90,
      delayedOver90
    };
  }, [filteredData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        refetch();
        addNotification('Data refreshed', 'info');
      }, refreshInterval * 60000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refetch]);

  // Check for critical projects and add notifications
  useEffect(() => {
    const criticalProjects = filteredData.filter(p => p.risk_level === 'CRITICAL');
    if (criticalProjects.length > 5) {
      addNotification(
        `${criticalProjects.length} projects require immediate attention`,
        'warning'
      );
    }
  }, [filteredData]);

  // Helper Functions
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
  };

  const generateInsights = (data) => {
    const insights = [];
    
    const criticalCount = data.filter(d => d.risk_level === 'CRITICAL').length;
    if (criticalCount > data.length * 0.2) {
      insights.push({
        type: 'critical',
        message: `${criticalCount} projects (${(criticalCount/data.length * 100).toFixed(1)}%) are in critical state`,
        action: 'Review resource allocation'
      });
    }

    const totalBudget = data.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0);
    const totalSpent = data.reduce((sum, d) => sum + (d.total_expdr || 0), 0);
    const utilization = (totalSpent / totalBudget * 100);
    if (utilization < 50) {
      insights.push({
        type: 'budget',
        message: `Low budget utilization at ${utilization.toFixed(1)}%`,
        action: 'Accelerate fund disbursement'
      });
    }

    const delayedProjects = data.filter(d => d.delay_days > 30).length;
    if (delayedProjects > data.length * 0.3) {
      insights.push({
        type: 'delay',
        message: `${delayedProjects} projects delayed by more than 30 days`,
        action: 'Review contractor performance'
      });
    }

    return insights;
  };

  // Handler Functions
  const handleProjectSelect = useCallback((project) => {
    console.log('Engineering: handleProjectSelect called', { 
      project, 
      compareMode,
      hasRequiredFields: !!(project?.serial_no && project?.scheme_name)
    });
    
    if (!project) {
      console.error('Engineering: No project data provided to handleProjectSelect');
      return;
    }
    
    if (compareMode) {
      setSelectedProjects(prev => {
        const exists = prev.find(p => p.id === project.id);
        if (exists) {
          return prev.filter(p => p.id !== project.id);
        }
        if (prev.length < 5) {
          return [...prev, project];
        }
        addNotification('Maximum 5 projects can be compared', 'warning');
        return prev;
      });
    } else {
      // Ensure all required fields are present
      const projectWithDefaults = {
        ...project,
        serial_no: project.serial_no || 'N/A',
        scheme_name: project.scheme_name || 'Unknown Project',
        budget_head: project.budget_head || 'N/A',
        work_site: project.work_site || 'N/A',
        executive_agency: project.executive_agency || 'N/A',
        firm_name: project.firm_name || 'N/A',
        physical_progress: project.physical_progress || 0,
        efficiency_score: project.efficiency_score || 0,
        health_score: project.health_score || 0,
        delay_days: project.delay_days || 0,
        risk_level: project.risk_level || 'LOW',
        status: project.status || 'NOT_STARTED',
        priority: project.priority || 'LOW',
        sanctioned_amount: project.sanctioned_amount || 0,
        total_expdr: project.total_expdr || 0,
        percent_expdr: project.percent_expdr || 0,
        remaining_amount: project.remaining_amount || 0
      };
      
      console.log('Engineering: Setting selected project', projectWithDefaults);
      setSelectedProject(projectWithDefaults);
      setModalOpen(true);
    }
  }, [compareMode]);

  const handleDrillDown = useCallback((type, data) => {
    let drillData = [];
    switch(type) {
      case 'critical':
        drillData = filteredData.filter(d => d.risk_level === 'CRITICAL');
        break;
      case 'delayed':
        drillData = filteredData.filter(d => d.delay_days > 0);
        break;
      case 'completed':
        drillData = filteredData.filter(d => d.physical_progress >= 100);
        break;
      case 'agencies':
        drillData = filteredData.filter(d => d.executive_agency);
        break;
      case 'contractors':
        drillData = filteredData.filter(d => d.firm_name);
        break;
      case 'locations':
        drillData = filteredData.filter(d => d.work_site);
        break;
      case 'agency':
        drillData = filteredData.filter(d => d.executive_agency === data);
        break;
      case 'contractor':
        drillData = filteredData.filter(d => d.firm_name === data);
        break;
      case 'location':
        drillData = filteredData.filter(d => d.work_site?.includes(data));
        break;
      case 'budget':
        drillData = filteredData.filter(d => d.budget_head === data);
        break;
      default:
        drillData = filteredData;
    }
    setDrillDownData({ type, data: drillData, filter: data });
    setShowDrillDownModal(true);
  }, [filteredData]);

  const handleExport = useCallback((format = 'csv') => {
    exportData(filteredData, format, metrics);
    addNotification(`Data exported as ${format.toUpperCase()}`, 'success');
  }, [filteredData, metrics]);

  const handleExportReport = useCallback((data, reportType) => {
    const reportContent = {
      type: reportType,
      data: data,
      metrics: metrics,
      generatedAt: new Date().toISOString(),
      filters: filters.getFilterState()
    };
    
    const jsonData = JSON.stringify(reportContent, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification(`Report exported: ${reportType}`, 'success');
  }, [metrics, filters]);

  const handlePrintReport = useCallback((data, reportType) => {
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Engineering Report - ${reportType} - ${new Date().toLocaleDateString()}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            line-height: 1.6;
          }
          h1 { 
            color: #f97316; 
            border-bottom: 2px solid #f97316;
            padding-bottom: 10px;
          }
          h2 { 
            color: #333; 
            margin-top: 30px;
            background: #f5f5f5;
            padding: 10px;
            border-left: 4px solid #f97316;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background-color: #f97316; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
          }
          .metric-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #f97316; 
          }
          .metric-label { 
            color: #666; 
            font-size: 14px;
            margin-bottom: 5px;
          }
          .page-break { 
            page-break-after: always; 
          }
          @media print { 
            body { padding: 10px; }
            .no-print { display: none; }
          }
          .header-info {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>Engineering Analytics Report</h1>
          <p><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${filteredData.length} projects</p>
        </div>
        
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Projects</div>
            <div class="metric-value">${metrics.totalProjects}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Budget</div>
            <div class="metric-value">${formatAmount(metrics.totalSanctionedCr * 100)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Completion Rate</div>
            <div class="metric-value">${metrics.completionRate}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Critical Projects</div>
            <div class="metric-value">${metrics.critical}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Delayed Projects</div>
            <div class="metric-value">${metrics.delayed}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Progress</div>
            <div class="metric-value">${metrics.avgProgress}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Efficiency</div>
            <div class="metric-value">${metrics.avgEfficiency}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Budget Utilization</div>
            <div class="metric-value">${metrics.utilizationRate}%</div>
          </div>
        </div>
        
        <div class="page-break"></div>
        
        <h2>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis Details</h2>
    `;
    
    // Add specific content based on report type
    if (data && typeof data === 'object') {
      htmlContent += '<div style="margin-top: 20px;">';
      htmlContent += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
      htmlContent += '</div>';
    }
    
    // Add top projects table
    htmlContent += `
        <h2>Top Projects (by Budget)</h2>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Scheme Name</th>
              <th>Location</th>
              <th>Agency</th>
              <th>Budget</th>
              <th>Progress (%)</th>
              <th>Risk Level</th>
              <th>Delay (days)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    filteredData
      .sort((a, b) => b.sanctioned_amount - a.sanctioned_amount)
      .slice(0, 20)
      .forEach(project => {
        htmlContent += `
          <tr>
            <td>${project.serial_no}</td>
            <td>${project.scheme_name}</td>
            <td>${project.work_site}</td>
            <td>${project.executive_agency}</td>
            <td>${formatAmount(project.sanctioned_amount)}</td>
            <td>${project.physical_progress}%</td>
            <td style="color: ${
              project.risk_level === 'CRITICAL' ? 'red' :
              project.risk_level === 'HIGH' ? 'orange' :
              project.risk_level === 'MEDIUM' ? 'yellow' : 'green'
            }">${project.risk_level}</td>
            <td>${project.delay_days}</td>
          </tr>
        `;
      });
    
    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>End of Report - Total Records: ${filteredData.length}</p>
          <p>© 2025 Engineering Analytics Dashboard</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    addNotification('Print preview opened', 'info');
  }, [filteredData, metrics]);

  const handlePrint = useCallback(() => {
    handlePrintReport(filteredData, activeTab);
  }, [filteredData, activeTab, handlePrintReport]);

  const saveCurrentFilters = useCallback(() => {
    const filterSet = {
      id: Date.now(),
      name: `Filter Set ${savedFilters.length + 1}`,
      timestamp: new Date(),
      filters: filters.getFilterState()
    };
    setSavedFilters(prev => [...prev, filterSet]);
    addNotification('Filters saved successfully', 'success');
  }, [savedFilters, filters]);

  const loadFilterSet = useCallback((filterSet) => {
    filters.loadFilterState(filterSet.filters);
    addNotification(`Loaded: ${filterSet.name}`, 'success');
  }, [filters]);

  const shareAnalytics = useCallback(async () => {
    const shareData = {
      title: 'Engineering Analytics Report',
      text: `Total Projects: ${metrics.totalProjects}, Budget: ${formatAmount(metrics.totalSanctionedCr * 100)}`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        addNotification('Analytics shared successfully', 'success');
      } else {
        navigator.clipboard.writeText(shareData.url);
        addNotification('Link copied to clipboard', 'success');
      }
    } catch (err) {
      addNotification('Failed to share', 'error');
    }
  }, [metrics]);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    addNotification('All notifications cleared', 'info');
  }, []);

  // Component Functions
  const DrillDownModal = () => {
    if (!showDrillDownModal || !drillDownData) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDrillDownModal(false)}
        />
        
        <div className={`relative w-[70vw] max-h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  Drill-down View: {drillDownData.type.charAt(0).toUpperCase() + drillDownData.type.slice(1)}
                </h2>
                {drillDownData.filter && (
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-orange-100'}`}>
                    Filter: {drillDownData.filter}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const drillData = drillDownData.data;
                    exportData(drillData, 'csv');
                    addNotification('Data exported', 'success');
                  }}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-orange-700 hover:bg-orange-800'
                  } text-white transition-colors`}
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setShowDrillDownModal(false)}
                  className={`p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-orange-700'
                  } transition-colors`}
                >
                  <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
                </button>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-gray-500">Total Projects</span>
                <p className="text-lg font-bold">{drillDownData.data.length}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Total Budget</span>
                <p className="text-lg font-bold">
                  {formatAmount(drillDownData.data.reduce((sum, p) => sum + (p.sanctioned_amount || 0), 0))}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Avg Progress</span>
                <p className="text-lg font-bold">
                  {drillDownData.data.length ? 
                    (drillDownData.data.reduce((sum, p) => sum + p.physical_progress, 0) / drillDownData.data.length).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Critical</span>
                <p className="text-lg font-bold text-red-600">
                  {drillDownData.data.filter(p => p.risk_level === 'CRITICAL').length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <DataTable
              data={drillDownData.data}
              darkMode={darkMode}
              onRowClick={handleProjectSelect}
              compareMode={false}
              selectedProjects={[]}
            />
          </div>
        </div>
      </div>
    );
  };

  const QuickActionsPanel = () => (
    <div className={`fixed bottom-4 right-4 z-40 ${
      showQuickActions ? 'block' : 'hidden'
    }`}>
      <div className={`${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-xl shadow-2xl p-4 border ${
        darkMode ? 'border-gray-700' : 'border-orange-200'
      }`}>
        <h3 className="text-sm font-bold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleDrillDown('critical')}
            className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            View Critical Projects
          </button>
          <button
            onClick={() => handleDrillDown('delayed')}
            className="w-full px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            View Delayed Projects
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Switch to Table View
          </button>
          <button
            onClick={handleExport}
            className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );

  // Loading State
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-amber-50'
      }`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className={`w-full h-full border-4 ${
              darkMode ? 'border-gray-700 border-t-orange-500' : 'border-orange-200 border-t-orange-500'
            } rounded-full animate-spin`}></div>
          </div>
          <p className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-orange-800'}`}>
            Loading Engineering Analytics...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-red-50 to-orange-50'
      }`}>
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className={`text-lg font-bold ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
          {error}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50'
    }`}>
      <div className={`p-4 lg:p-6 ${layoutMode === 'compact' ? 'max-w-[1400px]' : 'max-w-[1800px]'} mx-auto`}>
        <div className="space-y-6">
          {/* Header */}
          <div className={`${
            darkMode ? 'bg-gray-800/90' : 'bg-white/90'
          } backdrop-blur rounded-2xl shadow-xl p-6 border ${
            darkMode ? 'border-gray-700' : 'border-orange-200'
          }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl shadow-lg bg-gradient-to-r from-orange-500 to-orange-600">
                  <Building size={32} className="text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Engineering Analytics Hub
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 flex items-center gap-3`}>
                    <span className="flex items-center gap-1">
                      <Activity size={14} className="text-green-500" />
                      {metrics.totalProjects} Projects
                    </span>
                    <span>•</span>
                    <span>{formatAmount(metrics.totalSanctionedCr * 100)}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleString()}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* View Mode Toggle */}
                <div className="flex rounded-lg overflow-hidden shadow-md">
                  {['dashboard', 'table', 'kanban'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-2 capitalize ${
                        viewMode === mode
                          ? 'bg-orange-500 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      } hover:opacity-90 transition-all`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Compare Mode */}
                <button
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setSelectedProjects([]);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    compareMode 
                      ? 'bg-blue-500 text-white' 
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <GitBranch size={18} />
                  {compareMode ? 'Exit Compare' : 'Compare'}
                </button>

                {/* Action Buttons */}
                <button
                  onClick={() => {
                    filters.resetFilters();
                    setSelectedProjects([]);
                  }}
                  className={`px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <RefreshCw size={18} />
                  Reset
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600"
                >
                  <Download size={18} />
                  Export
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <FilterPanel filters={filters} darkMode={darkMode} rawData={rawData} />

          {/* Metrics Cards - PASS filteredData PROP HERE */}
          <MetricsCards 
            metrics={metrics} 
            darkMode={darkMode}
            filteredData={filteredData}  // THIS IS THE KEY ADDITION
            onMetricClick={(type) => {
              handleDrillDown(type);
              addNotification(`Filtered by ${type}`, 'info');
            }}
          />

          {/* Main Content Based on View Mode */}
          {viewMode === 'dashboard' && (
            <ChartTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filteredData={filteredData}
              rawData={rawData}
              darkMode={darkMode}
              compareMode={compareMode}
              selectedProjects={selectedProjects}
              onProjectSelect={handleProjectSelect}
              onDrillDown={handleDrillDown}
              filters={filters}
              setModalProject={setSelectedProject}
              setModalOpen={setModalOpen}
              onExportReport={handleExportReport}
              onPrintReport={handlePrintReport}
            />
          )}

          {viewMode === 'table' && (
            <div className="flex items-center justify-center">
              <div className="w-[90vw]">
                <DataTable
                  data={filteredData}
                  darkMode={darkMode}
                  onRowClick={handleProjectSelect}
                  compareMode={compareMode}
                  selectedProjects={selectedProjects}
                />
              </div>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['NOT_STARTED', 'IN_PROGRESS', 'ADVANCED', 'COMPLETED'].map(status => (
                <div key={status} className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-lg shadow-lg p-4`}>
                  <h3 className="font-bold mb-3 text-sm uppercase tracking-wider flex items-center justify-between">
                    {status.replace('_', ' ')}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      {filteredData.filter(p => {
                        if (status === 'NOT_STARTED') return p.physical_progress === 0;
                        if (status === 'IN_PROGRESS') return p.physical_progress > 0 && p.physical_progress <= 50;
                        if (status === 'ADVANCED') return p.physical_progress > 50 && p.physical_progress < 100;
                        if (status === 'COMPLETED') return p.physical_progress >= 100;
                        return false;
                      }).length}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredData
                      .filter(p => {
                        if (status === 'NOT_STARTED') return p.physical_progress === 0;
                        if (status === 'IN_PROGRESS') return p.physical_progress > 0 && p.physical_progress <= 50;
                        if (status === 'ADVANCED') return p.physical_progress > 50 && p.physical_progress < 100;
                        if (status === 'COMPLETED') return p.physical_progress >= 100;
                        return false;
                      })
                      .slice(0, 20)
                      .map(project => (
                        <div
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          } ${selectedProjects.find(p => p.id === project.id) ? 'ring-2 ring-orange-500' : ''}`}
                        >
                          <p className="text-sm font-semibold mb-1 truncate">
                            {project.scheme_name}
                          </p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatAmount(project.sanctioned_amount)}</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {project.risk_level}
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="h-1 rounded-full bg-orange-500"
                              style={{ width: `${project.physical_progress}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate">{project.executive_agency}</span>
                            {project.delay_days > 0 && (
                              <span className="text-red-500 flex items-center gap-1">
                                <Clock size={10} />
                                {project.delay_days}d
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Detail Modal - Centered with 70vw width */}
          {selectedProject && modalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedProject(null);
                }}
              />
              <div className="relative w-[70vw] max-h-[90vh] overflow-auto">
                <Modal
                  isOpen={modalOpen}
                  onClose={() => {
                    setModalOpen(false);
                    setSelectedProject(null);
                  }}
                  project={selectedProject}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}

          {/* Drill-down Modal */}
          <DrillDownModal />

          {/* Quick Actions Panel */}
          <QuickActionsPanel />

          {/* Comparison Panel */}
          {compareMode && selectedProjects.length > 0 && (
            <div className={`fixed bottom-4 left-4 right-4 z-30 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-2xl p-4 border ${
              darkMode ? 'border-gray-700' : 'border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Comparing {selectedProjects.length} Projects</h3>
                <button
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedProjects([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {selectedProjects.map(project => (
                  <div key={project.id} className={`min-w-[200px] p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className="text-sm font-semibold truncate">{project.scheme_name}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span className="font-medium">{project.physical_progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Budget:</span>
                        <span className="font-medium">{formatAmount(project.sanctioned_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk:</span>
                        <span className={`font-medium ${
                          project.risk_level === 'CRITICAL' ? 'text-red-600' :
                          project.risk_level === 'HIGH' ? 'text-orange-600' :
                          project.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {project.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('comparison')}
                className="mt-3 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                View Detailed Comparison
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Engineering;