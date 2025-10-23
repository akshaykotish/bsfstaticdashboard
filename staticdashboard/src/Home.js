// src/Home.js
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, ArrowRight, Activity, TrendingUp, Database,
  Users, Clock, CheckCircle, AlertTriangle, Settings,
  BarChart, FileText, Shield, Zap, Server, Cloud,
  GitBranch, Package, Layers, FolderOpen
} from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    engineering: { projects: 0, budget: 0, progress: 0 },
    operations: { tasks: 0, completed: 0, pending: 0 },
    system: { databases: 0, records: 0, columns: 0 }
  });

  useEffect(() => {
    // Fetch stats from localStorage or API
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    // Simulate fetching stats
    try {
      // You can replace this with actual API calls
      const engineeringData = localStorage.getItem('engineering_stats');
      const operationsData = localStorage.getItem('operations_stats');
      
      // Fetch system stats from API
      try {
        const response = await fetch('http://localhost:3456/api/databases');
        if (response.ok) {
          const data = await response.json();
          const totalRecords = data.databases?.reduce((sum, db) => sum + (db.recordCount || 0), 0) || 0;
          const avgColumns = data.databases?.length > 0 
            ? Math.round(data.databases.reduce((sum, db) => sum + (db.columns?.length || 0), 0) / data.databases.length)
            : 0;
          
          setStats(prev => ({
            ...prev,
            system: {
              databases: data.databases?.length || 0,
              records: totalRecords,
              columns: avgColumns
            }
          }));
        }
      } catch (err) {
        console.log('Could not fetch system stats');
      }

      // Set some demo stats for now
      setStats(prev => ({
        ...prev,
        engineering: {
          projects: engineeringData ? JSON.parse(engineeringData).totalProjects : 1426,
          budget: engineeringData ? JSON.parse(engineeringData).totalBudget : 8542.65,
          progress: engineeringData ? JSON.parse(engineeringData).avgProgress : 45.2
        },
        operations: {
          tasks: operationsData ? JSON.parse(operationsData).totalTasks : 105,
          completed: operationsData ? JSON.parse(operationsData).completed : 67,
          pending: operationsData ? JSON.parse(operationsData).pending : 38
        }
      }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const dashboards = [
    {
      id: 'engineering',
      title: 'Engineering',
      description: 'Analytics Hub for Engineering Projects',
      icon: LayoutGrid,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      stats: [
        { label: 'Projects', value: stats.engineering.projects, icon: FolderOpen },
        { label: 'Budget', value: `₹${stats.engineering.budget} Cr`, icon: TrendingUp },
        { label: 'Avg Progress', value: `${stats.engineering.progress}%`, icon: Activity }
      ],
      features: ['Project Tracking', 'Budget Analysis', 'Progress Monitoring', 'Risk Assessment']
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Operational Management and Control Center',
      icon: GitBranch,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-500/10 to-green-600/10',
      stats: [
        { label: 'Total Tasks', value: stats.operations.tasks, icon: Package },
        { label: 'Completed', value: stats.operations.completed, icon: CheckCircle },
        { label: 'Pending', value: stats.operations.pending, icon: Clock }
      ],
      features: ['Task Management', 'Resource Allocation', 'Timeline Tracking', 'Performance Metrics']
    },
    {
      id: 'system',
      title: 'Data Management System',
      description: 'Comprehensive data upload, configuration and management',
      icon: Database,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      stats: [
        { label: 'Databases', value: stats.system.databases, icon: Server },
        { label: 'Records', value: stats.system.records, icon: Layers },
        { label: 'Columns', value: stats.system.columns, icon: BarChart }
      ],
      features: ['Excel Upload', 'Column Mapping', 'CRUD Operations', 'Data Export']
    }
  ];

  const quickActions = [
    {
      title: 'Upload Data',
      description: 'Import Excel/CSV files',
      icon: Cloud,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      action: () => onNavigate('system')
    },
    {
      title: 'View Reports',
      description: 'Analytics & insights',
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      action: () => onNavigate('engineering')
    },
    {
      title: 'System Settings',
      description: 'Configure preferences',
      icon: Settings,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      action: () => onNavigate('system')
    },
    {
      title: 'Security',
      description: 'Access control',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      action: () => {}
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                BSF Command Center
              </h1>
              <p className="text-base text-gray-600">
                Centralized dashboard for all operational modules
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">System Online</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <div
                key={dashboard.id}
                onClick={() => onNavigate(dashboard.id)}
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden"
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${dashboard.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${dashboard.gradient} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300 mt-2" />
                  </div>

                  {/* Title & Description */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {dashboard.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {dashboard.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {dashboard.features.map((feature, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="group p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {action.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {action.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">System Performance</div>
                <div className="text-sm font-semibold text-gray-900">Optimal</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Active Users</div>
                <div className="text-sm font-semibold text-gray-900">24 Online</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Server Status</div>
                <div className="text-sm font-semibold text-gray-900">Running</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Alerts</div>
                <div className="text-sm font-semibold text-gray-900">3 Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;