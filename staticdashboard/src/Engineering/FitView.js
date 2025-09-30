import React, { useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Calendar, DollarSign, TrendingUp, AlertCircle, Users, MapPin,
  Building2, FileText, Activity, Clock, Target, Shield, Gauge,
  Info, Award, Timer, GitBranch, Zap, IndianRupee, TrendingDown,
  PieChart, Calculator, Percent, AlertTriangle, CheckCircle,
  BarChart3, Hash, Briefcase, Eye, ArrowUp, ArrowDown, Minus,
  CalendarClock, CalendarCheck, CalendarX, Wallet, CreditCard,
  Coins, PiggyBank, Receipt, Package, Flag, FileCheck, Database,
  Layers, Settings, CalendarDays
} from 'lucide-react';

// Memoized InfoItem Component
const InfoItem = React.memo(({ icon: Icon, label, value, color = 'text-gray-600' }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className={`mt-0.5 ${color}`} />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xs font-semibold truncate" title={value}>{value || '-'}</p>
    </div>
  </div>
));

// Memoized MetricBox Component  
const MetricBox = React.memo(({ icon: Icon, label, value, subtitle, trend, color = 'blue', darkMode }) => (
  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-start justify-between mb-1">
      <Icon size={14} className={`text-${color}-500`} />
      {trend !== undefined && (
        <span className={`text-[10px] flex items-center ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {trend > 0 ? <ArrowUp size={10} /> : trend < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
    <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
    {subtitle && <p className="text-[9px] text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
));

const FitViewModal = ({ row, isOpen, onClose, darkMode }) => {
  // Memoized date parsing helper
  const parseDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle DD.MM.YY format
      if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 : 2000) + parseInt(year) : parseInt(year);
          return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        }
      }
      // Handle DD.MM.YYYY format
      if (dateStr.match(/\d{2}\.\d{2}\.\d{4}/)) {
        const [day, month, year] = dateStr.split('.');
        return new Date(year, month - 1, day);
      }
      // Handle standard formats
      return new Date(dateStr);
    } catch {
      return null;
    }
  }, []);

  // Comprehensive calculations - heavily memoized
  const analytics = useMemo(() => {
    if (!row) return null;

    // Core dates
    const today = new Date();
    const tsDate = parseDate(row.ts_date);
    const tenderDate = parseDate(row.tender_date);
    const acceptanceDate = parseDate(row.acceptance_date);
    const awardDate = parseDate(row.award_date);
    const pdcAgreement = parseDate(row.pdc_agreement);
    const pdcRevised = parseDate(row.pdc_revised);
    const completionActual = parseDate(row.completion_date_actual);
    const effectivePdc = pdcRevised || pdcAgreement;

    // Timeline calculations
    const projectDuration = awardDate && effectivePdc ? 
      Math.floor((effectivePdc - awardDate) / (1000 * 60 * 60 * 24)) : 0;
    const elapsedDays = awardDate ? 
      Math.floor((today - awardDate) / (1000 * 60 * 60 * 24)) : 0;
    const remainingDays = effectivePdc && !completionActual ? 
      Math.floor((effectivePdc - today) / (1000 * 60 * 60 * 24)) : 0;
    const delayDays = remainingDays < 0 ? Math.abs(remainingDays) : 0;

    // Financial calculations - handle negative values properly
    const sanctioned = parseFloat(row.sd_amount_lakh) || 0;
    const expdrPrevious = Math.abs(parseFloat(row.expenditure_previous_fy) || 0);
    const expdrCurrent = Math.abs(parseFloat(row.expenditure_current_fy) || 0);
    const expdrTotal = parseFloat(row.expenditure_total) || (expdrPrevious + expdrCurrent);
    const expdrPercent = parseFloat(row.expenditure_percent) || 0;
    const utilizationRate = sanctioned > 0 ? (expdrTotal / sanctioned) * 100 : 0;
    const remainingBudget = sanctioned - expdrTotal;
    
    // Progress calculations
    const physicalProgress = parseFloat(row.physical_progress_percent) || 0;
    const timeProgress = projectDuration > 0 ? (elapsedDays / projectDuration) * 100 : 0;
    const expectedProgress = Math.min(100, timeProgress);
    const progressVariance = physicalProgress - expectedProgress;
    
    // Rate calculations
    const dailyProgressRate = elapsedDays > 0 ? physicalProgress / elapsedDays : 0;
    const requiredDailyRate = remainingDays > 0 ? (100 - physicalProgress) / remainingDays : 0;
    const velocityRatio = requiredDailyRate > 0 ? dailyProgressRate / requiredDailyRate : 0;
    
    // Efficiency metrics
    const costEfficiency = utilizationRate > 0 ? (physicalProgress / utilizationRate) * 100 : 0;
    const timeEfficiency = timeProgress > 0 ? (physicalProgress / timeProgress) * 100 : 0;
    const overallEfficiency = (costEfficiency + timeEfficiency) / 2;
    
    // Cost projections
    const costPerPercent = physicalProgress > 0 ? expdrTotal / physicalProgress : 0;
    const projectedTotalCost = costPerPercent * 100;
    const costOverrun = projectedTotalCost > sanctioned ? projectedTotalCost - sanctioned : 0;

    // Risk assessment
    const scheduleRisk = delayDays > 90 ? 'CRITICAL' :
                        delayDays > 30 ? 'HIGH' :
                        progressVariance < -10 ? 'MEDIUM' : 'LOW';
    const budgetRisk = utilizationRate > 95 && physicalProgress < 100 ? 'CRITICAL' :
                      utilizationRate > 85 ? 'HIGH' :
                      utilizationRate > 75 ? 'MEDIUM' : 'LOW';
    const performanceRisk = progressVariance < -30 ? 'CRITICAL' :
                           progressVariance < -20 ? 'HIGH' :
                           progressVariance < -10 ? 'MEDIUM' : 'LOW';

    // Project status
    const projectStatus = () => {
      if (physicalProgress >= 100) return 'COMPLETED';
      if (!awardDate && !tenderDate) return 'PRE-TENDER';
      if (!awardDate && tenderDate) return 'TENDERED';
      if (physicalProgress === 0) return 'AWARDED';
      if (delayDays > 0) return 'DELAYED';
      if (progressVariance < -10) return 'BEHIND SCHEDULE';
      return 'ON TRACK';
    };

    return {
      // All calculated values
      status: projectStatus(),
      physicalProgress,
      expectedProgress,
      progressVariance,
      sanctioned,
      expdrPrevious,
      expdrCurrent,
      expdrTotal,
      expdrPercent,
      remainingBudget,
      utilizationRate,
      elapsedDays,
      remainingDays: Math.max(0, remainingDays),
      delayDays,
      dailyProgressRate,
      requiredDailyRate,
      velocityRatio,
      costEfficiency,
      timeEfficiency,
      overallEfficiency,
      projectedTotalCost,
      costOverrun,
      scheduleRisk,
      budgetRisk,
      performanceRisk,
      // Formatted dates
      tsDate: tsDate ? tsDate.toLocaleDateString('en-IN') : '-',
      tenderDate: tenderDate ? tenderDate.toLocaleDateString('en-IN') : '-',
      acceptanceDate: acceptanceDate ? acceptanceDate.toLocaleDateString('en-IN') : '-',
      awardDate: awardDate ? awardDate.toLocaleDateString('en-IN') : '-',
      pdcAgreement: pdcAgreement ? pdcAgreement.toLocaleDateString('en-IN') : '-',
      pdcRevised: pdcRevised ? pdcRevised.toLocaleDateString('en-IN') : '-',
      completionActual: completionActual ? completionActual.toLocaleDateString('en-IN') : '-',
      // All raw data fields
      ...row
    };
  }, [row, parseDate]);

  const getRiskColor = useCallback((risk) => {
    switch(risk) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'HIGH': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'LOW': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch(status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'ON TRACK': return 'bg-blue-500';
      case 'DELAYED': return 'bg-orange-500';
      case 'BEHIND SCHEDULE': return 'bg-yellow-500';
      case 'AWARDED': return 'bg-purple-500';
      case 'TENDERED': return 'bg-indigo-500';
      case 'PRE-TENDER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, []);

  if (!isOpen || !row || !analytics) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-[90vw] h-[90vh] ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className={`px-6 py-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {analytics.name_of_scheme || analytics.sub_scheme_name || 'Project Details'}
              </h2>
              <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getStatusColor(analytics.status)}`}>
                {analytics.status}
              </span>
              <span className="text-sm text-gray-500">ID: {analytics.s_no}</span>
              <span className="text-sm text-gray-500">Source: {analytics.source_sheet}</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main Content - Scrollable with optimized rendering */}
        <div className="flex-1 overflow-y-auto p-4" style={{ willChange: 'scroll-position' }}>
          <div className="grid grid-cols-12 gap-3">
            
            {/* Row 1: Key Metrics */}
            <div className="col-span-12 grid grid-cols-6 gap-3">
              <MetricBox icon={Activity} label="Physical Progress" value={`${analytics.physicalProgress.toFixed(1)}%`} 
                subtitle={`Expected: ${analytics.expectedProgress.toFixed(1)}%`} trend={analytics.progressVariance.toFixed(1)} color="blue" darkMode={darkMode} />
              <MetricBox icon={IndianRupee} label="Budget Utilized" value={`₹${analytics.expdrTotal.toFixed(2)}L`} 
                subtitle={`of ₹${analytics.sanctioned}L (${analytics.utilizationRate.toFixed(1)}%)`} color="green" darkMode={darkMode} />
              <MetricBox icon={Clock} label="Time Status" value={analytics.delayDays > 0 ? `${analytics.delayDays}d Delayed` : 'On Time'}
                subtitle={`${analytics.remainingDays}d remaining`} color={analytics.delayDays > 0 ? "red" : "green"} darkMode={darkMode} />
              <MetricBox icon={Gauge} label="Efficiency" value={`${analytics.overallEfficiency.toFixed(1)}%`}
                subtitle="Cost + Time" color="purple" darkMode={darkMode} />
              <MetricBox icon={Zap} label="Velocity Ratio" value={analytics.velocityRatio.toFixed(2)}
                subtitle="Actual vs Required" color="orange" darkMode={darkMode} />
              <MetricBox icon={TrendingUp} label="Daily Rate" value={`${analytics.dailyProgressRate.toFixed(3)}%`}
                subtitle={`Need: ${analytics.requiredDailyRate.toFixed(3)}%`} color="cyan" darkMode={darkMode} />
            </div>

            {/* Row 2: Complete Project Information */}
            <div className="col-span-6">
              <div className={`h-full p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-blue-500" />
                  Complete Project Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem icon={Hash} label="Serial Number" value={analytics.s_no} />
                  <InfoItem icon={Layers} label="Source Sheet" value={analytics.source_sheet} />
                  <InfoItem icon={Briefcase} label="Budget Head" value={analytics.budget_head} />
                  <InfoItem icon={FileText} label="Scheme Name" value={analytics.name_of_scheme} />
                  <InfoItem icon={FileText} label="Sub-Scheme" value={analytics.sub_scheme_name} />
                  <InfoItem icon={Hash} label="AA/ES Reference" value={analytics.aa_es_reference} />
                  <InfoItem icon={Building2} label="Frontier HQ" value={analytics.ftr_hq_name} />
                  <InfoItem icon={MapPin} label="Sector HQ" value={analytics.shq_name} />
                  <InfoItem icon={MapPin} label="Location" value={analytics.location} />
                  <InfoItem icon={Users} label="Executive Agency" value={analytics.executive_agency} />
                  <InfoItem icon={Users} label="Contractor/Firm" value={analytics.firm_name} />
                  <InfoItem icon={CalendarDays} label="Time Allowed" value={`${analytics.time_allowed_days || 0} days`} />
                </div>
                {analytics.work_description && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Work Description</p>
                    <p className="text-xs mt-1">{analytics.work_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: All Dates */}
            <div className="col-span-6">
              <div className={`h-full p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-purple-500" />
                  Complete Timeline & Dates
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <InfoItem icon={FileText} label="TS Date" value={analytics.tsDate} color="text-blue-500" />
                  <InfoItem icon={Package} label="Tender Date" value={analytics.tenderDate} color="text-indigo-500" />
                  <InfoItem icon={CheckCircle} label="Acceptance Date" value={analytics.acceptanceDate} color="text-green-500" />
                  <InfoItem icon={Award} label="Award Date" value={analytics.awardDate} color="text-purple-500" />
                  <InfoItem icon={Flag} label="PDC Agreement" value={analytics.pdcAgreement} color="text-orange-500" />
                  <InfoItem icon={Flag} label="PDC Revised" value={analytics.pdcRevised} color="text-red-500" />
                  <InfoItem icon={CalendarCheck} label="Actual Completion" value={analytics.completionActual} color="text-green-600" />
                  <InfoItem icon={CalendarClock} label="Created At" value={analytics.created_at ? new Date(analytics.created_at).toLocaleDateString('en-IN') : '-'} color="text-gray-500" />
                  <InfoItem icon={CalendarClock} label="Updated At" value={analytics.updated_at ? new Date(analytics.updated_at).toLocaleDateString('en-IN') : '-'} color="text-gray-500" />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Time Allowed</p>
                    <p className="text-sm font-bold">{analytics.time_allowed_days || 0} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Days Elapsed</p>
                    <p className="text-sm font-bold">{analytics.elapsedDays} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Days Remaining</p>
                    <p className="text-sm font-bold">{analytics.remainingDays} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Delay</p>
                    <p className={`text-sm font-bold ${analytics.delayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {analytics.delayDays} days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Complete Financial Details */}
            <div className="col-span-6">
              <div className={`h-full p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <IndianRupee size={14} className="text-green-500" />
                  Complete Financial Analysis
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500">Sanctioned Amount</p>
                      <p className="text-lg font-bold">₹{analytics.sanctioned}L</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Previous FY Expenditure</p>
                      <p className="text-sm font-semibold">₹{analytics.expdrPrevious.toFixed(2)}L</p>
                      <p className="text-[9px] text-gray-400">(Raw: {analytics.expenditure_previous_fy})</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500">Total Expenditure</p>
                      <p className="text-lg font-bold text-purple-600">₹{analytics.expdrTotal.toFixed(2)}L</p>
                      <p className="text-[9px] text-gray-400">(From CSV: {analytics.expenditure_total})</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Current FY Expenditure</p>
                      <p className="text-sm font-semibold">₹{analytics.expdrCurrent.toFixed(2)}L</p>
                      <p className="text-[9px] text-gray-400">(Raw: {analytics.expenditure_current_fy})</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500">{analytics.remainingBudget < 0 ? 'Budget Overrun' : 'Remaining Budget'}</p>
                      <p className={`text-lg font-bold ${analytics.remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{Math.abs(analytics.remainingBudget).toFixed(2)}L
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Expenditure %</p>
                      <p className="text-sm font-semibold">{analytics.expdrPercent}%</p>
                      <p className="text-[9px] text-gray-400">(Calculated: {analytics.utilizationRate.toFixed(1)}%)</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-[9px] text-gray-500">Cost/Progress%</p>
                    <p className="text-xs font-bold">₹{(analytics.physicalProgress > 0 ? analytics.expdrTotal / analytics.physicalProgress : 0).toFixed(2)}L</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500">Projected Total</p>
                    <p className="text-xs font-bold">₹{analytics.projectedTotalCost.toFixed(2)}L</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500">Cost Overrun</p>
                    <p className={`text-xs font-bold ${analytics.costOverrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{analytics.costOverrun.toFixed(2)}L
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500">Burn Rate/Month</p>
                    <p className="text-xs font-bold">₹{(analytics.elapsedDays > 0 ? (analytics.expdrTotal / analytics.elapsedDays * 30.44) : 0).toFixed(2)}L</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Progress & Performance */}
            <div className="col-span-6">
              <div className={`h-full p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-500" />
                  Progress & Performance Analysis
                </h3>
                
                {/* Progress Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Physical Progress</span>
                      <span className="font-bold">{analytics.physicalProgress.toFixed(1)}% (CSV: {analytics.physical_progress_percent}%)</span>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div className="absolute h-full bg-purple-200 dark:bg-purple-900/50" style={{ width: `${analytics.expectedProgress}%` }} />
                      <div className={`absolute h-full ${analytics.physicalProgress >= 100 ? 'bg-green-500' : analytics.physicalProgress >= 50 ? 'bg-blue-500' : 'bg-orange-500'} transition-all`}
                        style={{ width: `${Math.min(100, analytics.physicalProgress)}%` }} />
                      {analytics.expectedProgress > 0 && analytics.expectedProgress < 100 && (
                        <div className="absolute top-0 h-full w-0.5 bg-purple-600" style={{ left: `${analytics.expectedProgress}%` }} />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Financial Utilization</span>
                      <span className="font-bold">{analytics.utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div className={`h-full ${analytics.utilizationRate > 90 ? 'bg-red-500' : analytics.utilizationRate > 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, analytics.utilizationRate)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Cost Efficiency</p>
                    <p className="text-sm font-bold">{analytics.costEfficiency.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Time Efficiency</p>
                    <p className="text-sm font-bold">{analytics.timeEfficiency.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Progress Variance</p>
                    <p className={`text-sm font-bold ${analytics.progressVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.progressVariance > 0 ? '+' : ''}{analytics.progressVariance.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Risk Analysis */}
            <div className="col-span-12">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield size={14} className="text-red-500" />
                  Risk Assessment
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className={`p-3 rounded-lg ${getRiskColor(analytics.scheduleRisk)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} />
                      <span className="text-xs font-semibold">Schedule Risk</span>
                    </div>
                    <p className="text-sm font-bold">{analytics.scheduleRisk}</p>
                    <p className="text-[10px] mt-1">
                      {analytics.delayDays > 0 ? `${analytics.delayDays} days delayed` : 'On schedule'}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getRiskColor(analytics.budgetRisk)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={12} />
                      <span className="text-xs font-semibold">Budget Risk</span>
                    </div>
                    <p className="text-sm font-bold">{analytics.budgetRisk}</p>
                    <p className="text-[10px] mt-1">
                      {analytics.utilizationRate.toFixed(1)}% utilized
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getRiskColor(analytics.performanceRisk)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={12} />
                      <span className="text-xs font-semibold">Performance Risk</span>
                    </div>
                    <p className="text-sm font-bold">{analytics.performanceRisk}</p>
                    <p className="text-[10px] mt-1">
                      {analytics.progressVariance.toFixed(1)}% variance
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getRiskColor(analytics.scheduleRisk === 'CRITICAL' || analytics.budgetRisk === 'CRITICAL' || analytics.performanceRisk === 'CRITICAL' ? 'CRITICAL' : 
                    analytics.scheduleRisk === 'HIGH' || analytics.budgetRisk === 'HIGH' || analytics.performanceRisk === 'HIGH' ? 'HIGH' : 
                    analytics.scheduleRisk === 'MEDIUM' || analytics.budgetRisk === 'MEDIUM' || analytics.performanceRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW')}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={12} />
                      <span className="text-xs font-semibold">Overall Risk</span>
                    </div>
                    <p className="text-sm font-bold">
                      {analytics.scheduleRisk === 'CRITICAL' || analytics.budgetRisk === 'CRITICAL' || analytics.performanceRisk === 'CRITICAL' ? 'CRITICAL' : 
                       analytics.scheduleRisk === 'HIGH' || analytics.budgetRisk === 'HIGH' || analytics.performanceRisk === 'HIGH' ? 'HIGH' : 
                       analytics.scheduleRisk === 'MEDIUM' || analytics.budgetRisk === 'MEDIUM' || analytics.performanceRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW'}
                    </p>
                    <p className="text-[10px] mt-1">Combined assessment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Remarks - Always show */}
            <div className="col-span-12">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-amber-500" />
                  Remarks
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {analytics.remarks || 'No remarks available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(FitViewModal);