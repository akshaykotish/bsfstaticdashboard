import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Database, FileSpreadsheet, Check, X, AlertCircle, 
  Loader, ChevronRight, Map, Save, RefreshCw, Trash2,
  Download, Eye, Settings, Info, ArrowRight, Shield,
  Cloud, Server, FolderOpen, FileText, CheckCircle,
  XCircle, AlertTriangle, Link2, Layers, Key, Fingerprint,
  ChevronDown, ChevronUp, Search, Building2, Activity, Calendar,
  Table, GitBranch, Zap, Filter, Copy, Hash, Calculator, Clock,
  MapPin, DollarSign, Percent
} from 'lucide-react';

// Import database configurations from config.js
import { databaseConfigs, getConfig, getDatabaseNames, generateId, applyCalculations } from './config';

const API_URL = 'http://172.21.188.201:3456';

// Icon mapping for string to component conversion
const iconMap = {
  'Building2': Building2,
  'Activity': Activity,
  'Calendar': Calendar,
  'Database': Database,
  'FileText': FileText,
  'MapPin': MapPin,
  'DollarSign': DollarSign,
  'Hash': Hash,
  'Calculator': Calculator,
  'Clock': Clock
};

const Configure = ({ darkMode = false, onConfigComplete }) => {
  const [file, setFile] = useState(null);
  const [databaseName, setDatabaseName] = useState('');
  const [databaseSearchTerm, setDatabaseSearchTerm] = useState('');
  const [showDatabaseDropdown, setShowDatabaseDropdown] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [keyColumns, setKeyColumns] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [existingDatabases, setExistingDatabases] = useState([]);
  const [showExisting, setShowExisting] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    upload: true,
    mapping: true,
    existing: false,
    config: true,
    advanced: false
  });
  const [autoMapColumns, setAutoMapColumns] = useState(true);
  const [showIdGeneration, setShowIdGeneration] = useState(true);
  const [mappingSearchTerm, setMappingSearchTerm] = useState('');
  const [mappingFilter, setMappingFilter] = useState('all');
  
  // Duplicate detection threshold - now user configurable
  const [duplicateThreshold, setDuplicateThreshold] = useState(0.95);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchExistingDatabases();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDatabaseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchExistingDatabases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/databases`);
      if (response.ok) {
        const data = await response.json();
        setExistingDatabases(data.databases || []);
      }
    } catch (err) {
      console.error('Error fetching databases:', err);
    }
  };

  const handleDatabaseSelection = (configName) => {
    const config = getConfig(configName);
    if (config && config !== databaseConfigs.custom) {
      setDatabaseName(configName);
      setSelectedConfig(config);
      setKeyColumns([config.idField]);
      setDatabaseSearchTerm(config.displayName);
      setShowDatabaseDropdown(false);
      
      if (file && sheetData) {
        applyConfigMappings(config);
      }
    }
  };

  const applyConfigMappings = (config) => {
    if (!sheetData || !config) return;

    const mappings = {};
    const firstSheetColumns = Object.values(sheetData)[0]?.columns || [];
    
    firstSheetColumns.forEach(col => {
      const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Extract column names from column objects
      const configColumnNames = config.columns.map(c => 
        typeof c === 'object' ? c.name : c
      );
      
      const matchingConfigCol = configColumnNames.find(configCol => {
        const cleanConfigCol = configCol.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return cleanConfigCol === cleanCol || 
               cleanCol.includes(cleanConfigCol) ||
               cleanConfigCol.includes(cleanCol);
      });
      
      if (matchingConfigCol) {
        mappings[col] = matchingConfigCol;
      } else {
        mappings[col] = col;
      }
    });
    
    setColumnMappings(mappings);
  };

  const filteredDatabaseConfigs = Object.entries(databaseConfigs).filter(([key, config]) => 
    key !== 'custom' && (
      key.toLowerCase().includes(databaseSearchTerm.toLowerCase()) ||
      config.displayName.toLowerCase().includes(databaseSearchTerm.toLowerCase())
    )
  );

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Please select a valid Excel or CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploadResult(null);
    
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const matchingConfig = Object.entries(databaseConfigs).find(([key, config]) => 
      key !== 'custom' && (cleanName.includes(key) || key.includes(cleanName))
    );
    
    if (matchingConfig) {
      handleDatabaseSelection(matchingConfig[0]);
    } else {
      setDatabaseName(cleanName);
    }
    
    await analyzeFile(selectedFile);
  };

  const analyzeFile = async (fileToAnalyze) => {
    setAnalyzing(true);
    setSheetData(null);
    setColumnMappings({});
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', fileToAnalyze);
      
      const response = await fetch(`${API_URL}/api/analyze/excel`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze file');
      }
      
      const result = await response.json();
      console.log('Analysis result:', result);
      
      if (!result.sheets || Object.keys(result.sheets).length === 0) {
        throw new Error('No sheets found in the Excel file');
      }
      
      setSheetData(result.sheets);
      
      if (selectedConfig && autoMapColumns) {
        applyConfigMappings(selectedConfig);
      } else {
        const mappings = {};
        Object.keys(result.sheets).forEach(sheetName => {
          const sheetColumns = result.sheets[sheetName].columns || [];
          sheetColumns.forEach(col => {
            if (col && !mappings[col]) {
              mappings[col] = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
            }
          });
        });
        setColumnMappings(mappings);
      }
      
      const sheetNames = Object.keys(result.sheets);
      const totalRows = Object.values(result.sheets).reduce((sum, sheet) => sum + (sheet.rowCount || 0), 0);
      const totalColumns = Object.values(result.sheets).reduce((max, sheet) => Math.max(max, (sheet.columns || []).length), 0);
      
      setError('');
      console.log(`File analyzed: ${sheetNames.length} sheet(s), ${totalRows} total rows, ${totalColumns} max columns`);
      
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError('Error analyzing file: ' + err.message);
      setSheetData(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleColumnMapping = (originalColumn, mappedColumn) => {
    setColumnMappings(prev => ({
      ...prev,
      [originalColumn]: mappedColumn
    }));
  };

  const handleKeyColumnToggle = (column) => {
    setKeyColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      }
      return [...prev, column];
    });
  };

  const handleUpload = async () => {
    if (!file || !databaseName) {
      setError('Please select a file and database configuration');
      return;
    }

    setLoading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('database_name', databaseName);
      formData.append('column_mapping', JSON.stringify(columnMappings));
      formData.append('key_columns', JSON.stringify(keyColumns));
      formData.append('generate_ids', 'true');
      formData.append('duplicate_threshold', duplicateThreshold.toString());
      
      if (selectedConfig) {
        formData.append('id_field', selectedConfig.idField);
        formData.append('id_prefix', selectedConfig.idPrefix);
        formData.append('config_name', databaseName);
        
        // Send config metadata for server-side processing
        formData.append('config_metadata', JSON.stringify({
          calculations: Object.keys(selectedConfig.calculations || {}),
          columnGroups: selectedConfig.columnGroups,
          idFormat: selectedConfig.idFormat,
          comparisonColumns: selectedConfig.columns
            .filter(col => {
              const colName = typeof col === 'object' ? col.name : col;
              return !colName.toLowerCase().includes('id') && 
                     !colName.toLowerCase().includes('created') && 
                     !colName.toLowerCase().includes('updated');
            })
            .map(col => typeof col === 'object' ? col.name : col)
        }));
      }

      const response = await fetch(`${API_URL}/api/upload/excel`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadResult(result);
      
      await fetchExistingDatabases();
      
      if (onConfigComplete) {
        onConfigComplete(result);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseDelete = async (dbName) => {
    if (!window.confirm(`Are you sure you want to delete "${dbName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/databases/${dbName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchExistingDatabases();
      }
    } catch (err) {
      setError('Error deleting database: ' + err.message);
    }
  };

  const handleDatabaseExport = (dbName) => {
    window.open(`${API_URL}/api/databases/${dbName}/export`, '_blank');
  };

  const handleRegenerateIds = async (dbName) => {
    if (!window.confirm(`This will regenerate all IDs for "${dbName}". Continue?`)) {
      return;
    }

    setRegeneratingIds(true);
    try {
      const config = getConfig(dbName);
      const response = await fetch(`${API_URL}/api/databases/${dbName}/regenerate-ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config_name: dbName,
          id_format: config.idFormat,
          id_prefix: config.idPrefix,
          id_field: config.idField
        })
      });

      if (response.ok) {
        const result = await response.json();
        setError('');
        alert(`Successfully regenerated ${result.updated} IDs out of ${result.total} records`);
        await fetchExistingDatabases();
      } else {
        throw new Error('Failed to regenerate IDs');
      }
    } catch (err) {
      setError('Error regenerating IDs: ' + err.message);
    } finally {
      setRegeneratingIds(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDatabaseName('');
    setDatabaseSearchTerm('');
    setSelectedConfig(null);
    setSheetData(null);
    setColumnMappings({});
    setKeyColumns([]);
    setUploadResult(null);
    setError('');
    setDuplicateThreshold(0.7);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get column names from config
  const getConfigColumnNames = (config) => {
    if (!config || !config.columns) return [];
    return config.columns.map(col => 
      typeof col === 'object' ? col.name : col
    );
  };

  // Get column info from config
  const getColumnInfo = (config, columnName) => {
    if (!config || !config.columns) return null;
    const column = config.columns.find(col => 
      (typeof col === 'object' ? col.name : col) === columnName
    );
    return typeof column === 'object' ? column : { name: columnName };
  };

  // Filter column mappings based on search and filter
  const getFilteredMappings = () => {
    if (!columnMappings) return [];
    
    let filtered = Object.entries(columnMappings);
    
    // Apply search filter
    if (mappingSearchTerm) {
      filtered = filtered.filter(([original, mapped]) => 
        original.toLowerCase().includes(mappingSearchTerm.toLowerCase()) ||
        mapped.toLowerCase().includes(mappingSearchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    const configColumnNames = getConfigColumnNames(selectedConfig);
    
    switch (mappingFilter) {
      case 'mapped':
        filtered = filtered.filter(([original, mapped]) => 
          selectedConfig && configColumnNames.includes(mapped)
        );
        break;
      case 'unmapped':
        filtered = filtered.filter(([original, mapped]) => 
          !selectedConfig || !configColumnNames.includes(mapped)
        );
        break;
      case 'key':
        filtered = filtered.filter(([original, mapped]) => 
          keyColumns.includes(mapped) || 
          (selectedConfig && mapped === selectedConfig.idField)
        );
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const filteredMappings = getFilteredMappings();

  // Get icon component from string
  const getIconComponent = (iconName) => {
    return iconMap[iconName] || Database;
  };

  // Generate example ID for display
  const getExampleId = () => {
    if (!selectedConfig) return 'CUSTOM-1234567890-1';
    return generateId(databaseName, 1234567890, 1);
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Data Configuration Center
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Upload Excel files with automatic ID generation and smart duplicate detection
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowExisting(!showExisting)}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Database size={18} />
          Existing DBs ({existingDatabases.length})
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {uploadResult && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-semibold text-green-700 dark:text-green-400">
              Upload Successful - Smart Duplicate Detection Applied!
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="text-gray-500">New Records:</span>
              <span className="ml-2 font-bold text-green-600">{uploadResult.stats?.new_records || 0}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="text-gray-500">IDs Generated:</span>
              <span className="ml-2 font-bold text-blue-600">{uploadResult.stats?.ids_generated || 0}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="text-gray-500">Duplicates Skipped:</span>
              <span className="ml-2 font-bold text-orange-600">{uploadResult.stats?.duplicates_skipped || 0}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="text-gray-500">Similarity Threshold:</span>
              <span className="ml-2 font-bold text-purple-600">{Math.round((uploadResult.threshold || duplicateThreshold) * 100)}%</span>
            </div>
          </div>
          {uploadResult.stats?.duplicate_details && uploadResult.stats.duplicate_details.length > 0 && (
            <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/10 rounded text-xs">
              <span className="text-orange-700 dark:text-orange-400">
                Duplicates detected: {uploadResult.stats.duplicate_details.slice(0, 3).map(d => 
                  `Row ${d.rowIndex} (${d.similarity}% match with ID: ${d.matchedId})`
                ).join(', ')}
                {uploadResult.stats.duplicate_details.length > 3 && ` and ${uploadResult.stats.duplicate_details.length - 3} more...`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Database Configuration Section */}
      <div className={`mb-6 p-5 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('config')}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database size={20} className="text-purple-500" />
            Database Configuration
          </h3>
          {expandedSections.config ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.config && (
          <div className="space-y-4">
            {/* Database Searchable Dropdown */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Select Database Configuration
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={databaseSearchTerm}
                    onChange={(e) => {
                      setDatabaseSearchTerm(e.target.value);
                      setShowDatabaseDropdown(true);
                    }}
                    onFocus={() => setShowDatabaseDropdown(true)}
                    placeholder="Search or type database name..."
                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  <ChevronDown 
                    size={18} 
                    className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                    onClick={() => setShowDatabaseDropdown(!showDatabaseDropdown)}
                  />
                </div>
                
                {showDatabaseDropdown && (
                  <div className={`absolute z-10 w-full mt-2 rounded-lg shadow-xl ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  } max-h-64 overflow-y-auto`}>
                    {filteredDatabaseConfigs.length > 0 ? (
                      filteredDatabaseConfigs.map(([key, config]) => {
                        const Icon = getIconComponent(config.icon);
                        return (
                          <button
                            key={key}
                            onClick={() => handleDatabaseSelection(key)}
                            className={`w-full px-4 py-3 flex items-center gap-3 ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            } transition-colors text-left`}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/20 flex items-center justify-center`}>
                              <Icon size={18} className={`text-${config.color}-600 dark:text-${config.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{config.displayName}</p>
                              <p className="text-xs text-gray-500">{config.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">ID: {config.idField}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500">
                        No matching configurations found
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setDatabaseName(databaseSearchTerm.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                        setSelectedConfig(null);
                        setShowDatabaseDropdown(false);
                      }}
                      className={`w-full px-4 py-3 ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-50'
                      } text-left text-sm`}
                    >
                      <span className="text-blue-500">+ Create custom database: </span>
                      <span className="font-medium">{databaseSearchTerm || 'custom'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Configuration Info */}
            {selectedConfig && (
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-white'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${selectedConfig.color}-100 dark:bg-${selectedConfig.color}-900/20 flex items-center justify-center`}>
                    {(() => {
                      const Icon = getIconComponent(selectedConfig.icon);
                      return <Icon size={20} className={`text-${selectedConfig.color}-600 dark:text-${selectedConfig.color}-400`} />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedConfig.displayName}</h4>
                    <p className="text-xs text-gray-500">{selectedConfig.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">ID Field:</span>
                    <p className="font-medium">{selectedConfig.idField}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ID Prefix:</span>
                    <p className="font-medium">{selectedConfig.idPrefix}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">File Name:</span>
                    <p className="font-medium">{selectedConfig.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Fields:</span>
                    <p className="font-medium">{selectedConfig.columns.length}</p>
                  </div>
                </div>
                
                {/* Column Groups Display */}
                {selectedConfig.columnGroups && Object.keys(selectedConfig.columnGroups).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 mb-2">Field Groups:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedConfig.columnGroups)
                        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                        .map(([key, group]) => {
                          const GroupIcon = getIconComponent(group.icon);
                          return (
                            <div key={key} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                              <GroupIcon size={12} />
                              <span>{group.title}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ID Generation & Duplicate Detection Info */}
            {showIdGeneration && selectedConfig && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Fingerprint size={18} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Automatic ID Generation & Smart Duplicate Detection
                  </p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                  ✓ Each row will receive a unique ID: {getExampleId()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                  ✓ Smart duplicate detection ({Math.round(duplicateThreshold * 100)}% similarity threshold)
                </p>
                {selectedConfig.calculations && Object.keys(selectedConfig.calculations).length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                    ✓ {Object.keys(selectedConfig.calculations).length} calculated fields will be auto-computed
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Configuration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('upload')}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload size={20} className="text-blue-500" />
              File Upload
            </h3>
            {expandedSections.upload ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {expandedSections.upload && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Excel/CSV File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer flex items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all ${
                      file 
                        ? darkMode 
                          ? 'border-green-600 bg-green-900/20'
                          : 'border-green-500 bg-green-50'
                        : darkMode
                          ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet size={24} className="text-green-500" />
                        <div className="text-left">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Cloud size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium">Click to upload Excel file</p>
                        <p className="text-xs text-gray-500 mt-1">XLSX, XLS, or CSV</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-map"
                  checked={autoMapColumns}
                  onChange={(e) => setAutoMapColumns(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <label htmlFor="auto-map" className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically map columns based on configuration
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sheet Analysis Section */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers size={20} className="text-purple-500" />
            Sheet Analysis
          </h3>

          {analyzing && (
            <div className="flex items-center justify-center py-8">
              <Loader size={32} className="animate-spin text-blue-500" />
              <span className="ml-3">Analyzing file structure...</span>
            </div>
          )}

          {sheetData && !analyzing && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-white'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">File Summary</span>
                  <span className="text-xs text-gray-500">
                    {Object.keys(sheetData).length} sheet(s) found
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Total Rows:</span>
                    <span className="ml-2 font-medium">
                      {Object.values(sheetData).reduce((sum, sheet) => sum + (sheet.rowCount || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Columns:</span>
                    <span className="ml-2 font-medium">
                      {Object.values(sheetData).reduce((max, sheet) => 
                        Math.max(max, (sheet.columns || []).length), 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {Object.entries(sheetData).map(([sheetName, data]) => (
                  <div key={sheetName} className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-white'
                  } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={16} className="text-green-500" />
                        <span className="font-medium text-sm">{sheetName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{data.rowCount || 0} rows</span>
                        <span>{(data.columns || []).length} columns</span>
                      </div>
                    </div>
                    {data.columns && data.columns.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Columns detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {data.columns.slice(0, 5).map((col, idx) => (
                            <span key={idx} className={`px-2 py-0.5 text-xs rounded ${
                              darkMode ? 'bg-gray-600' : 'bg-gray-100'
                            }`}>
                              {col}
                            </span>
                          ))}
                          {data.columns.length > 5 && (
                            <span className="text-xs text-gray-500 px-2">
                              +{data.columns.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sheetData && !analyzing && (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Upload a file to see sheet analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Section */}
      <div className={`mt-6 p-5 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => {
            toggleSection('advanced');
            setShowAdvancedSettings(!showAdvancedSettings);
          }}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield size={20} className="text-orange-500" />
            Advanced Settings
          </h3>
          {expandedSections.advanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.advanced && (
          <div className="space-y-4">
            {/* Duplicate Detection Threshold */}
            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Percent size={16} />
                Duplicate Detection Similarity Threshold
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={Math.round(duplicateThreshold * 100)}
                  onChange={(e) => setDuplicateThreshold(parseInt(e.target.value) / 100)}
                  className="flex-1 accent-orange-500"
                />
                <div className={`px-3 py-1.5 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'} min-w-[80px] text-center`}>
                  <span className="font-semibold text-orange-600">{Math.round(duplicateThreshold * 100)}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Records with similarity above this threshold will be considered duplicates and skipped.
                • 50-60%: Very loose (catches only obvious duplicates)
                • 70%: Balanced (recommended)
                • 80-90%: Strict (may miss some valid new records)
                • 100%: Exact match only
              </p>
            </div>

            {/* Comparison Columns Info */}
            {selectedConfig && (
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-white'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-blue-500" />
                  <span className="text-sm font-medium">Duplicate Detection Method</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  The system uses fuzzy matching with Levenshtein distance for text fields and percentage-based comparison for numeric fields.
                </p>
                <p className="text-xs text-gray-500">
                  Key comparison fields for {selectedConfig.displayName}:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedConfig.comparisonColumns?.slice(0, 8).map(col => (
                    <span key={col} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      {col}
                    </span>
                  ))}
                  {selectedConfig.comparisonColumns?.length > 8 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      +{selectedConfig.comparisonColumns.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Column Mapping Section */}
      {sheetData && Object.keys(columnMappings).length > 0 && (
        <div className={`mt-6 p-5 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('mapping')}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Table size={20} className="text-green-500" />
              Column Mapping Configuration
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">
                {Object.keys(columnMappings).length} columns
              </span>
            </h3>
            {expandedSections.mapping ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {expandedSections.mapping && (
            <div className="space-y-4">
              {/* Control Panel */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={mappingSearchTerm}
                    onChange={(e) => setMappingSearchTerm(e.target.value)}
                    placeholder="Search columns..."
                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300'
                    } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  {[
                    { value: 'all', label: 'All', icon: Layers },
                    { value: 'mapped', label: 'Mapped', icon: GitBranch },
                    { value: 'unmapped', label: 'Unmapped', icon: X },
                    { value: 'key', label: 'Key Fields', icon: Key }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMappingFilter(value)}
                      className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                        mappingFilter === value
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-medium'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                {selectedConfig && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyConfigMappings(selectedConfig)}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 flex items-center gap-1 whitespace-nowrap"
                    >
                      <Zap size={14} />
                      Auto Map
                    </button>
                    <button
                      onClick={() => {
                        const resetMappings = {};
                        Object.keys(columnMappings).forEach(col => {
                          resetMappings[col] = col;
                        });
                        setColumnMappings(resetMappings);
                      }}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-600 flex items-center gap-1"
                    >
                      <RefreshCw size={14} />
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Mapping Table */}
              <div className={`rounded-lg overflow-hidden border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} border-b ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className="text-left px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-gray-500" />
                            #
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet size={14} className="text-blue-500" />
                            Excel Column
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Database size={14} className="text-green-500" />
                            Database Field
                          </div>
                        </th>
                        <th className="text-center px-4 py-3 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Key size={14} className="text-purple-500" />
                            Type
                          </div>
                        </th>
                        <th className="text-center px-4 py-3 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Shield size={14} className="text-orange-500" />
                            Key Field
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMappings.length > 0 ? (
                        filteredMappings.map(([original, mapped], index) => {
                          const configColumnNames = getConfigColumnNames(selectedConfig);
                          const isIdField = selectedConfig && mapped === selectedConfig.idField;
                          const isMapped = selectedConfig && configColumnNames.includes(mapped);
                          const isKeyField = keyColumns.includes(mapped) || isIdField;
                          const columnInfo = selectedConfig ? getColumnInfo(selectedConfig, mapped) : null;
                          
                          return (
                            <tr 
                              key={original} 
                              className={`border-b ${
                                darkMode ? 'border-gray-700' : 'border-gray-100'
                              } ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}
                            >
                              <td className="px-4 py-3 text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    {original}
                                  </span>
                                  {original !== mapped && (
                                    <ArrowRight size={14} className="text-gray-400" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {selectedConfig ? (
                                  <select
                                    value={mapped}
                                    onChange={(e) => handleColumnMapping(original, e.target.value)}
                                    className={`w-full px-3 py-1.5 rounded-lg text-sm ${
                                      darkMode 
                                        ? 'bg-gray-700 text-gray-100 border-gray-600' 
                                        : 'bg-white border-gray-300'
                                    } border ${
                                      isIdField
                                        ? 'border-yellow-500 ring-1 ring-yellow-500/20'
                                        : columnInfo?.calculated
                                        ? 'border-purple-500 ring-1 ring-purple-500/20'
                                        : ''
                                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                  >
                                    <option value={original}>{original} (Keep Original)</option>
                                    <optgroup label="Database Fields">
                                      {configColumnNames.map(colName => {
                                        const colInfo = getColumnInfo(selectedConfig, colName);
                                        return (
                                          <option key={colName} value={colName}>
                                            {colInfo?.label || colName}
                                            {colName === selectedConfig.idField && ' (ID)'}
                                            {colInfo?.calculated && ' (Auto-calculated)'}
                                            {colInfo?.required && ' *'}
                                          </option>
                                        );
                                      })}
                                    </optgroup>
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={mapped}
                                    onChange={(e) => handleColumnMapping(original, e.target.value)}
                                    placeholder="Database field name"
                                    className={`w-full px-3 py-1.5 rounded-lg text-sm ${
                                      darkMode 
                                        ? 'bg-gray-700 text-gray-100 border-gray-600' 
                                        : 'bg-white border-gray-300'
                                    } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isIdField ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                                    <Fingerprint size={12} />
                                    ID Field
                                  </span>
                                ) : columnInfo?.calculated ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
                                    <Calculator size={12} />
                                    Calculated
                                  </span>
                                ) : isMapped ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                                    <Check size={12} />
                                    Mapped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    <Copy size={12} />
                                    Custom
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isKeyField}
                                  onChange={() => handleKeyColumnToggle(mapped)}
                                  disabled={isIdField || columnInfo?.calculated}
                                  className={`rounded ${
                                    isIdField || columnInfo?.calculated 
                                      ? 'cursor-not-allowed opacity-50' 
                                      : 'cursor-pointer'
                                  } accent-purple-500`}
                                  title={
                                    isIdField 
                                      ? 'ID field is always a key field' 
                                      : columnInfo?.calculated
                                      ? 'Calculated fields cannot be key fields'
                                      : 'Toggle key field'
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No columns match the current filter
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Mapping Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Layers size={14} />
                    Total Columns
                  </div>
                  <p className="text-lg font-semibold">{Object.keys(columnMappings).length}</p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <GitBranch size={14} />
                    Mapped
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    {selectedConfig ? 
                      Object.values(columnMappings).filter(m => 
                        getConfigColumnNames(selectedConfig).includes(m)
                      ).length 
                      : 0
                    }
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Key size={14} />
                    Key Fields
                  </div>
                  <p className="text-lg font-semibold text-purple-600">{keyColumns.length}</p>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Fingerprint size={14} />
                    ID Field
                  </div>
                  <p className="text-sm font-medium text-yellow-600">
                    {selectedConfig ? selectedConfig.idField : 'Not Set'}
                  </p>
                </div>
              </div>
              
              {/* Calculated Fields Info */}
              {selectedConfig && selectedConfig.calculations && Object.keys(selectedConfig.calculations).length > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator size={16} className="text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Auto-Calculated Fields
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                    {Object.keys(selectedConfig.calculations).map(field => {
                      const colInfo = getColumnInfo(selectedConfig, field);
                      return (
                        <div key={field} className="text-xs">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {colInfo?.label || field}
                          </span>
                          <span className="text-purple-500 dark:text-purple-500 ml-1">
                            (auto-computed)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleReset}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          <RefreshCw size={18} />
          Reset
        </button>

        <button
          onClick={handleUpload}
          disabled={!file || !databaseName || loading}
          className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${
            !file || !databaseName || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Server size={18} />
              Upload & Process
            </>
          )}
        </button>
      </div>

      {/* Existing Databases Panel */}
      {showExisting && existingDatabases.length > 0 && (
        <div className={`mt-6 p-5 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database size={20} className="text-indigo-500" />
            Existing Databases
          </h3>

          <div className="space-y-2">
            {existingDatabases.map(db => {
              const config = getConfig(db.name);
              const Icon = config && config !== databaseConfigs.custom 
                ? getIconComponent(config.icon) 
                : Database;
              
              return (
                <div key={db.filename} className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                } border ${darkMode ? 'border-gray-600' : 'border-gray-200'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${config?.color || 'gray'}-100 dark:bg-${config?.color || 'gray'}-900/20 flex items-center justify-center`}>
                      <Icon size={18} className={`text-${config?.color || 'gray'}-600 dark:text-${config?.color || 'gray'}-400`} />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {config?.displayName || db.name}
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                          ID: {db.idField || config?.idField || 'id'}
                        </span>
                        {config && Object.keys(config.calculations || {}).length > 0 && (
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded">
                            {Object.keys(config.calculations).length} calc fields
                          </span>
                        )}
                        {db.config?.idsNeedingRegeneration > 0 && (
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded">
                            {db.config.idsNeedingRegeneration} IDs need regeneration
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {db.recordCount} records • {db.columns?.length || 0} columns • 
                        Modified: {new Date(db.modified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRegenerateIds(db.name)}
                      disabled={regeneratingIds}
                      className="p-2 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                      title="Regenerate IDs"
                    >
                      {regeneratingIds ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Fingerprint size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDatabaseExport(db.name)}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDatabaseDelete(db.name)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className={`mt-6 p-4 rounded-lg ${
        darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
      } border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
        <div className="flex gap-3">
          <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Intelligent Data Processing Features:
            </p>
            <ul className={`list-disc list-inside space-y-1 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <li>
                <strong>Smart Duplicate Detection:</strong> Uses fuzzy matching with Levenshtein distance for text and percentage-based comparison for numbers
              </li>
              <li>
                <strong>Configurable Similarity Threshold:</strong> Adjust from 50% to 100% to control duplicate sensitivity
                {duplicateThreshold && ` (Currently: ${Math.round(duplicateThreshold * 100)}%)`}
              </li>
              <li>
                <strong>Automatic ID Generation:</strong> Each new row receives a unique ID automatically
                {selectedConfig && ` (Format: ${getExampleId()})`}
              </li>
              <li>
                <strong>Smart Column Mapping:</strong> Automatically matches Excel columns to database fields
              </li>
              <li>
                <strong>Calculated Fields:</strong> Auto-computes values based on configured formulas
                {selectedConfig && selectedConfig.calculations && Object.keys(selectedConfig.calculations).length > 0 && 
                  ` (${Object.keys(selectedConfig.calculations).length} fields will be calculated)`
                }
              </li>
              <li>
                <strong>Field Grouping:</strong> Organizes fields into logical groups for better management
              </li>
              <li>
                <strong>Comparison-Based Detection:</strong> Only compares against existing database records, not within uploaded data
              </li>
              <li>
                <strong>Multi-Sheet Support:</strong> Processes all sheets in Excel files automatically
              </li>
              <li>
                <strong>Data Validation:</strong> Ensures required fields are present and properly formatted
              </li>
              {selectedConfig && (
                <li>
                  <strong>Configuration:</strong> Using {selectedConfig.displayName} template
                </li>
              )}
            </ul>
            
            {/* Available Database Configurations */}
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
              <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Available Database Configurations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {getDatabaseNames().map(name => {
                  const config = getConfig(name);
                  const Icon = getIconComponent(config.icon);
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <Icon size={14} className={`text-${config.color}-500`} />
                      <span className="text-xs">
                        {config.displayName} ({config.idPrefix})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Duplicate Detection Details */}
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
              <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Duplicate Detection System:
              </p>
              <ul className={`list-disc list-inside space-y-1 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              } text-xs`}>
                <li>Configurable similarity threshold ({Math.round(duplicateThreshold * 100)}% currently)</li>
                <li>Fuzzy text matching using Levenshtein distance algorithm</li>
                <li>Percentage-based numeric comparison with tolerance ranges</li>
                <li>Weighted multi-column comparison for accuracy</li>
                <li>Higher weights for important fields (names, locations, amounts)</li>
                <li>Only compares against existing database records</li>
                <li>Skips records that exceed similarity threshold</li>
                <li>Detailed duplicate reporting with matched record IDs</li>
              </ul>
            </div>
            
            {/* Algorithm Details */}
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
              <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Matching Algorithm Details:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-medium">Text Field Matching:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Levenshtein distance calculation</li>
                    <li>Case-insensitive comparison</li>
                    <li>Trimmed whitespace</li>
                    <li>Similarity score 0-1 range</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Numeric Field Matching:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>&lt;5% difference = 95% similar</li>
                    <li>&lt;10% difference = 85% similar</li>
                    <li>&lt;20% difference = 70% similar</li>
                    <li>Percentage-based comparison</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Field Weighting */}
            {selectedConfig && (
              <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Field Importance Weighting:
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
                    High (2x): Name/Work/Scheme fields
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded">
                    Medium (1.5x): Location/Financial fields
                  </span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    Normal (1x): Other fields
                  </span>
                </div>
              </div>
            )}
            
            {/* Tips */}
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
              <p className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Tips for Best Results:
              </p>
              <ul className={`list-disc list-inside space-y-1 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              } text-xs`}>
                <li>Use 70% threshold for balanced duplicate detection</li>
                <li>Select appropriate database configuration before uploading</li>
                <li>Enable auto-mapping for faster setup</li>
                <li>Review column mappings before upload</li>
                <li>Check duplicate report after upload</li>
                <li>Regenerate IDs for records with simple numeric IDs</li>
                <li>Export databases regularly for backup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configure;