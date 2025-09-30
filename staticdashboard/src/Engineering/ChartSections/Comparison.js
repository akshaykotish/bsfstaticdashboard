import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  ComposedChart, ScatterChart, Scatter, PolarGrid,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PolarAngleAxis, PolarRadiusAxis,
  Cell, PieChart, Pie, Area, AreaChart, Treemap
} from 'recharts';
import {
  GitBranch, BarChart3, Target, TrendingUp, Filter,
  Users, Building2, IndianRupee, Clock, MapPin,
  Award, AlertTriangle, Activity, Layers, Gauge,
  Package, Calendar, Percent, X, ChevronDown,
  Plus, Minus, Eye, Download, Settings, Info,
  CheckCircle, XCircle, Zap, Shield, Database
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  primary: ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#eab308', '#ef4444'],
  secondary: ['#fb923c', '#60a5fa', '#34d399', '#c084fc', '#f472b6', '#22d3ee', '#facc15', '#f87171'],
  gradient: [
    { start: '#f97316', end: '#fb923c' },
    { start: '#3b82f6', end: '#60a5fa' },
    { start: '#10b981', end: '#34d399' },
    { start: '#a855f7', end: '#c084fc' },
    { start: '#ec4899', end: '#f472b6' },
    { start: '#06b6d4', end: '#22d3ee' }
  ]
};

