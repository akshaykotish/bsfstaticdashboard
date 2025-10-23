import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Database, Upload, Plus, Edit2, Trash2, RefreshCw, Download,
  Search, Filter, Settings, Moon, Sun, ChevronDown, X,
  FileSpreadsheet, Server, Cloud, Eye, Copy, AlertCircle,
  CheckCircle, Info, Loader, BarChart, Grid3x3, List,
  FolderOpen, Save, Shield, Activity, TrendingUp, Users,
  Calendar, DollarSign, MapPin, Building2, Hash, FileText,
  ChevronRight, Layers, Link2, ChevronUp, AlertTriangle,
  Zap, Timer, PauseCircle, CreditCard, PlayCircle, Target,
  Key, Fingerprint, IdCard, ChevronLeft
} from 'lucide-react';

// Import the components
import Configure from './Configure';
import AddRow from './AddRow';
import EditRow from './EditRow';

const API_URL = 'http://localhost:3456';

// Cookie utility functions
const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const System = () => {
  // State Management
  const [darkMode, setDarkMode] = useState(() => {
    const saved = getCookie('system_darkMode');
    return saved === 'true';
  });
  
  const [currentDatabase, setCurrentDatabase] = useState(() => {
    const saved = getCookie('system_currentDatabase');
    return saved || '';
  });

  const [selectedRowId, setSelectedRowId] = useState(null);

  
  const [databases, setDatabases] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idField, setIdField] = useState('id');
  
  // UI States
  const [viewMode, setViewMode] = useState('table');
  const [showConfigure, setShowConfigure] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showEditRow, setShowEditRow] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [showDatabaseInfo, setShowDatabaseInfo] = useState(false);
  const [showDatabaseManager, setShowDatabaseManager] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [filters, setFilters] = useState({});
  
  // Statistics
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalDatabases: 0,
    lastUpdated: null,
    columns: 0,
    financial: {}
  });

  // Database-specific configurations
  const databaseConfigs = {
    engineering: {
      color: 'blue',
      icon: Building2,
      primaryFields: ['serial_no', 'scheme_name', 'ftr_hq', 'shq', 'work_site'],
      idPrefix: 'ENG'
    },
    operations: {
      color: 'green',
      icon: Activity,
      primaryFields: ['S_No', 'NAME_OF_WORK', 'FRONTIER', 'SECTOR_HQ', 'LENGTH_KM'],
      idPrefix: 'OPS'
    },
    enggcurrentyear: {
      color: 'purple',
      icon: Calendar,
      primaryFields: ['S/No.', 'ftr_hq', 'budget_head', 'Allotment', 'Total Expdr'],
      idPrefix: 'ECY'
    }
  };

  // Save preferences
  useEffect(() => {
    setCookie('system_darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    setCookie('system_currentDatabase', currentDatabase);
  }, [currentDatabase]);

  // Initial load
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle Database Manager with Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setShowDatabaseManager(prev => !prev);
      }
      // Toggle dark mode with Ctrl/Cmd + Shift + D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDarkMode(prev => !prev);
      }
      // Add new row with Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (currentDatabase) {
          setShowAddRow(true);
        }
      }
      // Refresh with Ctrl/Cmd + R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (currentDatabase) {
          fetchData(currentDatabase);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentDatabase]);

  // Load data when database changes
  useEffect(() => {
    if (currentDatabase) {
      fetchData(currentDatabase);
      fetchStatistics(currentDatabase);
    }
  }, [currentDatabase]);

  // Fetch available databases
  const fetchDatabases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/databases`);
      if (response.ok) {
        const result = await response.json();
        setDatabases(result.databases || []);
        setStats(prev => ({
          ...prev,
          totalDatabases: result.databases?.length || 0
        }));
        
        // Auto-select first database if none selected
        if (!currentDatabase && result.databases?.length > 0) {
          setCurrentDatabase(result.databases[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching databases:', err);
      setError('Failed to fetch databases');
    }
  };

  // Fetch data from current database
  const fetchData = async (databaseName) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      setData(result.rows || []);
      setFilteredData(result.rows || []);
      setAvailableColumns(result.columns || []);
      setIdField(result.idField || 'id');
      
      // Auto-select columns based on database type
      const config = databaseConfigs[databaseName];
      if (config && result.columns?.length > 0) {
        // Always include ID field first
        const primaryCols = [result.idField, ...config.primaryFields.filter(f => 
          result.columns.includes(f) && f !== result.idField
        )].filter(Boolean); // Remove any undefined values
        const otherCols = result.columns.filter(c => 
          !primaryCols.includes(c) && c // Ensure column is not undefined
        ).slice(0, 10 - primaryCols.length);
        setSelectedColumns([...primaryCols, ...otherCols].filter(Boolean)); // Filter out any undefined
      } else if (selectedColumns.length === 0 && result.columns?.length > 0) {
        setSelectedColumns([result.idField, ...result.columns.slice(0, 9)].filter(Boolean));
      }
      
      setStats(prev => ({
        ...prev,
        totalRecords: result.count || 0,
        columns: result.columns?.length || 0,
        lastUpdated: new Date()
      }));
      
      // Check if any IDs need regeneration
      const needsIdFix = result.rows?.some(row => {
        const id = row[result.idField];
        return !id || /^\d+$/.test(String(id));
      });
      
      if (needsIdFix) {
        setSuccess(`Loaded ${result.count || 0} records. Some rows may need ID regeneration.`);
      } else {
        setSuccess(`Loaded ${result.count || 0} records from ${databaseName}`);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics for current database
  const fetchStatistics = async (databaseName) => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${databaseName}`);
      if (response.ok) {
        const result = await response.json();
        setStats(prev => ({
          ...prev,
          ...result
        }));
      } else {
        // Stats endpoint might not exist, that's okay
        console.log(`Stats endpoint not available for ${databaseName}`);
      }
    } catch (err) {
      // Silently handle stats fetch error - not critical
      console.log('Stats fetch error:', err.message);
    }
  };

  // Handle database change
  const handleDatabaseChange = (dbName) => {
    setCurrentDatabase(dbName);
    setCurrentPage(1);
    setSearchTerm('');
    setFilters({});
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply column filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row =>
          row[column]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        // Try numeric comparison first
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Fall back to string comparison
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, searchTerm, filters, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle row operations
  const handleAddRowSuccess = async () => {
    await fetchData(currentDatabase);
    await fetchStatistics(currentDatabase);
    setShowAddRow(false);
    setSuccess('New row added successfully with auto-generated ID');
  };

  const handleEditRowSuccess = async () => {
    await fetchData(currentDatabase);
    await fetchStatistics(currentDatabase);
    setShowEditRow(false);
    setSelectedRow(null);
    setSelectedRowIndex(null);
  };

  const handleDeleteSuccess = async () => {
    await fetchData(currentDatabase);
    await fetchStatistics(currentDatabase);
    setShowEditRow(false);
    setSelectedRow(null);
    setSelectedRowIndex(null);
    setSuccess('Row deleted successfully');
  };

  const handleRowEdit = (row, index) => {
    // Get the actual index in the full dataset
    const actualIndex = data.findIndex(r => r[idField] === row[idField]);
    setSelectedRowId(row[idField]); // Add this line
    setSelectedRow(row);
    setSelectedRowIndex(actualIndex !== -1 ? actualIndex : index);
    setShowEditRow(true);
  };

  const handleConfigComplete = async () => {
    await fetchDatabases();
    if (currentDatabase) {
      await fetchData(currentDatabase);
      await fetchStatistics(currentDatabase);
    }
    setShowConfigure(false);
    setSuccess('Database configured and data uploaded successfully');
  };

  // Export data
  const handleExport = () => {
    window.open(`${API_URL}/api/databases/${currentDatabase}/export`, '_blank');
  };

  // Regenerate IDs for current database
  const handleRegenerateIds = async () => {
    if (!window.confirm(
      `This will regenerate all IDs for "${currentDatabase}" database.\n` +
      `Rows with simple numeric IDs (1, 2, 3...) will get new unique IDs.\n` +
      `Continue?`
    )) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/databases/${currentDatabase}/regenerate-ids`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess(`${result.updated} IDs regenerated successfully out of ${result.total} records`);
        await fetchData(currentDatabase);
      } else {
        throw new Error('Failed to regenerate IDs');
      }
    } catch (err) {
      setError('Failed to regenerate IDs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete database
  const handleDeleteDatabase = async (dbName) => {
    if (!window.confirm(`Delete database "${dbName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/databases/${dbName}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchDatabases();
        if (dbName === currentDatabase) {
          const firstDb = databases.find(db => db.name !== dbName);
          if (firstDb) {
            handleDatabaseChange(firstDb.name);
          } else {
            setCurrentDatabase('');
            setData([]);
            setFilteredData([]);
          }
        }
        setSuccess(`Database "${dbName}" deleted successfully`);
      }
    } catch (err) {
      setError('Failed to delete database');
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  // Get database config
  const getCurrentDatabaseConfig = () => {
    return databaseConfigs[currentDatabase] || {
      color: 'gray',
      icon: Database,
      primaryFields: [],
      idPrefix: 'ID'
    };
  };

  // Render ID badge based on database type
  const renderIdBadge = (row) => {
    const id = row[idField];
    if (!id) return null;
    
    const config = getCurrentDatabaseConfig();
    const Icon = config.icon;
    
    // Check if ID needs regeneration
    const needsRegeneration = /^\d+$/.test(String(id));
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        needsRegeneration 
          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          : `bg-${config.color}-100 dark:bg-${config.color}-900/20 text-${config.color}-700 dark:text-${config.color}-400`
      }`}>
        {needsRegeneration ? (
          <AlertTriangle size={12} />
        ) : (
          <Icon size={12} />
        )}
        {id}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} sticky top-0 z-10`}>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Key size={12} className="text-yellow-500" />
                  {idField}
                </div>
              </th>
              {selectedColumns.filter(col => col !== idField).map(column => (
                <th
                  key={column}
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column ? column.replace(/_/g, ' ') : 'Unknown'}
                    {sortConfig.key === column && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp size={12} /> : 
                        <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {paginatedData.map((row, index) => (
              <tr
                key={row[idField] || index}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="px-3 py-2 text-sm">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-3 py-2 text-sm">
                  {renderIdBadge(row)}
                </td>
                {selectedColumns.filter(col => col !== idField).map(column => (
                  <td key={column} className="px-3 py-2 text-sm">
                    <div className="truncate max-w-xs" title={row[column]}>
                      {row[column] || '-'}
                    </div>
                  </td>
                ))}
                <td className="px-3 py-2 text-center sticky right-0 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleRowEdit(row, index)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => {
                        const newRow = { ...row };
                        delete newRow[idField];
                        delete newRow.created_at;
                        delete newRow.updated_at;
                        setSelectedRow(newRow);
                        setShowAddRow(true);
                      }}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={14} className="text-green-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          {searchTerm && ` (filtered from ${data.length} total)`}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );

  // Render grid view
  const renderGridView = () => {
    const config = getCurrentDatabaseConfig();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedData.map((row, index) => (
          <div
            key={row[idField] || index}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-3">
              {renderIdBadge(row)}
              <div className="flex gap-1">
                <button
                  onClick={() => handleRowEdit(row, index)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                >
                  <Edit2 size={12} className="text-blue-500" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {selectedColumns.slice(0, 5).map(column => (
                column !== idField && (
                  <div key={column} className="text-sm">
                    <span className="text-gray-500 text-xs">{column.replace(/_/g, ' ')}:</span>
                    <p className="font-medium truncate">{row[column] || '-'}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render kanban view
  const renderKanbanView = () => {
    const groupBy = currentDatabase === 'engineering' ? 'current_status' :
                    currentDatabase === 'operations' ? 'WORK_TYPE' :
                    currentDatabase === 'enggcurrentyear' ? 'budget_head' :
                    selectedColumns[1] || 'status';
                    
    const groups = [...new Set(data.map(item => item[groupBy] || 'Uncategorized'))];
    
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {groups.slice(0, 10).map(group => (
          <div
            key={group}
            className={`min-w-[300px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4`}
          >
            <h3 className="font-semibold mb-3 flex items-center justify-between">
              {group}
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                {data.filter(item => item[groupBy] === group).length}
              </span>
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {data
                .filter(item => item[groupBy] === group)
                .slice(0, 10)
                .map((row, index) => (
                  <div
                    key={row[idField] || index}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleRowEdit(row, data.indexOf(row))}
                  >
                    <div className="mb-2">
                      {renderIdBadge(row)}
                    </div>
                    {selectedColumns.slice(0, 3).map(column => (
                      column !== groupBy && column !== idField && (
                        <div key={column} className="text-sm mb-1">
                          <span className="text-gray-500 text-xs">{column}:</span>
                          <p className="truncate">{row[column] || '-'}</p>
                        </div>
                      )
                    ))}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render database info panel
  const renderDatabaseInfo = () => {
    const currentDb = databases.find(db => db.name === currentDatabase);
    if (!currentDb) return null;
    
    const config = getCurrentDatabaseConfig();
    const Icon = config.icon;
    
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/20 flex items-center justify-center`}>
              <Icon size={20} className={`text-${config.color}-600 dark:text-${config.color}-400`} />
            </div>
            <div>
              <h3 className="font-semibold">Database Information</h3>
              <p className="text-xs text-gray-500">{currentDatabase}.csv</p>
            </div>
          </div>
          <button
            onClick={() => setShowDatabaseInfo(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <IdCard size={14} />
              ID Field
            </div>
            <p className="font-semibold">{idField}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Database size={14} />
              Total Records
            </div>
            <p className="font-semibold">{currentDb.recordCount}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Layers size={14} />
              Columns
            </div>
            <p className="font-semibold">{currentDb.columns.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Calendar size={14} />
              Last Modified
            </div>
            <p className="font-semibold text-sm">
              {new Date(currentDb.modified).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {stats.financial && Object.keys(stats.financial).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">Statistics</h4>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(stats.financial).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </span>
                  <p className="font-semibold">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Database size={28} className="text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Data Management System
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 flex items-center gap-3`}>
                  <span className="flex items-center gap-1">
                    <Activity size={14} className="text-green-500" />
                    {stats.totalRecords} Records
                  </span>
                  <span>•</span>
                  <span>{stats.totalDatabases} Databases</span>
                  <span>•</span>
                  <span>{stats.columns.length} Columns</span>
                  {currentDatabase && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Key size={14} className="text-yellow-500" />
                        ID: {idField}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={currentDatabase}
                onChange={(e) => handleDatabaseChange(e.target.value)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value="">Select Database</option>
                {databases.map(db => (
                  <option key={db.name} value={db.name}>
                    {db.name} ({db.recordCount} records)
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg overflow-hidden">
                {[
                  { mode: 'table', icon: List },
                  { mode: 'grid', icon: Grid3x3 },
                  { mode: 'kanban', icon: Layers }
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 ${
                      viewMode === mode
                        ? 'bg-purple-500 text-white'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    } hover:opacity-90 transition-all`}
                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>

              {currentDatabase && (
                <button
                  onClick={() => setShowDatabaseInfo(!showDatabaseInfo)}
                  className={`px-3 py-2 rounded-lg ${
                    showDatabaseInfo
                      ? 'bg-blue-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  } hover:opacity-90`}
                  title="Database Info"
                >
                  <Info size={18} />
                </button>
              )}

              <button
                onClick={() => setShowConfigure(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm"
              >
                <Upload size={16} />
                Upload
              </button>

              <button
                onClick={() => setShowAddRow(true)}
                disabled={!currentDatabase}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-50"
                title="Add new row with auto-generated ID (Ctrl+N)"
              >
                <Plus size={16} />
                Add Row
              </button>

              <button
                onClick={handleExport}
                disabled={!currentDatabase || data.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={handleRegenerateIds}
                disabled={!currentDatabase || data.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-50"
                title="Regenerate IDs for all rows with simple numeric IDs"
              >
                <Fingerprint size={16} />
                Fix IDs
              </button>

              <button
                onClick={() => fetchData(currentDatabase)}
                disabled={!currentDatabase}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                } hover:opacity-90`}
                title="Refresh (Ctrl+R)"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'
                }`}
                title="Toggle dark mode (Ctrl+Shift+D)"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Database Info Panel */}
        {showDatabaseInfo && currentDatabase && renderDatabaseInfo()}

        {/* Filters Bar */}
        {currentDatabase && data.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 mb-6`}>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-100 placeholder-gray-400' 
                      : 'bg-gray-50 placeholder-gray-500'
                  } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                />
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className={`px-3 py-2 rounded-lg text-sm ${
                  darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'
                  } hover:opacity-90`}
                >
                  <Settings size={16} />
                  Columns ({selectedColumns.length})
                </button>
                
                {showColumnSelector && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 ${
                    darkMode ? 'bg-gray-900' : 'bg-white'
                  } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-3 max-h-96 overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-semibold">Select Columns</span>
                      <button
                        onClick={() => setShowColumnSelector(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setSelectedColumns(availableColumns)}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedColumns([idField])}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            const config = getCurrentDatabaseConfig();
                            const primaryCols = config.primaryFields.filter(f => availableColumns.includes(f));
                            setSelectedColumns([idField, ...primaryCols]);
                          }}
                          className="text-xs text-green-500 hover:text-green-600"
                        >
                          Primary Only
                        </button>
                      </div>
                      {availableColumns.map(col => (
                        <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={() => toggleColumn(col)}
                            className="accent-purple-500"
                          />
                          <span className="text-sm">
                            {col === idField && (
                              <Key size={12} className="inline mr-1 text-yellow-500" />
                            )}
                            {col ? col.replace(/_/g, ' ') : 'Unknown'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {filteredData.length !== data.length && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className="font-medium">{filteredData.length}</span> of {data.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader size={32} className="animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-500">Loading database...</p>
            </div>
          </div>
        ) : currentDatabase && data.length > 0 ? (
          <div>
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'kanban' && renderKanbanView()}
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-16 text-center`}>
            <FolderOpen size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {currentDatabase ? 'No Data Available' : 'No Database Selected'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {currentDatabase 
                ? 'This database is empty. Upload data to get started.' 
                : 'Select a database from the dropdown or upload a new file.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfigure(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Upload size={16} />
                Upload Data
              </button>
              {currentDatabase && (
                <button
                  onClick={() => setShowAddRow(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add First Row
                </button>
              )}
            </div>
          </div>
        )}

        {/* Database Management Panel */}
        {databases.length > 0 && (
          <div className="fixed top-20 right-6 z-30">
            {/* Collapsed State */}
            {!showDatabaseManager && (
              <button
                onClick={() => setShowDatabaseManager(true)}
                className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-xl p-3 flex items-center gap-2 transition-all group relative`}
                title="Open Database Manager (Ctrl+D)"
              >
                <Database size={20} className="text-purple-500" />
                <span className="hidden group-hover:inline text-sm font-medium">
                  Databases
                </span>
                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                {databases.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {databases.length}
                  </span>
                )}
              </button>
            )}
            
            {/* Expanded State */}
            {showDatabaseManager && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-4 w-72 transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database size={18} />
                    Database Manager
                  </h3>
                  <button
                    onClick={() => setShowDatabaseManager(false)}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    title="Collapse (Ctrl+D)"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {databases.map(db => {
                    const config = databaseConfigs[db.name] || { color: 'gray', icon: Database };
                    const Icon = config.icon;
                    const isActive = db.name === currentDatabase;
                    
                    return (
                      <div
                        key={db.name}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isActive
                            ? darkMode
                              ? `bg-${config.color}-900/20 border-${config.color}-600`
                              : `bg-${config.color}-50 border-${config.color}-400`
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleDatabaseChange(db.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={`text-${config.color}-500`} />
                            <div>
                              <p className="font-medium text-sm">{db.name}</p>
                              <p className="text-xs text-gray-500">
                                {db.recordCount} records • ID: {db.idField}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExport();
                                }}
                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                title="Export"
                              >
                                <Download size={14} className="text-blue-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDatabase(db.name);
                                }}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                title="Delete"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowConfigure(true)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Upload New Database
                  </button>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Press Ctrl+D to toggle this panel
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Modals */}
        {showConfigure && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfigure(false)} />
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto">
              <Configure
                darkMode={darkMode}
                onConfigComplete={handleConfigComplete}
              />
              <button
                onClick={() => setShowConfigure(false)}
                className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <AddRow
          isOpen={showAddRow}
          onClose={() => {
            setShowAddRow(false);
            setSelectedRow(null);
          }}
          darkMode={darkMode}
          databaseName={currentDatabase}
          idField={idField}
          onSuccess={handleAddRowSuccess}
          defaultValues={selectedRow}
        />

        <EditRow
          isOpen={showEditRow}
          onClose={() => {
            setShowEditRow(false);
            setSelectedRow(null);
            setSelectedRowId(null);
            setSelectedRowIndex(null);
          }}
          darkMode={darkMode}
          databaseName={currentDatabase}
          idField={idField}
          rowId={selectedRowId} // Add this line
          rowIndex={selectedRowIndex} // Keep for backward compatibility
          rowData={selectedRow}
          onSuccess={handleEditRowSuccess}
          onDelete={handleDeleteSuccess}
        />
      </div>
    </div>
  );
};

export default System;