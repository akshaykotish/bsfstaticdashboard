import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, FunnelChart, Funnel
} from 'recharts';
import {
  IndianRupee, TrendingUp, TrendingDown, AlertCircle,
  DollarSign, PieChart as PieChartIcon, BarChart3,
  AlertTriangle, CheckCircle, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const COLORS = {
  budget: {
    allocated: '#3b82f6',
    spent: '#10b981',
    remaining: '#f59e0b',
    overrun: '#ef4444',
    underutilized: '#a855f7'
  },
  variance: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280'
  },
  gradient: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']
};

const BudgetAnalysis = ({ data, darkMode, onChartClick, formatAmount }) => {
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
        departmentComparison: []
      };
    }

    // Budget by Head Analysis
    const budgetHeads = {};
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
      }
      budgetHeads[head].allocated += (item.sanctioned_amount || 0) / 100;
      budgetHeads[head].spent += (item.total_expdr || 0) / 100;
      budgetHeads[head].projects++;
      budgetHeads[head].totalProgress += item.physical_progress || 0;
      
      if (item.percent_expdr > 100) {
        budgetHeads[head].overrun += ((item.total_expdr || 0) - (item.sanctioned_amount || 0)) / 100;
      }
      if (item.percent_expdr < 50 && item.physical_progress > 50) {
        budgetHeads[head].underutilized += ((item.sanctioned_amount || 0) - (item.total_expdr || 0)) / 100;
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
      .filter(d => d.sanctioned_amount > 0)
      .map(d => ({
        ...d,
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        budgeted: d.sanctioned_amount / 100,
        actual: (d.total_expdr || 0) / 100,
        variance: ((d.total_expdr - d.sanctioned_amount) / d.sanctioned_amount * 100).toFixed(1),
        progress: d.physical_progress || 0,
        status: d.total_expdr > d.sanctioned_amount ? 'Overrun' : 
               d.percent_expdr < 50 && d.physical_progress > 50 ? 'Underutilized' : 'Normal',
        color: d.total_expdr > d.sanctioned_amount ? COLORS.budget.overrun :
               d.percent_expdr < 50 && d.physical_progress > 50 ? COLORS.budget.underutilized : COLORS.budget.spent
      }))
      .filter(d => Math.abs(d.variance) > 5)
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 20);

    // Efficiency Matrix (Progress vs Budget Utilization)
    const efficiencyMatrix = data
      .filter(d => d.sanctioned_amount > 0)
      .slice(0, 100)
      .map(d => ({
        ...d,
        x: d.percent_expdr || 0,
        y: d.physical_progress || 0,
        z: d.sanctioned_amount / 100,
        name: d.scheme_name?.substring(0, 20) || 'Unknown',
        efficiency: d.percent_expdr > 0 ? ((d.physical_progress / d.percent_expdr) * 100).toFixed(1) : 0,
        fill: d.percent_expdr > 100 ? COLORS.budget.overrun :
              d.percent_expdr < 50 && d.physical_progress > 50 ? COLORS.budget.allocated :
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
      count: data.filter(d => d.percent_expdr >= range.min && d.percent_expdr <= range.max).length,
      budget: data
        .filter(d => d.percent_expdr >= range.min && d.percent_expdr <= range.max)
        .reduce((sum, d) => sum + (d.sanctioned_amount || 0), 0) / 100,
      fill: range.min > 100 ? COLORS.budget.overrun :
            range.min > 75 ? COLORS.budget.spent :
            range.min > 50 ? COLORS.budget.allocated :
            range.min > 25 ? COLORS.budget.remaining : COLORS.budget.underutilized
    }));

    // Top Overrun Projects - FIXED: Now includes all original data
    const overrunProjects = data
      .filter(d => d.percent_expdr > 100)
      .sort((a, b) => b.percent_expdr - a.percent_expdr)
      .slice(0, 10)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        overrunAmount: ((d.total_expdr - d.sanctioned_amount) / 100).toFixed(2),
        overrunPercent: (d.percent_expdr - 100).toFixed(1),
        progress: d.physical_progress || 0,
        agency: d.executive_agency || 'Unknown'
      }));

    // Underutilized Projects - FIXED: Now includes all original data
    const underutilizedProjects = data
      .filter(d => d.percent_expdr < 50 && d.physical_progress > 50)
      .sort((a, b) => a.percent_expdr - b.percent_expdr)
      .slice(0, 10)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        unutilizedAmount: ((d.sanctioned_amount - d.total_expdr) / 100).toFixed(2),
        utilizationPercent: d.percent_expdr?.toFixed(1) || 0,
        progress: d.physical_progress || 0,
        agency: d.executive_agency || 'Unknown'
      }));

    // Budget Trend Analysis (Monthly)
    const budgetTrend = [];
    const monthlyBudget = {};
    
    data.forEach(d => {
      if (d.date_award) {
        const date = new Date(d.date_award);
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
          monthlyBudget[monthKey].allocated += (d.sanctioned_amount || 0) / 100;
          monthlyBudget[monthKey].spent += (d.total_expdr || 0) / 100;
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
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyBudget[agency]) {
        agencyBudget[agency] = {
          name: agency,
          allocated: 0,
          spent: 0,
          projects: 0
        };
      }
      agencyBudget[agency].allocated += (d.sanctioned_amount || 0) / 100;
      agencyBudget[agency].spent += (d.total_expdr || 0) / 100;
      agencyBudget[agency].projects++;
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
      departmentComparison
    };
  }, [data]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-xl backdrop-blur-sm border ${
          darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-100' : 'bg-white/95 border-orange-200'
        }`}>
          <p className="text-sm font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-semibold">{entry.name}:</span>
              <span className="font-medium">
                {typeof entry.value === 'number' && (entry.name.includes('Amount') || entry.name.includes('Budget'))
                  ? formatAmount(entry.value * 100)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Budget Allocation vs Utilization */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <IndianRupee size={20} className="text-green-500" />
          Budget Allocation vs Utilization by Department
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={budgetMetrics.budgetByHead}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" label={{ value: 'Amount (Cr)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Utilization %', angle: 90, position: 'insideRight' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="allocated" fill={COLORS.budget.allocated} name="Allocated (Cr)" />
              <Bar yAxisId="left" dataKey="spent" fill={COLORS.budget.spent} name="Spent (Cr)" />
              <Bar yAxisId="left" dataKey="remaining" fill={COLORS.budget.remaining} name="Remaining (Cr)" />
              <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#ef4444" name="Utilization %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Matrix */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            Budget Efficiency Matrix
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="x" name="Budget Spent %" domain={[0, 120]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="y" name="Progress %" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Projects" data={budgetMetrics.efficiencyMatrix}>
                  {budgetMetrics.efficiencyMatrix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilization Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-purple-500" />
            Budget Utilization Distribution
          </h3>
          <div className="w-full h-[350px]">
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
                >
                  {budgetMetrics.utilizationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Trend */}
      {budgetMetrics.budgetTrend.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Monthly Budget Trend
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetMetrics.budgetTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="allocated" stackId="1" stroke={COLORS.budget.allocated} fill={COLORS.budget.allocated} name="Allocated" />
                <Area type="monotone" dataKey="spent" stackId="2" stroke={COLORS.budget.spent} fill={COLORS.budget.spent} name="Spent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Critical Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overrun Projects */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Top Budget Overruns
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {budgetMetrics.overrunProjects.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => onChartClick(project, 'project')}
              >
                <p className="text-sm font-semibold truncate">{project.project}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Overrun</span>
                  <span className="font-bold text-red-600 text-sm">
                    ₹{project.overrunAmount} Cr ({project.overrunPercent}%)
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-medium">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underutilized Projects */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-500" />
            Underutilized Budgets
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {budgetMetrics.underutilizedProjects.map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                }`}
                onClick={() => onChartClick(project, 'project')}
              >
                <p className="text-sm font-semibold truncate">{project.project}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Unutilized</span>
                  <span className="font-bold text-yellow-600 text-sm">
                    ₹{project.unutilizedAmount} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Utilization</span>
                  <span className="text-xs font-medium">{project.utilizationPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalysis;