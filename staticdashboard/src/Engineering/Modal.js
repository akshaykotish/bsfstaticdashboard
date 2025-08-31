import React, { useState, useEffect } from 'react';
import {
  X, Calendar, MapPin, Building2, Users, IndianRupee,
  TrendingUp, Clock, AlertTriangle, CheckCircle, FileText,
  Download, Share2, Printer, Edit, Save, XCircle, Target, AlertCircle,
  Activity, Award, Shield, Package, Timer, GitBranch
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

  // Ensure all fields have default values to prevent empty display
  const safeProject = {
    // Basic Information
    serial_no: project.serial_no || 'N/A',
    scheme_name: project.scheme_name || 'Unknown Project',
    budget_head: project.budget_head || 'N/A',
    status: project.status || 'NOT_STARTED',
    risk_level: project.risk_level || 'LOW',
    priority: project.priority || 'LOW',
    
    // Location & Parties
    work_site: project.work_site || 'N/A',
    executive_agency: project.executive_agency || 'N/A',
    firm_name: project.firm_name || 'N/A',
    ftr_hq: project.ftr_hq || 'N/A',
    shq: project.shq || 'N/A',
    
    // Progress & Performance
    physical_progress: parseFloat(project.physical_progress) || 0,
    efficiency_score: parseFloat(project.efficiency_score) || 0,
    health_score: parseFloat(project.health_score) || 0,
    delay_days: parseInt(project.delay_days) || 0,
    
    // Financial
    sanctioned_amount: parseFloat(project.sanctioned_amount) || 0,
    total_expdr: parseFloat(project.total_expdr) || 0,
    percent_expdr: parseFloat(project.percent_expdr) || 0,
    remaining_amount: parseFloat(project.remaining_amount) || 0,
    expdr_upto_31mar25: parseFloat(project.expdr_upto_31mar25) || 0,
    expdr_cfy: parseFloat(project.expdr_cfy) || 0,
    
    // Dates
    date_award: project.date_award || '',
    date_tender: project.date_tender || '',
    pdc_agreement: project.pdc_agreement || '',
    revised_pdc: project.revised_pdc || '',
    actual_completion_date: project.actual_completion_date || '',
    date_acceptance: project.date_acceptance || '',
    
    // Other
    time_allowed_days: parseInt(project.time_allowed_days) || 0,
    remarks: project.remarks || '',
    aa_es_ref: project.aa_es_ref || '',
    aa_es_pending_with: project.aa_es_pending_with || '',
    progress_status: project.progress_status || 'N/A',
    
    // Include all other fields from original project
    ...project
  };

  // Format currency
  const formatAmount = (value) => {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000) return `₹${(value / 100).toFixed(2)} Cr`;
    return `₹${value.toFixed(2)} L`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'financial', label: 'Financial', icon: IndianRupee },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
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
      NEAR_COMPLETION: 'text-blue-600',
      ADVANCED: 'text-cyan-600',
      IN_PROGRESS: 'text-orange-600',
      INITIAL: 'text-yellow-600',
      NOT_STARTED: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  // Mock timeline data
  const timelineData = [
    { month: 'Jan', planned: 10, actual: 8 },
    { month: 'Feb', planned: 20, actual: 18 },
    { month: 'Mar', planned: 35, actual: 30 },
    { month: 'Apr', planned: 50, actual: 42 },
    { month: 'May', planned: 65, actual: 55 },
    { month: 'Jun', planned: 80, actual: safeProject.physical_progress }
  ];

  // Performance metrics for radar chart
  const performanceData = [
    { metric: 'Progress', value: safeProject.physical_progress },
    { metric: 'Efficiency', value: safeProject.efficiency_score },
    { metric: 'Health', value: safeProject.health_score },
    { metric: 'Budget Use', value: safeProject.percent_expdr },
    { metric: 'Timeline', value: Math.max(0, 100 - (safeProject.delay_days / 3.65)) },
    { metric: 'Quality', value: 75 } // Mock value
  ];

  // Financial breakdown
  const financialBreakdown = [
    { name: 'Spent', value: safeProject.total_expdr / 100, fill: '#10b981' },
    { name: 'Committed', value: Math.max(0, (safeProject.sanctioned_amount * 0.2) / 100), fill: '#3b82f6' },
    { name: 'Remaining', value: Math.max(0, safeProject.remaining_amount / 100), fill: '#f59e0b' }
  ];

  const handleExport = () => {
    const content = JSON.stringify(safeProject, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${safeProject.serial_no}-details.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Project: ${safeProject.scheme_name}`,
      text: `Progress: ${safeProject.physical_progress}%, Budget: ${formatAmount(safeProject.sanctioned_amount)}`,
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
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{safeProject.physical_progress.toFixed(0)}%</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${Math.min(100, Math.max(0, safeProject.physical_progress))}%` }}
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
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Health</span>
                  <Activity size={16} className="text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{safeProject.health_score.toFixed(0)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Delay</span>
                  <Clock size={16} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{safeProject.delay_days} days</div>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Basic Information</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Serial No</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.serial_no}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Budget Head</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.budget_head}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
                    <dd className={`text-sm font-bold ${getStatusColor(safeProject.status)}`}>
                      {safeProject.status.replace(/_/g, ' ')}
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
                <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">Location & Parties</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Work Site</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{safeProject.work_site}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Executive Agency</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{safeProject.executive_agency}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Contractor</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{safeProject.firm_name}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Frontier HQ</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.ftr_hq}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">SHQ</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.shq}</dd>
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
                <div className="text-2xl font-bold text-green-600">{formatAmount(safeProject.sanctioned_amount)}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Expenditure</div>
                <div className="text-2xl font-bold text-blue-600">{formatAmount(safeProject.total_expdr)}</div>
                <div className="text-xs text-gray-500 mt-1">{safeProject.percent_expdr.toFixed(1)}% utilized</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200 dark:border-orange-800">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Remaining</div>
                <div className="text-2xl font-bold text-orange-600">{formatAmount(safeProject.remaining_amount)}</div>
              </div>
            </div>

            {/* Budget Utilization Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Budget Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={financialBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatAmount(value * 100)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financialBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatAmount(value * 100)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Financial Info */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Financial Details</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Expenditure upto 31 Mar 25</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatAmount(safeProject.expdr_upto_31mar25)}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Current FY Expenditure</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatAmount(safeProject.expdr_cfy)}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Utilization %</dt>
                  <dd className="text-sm font-bold text-gray-900 dark:text-gray-100">{safeProject.percent_expdr.toFixed(2)}%</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">AA/ES Reference</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.aa_es_ref || 'N/A'}</dd>
                </div>
                {safeProject.aa_es_pending_with && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">AA/ES Pending With</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.aa_es_pending_with}</dd>
                  </div>
                )}
              </dl>
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
                  Project Dates
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Date of Award</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(safeProject.date_award)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Date of Tender</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(safeProject.date_tender)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">PDC (Agreement)</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(safeProject.pdc_agreement)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Revised PDC</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(safeProject.revised_pdc)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Date of Acceptance</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(safeProject.date_acceptance)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Actual Completion</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.actual_completion_date ? formatDate(safeProject.actual_completion_date) : 'In Progress'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Timer size={18} className="text-orange-500" />
                  Time Analysis
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Time Allowed</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.time_allowed_days} days</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Time Elapsed</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.date_award ? 
                        Math.floor((new Date() - new Date(safeProject.date_award)) / (1000 * 60 * 60 * 24)) : 0
                      } days
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Delay</dt>
                    <dd className={`text-sm font-bold ${safeProject.delay_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {safeProject.delay_days} days
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Progress Status</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.progress_status}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Expected Completion</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {safeProject.revised_pdc || safeProject.pdc_agreement || 'TBD'}
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Progress vs Budget</span>
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time Efficiency</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Math.max(0, 100 - (safeProject.delay_days / 3.65)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{ width: `${Math.max(0, 100 - (safeProject.delay_days / 3.65))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Physical Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{safeProject.physical_progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ width: `${Math.min(100, Math.max(0, safeProject.physical_progress))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Health Indicators</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                    <span className={`text-lg font-bold ${
                      safeProject.health_score > 80 ? 'text-green-600' :
                      safeProject.health_score > 60 ? 'text-blue-600' :
                      safeProject.health_score > 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {safeProject.health_score.toFixed(0)}
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`text-sm font-medium ${getStatusColor(safeProject.status)}`}>
                      {safeProject.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-6">
            {/* Risk Assessment */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <AlertTriangle size={18} className="text-red-500" />
                Current Risk Level: {safeProject.risk_level}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                This project has been classified as {safeProject.risk_level} risk based on multiple factors.
              </p>
              
              {/* Risk Factors */}
              <div className="space-y-2">
                {safeProject.delay_days > 0 && (
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Schedule Delay</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Project is delayed by {safeProject.delay_days} days
                      </p>
                    </div>
                  </div>
                )}
                
                {safeProject.efficiency_score < 50 && (
                  <div className="flex items-start gap-2">
                    <Target size={16} className="text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Low Efficiency</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Efficiency score is {safeProject.efficiency_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
                
                {safeProject.percent_expdr > 80 && safeProject.physical_progress < 80 && (
                  <div className="flex items-start gap-2">
                    <IndianRupee size={16} className="text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Budget Overrun Risk</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {safeProject.percent_expdr.toFixed(1)}% budget used for {safeProject.physical_progress.toFixed(0)}% progress
                      </p>
                    </div>
                  </div>
                )}

                {safeProject.physical_progress === 0 && safeProject.date_award && (
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No Progress</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Project has not started despite being awarded
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mitigation Strategies */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Recommended Actions</h3>
              <ul className="space-y-2">
                {safeProject.delay_days > 30 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Review and optimize project timeline with contractor</span>
                  </li>
                )}
                {safeProject.efficiency_score < 70 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Conduct efficiency audit and implement process improvements</span>
                  </li>
                )}
                {safeProject.risk_level === 'CRITICAL' && (
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Schedule immediate review meeting with all stakeholders</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Monitor progress weekly and update risk assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ensure adequate resource allocation and support</span>
                </li>
              </ul>
            </div>

            {/* Risk History */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Risk Assessment History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Risk assessment is calculated based on delay days, efficiency score, budget utilization, and physical progress.
              </p>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Project Documents</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Documents and files related to this project
              </p>
              
              {/* Mock document list */}
              <div className="space-y-2">
                {[
                  { name: 'Project Proposal.pdf', size: '2.3 MB', date: '2024-01-15' },
                  { name: 'Contract Agreement.pdf', size: '1.8 MB', date: '2024-02-01' },
                  { name: 'Progress Report Q1.xlsx', size: '456 KB', date: '2024-04-01' },
                  { name: 'Site Photos.zip', size: '15.2 MB', date: '2024-05-15' }
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
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Project Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this project..."
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
                {safeProject.scheme_name}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                {safeProject.work_site} • {safeProject.executive_agency}
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