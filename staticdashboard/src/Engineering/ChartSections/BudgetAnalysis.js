import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, FunnelChart, Funnel
} from 'recharts';
import {
  IndianRupee, TrendingUp, TrendingDown, AlertCircle,
  DollarSign, PieChart as PieChartIcon, BarChart3,
  AlertTriangle, CheckCircle, Info, ArrowUpRight, ArrowDownRight,
  X, Eye, Filter, ChevronRight, Building
} from 'lucide-react';
import DataTable from '../DataTable';
import FitViewModal from '../FitView';

const COLORS = {
  budget: {
    allocated: '#3b82f6',
    spent: '#10b981',
    remaining: '#f59e0b',
    overrun: '#ef4444',
    underutilized: '#8b5cf6'
  },
  variance: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280'
  },
  gradient: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};

const BudgetAnalysis = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showDataTableModal, setShowDataTableModal] = useState(false);
  const [selectedDataForTable, setSelectedDataForTable] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [showFitViewModal, setShowFitViewModal] = useState(false);
  const [selectedProjectForFitView, setSelectedProjectForFitView] = useState(null);

  const budgetMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        budgetByHead: [],
        costVariance: [],
        efficiencyMatrix: [],
        utilizationDistribution: [],
        overrunProjects: [],
        underutilizedProjects: [],
        budgetTrend: [],
        departmentComparison: [],
        budgetHeadProjects: {},
        departmentProjects: {}
      };
    }

    // Budget by Head Analysis
    const budgetHeads = {};
    const budgetHeadProjects = {};
    
    data.forEach(item => {
      const head = item.budget_head || 'Unspecified';
      if (!budgetHeads[head]) {
        budgetHeads[head] = {
          name: head,
          allocated: 0,
          spent: 0,
          remaining: 0,
          projects: 0,
          utilization: 0,
          overrun: 0,
          underutilized: 0,
          avgProgress: 0,
          totalProgress: 0
        };
        budgetHeadProjects[head] = [];
      }
      budgetHeads[head].allocated += (item.sd_amount_lakh || 0);
      budgetHeads[head].spent += (item.expenditure_total || 0);
      budgetHeads[head].projects++;
      budgetHeads[head].totalProgress += item.physical_progress_percent || 0;
      budgetHeadProjects[head].push(item);
      
      if (item.expenditure_percent > 100) {
        budgetHeads[head].overrun += ((item.expenditure_total || 0) - (item.sd_amount_lakh || 0));
      }
      if (item.expenditure_percent < 50 && item.physical_progress_percent > 50) {
        budgetHeads[head].underutilized += ((item.sd_amount_lakh || 0) - (item.expenditure_total || 0));
      }
    });

    const budgetByHead = Object.values(budgetHeads)
      .map(item => ({
        ...item,
        remaining: item.allocated - item.spent,
        utilization: item.allocated ? ((item.spent / item.allocated) * 100).toFixed(1) : 0,
        avgProgress: item.projects ? (item.totalProgress / item.projects).toFixed(1) : 0
      }))
      .sort((a, b) => b.allocated - a.allocated);

    // Cost Variance Analysis
    const costVariance = data
      .filter(d => d.sd_amount_lakh > 0)
      .map(d => ({
        ...d,
        project: d.sub_scheme_name?.substring(0, 30) || d.name_of_scheme?.substring(0, 30) || 'Unknown',
        budgeted: d.sd_amount_lakh,
        actual: (d.expenditure_total || 0),
        variance: ((d.expenditure_total - d.sd_amount_lakh) / d.sd_amount_lakh * 100).toFixed(1),
        progress: d.physical_progress_percent || 0,
        status: d.expenditure_total > d.sd_amount_lakh ? 'Overrun' : 
               d.expenditure_percent < 50 && d.physical_progress_percent > 50 ? 'Underutilized' : 'Normal',
        color: d.expenditure_total > d.sd_amount_lakh ? COLORS.budget.overrun :
               d.expenditure_percent < 50 && d.physical_progress_percent > 50 ? COLORS.budget.underutilized : COLORS.budget.spent
      }))
      .filter(d => Math.abs(d.variance) > 5)
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 20);

    // Efficiency Matrix (Progress vs Budget Utilization)
    const efficiencyMatrix = data
      .filter(d => d.sd_amount_lakh > 0)
      .slice(0, 100)
      .map(d => ({
        ...d,
        x: d.expenditure_percent || 0,
        y: d.physical_progress_percent || 0,
        z: d.sd_amount_lakh,
        name: d.sub_scheme_name?.substring(0, 20) || d.name_of_scheme?.substring(0, 20) || 'Unknown',
        efficiency: d.expenditure_percent > 0 ? ((d.physical_progress_percent / d.expenditure_percent) * 100).toFixed(1) : 0,
        fill: d.expenditure_percent > 100 ? COLORS.budget.overrun :
              d.expenditure_percent < 50 && d.physical_progress_percent > 50 ? COLORS.budget.allocated :
              COLORS.budget.spent
      }));

    // Utilization Distribution
    const utilizationRanges = [
      { range: '0-25%', min: 0, max: 25 },
      { range: '26-50%', min: 26, max: 50 },
      { range: '51-75%', min: 51, max: 75 },
      { range: '76-100%', min: 76, max: 100 },
      { range: '>100%', min: 101, max: Infinity }
    ];

    const utilizationDistribution = utilizationRanges.map(range => ({
      ...range,
      count: data.filter(d => d.expenditure_percent >= range.min && d.expenditure_percent <= range.max).length,
      budget: data
        .filter(d => d.expenditure_percent >= range.min && d.expenditure_percent <= range.max)
        .reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
      projects: data.filter(d => d.expenditure_percent >= range.min && d.expenditure_percent <= range.max),
      fill: range.min > 100 ? COLORS.budget.overrun :
            range.min > 75 ? COLORS.budget.spent :
            range.min > 50 ? COLORS.budget.allocated :
            range.min > 25 ? COLORS.budget.remaining : COLORS.budget.underutilized
    }));

    // Top Overrun Projects
    const overrunProjects = data
      .filter(d => d.expenditure_percent > 100)
      .sort((a, b) => b.expenditure_percent - a.expenditure_percent)
      .slice(0, 10)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.sub_scheme_name?.substring(0, 30) || d.name_of_scheme?.substring(0, 30) || 'Unknown',
        overrunAmount: ((d.expenditure_total - d.sd_amount_lakh)).toFixed(2),
        overrunPercent: (d.expenditure_percent - 100).toFixed(1),
        progress: d.physical_progress_percent || 0,
        agency: d.executive_agency || 'Unknown'
      }));

    // Underutilized Projects
    const underutilizedProjects = data
      .filter(d => d.expenditure_percent < 50 && d.physical_progress_percent > 50)
      .sort((a, b) => a.expenditure_percent - b.expenditure_percent)
      .slice(0, 10)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.sub_scheme_name?.substring(0, 30) || d.name_of_scheme?.substring(0, 30) || 'Unknown',
        unutilizedAmount: ((d.sd_amount_lakh - d.expenditure_total)).toFixed(2),
        utilizationPercent: d.expenditure_percent?.toFixed(1) || 0,
        progress: d.physical_progress_percent || 0,
        agency: d.executive_agency || 'Unknown'
      }));

    // Budget Trend Analysis (Monthly)
    const budgetTrend = [];
    const monthlyBudget = {};
    
    data.forEach(d => {
      if (d.award_date) {
        const date = new Date(d.award_date);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyBudget[monthKey]) {
            monthlyBudget[monthKey] = {
              month: monthKey,
              allocated: 0,
              spent: 0,
              utilization: 0
            };
          }
          monthlyBudget[monthKey].allocated += (d.sd_amount_lakh || 0);
          monthlyBudget[monthKey].spent += (d.expenditure_total || 0);
        }
      }
    });

    Object.values(monthlyBudget)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => {
        item.utilization = item.allocated ? ((item.spent / item.allocated) * 100).toFixed(1) : 0;
        budgetTrend.push(item);
      });

    // Department/Agency Budget Comparison
    const agencyBudget = {};
    const departmentProjects = {};
    
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyBudget[agency]) {
        agencyBudget[agency] = {
          name: agency,
          allocated: 0,
          spent: 0,
          projects: 0
        };
        departmentProjects[agency] = [];
      }
      agencyBudget[agency].allocated += (d.sd_amount_lakh || 0);
      agencyBudget[agency].spent += (d.expenditure_total || 0);
      agencyBudget[agency].projects++;
      departmentProjects[agency].push(d);
    });

    const departmentComparison = Object.values(agencyBudget)
      .map(a => ({
        ...a,
        utilization: a.allocated ? ((a.spent / a.allocated) * 100).toFixed(1) : 0,
        avgBudgetPerProject: a.projects ? (a.allocated / a.projects).toFixed(2) : 0
      }))
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 10);

    return {
      budgetByHead,
      costVariance,
      efficiencyMatrix,
      utilizationDistribution,
      overrunProjects,
      underutilizedProjects,
      budgetTrend,
      departmentComparison,
      budgetHeadProjects,
      departmentProjects
    };
  }, [data]);

  // Handle opening DataTable modal
  const handleOpenDataTable = (projects, title) => {
    setSelectedDataForTable(projects);
    setModalTitle(title);
    setShowDataTableModal(true);
  };

  // Handle opening FitView modal for project details
  const handleOpenFitView = (project) => {
    setSelectedProjectForFitView(project);
    setShowFitViewModal(true);
  };

  // Handle closing FitView modal
  const handleCloseFitView = () => {
    setShowFitViewModal(false);
    setSelectedProjectForFitView(null);
  };

  // Handle project click from within DataTable
  const handleProjectClick = (project) => {
    setShowDataTableModal(false);
    if (onChartClick) {
      onChartClick(project, 'project');
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-2 rounded-lg shadow-lg backdrop-blur-sm border ${
          darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-100' : 'bg-white/95 border-gray-200'
        }`}>
          <p className="text-xs font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-semibold">
                {typeof entry.value === 'number' && (entry.name.includes('Amount') || entry.name.includes('Budget') || entry.name.includes('Allocated') || entry.name.includes('Spent'))
                  ? formatAmount(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                {modalTitle}
              </h2>
              <button
                onClick={() => setShowDataTableModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* DataTable */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={selectedDataForTable}
              darkMode={darkMode}
              onRowClick={handleProjectClick}
              compareMode={false}
              selectedProjects={[]}
              isEmbedded={true}
              maxHeight="100%"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Budget Allocation vs Utilization */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <IndianRupee size={18} className="text-green-500" />
          Budget Allocation vs Utilization by Department
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={budgetMetrics.budgetByHead}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 9, cursor: 'pointer' }}
                onClick={(e) => {
                  if (e && e.value && budgetMetrics.budgetHeadProjects[e.value]) {
                    handleOpenDataTable(
                      budgetMetrics.budgetHeadProjects[e.value],
                      `${e.value} - Budget Head Projects`
                    );
                  }
                }}
              />
              <YAxis yAxisId="left" label={{ value: 'Amount (Lakh)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Utilization %', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar 
                yAxisId="left" 
                dataKey="allocated" 
                fill={COLORS.budget.allocated} 
                name="Allocated (Lakh)"
                onClick={(data) => {
                  if (data && budgetMetrics.budgetHeadProjects[data.name]) {
                    handleOpenDataTable(
                      budgetMetrics.budgetHeadProjects[data.name],
                      `${data.name} - Budget Head Projects`
                    );
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <Bar yAxisId="left" dataKey="spent" fill={COLORS.budget.spent} name="Spent (Lakh)" />
              <Bar yAxisId="left" dataKey="remaining" fill={COLORS.budget.remaining} name="Remaining (Lakh)" />
              <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#ef4444" name="Utilization %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Eye size={12} />
          Click on bars or labels to view detailed project list
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Matrix */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BarChart3 size={16} className="text-blue-500" />
            Budget Efficiency Matrix
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="x" name="Budget Spent %" domain={[0, 120]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" name="Progress %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="Projects" 
                  data={budgetMetrics.efficiencyMatrix}
                  onClick={(data) => {
                    if (onChartClick) {
                      onChartClick(data, 'project');
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {budgetMetrics.efficiencyMatrix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilization Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <PieChartIcon size={16} className="text-purple-500" />
            Budget Utilization Distribution
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetMetrics.utilizationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  onClick={(data) => {
                    if (data.projects && data.projects.length > 0) {
                      handleOpenDataTable(
                        data.projects,
                        `Projects with ${data.range} Budget Utilization`
                      );
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {budgetMetrics.utilizationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {budgetMetrics.utilizationDistribution.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center text-xs p-2 rounded cursor-pointer hover:${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                } transition-colors`}
                onClick={() => {
                  if (item.projects && item.projects.length > 0) {
                    handleOpenDataTable(
                      item.projects,
                      `Projects with ${item.range} Budget Utilization`
                    );
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span>{item.range}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{item.count} projects</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Trend */}
      {budgetMetrics.budgetTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <TrendingUp size={16} className="text-green-500" />
            Monthly Budget Trend
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetMetrics.budgetTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="allocated" stackId="1" stroke={COLORS.budget.allocated} fill={COLORS.budget.allocated} name="Allocated (Lakh)" />
                <Area type="monotone" dataKey="spent" stackId="2" stroke={COLORS.budget.spent} fill={COLORS.budget.spent} name="Spent (Lakh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Department Comparison Table */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building size={16} className="text-indigo-500" />
          Department Budget Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Department</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Projects</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Allocated</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Spent</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Utilization %</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Avg/Project</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {budgetMetrics.departmentComparison.map((dept, index) => (
                <tr 
                  key={index} 
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} transition-colors cursor-pointer`}
                  onClick={() => {
                    if (budgetMetrics.departmentProjects[dept.name]) {
                      handleOpenDataTable(
                        budgetMetrics.departmentProjects[dept.name],
                        `${dept.name} - Department Projects`
                      );
                    }
                  }}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{dept.name}</td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{dept.projects}</td>
                  <td className="px-3 py-2 text-center font-medium">{formatAmount ? formatAmount(dept.allocated) : `₹${dept.allocated.toFixed(2)}L`}</td>
                  <td className="px-3 py-2 text-center font-medium">{formatAmount ? formatAmount(dept.spent) : `₹${dept.spent.toFixed(2)}L`}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${
                        dept.utilization > 90 ? 'text-red-600' :
                        dept.utilization > 70 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {dept.utilization}%
                      </span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            dept.utilization > 90 ? 'bg-red-500' :
                            dept.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, dept.utilization)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{formatAmount ? formatAmount(parseFloat(dept.avgBudgetPerProject)) : `₹${dept.avgBudgetPerProject}L`}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (budgetMetrics.departmentProjects[dept.name]) {
                          handleOpenDataTable(
                            budgetMetrics.departmentProjects[dept.name],
                            `${dept.name} - Department Projects`
                          );
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 mx-auto ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'
                      } transition-colors text-blue-600 dark:text-blue-400`}
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overrun Projects */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            Top Budget Overruns
            {budgetMetrics.overrunProjects.length > 0 && (
              <button
                onClick={() => {
                  const allOverruns = data.filter(d => d.expenditure_percent > 100);
                  handleOpenDataTable(allOverruns, 'All Budget Overrun Projects');
                }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All ({data.filter(d => d.expenditure_percent > 100).length})
                <ChevronRight size={12} />
              </button>
            )}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {budgetMetrics.overrunProjects.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => handleOpenFitView(project)}
              >
                <p className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">{project.project}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Overrun</span>
                  <span className="font-bold text-red-600 text-xs">
                    ₹{project.overrunAmount} L ({project.overrunPercent}%)
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye size={10} />
                    Click for detailed analytics
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underutilized Projects */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertCircle size={16} className="text-yellow-500" />
            Underutilized Budgets
            {budgetMetrics.underutilizedProjects.length > 0 && (
              <button
                onClick={() => {
                  const allUnderutilized = data.filter(d => d.expenditure_percent < 50 && d.physical_progress_percent > 50);
                  handleOpenDataTable(allUnderutilized, 'All Underutilized Budget Projects');
                }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All ({data.filter(d => d.expenditure_percent < 50 && d.physical_progress_percent > 50).length})
                <ChevronRight size={12} />
              </button>
            )}
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {budgetMetrics.underutilizedProjects.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                }`}
                onClick={() => handleOpenFitView(project)}
              >
                <p className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">{project.project}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Unutilized</span>
                  <span className="font-bold text-yellow-600 text-xs">
                    ₹{project.unutilizedAmount} L
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Utilization</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{project.utilizationPercent}%</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye size={10} />
                    Click for detailed analytics
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DataTable Modal */}
      <DataTableModal />

      {/* FitView Modal */}
      <FitViewModal
        row={selectedProjectForFitView}
        isOpen={showFitViewModal}
        onClose={handleCloseFitView}
        darkMode={darkMode}
      />
    </div>
  );
};

export default BudgetAnalysis;