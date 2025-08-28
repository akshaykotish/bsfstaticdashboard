import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, ScatterChart, Scatter, Treemap, 
  Sankey, FunnelChart, Funnel, LabelList
} from 'recharts';
import { 
  Building, TrendingUp, DollarSign, Clock, CheckCircle, 
  AlertCircle, Activity, Briefcase, Filter, Download,
  Calendar, Users, Target, FileText, Award, Shield, 
  AlertTriangle, MapPin, Layers, Zap, Eye, ChevronRight,
  BarChart3, PieChart as PieChartIcon, TrendingDown, RefreshCw,
  ArrowUpRight, ArrowDownRight, Info, Settings, Database,
  X, ChevronDown, Search, FileDown, Bell, Clock3, XCircle,
  Maximize2, GitBranch, Package, IndianRupee, Timer,
  Building2, Map, UserCheck, Gauge, PlayCircle
} from 'lucide-react';

const CHART_COLORS = {
  primary: ['#f97316', '#fb923c', '#fed7aa'],
  secondary: ['#64748b', '#94a3b8', '#cbd5e1'],
  vibrant: ['#f97316', '#dc2626', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b'],
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7'
  },
  gradient: {
    orange: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    purple: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
  }
};

const Engineering = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Enhanced filters with sliders
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [selectedBudgetHead, setSelectedBudgetHead] = useState('all');
  const [selectedFrontier, setSelectedFrontier] = useState('all');
  const [progressRange, setProgressRange] = useState([0, 100]);
  const [amountRange, setAmountRange] = useState([0, 100000]);
  const [delayRange, setDelayRange] = useState([0, 365]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // View states
  const [activeChart, setActiveChart] = useState('overview');
  const [drillDownData, setDrillDownData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Helper functions
  const calculateEfficiency = (row) => {
    const progress = parseFloat(row.physical_progress) || 0;
    const expdr = parseFloat(row.percent_expdr) || 0;
    if (expdr === 0) return progress > 0 ? 100 : 0;
    return Math.min(100, (progress / expdr) * 100);
  };

  const calculateDelay = (row) => {
    if (!row.pdc_agreement || row.physical_progress >= 100) return 0;
    const pdc = new Date(row.pdc_agreement);
    const today = new Date();
    const diffTime = today - pdc;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateRiskLevel = (row) => {
    const progress = parseFloat(row.physical_progress) || 0;
    const delay = calculateDelay(row);
    const efficiency = calculateEfficiency(row);
    
    if (delay > 180 || (progress < 30 && delay > 90) || efficiency < 30) return 'CRITICAL';
    if (delay > 90 || (progress < 50 && delay > 30) || efficiency < 50) return 'HIGH';
    if (delay > 30 || progress < 70 || efficiency < 70) return 'MEDIUM';
    return 'LOW';
  };

  const determinePriority = (row) => {
    const amount = parseFloat(row.sanctioned_amount) || 0;
    const progress = parseFloat(row.physical_progress) || 0;
    const delay = calculateDelay(row);
    
    if (amount > 10000 || (progress < 30 && amount > 5000) || delay > 90) return 'HIGH';
    if (amount > 5000 || (progress < 50 && amount > 2500) || delay > 30) return 'MEDIUM';
    return 'LOW';
  };

  const calculateHealthScore = (row) => {
    const progress = parseFloat(row.physical_progress) || 0;
    const efficiency = calculateEfficiency(row);
    const delayPenalty = Math.min(30, calculateDelay(row) / 6);
    return Math.max(0, (progress * 0.4 + efficiency * 0.4 - delayPenalty + 20));
  };

  // Load CSV data
  useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/engineering.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fileContent = await response.text();
      
      const Papa = await import('papaparse');
      const result = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      const processedData = result.data
        .filter(row => row.serial_no && row.scheme_name)
        .map((row, index) => {
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
            cleanRow[cleanKey] = row[key];
          });

          const processedRow = {
            id: index + 1,
            serial_no: cleanRow.serial_no || index + 1,
            budget_head: cleanRow.budget_head || 'N/A',
            scheme_name: cleanRow.scheme_name || 'Unnamed Scheme',
            ftr_hq: cleanRow.ftr_hq || 'Unknown',
            shq: cleanRow.shq || 'Unknown',
            work_site: cleanRow.work_site || 'Unknown Location',
            executive_agency: cleanRow.executive_agency || 'Unknown Agency',
            sanctioned_amount: parseFloat(cleanRow.sanctioned_amount) || 0,
            date_award: cleanRow.date_award || '',
            date_tender: cleanRow.date_tender || '',
            pdc_agreement: cleanRow.pdc_agreement || '',
            revised_pdc: cleanRow.revised_pdc || '',
            actual_completion_date: cleanRow.actual_completion_date || '',
            firm_name: cleanRow.firm_name || 'Unknown Contractor',
            physical_progress: parseFloat(cleanRow.physical_progress) || 0,
            progress_status: cleanRow.progress_status || 'Unknown',
            expdr_upto_31mar25: parseFloat(cleanRow.expdr_upto_31mar25) || 0,
            expdr_cfy: parseFloat(cleanRow.expdr_cfy) || 0,
            total_expdr: parseFloat(cleanRow.total_expdr) || 0,
            percent_expdr: parseFloat(cleanRow.percent_expdr) || 0,
            time_allowed_days: parseInt(cleanRow.time_allowed_days) || 0,
            remarks: cleanRow.remarks || ''
          };

          // Calculate derived fields
          processedRow.remaining_amount = processedRow.sanctioned_amount - processedRow.total_expdr;
          processedRow.efficiency_score = calculateEfficiency(processedRow);
          processedRow.delay_days = calculateDelay(processedRow);
          processedRow.risk_level = calculateRiskLevel(processedRow);
          processedRow.priority = determinePriority(processedRow);
          processedRow.health_score = calculateHealthScore(processedRow);
          
          // Status determination
          if (processedRow.physical_progress >= 100) {
            processedRow.status = 'COMPLETED';
          } else if (processedRow.physical_progress > 75) {
            processedRow.status = 'NEAR_COMPLETION';
          } else if (processedRow.physical_progress > 50) {
            processedRow.status = 'ADVANCED';
          } else if (processedRow.physical_progress > 25) {
            processedRow.status = 'IN_PROGRESS';
          } else if (processedRow.physical_progress > 0) {
            processedRow.status = 'INITIAL';
          } else {
            processedRow.status = 'NOT_STARTED';
          }

          return processedRow;
        });

      // Set initial amount range based on data
      const amounts = processedData.map(d => d.sanctioned_amount);
      const maxAmount = Math.max(...amounts);
      setAmountRange([0, Math.ceil(maxAmount)]);

      setRawData(processedData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load engineering.csv file. Make sure the file is in the public folder.');
      setLoading(false);
    }
  };

  loadData();
}, []);

  
  // Enhanced filtering with all parameters
  const filteredData = useMemo(() => {
    let filtered = [...rawData];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.scheme_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.work_site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.firm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.executive_agency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.budget_head?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Progress range filter
    filtered = filtered.filter(item => 
      item.physical_progress >= progressRange[0] && 
      item.physical_progress <= progressRange[1]
    );

    // Amount range filter
    filtered = filtered.filter(item => 
      item.sanctioned_amount >= amountRange[0] && 
      item.sanctioned_amount <= amountRange[1]
    );

    // Delay range filter
    filtered = filtered.filter(item => 
      item.delay_days >= delayRange[0] && 
      item.delay_days <= delayRange[1]
    );

    // Risk level filter
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(item => item.risk_level === selectedRiskLevel);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Frontier filter
    if (selectedFrontier !== 'all') {
      filtered = filtered.filter(item => 
        item.ftr_hq === selectedFrontier || item.shq === selectedFrontier
      );
    }

    // Agency filter
    if (selectedAgency !== 'all') {
      filtered = filtered.filter(item => item.executive_agency === selectedAgency);
    }

    // Budget head filter
    if (selectedBudgetHead !== 'all') {
      filtered = filtered.filter(item => item.budget_head === selectedBudgetHead);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        if (!item.date_award) return false;
        const awardDate = new Date(item.date_award);
        return awardDate >= new Date(dateRange.start) && awardDate <= new Date(dateRange.end);
      });
    }

    return filtered;
  }, [rawData, searchTerm, progressRange, amountRange, delayRange, selectedRiskLevel, 
      selectedStatus, selectedFrontier, selectedAgency, selectedBudgetHead, dateRange]);

  // Comprehensive metrics
  const metrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return {
      totalProjects: 0,
      totalSanctionedCr: 0,
      totalExpenditureCr: 0,
      remainingBudgetCr: 0,
      avgProgress: 0,
      avgEfficiency: 0,
      avgHealthScore: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      critical: 0,
      delayed: 0,
      onTrack: 0,
      utilizationRate: 0,
      completionRate: 0,
      delayRate: 0,
      criticalRate: 0
    };

    const totalSanctioned = filteredData.reduce((sum, item) => sum + item.sanctioned_amount, 0);
    const totalExpenditure = filteredData.reduce((sum, item) => sum + item.total_expdr, 0);
    const avgProgress = filteredData.reduce((sum, item) => sum + item.physical_progress, 0) / total;
    const avgEfficiency = filteredData.reduce((sum, item) => sum + item.efficiency_score, 0) / total;
    const avgHealthScore = filteredData.reduce((sum, item) => sum + item.health_score, 0) / total;
    
    const completed = filteredData.filter(item => item.physical_progress >= 100).length;
    const ongoing = filteredData.filter(item => item.physical_progress > 0 && item.physical_progress < 100).length;
    const notStarted = filteredData.filter(item => item.physical_progress === 0).length;
    const critical = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
    const delayed = filteredData.filter(item => item.delay_days > 0).length;
    const onTrack = filteredData.filter(item => item.delay_days === 0 && item.physical_progress > 0).length;
    
    return {
      totalProjects: total,
      totalSanctionedCr: totalSanctioned / 10000,
      totalExpenditureCr: totalExpenditure / 10000,
      remainingBudgetCr: (totalSanctioned - totalExpenditure) / 10000,
      avgProgress: avgProgress.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgHealthScore: avgHealthScore.toFixed(1),
      completed,
      ongoing,
      notStarted,
      critical,
      delayed,
      onTrack,
      utilizationRate: totalSanctioned ? ((totalExpenditure / totalSanctioned) * 100).toFixed(1) : 0,
      completionRate: total ? ((completed / total) * 100).toFixed(1) : 0,
      delayRate: total ? ((delayed / total) * 100).toFixed(1) : 0,
      criticalRate: total ? ((critical / total) * 100).toFixed(1) : 0
    };
  }, [filteredData]);

  // Progress distribution for funnel chart
  const progressFunnel = useMemo(() => {
    const distribution = [
      { name: 'Total Projects', value: filteredData.length, fill: '#64748b' },
      { name: 'Started', value: 0, fill: '#f59e0b' },
      { name: '> 25% Progress', value: 0, fill: '#fb923c' },
      { name: '> 50% Progress', value: 0, fill: '#f97316' },
      { name: '> 75% Progress', value: 0, fill: '#3b82f6' },
      { name: 'Completed', value: 0, fill: '#10b981' }
    ];

    filteredData.forEach(item => {
      const progress = item.physical_progress;
      if (progress > 0) distribution[1].value++;
      if (progress > 25) distribution[2].value++;
      if (progress > 50) distribution[3].value++;
      if (progress > 75) distribution[4].value++;
      if (progress >= 100) distribution[5].value++;
    });

    return distribution;
  }, [filteredData]);

  // Agency performance radar data
  const agencyRadarData = useMemo(() => {
    const agencies = {};
    
    filteredData.forEach(item => {
      const agency = item.executive_agency;
      if (!agencies[agency]) {
        agencies[agency] = {
          name: agency,
          projects: 0,
          totalProgress: 0,
          totalEfficiency: 0,
          totalHealth: 0,
          completed: 0,
          delayed: 0,
          critical: 0,
          totalBudget: 0,
          totalSpent: 0
        };
      }
      
      agencies[agency].projects++;
      agencies[agency].totalProgress += item.physical_progress;
      agencies[agency].totalEfficiency += item.efficiency_score;
      agencies[agency].totalHealth += item.health_score;
      agencies[agency].totalBudget += item.sanctioned_amount;
      agencies[agency].totalSpent += item.total_expdr;
      
      if (item.physical_progress >= 100) agencies[agency].completed++;
      if (item.delay_days > 0) agencies[agency].delayed++;
      if (item.risk_level === 'CRITICAL') agencies[agency].critical++;
    });

    return Object.values(agencies)
      .map(agency => ({
        agency: agency.name,
        progress: agency.projects ? (agency.totalProgress / agency.projects).toFixed(1) : 0,
        efficiency: agency.projects ? (agency.totalEfficiency / agency.projects).toFixed(1) : 0,
        health: agency.projects ? (agency.totalHealth / agency.projects).toFixed(1) : 0,
        completion: agency.projects ? ((agency.completed / agency.projects) * 100).toFixed(1) : 0,
        onTime: agency.projects ? (((agency.projects - agency.delayed) / agency.projects) * 100).toFixed(1) : 0,
        projects: agency.projects,
        budget: (agency.totalBudget / 10000).toFixed(2),
        utilization: agency.totalBudget ? ((agency.totalSpent / agency.totalBudget) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.health - a.health)
      .slice(0, 8);
  }, [filteredData]);

  // Budget head treemap data
  const budgetTreemapData = useMemo(() => {
    const budgetHeads = {};
    
    filteredData.forEach(item => {
      const head = item.budget_head || 'Unknown';
      if (!budgetHeads[head]) {
        budgetHeads[head] = {
          name: head,
          value: 0,
          projects: 0,
          completed: 0,
          avgProgress: 0,
          critical: 0
        };
      }
      
      budgetHeads[head].value += item.sanctioned_amount;
      budgetHeads[head].projects++;
      budgetHeads[head].avgProgress += item.physical_progress;
      if (item.physical_progress >= 100) budgetHeads[head].completed++;
      if (item.risk_level === 'CRITICAL') budgetHeads[head].critical++;
    });

    return Object.values(budgetHeads).map(head => ({
      name: head.name,
      value: head.value,
      projects: head.projects,
      avgProgress: head.projects ? (head.avgProgress / head.projects).toFixed(1) : 0,
      completionRate: head.projects ? ((head.completed / head.projects) * 100).toFixed(1) : 0,
      criticalRate: head.projects ? ((head.critical / head.projects) * 100).toFixed(1) : 0,
      fill: head.critical / head.projects > 0.3 ? '#ef4444' :
            head.critical / head.projects > 0.15 ? '#f59e0b' :
            head.avgProgress / head.projects > 75 ? '#10b981' : '#3b82f6'
    }));
  }, [filteredData]);

  // Time series analysis
  const timeSeriesData = useMemo(() => {
    const monthlyData = {};
    
    filteredData.forEach(item => {
      if (item.date_award) {
        const date = new Date(item.date_award);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            initiated: 0,
            sanctioned: 0,
            expenditure: 0,
            completed: 0,
            avgProgress: 0,
            projectCount: 0
          };
        }
        
        monthlyData[monthKey].initiated++;
        monthlyData[monthKey].sanctioned += item.sanctioned_amount;
        monthlyData[monthKey].expenditure += item.total_expdr;
        monthlyData[monthKey].avgProgress += item.physical_progress;
        monthlyData[monthKey].projectCount++;
        if (item.physical_progress >= 100) monthlyData[monthKey].completed++;
      }
    });

    return Object.values(monthlyData)
      .map(item => ({
        ...item,
        avgProgress: item.projectCount ? (item.avgProgress / item.projectCount).toFixed(1) : 0,
        sanctionedCr: (item.sanctioned / 10000).toFixed(2),
        expenditureCr: (item.expenditure / 10000).toFixed(2)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-24);
  }, [filteredData]);

  // Contractor performance analysis
  const contractorAnalysis = useMemo(() => {
    const contractors = {};
    
    filteredData.forEach(item => {
      const contractor = item.firm_name || 'Unknown';
      if (!contractors[contractor]) {
        contractors[contractor] = {
          name: contractor,
          projects: 0,
          totalValue: 0,
          avgProgress: 0,
          avgDelay: 0,
          completed: 0,
          critical: 0
        };
      }
      
      contractors[contractor].projects++;
      contractors[contractor].totalValue += item.sanctioned_amount;
      contractors[contractor].avgProgress += item.physical_progress;
      contractors[contractor].avgDelay += item.delay_days;
      if (item.physical_progress >= 100) contractors[contractor].completed++;
      if (item.risk_level === 'CRITICAL') contractors[contractor].critical++;
    });

    return Object.values(contractors)
      .map(contractor => ({
        ...contractor,
        avgProgress: contractor.projects ? (contractor.avgProgress / contractor.projects).toFixed(1) : 0,
        avgDelay: contractor.projects ? (contractor.avgDelay / contractor.projects).toFixed(0) : 0,
        completionRate: contractor.projects ? ((contractor.completed / contractor.projects) * 100).toFixed(1) : 0,
        criticalRate: contractor.projects ? ((contractor.critical / contractor.projects) * 100).toFixed(1) : 0,
        valueCr: (contractor.totalValue / 10000).toFixed(2)
      }))
      .filter(c => c.projects > 1)
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 20);
  }, [filteredData]);

  // Location-wise distribution
  const locationDistribution = useMemo(() => {
    const locations = {};
    
    filteredData.forEach(item => {
      const location = item.work_site || 'Unknown';
      const key = location.split(',')[0].trim();
      
      if (!locations[key]) {
        locations[key] = {
          location: key,
          projects: 0,
          budget: 0,
          avgProgress: 0,
          delayed: 0,
          critical: 0
        };
      }
      
      locations[key].projects++;
      locations[key].budget += item.sanctioned_amount;
      locations[key].avgProgress += item.physical_progress;
      if (item.delay_days > 0) locations[key].delayed++;
      if (item.risk_level === 'CRITICAL') locations[key].critical++;
    });

    return Object.values(locations)
      .map(loc => ({
        ...loc,
        avgProgress: loc.projects ? (loc.avgProgress / loc.projects).toFixed(1) : 0,
        budgetCr: (loc.budget / 10000).toFixed(2),
        delayRate: loc.projects ? ((loc.delayed / loc.projects) * 100).toFixed(1) : 0
      }))
      .filter(loc => loc.projects > 2)
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 15);
  }, [filteredData]);

  // Risk matrix scatter data
  const riskMatrixData = useMemo(() => {
    return filteredData.slice(0, 200).map(item => ({
      x: item.physical_progress,
      y: item.delay_days,
      z: item.sanctioned_amount / 1000,
      name: item.scheme_name,
      risk: item.risk_level,
      efficiency: item.efficiency_score,
      fill: item.risk_level === 'CRITICAL' ? '#ef4444' :
            item.risk_level === 'HIGH' ? '#f59e0b' :
            item.risk_level === 'MEDIUM' ? '#fb923c' : '#10b981'
    }));
  }, [filteredData]);

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-xl border border-orange-200">
          <p className="text-sm font-bold text-orange-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-700">
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.name}:
              </span>{' '}
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString('en-IN') 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle metric click for drill-down
  const handleMetricClick = (metricType, value) => {
    setSelectedMetric({ type: metricType, value });
    setActiveChart('drill-down');
    
    // Filter data based on metric type
    let drillData = [];
    switch(metricType) {
      case 'critical':
        drillData = filteredData.filter(d => d.risk_level === 'CRITICAL');
        break;
      case 'delayed':
        drillData = filteredData.filter(d => d.delay_days > 0);
        break;
      case 'completed':
        drillData = filteredData.filter(d => d.physical_progress >= 100);
        break;
      case 'ongoing':
        drillData = filteredData.filter(d => d.physical_progress > 0 && d.physical_progress < 100);
        break;
      default:
        drillData = filteredData;
    }
    setDrillDownData(drillData);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFrontier('all');
    setSelectedAgency('all');
    setSelectedBudgetHead('all');
    setSelectedRiskLevel('all');
    setSelectedStatus('all');
    setProgressRange([0, 100]);
    setAmountRange([0, Math.max(...rawData.map(d => d.sanctioned_amount))]);
    setDelayRange([0, 365]);
    setDateRange({ start: '', end: '' });
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      Object.keys(filteredData[0]).join(','),
      ...filteredData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engineering-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-bold text-orange-800">Loading Engineering Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg font-bold text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="p-4 lg:p-6">
        <div className="max-w-[2000px] mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 border border-orange-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl shadow-lg" style={{ background: CHART_COLORS.gradient.orange }}>
                  <Building size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-800">
                    Engineering Analytics Hub
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Activity size={14} className="text-green-500" />
                      {metrics.totalProjects} Projects
                    </span>
                    <span>•</span>
                    <span>₹{metrics.totalSanctionedCr.toFixed(2)} Cr Budget</span>
                    <span>•</span>
                    <span>{new Date().toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Reset
                </button>
                <button
                  onClick={exportData}
                  className="px-4 py-2 text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  style={{ background: CHART_COLORS.gradient.orange }}
                >
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters with Sliders */}
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-orange-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Status</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="INITIAL">Initial (1-25%)</option>
                <option value="IN_PROGRESS">In Progress (26-50%)</option>
                <option value="ADVANCED">Advanced (51-75%)</option>
                <option value="NEAR_COMPLETION">Near Completion (76-99%)</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Risk Level Filter */}
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Budget Head */}
              <select
                value={selectedBudgetHead}
                onChange={(e) => setSelectedBudgetHead(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Budget Heads</option>
                {[...new Set(rawData.map(d => d.budget_head))].filter(Boolean).sort().map(head => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>

              {/* Agency Filter */}
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Agencies</option>
                {[...new Set(rawData.map(d => d.executive_agency))].filter(Boolean).sort().map(agency => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>

              {/* Frontier Filter */}
              <select
                value={selectedFrontier}
                onChange={(e) => setSelectedFrontier(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Frontiers</option>
                {[...new Set([...rawData.map(d => d.ftr_hq), ...rawData.map(d => d.shq)])].filter(Boolean).sort().map(frontier => (
                  <option key={frontier} value={frontier}>{frontier}</option>
                ))}
              </select>

              {/* Date Range */}
              <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 p-4 bg-orange-50 rounded-lg">
              {/* Progress Range Slider */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Progress Range: {progressRange[0]}% - {progressRange[1]}%
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressRange[0]}
                    onChange={(e) => setProgressRange([parseInt(e.target.value), progressRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressRange[1]}
                    onChange={(e) => setProgressRange([progressRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Amount Range Slider */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Budget Range: ₹{(amountRange[0]/100).toFixed(0)}L - ₹{(amountRange[1]/100).toFixed(0)}L
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...rawData.map(d => d.sanctioned_amount))}
                    value={amountRange[0]}
                    onChange={(e) => setAmountRange([parseInt(e.target.value), amountRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...rawData.map(d => d.sanctioned_amount))}
                    value={amountRange[1]}
                    onChange={(e) => setAmountRange([amountRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Delay Range Slider */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Delay Range: {delayRange[0]} - {delayRange[1]} days
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="365"
                    value={delayRange[0]}
                    onChange={(e) => setDelayRange([parseInt(e.target.value), delayRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="365"
                    value={delayRange[1]}
                    onChange={(e) => setDelayRange([delayRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards - Clickable */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: 'Total Projects',
                value: metrics.totalProjects,
                subtitle: `${metrics.ongoing} Active`,
                icon: Briefcase,
                color: 'blue',
                metric: 'total'
              },
              {
                title: 'Budget',
                value: `₹${metrics.totalSanctionedCr.toFixed(2)}Cr`,
                subtitle: `${metrics.utilizationRate}% Used`,
                icon: IndianRupee,
                color: 'orange',
                metric: 'budget'
              },
              {
                title: 'Completed',
                value: metrics.completed,
                subtitle: `${metrics.completionRate}%`,
                icon: CheckCircle,
                color: 'green',
                metric: 'completed'
              },
              {
                title: 'Critical',
                value: metrics.critical,
                subtitle: `${metrics.criticalRate}%`,
                icon: AlertTriangle,
                color: 'red',
                metric: 'critical'
              },
              {
                title: 'Delayed',
                value: metrics.delayed,
                subtitle: `${metrics.delayRate}%`,
                icon: Clock,
                color: 'yellow',
                metric: 'delayed'
              },
              {
                title: 'Health Score',
                value: `${metrics.avgHealthScore}`,
                subtitle: 'Overall',
                icon: Gauge,
                color: 'purple',
                metric: 'health'
              }
            ].map((metric, index) => (
              <div
                key={index}
                onClick={() => handleMetricClick(metric.metric, metric.value)}
                className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {metric.title}
                  </span>
                  <metric.icon size={20} className={`text-${metric.color}-500`} />
                </div>
                <div className="text-2xl font-black text-gray-800 mb-1">{metric.value}</div>
                <div className="text-xs text-gray-600">{metric.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Chart Navigation */}
          <div className="bg-white rounded-xl shadow-md p-2">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'progress', label: 'Progress Analysis', icon: TrendingUp },
                { id: 'agency', label: 'Agency Performance', icon: Users },
                { id: 'budget', label: 'Budget Distribution', icon: DollarSign },
                { id: 'risk', label: 'Risk Matrix', icon: Shield },
                { id: 'timeline', label: 'Timeline', icon: Calendar },
                { id: 'contractor', label: 'Contractors', icon: Building2 },
                { id: 'location', label: 'Locations', icon: Map }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChart(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeChart === tab.id 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-orange-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Chart Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeChart === 'overview' && (
              <>
                {/* Progress Funnel */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                    Progress Funnel
                    <Layers size={20} className="text-orange-500" />
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <FunnelChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Funnel
                        dataKey="value"
                        data={progressFunnel}
                        isAnimationActive
                      >
                        {progressFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList position="center" fill="#fff" stroke="none" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>

                {/* Agency Radar */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                    Top Agency Performance
                    <Award size={20} className="text-orange-500" />
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={agencyRadarData.slice(0, 6)}>
                      <PolarGrid strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="agency" fontSize={10} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
                      <Radar name="Progress" dataKey="progress" stroke="#f97316" fill="#fb923c" fillOpacity={0.3} />
                      <Radar name="Efficiency" dataKey="efficiency" stroke="#3b82f6" fill="#60a5fa" fillOpacity={0.3} />
                      <Radar name="Health" dataKey="health" stroke="#10b981" fill="#34d399" fillOpacity={0.3} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Budget Treemap */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                    Budget Head Distribution
                    <PieChartIcon size={20} className="text-orange-500" />
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                      data={budgetTreemapData}
                      dataKey="value"
                      aspectRatio={4 / 3}
                      stroke="#fff"
                      fill="#f97316"
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'progress' && (
              <>
                {/* Progress Distribution Bar */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Progress Distribution by Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { status: 'Not Started', count: filteredData.filter(d => d.status === 'NOT_STARTED').length, color: '#dc2626' },
                      { status: 'Initial', count: filteredData.filter(d => d.status === 'INITIAL').length, color: '#ef4444' },
                      { status: 'In Progress', count: filteredData.filter(d => d.status === 'IN_PROGRESS').length, color: '#f59e0b' },
                      { status: 'Advanced', count: filteredData.filter(d => d.status === 'ADVANCED').length, color: '#fb923c' },
                      { status: 'Near Done', count: filteredData.filter(d => d.status === 'NEAR_COMPLETION').length, color: '#3b82f6' },
                      { status: 'Completed', count: filteredData.filter(d => d.status === 'COMPLETED').length, color: '#10b981' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <Cell key={`cell-${index}`} fill={
                            index === 0 ? '#dc2626' :
                            index === 1 ? '#ef4444' :
                            index === 2 ? '#f59e0b' :
                            index === 3 ? '#fb923c' :
                            index === 4 ? '#3b82f6' : '#10b981'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Efficiency vs Progress Scatter */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Efficiency Analysis</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="physical_progress" name="Progress" unit="%" />
                      <YAxis dataKey="efficiency_score" name="Efficiency" unit="%" />
                      <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Projects" data={filteredData.slice(0, 100)}>
                        {filteredData.slice(0, 100).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.efficiency_score > 80 ? '#10b981' :
                            entry.efficiency_score > 60 ? '#3b82f6' :
                            entry.efficiency_score > 40 ? '#f59e0b' : '#ef4444'
                          } />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'agency' && (
              <>
                {/* Agency Performance Table */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Agency Performance Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Agency</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700">Projects</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700">Progress</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700">Efficiency</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700">Health</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700">Budget</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {agencyRadarData.map((agency, index) => (
                          <tr key={index} className="hover:bg-orange-50 cursor-pointer"
                              onClick={() => {
                                setSelectedAgency(agency.agency);
                                handleMetricClick('agency', agency.agency);
                              }}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {agency.agency}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">{agency.projects}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-orange-500"
                                    style={{ width: `${agency.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{agency.progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                agency.efficiency > 80 ? 'bg-green-100 text-green-700' :
                                agency.efficiency > 60 ? 'bg-blue-100 text-blue-700' :
                                agency.efficiency > 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {agency.efficiency}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="font-bold text-orange-600">{agency.health}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              ₹{agency.budget}Cr
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Agency Comparison */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Completion Rates</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agencyRadarData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agency" angle={-45} textAnchor="end" height={80} fontSize={10} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="completion" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="onTime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'budget' && (
              <>
                {/* Budget Utilization */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Budget Head Utilization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={budgetTreemapData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="value" fill="#fb923c" radius={[8, 8, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#10b981" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Budget Distribution Pie */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Budget Heads</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={budgetTreemapData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ₹${(value/10000).toFixed(2)}Cr`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {budgetTreemapData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS.vibrant[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'risk' && (
              <>
                {/* Risk Matrix Scatter */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Matrix (Progress vs Delay)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="Progress" unit="%" />
                      <YAxis dataKey="y" name="Delay" unit=" days" />
                      <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Projects" data={riskMatrixData}>
                        {riskMatrixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                        <span className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div> Critical
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div> High
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Medium
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div> Low
                        </span>
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Level Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Critical', value: filteredData.filter(d => d.risk_level === 'CRITICAL').length, fill: '#ef4444' },
                          { name: 'High', value: filteredData.filter(d => d.risk_level === 'HIGH').length, fill: '#f59e0b' },
                          { name: 'Medium', value: filteredData.filter(d => d.risk_level === 'MEDIUM').length, fill: '#fb923c' },
                          { name: 'Low', value: filteredData.filter(d => d.risk_level === 'LOW').length, fill: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((index) => (
                          <Cell key={`cell-${index}`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'timeline' && (
              <>
                {/* Time Series Analysis */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-3">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Project Initiation & Expenditure</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} fontSize={10} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="sanctionedCr" fill="#fed7aa" stroke="#fb923c" />
                      <Bar yAxisId="left" dataKey="initiated" fill="#f97316" />
                      <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeChart === 'contractor' && (
              <>
                {/* Contractor Performance Table */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-3">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Contractor Performance Analysis</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase">Contractor</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Projects</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Value (Cr)</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Avg Progress</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Avg Delay</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Completion Rate</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase">Critical Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {contractorAnalysis.map((contractor, index) => (
                          <tr key={index} className="hover:bg-orange-50 transition-colors cursor-pointer"
                              onClick={() => handleMetricClick('contractor', contractor.name)}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {contractor.name.substring(0, 30)}...
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {contractor.projects}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-bold text-blue-600">
                              ₹{contractor.valueCr}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                      width: `${contractor.avgProgress}%`,
                                      backgroundColor: contractor.avgProgress > 75 ? '#10b981' :
                                                      contractor.avgProgress > 50 ? '#3b82f6' :
                                                      contractor.avgProgress > 25 ? '#f59e0b' : '#ef4444'
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{contractor.avgProgress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`font-medium ${
                                contractor.avgDelay > 60 ? 'text-red-600' :
                                contractor.avgDelay > 30 ? 'text-orange-600' :
                                contractor.avgDelay > 0 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {contractor.avgDelay} days
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                contractor.completionRate > 75 ? 'bg-green-100 text-green-700' :
                                contractor.completionRate > 50 ? 'bg-blue-100 text-blue-700' :
                                contractor.completionRate > 25 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {contractor.completionRate}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`font-bold ${
                                contractor.criticalRate > 30 ? 'text-red-600' :
                                contractor.criticalRate > 15 ? 'text-orange-600' :
                                contractor.criticalRate > 5 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {contractor.criticalRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeChart === 'location' && (
              <>
                {/* Location Distribution */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Location-wise Project Distribution</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={locationDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="location" type="category" width={100} fontSize={10} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="projects" fill="#f97316" radius={[0, 8, 8, 0]}>
                        {locationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.delayRate > 50 ? '#ef4444' :
                            entry.delayRate > 30 ? '#f59e0b' :
                            entry.delayRate > 15 ? '#fb923c' : '#10b981'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Location Metrics */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Top Location Metrics</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {locationDistribution.slice(0, 10).map((location, index) => (
                      <div key={index} 
                           className="p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-lg cursor-pointer hover:from-orange-100 transition-all"
                           onClick={() => handleMetricClick('location', location.location)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-orange-500" />
                            <span className="font-semibold text-gray-800">{location.location}</span>
                          </div>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                            {location.projects} projects
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Budget:</span>
                            <span className="font-bold text-gray-800 ml-1">₹{location.budgetCr}Cr</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-bold text-blue-600 ml-1">{location.avgProgress}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Delay:</span>
                            <span className={`font-bold ml-1 ${
                              location.delayRate > 30 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {location.delayRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Drill-down view */}
            {activeChart === 'drill-down' && drillDownData && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 xl:col-span-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Detailed View: {selectedMetric?.type} ({drillDownData.length} projects)
                  </h3>
                  <button
                    onClick={() => {
                      setActiveChart('overview');
                      setDrillDownData(null);
                      setSelectedMetric(null);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <X size={16} />
                    Close
                  </button>
                </div>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase">S.No</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase">Scheme</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase">Location</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Budget</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Progress</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Efficiency</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Delay</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Risk</th>
                        <th className="px-3 py-2 text-center text-xs font-bold uppercase">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {drillDownData.slice(0, 100).map((project, index) => (
                        <tr key={index} className="hover:bg-orange-50 transition-colors">
                          <td className="px-3 py-2 text-xs font-medium">{project.serial_no}</td>
                          <td className="px-3 py-2 text-xs">
                            <div className="max-w-xs truncate" title={project.scheme_name}>
                              {project.scheme_name}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="max-w-[100px] truncate" title={project.work_site}>
                              {project.work_site}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-center font-semibold">
                            ₹{(project.sanctioned_amount / 100).toFixed(2)}L
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${project.physical_progress}%`,
                                    backgroundColor: project.physical_progress >= 75 ? '#10b981' :
                                                    project.physical_progress >= 50 ? '#3b82f6' :
                                                    project.physical_progress >= 25 ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium">{project.physical_progress}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-center">
                            <span className={`font-medium ${
                              project.efficiency_score > 80 ? 'text-green-600' :
                              project.efficiency_score > 60 ? 'text-blue-600' :
                              project.efficiency_score > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {project.efficiency_score.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-center">
                            {project.delay_days > 0 ? (
                              <span className={`font-medium ${
                                project.delay_days > 90 ? 'text-red-600' :
                                project.delay_days > 30 ? 'text-orange-600' : 'text-yellow-600'
                              }`}>
                                {project.delay_days}d
                              </span>
                            ) : (
                              <span className="text-green-600">On Time</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {project.risk_level}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-center">
                            <span className={`font-bold ${
                              project.health_score > 80 ? 'text-green-600' :
                              project.health_score > 60 ? 'text-blue-600' :
                              project.health_score > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {project.health_score.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Critical Projects Alert */}
            {metrics.critical > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Critical Projects Alert</h3>
                  <AlertTriangle size={28} className="animate-pulse" />
                </div>
                <div className="space-y-3">
                  {filteredData
                    .filter(p => p.risk_level === 'CRITICAL')
                    .slice(0, 3)
                    .map((project, index) => (
                      <div key={index} 
                           className="bg-white/10 backdrop-blur rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all"
                           onClick={() => handleMetricClick('project', project)}>
                        <p className="text-sm font-semibold mb-1">{project.scheme_name.substring(0, 40)}...</p>
                        <div className="flex justify-between text-xs">
                          <span>Progress: {project.physical_progress}%</span>
                          <span>Delay: {project.delay_days} days</span>
                        </div>
                      </div>
                    ))}
                </div>
                <button 
                  onClick={() => handleMetricClick('critical', metrics.critical)}
                  className="mt-4 w-full bg-white/20 backdrop-blur py-2 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
                >
                  View All {metrics.critical} Critical Projects →
                </button>
              </div>
            )}

            {/* Top Performing Agencies */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Top Performers</h3>
                <Award size={28} />
              </div>
              <div className="space-y-3">
                {agencyRadarData.slice(0, 3).map((agency, index) => (
                  <div key={index} 
                       className="bg-white/10 backdrop-blur rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all"
                       onClick={() => {
                         setSelectedAgency(agency.agency);
                         handleMetricClick('agency', agency.agency);
                       }}>
                    <p className="text-sm font-semibold mb-1">{agency.agency}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>Progress: {agency.progress}%</span>
                      <span>Health: {agency.health}</span>
                      <span>Projects: {agency.projects}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Budget Analytics</h3>
                <IndianRupee size={28} />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Budget</span>
                    <span className="font-bold">₹{metrics.totalSanctionedCr.toFixed(2)} Cr</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="h-2 rounded-full bg-white" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilized</span>
                    <span className="font-bold">₹{metrics.totalExpenditureCr.toFixed(2)} Cr</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="h-2 rounded-full bg-yellow-300" style={{ width: `${metrics.utilizationRate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Remaining</span>
                    <span className="font-bold">₹{metrics.remainingBudgetCr.toFixed(2)} Cr</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-300" 
                         style={{ width: `${100 - parseFloat(metrics.utilizationRate)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights and Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap size={24} className="text-orange-500" />
              AI-Powered Insights & Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.criticalRate > 20 && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 mb-1">High Risk Alert</p>
                      <p className="text-sm text-red-700">
                        {metrics.critical} projects ({metrics.criticalRate}%) are in critical state. 
                        Immediate intervention required for resource reallocation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {metrics.delayRate > 30 && (
                <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800 mb-1">Schedule Optimization</p>
                      <p className="text-sm text-orange-700">
                        {metrics.delayed} projects ({metrics.delayRate}%) are delayed. 
                        Review contractor performance and timeline adjustments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {metrics.utilizationRate < 60 && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 mb-1">Budget Utilization</p>
                      <p className="text-sm text-blue-700">
                        Only {metrics.utilizationRate}% of budget utilized. 
                        Accelerate fund disbursement to improve project velocity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metrics.completionRate > 70 && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800 mb-1">Strong Performance</p>
                      <p className="text-sm text-green-700">
                        {metrics.completionRate}% completion rate indicates good overall performance. 
                        Maintain momentum for remaining projects.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metrics.avgEfficiency < 70 && (
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Activity size={20} className="text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-800 mb-1">Efficiency Improvement</p>
                      <p className="text-sm text-purple-700">
                        Average efficiency at {metrics.avgEfficiency}%. 
                        Focus on process optimization and resource management.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {agencyRadarData.length > 0 && agencyRadarData[0].health < 60 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800 mb-1">Agency Support Needed</p>
                      <p className="text-sm text-yellow-700">
                        Top agencies showing health scores below 60. 
                        Provide additional support and training.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engineering;