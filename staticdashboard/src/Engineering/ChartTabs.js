import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Shield,
  Calendar, Building2, Map, Layers, Award, GitBranch,
  Package, Activity, PieChart as PieChartIcon, Target,
  X, Eye, ChevronRight, Clock, AlertTriangle, IndianRupee,
  Zap, Filter, Download, Maximize2, Settings, Info,
  AlertCircle, CheckCircle, TrendingDown, Gauge,
  FileText, Share2, Printer, RefreshCw, ArrowUpRight,
  ArrowDownRight, Minimize2, Database, ChevronLeft
} from 'lucide-react';

// Import individual tab components
import OverviewTab from './ChartSections/Overview';
import BudgetAnalysisTab from './ChartSections/BudgetAnalysis';
import ProgressTrackingTab from './ChartSections/ProgressTracking';
import AgencyPerformanceTab from './ChartSections/AgencyPerformance';
import RiskDashboardTab from './ChartSections/RiskDashboard';
import TimelineDelaysTab from './ChartSections/TimelineDelays';
import ContractorAnalyticsTab from './ChartSections/ContractorAnalytics';
import EfficiencyMetricsTab from './ChartSections/EfficiencyMetrics';
import ComparisonTab from './ChartSections/Comparison';
import PredictiveInsightsTab from './ChartSections/PredictiveInsights';

// Helper function to format currency amounts
const formatAmount = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 10000) {
    return `₹${(value / 100).toFixed(2)} Cr`;
  } else if (absValue >= 100) {
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 1) {
    return `₹${value.toFixed(2)} L`;
  } else if (absValue >= 0.01) {
    return `₹${(value * 100).toFixed(2)} K`;
  } else {
    return `₹${(value * 100).toFixed(2)} K`;
  }
};

