import React, { useState, useEffect } from 'react';
import {
  X, Calendar, MapPin, Building2, Users, IndianRupee,
  TrendingUp, Clock, AlertTriangle, CheckCircle, FileText,
  Download, Share2, Printer, Edit, Save, XCircle, Target, AlertCircle,
  Activity, Award, Shield, Package, Timer, GitBranch,
  Construction, Globe, Navigation, Route, Box, MoreHorizontal,
  Building, Gauge, Hash
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const Modal = ({ isOpen, onClose, project, darkMode }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [showActions, setShowActions] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Modal: Component mounted/updated', {
      isOpen,
      project,
      hasProject: !!project,
      projectKeys: project ? Object.keys(project) : []
    });
  }, [isOpen, project]);

  // Don't render if not open or no project
  if (!isOpen || !project) {
    console.log('Modal: Not rendering', { isOpen, hasProject: !!project });
    return null;
  }

  // Get work category icon
  const getWorkCategoryIcon = (category) => {
    switch(category) {
      case 'BORDER_OUTPOST': return Shield;
      case 'FENCING': return Box;
      case 'ROAD': return Route;
      case 'BRIDGE': return Construction;
      case 'INFRASTRUCTURE': return Building;
      default: return MoreHorizontal;
    }
  };

  // Parse Operations date format
  const parseOperationsDate = (dateString) => {
    if (!dateString || dateString === '') return null;
    
    const cleanString = dateString.replace(/'/g, ' ').trim();
    const parts = cleanString.split(' ');
    
    if (parts.length >= 2) {
      const monthMap = {
        'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1,
        'Mar': 2, 'March': 2, 'Apr': 3, 'April': 3,
        'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
        'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8,
        'Oct': 9, 'October': 9, 'Nov': 10, 'November': 10,
        'Dec': 11, 'December': 11
      };
      
      const monthName = parts[0].replace(/[^a-zA-Z]/g, '');
      const year = parseInt(parts[parts.length - 1]);
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        return new Date(year, monthMap[monthName], 1);
      }
    }
    
    return null;
  };

  // Format Operations date for display
  const formatOperationsDate = (dateString) => {
    const date = parseOperationsDate(dateString);
    if (!date) return dateString || 'N/A';
    
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Ensure all fields have default values for Operations data
  const safeProject = {
    // Basic Information
    s_no: project.s_no || 'N/A',
    name_of_work: project.name_of_work || 'Unknown Work',
    work_type: project.work_type || 'N/A',
    work_category: project.work_category || 'OTHER',
    source_sheet: project.source_sheet || 'N/A',
    
    // Location
    frontier: project.frontier || 'N/A',
    sector_hq: project.sector_hq || 'N/A',
    length_km: parseFloat(project.length_km) || 0,
    units_aor: parseFloat(project.units_aor) || 0,
    
    // Progress & Status
    completed_percentage: parseFloat(project.completed_percentage) || 0,
    completion_status: project.completion_status || 'NOT_STARTED',
    project_health: project.project_health || 'N/A',
    risk_level: project.risk_level || 'LOW',
    priority: project.priority || 'MEDIUM',
    efficiency_score: parseFloat(project.efficiency_score) || 0,
    
    // Financial (in Crores)
    sanctioned_amount_cr: parseFloat(project.sanctioned_amount_cr) || 0,
    spent_amount_cr: parseFloat(project.spent_amount_cr) || 0,
    remaining_amount_cr: parseFloat(project.remaining_amount_cr) || 0,
    
    // Dates
    hlec_year: project.hlec_year || '',
    hlec_meeting: project.hlec_meeting || '',
    sdc: project.sdc || '',
    pdc: project.pdc || '',
    days_to_pdc: parseInt(project.days_to_pdc) || 0,
    
    // Other
    remarks: project.remarks || '',
    
    // Include all other fields from original project
    ...project
  };

  const CategoryIcon = getWorkCategoryIcon(safeProject.work_category);

  // Format currency in Crores
  const formatAmountCr = (value) => {
    if (!value || isNaN(value)) return '₹0';
    return `₹${value.toFixed(2)} Cr`;
  };

  // Format percentage (stored as decimal)
  const formatPercentage = (value) => {
    const percent = (parseFloat(value) || 0) * 100;
    return `${percent.toFixed(1)}%`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'financial', label: 'Financial', icon: IndianRupee },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'location', label: 'Location', icon: Globe },
    { id: 'documents', label: 'Documents', icon: Package }
  ];

  const getRiskColor = (level) => {
    const colors = {
      CRITICAL: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      HIGH: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      MEDIUM: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      LOW: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    };
    return colors[level] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  };

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: 'text-green-600',
      NEAR_COMPLETION: 'text-indigo-600',
      ADVANCED: 'text-blue-600',
      IN_PROGRESS: 'text-yellow-600',
      INITIAL: 'text-orange-600',
      NOT_STARTED: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getHealthColor = (health) => {
    const colors = {
      ON_TRACK: 'text-green-600',
      MINOR_DELAY: 'text-yellow-600',
      MODERATE_DELAY: 'text-orange-600',
      SEVERE_DELAY: 'text-red-600'
    };
    return colors[health] || 'text-gray-600';
  };

  // Progress timeline data
  const progressPercentage = (safeProject.completed_percentage || 0) * 100;
  const timelineData = [
    { month: 'Start', planned: 0, actual: 0 },
    { month: 'Q1', planned: 25, actual: Math.min(25, progressPercentage) },
    { month: 'Q2', planned: 50, actual: Math.min(50, progressPercentage) },
    { month: 'Q3', planned: 75, actual: Math.min(75, progressPercentage) },
    { month: 'Current', planned: 90, actual: progressPercentage }
  ];

  // Performance metrics for radar chart
  const performanceData = [
    { metric: 'Progress', value: progressPercentage },
    { metric: 'Efficiency', value: safeProject.efficiency_score },
    { metric: 'Budget Use', value: safeProject.spent_amount_cr > 0 && safeProject.sanctioned_amount_cr > 0 
      ? (safeProject.spent_amount_cr / safeProject.sanctioned_amount_cr * 100) : 0 },
    { metric: 'Timeline', value: safeProject.days_to_pdc > 0 ? 100 : Math.max(0, 100 + (safeProject.days_to_pdc / 3.65)) },
    { metric: 'Health', value: safeProject.project_health === 'ON_TRACK' ? 100 :
      safeProject.project_health === 'MINOR_DELAY' ? 75 :
      safeProject.project_health === 'MODERATE_DELAY' ? 50 : 25 },
    { metric: 'Priority', value: safeProject.priority === 'URGENT' ? 100 :
      safeProject.priority === 'HIGH' ? 75 :
      safeProject.priority === 'MEDIUM' ? 50 : 25 }
  ];

  // Financial breakdown
  const financialBreakdown = [
    { name: 'Spent', value: safeProject.spent_amount_cr, fill: '#10b981' },
    { name: 'Remaining', value: safeProject.remaining_amount_cr, fill: '#f59e0b' }
  ];

  const handleExport = () => {
    const content = JSON.stringify(safeProject, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations-work-${safeProject.s_no}-details.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Operations Work: ${safeProject.name_of_work}`,
      text: `Progress: ${formatPercentage(safeProject.completed_percentage)}, Budget: ${formatAmountCr(safeProject.sanctioned_amount_cr)}`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Progress</span>
                  <TrendingUp size={16} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{progressPercentage.toFixed(0)}%</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Efficiency</span>
                  <Target size={16} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{safeProject.efficiency_score.toFixed(1)}%</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Category</span>
                  <CategoryIcon size={16} className="text-purple-500" />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {safeProject.work_category.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">PDC Status</span>
                  <Clock size={16} className="text-red-500" />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {safeProject.days_to_pdc < 0 ? `${Math.abs(safeProject.days_to_pdc)}d overdue` : `${safeProject.days_to_pdc}d left`}
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Basic Information</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Serial No</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.s_no}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Work Type</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.work_type}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Category</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.work_category.replace(/_/g, ' ')}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Source Sheet</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.source_sheet}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
                    <dd className={`text-sm font-bold ${getStatusColor(safeProject.completion_status)}`}>
                      {safeProject.completion_status.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Risk Level</dt>
                    <dd>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskColor(safeProject.risk_level)}`}>
                        {safeProject.risk_level}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Priority</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.priority}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">Location & Specifications</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Frontier</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.frontier}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Sector HQ</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.sector_hq}</dd>
                  </div>
                  {safeProject.length_km > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Length</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.length_km} Km</dd>
                    </div>
                  )}
                  {safeProject.units_aor > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Units/AOR</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.units_aor}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">HLEC Year</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.hlec_year || 'N/A'}</dd>
                  </div>
                  {safeProject.hlec_meeting && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">HLEC Meeting</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.hlec_meeting}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Project Health</dt>
                    <dd className={`text-sm font-bold ${getHealthColor(safeProject.project_health)}`}>
                      {safeProject.project_health.replace(/_/g, ' ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Remarks */}
            {safeProject.remarks && safeProject.remarks !== 'N/A' && (
              <div>
                <h3 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Remarks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  {safeProject.remarks}
                </p>
              </div>
            )}
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Sanctioned Amount</div>
                <div className="text-2xl font-bold text-green-600">{formatAmountCr(safeProject.sanctioned_amount_cr)}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Spent Amount</div>
                <div className="text-2xl font-bold text-blue-600">{formatAmountCr(safeProject.spent_amount_cr)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {safeProject.sanctioned_amount_cr > 0 
                    ? ((safeProject.spent_amount_cr / safeProject.sanctioned_amount_cr) * 100).toFixed(1)
                    : 0}% utilized
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200 dark:border-orange-800">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Remaining</div>
                <div className="text-2xl font-bold text-orange-600">{formatAmountCr(safeProject.remaining_amount_cr)}</div>
              </div>
            </div>

            {/* Budget Distribution Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Budget Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={financialBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatAmountCr(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financialBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatAmountCr(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Analysis */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Financial Analysis</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Budget Utilization</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.sanctioned_amount_cr > 0 
                        ? ((safeProject.spent_amount_cr / safeProject.sanctioned_amount_cr) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, 
                          safeProject.sanctioned_amount_cr > 0 
                            ? (safeProject.spent_amount_cr / safeProject.sanctioned_amount_cr) * 100
                            : 0
                        ))}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cost per Km</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.length_km > 0 
                        ? formatAmountCr(safeProject.sanctioned_amount_cr / safeProject.length_km)
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cost per Unit/AOR</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.units_aor > 0 
                        ? formatAmountCr(safeProject.sanctioned_amount_cr / safeProject.units_aor)
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            {/* Key Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Calendar size={18} className="text-blue-500" />
                  Project Timeline
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">HLEC Year</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.hlec_year || 'N/A'}</dd>
                  </div>
                  {safeProject.hlec_meeting && (
                    <div className="flex justify-between py-1">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">HLEC Meeting</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.hlec_meeting}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">SDC (Start Date)</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatOperationsDate(safeProject.sdc)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">PDC (Completion Date)</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatOperationsDate(safeProject.pdc)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Work Duration</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.sdc && safeProject.pdc ? 
                        (() => {
                          const start = parseOperationsDate(safeProject.sdc);
                          const end = parseOperationsDate(safeProject.pdc);
                          if (start && end) {
                            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                            return `${months} months`;
                          }
                          return 'N/A';
                        })()
                        : 'N/A'
                      }
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Timer size={18} className="text-orange-500" />
                  PDC Analysis
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Days to PDC</dt>
                    <dd className={`text-sm font-bold ${safeProject.days_to_pdc < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {safeProject.days_to_pdc < 0 
                        ? `${Math.abs(safeProject.days_to_pdc)} days overdue`
                        : `${safeProject.days_to_pdc} days remaining`}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Completion Status</dt>
                    <dd className={`text-sm font-medium ${getStatusColor(safeProject.completion_status)}`}>
                      {safeProject.completion_status.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Project Health</dt>
                    <dd className={`text-sm font-medium ${getHealthColor(safeProject.project_health)}`}>
                      {safeProject.project_health.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Expected Completion</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.pdc || 'TBD'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Progress Timeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="planned" stroke="#3b82f6" name="Planned" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            {/* Performance Radar */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={performanceData}>
                  <PolarGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="metric" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Efficiency Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Overall Efficiency</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.efficiency_score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${Math.min(100, Math.max(0, safeProject.efficiency_score))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Physical Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time Efficiency</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {safeProject.days_to_pdc > 0 ? '100%' : `${Math.max(0, 100 + (safeProject.days_to_pdc / 3.65)).toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ 
                          width: `${safeProject.days_to_pdc > 0 ? 100 : Math.max(0, 100 + (safeProject.days_to_pdc / 3.65))}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Status Indicators</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Status</span>
                    <span className={`text-sm font-bold ${getStatusColor(safeProject.completion_status)}`}>
                      {safeProject.completion_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Project Health</span>
                    <span className={`text-sm font-bold ${getHealthColor(safeProject.project_health)}`}>
                      {safeProject.project_health.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskColor(safeProject.risk_level)}`}>
                      {safeProject.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.priority}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Globe size={18} className="text-blue-500" />
                Location Details
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Frontier</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.frontier}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Sector HQ</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.sector_hq}</dd>
                </div>
                {safeProject.length_km > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Total Length</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.length_km} Km</dd>
                  </div>
                )}
                {safeProject.units_aor > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Units/AOR</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.units_aor}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Work Category Details */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CategoryIcon size={18} className="text-purple-500" />
                Work Category: {safeProject.work_category.replace(/_/g, ' ')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {safeProject.work_category === 'BORDER_OUTPOST' && 'Construction or renovation of Border Outposts (BOPs) for frontier security forces.'}
                {safeProject.work_category === 'FENCING' && 'Border fencing work to secure international boundaries and prevent infiltration.'}
                {safeProject.work_category === 'ROAD' && 'Border road construction for improved connectivity and patrol access.'}
                {safeProject.work_category === 'BRIDGE' && 'Bridge construction to enable access across rivers and difficult terrain.'}
                {safeProject.work_category === 'INFRASTRUCTURE' && 'Other infrastructure development including buildings, utilities, and support facilities.'}
                {safeProject.work_category === 'OTHER' && 'Miscellaneous border infrastructure and security-related works.'}
              </p>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Work Documents</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Documents related to this border infrastructure work
              </p>
              
              {/* Mock document list */}
              <div className="space-y-2">
                {[
                  { name: 'HLEC Approval.pdf', size: '1.2 MB', date: '2024-01-15' },
                  { name: 'Technical Specifications.pdf', size: '3.5 MB', date: '2024-02-01' },
                  { name: 'Progress Report.xlsx', size: '856 KB', date: '2024-06-01' },
                  { name: 'Site Survey.pdf', size: '5.2 MB', date: '2024-03-15' }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Download size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Work Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this work..."
                className={`w-full h-32 p-3 rounded-xl border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none`}
              />
              <button className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                <Save size={16} />
                Save Notes
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  console.log('Modal: Rendering modal');

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100001]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-6xl h-[85vh] min-h-[600px] ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      } rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-auto z-[100002]`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                {safeProject.name_of_work}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                {safeProject.frontier} • {safeProject.sector_hq} • {safeProject.work_type}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
                title="Share"
              >
                <Share2 size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
              <button
                onClick={handlePrint}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
                title="Print"
              >
                <Printer size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
              <button
                onClick={handleExport}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
                title="Export"
              >
                <Download size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                    : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Modal;