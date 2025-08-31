import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Building2, TrendingUp, Award, AlertTriangle,
  Clock, IndianRupee, Target, Users,
  CheckCircle, XCircle, Gauge, BarChart3,
  X, Eye, ChevronDown, ChevronUp, Search,
  Download, Filter, ArrowUpDown
} from 'lucide-react';
import DataTable from '../DataTable';

const COLORS = {
  performance: {
    excellent: '#10b981',
    good: '#3b82f6', 
    average: '#f59e0b',
    poor: '#ef4444'
  },
  contractors: ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1'],
  metrics: {
    projects: '#3b82f6',
    budget: '#10b981',
    delay: '#ef4444',
    efficiency: '#8b5cf6'
  }
};

const ContractorAnalytics = ({ data, darkMode, onChartClick, formatAmount }) => {
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'projects', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const contractorMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        contractorList: [],
        topContractors: [],
        performanceChart: [],
        budgetDistribution: [],
        efficiencyScores: [],
        contractorProjects: {}
      };
    }

    // Aggregate all data by contractor
    const contractors = {};
    const contractorProjects = {};
    
    data.forEach(item => {
      const contractor = item.firm_name || 'Unknown';
      if (!contractors[contractor]) {
        contractors[contractor] = {
          name: contractor,
          projects: [],
          totalProjects: 0,
          allocated: 0,
          spent: 0,
          completed: 0,
          ongoing: 0,
          notStarted: 0,
          delayed: 0,
          onTime: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          totalProgress: 0,
          totalEfficiency: 0,
          totalDelay: 0,
          agencies: new Set(),
          locations: new Set()
        };
        contractorProjects[contractor] = [];
      }
      
      // Create a new object with calculated fields instead of modifying the original
      const projectWithCalculations = {
        ...item,
        efficiency_score: item.percent_expdr > 0 ? 
          (item.physical_progress / item.percent_expdr) * 100 : 
          item.physical_progress,
        health_score: Math.max(0, 100 - (item.delay_days || 0) / 3.65),
        risk_level: item.delay_days > 90 || (item.physical_progress < 20 && item.percent_expdr > 50) ? 'CRITICAL' :
                   item.delay_days > 60 || (item.physical_progress < 40 && item.percent_expdr > 60) ? 'HIGH' :
                   item.delay_days > 30 || (item.physical_progress < 60 && item.percent_expdr > 70) ? 'MEDIUM' : 'LOW',
        status: item.physical_progress >= 100 ? 'COMPLETED' :
               item.physical_progress >= 75 ? 'NEAR_COMPLETION' :
               item.physical_progress >= 50 ? 'ADVANCED' :
               item.physical_progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
      };
      
      // Add project to contractor's list with calculated fields
      contractors[contractor].projects.push(projectWithCalculations);
      contractorProjects[contractor].push(projectWithCalculations);
      contractors[contractor].totalProjects++;
      contractors[contractor].allocated += (item.sanctioned_amount || 0) / 100; // Convert to crores
      contractors[contractor].spent += (item.total_expdr || 0) / 100;
      contractors[contractor].totalProgress += item.physical_progress || 0;
      contractors[contractor].totalDelay += item.delay_days || 0;
      
      // Track unique agencies and locations
      if (item.executive_agency) contractors[contractor].agencies.add(item.executive_agency);
      if (item.work_site) contractors[contractor].locations.add(item.work_site);
      
      // Use the calculated efficiency score
      contractors[contractor].totalEfficiency += Math.min(100, projectWithCalculations.efficiency_score);
      
      // Project status counts
      if (item.physical_progress >= 100) contractors[contractor].completed++;
      else if (item.physical_progress > 0) contractors[contractor].ongoing++;
      else contractors[contractor].notStarted++;
      
      // Delay status
      if (item.delay_days > 0) contractors[contractor].delayed++;
      else if (item.physical_progress > 0) contractors[contractor].onTime++;
      
      // Risk level counts using calculated risk level
      if (projectWithCalculations.risk_level === 'CRITICAL') contractors[contractor].critical++;
      else if (projectWithCalculations.risk_level === 'HIGH') contractors[contractor].high++;
      else if (projectWithCalculations.risk_level === 'MEDIUM') contractors[contractor].medium++;
      else contractors[contractor].low++;
    });

    // Calculate derived metrics and create list
    const contractorList = Object.values(contractors)
      .map(c => ({
        ...c,
        avgProgress: c.totalProjects ? (c.totalProgress / c.totalProjects).toFixed(1) : 0,
        avgEfficiency: c.totalProjects ? (c.totalEfficiency / c.totalProjects).toFixed(1) : 0,
        avgDelay: c.totalProjects ? (c.totalDelay / c.totalProjects).toFixed(1) : 0,
        utilization: c.allocated ? ((c.spent / c.allocated) * 100).toFixed(1) : 0,
        completionRate: c.totalProjects ? ((c.completed / c.totalProjects) * 100).toFixed(1) : 0,
        delayRate: c.totalProjects ? ((c.delayed / c.totalProjects) * 100).toFixed(1) : 0,
        onTimeRate: c.totalProjects ? ((c.onTime / c.totalProjects) * 100).toFixed(1) : 0,
        criticalRate: c.totalProjects ? ((c.critical / c.totalProjects) * 100).toFixed(1) : 0,
        performanceScore: c.totalProjects ? (
          (c.totalProgress / c.totalProjects) * 0.3 +
          (c.totalEfficiency / c.totalProjects) * 0.3 +
          ((c.completed / c.totalProjects) * 100) * 0.2 +
          ((1 - c.critical / c.totalProjects) * 100) * 0.2
        ).toFixed(1) : 0,
        agencyCount: c.agencies.size,
        locationCount: c.locations.size
      }))
      .filter(c => c.totalProjects > 0);

    // Top contractors for chart
    const topContractors = [...contractorList]
      .sort((a, b) => b.totalProjects - a.totalProjects)
      .slice(0, 10);

    // Performance chart data
    const performanceChart = topContractors.map(c => ({
      contractor: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      projects: c.totalProjects,
      completed: c.completed,
      avgProgress: parseFloat(c.avgProgress),
      performanceScore: parseFloat(c.performanceScore)
    }));

    // Budget distribution
    const budgetDistribution = [...contractorList]
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 15)
      .map(c => ({
        contractor: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
        allocated: c.allocated,
        spent: c.spent,
        remaining: c.allocated - c.spent
      }));

    // Efficiency scores for scatter plot
    const efficiencyScores = contractorList
      .filter(c => c.totalProjects > 2)
      .map(c => ({
        x: parseFloat(c.avgProgress),
        y: parseFloat(c.avgEfficiency),
        z: c.totalProjects,
        name: c.name,
        fill: parseFloat(c.performanceScore) > 70 ? COLORS.performance.excellent :
              parseFloat(c.performanceScore) > 50 ? COLORS.performance.good :
              parseFloat(c.performanceScore) > 30 ? COLORS.performance.average :
              COLORS.performance.poor
      }));

    return {
      contractorList,
      topContractors,
      performanceChart,
      budgetDistribution,
      efficiencyScores,
      contractorProjects
    };
  }, [data]);

  // Filter and sort contractors for table
  const filteredContractors = useMemo(() => {
    let filtered = contractorMetrics.contractorList;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });
    
    return filtered;
  }, [contractorMetrics.contractorList, searchTerm, sortConfig]);

  // Pagination
  const paginatedContractors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContractors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContractors, currentPage]);

  const totalPages = Math.ceil(filteredContractors.length / itemsPerPage);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle contractor click
  const handleContractorClick = (contractor) => {
    setSelectedContractor(contractor);
    setShowContractorModal(true);
  };

  // Handle project click from within contractor modal
  const handleProjectClick = (project) => {
    setShowContractorModal(false);
    onChartClick(project, 'project');
  };

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

  // Contractor Projects Modal using DataTable
  const ContractorProjectsModal = () => {
    if (!showContractorModal || !selectedContractor) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowContractorModal(false)}
        />
        
        <div className={`relative w-[90vw] max-w-[1600px] h-[85vh] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  {selectedContractor.name} - Project Portfolio
                </h2>
                <div className={`flex flex-wrap gap-4 text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                  <span>Total Projects: <strong>{selectedContractor.totalProjects}</strong></span>
                  <span>•</span>
                  <span>Completed: <strong>{selectedContractor.completed}</strong></span>
                  <span>•</span>
                  <span>Budget: <strong>₹{selectedContractor.allocated.toFixed(2)} Cr</strong></span>
                  <span>•</span>
                  <span>Performance: <strong>{selectedContractor.performanceScore}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setShowContractorModal(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className={darkMode ? 'text-gray-300' : 'text-white'} />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Avg Progress</p>
                <p className="text-base font-bold">{selectedContractor.avgProgress}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Efficiency</p>
                <p className="text-base font-bold">{selectedContractor.avgEfficiency}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">On Time</p>
                <p className="text-base font-bold text-green-600">{selectedContractor.onTimeRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Delayed</p>
                <p className="text-base font-bold text-orange-600">{selectedContractor.delayRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Utilization</p>
                <p className="text-base font-bold">{selectedContractor.utilization}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Agencies</p>
                <p className="text-base font-bold">{selectedContractor.agencyCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Locations</p>
                <p className="text-base font-bold">{selectedContractor.locationCount}</p>
              </div>
            </div>
          </div>

          {/* DataTable for Projects */}
          <div className="flex-1 overflow-hidden">
            <DataTable
              data={contractorMetrics.contractorProjects[selectedContractor.name] || []}
              darkMode={darkMode}
              onRowClick={handleProjectClick}
              compareMode={false}
              selectedProjects={[]}
              isEmbedded={true}
              maxHeight="100%"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Building2 size={18} className="text-blue-500" />
          Top Contractors Performance Overview
        </h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={contractorMetrics.performanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="contractor" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="projects" fill={COLORS.metrics.projects} name="Projects" />
              <Bar yAxisId="left" dataKey="completed" fill={COLORS.performance.excellent} name="Completed" />
              <Line yAxisId="right" type="monotone" dataKey="performanceScore" stroke="#3b82f6" name="Performance Score" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke="#8b5cf6" name="Avg Progress %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Matrix */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Target size={16} className="text-purple-500" />
            Contractor Efficiency Matrix
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="x" name="Avg Progress %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" name="Avg Efficiency %" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Contractors" data={contractorMetrics.efficiencyScores}>
                  {contractorMetrics.efficiencyScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Distribution */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <IndianRupee size={16} className="text-green-500" />
            Budget Distribution (Top 15)
          </h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractorMetrics.budgetDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="contractor" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="allocated" fill="#3b82f6" name="Allocated (Cr)" />
                <Bar dataKey="spent" fill="#10b981" name="Spent (Cr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* All Contractors Table */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Users size={18} className="text-blue-500" />
            All Contractors ({filteredContractors.length})
          </h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contractors..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`pl-9 pr-4 py-2 rounded-lg border text-xs ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-200 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-400 focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 text-gray-700 dark:text-gray-300"
                  >
                    Contractor Name
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('totalProjects')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    Projects
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('allocated')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    Budget (Cr)
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('avgProgress')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    Avg Progress
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('completionRate')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    Completion Rate
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('onTimeRate')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    On Time Rate
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleSort('performanceScore')}
                    className="flex items-center gap-1 font-semibold hover:text-blue-500 mx-auto text-gray-700 dark:text-gray-300"
                  >
                    Score
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedContractors.map((contractor, index) => (
                <tr 
                  key={index}
                  className={`hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} cursor-pointer transition-colors`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{contractor.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{contractor.totalProjects}</span>
                    <div className="text-xs text-gray-500">
                      {contractor.completed} completed
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-900 dark:text-gray-100">
                    ₹{contractor.allocated.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${contractor.avgProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{contractor.avgProgress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-semibold text-xs ${
                      contractor.completionRate > 50 ? 'text-green-600' :
                      contractor.completionRate > 25 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {contractor.completionRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-semibold text-xs ${
                      contractor.onTimeRate > 70 ? 'text-green-600' :
                      contractor.onTimeRate > 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {contractor.onTimeRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-semibold text-xs ${
                      contractor.performanceScore > 70 ? 'text-green-600' :
                      contractor.performanceScore > 50 ? 'text-blue-600' :
                      contractor.performanceScore > 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {contractor.performanceScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleContractorClick(contractor)}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 mx-auto ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'
                      } transition-colors text-blue-600 dark:text-blue-400`}
                    >
                      <Eye size={12} />
                      View Projects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredContractors.length)} of {filteredContractors.length} contractors
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-xs ${
                  currentPage === 1 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-xs ${
                  currentPage === totalPages 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contractor Projects Modal */}
      <ContractorProjectsModal />
    </div>
  );
};

export default ContractorAnalytics;