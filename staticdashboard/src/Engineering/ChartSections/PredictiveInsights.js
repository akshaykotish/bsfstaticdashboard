import React, { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ComposedChart, ScatterChart, Scatter, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, RadialBarChart, RadialBar
} from 'recharts';
import {
  Activity, TrendingUp, Target, AlertTriangle,
  Brain, Zap, Calendar, Clock,
  IndianRupee, CheckCircle, AlertCircle, Lightbulb
} from 'lucide-react';

const COLORS = {
  prediction: {
    optimistic: '#10b981',
    realistic: '#3b82f6',
    pessimistic: '#ef4444'
  },
  risk: {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  },
  trend: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
};

const PredictiveInsights = ({ data, darkMode, onChartClick, formatAmount }) => {
  const predictions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        completionForecast: [],
        budgetProjection: [],
        riskPrediction: [],
        delayPrediction: [],
        resourceRequirements: [],
        performanceTrends: [],
        criticalPathAnalysis: [],
        recommendations: []
      };
    }

    // Filter and clean data
    const cleanData = data.filter(d => d && d.sanctioned_amount !== undefined);
    
    // Completion Forecast - Changed to use LineChart instead of stacked AreaChart
    const completionForecast = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      const projectsInProgress = cleanData.filter(d => {
        const progress = parseFloat(d.physical_progress) || 0;
        return progress > 0 && progress < 100;
      });
      
      let optimisticCount = 0;
      let realisticCount = 0;
      let pessimisticCount = 0;
      
      projectsInProgress.forEach(project => {
        const currentProgress = parseFloat(project.physical_progress) || 0;
        let velocity = 10;
        
        if (project.date_award) {
          try {
            const startDate = new Date(project.date_award);
            if (!isNaN(startDate.getTime())) {
              const monthsElapsed = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30)));
              velocity = currentProgress / monthsElapsed;
            }
          } catch (e) {
            // Use default velocity if date parsing fails
          }
        }
        
        const optimisticProgress = currentProgress + (velocity * 1.5 * (i + 1));
        if (optimisticProgress >= 100 && currentProgress + (velocity * 1.5 * i) < 100) {
          optimisticCount++;
        }
        
        const realisticProgress = currentProgress + (velocity * (i + 1));
        if (realisticProgress >= 100 && currentProgress + (velocity * i) < 100) {
          realisticCount++;
        }
        
        const pessimisticProgress = currentProgress + (velocity * 0.5 * (i + 1));
        if (pessimisticProgress >= 100 && currentProgress + (velocity * 0.5 * i) < 100) {
          pessimisticCount++;
        }
      });
      
      completionForecast.push({
        month: monthKey,
        optimistic: optimisticCount,
        realistic: realisticCount,
        pessimistic: pessimisticCount
      });
    }

    // Budget Projection
    const totalBudget = cleanData.reduce((sum, d) => sum + (parseFloat(d.sanctioned_amount) || 0), 0) / 100;
    const currentSpent = cleanData.reduce((sum, d) => sum + (parseFloat(d.total_expdr) || 0), 0) / 100;
    const currentUtilization = totalBudget > 0 ? (currentSpent / totalBudget) * 100 : 0;
    
    const budgetProjection = [];
    const activeProjects = cleanData.filter(d => {
      const progress = parseFloat(d.physical_progress) || 0;
      return progress < 100;
    });
    
    let avgMonthlyBurn = totalBudget * 0.05;
    if (activeProjects.length > 0) {
      const totalMonthlyBurn = activeProjects.reduce((sum, d) => {
        if (d.date_award && d.total_expdr) {
          try {
            const startDate = new Date(d.date_award);
            if (!isNaN(startDate.getTime())) {
              const months = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30)));
              return sum + (parseFloat(d.total_expdr) || 0) / months;
            }
          } catch (e) {
            // Skip if date parsing fails
          }
        }
        return sum;
      }, 0);
      
      if (totalMonthlyBurn > 0) {
        avgMonthlyBurn = totalMonthlyBurn / activeProjects.length / 100;
      }
    }
    
    for (let i = 0; i < 12; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      budgetProjection.push({
        month: monthKey,
        allocated: totalBudget,
        current: currentSpent,
        optimistic: Math.min(totalBudget, currentSpent + (avgMonthlyBurn * 0.8 * (i + 1))),
        realistic: Math.min(totalBudget * 1.1, currentSpent + (avgMonthlyBurn * (i + 1))),
        pessimistic: Math.min(totalBudget * 1.2, currentSpent + (avgMonthlyBurn * 1.3 * (i + 1)))
      });
    }

    // Risk Prediction
    const riskPrediction = [];
    
    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      
      cleanData.forEach(project => {
        const progress = parseFloat(project.physical_progress) || 0;
        if (progress >= 100) {
          lowRisk++;
          return;
        }
        
        const currentDelay = parseFloat(project.delay_days) || 0;
        const additionalDelay = i * 15;
        const projectedDelay = currentDelay + additionalDelay;
        const projectedProgress = Math.min(100, progress + (5 * (i + 1)));
        
        if (projectedDelay > 90 || (projectedProgress < 50 && i > 3)) {
          highRisk++;
        } else if (projectedDelay > 45 || projectedProgress < 70) {
          mediumRisk++;
        } else {
          lowRisk++;
        }
      });
      
      riskPrediction.push({
        month: monthKey,
        high: highRisk,
        medium: mediumRisk,
        low: lowRisk,
        total: cleanData.length
      });
    }

    // Delay Prediction
    const delayPrediction = [];
    const delayedProjects = cleanData.filter(d => (parseFloat(d.delay_days) || 0) > 0);
    const avgDelayIncrease = delayedProjects.length > 0
      ? delayedProjects.reduce((sum, d) => {
          const delay = parseFloat(d.delay_days) || 0;
          const progress = Math.max(1, parseFloat(d.physical_progress) || 1);
          return sum + (delay / progress);
        }, 0) / delayedProjects.length
      : 0;
    
    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      const currentDelayed = delayedProjects.length;
      const projectedDelayed = Math.min(
        cleanData.length,
        currentDelayed + Math.floor(cleanData.length * 0.02 * (i + 1))
      );
      
      const avgCurrentDelay = currentDelayed > 0
        ? delayedProjects.reduce((sum, d) => sum + (parseFloat(d.delay_days) || 0), 0) / currentDelayed
        : 0;
      
      delayPrediction.push({
        month: monthKey,
        delayedProjects: projectedDelayed,
        avgDelay: avgCurrentDelay + (avgDelayIncrease * (i + 1)),
        criticalDelays: cleanData.filter(d => ((parseFloat(d.delay_days) || 0) + (i * 20)) > 120).length
      });
    }

    // Resource Requirements Prediction
    const resourceRequirements = [];
    const avgResourcePerProject = cleanData.length > 0 ? totalBudget / cleanData.length : 0;
    
    for (let i = 0; i < 6; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      const activeProjectsCount = cleanData.filter(d => {
        const progress = parseFloat(d.physical_progress) || 0;
        const projectedProgress = progress + (5 * (i + 1));
        return projectedProgress < 100 && projectedProgress > 0;
      }).length;
      
      resourceRequirements.push({
        month: monthKey,
        fundingNeeded: activeProjectsCount * avgResourcePerProject * 0.1,
        manpowerNeeded: Math.ceil(activeProjectsCount / 5),
        equipmentNeeded: Math.ceil(activeProjectsCount / 10),
        activeProjects: activeProjectsCount
      });
    }

    // Performance Trends
    const performanceTrends = [];
    const basePerformance = {
      avgProgress: cleanData.length > 0 
        ? cleanData.reduce((sum, d) => sum + (parseFloat(d.physical_progress) || 0), 0) / cleanData.length
        : 0,
      avgEfficiency: cleanData.length > 0
        ? cleanData.reduce((sum, d) => sum + (parseFloat(d.efficiency_score) || 0), 0) / cleanData.length
        : 0,
      completionRate: cleanData.length > 0
        ? (cleanData.filter(d => (parseFloat(d.physical_progress) || 0) >= 100).length / cleanData.length) * 100
        : 0
    };
    
    for (let i = 0; i < 12; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      const progressTrend = 1.02;
      const efficiencyTrend = 1.01;
      
      performanceTrends.push({
        month: monthKey,
        avgProgress: Math.min(100, basePerformance.avgProgress * Math.pow(progressTrend, i + 1)),
        avgEfficiency: Math.min(100, basePerformance.avgEfficiency * Math.pow(efficiencyTrend, i + 1)),
        projectedCompletion: Math.min(100, basePerformance.completionRate + (3 * (i + 1)))
      });
    }

    // Critical Path Analysis
    const criticalPathAnalysis = cleanData
      .filter(d => {
        const riskLevel = d.risk_level || '';
        const delay = parseFloat(d.delay_days) || 0;
        return riskLevel === 'CRITICAL' || delay > 60;
      })
      .map(d => ({
        ...d,
        project: d.scheme_name?.substring(0, 30) || 'Unknown',
        currentProgress: parseFloat(d.physical_progress) || 0,
        currentDelay: parseFloat(d.delay_days) || 0,
        budget: (parseFloat(d.sanctioned_amount) || 0) / 100,
        predictedCompletion: (parseFloat(d.physical_progress) || 0) < 100 
          ? Math.ceil((100 - (parseFloat(d.physical_progress) || 0)) / 5) 
          : 0,
        riskScore: (
          ((parseFloat(d.delay_days) || 0) * 0.3) +
          (100 - (parseFloat(d.physical_progress) || 0)) * 0.3 +
          (d.risk_level === 'CRITICAL' ? 100 : d.risk_level === 'HIGH' ? 70 : 40) * 0.4
        ).toFixed(1),
        intervention: (parseFloat(d.delay_days) || 0) > 90 ? 'Immediate' : 
                     (parseFloat(d.delay_days) || 0) > 60 ? 'Urgent' : 
                     d.risk_level === 'CRITICAL' ? 'Priority' : 'Monitor'
      }))
      .sort((a, b) => parseFloat(b.riskScore) - parseFloat(a.riskScore))
      .slice(0, 10);

    // AI-Generated Recommendations
    const recommendations = [];
    
    if (currentUtilization < 50) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: 'Accelerate Fund Disbursement',
        description: `Only ${currentUtilization.toFixed(1)}% of budget utilized. Consider streamlining approval processes.`,
        impact: 'Could improve project velocity by 20-30%',
        icon: IndianRupee
      });
    }
    
    const delayedPercent = cleanData.length > 0
      ? (cleanData.filter(d => (parseFloat(d.delay_days) || 0) > 0).length / cleanData.length) * 100
      : 0;
    
    if (delayedPercent > 30) {
      recommendations.push({
        type: 'timeline',
        priority: 'high',
        title: 'Address Systematic Delays',
        description: `${delayedPercent.toFixed(1)}% of projects are delayed. Root cause analysis needed.`,
        impact: 'Could reduce average delays by 40-50 days',
        icon: Clock
      });
    }
    
    const criticalPercent = cleanData.length > 0
      ? (cleanData.filter(d => d.risk_level === 'CRITICAL').length / cleanData.length) * 100
      : 0;
    
    if (criticalPercent > 15) {
      recommendations.push({
        type: 'risk',
        priority: 'critical',
        title: 'Critical Risk Mitigation',
        description: `${criticalPercent.toFixed(1)}% projects in critical state. Immediate intervention required.`,
        impact: 'Could prevent 5-10 project failures',
        icon: AlertTriangle
      });
    }
    
    const avgEfficiency = cleanData.length > 0
      ? cleanData.reduce((sum, d) => sum + (parseFloat(d.efficiency_score) || 0), 0) / cleanData.length
      : 0;
    
    if (avgEfficiency < 60) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        title: 'Improve Operational Efficiency',
        description: `Average efficiency at ${avgEfficiency.toFixed(1)}%. Process optimization needed.`,
        impact: 'Could improve delivery time by 15-20%',
        icon: Zap
      });
    }
    
    const resourceStrained = cleanData.filter(d => {
      const progress = parseFloat(d.physical_progress) || 0;
      const delay = parseFloat(d.delay_days) || 0;
      return progress < 50 && delay > 30;
    }).length;
    
    if (resourceStrained > cleanData.length * 0.2) {
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        title: 'Resource Reallocation Required',
        description: `${resourceStrained} projects showing resource constraints.`,
        impact: 'Could accelerate 10-15 projects',
        icon: Target
      });
    }

    return {
      completionForecast,
      budgetProjection,
      riskPrediction,
      delayPrediction,
      resourceRequirements,
      performanceTrends,
      criticalPathAnalysis,
      recommendations
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
              <span className="font-semibold">{
                typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value
              }</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendations */}
      {predictions.recommendations.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain size={18} className="text-purple-500" />
            AI-Powered Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  darkMode ? 'bg-gray-900' : 'bg-gray-50'
                } ${
                  rec.priority === 'critical' ? 'border-red-500' :
                  rec.priority === 'high' ? 'border-orange-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <rec.icon size={16} className={
                      rec.priority === 'critical' ? 'text-red-500' :
                      rec.priority === 'high' ? 'text-orange-500' :
                      'text-blue-500'
                    } />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">{rec.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{rec.description}</p>
                    <p className="text-xs font-medium text-green-600">
                      Impact: {rec.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Forecast - Using LineChart instead of AreaChart */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Target size={16} className="text-blue-500" />
          12-Month Completion Forecast
        </h3>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions.completionForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line 
                type="monotone" 
                dataKey="optimistic" 
                stroke={COLORS.prediction.optimistic} 
                strokeWidth={2}
                name="Optimistic" 
              />
              <Line 
                type="monotone" 
                dataKey="realistic" 
                stroke={COLORS.prediction.realistic} 
                strokeWidth={2}
                name="Realistic" 
              />
              <Line 
                type="monotone" 
                dataKey="pessimistic" 
                stroke={COLORS.prediction.pessimistic} 
                strokeWidth={2}
                name="Pessimistic" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Projection */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <IndianRupee size={16} className="text-green-500" />
            Budget Utilization Projection
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions.budgetProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="allocated" stroke="#6b7280" strokeDasharray="5 5" name="Allocated" />
                <Line type="monotone" dataKey="optimistic" stroke={COLORS.prediction.optimistic} name="Optimistic" strokeWidth={2} />
                <Line type="monotone" dataKey="realistic" stroke={COLORS.prediction.realistic} name="Realistic" strokeWidth={2} />
                <Line type="monotone" dataKey="pessimistic" stroke={COLORS.prediction.pessimistic} name="Pessimistic" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Prediction - Also using LineChart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            Risk Level Prediction
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions.riskPrediction}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="low" stroke={COLORS.risk.low} name="Low Risk" strokeWidth={2} />
                <Line type="monotone" dataKey="medium" stroke={COLORS.risk.medium} name="Medium Risk" strokeWidth={2} />
                <Line type="monotone" dataKey="high" stroke={COLORS.risk.high} name="High Risk" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <TrendingUp size={16} className="text-purple-500" />
          Performance Trend Projection
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions.performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="avgProgress" stroke="#3b82f6" name="Avg Progress %" strokeWidth={2} />
              <Line type="monotone" dataKey="avgEfficiency" stroke="#10b981" name="Avg Efficiency %" strokeWidth={2} />
              <Line type="monotone" dataKey="projectedCompletion" stroke="#8b5cf6" name="Completion Rate %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Path Analysis */}
      {predictions.criticalPathAnalysis.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity size={16} className="text-red-500" />
            Critical Path Projects
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Project</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Progress</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Delay</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Budget (Cr)</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Risk Score</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Months to Complete</th>
                  <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {predictions.criticalPathAnalysis.map((project, index) => (
                  <tr 
                    key={index}
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} cursor-pointer`}
                    onClick={() => onChartClick(project, 'project')}
                  >
                    <td className="px-3 py-2 truncate max-w-[200px] text-gray-900 dark:text-gray-100">{project.project}</td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{project.currentProgress}%</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-red-600 font-medium">{project.currentDelay} days</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">₹{project.budget.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${
                        parseFloat(project.riskScore) > 70 ? 'text-red-600' :
                        parseFloat(project.riskScore) > 50 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {project.riskScore}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{project.predictedCompletion}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        project.intervention === 'Immediate' ? 'bg-red-100 text-red-700' :
                        project.intervention === 'Urgent' ? 'bg-orange-100 text-orange-700' :
                        project.intervention === 'Priority' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {project.intervention}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resource Requirements */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Zap size={16} className="text-yellow-500" />
          Projected Resource Requirements
        </h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={predictions.resourceRequirements}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="activeProjects" fill="#3b82f6" name="Active Projects" />
              <Line yAxisId="right" type="monotone" dataKey="fundingNeeded" stroke="#10b981" name="Funding (Cr)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="manpowerNeeded" stroke="#8b5cf6" name="Teams Required" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PredictiveInsights;