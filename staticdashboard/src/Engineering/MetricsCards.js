import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, IndianRupee, CheckCircle, AlertTriangle, Clock, Gauge,
  TrendingUp, TrendingDown, Activity, Users, Building2, MapPin,
  Target, Shield, Zap, BarChart3, PieChart, Package, Timer, Award,
  GitBranch, Layers, Database, CreditCard, FileText, Percent,
  Calendar, ThermometerSun, Cpu, Heart, AlertCircle, Info,
  ChevronRight, ChevronDown, ChevronUp, MoreVertical, Eye
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

const MetricsCards = ({ metrics, darkMode, onMetricClick, filteredData = [] }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedMetricGroup, setSelectedMetricGroup] = useState('all');
  const [showTrends, setShowTrends] = useState(true);
  const [cardSize, setCardSize] = useState('normal');
  const [animateValues, setAnimateValues] = useState(false);

  // Calculate organization metrics from actual data
  const organizationMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        activeAgencies: 0,
        totalContractors: 0,
        totalLocations: 0
      };
    }

    // Get unique agencies
    const uniqueAgencies = new Set(
      filteredData
        .map(item => item.executive_agency)
        .filter(agency => agency && agency !== 'N/A' && agency !== '')
    );

    // Get unique contractors
    const uniqueContractors = new Set(
      filteredData
        .map(item => item.firm_name)
        .filter(contractor => contractor && contractor !== 'N/A' && contractor !== '')
    );

    // Get unique locations
    const uniqueLocations = new Set(
      filteredData
        .map(item => {
          if (!item.work_site || item.work_site === 'N/A') return null;
          // Extract the main location (before comma if present)
          return item.work_site.split(',')[0].trim();
        })
        .filter(location => location && location !== '')
    );

    return {
      activeAgencies: uniqueAgencies.size,
      totalContractors: uniqueContractors.size,
      totalLocations: uniqueLocations.size
    };
  }, [filteredData]);

  // Animate values on mount
  useEffect(() => {
    setAnimateValues(true);
  }, []);

  // Generate mock trend data for mini charts
  const generateTrendData = (baseValue, variance = 10) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        day: i,
        value: baseValue + (Math.random() - 0.5) * variance
      });
    }
    return data;
  };

  // Safe number formatting
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Format currency safely
  const formatCurrency = (value) => {
    const num = safeNumber(value, 0);
    return `₹${num.toFixed(2)}Cr`;
  };

  // Enhanced metrics with actual data calculations
  const enhancedMetrics = useMemo(() => {
    return {
      ...metrics,
      activeAgencies: organizationMetrics.activeAgencies,
      totalContractors: organizationMetrics.totalContractors,
      totalLocations: organizationMetrics.totalLocations
    };
  }, [metrics, organizationMetrics]);

  // Main metrics with enhanced details
  const mainMetrics = useMemo(() => [
    {
      id: 'total',
      group: 'overview',
      title: 'Total Projects',
      value: enhancedMetrics?.totalProjects || 0,
      subtitle: `${enhancedMetrics?.ongoing || 0} Active`,
      icon: Briefcase,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      trend: enhancedMetrics?.projectGrowth || 12,
      trendDirection: 'up',
      details: {
        'Not Started': enhancedMetrics?.notStarted || 0,
        'Ongoing': enhancedMetrics?.ongoing || 0,
        'Completed': enhancedMetrics?.completed || 0
      },
      sparkline: generateTrendData(enhancedMetrics?.totalProjects || 0, 5),
      percentage: 100,
      alert: false,
      priority: 1
    },
    {
      id: 'budget',
      title: 'Total Budget',
      group: 'financial',
      value: formatCurrency(enhancedMetrics?.totalSanctionedCr),
      subtitle: `${safeNumber(enhancedMetrics?.utilizationRate, 0).toFixed(1)}% Used`,
      icon: IndianRupee,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      trend: enhancedMetrics?.budgetGrowth || 8,
      trendDirection: 'up',
      details: {
        'Sanctioned': formatCurrency(enhancedMetrics?.totalSanctionedCr),
        'Spent': formatCurrency(enhancedMetrics?.totalExpenditureCr),
        'Remaining': formatCurrency(enhancedMetrics?.remainingBudgetCr)
      },
      sparkline: generateTrendData(safeNumber(enhancedMetrics?.utilizationRate), 10),
      percentage: safeNumber(enhancedMetrics?.utilizationRate),
      alert: safeNumber(enhancedMetrics?.utilizationRate) < 50,
      priority: 2
    },
    {
      id: 'completed',
      title: 'Completed',
      group: 'progress',
      value: enhancedMetrics?.completed || 0,
      subtitle: `${safeNumber(enhancedMetrics?.completionRate, 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      trend: enhancedMetrics?.completionGrowth || 15,
      trendDirection: 'up',
      details: {
        'This Month': enhancedMetrics?.completedThisMonth || 0,
        'This Quarter': enhancedMetrics?.completedThisQuarter || 0,
        'This Year': enhancedMetrics?.completedThisYear || 0
      },
      sparkline: generateTrendData(enhancedMetrics?.completed || 0, 3),
      percentage: safeNumber(enhancedMetrics?.completionRate),
      alert: false,
      priority: 3
    },
    {
      id: 'critical',
      title: 'Critical',
      group: 'risk',
      value: enhancedMetrics?.critical || 0,
      subtitle: `${safeNumber(enhancedMetrics?.criticalRate, 0).toFixed(1)}%`,
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      trend: enhancedMetrics?.criticalGrowth || -5,
      trendDirection: (enhancedMetrics?.criticalGrowth || 0) > 0 ? 'up' : 'down',
      alert: true,
      pulse: (enhancedMetrics?.critical || 0) > 10,
      details: {
        'High Risk': enhancedMetrics?.highRisk || 0,
        'Medium Risk': enhancedMetrics?.mediumRisk || 0,
        'Low Risk': enhancedMetrics?.lowRisk || 0
      },
      sparkline: generateTrendData(enhancedMetrics?.critical || 0, 2),
      percentage: safeNumber(enhancedMetrics?.criticalRate),
      priority: 4
    },
    {
      id: 'delayed',
      title: 'Delayed',
      group: 'timeline',
      value: enhancedMetrics?.delayed || 0,
      subtitle: `${safeNumber(enhancedMetrics?.delayRate, 0).toFixed(1)}%`,
      icon: Clock,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      trend: enhancedMetrics?.delayGrowth || -3,
      trendDirection: (enhancedMetrics?.delayGrowth || 0) > 0 ? 'up' : 'down',
      details: {
        '< 30 days': enhancedMetrics?.delayedUnder30 || 0,
        '30-90 days': enhancedMetrics?.delayed30to90 || 0,
        '> 90 days': enhancedMetrics?.delayedOver90 || 0
      },
      sparkline: generateTrendData(enhancedMetrics?.delayed || 0, 4),
      percentage: safeNumber(enhancedMetrics?.delayRate),
      alert: safeNumber(enhancedMetrics?.delayRate) > 30,
      priority: 5
    },
    {
      id: 'health',
      title: 'Health Score',
      group: 'performance',
      value: safeNumber(enhancedMetrics?.avgHealthScore, 0).toFixed(1),
      subtitle: 'Overall',
      icon: Gauge,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      trend: enhancedMetrics?.healthGrowth || 2,
      trendDirection: 'up',
      details: {
        'Avg Progress': `${safeNumber(enhancedMetrics?.avgProgress, 0).toFixed(1)}%`,
        'Avg Efficiency': `${safeNumber(enhancedMetrics?.avgEfficiency, 0).toFixed(1)}%`,
        'On Track': enhancedMetrics?.onTrack || 0
      },
      sparkline: generateTrendData(safeNumber(enhancedMetrics?.avgHealthScore), 5),
      percentage: safeNumber(enhancedMetrics?.avgHealthScore),
      alert: safeNumber(enhancedMetrics?.avgHealthScore) < 60,
      priority: 6
    }
  ], [enhancedMetrics]);

  // Additional metrics with actual calculated values
  const additionalMetrics = useMemo(() => [
    // Performance Metrics
    {
      id: 'efficiency',
      title: 'Avg Efficiency',
      group: 'performance',
      value: `${safeNumber(enhancedMetrics?.avgEfficiency, 0).toFixed(1)}%`,
      icon: Target,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      trend: 5,
      sparkline: generateTrendData(safeNumber(enhancedMetrics?.avgEfficiency), 8)
    },
    {
      id: 'ontrack',
      title: 'On Track',
      group: 'performance',
      value: enhancedMetrics?.onTrack || 0,
      icon: Activity,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      trend: 8,
      sparkline: generateTrendData(enhancedMetrics?.onTrack || 0, 2)
    },
    {
      id: 'avgprogress',
      title: 'Avg Progress',
      group: 'performance',
      value: `${safeNumber(enhancedMetrics?.avgProgress, 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      trend: 3,
      sparkline: generateTrendData(safeNumber(enhancedMetrics?.avgProgress), 5)
    },
    
    // Organizational Metrics - Using actual calculated values
    {
      id: 'agencies',
      title: 'Active Agencies',
      group: 'organization',
      value: enhancedMetrics?.activeAgencies || 0,
      icon: Building2,
      color: 'slate',
      gradient: 'from-slate-500 to-slate-600',
      trend: 0,
      details: filteredData && filteredData.length > 0 ? {
        'Total': enhancedMetrics?.activeAgencies || 0,
        'With Active Projects': filteredData.filter(p => p.physical_progress > 0 && p.physical_progress < 100)
          .map(p => p.executive_agency)
          .filter((v, i, a) => a.indexOf(v) === i).length || 0
      } : null
    },
    {
      id: 'contractors',
      title: 'Contractors',
      group: 'organization',
      value: enhancedMetrics?.totalContractors || 0,
      icon: Users,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      trend: 2,
      details: filteredData && filteredData.length > 0 ? {
        'Total': enhancedMetrics?.totalContractors || 0,
        'Active': filteredData.filter(p => p.physical_progress > 0 && p.physical_progress < 100)
          .map(p => p.firm_name)
          .filter((v, i, a) => a.indexOf(v) === i).length || 0
      } : null
    },
    {
      id: 'locations',
      title: 'Locations',
      group: 'organization',
      value: enhancedMetrics?.totalLocations || 0,
      icon: MapPin,
      color: 'rose',
      gradient: 'from-rose-500 to-rose-600',
      trend: 1,
      details: filteredData && filteredData.length > 0 ? {
        'Total Sites': enhancedMetrics?.totalLocations || 0,
        'Active Sites': filteredData.filter(p => p.physical_progress > 0 && p.physical_progress < 100)
          .map(p => p.work_site?.split(',')[0]?.trim())
          .filter((v, i, a) => v && a.indexOf(v) === i).length || 0
      } : null
    },
    
    // Financial Metrics
    {
      id: 'utilization',
      title: 'Budget Utilization',
      group: 'financial',
      value: `${safeNumber(enhancedMetrics?.utilizationRate, 0).toFixed(1)}%`,
      icon: Percent,
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
      trend: 4,
      alert: safeNumber(enhancedMetrics?.utilizationRate) < 50
    },
    {
      id: 'expenditure',
      title: 'Total Spent',
      group: 'financial',
      value: formatCurrency(enhancedMetrics?.totalExpenditureCr),
      icon: CreditCard,
      color: 'fuchsia',
      gradient: 'from-fuchsia-500 to-fuchsia-600',
      trend: 6
    },
    {
      id: 'remaining',
      title: 'Remaining Budget',
      group: 'financial',
      value: formatCurrency(enhancedMetrics?.remainingBudgetCr),
      icon: Database,
      color: 'lime',
      gradient: 'from-lime-500 to-lime-600',
      trend: -2
    },
    
    // Timeline Metrics
    {
      id: 'avgtime',
      title: 'Avg Duration',
      group: 'timeline',
      value: `${enhancedMetrics?.avgDuration || 0} days`,
      icon: Timer,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      trend: -1
    },
    {
      id: 'notstarted',
      title: 'Not Started',
      group: 'timeline',
      value: enhancedMetrics?.notStarted || 0,
      icon: Package,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      trend: -5,
      alert: (enhancedMetrics?.notStarted || 0) > 50
    },
    {
      id: 'ongoing',
      title: 'Ongoing',
      group: 'timeline',
      value: enhancedMetrics?.ongoing || 0,
      icon: Cpu,
      color: 'sky',
      gradient: 'from-sky-500 to-sky-600',
      trend: 10
    }
  ], [enhancedMetrics, filteredData]);

  // Group metrics for filtering
  const metricGroups = {
    all: [...mainMetrics, ...additionalMetrics],
    overview: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'overview'),
    financial: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'financial'),
    progress: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'progress'),
    risk: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'risk'),
    performance: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'performance'),
    timeline: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'timeline'),
    organization: [...mainMetrics, ...additionalMetrics].filter(m => m.group === 'organization')
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'text-blue-500',
      orange: 'text-orange-500',
      green: 'text-green-500',
      red: 'text-red-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      cyan: 'text-cyan-500',
      slate: 'text-slate-500',
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      teal: 'text-teal-500',
      emerald: 'text-emerald-500',
      violet: 'text-violet-500',
      fuchsia: 'text-fuchsia-500',
      lime: 'text-lime-500',
      gray: 'text-gray-500',
      sky: 'text-sky-500'
    };
    return colors[color] || 'text-gray-500';
  };

  const MetricCard = ({ metric, isMain = true, size = 'normal' }) => {
    const isHovered = hoveredCard === metric.id;
    const showDetails = isHovered && metric.details;
    const [localValue, setLocalValue] = useState(0);

    // Animate value
    useEffect(() => {
      if (animateValues && typeof metric.value === 'number') {
        const timer = setTimeout(() => {
          setLocalValue(metric.value);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [metric.value, animateValues]);

    const displayValue = animateValues && typeof metric.value === 'number' 
      ? localValue 
      : metric.value;

    const cardSizes = {
      compact: 'p-3',
      normal: 'p-4',
      large: 'p-6'
    };

    return (
      <div
        onClick={() => onMetricClick && onMetricClick(metric.id)}
        onMouseEnter={() => setHoveredCard(metric.id)}
        onMouseLeave={() => setHoveredCard(null)}
        className={`
          relative rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer
          ${darkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
            : 'bg-white border-gray-100 hover:bg-gray-50'
          }
          ${cardSizes[size]}
          hover:shadow-lg hover:scale-102 hover:-translate-y-0.5
          ${metric.alert ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
          ${metric.pulse ? 'animate-pulse' : ''}
        `}
        style={{ position: 'relative', zIndex: isHovered ? 20 : 1 }}
      >
        {/* Gradient Background Effect - Subtle */}
        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-[0.03] rounded-2xl pointer-events-none`} />
        
        {/* Alert Badge */}
        {metric.alert && (
          <div className="absolute -top-1 -right-1 z-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>
        )}
        
        {/* Main Content */}
        <div className="relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {metric.title}
                </span>
                {metric.group && size !== 'compact' && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {metric.group}
                  </span>
                )}
              </div>
              
              {/* Trend Indicator */}
              {showTrends && metric.trend !== undefined && metric.trend !== 0 && size !== 'compact' && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  metric.trendDirection === 'up' 
                    ? (metric.alert ? 'text-red-500' : 'text-green-500')
                    : (metric.alert ? 'text-green-500' : 'text-red-500')
                }`}>
                  {metric.trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span className="text-[10px]">{Math.abs(metric.trend)}%</span>
                </div>
              )}
            </div>
            
            {/* Icon */}
            <div className={`rounded-xl bg-gradient-to-br ${metric.gradient} shadow-sm ${
              size === 'compact' ? 'p-2' : 'p-2.5'
            }`}>
              <metric.icon size={size === 'compact' ? 14 : isMain ? 18 : 16} className="text-white" />
            </div>
          </div>
          
          {/* Value Display */}
          <div className={`${
            size === 'compact' ? 'text-base' : isMain ? 'text-xl' : 'text-lg'
          } font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          } mb-1 transition-all duration-500 ${
            animateValues ? 'scale-100' : 'scale-95'
          }`}>
            {displayValue}
          </div>
          
          {/* Subtitle */}
          {metric.subtitle && size !== 'compact' && (
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {metric.subtitle}
            </div>
          )}
          
          {/* Progress Bar */}
          {metric.percentage !== undefined && size !== 'compact' && (
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full bg-gradient-to-r ${metric.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
              />
            </div>
          )}
          
          {/* Mini Sparkline Chart */}
          {metric.sparkline && showTrends && size === 'normal' && (
            <div className="mt-3 h-8 pointer-events-none opacity-50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metric.sparkline}>
                  <defs>
                    <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getColorClass(metric.color).replace('text-', '#')} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={getColorClass(metric.color).replace('text-', '#')} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="none"
                    fill={`url(#gradient-${metric.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hover Details Popup */}
          {showDetails && (
            <div 
              className={`absolute left-0 right-0 mt-2 p-3 rounded-xl shadow-xl ${
                darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              } border z-50`}
              style={{ 
                top: '100%',
                minWidth: '200px'
              }}
            >
              <div className="space-y-2">
                {Object.entries(metric.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <ChevronRight size={10} />
                      {key}:
                    </span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* Action Button */}
              <button className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}>
                <Eye size={12} />
                View Details
              </button>
            </div>
          )}
        </div>

        {/* More Options */}
        {size !== 'compact' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle more options
            }}
            className={`absolute top-3 right-3 p-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <MoreVertical size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
      {/* Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      } shadow-sm border`}>
        {/* Group Filter */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            View:
          </span>
          <div className="flex gap-1">
            {Object.keys(metricGroups).map(group => (
              <button
                key={group}
                onClick={() => setSelectedMetricGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedMetricGroup === group
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
        
        {/* Options */}
        <div className="flex items-center gap-3">
          {/* Size Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
            <select
              value={cardSize}
              onChange={(e) => setCardSize(e.target.value)}
              className={`px-2 py-1 rounded-lg text-xs ${
                darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-blue-400`}
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          {/* Trends Toggle */}
          <button
            onClick={() => setShowTrends(!showTrends)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              showTrends
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity size={12} />
            Trends
          </button>
          
          {/* Expand Toggle */}
          <button
            onClick={() => setExpandedView(!expandedView)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {expandedView ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expandedView ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Main Metrics - Always Visible */}
      {selectedMetricGroup === 'all' && (
        <div className={`grid gap-4 ${
          cardSize === 'compact' 
            ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
            : cardSize === 'large'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
        }`}>
          {mainMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} isMain={true} size={cardSize} />
          ))}
        </div>
      )}

      {/* Filtered Metrics */}
      {selectedMetricGroup !== 'all' && (
        <div className={`grid gap-4 ${
          cardSize === 'compact' 
            ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
            : cardSize === 'large'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {metricGroups[selectedMetricGroup].map((metric) => (
            <MetricCard key={metric.id} metric={metric} isMain={false} size={cardSize} />
          ))}
        </div>
      )}

      {/* Additional Metrics - Expandable */}
      {expandedView && selectedMetricGroup === 'all' && (
        <div className={`transition-all duration-500 ${
          expandedView ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}>
          <div className={`grid gap-3 ${
            cardSize === 'compact' 
              ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' 
              : cardSize === 'large'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
          }`}>
            {additionalMetrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} isMain={false} size={cardSize} />
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats Bar */}
      {selectedMetricGroup === 'all' && (
        <div className={`flex flex-wrap items-center justify-center gap-4 p-3 rounded-xl ${
          darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'
        } text-xs border`}>
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Last Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-red-500" />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              System Health: {safeNumber(enhancedMetrics?.avgHealthScore, 0).toFixed(0)}/100
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-500" />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Alerts: {((enhancedMetrics?.critical || 0) + ((enhancedMetrics?.delayed || 0) > 30 ? 1 : 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCards;