import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, FunnelChart, Funnel
} from 'recharts';
import {
  TrendingUp, Target, Clock, Gauge, Activity,
  CheckCircle, XCircle, AlertTriangle, Timer,
  Zap, ArrowUp, ArrowDown, BarChart3, PieChart as PieChartIcon,
  MapPin, Building2, Users, Eye, Calculator
} from 'lucide-react';
import FitViewModal from '../FitView';

const COLORS = {
  progress: {
    notStarted: '#ef4444',
    foundation: '#f59e0b',
    structure: '#fbbf24',
    finishing: '#3b82f6',
    finalStage: '#10b981',
    completed: '#059669'
  },
  velocity: {
    fast: '#10b981',
    normal: '#3b82f6',
    slow: '#f59e0b',
    stalled: '#ef4444'
  },
  correlation: {
    efficient: '#10b981',
    normal: '#3b82f6',
    inefficient: '#ef4444'
  }
};

const ProgressTracking = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [showFitViewModal, setShowFitViewModal] = useState(false);
  const [selectedProjectForFitView, setSelectedProjectForFitView] = useState(null);

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

  const progressMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        milestoneData: [],
        velocityData: [],
        progressBudgetCorrelation: [],
        progressDistribution: [],
        stagnantProjects: [],
        progressByAgency: [],
        progressByBudgetHead: [],
        progressByFrontier: [],
        completionForecast: [],
        progressTrend: [],
        criticalDelayedProjects: []
      };
    }

    // Milestone Analysis
    const milestones = [
      { milestone: 'Not Started', range: [0, 0], color: COLORS.progress.notStarted },
      { milestone: 'Foundation', range: [1, 25], color: COLORS.progress.foundation },
      { milestone: 'Structure', range: [26, 50], color: COLORS.progress.structure },
      { milestone: 'Finishing', range: [51, 75], color: COLORS.progress.finishing },
      { milestone: 'Final Stage', range: [76, 99], color: COLORS.progress.finalStage },
      { milestone: 'Completed', range: [100, 100], color: COLORS.progress.completed }
    ];

    const milestoneData = milestones.map(m => {
      const projects = data.filter(d => 
        d.physical_progress_percent >= m.range[0] && d.physical_progress_percent <= m.range[1]
      );
      
      return {
        ...m,
        projects: projects.length,
        budget: projects.reduce((sum, d) => sum + (d.sd_amount_lakh || 0), 0),
        avgDelay: projects.length > 0 
          ? projects.reduce((sum, d) => sum + (d.delay_days || 0), 0) / projects.length
          : 0,
        percentage: data.length ? ((projects.length / data.length) * 100).toFixed(1) : 0
      };
    });

    // Velocity Analysis (Progress Rate)
    const velocityData = data
      .filter(d => d.award_date && d.physical_progress_percent > 0)
      .map(d => {
        const startDate = new Date(d.award_date);
        const today = new Date();
        const daysElapsed = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
        const velocity = d.physical_progress_percent / daysElapsed;
        
        return {
          // Keep all original data fields
          ...d,
          // Add computed fields for display
          project: d.sub_scheme_name?.substring(0, 25) || d.name_of_scheme?.substring(0, 25) || 'Unknown',
          velocity: velocity.toFixed(3),
          progress: d.physical_progress_percent,
          daysElapsed,
          expectedCompletion: velocity > 0 ? Math.ceil((100 - d.physical_progress_percent) / velocity) : 999,
          status: velocity > 0.5 ? 'fast' : velocity > 0.2 ? 'normal' : velocity > 0.05 ? 'slow' : 'stalled',
          color: velocity > 0.5 ? COLORS.velocity.fast : 
                 velocity > 0.2 ? COLORS.velocity.normal : 
                 velocity > 0.05 ? COLORS.velocity.slow : COLORS.velocity.stalled,
          // Include location info
          ftr_hq: d.ftr_hq_name || 'N/A',
          shq: d.shq_name || 'N/A',
          work_site: d.location || 'N/A'
        };
      })
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 20);

    // Progress vs Budget Correlation
    const progressBudgetCorrelation = data
      .filter(d => d.sd_amount_lakh > 0)
      .slice(0, 100)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        x: d.physical_progress_percent,
        y: d.expenditure_percent || 0,
        z: d.sd_amount_lakh,
        name: d.sub_scheme_name?.substring(0, 20) || d.name_of_scheme?.substring(0, 20) || 'Unknown',
        risk: d.risk_level,
        fill: d.expenditure_percent > d.physical_progress_percent + 20 ? COLORS.correlation.inefficient :
              d.physical_progress_percent > d.expenditure_percent + 20 ? COLORS.correlation.efficient : 
              COLORS.correlation.normal
      }));

    // Progress Distribution
    const progressRanges = [
      { range: '0%', min: 0, max: 0 },
      { range: '1-20%', min: 1, max: 20 },
      { range: '21-40%', min: 21, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-99%', min: 81, max: 99 },
      { range: '100%', min: 100, max: 100 }
    ];

    const progressDistribution = progressRanges.map(range => ({
      ...range,
      count: data.filter(d => d.physical_progress_percent >= range.min && d.physical_progress_percent <= range.max).length,
      avgBudget: data
        .filter(d => d.physical_progress_percent >= range.min && d.physical_progress_percent <= range.max)
        .reduce((sum, d, _, arr) => sum + (d.sd_amount_lakh || 0) / arr.length, 0) || 0
    }));

    // Stagnant Projects
    const stagnantProjects = data
      .filter(d => d.physical_progress_percent > 0 && d.physical_progress_percent < 100 && d.delay_days > 60)
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.sub_scheme_name?.substring(0, 30) || d.name_of_scheme?.substring(0, 30) || 'Unknown',
        progress: d.physical_progress_percent,
        stuckDays: d.delay_days,
        budget: d.sd_amount_lakh.toFixed(2),
        agency: d.executive_agency || 'Unknown',
        risk: d.risk_level,
        ftr_hq: d.ftr_hq_name || 'N/A',
        shq: d.shq_name || 'N/A',
        work_site: d.location || 'N/A'
      }))
      .sort((a, b) => b.stuckDays - a.stuckDays)
      .slice(0, 15);

    // Critical Delayed Projects
    const criticalDelayedProjects = data
      .filter(d => d.delay_days > 30 && (d.risk_level === 'CRITICAL' || d.risk_level === 'HIGH'))
      .map(d => ({
        // Keep all original data fields
        ...d,
        // Add computed fields for display
        project: d.sub_scheme_name?.substring(0, 30) || d.name_of_scheme?.substring(0, 30) || 'Unknown',
        progress: d.physical_progress_percent,
        delayDays: d.delay_days,
        budget: d.sd_amount_lakh.toFixed(2),
        agency: d.executive_agency || 'Unknown',
        risk: d.risk_level,
        ftr_hq: d.ftr_hq_name || 'N/A',
        shq: d.shq_name || 'N/A',
        work_site: d.location || 'N/A',
        contractor: d.firm_name || 'N/A'
      }))
      .sort((a, b) => b.delayDays - a.delayDays)
      .slice(0, 10);

    // Progress by Agency
    const agencyProgress = {};
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencyProgress[agency]) {
        agencyProgress[agency] = {
          name: agency,
          totalProjects: 0,
          totalProgress: 0,
          completed: 0,
          onTrack: 0,
          delayed: 0,
          totalBudget: 0
        };
      }
      agencyProgress[agency].totalProjects++;
      agencyProgress[agency].totalProgress += d.physical_progress_percent || 0;
      agencyProgress[agency].totalBudget += (d.sd_amount_lakh || 0);
      if (d.physical_progress_percent >= 100) agencyProgress[agency].completed++;
      if (d.delay_days === 0 && d.physical_progress_percent > 0) agencyProgress[agency].onTrack++;
      if (d.delay_days > 0) agencyProgress[agency].delayed++;
    });

    const progressByAgency = Object.values(agencyProgress)
      .map(a => ({
        ...a,
        avgProgress: a.totalProjects ? (a.totalProgress / a.totalProjects).toFixed(1) : 0,
        completionRate: a.totalProjects ? ((a.completed / a.totalProjects) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgProgress - a.avgProgress)
      .slice(0, 10);

    // Progress by Frontier HQ
    const frontierProgress = {};
    data.forEach(d => {
      const frontier = d.ftr_hq_name || 'Unknown';
      if (!frontierProgress[frontier]) {
        frontierProgress[frontier] = {
          name: frontier,
          totalProjects: 0,
          totalProgress: 0,
          completed: 0,
          delayed: 0,
          totalBudget: 0,
          criticalProjects: 0
        };
      }
      frontierProgress[frontier].totalProjects++;
      frontierProgress[frontier].totalProgress += d.physical_progress_percent || 0;
      frontierProgress[frontier].totalBudget += (d.sd_amount_lakh || 0);
      if (d.physical_progress_percent >= 100) frontierProgress[frontier].completed++;
      if (d.delay_days > 0) frontierProgress[frontier].delayed++;
      if (d.risk_level === 'CRITICAL') frontierProgress[frontier].criticalProjects++;
    });

    const progressByFrontier = Object.values(frontierProgress)
      .map(f => ({
        ...f,
        avgProgress: f.totalProjects ? (f.totalProgress / f.totalProjects).toFixed(1) : 0,
        completionRate: f.totalProjects ? ((f.completed / f.totalProjects) * 100).toFixed(1) : 0,
        delayRate: f.totalProjects ? ((f.delayed / f.totalProjects) * 100).toFixed(1) : 0
      }))
      .filter(f => f.name !== 'Unknown' && f.totalProjects > 0)
      .sort((a, b) => b.totalProjects - a.totalProjects);

    // Progress by Budget Head
    const budgetHeadProgress = {};
    data.forEach(d => {
      const head = d.budget_head || 'Unspecified';
      if (!budgetHeadProgress[head]) {
        budgetHeadProgress[head] = {
          name: head,
          totalProjects: 0,
          totalProgress: 0,
          budget: 0
        };
      }
      budgetHeadProgress[head].totalProjects++;
      budgetHeadProgress[head].totalProgress += d.physical_progress_percent || 0;
      budgetHeadProgress[head].budget += (d.sd_amount_lakh || 0);
    });

    const progressByBudgetHead = Object.values(budgetHeadProgress)
      .map(h => ({
        ...h,
        avgProgress: h.totalProjects ? (h.totalProgress / h.totalProjects).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalProjects - a.totalProjects);

    // Completion Forecast (Next 6 months)
    const completionForecast = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      const expectedCompletions = data.filter(d => {
        if (d.physical_progress_percent >= 100) return false;
        const progressNeeded = 100 - d.physical_progress_percent;
        const monthsNeeded = progressNeeded / 10; // Assuming 10% progress per month
        return monthsNeeded <= i + 1 && monthsNeeded > i;
      }).length;
      
      completionForecast.push({
        month: monthKey,
        expected: expectedCompletions,
        cumulative: completionForecast.reduce((sum, f) => sum + f.expected, 0) + expectedCompletions
      });
    }

    // Progress Trend Analysis
    const progressTrend = [];
    const monthlyProgress = {};
    
    data.forEach(d => {
      if (d.award_date) {
        const date = new Date(d.award_date);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyProgress[monthKey]) {
            monthlyProgress[monthKey] = {
              month: monthKey,
              avgProgress: 0,
              totalProgress: 0,
              projects: 0
            };
          }
          monthlyProgress[monthKey].totalProgress += d.physical_progress_percent || 0;
          monthlyProgress[monthKey].projects++;
        }
      }
    });

    Object.values(monthlyProgress)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .forEach(item => {
        item.avgProgress = item.projects ? parseFloat((item.totalProgress / item.projects).toFixed(1)) : 0;
        progressTrend.push(item);
      });

    return {
      milestoneData,
      velocityData,
      progressBudgetCorrelation,
      progressDistribution,
      stagnantProjects,
      progressByAgency,
      progressByBudgetHead,
      progressByFrontier,
      completionForecast,
      progressTrend,
      criticalDelayedProjects
    };
  }, [data]);

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
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Milestone Progress */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Target size={18} className="text-blue-500" />
          Project Progress Milestones
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={progressMetrics.milestoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="milestone" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="projects" name="Projects">
                {progressMetrics.milestoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="avgDelay" stroke="#ef4444" name="Avg Delay (days)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <PieChartIcon size={16} className="text-purple-500" />
            Progress Distribution
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressMetrics.progressDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress vs Budget Efficiency */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity size={16} className="text-green-500" />
            Progress vs Budget Efficiency
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="x" name="Progress %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" name="Budget Used %" domain={[0, 120]} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter 
                  name="Projects" 
                  data={progressMetrics.progressBudgetCorrelation}
                  onClick={(data) => handleOpenFitView(data)}
                  style={{ cursor: 'pointer' }}
                >
                  {progressMetrics.progressBudgetCorrelation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Progress by Frontier HQ */}
      {progressMetrics.progressByFrontier.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <MapPin size={16} className="text-orange-500" />
            Progress by Frontier HQ
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={progressMetrics.progressByFrontier}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="totalProjects" fill="#3b82f6" name="Total Projects" />
                <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Completed" />
                <Bar yAxisId="left" dataKey="criticalProjects" fill="#ef4444" name="Critical" />
                <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#f59e0b" name="Avg Progress %" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Project Velocity Analysis */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Zap size={16} className="text-yellow-500" />
          Project Velocity (Progress Rate)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Project</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Progress</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Velocity (%/day)</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Frontier HQ</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Days to Complete</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {progressMetrics.velocityData.slice(0, 10).map((item, index) => (
                <tr 
                  key={index} 
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} cursor-pointer transition-colors`}
                  onClick={() => handleOpenFitView(item)}
                >
                  <td className="px-3 py-2 truncate max-w-[200px]">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.project}</p>
                      <p className="text-xs text-gray-500">{item.work_site}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{item.progress}%</span>
                      <div className="w-14 bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full bg-blue-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.velocity}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.ftr_hq}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                    {item.expectedCompletion < 999 ? item.expectedCompletion : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold`} style={{ 
                      backgroundColor: item.color + '20',
                      color: item.color
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFitView(item);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 mx-auto ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'
                      } transition-colors text-blue-600 dark:text-blue-400`}
                    >
                      <Calculator size={12} />
                      Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Delayed Projects */}
      {progressMetrics.criticalDelayedProjects.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            Critical Delayed Projects
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressMetrics.criticalDelayedProjects.slice(0, 6).map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  project.risk_level === 'CRITICAL' 
                    ? darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                    : darkMode ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'
                }`}
                onClick={() => handleOpenFitView(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold truncate flex-1 text-gray-900 dark:text-gray-100">{project.project}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                    project.risk_level === 'CRITICAL' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {project.risk}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={10} className="text-gray-500" />
                    <span className="truncate text-gray-600 dark:text-gray-400">{project.work_site}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 size={10} className="text-gray-500" />
                    <span className="truncate text-gray-600 dark:text-gray-400">FHQ: {project.ftr_hq} | SHQ: {project.shq}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users size={10} className="text-gray-500" />
                    <span className="truncate text-gray-600 dark:text-gray-400">{project.contractor}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">{project.progress}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Delay:</span>
                      <p className="font-semibold text-red-600">{project.delayDays}d</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">₹{project.budget}L</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                    <Eye size={10} className="mr-1" />
                    Click for detailed analytics
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stagnant Projects Alert */}
      {progressMetrics.stagnantProjects.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Clock size={16} className="text-yellow-500" />
            Stagnant Projects (Delayed &gt; 60 days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {progressMetrics.stagnantProjects.slice(0, 9).map((project, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                  darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                }`}
                onClick={() => handleOpenFitView(project)}
              >
                <p className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">{project.project}</p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  <MapPin size={10} className="inline mr-1" />
                  {project.work_site} | FHQ: {project.ftr_hq}
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Stuck for:</span>
                    <span className="font-medium text-red-600">{project.stuckDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">₹{project.budget} L</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                  <Calculator size={10} className="mr-1" />
                  View analytics
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Forecast */}
      {progressMetrics.completionForecast.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <TrendingUp size={16} className="text-green-500" />
            Completion Forecast (Next 6 Months)
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={progressMetrics.completionForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="expected" fill="#3b82f6" name="Expected Completions" />
                <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} name="Cumulative" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Progress by Agency */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building2 size={16} className="text-blue-500" />
          Progress by Executive Agency
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Agency</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Projects</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Avg Progress</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Completed</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">On Track</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Delayed</th>
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Budget (L)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {progressMetrics.progressByAgency.map((agency, index) => (
                <tr key={index} className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} transition-colors`}>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{agency.name}</td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{agency.totalProjects}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-semibold text-xs ${
                      agency.avgProgress > 75 ? 'text-green-600' :
                      agency.avgProgress > 50 ? 'text-blue-600' :
                      agency.avgProgress > 25 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {agency.avgProgress}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{agency.completed}</td>
                  <td className="px-3 py-2 text-center text-green-600">{agency.onTrack}</td>
                  <td className="px-3 py-2 text-center text-red-600">{agency.delayed}</td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">₹{agency.totalBudget.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

export default ProgressTracking;