const ChartTabs = ({ 
  activeTab, 
  setActiveTab, 
  filteredData = [], 
  rawData = [], 
  darkMode = false, 
  compareMode = false, 
  selectedProjects = [], 
  onProjectSelect,
  onDrillDown,
  filters,
  setModalProject,
  setModalOpen,
  onExportReport,
  onPrintReport
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [chartFilter, setChartFilter] = useState('all');
  const [expandedChart, setExpandedChart] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);
  const [selectedChartView, setSelectedChartView] = useState('default');
  const [chartHistory, setChartHistory] = useState([]);
  const chartRef = useRef(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, component: OverviewTab },
    { id: 'budget', label: 'Budget Analysis', icon: DollarSign, component: BudgetAnalysisTab },
    { id: 'progress', label: 'Progress Tracking', icon: TrendingUp, component: ProgressTrackingTab },
    { id: 'agency', label: 'Agency Performance', icon: Users, component: AgencyPerformanceTab },
    { id: 'risk', label: 'Risk Dashboard', icon: Shield, component: RiskDashboardTab },
    { id: 'timeline', label: 'Timeline & Delays', icon: Calendar, component: TimelineDelaysTab },
    { id: 'contractor', label: 'Contractor Analytics', icon: Building2, component: ContractorAnalyticsTab },
    { id: 'efficiency', label: 'Efficiency Metrics', icon: Target, component: EfficiencyMetricsTab },
    { id: 'comparison', label: 'Comparison', icon: GitBranch, component: ComparisonTab },
    { id: 'predictive', label: 'Predictive Insights', icon: Activity, component: PredictiveInsightsTab }
  ];

  // Handle chart element clicks
  const handleChartClick = useCallback((data, type) => {
    setChartHistory(prev => [...prev, { data, type, timestamp: new Date() }]);

    if (type === 'project' && data) {
      if (setModalProject && setModalOpen) {
        setModalProject(data);
        setModalOpen(true);
      }
    } else if (type === 'filter' && data && filters) {
      switch(data.filterType) {
        case 'agency':
          filters.setSelectedAgency(data.value);
          break;
        case 'risk':
          filters.setSelectedRiskLevel(data.value);
          break;
        case 'status':
          filters.setSelectedStatus(data.value);
          break;
        case 'budget':
          filters.setSelectedBudgetHead(data.value);
          break;
        case 'contractor':
          filters.setSelectedContractor(data.value);
          break;
        case 'progress':
          if (data.range) {
            filters.setProgressRange(data.range);
          }
          break;
        case 'delay':
          if (data.range) {
            filters.setDelayRange(data.range);
          }
          break;
        default:
          break;
      }
    } else if (type === 'drill' && onDrillDown) {
      onDrillDown(data.type, data.filter);
    }
  }, [filters, setModalProject, setModalOpen, onDrillDown]);

  // Export functions
  const exportChartAsImage = useCallback(() => {
    if (chartRef.current) {
      console.log('Exporting chart as image...');
    }
  }, []);

  const exportChartData = useCallback(() => {
    const currentTabComponent = tabs.find(t => t.id === activeTab);
    if (currentTabComponent && onExportReport) {
      onExportReport(filteredData, activeTab);
    } else {
      const jsonData = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-data-${activeTab}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [activeTab, onExportReport, filteredData, tabs]);

  const printChart = useCallback(() => {
    if (onPrintReport) {
      onPrintReport(filteredData, activeTab);
    } else {
      window.print();
    }
  }, [activeTab, onPrintReport, filteredData]);

  // Get current tab component
  const getCurrentTabComponent = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (!currentTab || !currentTab.component) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Select a tab to view charts</p>
        </div>
      );
    }

    const TabComponent = currentTab.component;
    
    return (
      <TabComponent
        data={filteredData}
        darkMode={darkMode}
        onChartClick={handleChartClick}
        compareMode={compareMode}
        selectedProjects={selectedProjects}
        formatAmount={formatAmount}
        expandedView={expandedChart === activeTab}
      />
    );
  };

  // Calculate basic metrics for display
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalProjects: 0,
        totalBudget: 0,
        avgProgress: 0,
        criticalCount: 0
      };
    }

    return {
      totalProjects: filteredData.length,
      totalBudget: filteredData.reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0) / 100,
      avgProgress: (filteredData.reduce((sum, d) => sum + (d.physical_progress || 0), 0) / filteredData.length).toFixed(1),
      criticalCount: filteredData.filter(d => d.risk_level === 'CRITICAL').length
    };
  }, [filteredData]);

  return (
    <div className="space-y-4" ref={chartRef}>
      {/* Tab Navigation */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-2`}>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap text-sm ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-orange-100'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Controls */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-md`}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            Showing: <strong>{filteredData?.length || 0}</strong> projects
          </span>
          {filteredData && filteredData.length > 0 && (
            <span className="text-xs text-gray-500">
              | Budget: {formatAmount(metrics.totalBudget * 100)} | Avg Progress: {metrics.avgProgress}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Selector */}
          <select
            value={selectedChartView}
            onChange={(e) => setSelectedChartView(e.target.value)}
            className={`px-2 py-1 rounded-lg text-xs ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value="default">Default View</option>
            <option value="compact">Compact View</option>
            <option value="detailed">Detailed View</option>
          </select>

          {/* Export Menu */}
          <div className="relative group">
            <button
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Download size={14} />
              Export
            </button>
            <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-xl z-50 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} 
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all`}>
              <button
                onClick={exportChartData}
                className={`w-full px-3 py-2 text-left text-xs hover:${
                  darkMode ? 'bg-gray-700' : 'bg-orange-50'
                } flex items-center gap-2`}
              >
                <FileText size={12} /> Export Data (JSON)
              </button>
              <button
                onClick={exportChartAsImage}
                className={`w-full px-3 py-2 text-left text-xs hover:${
                  darkMode ? 'bg-gray-700' : 'bg-orange-50'
                } flex items-center gap-2`}
              >
                <Download size={12} /> Export Chart (PNG)
              </button>
              <button
                onClick={printChart}
                className={`w-full px-3 py-2 text-left text-xs hover:${
                  darkMode ? 'bg-gray-700' : 'bg-orange-50'
                } flex items-center gap-2`}
              >
                <Printer size={12} /> Print Report
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setChartHistory([]);
              setHoveredData(null);
            }}
            className={`p-1.5 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
            title="Refresh Charts"
          >
            <RefreshCw size={16} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setExpandedChart(expandedChart ? null : activeTab)}
            className={`p-1.5 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
            title={expandedChart ? "Exit Fullscreen" : "Fullscreen"}
          >
            {expandedChart ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className={`w-full overflow-hidden ${
        expandedChart ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6' : ''
      }`}>
        {expandedChart && (
          <button
            onClick={() => setExpandedChart(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        )}
        {getCurrentTabComponent()}
      </div>

      {/* Information Panel */}
      <div className={`p-3 rounded-lg ${
        darkMode ? 'bg-gray-800/50' : 'bg-orange-50'
      } border ${darkMode ? 'border-gray-700' : 'border-orange-200'}`}>
        <div className="flex items-start gap-2">
          <Info size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold mb-1">Interactive Charts</p>
            <ul className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
              <li>• Click on chart elements to filter data or view project details</li>
              <li>• Use the export menu to save charts as images or data files</li>
              <li>• Charts automatically adjust to screen size with horizontal scrolling when needed</li>
              <li>• Hover over data points for detailed tooltips</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartTabs;