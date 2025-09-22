import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ScatterChart, Scatter,
  Treemap, ComposedChart
} from 'recharts';
import {
  TrendingUp, PieChart as PieChartIcon, BarChart3, Activity,
  GitBranch, MapPin, Calendar, DollarSign, AlertTriangle,
  Clock, Target, Shield, Users, Building2, Package, FileText,
  Download, Printer, Filter, Eye, Maximize2, Info, X,
  ChevronDown, ChevronLeft, ChevronRight, Layers, Grid3x3,
  Construction, Route, Box, Building, MoreHorizontal,
  Globe, Navigation, Zap, Heart, Timer, PauseCircle,
  CheckCircle, XCircle, AlertCircle, CalendarDays
} from 'lucide-react';

const ChartTabs = ({
  activeTab,
  setActiveTab,
  filteredData,
  rawData,
  darkMode,
  compareMode,
  selectedProjects,
  onProjectSelect,
  onDrillDown,
  filters,
  setModalProject,
  setModalOpen,
  onExportReport,
  onPrintReport
}) => {
  const [chartView, setChartView] = useState('bar');
  const [selectedMetric, setSelectedMetric] = useState('budget');
  const [groupBy, setGroupBy] = useState('frontier');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [showDataLabels, setShowDataLabels] = useState(false);

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'budget', label: 'Budget Analysis', icon: DollarSign },
    { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'frontier', label: 'Frontier Performance', icon: Globe },
    { id: 'categories', label: 'Work Categories', icon: Layers },
    { id: 'comparison', label: 'Comparison', icon: GitBranch }
  ];

  // Color schemes
  const colors = {
    primary: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
    success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    cyan: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};

    // Group by frontier
    const byFrontier = {};
    filteredData.forEach(item => {
      const frontier = item.frontier || 'Unknown';
      if (!byFrontier[frontier]) {
        byFrontier[frontier] = {
          name: frontier,
          count: 0,
          budget: 0,
          spent: 0,
          progress: 0,
          critical: 0,
          completed: 0
        };
      }
      byFrontier[frontier].count++;
      byFrontier[frontier].budget += item.sanctioned_amount_cr || 0;
      byFrontier[frontier].spent += item.spent_amount_cr || 0;
      byFrontier[frontier].progress += (item.completed_percentage || 0) * 100;
      if (item.risk_level === 'CRITICAL') byFrontier[frontier].critical++;
      if (item.completion_status === 'COMPLETED') byFrontier[frontier].completed++;
    });

    // Calculate averages
    Object.values(byFrontier).forEach(frontier => {
      frontier.progress = frontier.count > 0 ? frontier.progress / frontier.count : 0;
      frontier.utilization = frontier.budget > 0 ? (frontier.spent / frontier.budget * 100) : 0;
    });

    // Group by work category
    const byCategory = {};
    const categoryLabels = {
      'BORDER_OUTPOST': 'BOP',
      'FENCING': 'Fencing',
      'ROAD': 'Road',
      'BRIDGE': 'Bridge',
      'INFRASTRUCTURE': 'Infrastructure',
      'OTHER': 'Other'
    };

    filteredData.forEach(item => {
      const category = item.work_category || 'OTHER';
      const label = categoryLabels[category] || category;
      if (!byCategory[label]) {
        byCategory[label] = {
          name: label,
          value: 0,
          budget: 0,
          count: 0
        };
      }
      byCategory[label].value++;
      byCategory[label].budget += item.sanctioned_amount_cr || 0;
      byCategory[label].count++;
    });

    // Risk distribution
    const riskDistribution = [
      { name: 'Critical', value: filteredData.filter(d => d.risk_level === 'CRITICAL').length, fill: '#ef4444' },
      { name: 'High', value: filteredData.filter(d => d.risk_level === 'HIGH').length, fill: '#f59e0b' },
      { name: 'Medium', value: filteredData.filter(d => d.risk_level === 'MEDIUM').length, fill: '#eab308' },
      { name: 'Low', value: filteredData.filter(d => d.risk_level === 'LOW').length, fill: '#10b981' }
    ];

    // Completion status distribution
    const statusDistribution = [
      { name: 'Not Started', value: filteredData.filter(d => d.completion_status === 'NOT_STARTED').length, fill: '#ef4444' },
      { name: 'Initial', value: filteredData.filter(d => d.completion_status === 'INITIAL').length, fill: '#f97316' },
      { name: 'In Progress', value: filteredData.filter(d => d.completion_status === 'IN_PROGRESS').length, fill: '#f59e0b' },
      { name: 'Advanced', value: filteredData.filter(d => d.completion_status === 'ADVANCED').length, fill: '#3b82f6' },
      { name: 'Near Completion', value: filteredData.filter(d => d.completion_status === 'NEAR_COMPLETION').length, fill: '#6366f1' },
      { name: 'Completed', value: filteredData.filter(d => d.completion_status === 'COMPLETED').length, fill: '#10b981' }
    ];

    // Timeline data - PDC distribution
    const pdcAnalysis = {};
    filteredData.forEach(item => {
      if (item.pdc) {
        const year = item.pdc.split(/['"\s]+/).pop();
        if (year && !isNaN(year)) {
          if (!pdcAnalysis[year]) {
            pdcAnalysis[year] = {
              year,
              total: 0,
              completed: 0,
              overdue: 0,
              onTrack: 0
            };
          }
          pdcAnalysis[year].total++;
          if (item.completion_status === 'COMPLETED') pdcAnalysis[year].completed++;
          if (item.days_to_pdc < 0) pdcAnalysis[year].overdue++;
          if (item.days_to_pdc >= 0 && item.completion_status !== 'COMPLETED') pdcAnalysis[year].onTrack++;
        }
      }
    });

    const timelineData = Object.values(pdcAnalysis).sort((a, b) => a.year - b.year);

    // Progress vs Budget scatter data
    const scatterData = filteredData.map(item => ({
      x: item.sanctioned_amount_cr || 0,
      y: (item.completed_percentage || 0) * 100,
      z: item.efficiency_score || 0,
      name: item.name_of_work,
      risk: item.risk_level,
      fill: item.risk_level === 'CRITICAL' ? '#ef4444' :
            item.risk_level === 'HIGH' ? '#f59e0b' :
            item.risk_level === 'MEDIUM' ? '#eab308' : '#10b981'
    }));

    return {
      frontierData: Object.values(byFrontier).sort((a, b) => b.budget - a.budget),
      categoryData: Object.values(byCategory),
      riskDistribution,
      statusDistribution,
      timelineData,
      scatterData
    };
  }, [filteredData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                entry.name.includes('₹') || entry.name.includes('Budget') || entry.name.includes('Spent') ? 
                  `₹${entry.value.toFixed(2)} Cr` : 
                  entry.value.toFixed(1) : 
                entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on active tab
  const renderChart = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewCharts();
      case 'budget':
        return renderBudgetAnalysis();
      case 'progress':
        return renderProgressTracking();
      case 'risk':
        return renderRiskAssessment();
      case 'timeline':
        return renderTimelineAnalysis();
      case 'frontier':
        return renderFrontierPerformance();
      case 'categories':
        return renderCategoryAnalysis();
      case 'comparison':
        return renderComparison();
      default:
        return renderOverviewCharts();
    }
  };

  const renderOverviewCharts = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget by Frontier */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-green-500" />
            Budget Distribution by Frontier
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.frontierData?.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                label={{ value: 'Amount (Cr)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="budget" name="Budget" fill="#3b82f6" />
              <Bar dataKey="spent" name="Spent" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Status */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            Work Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            Risk Level Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.riskDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Work Categories */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Layers size={16} className="text-purple-500" />
            Work Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBudgetAnalysis = () => {
    const budgetData = chartData.frontierData?.map(item => ({
      name: item.name,
      budget: item.budget,
      spent: item.spent,
      remaining: item.budget - item.spent,
      utilization: item.utilization
    }));

    return (
      <div className="space-y-4">
        {/* Budget vs Spent by Frontier */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Budget vs Expenditure Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                label={{ value: 'Amount (Cr)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                label={{ value: 'Utilization %', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="budget" name="Budget" fill="#3b82f6" />
              <Bar yAxisId="left" dataKey="spent" name="Spent" fill="#10b981" />
              <Line yAxisId="right" type="monotone" dataKey="utilization" name="Utilization %" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Distribution by Category */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Budget by Work Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={chartData.categoryData?.map(item => ({
                name: item.name,
                size: item.budget,
                count: item.count
              }))}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#3b82f6"
            >
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className={`p-2 rounded-lg shadow-lg ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        <p className="text-sm font-semibold">{payload[0].payload.name}</p>
                        <p className="text-xs">Budget: ₹{payload[0].value?.toFixed(2)} Cr</p>
                        <p className="text-xs">Count: {payload[0].payload.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderProgressTracking = () => {
    return (
      <div className="space-y-4">
        {/* Progress by Frontier */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Average Progress by Frontier</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.frontierData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="progress" name="Progress %" fill="#10b981">
                {chartData.frontierData?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.progress >= 75 ? '#10b981' : 
                          entry.progress >= 50 ? '#3b82f6' :
                          entry.progress >= 25 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress vs Budget Scatter */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Progress vs Budget Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Budget" 
                unit=" Cr"
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                label={{ value: 'Budget (Cr)', position: 'insideBottom', offset: -5, style: { fontSize: 10 } }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Progress" 
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                label={{ value: 'Progress %', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className={`p-2 rounded-lg shadow-lg ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        <p className="text-xs font-semibold">{data.name}</p>
                        <p className="text-xs">Budget: ₹{data.x?.toFixed(2)} Cr</p>
                        <p className="text-xs">Progress: {data.y?.toFixed(1)}%</p>
                        <p className="text-xs">Risk: {data.risk}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Projects" data={chartData.scatterData} fill="#8884d8">
                {chartData.scatterData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderRiskAssessment = () => {
    const riskByFrontier = {};
    filteredData.forEach(item => {
      const frontier = item.frontier || 'Unknown';
      if (!riskByFrontier[frontier]) {
        riskByFrontier[frontier] = {
          name: frontier,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }
      switch(item.risk_level) {
        case 'CRITICAL': riskByFrontier[frontier].critical++; break;
        case 'HIGH': riskByFrontier[frontier].high++; break;
        case 'MEDIUM': riskByFrontier[frontier].medium++; break;
        case 'LOW': riskByFrontier[frontier].low++; break;
      }
    });

    const riskData = Object.values(riskByFrontier);

    return (
      <div className="space-y-4">
        {/* Risk Distribution Overview */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Overall Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.riskDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.riskDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by Frontier */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Risk Distribution by Frontier</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="high" name="High" stackId="a" fill="#f59e0b" />
              <Bar dataKey="medium" name="Medium" stackId="a" fill="#eab308" />
              <Bar dataKey="low" name="Low" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Critical Projects List */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            Critical Risk Projects (Top 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2">S.No</th>
                  <th className="text-left py-2">Work Name</th>
                  <th className="text-left py-2">Frontier</th>
                  <th className="text-right py-2">Budget (Cr)</th>
                  <th className="text-right py-2">Progress %</th>
                  <th className="text-center py-2">Days to PDC</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .filter(d => d.risk_level === 'CRITICAL')
                  .slice(0, 10)
                  .map((project, index) => (
                    <tr 
                      key={index}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => {
                        if (setModalProject && setModalOpen) {
                          setModalProject(project);
                          setModalOpen(true);
                        }
                      }}
                    >
                      <td className="py-2">{project.s_no}</td>
                      <td className="py-2 truncate max-w-xs" title={project.name_of_work}>
                        {project.name_of_work}
                      </td>
                      <td className="py-2">{project.frontier}</td>
                      <td className="text-right py-2">₹{project.sanctioned_amount_cr?.toFixed(2)}</td>
                      <td className="text-right py-2">{((project.completed_percentage || 0) * 100).toFixed(1)}%</td>
                      <td className="text-center py-2">
                        <span className={project.days_to_pdc < 0 ? 'text-red-500 font-bold' : ''}>
                          {project.days_to_pdc || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineAnalysis = () => {
    return (
      <div className="space-y-4">
        {/* PDC Timeline */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">PDC Distribution by Year</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" name="Total" fill="#3b82f6" />
              <Bar dataKey="completed" name="Completed" fill="#10b981" />
              <Bar dataKey="overdue" name="Overdue" fill="#ef4444" />
              <Bar dataKey="onTrack" name="On Track" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue Projects */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock size={16} className="text-red-500" />
            Overdue Projects (Top 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2">S.No</th>
                  <th className="text-left py-2">Work Name</th>
                  <th className="text-left py-2">PDC</th>
                  <th className="text-center py-2">Days Overdue</th>
                  <th className="text-right py-2">Progress %</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .filter(d => d.days_to_pdc < 0)
                  .sort((a, b) => a.days_to_pdc - b.days_to_pdc)
                  .slice(0, 10)
                  .map((project, index) => (
                    <tr 
                      key={index}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => {
                        if (setModalProject && setModalOpen) {
                          setModalProject(project);
                          setModalOpen(true);
                        }
                      }}
                    >
                      <td className="py-2">{project.s_no}</td>
                      <td className="py-2 truncate max-w-xs" title={project.name_of_work}>
                        {project.name_of_work}
                      </td>
                      <td className="py-2">{project.pdc}</td>
                      <td className="text-center py-2">
                        <span className="text-red-500 font-bold">
                          {Math.abs(project.days_to_pdc)}
                        </span>
                      </td>
                      <td className="text-right py-2">{((project.completed_percentage || 0) * 100).toFixed(1)}%</td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          project.completion_status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          project.completion_status === 'NEAR_COMPLETION' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {project.completion_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFrontierPerformance = () => {
    const frontierMetrics = chartData.frontierData?.map(f => ({
      frontier: f.name,
      metrics: [
        { subject: 'Budget', value: Math.min(100, (f.budget / 100) * 10) },
        { subject: 'Progress', value: f.progress },
        { subject: 'Utilization', value: f.utilization },
        { subject: 'Completion', value: (f.completed / f.count) * 100 },
        { subject: 'Risk', value: 100 - ((f.critical / f.count) * 100) }
      ]
    }));

    return (
      <div className="space-y-4">
        {/* Frontier Performance Comparison */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Frontier Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.frontierData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" name="Total Works" fill="#3b82f6" />
              <Bar dataKey="completed" name="Completed" fill="#10b981" />
              <Bar dataKey="critical" name="Critical" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Frontier Performance Radar */}
        {frontierMetrics && frontierMetrics.length > 0 && (
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className="text-sm font-semibold mb-3">
              Performance Radar - {frontierMetrics[0]?.frontier}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={frontierMetrics[0]?.metrics}>
                <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderCategoryAnalysis = () => {
    const categoryMetrics = {};
    filteredData.forEach(item => {
      const category = item.work_category || 'OTHER';
      if (!categoryMetrics[category]) {
        categoryMetrics[category] = {
          name: category,
          count: 0,
          budget: 0,
          spent: 0,
          avgProgress: 0,
          completed: 0,
          critical: 0
        };
      }
      categoryMetrics[category].count++;
      categoryMetrics[category].budget += item.sanctioned_amount_cr || 0;
      categoryMetrics[category].spent += item.spent_amount_cr || 0;
      categoryMetrics[category].avgProgress += (item.completed_percentage || 0) * 100;
      if (item.completion_status === 'COMPLETED') categoryMetrics[category].completed++;
      if (item.risk_level === 'CRITICAL') categoryMetrics[category].critical++;
    });

    Object.values(categoryMetrics).forEach(cat => {
      cat.avgProgress = cat.count > 0 ? cat.avgProgress / cat.count : 0;
      cat.completionRate = cat.count > 0 ? (cat.completed / cat.count * 100) : 0;
    });

    const categoryData = Object.values(categoryMetrics);

    return (
      <div className="space-y-4">
        {/* Category Overview */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Work Category Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" name="Total" fill="#3b82f6" />
              <Bar dataKey="completed" name="Completed" fill="#10b981" />
              <Bar dataKey="critical" name="Critical" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Progress */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Average Progress by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgProgress" name="Avg Progress %" fill="#8b5cf6">
                {categoryData?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.avgProgress >= 75 ? '#10b981' : 
                          entry.avgProgress >= 50 ? '#3b82f6' :
                          entry.avgProgress >= 25 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (selectedProjects.length === 0) {
      return (
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } text-center`}>
          <Info size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">No Projects Selected for Comparison</p>
          <p className="text-sm text-gray-500">
            Select projects from the table to compare their metrics
          </p>
        </div>
      );
    }

    const comparisonData = selectedProjects.map(project => ({
      name: project.name_of_work?.substring(0, 30) + '...',
      budget: project.sanctioned_amount_cr || 0,
      spent: project.spent_amount_cr || 0,
      progress: (project.completed_percentage || 0) * 100,
      efficiency: project.efficiency_score || 0,
      daysToPodc: project.days_to_pdc || 0
    }));

    return (
      <div className="space-y-4">
        {/* Comparison Chart */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Project Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="budget" name="Budget (Cr)" fill="#3b82f6" />
              <Bar dataKey="spent" name="Spent (Cr)" fill="#10b981" />
              <Bar dataKey="progress" name="Progress %" fill="#8b5cf6" />
              <Bar dataKey="efficiency" name="Efficiency %" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Table */}
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-sm font-semibold mb-3">Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2">Metric</th>
                  {selectedProjects.map((project, index) => (
                    <th key={index} className="text-center py-2 px-2">
                      {project.s_no}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Work Type</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">{project.work_type}</td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Frontier</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">{project.frontier}</td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Budget (Cr)</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">₹{project.sanctioned_amount_cr?.toFixed(2)}</td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Progress %</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">
                      {((project.completed_percentage || 0) * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Risk Level</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.risk_level}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Status</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">
                      {project.completion_status?.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-2 font-semibold">Days to PDC</td>
                  {selectedProjects.map((project, index) => (
                    <td key={index} className="text-center py-2">
                      <span className={project.days_to_pdc < 0 ? 'text-red-500 font-bold' : ''}>
                        {project.days_to_pdc || 0}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${
      darkMode ? 'border-gray-700' : 'border-gray-100'
    } overflow-hidden`}>
      {/* Tabs Header */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                    : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDataLabels(!showDataLabels)}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
              title="Toggle Data Labels"
            >
              <FileText size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
              title="Toggle Grid"
            >
              <Grid3x3 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
              title="Toggle Legend"
            >
              <Layers size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            {onExportReport && (
              <button
                onClick={() => onExportReport(filteredData, activeTab)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors`}
                title="Export Report"
              >
                <Download size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            )}
            {onPrintReport && (
              <button
                onClick={() => onPrintReport(filteredData, activeTab)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors`}
                title="Print Report"
              >
                <Printer size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartTabs;