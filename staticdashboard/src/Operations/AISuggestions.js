import React, { useState, useEffect } from 'react';
import {
  Zap, X, AlertCircle, TrendingUp, Shield, Clock,
  DollarSign, Users, Target, Lightbulb, ChevronRight,
  Brain, Sparkles, Info, CheckCircle, XCircle,
  Route, Bridge, Box, Building, Navigation, Globe
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

    // Critical Projects Alert for Operations
    if (metrics.criticalRate > 20) {
      const criticalProjects = filteredData.filter(d => d.risk_level === 'CRITICAL');
      const avgDaysToPDC = criticalProjects.reduce((sum, d) => sum + (d.days_to_pdc || 0), 0) / criticalProjects.length;
      
      newSuggestions.push({
        id: 'critical-alert',
        type: 'alert',
        priority: 'high',
        icon: AlertCircle,
        color: 'red',
        title: 'High Critical Project Rate',
        description: `${metrics.criticalProjects} works (${metrics.criticalRate}%) are in critical state`,
        insights: [
          `Most critical works are ${avgDaysToPDC < 0 ? Math.abs(avgDaysToPDC).toFixed(0) + ' days overdue' : avgDaysToPDC.toFixed(0) + ' days from PDC'}`,
          `Average efficiency of critical works is ${(criticalProjects.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / criticalProjects.length).toFixed(1)}%`,
          `Border infrastructure at risk across ${new Set(criticalProjects.map(d => d.frontier)).size} frontiers`
        ],
        recommendations: [
          'Immediate intervention required for resource reallocation',
          'Schedule emergency review with frontier commanders',
          'Consider fast-track approval for critical BOPs and fencing'
        ],
        actions: [
          {
            label: 'View Critical Works',
            action: () => onAction({
              type: 'filter',
              filter: { riskLevel: 'CRITICAL' },
              message: 'Filtered to show critical works'
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

    // PDC Overdue Pattern Detection
    if (metrics.overdueProjects > metrics.totalWorks * 0.3) {
      const overdueWorks = filteredData.filter(d => d.days_to_pdc < 0);
      const avgOverdueDays = Math.abs(overdueWorks.reduce((sum, d) => sum + d.days_to_pdc, 0) / overdueWorks.length);
      
      newSuggestions.push({
        id: 'pdc-overdue',
        type: 'warning',
        priority: 'high',
        icon: Clock,
        color: 'orange',
        title: 'Significant PDC Overruns',
        description: `${metrics.overdueProjects} works are past their PDC date`,
        insights: [
          `Average overdue period is ${avgOverdueDays.toFixed(0)} days`,
          `${overdueWorks.filter(d => Math.abs(d.days_to_pdc) > 180).length} works overdue by more than 6 months`,
          `Estimated cost impact: ₹${(metrics.overdueProjects * 0.05 * metrics.totalSanctionedCr / metrics.totalWorks).toFixed(2)} Cr`
        ],
        recommendations: [
          'Review contractor performance and apply penalties',
          'Implement weekly monitoring for overdue projects',
          'Consider re-tendering stalled works'
        ],
        actions: [
          {
            label: 'View Overdue Works',
            action: () => onAction({
              type: 'filter',
              filter: { pdcStatus: 'overdue' },
              message: 'Filtered to show overdue works'
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

    // Budget Utilization for Operations
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
          `Current spending rate: ₹${(metrics.totalSpentCr / 12).toFixed(2)} Cr/month`,
          `At current rate, full utilization in ${(metrics.remainingBudgetCr / (metrics.totalSpentCr / 12)).toFixed(0)} months`
        ],
        recommendations: [
          'Accelerate fund disbursement for border infrastructure',
          'Review and clear pending invoices',
          'Prioritize critical frontier works for immediate funding'
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

    // Work Category Analysis
    const categoryDistribution = {
      bop: metrics.bopProjects,
      fencing: metrics.fencingProjects,
      road: metrics.roadProjects,
      bridge: metrics.bridgeProjects,
      infrastructure: metrics.infrastructureProjects
    };
    
    const dominantCategory = Object.entries(categoryDistribution)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantCategory[1] > metrics.totalWorks * 0.4) {
      newSuggestions.push({
        id: 'category-focus',
        type: 'insight',
        priority: 'low',
        icon: Building,
        color: 'purple',
        title: 'Work Category Concentration',
        description: `${dominantCategory[1]} works (${((dominantCategory[1] / metrics.totalWorks) * 100).toFixed(0)}%) are ${dominantCategory[0].toUpperCase()} projects`,
        insights: [
          `High concentration in ${dominantCategory[0]} category may indicate strategic focus`,
          `Average progress in this category: ${(filteredData.filter(d => 
            d.work_category === dominantCategory[0].toUpperCase() || 
            d.work_category === `${dominantCategory[0].toUpperCase()}_OUTPOST`
          ).reduce((sum, d) => sum + ((d.completed_percentage || 0) * 100), 0) / dominantCategory[1]).toFixed(1)}%`,
          `Budget allocation: ₹${(filteredData.filter(d => 
            d.work_category === dominantCategory[0].toUpperCase() || 
            d.work_category === `${dominantCategory[0].toUpperCase()}_OUTPOST`
          ).reduce((sum, d) => sum + (d.sanctioned_amount_cr || 0), 0)).toFixed(2)} Cr`
        ],
        recommendations: [
          'Ensure balanced progress across all work categories',
          'Review resource allocation for other critical categories',
          'Consider priority rebalancing if needed'
        ],
        actions: [
          {
            label: 'Category Analysis',
            action: () => onAction({
              type: 'tab',
              tab: 'categories',
              message: 'Switched to category analysis'
            })
          }
        ]
      });
    }

    // Frontier Performance Variance
    const frontierPerformance = {};
    filteredData.forEach(d => {
      if (!frontierPerformance[d.frontier]) {
        frontierPerformance[d.frontier] = { 
          total: 0, 
          progress: 0,
          critical: 0,
          overdue: 0
        };
      }
      frontierPerformance[d.frontier].total++;
      frontierPerformance[d.frontier].progress += (d.completed_percentage || 0) * 100;
      if (d.risk_level === 'CRITICAL') frontierPerformance[d.frontier].critical++;
      if (d.days_to_pdc < 0) frontierPerformance[d.frontier].overdue++;
    });

    const frontierAvgs = Object.entries(frontierPerformance)
      .map(([frontier, data]) => ({
        frontier,
        avg: data.progress / data.total,
        count: data.total,
        critical: data.critical,
        overdue: data.overdue
      }))
      .filter(a => a.count > 3)
      .sort((a, b) => b.avg - a.avg);

    if (frontierAvgs.length > 0 && frontierAvgs[0].avg - frontierAvgs[frontierAvgs.length - 1].avg > 30) {
      newSuggestions.push({
        id: 'frontier-variance',
        type: 'insight',
        priority: 'medium',
        icon: Globe,
        color: 'indigo',
        title: 'High Frontier Performance Variance',
        description: 'Significant performance differences between frontiers detected',
        insights: [
          `Top frontier: ${frontierAvgs[0].frontier} at ${frontierAvgs[0].avg.toFixed(1)}% avg progress`,
          `Bottom frontier: ${frontierAvgs[frontierAvgs.length - 1].frontier} at ${frontierAvgs[frontierAvgs.length - 1].avg.toFixed(1)}% avg progress`,
          `Performance gap: ${(frontierAvgs[0].avg - frontierAvgs[frontierAvgs.length - 1].avg).toFixed(1)}%`
        ],
        recommendations: [
          'Transfer best practices from high-performing frontiers',
          'Provide additional support to struggling frontiers',
          'Review terrain and logistical challenges by frontier'
        ],
        actions: [
          {
            label: 'Frontier Comparison',
            action: () => onAction({
              type: 'tab',
              tab: 'frontier',
              message: 'Switched to frontier performance view'
            })
          }
        ]
      });
    }

    // Success Stories for Operations
    if (metrics.completionRate > 60) {
      const completedWorks = filteredData.filter(d => d.completion_status === 'COMPLETED');
      newSuggestions.push({
        id: 'success-story',
        type: 'success',
        priority: 'low',
        icon: CheckCircle,
        color: 'green',
        title: 'Strong Completion Performance',
        description: `${metrics.completionRate}% works successfully completed`,
        insights: [
          `${metrics.completedWorks} border infrastructure works delivered`,
          `Average completion efficiency: ${(completedWorks.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / completedWorks.length).toFixed(1)}%`,
          `Key categories completed: ${completedWorks.filter(d => d.work_category === 'BORDER_OUTPOST').length} BOPs, ${completedWorks.filter(d => d.work_category === 'FENCING').length} fencing works`
        ],
        recommendations: [
          'Document completion strategies for future projects',
          'Recognize high-performing teams and contractors',
          'Apply success factors to ongoing critical works'
        ],
        actions: [
          {
            label: 'View Completed Works',
            action: () => onAction({
              type: 'filter',
              filter: { status: 'COMPLETED' },
              message: 'Filtered to show completed works'
            })
          }
        ]
      });
    }

    // Near PDC Alert
    const nearPDCWorks = filteredData.filter(d => 
      d.days_to_pdc >= 0 && d.days_to_pdc <= 90 && d.completion_status !== 'COMPLETED'
    ).length;

    if (nearPDCWorks > 0) {
      newSuggestions.push({
        id: 'near-pdc',
        type: 'prediction',
        priority: 'medium',
        icon: Brain,
        color: 'cyan',
        title: 'Works Approaching PDC',
        description: `${nearPDCWorks} works approaching completion deadline in next 3 months`,
        insights: [
          `Average progress of near-PDC works: ${(filteredData.filter(d => 
            d.days_to_pdc >= 0 && d.days_to_pdc <= 90
          ).reduce((sum, d) => sum + ((d.completed_percentage || 0) * 100), 0) / nearPDCWorks).toFixed(1)}%`,
          `Estimated budget requirement: ₹${(nearPDCWorks * metrics.totalSanctionedCr / metrics.totalWorks * 0.3).toFixed(2)} Cr`,
          `Critical frontiers affected: ${new Set(filteredData.filter(d => 
            d.days_to_pdc >= 0 && d.days_to_pdc <= 90
          ).map(d => d.frontier)).size}`
        ],
        recommendations: [
          'Mobilize resources for final push',
          'Prepare completion documentation in advance',
          'Schedule final inspections and quality checks'
        ],
        actions: [
          {
            label: 'Near PDC Works',
            action: () => onAction({
              type: 'filter',
              filter: { daysToPodc: [0, 90] },
              message: 'Filtered to show works near PDC'
            })
          }
        ]
      });
    }

    // Priority Analysis
    if (metrics.urgentPriority > 10) {
      newSuggestions.push({
        id: 'urgent-priority',
        type: 'alert',
        priority: 'high',
        icon: Zap,
        color: 'red',
        title: 'Urgent Priority Works Require Attention',
        description: `${metrics.urgentPriority} works marked as URGENT priority`,
        insights: [
          `Urgent works span ${new Set(filteredData.filter(d => d.priority === 'URGENT').map(d => d.frontier)).size} frontiers`,
          `Average progress of urgent works: ${(filteredData.filter(d => d.priority === 'URGENT').reduce((sum, d) => sum + ((d.completed_percentage || 0) * 100), 0) / metrics.urgentPriority).toFixed(1)}%`,
          `Budget allocated to urgent works: ₹${filteredData.filter(d => d.priority === 'URGENT').reduce((sum, d) => sum + (d.sanctioned_amount_cr || 0), 0).toFixed(2)} Cr`
        ],
        recommendations: [
          'Focus resources on urgent priority works',
          'Review priority classification accuracy',
          'Implement expedited processes for urgent works'
        ],
        actions: [
          {
            label: 'View Urgent Works',
            action: () => onAction({
              type: 'filter',
              filter: { priority: 'URGENT' },
              message: 'Filtered to show urgent priority works'
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
    } backdrop-blur rounded-2xl shadow-sm border ${
      darkMode ? 'border-gray-700' : 'border-gray-100'
    } overflow-hidden transition-all duration-300 ${
      expanded ? 'max-h-[800px]' : 'max-h-[400px]'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-blue-500 to-blue-600'
      } flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-xl">
            <Sparkles size={20} className="text-white" />
          </div>
          <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
            AI-Powered Operations Insights
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-700 text-blue-100'
          }`}>
            {suggestions.length} insights
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1 rounded-lg text-sm ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-blue-700 hover:bg-blue-800 text-white'
            } transition-colors`}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
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
            className={`p-4 rounded-xl ${getBgColor(suggestion.color)} border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}>
                  <suggestion.icon size={20} className={getIconColor(suggestion.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                    {suggestion.title}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {suggestion.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissSuggestion(suggestion.id)}
                className={`p-1 rounded-lg hover:${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                } transition-colors`}
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Insights */}
            {suggestion.insights && suggestion.insights.length > 0 && (
              <div className={`mb-3 p-3 rounded-xl ${
                darkMode ? 'bg-gray-900/50' : 'bg-white/50'
              }`}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
                  Key Insights
                </h5>
                <ul className="space-y-1">
                  {suggestion.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Info size={14} className="text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {suggestion.recommendations && suggestion.recommendations.length > 0 && (
              <div className={`mb-3 p-3 rounded-xl ${
                darkMode ? 'bg-gray-900/50' : 'bg-white/50'
              }`}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
                  Recommendations
                </h5>
                <ul className="space-y-1">
                  {suggestion.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-yellow-500 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
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
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-sm'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-all`}
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