const Comparison = ({ 
  data, 
  darkMode, 
  onChartClick, 
  formatAmount = (val) => `₹${val}L`,
  onRefreshData = () => {},
  databaseName = 'engineering'
}) => {
  // State for dynamic comparison
  const [comparisonType, setComparisonType] = useState('frontier');
  const [selectedItems, setSelectedItems] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [metrics, setMetrics] = useState(['progress', 'efficiency', 'budget']);
  const [showDetails, setShowDetails] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [aggregationType, setAggregationType] = useState('average');
  
  // State for DataTable modal
  const [showDataTableModal, setShowDataTableModal] = useState(false);
  const [selectedDataForTable, setSelectedDataForTable] = useState([]);
  const [modalTitle, setModalTitle] = useState('');

  // Extract unique values for comparison - updated to match actual data fields
  const uniqueValues = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    return {
      frontiers: [...new Set([
        ...data.map(d => d.ftr_hq_name).filter(Boolean),
        ...data.map(d => d.shq_name).filter(Boolean)
      ])].sort(),
      budgetHeads: [...new Set(data.map(d => d.budget_head).filter(Boolean))].sort(),
      agencies: [...new Set(data.map(d => d.executive_agency).filter(Boolean))].sort(),
      contractors: [...new Set(data.map(d => d.firm_name).filter(Boolean))].sort(),
      locations: [...new Set(data.map(d => d.location).filter(Boolean))].sort(),
      riskLevels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      statuses: ['COMPLETED', 'ON_TRACK', 'DELAYED', 'AT_RISK', 'NOT_STARTED']
    };
  }, [data]);

  // Get items for current comparison type
  const availableItems = useMemo(() => {
    switch(comparisonType) {
      case 'frontier': return uniqueValues.frontiers || [];
      case 'budgetHead': return uniqueValues.budgetHeads || [];
      case 'agency': return uniqueValues.agencies || [];
      case 'contractor': return uniqueValues.contractors || [];
      case 'location': return uniqueValues.locations || [];
      case 'riskLevel': return uniqueValues.riskLevels || [];
      case 'status': return uniqueValues.statuses || [];
      case 'project': return data?.slice(0, 50).map(d => ({ 
        id: d.s_no || d.serial_no || d.id, 
        name: (d.sub_scheme_name || d.name_of_scheme || 'Unknown').substring(0, 30)
      })) || [];
      default: return [];
    }
  }, [comparisonType, uniqueValues, data]);

  // Auto-select top items when comparison type changes
  useEffect(() => {
    if (comparisonType === 'project') {
      setSelectedItems(availableItems.slice(0, 5).map(item => item.id));
    } else {
      setSelectedItems(availableItems.slice(0, Math.min(5, availableItems.length)));
    }
  }, [comparisonType, availableItems]);

  // Helper function to determine project status based on data
  const getProjectStatus = useCallback((project) => {
    const progress = project.physical_progress_percent || 0;
    const delay = project.delay_days || 0;
    
    if (progress >= 100) return 'COMPLETED';
    if (delay > 30 || progress < 25) return 'AT_RISK';
    if (delay > 0) return 'DELAYED';
    if (progress > 0) return 'ON_TRACK';
    return 'NOT_STARTED';
  }, []);

  // Helper function to determine risk level
  const getProjectRiskLevel = useCallback((project) => {
    const efficiency = project.efficiency_score || 0;
    const delay = project.delay_days || 0;
    const utilizationRate = project.expenditure_percent || 0;
    
    if (delay > 90 || efficiency < 30 || utilizationRate > 120) return 'CRITICAL';
    if (delay > 30 || efficiency < 50 || utilizationRate > 100) return 'HIGH';
    if (delay > 0 || efficiency < 70) return 'MEDIUM';
    return 'LOW';
  }, []);

  // Process comparison data - updated field mappings
  const comparisonData = useMemo(() => {
    if (!data || selectedItems.length === 0) return [];

    return selectedItems.map(item => {
      let filteredProjects = [];
      
      // Filter projects based on comparison type
      switch(comparisonType) {
        case 'frontier':
          filteredProjects = data.filter(d => d.ftr_hq_name === item || d.shq_name === item);
          break;
        case 'budgetHead':
          filteredProjects = data.filter(d => d.budget_head === item);
          break;
        case 'agency':
          filteredProjects = data.filter(d => d.executive_agency === item);
          break;
        case 'contractor':
          filteredProjects = data.filter(d => d.firm_name === item);
          break;
        case 'location':
          filteredProjects = data.filter(d => d.location === item);
          break;
        case 'riskLevel':
          filteredProjects = data.filter(d => getProjectRiskLevel(d) === item);
          break;
        case 'status':
          filteredProjects = data.filter(d => getProjectStatus(d) === item);
          break;
        case 'project':
          filteredProjects = data.filter(d => 
            d.s_no === item || d.serial_no === item || d.id === item
          );
          break;
        default:
          filteredProjects = [];
      }

      // Apply time range filter
      if (timeRange !== 'all' && filteredProjects.length > 0) {
        const now = new Date();
        const filterDate = new Date();
        
        switch(timeRange) {
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            filterDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        filteredProjects = filteredProjects.filter(p => {
          if (p.award_date) {
            return new Date(p.award_date) >= filterDate;
          }
          return true;
        });
      }

      // Calculate metrics with updated field names
      const calculateMetric = (projects, metric, type = 'average') => {
        if (projects.length === 0) return 0;
        
        switch(metric) {
          case 'count':
            return projects.length;
          case 'budget':
            return projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0);
          case 'spent':
            return projects.reduce((sum, p) => sum + (p.expenditure_total || 0), 0);
          case 'progress':
            const totalProgress = projects.reduce((sum, p) => sum + (p.physical_progress_percent || 0), 0);
            return type === 'sum' ? totalProgress : totalProgress / projects.length;
          case 'efficiency':
            const totalEfficiency = projects.reduce((sum, p) => sum + (p.efficiency_score || 0), 0);
            return type === 'sum' ? totalEfficiency : totalEfficiency / projects.length;
          case 'health':
            const totalHealth = projects.reduce((sum, p) => sum + (p.health_score || 0), 0);
            return type === 'sum' ? totalHealth : totalHealth / projects.length;
          case 'delay':
            const totalDelay = projects.reduce((sum, p) => sum + Math.abs(p.delay_days || 0), 0);
            return type === 'sum' ? totalDelay : totalDelay / projects.length;
          case 'utilization':
            const totalBudget = projects.reduce((sum, p) => sum + (p.sd_amount_lakh || 0), 0);
            const totalSpent = projects.reduce((sum, p) => sum + (p.expenditure_total || 0), 0);
            return totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
          case 'completed':
            return projects.filter(p => p.physical_progress_percent >= 100).length;
          case 'critical':
            return projects.filter(p => getProjectRiskLevel(p) === 'CRITICAL').length;
          case 'onTrack':
            return projects.filter(p => 
              (p.delay_days === 0 || p.delay_days === undefined) && 
              p.physical_progress_percent > 0
            ).length;
          default:
            return 0;
        }
      };

      const itemName = comparisonType === 'project' 
        ? availableItems.find(i => i.id === item)?.name || item
        : item;

      return {
        name: itemName,
        projects: filteredProjects.length,
        budget: calculateMetric(filteredProjects, 'budget'),
        spent: calculateMetric(filteredProjects, 'spent'),
        progress: calculateMetric(filteredProjects, 'progress', aggregationType),
        efficiency: calculateMetric(filteredProjects, 'efficiency', aggregationType),
        health: calculateMetric(filteredProjects, 'health', aggregationType),
        delay: calculateMetric(filteredProjects, 'delay', aggregationType),
        utilization: calculateMetric(filteredProjects, 'utilization'),
        completed: calculateMetric(filteredProjects, 'completed'),
        critical: calculateMetric(filteredProjects, 'critical'),
        onTrack: calculateMetric(filteredProjects, 'onTrack'),
        completionRate: filteredProjects.length > 0 
          ? (calculateMetric(filteredProjects, 'completed') / filteredProjects.length * 100)
          : 0,
        criticalRate: filteredProjects.length > 0
          ? (calculateMetric(filteredProjects, 'critical') / filteredProjects.length * 100)
          : 0,
        delayRate: filteredProjects.length > 0
          ? (filteredProjects.filter(p => p.delay_days > 0).length / filteredProjects.length * 100)
          : 0,
        rawProjects: filteredProjects // Store for drill-down
      };
    });
  }, [data, selectedItems, comparisonType, availableItems, timeRange, aggregationType, getProjectStatus, getProjectRiskLevel]);

  // Handle opening DataTable modal
  const handleOpenDataTable = useCallback((projects, title) => {
    setSelectedDataForTable(projects);
    setModalTitle(title);
    setShowDataTableModal(true);
  }, []);

  // Toggle item selection
  const toggleItem = useCallback((item) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      }
      if (prev.length < 8) {
        return [...prev, item];
      }
      return prev;
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    if (comparisonType === 'project') {
      setSelectedItems(availableItems.slice(0, 8).map(i => i.id));
    } else {
      setSelectedItems(availableItems.slice(0, 8));
    }
  }, [availableItems, comparisonType]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border ${
          darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
        }`}>
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold">
                {entry.name.includes('Rate') || entry.name.includes('utilization') 
                  ? `${entry.value?.toFixed(1)}%`
                  : entry.name.includes('budget') || entry.name.includes('spent') || entry.name.includes('Budget')
                  ? formatAmount(entry.value)
                  : entry.value?.toFixed?.(1) || entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render different chart types
  const renderChart = () => {
    const chartData = comparisonData;
    const height = 350;

    switch(chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {metrics.includes('progress') && (
                <Bar dataKey="progress" fill={COLORS.primary[0]} name="Avg Progress %" />
              )}
              {metrics.includes('efficiency') && (
                <Bar dataKey="efficiency" fill={COLORS.primary[1]} name="Avg Efficiency %" />
              )}
              {metrics.includes('health') && (
                <Bar dataKey="health" fill={COLORS.primary[2]} name="Health Score" />
              )}
              {metrics.includes('utilization') && (
                <Bar dataKey="utilization" fill={COLORS.primary[3]} name="Budget Utilization %" />
              )}
              {metrics.includes('delay') && (
                <Bar dataKey="delay" fill={COLORS.primary[4]} name="Avg Delay (days)" />
              )}
              {metrics.includes('projects') && (
                <Bar dataKey="projects" fill={COLORS.primary[5]} name="Project Count" />
              )}
              {metrics.includes('budget') && (
                <Bar dataKey="budget" fill={COLORS.primary[6]} name="Total Budget (L)" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {metrics.includes('progress') && (
                <Line type="monotone" dataKey="progress" stroke={COLORS.primary[0]} name="Avg Progress %" strokeWidth={2} />
              )}
              {metrics.includes('efficiency') && (
                <Line type="monotone" dataKey="efficiency" stroke={COLORS.primary[1]} name="Avg Efficiency %" strokeWidth={2} />
              )}
              {metrics.includes('health') && (
                <Line type="monotone" dataKey="health" stroke={COLORS.primary[2]} name="Health Score" strokeWidth={2} />
              )}
              {metrics.includes('completionRate') && (
                <Line type="monotone" dataKey="completionRate" stroke={COLORS.primary[3]} name="Completion Rate %" strokeWidth={2} />
              )}
              {metrics.includes('delayRate') && (
                <Line type="monotone" dataKey="delayRate" stroke={COLORS.primary[4]} name="Delay Rate %" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'radar':
        const radarData = metrics.map(metric => ({
          metric: metric.charAt(0).toUpperCase() + metric.slice(1),
          ...Object.fromEntries(
            comparisonData.map(item => [
              item.name,
              item[metric] || 0
            ])
          )
        }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {comparisonData.map((item, index) => (
                <Radar
                  key={item.name}
                  name={item.name}
                  dataKey={item.name}
                  stroke={COLORS.primary[index % COLORS.primary.length]}
                  fill={COLORS.primary[index % COLORS.primary.length]}
                  fillOpacity={0.3}
                />
              ))}
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="projects" fill={COLORS.primary[0]} name="Projects" />
              <Bar yAxisId="left" dataKey="budget" fill={COLORS.primary[1]} name="Budget (L)" />
              <Line yAxisId="right" type="monotone" dataKey="progress" stroke={COLORS.primary[2]} name="Avg Progress %" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke={COLORS.primary[3]} name="Avg Efficiency %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        const scatterData = comparisonData.map(item => ({
          name: item.name,
          x: item.progress,
          y: item.efficiency,
          z: item.projects
        }));

        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Progress" 
                unit="%" 
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Efficiency" 
                unit="%" 
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Comparison" data={scatterData} fill={COLORS.primary[0]}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Export comparison data
  const exportData = () => {
    const csvContent = [
      ['Name', 'Projects', 'Budget(L)', 'Spent(L)', 'Progress%', 'Efficiency%', 'Utilization%', 'Delay(days)', 'CompletionRate%'],
      ...comparisonData.map(row =>
        [row.name, row.projects, row.budget.toFixed(2), row.spent.toFixed(2), 
         row.progress.toFixed(1), row.efficiency.toFixed(1), row.utilization.toFixed(1),
         row.delay.toFixed(0), row.completionRate.toFixed(1)].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${comparisonType}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // DataTable Modal Component
  const DataTableModal = () => {
    if (!showDataTableModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDataTableModal(false)}
        />
        
        <div className={`relative w-[90vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                {modalTitle}
              </h2>
              <button
                onClick={() => setShowDataTableModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-orange-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedDataForTable}
              darkMode={darkMode}
              onRowClick={(project) => {
                if (onChartClick) {
                  onChartClick(project, 'project');
                }
              }}
              compareMode={false}
              selectedProjects={[]}
              isEmbedded={true}
              maxHeight="100%"
              onRefreshData={onRefreshData}
              databaseName={databaseName}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GitBranch size={20} className="text-orange-500" />
          Dynamic Comparison Controls
        </h3>

        {/* Comparison Type Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
              Compare By
            </label>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <option value="frontier">Frontiers (FHQ/SHQ)</option>
              <option value="budgetHead">Budget Heads</option>
              <option value="agency">Executive Agencies</option>
              <option value="contractor">Contractors</option>
              <option value="location">Locations</option>
              <option value="riskLevel">Risk Levels</option>
              <option value="status">Project Status</option>
              <option value="project">Individual Projects</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="radar">Radar Chart</option>
              <option value="composed">Composed Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
              Aggregation
            </label>
            <select
              value={aggregationType}
              onChange={(e) => setAggregationType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <option value="average">Average</option>
              <option value="sum">Sum</option>
            </select>
          </div>
        </div>

        {/* Item Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Select Items to Compare ({selectedItems.length}/8 selected)
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Select Top 8
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {availableItems.map(item => {
              const itemValue = comparisonType === 'project' ? item.id : item;
              const itemLabel = comparisonType === 'project' ? item.name : item;
              const isSelected = selectedItems.includes(itemValue);
              
              return (
                <button
                  key={itemValue}
                  onClick={() => toggleItem(itemValue)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{itemLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metrics Selection */}
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
            Metrics to Display
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'projects', label: 'Count', icon: Package },
              { id: 'budget', label: 'Budget', icon: IndianRupee },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'efficiency', label: 'Efficiency', icon: Target },
              { id: 'health', label: 'Health', icon: Activity },
              { id: 'delay', label: 'Delay', icon: Clock },
              { id: 'utilization', label: 'Utilization', icon: Percent },
              { id: 'completionRate', label: 'Completion %', icon: CheckCircle }
            ].map(metric => (
              <button
                key={metric.id}
                onClick={() => {
                  setMetrics(prev =>
                    prev.includes(metric.id)
                      ? prev.filter(m => m !== metric.id)
                      : [...prev, metric.id]
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  metrics.includes(metric.id)
                    ? 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <metric.icon size={12} />
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      {selectedItems.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">
              {comparisonType.charAt(0).toUpperCase() + comparisonType.slice(1)} Comparison
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs flex items-center gap-1"
              >
                <Eye size={14} />
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
              <button
                onClick={exportData}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs flex items-center gap-1"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
          
          {renderChart()}
        </div>
      )}

      {/* Detailed Comparison Table */}
      {selectedItems.length > 0 && showDetails && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-base font-semibold mb-4">Detailed Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-center py-2 px-3">Projects</th>
                  <th className="text-center py-2 px-3">Budget</th>
                  <th className="text-center py-2 px-3">Spent</th>
                  <th className="text-center py-2 px-3">Progress %</th>
                  <th className="text-center py-2 px-3">Efficiency %</th>
                  <th className="text-center py-2 px-3">Health</th>
                  <th className="text-center py-2 px-3">Delay (days)</th>
                  <th className="text-center py-2 px-3">Utilization %</th>
                  <th className="text-center py-2 px-3">Completion %</th>
                  <th className="text-center py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className={`border-b ${
                    darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                  } transition-colors`}>
                    <td className="py-2 px-3 font-medium">{item.name}</td>
                    <td className="text-center py-2 px-3">{item.projects}</td>
                    <td className="text-center py-2 px-3">{formatAmount(item.budget)}</td>
                    <td className="text-center py-2 px-3">{formatAmount(item.spent)}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`font-medium ${
                        item.progress >= 75 ? 'text-green-600' :
                        item.progress >= 50 ? 'text-blue-600' :
                        item.progress >= 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.progress.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-2 px-3">{item.efficiency.toFixed(1)}%</td>
                    <td className="text-center py-2 px-3">{item.health.toFixed(0)}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`font-medium ${
                        item.delay <= 0 ? 'text-green-600' :
                        item.delay <= 30 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.delay.toFixed(0)}
                      </span>
                    </td>
                    <td className="text-center py-2 px-3">{item.utilization.toFixed(1)}%</td>
                    <td className="text-center py-2 px-3">{item.completionRate.toFixed(1)}%</td>
                    <td className="text-center py-2 px-3">
                      {item.rawProjects && item.rawProjects.length > 0 && (
                        <button
                          onClick={() => handleOpenDataTable(item.rawProjects, `${item.name} - Projects (${item.projects})`)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Projects',
              value: comparisonData.reduce((sum, item) => sum + item.projects, 0),
              icon: Package,
              color: 'blue'
            },
            {
              label: 'Total Budget',
              value: formatAmount(comparisonData.reduce((sum, item) => sum + item.budget, 0)),
              icon: IndianRupee,
              color: 'green'
            },
            {
              label: 'Avg Progress',
              value: `${(comparisonData.reduce((sum, item) => sum + item.progress, 0) / comparisonData.length).toFixed(1)}%`,
              icon: TrendingUp,
              color: 'orange'
            },
            {
              label: 'Avg Efficiency',
              value: `${(comparisonData.reduce((sum, item) => sum + item.efficiency, 0) / comparisonData.length).toFixed(1)}%`,
              icon: Target,
              color: 'purple'
            }
          ].map((stat, index) => (
            <div key={index} className={`${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-sm p-4 border ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{stat.label}</span>
                <stat.icon size={16} className={`text-${stat.color}-500`} />
              </div>
              <div className="text-xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* DataTable Modal */}
      <DataTableModal />
    </div>
  );
};

export default Comparison;