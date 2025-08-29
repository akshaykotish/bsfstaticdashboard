import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  ComposedChart, ScatterChart, Scatter, PolarGrid,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PolarAngleAxis, PolarRadiusAxis,
  Cell, PieChart, Pie
} from 'recharts';
import {
  GitBranch, BarChart3, Target, TrendingUp,
  Users, Building2, IndianRupee, Clock,
  Award, AlertTriangle, Activity, Layers, Gauge,
} from 'lucide-react';

const COLORS = {
  comparison: ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899'],
  metrics: {
    primary: '#f97316',
    secondary: '#3b82f6',
    tertiary: '#10b981'
  },
  performance: {
    better: '#10b981',
    same: '#3b82f6',
    worse: '#ef4444'
  }
};

const Comparison = ({ data, darkMode, onChartClick, formatAmount, selectedProjects = [] }) => {
  const comparisonData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        budgetHeadComparison: [],
        agencyComparison: [],
        timelineComparison: [],
        performanceComparison: [],
        selectedProjectsComparison: [],
        riskComparison: [],
        efficiencyComparison: [],
        regionalComparison: []
      };
    }

    // Budget Head Comparison
    const budgetHeads = {};
    data.forEach(d => {
      const head = d.budget_head || 'Unspecified';
      if (!budgetHeads[head]) {
        budgetHeads[head] = {
          name: head,
          projects: 0,
          budget: 0,
          spent: 0,
          totalProgress: 0,
          totalEfficiency: 0,
          completed: 0,
          delayed: 0,
          critical: 0
        };
      }
      budgetHeads[head].projects++;
      budgetHeads[head].budget += (d.sanctioned_amount || 0) / 100;
      budgetHeads[head].spent += (d.total_expdr || 0) / 100;
      budgetHeads[head].totalProgress += d.physical_progress || 0;
      budgetHeads[head].totalEfficiency += d.efficiency_score || 0;
      if (d.physical_progress >= 100) budgetHeads[head].completed++;
      if (d.delay_days > 0) budgetHeads[head].delayed++;
      if (d.risk_level === 'CRITICAL') budgetHeads[head].critical++;
    });

    const budgetHeadComparison = Object.values(budgetHeads).map(h => ({
      ...h,
      avgProgress: h.projects ? (h.totalProgress / h.projects).toFixed(1) : 0,
      avgEfficiency: h.projects ? (h.totalEfficiency / h.projects).toFixed(1) : 0,
      completionRate: h.projects ? ((h.completed / h.projects) * 100).toFixed(1) : 0,
      delayRate: h.projects ? ((h.delayed / h.projects) * 100).toFixed(1) : 0,
      criticalRate: h.projects ? ((h.critical / h.projects) * 100).toFixed(1) : 0,
      utilization: h.budget ? ((h.spent / h.budget) * 100).toFixed(1) : 0
    }));

    // Agency Comparison
    const agencies = {};
    data.forEach(d => {
      const agency = d.executive_agency || 'Unknown';
      if (!agencies[agency]) {
        agencies[agency] = {
          name: agency,
          projects: 0,
          budget: 0,
          spent: 0,
          totalProgress: 0,
          totalEfficiency: 0,
          totalDelay: 0,
          completed: 0,
          onTrack: 0
        };
      }
      agencies[agency].projects++;
      agencies[agency].budget += (d.sanctioned_amount || 0) / 100;
      agencies[agency].spent += (d.total_expdr || 0) / 100;
      agencies[agency].totalProgress += d.physical_progress || 0;
      agencies[agency].totalEfficiency += d.efficiency_score || 0;
      agencies[agency].totalDelay += d.delay_days || 0;
      if (d.physical_progress >= 100) agencies[agency].completed++;
      if (d.delay_days === 0 && d.physical_progress > 0) agencies[agency].onTrack++;
    });

    const agencyComparison = Object.values(agencies)
      .map(a => ({
        ...a,
        avgProgress: a.projects ? (a.totalProgress / a.projects).toFixed(1) : 0,
        avgEfficiency: a.projects ? (a.totalEfficiency / a.projects).toFixed(1) : 0,
        avgDelay: a.projects ? (a.totalDelay / a.projects).toFixed(1) : 0,
        completionRate: a.projects ? ((a.completed / a.projects) * 100).toFixed(1) : 0,
        onTrackRate: a.projects ? ((a.onTrack / a.projects) * 100).toFixed(1) : 0,
        utilization: a.budget ? ((a.spent / a.budget) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 10);

    // Timeline Comparison (by quarters/years)
    const timelineData = {};
    data.forEach(d => {
      if (d.date_award) {
        const date = new Date(d.date_award);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const key = `${year}-Q${quarter}`;
        
        if (!timelineData[key]) {
          timelineData[key] = {
            period: key,
            projects: 0,
            budget: 0,
            avgProgress: 0,
            totalProgress: 0,
            completed: 0,
            delayed: 0
          };
        }
        timelineData[key].projects++;
        timelineData[key].budget += (d.sanctioned_amount || 0) / 100;
        timelineData[key].totalProgress += d.physical_progress || 0;
        if (d.physical_progress >= 100) timelineData[key].completed++;
        if (d.delay_days > 0) timelineData[key].delayed++;
      }
    });

    const timelineComparison = Object.values(timelineData)
      .map(t => ({
        ...t,
        avgProgress: t.projects ? (t.totalProgress / t.projects).toFixed(1) : 0,
        completionRate: t.projects ? ((t.completed / t.projects) * 100).toFixed(1) : 0,
        delayRate: t.projects ? ((t.delayed / t.projects) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-8); // Last 8 quarters

    // Performance Comparison Metrics
    const performanceMetrics = ['Progress', 'Efficiency', 'Timeline', 'Budget', 'Quality'];
    const performanceComparison = performanceMetrics.map(metric => {
      const dataPoint = { metric };
      
      // Add data for each budget head
      budgetHeadComparison.slice(0, 4).forEach(head => {
        switch(metric) {
          case 'Progress':
            dataPoint[head.name] = parseFloat(head.avgProgress);
            break;
          case 'Efficiency':
            dataPoint[head.name] = parseFloat(head.avgEfficiency);
            break;
          case 'Timeline':
            dataPoint[head.name] = 100 - parseFloat(head.delayRate);
            break;
          case 'Budget':
            dataPoint[head.name] = parseFloat(head.utilization);
            break;
          case 'Quality':
            dataPoint[head.name] = 100 - parseFloat(head.criticalRate);
            break;
        }
      });
      
      return dataPoint;
    });

    // Selected Projects Comparison (if in compare mode)
    const selectedProjectsComparison = selectedProjects.map(project => ({
      name: project.scheme_name?.substring(0, 20) || 'Unknown',
      progress: project.physical_progress || 0,
      efficiency: project.efficiency_score || 0,
      budgetUsed: project.percent_expdr || 0,
      delay: project.delay_days || 0,
      budget: (project.sanctioned_amount / 100).toFixed(2),
      risk: project.risk_level || 'LOW'
    }));

    // Risk Level Comparison
    const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const riskComparison = riskLevels.map(level => {
      const projects = data.filter(d => d.risk_level === level);
      return {
        level,
        count: projects.length,
        avgProgress: projects.length ? 
          (projects.reduce((sum, p) => sum + (p.physical_progress || 0), 0) / projects.length).toFixed(1) : 0,
        avgDelay: projects.length ?
          (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(1) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sanctioned_amount || 0), 0) / 100
      };
    });

    // Efficiency Comparison
    const efficiencyRanges = [
      { range: '0-40%', min: 0, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-100%', min: 81, max: 100 }
    ];

    const efficiencyComparison = efficiencyRanges.map(range => {
      const projects = data.filter(d => 
        d.efficiency_score >= range.min && d.efficiency_score <= range.max
      );
      return {
        ...range,
        projects: projects.length,
        avgProgress: projects.length ?
          (projects.reduce((sum, p) => sum + (p.physical_progress || 0), 0) / projects.length).toFixed(1) : 0,
        totalBudget: projects.reduce((sum, p) => sum + (p.sanctioned_amount || 0), 0) / 100,
        avgDelay: projects.length ?
          (projects.reduce((sum, p) => sum + (p.delay_days || 0), 0) / projects.length).toFixed(1) : 0
      };
    });

    // Regional Comparison (by work site)
    const regions = {};
    data.forEach(d => {
      const region = d.work_site?.split(',')[0]?.trim() || 'Unknown';
      if (!regions[region]) {
        regions[region] = {
          region,
          projects: 0,
          budget: 0,
          totalProgress: 0,
          completed: 0,
          delayed: 0
        };
      }
      regions[region].projects++;
      regions[region].budget += (d.sanctioned_amount || 0) / 100;
      regions[region].totalProgress += d.physical_progress || 0;
      if (d.physical_progress >= 100) regions[region].completed++;
      if (d.delay_days > 0) regions[region].delayed++;
    });

    const regionalComparison = Object.values(regions)
      .map(r => ({
        ...r,
        avgProgress: r.projects ? (r.totalProgress / r.projects).toFixed(1) : 0,
        completionRate: r.projects ? ((r.completed / r.projects) * 100).toFixed(1) : 0,
        delayRate: r.projects ? ((r.delayed / r.projects) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 10);

    return {
      budgetHeadComparison,
      agencyComparison,
      timelineComparison,
      performanceComparison,
      selectedProjectsComparison,
      riskComparison,
      efficiencyComparison,
      regionalComparison
    };
  }, [data, selectedProjects]);

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
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Comparative Overview */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <GitBranch size={20} className="text-orange-500" />
          Comparative Analysis Dashboard
        </h3>
        
        {/* Budget Head Comparison */}
        <div className="mb-6">
          <h4 className="text-base font-semibold mb-3">Budget Head Performance Comparison</h4>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData.budgetHeadComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="projects" fill="#3b82f6" name="Projects" />
                <Bar yAxisId="left" dataKey="budget" fill="#10b981" name="Budget (Cr)" />
                <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#f97316" name="Avg Progress %" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgEfficiency" stroke="#a855f7" name="Avg Efficiency %" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar Comparison */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-500" />
            Multi-Dimensional Performance Comparison
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={comparisonData.performanceComparison}>
                <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {comparisonData.budgetHeadComparison.slice(0, 4).map((head, index) => (
                  <Radar
                    key={head.name}
                    name={head.name}
                    dataKey={head.name}
                    stroke={COLORS.comparison[index]}
                    fill={COLORS.comparison[index]}
                    fillOpacity={0.3}
                  />
                ))}
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agency Comparison */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Agency Performance Comparison
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData.agencyComparison.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgProgress" fill="#3b82f6" name="Avg Progress %" />
                <Bar dataKey="avgEfficiency" fill="#10b981" name="Avg Efficiency %" />
                <Bar dataKey="onTrackRate" fill="#f97316" name="On Track Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timeline Comparison */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-green-500" />
          Quarterly Performance Trend Comparison
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={comparisonData.timelineComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="projects" fill="#3b82f6" name="Projects Started" />
              <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#10b981" name="Avg Progress %" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="completionRate" stroke="#f97316" name="Completion Rate %" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="delayRate" stroke="#ef4444" name="Delay Rate %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Comparison */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Risk Level Comparison
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData.riskComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ef4444" name="Projects" />
                <Bar dataKey="avgProgress" fill="#3b82f6" name="Avg Progress %" />
                <Bar dataKey="avgDelay" fill="#f59e0b" name="Avg Delay (days)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Range Comparison */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-purple-500" />
            Efficiency Range Analysis
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData.efficiencyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="projects" fill="#8b5cf6" name="Projects" />
                <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#10b981" name="Avg Progress %" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgDelay" stroke="#ef4444" name="Avg Delay (days)" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Projects Comparison (if any selected) */}
      {selectedProjects.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Layers size={18} className="text-indigo-500" />
            Selected Projects Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-4 py-2 text-left">Project</th>
                  <th className="px-4 py-2 text-center">Progress %</th>
                  <th className="px-4 py-2 text-center">Efficiency %</th>
                  <th className="px-4 py-2 text-center">Budget Used %</th>
                  <th className="px-4 py-2 text-center">Delay (days)</th>
                  <th className="px-4 py-2 text-center">Budget (Cr)</th>
                  <th className="px-4 py-2 text-center">Risk</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {comparisonData.selectedProjectsComparison.map((project, index) => (
                  <tr key={index} className={`hover:${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                    <td className="px-4 py-2 truncate max-w-[200px]">{project.name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-medium ${
                        project.progress >= 75 ? 'text-green-600' :
                        project.progress >= 50 ? 'text-blue-600' :
                        project.progress >= 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {project.progress}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{project.efficiency}%</td>
                    <td className="px-4 py-2 text-center">{project.budgetUsed}%</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-medium ${
                        project.delay === 0 ? 'text-green-600' :
                        project.delay <= 30 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {project.delay}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">₹{project.budget}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        project.risk === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        project.risk === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        project.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regional Comparison */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-cyan-500" />
          Regional Performance Comparison
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData.regionalComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="projects" fill="#06b6d4" name="Projects" />
              <Bar dataKey="avgProgress" fill="#3b82f6" name="Avg Progress %" />
              <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Comparison;