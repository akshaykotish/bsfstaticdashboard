import React, { useState, useEffect } from 'react';
import {
  Zap, X, AlertCircle, TrendingUp, Shield, Clock,
  DollarSign, Users, Target, Lightbulb, ChevronRight,
  Brain, Sparkles, Info, CheckCircle, XCircle
} from 'lucide-react';

const AISuggestions = ({ metrics, filteredData, darkMode, onClose, onAction }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [metrics, filteredData]);

  const generateSuggestions = () => {
    const newSuggestions = [];

    // Critical Projects Alert
    if (metrics.criticalRate > 20) {
      newSuggestions.push({
        id: 'critical-alert',
        type: 'alert',
        priority: 'high',
        icon: AlertCircle,
        color: 'red',
        title: 'High Critical Project Rate',
        description: `${metrics.critical} projects (${metrics.criticalRate}%) are in critical state`,
        insights: [
          `Most critical projects have delays exceeding ${Math.round(filteredData.filter(d => d.risk_level === 'CRITICAL').reduce((sum, d) => sum + d.delay_days, 0) / metrics.critical)} days`,
          `Average efficiency of critical projects is ${(filteredData.filter(d => d.risk_level === 'CRITICAL').reduce((sum, d) => sum + d.efficiency_score, 0) / metrics.critical).toFixed(1)}%`
        ],
        recommendations: [
          'Immediate intervention required for resource reallocation',
          'Schedule emergency review meetings with contractors',
          'Consider fast-track approval processes'
        ],
        actions: [
          {
            label: 'View Critical Projects',
            action: () => onAction({
              type: 'filter',
              filter: { riskLevel: 'CRITICAL' },
              message: 'Filtered to show critical projects'
            })
          },
          {
            label: 'Risk Analysis',
            action: () => onAction({
              type: 'tab',
              tab: 'risk',
              message: 'Switched to risk analysis view'
            })
          }
        ]
      });
    }

    // Delay Pattern Detection
    if (metrics.delayRate > 30) {
      const avgDelay = filteredData.filter(d => d.delay_days > 0)
        .reduce((sum, d) => sum + d.delay_days, 0) / metrics.delayed;
      
      newSuggestions.push({
        id: 'delay-pattern',
        type: 'warning',
        priority: 'medium',
        icon: Clock,
        color: 'orange',
        title: 'Significant Project Delays',
        description: `${metrics.delayed} projects (${metrics.delayRate}%) are experiencing delays`,
        insights: [
          `Average delay is ${avgDelay.toFixed(0)} days`,
          `${filteredData.filter(d => d.delay_days > 90).length} projects delayed by more than 90 days`,
          `Estimated cost impact: ₹${(metrics.delayed * 0.05 * metrics.totalSanctionedCr / metrics.totalProjects).toFixed(2)} Cr`
        ],
        recommendations: [
          'Review contractor performance metrics',
          'Implement weekly progress monitoring',
          'Consider penalty clauses activation'
        ],
        actions: [
          {
            label: 'View Delayed Projects',
            action: () => onAction({
              type: 'filter',
              filter: { delayRange: [1, 365] },
              message: 'Filtered to show delayed projects'
            })
          },
          {
            label: 'Timeline Analysis',
            action: () => onAction({
              type: 'tab',
              tab: 'timeline',
              message: 'Switched to timeline view'
            })
          }
        ]
      });
    }

    // Budget Utilization
    if (metrics.utilizationRate < 60) {
      newSuggestions.push({
        id: 'budget-util',
        type: 'info',
        priority: 'medium',
        icon: DollarSign,
        color: 'blue',
        title: 'Low Budget Utilization',
        description: `Only ${metrics.utilizationRate}% of sanctioned budget utilized`,
        insights: [
          `₹${metrics.remainingBudgetCr.toFixed(2)} Cr available for disbursement`,
          `Current spending rate: ₹${(metrics.totalExpenditureCr / 12).toFixed(2)} Cr/month`,
          `At current rate, full utilization in ${(metrics.remainingBudgetCr / (metrics.totalExpenditureCr / 12)).toFixed(0)} months`
        ],
        recommendations: [
          'Accelerate fund disbursement process',
          'Review and clear pending invoices',
          'Identify bottlenecks in payment approvals'
        ],
        actions: [
          {
            label: 'Budget Analysis',
            action: () => onAction({
              type: 'tab',
              tab: 'budget',
              message: 'Switched to budget analysis'
            })
          }
        ]
      });
    }

    // Efficiency Optimization
    if (metrics.avgEfficiency < 70) {
      newSuggestions.push({
        id: 'efficiency-opt',
        type: 'optimization',
        priority: 'medium',
        icon: Target,
        color: 'purple',
        title: 'Efficiency Improvement Opportunity',
        description: `Average project efficiency at ${metrics.avgEfficiency}%`,
        insights: [
          `${filteredData.filter(d => d.efficiency_score < 50).length} projects below 50% efficiency`,
          `Top performing agencies averaging ${Math.max(...Object.values(
            filteredData.reduce((acc, d) => {
              if (!acc[d.executive_agency]) acc[d.executive_agency] = [];
              acc[d.executive_agency].push(d.efficiency_score);
              return acc;
            }, {})
          ).map(scores => scores.reduce((a, b) => a + b, 0) / scores.length)).toFixed(1)}% efficiency`
        ],
        recommendations: [
          'Implement best practices from top performers',
          'Conduct efficiency audits for underperforming projects',
          'Provide additional training and resources'
        ],
        actions: [
          {
            label: 'Low Efficiency Projects',
            action: () => onAction({
              type: 'filter',
              filter: { efficiencyRange: [0, 50] },
              message: 'Filtered to show low efficiency projects'
            })
          }
        ]
      });
    }

    // Success Stories
    if (metrics.completionRate > 70) {
      newSuggestions.push({
        id: 'success-story',
        type: 'success',
        priority: 'low',
        icon: CheckCircle,
        color: 'green',
        title: 'Strong Completion Performance',
        description: `${metrics.completionRate}% projects successfully completed`,
        insights: [
          `${metrics.completed} projects delivered`,
          `Average completion efficiency: ${(filteredData.filter(d => d.physical_progress >= 100).reduce((sum, d) => sum + d.efficiency_score, 0) / metrics.completed).toFixed(1)}%`,
          `On-time completion rate: ${((metrics.completed - filteredData.filter(d => d.physical_progress >= 100 && d.delay_days > 0).length) / metrics.completed * 100).toFixed(1)}%`
        ],
        recommendations: [
          'Document and share best practices',
          'Recognize high-performing teams',
          'Apply success factors to ongoing projects'
        ],
        actions: [
          {
            label: 'View Completed Projects',
            action: () => onAction({
              type: 'filter',
              filter: { status: 'COMPLETED' },
              message: 'Filtered to show completed projects'
            })
          }
        ]
      });
    }

    // Agency Performance Variance
    const agencyPerformance = {};
    filteredData.forEach(d => {
      if (!agencyPerformance[d.executive_agency]) {
        agencyPerformance[d.executive_agency] = { total: 0, progress: 0 };
      }
      agencyPerformance[d.executive_agency].total++;
      agencyPerformance[d.executive_agency].progress += d.physical_progress;
    });

    const agencyAvgs = Object.entries(agencyPerformance)
      .map(([agency, data]) => ({
        agency,
        avg: data.progress / data.total,
        count: data.total
      }))
      .filter(a => a.count > 5)
      .sort((a, b) => b.avg - a.avg);

    if (agencyAvgs.length > 0 && agencyAvgs[0].avg - agencyAvgs[agencyAvgs.length - 1].avg > 30) {
      newSuggestions.push({
        id: 'agency-variance',
        type: 'insight',
        priority: 'low',
        icon: Users,
        color: 'indigo',
        title: 'High Agency Performance Variance',
        description: 'Significant performance differences between agencies detected',
        insights: [
          `Top agency: ${agencyAvgs[0].agency} at ${agencyAvgs[0].avg.toFixed(1)}% avg progress`,
          `Bottom agency: ${agencyAvgs[agencyAvgs.length - 1].agency} at ${agencyAvgs[agencyAvgs.length - 1].avg.toFixed(1)}% avg progress`,
          `Performance gap: ${(agencyAvgs[0].avg - agencyAvgs[agencyAvgs.length - 1].avg).toFixed(1)}%`
        ],
        recommendations: [
          'Pair underperforming agencies with top performers',
          'Conduct performance reviews and capability assessments',
          'Implement standardized project management practices'
        ],
        actions: [
          {
            label: 'Agency Comparison',
            action: () => onAction({
              type: 'tab',
              tab: 'agency',
              message: 'Switched to agency performance view'
            })
          }
        ]
      });
    }

    // Predictive Alert
    const projectedCompletions = filteredData.filter(d => 
      d.physical_progress > 70 && d.physical_progress < 100
    ).length;

    if (projectedCompletions > 0) {
      newSuggestions.push({
        id: 'predictive',
        type: 'prediction',
        priority: 'low',
        icon: Brain,
        color: 'cyan',
        title: 'Upcoming Completions Forecast',
        description: `${projectedCompletions} projects likely to complete in next quarter`,
        insights: [
          `Estimated budget release: ₹${(projectedCompletions * metrics.totalSanctionedCr / metrics.totalProjects * 0.2).toFixed(2)} Cr`,
          `Resource availability for new projects: ${Math.round(projectedCompletions * 0.7)} teams`,
          `Expected completion rate improvement: ${((metrics.completionRate + (projectedCompletions / metrics.totalProjects * 100)) - metrics.completionRate).toFixed(1)}%`
        ],
        recommendations: [
          'Prepare completion documentation in advance',
          'Plan resource reallocation strategy',
          'Schedule final inspections and audits'
        ],
        actions: [
          {
            label: 'Near Completion Projects',
            action: () => onAction({
              type: 'filter',
              filter: { progressRange: [70, 99] },
              message: 'Filtered to show near-completion projects'
            })
          }
        ]
      });
    }

    setSuggestions(newSuggestions.filter(s => !dismissed.includes(s.id)));
  };

  const dismissSuggestion = (id) => {
    setDismissed([...dismissed, id]);
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  const getIconColor = (color) => {
    const colors = {
      red: 'text-red-500',
      orange: 'text-orange-500',
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      cyan: 'text-cyan-500'
    };
    return colors[color] || 'text-gray-500';
  };

  const getBgColor = (color) => {
    const colors = {
      red: darkMode ? 'bg-red-900/20' : 'bg-red-50',
      orange: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
      blue: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      green: darkMode ? 'bg-green-900/20' : 'bg-green-50',
      purple: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
      indigo: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50',
      cyan: darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50'
    };
    return colors[color] || (darkMode ? 'bg-gray-800' : 'bg-gray-50');
  };

  if (suggestions.length === 0) return null;

  return (
    <div className={`${
      darkMode ? 'bg-gray-800/90' : 'bg-white/90'
    } backdrop-blur rounded-xl shadow-lg border ${
      darkMode ? 'border-gray-700' : 'border-orange-200'
    } overflow-hidden transition-all duration-300 ${
      expanded ? 'max-h-[800px]' : 'max-h-[400px]'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-orange-500 to-orange-600'
      } flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
            AI-Powered Insights & Recommendations
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-orange-700 text-orange-100'
          }`}>
            {suggestions.length} insights
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1 rounded-lg text-sm ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-orange-700 hover:bg-orange-800 text-white'
            } transition-colors`}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-orange-700'
            } transition-colors`}
          >
            <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-4 overflow-y-auto ${expanded ? 'max-h-[700px]' : 'max-h-[300px]'}`}>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-4 rounded-lg ${getBgColor(suggestion.color)} border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}>
                  <suggestion.icon size={20} className={getIconColor(suggestion.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{suggestion.title}</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {suggestion.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissSuggestion(suggestion.id)}
                className={`p-1 rounded hover:${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                } transition-colors`}
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Insights */}
            {suggestion.insights && suggestion.insights.length > 0 && (
              <div className={`mb-3 p-3 rounded-lg ${
                darkMode ? 'bg-gray-900/50' : 'bg-white/50'
              }`}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">
                  Key Insights
                </h5>
                <ul className="space-y-1">
                  {suggestion.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Info size={14} className="text-gray-400 mt-0.5" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {suggestion.recommendations && suggestion.recommendations.length > 0 && (
              <div className={`mb-3 p-3 rounded-lg ${
                darkMode ? 'bg-gray-900/50' : 'bg-white/50'
              }`}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">
                  Recommendations
                </h5>
                <ul className="space-y-1">
                  {suggestion.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-yellow-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {suggestion.actions && suggestion.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {suggestion.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                      idx === 0
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    {action.label}
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;