import React, { useState, useEffect } from 'react';
import { 
  Edit2, Save, X, Trash2, AlertCircle, Check, 
  Loader, Calendar, DollarSign, MapPin, Building2, 
  User, FileText, Hash, RefreshCw, Copy, ChevronDown,
  ChevronUp, Info, Calculator, Link2, AlertTriangle,
  Database, Shield, Clock, Key, Fingerprint, Activity,
  Layers
} from 'lucide-react';

// Import database configurations from config.js
import { databaseConfigs, getConfig, getDatabaseNames, generateId, applyCalculations } from './config';

const API_URL = 'http://localhost:3456';

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

const EditRow = ({ 
  isOpen, 
  onClose, 
  darkMode = false,
  databaseName = '',
  idField = '',
  rowId = null,         // ID of the row to edit
  rowIndex = null,      // Index for backward compatibility
  rowData = null,       // Direct row data if available
  onSuccess = () => {},
  onDelete = () => {}
}) => {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [columns, setColumns] = useState([]);
  const [changedFields, setChangedFields] = useState(new Set());
  const [currentConfig, setCurrentConfig] = useState(null);
  const [calculatedFields, setCalculatedFields] = useState(new Set());
  const [actualIdField, setActualIdField] = useState('');
  const [configColumns, setConfigColumns] = useState([]);

  // Load configuration when component opens
  useEffect(() => {
    if (isOpen && databaseName) {
      console.log('Loading config for database:', databaseName);
      loadDatabaseConfig();
    }
  }, [isOpen, databaseName]);

  // Load row data after config is ready
  useEffect(() => {
    if (isOpen && currentConfig && (rowData || rowId || rowIndex !== null)) {
      console.log('Loading row data with config:', currentConfig);
      if (rowData) {
        processRowData(rowData);
      } else {
        fetchRowData();
      }
    }
  }, [isOpen, currentConfig, rowId, rowIndex]);

  const loadDatabaseConfig = () => {
    const config = getConfig(databaseName);
    console.log('Database config loaded:', config);
    
    if (config && config !== databaseConfigs.custom) {
      setCurrentConfig(config);
      
      // Set the ID field from config
      const configIdField = config.idField || idField || 'id';
      setActualIdField(configIdField);
      console.log('ID field set to:', configIdField);
      
      // Extract all column names from config
      const allColumns = config.columns.map(col => {
        if (typeof col === 'object') {
          return col.name;
        }
        return col;
      });
      setColumns(allColumns);
      setConfigColumns(config.columns);
      console.log('Config columns:', allColumns);
      
      // Initialize expanded sections
      const sections = {};
      Object.keys(config.columnGroups || {}).forEach(key => {
        sections[key] = true;
      });
      setExpandedSections(sections);
      
      // Track calculated fields
      const calcFields = new Set(Object.keys(config.calculations || {}));
      setCalculatedFields(calcFields);
      console.log('Calculated fields:', Array.from(calcFields));
    } else {
      // Handle custom database
      setActualIdField(idField || 'id');
      fetchColumnsFromServer();
    }
  };

  const fetchColumnsFromServer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`);
      if (response.ok) {
        const data = await response.json();
        console.log('Server columns data:', data);
        
        if (data.columns && data.columns.length > 0) {
          setColumns(data.columns);
          
          // Determine ID field from response
          const responseIdField = data.idField || idField || 'id';
          setActualIdField(responseIdField);
          
          // Create a basic config for custom databases
          const customConfig = {
            displayName: databaseName,
            idField: responseIdField,
            idPrefix: databaseName.toUpperCase().slice(0, 3),
            columns: data.columns.map(col => ({ 
              name: col, 
              type: 'text', 
              required: false,
              group: 'all'
            })),
            columnGroups: {
              all: {
                title: 'All Fields',
                icon: 'FileText',
                order: 1
              }
            },
            calculations: {}
          };
          
          setCurrentConfig(customConfig);
          setConfigColumns(customConfig.columns);
          setExpandedSections({ all: true });
        }
      }
    } catch (err) {
      console.error('Error fetching columns:', err);
      setError('Failed to load database columns');
    }
  };

  const processRowData = (data) => {
    console.log('Processing row data:', data);
    
    if (!currentConfig || !data) {
      console.log('Missing config or data');
      return;
    }

    // Create form data object with all fields from the row
    const processedData = {};
    
    // First, add all data from the row as-is
    Object.keys(data).forEach(key => {
      processedData[key] = data[key];
    });
    
    // Then ensure all config columns are present
    if (currentConfig.columns && Array.isArray(currentConfig.columns)) {
      currentConfig.columns.forEach(col => {
        const fieldName = typeof col === 'object' ? col.name : col;
        
        // If field doesn't exist in data, try to find it with different casing
        if (processedData[fieldName] === undefined) {
          // Try exact match first
          if (data[fieldName] !== undefined) {
            processedData[fieldName] = data[fieldName];
          } else {
            // Try case-insensitive match
            const matchingKey = Object.keys(data).find(key => 
              key.toLowerCase() === fieldName.toLowerCase() ||
              key.replace(/[-_]/g, '').toLowerCase() === fieldName.replace(/[-_]/g, '').toLowerCase()
            );
            
            if (matchingKey) {
              processedData[fieldName] = data[matchingKey];
            } else {
              // Set default value if specified in config
              const defaultValue = typeof col === 'object' ? col.defaultValue : undefined;
              processedData[fieldName] = defaultValue !== undefined ? defaultValue : '';
            }
          }
        }
      });
    }
    
    console.log('Processed data:', processedData);
    setFormData(processedData);
    setOriginalData(processedData);
    setError('');
    setSuccess('');
    setShowDeleteConfirm(false);
  };

  const fetchRowData = async () => {
    try {
      console.log('Fetching row data - rowId:', rowId, 'rowIndex:', rowIndex);
      
      let endpoint;
      if (rowId) {
        endpoint = `${API_URL}/api/csv/${databaseName}/row/${encodeURIComponent(rowId)}`;
      } else if (rowIndex !== null) {
        endpoint = `${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`;
      } else {
        throw new Error('No row identifier provided');
      }

      console.log('Fetching from endpoint:', endpoint);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch row data');
      }
      
      const result = await response.json();
      const data = result.row || result;
      console.log('Fetched row data:', data);
      
      processRowData(data);
    } catch (err) {
      console.error('Error loading row data:', err);
      setError('Error loading row data: ' + err.message);
    }
  };

  // Track changes
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(key => {
      // Skip ID field and timestamp fields from change detection
      if (key === actualIdField || key === 'created_at' || key === 'updated_at') {
        return false;
      }
      return formData[key] !== originalData[key];
    });
    
    setIsDirty(hasChanges);

    const changes = new Set();
    Object.keys(formData).forEach(key => {
      if (key !== actualIdField && key !== 'created_at' && key !== 'updated_at') {
        if (formData[key] !== originalData[key]) {
          changes.add(key);
        }
      }
    });
    setChangedFields(changes);
  }, [formData, originalData, actualIdField]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Apply calculations if configuration exists
      if (currentConfig && currentConfig.calculations && Object.keys(currentConfig.calculations).length > 0) {
        const calculated = applyCalculations(databaseName, updated);
        console.log('Applied calculations:', calculated);
        return calculated;
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    if (!currentConfig || !currentConfig.columns) return true;
    
    const requiredFields = [];
    currentConfig.columns.forEach(col => {
      if (typeof col === 'object' && col.required && col.name !== actualIdField) {
        requiredFields.push(col.name);
      }
    });
    
    const missing = requiredFields.filter(field => 
      !formData[field] || formData[field].toString().trim() === ''
    );
    
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.map(f => getFieldLabel(f)).join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for saving - include all fields
      const dataToSave = { ...formData };
      
      // Ensure ID field is preserved
      if (actualIdField && originalData[actualIdField]) {
        dataToSave[actualIdField] = originalData[actualIdField];
      }

      console.log('Saving data:', dataToSave);

      let endpoint;
      if (rowId) {
        endpoint = `${API_URL}/api/csv/${databaseName}/row/${encodeURIComponent(rowId)}`;
      } else if (rowIndex !== null) {
        endpoint = `${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`;
      } else {
        throw new Error('Missing row identifier for update');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update row');
      }

      const result = await response.json();
      setSuccess('Row updated successfully!');
      setOriginalData(formData);
      setIsDirty(false);
      
      if (onSuccess) {
        onSuccess({ ...dataToSave, ...result });
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating row:', err);
      setError(err.message || 'Failed to update row');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      let endpoint;
      if (rowId) {
        endpoint = `${API_URL}/api/csv/${databaseName}/row/${encodeURIComponent(rowId)}`;
      } else if (rowIndex !== null) {
        endpoint = `${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`;
      } else {
        throw new Error('Missing row identifier for delete');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete row');
      }

      const result = await response.json();
      setSuccess('Row deleted successfully!');
      
      if (onDelete) {
        onDelete(result);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error deleting row:', err);
      setError(err.message || 'Failed to delete row');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = () => {
    const duplicatedData = { ...formData };
    
    // Remove ID and timestamp fields
    delete duplicatedData[actualIdField];
    delete duplicatedData.created_at;
    delete duplicatedData.updated_at;
    
    // Generate new ID if config available
    if (currentConfig) {
      duplicatedData[actualIdField] = generateId(databaseName, Date.now(), Math.floor(Math.random() * 1000));
    }
    
    setFormData(duplicatedData);
    setOriginalData(duplicatedData);
    setSuccess('Row duplicated. New ID will be generated when saved.');
  };

  const handleReset = () => {
    setFormData(originalData);
    setIsDirty(false);
    setChangedFields(new Set());
    setError('');
    setSuccess('Form reset to original values');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFieldType = (field) => {
    // Check config for field type
    const column = configColumns.find(col => 
      (typeof col === 'object' ? col.name : col) === field
    );
    
    if (column && typeof column === 'object' && column.type) {
      return column.type;
    }
    
    // Auto-detect based on field name
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('date') || fieldLower.includes('pdc') || fieldLower.includes('sdc')) {
      return 'date';
    }
    
    if (fieldLower.includes('amount') || fieldLower.includes('expdr') || 
        fieldLower.includes('expenditure') || fieldLower.includes('progress') || 
        fieldLower.includes('percentage') || fieldLower.includes('percent') ||
        fieldLower.includes('allotment') || fieldLower.includes('sanction') || 
        fieldLower.includes('fund') || fieldLower.includes('bill') || 
        fieldLower.includes('liabilities') || fieldLower.includes('length') || 
        fieldLower.includes('days') || fieldLower.includes('age')) {
      return 'number';
    }
    
    if (fieldLower === 'remarks' || fieldLower.includes('description') || fieldLower.includes('work_description')) {
      return 'textarea';
    }
    
    return 'text';
  };

  const getFieldLabel = (field) => {
    // Check config for field label
    const column = configColumns.find(col => 
      (typeof col === 'object' ? col.name : col) === field
    );
    
    if (column && typeof column === 'object' && column.label) {
      return column.label;
    }
    
    // Auto-generate label
    return field
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace('Fy', 'FY')
      .replace('Pdc', 'PDC')
      .replace('Sdc', 'SDC')
      .replace('Shq', 'SHQ')
      .replace('Ftr Hq', 'Frontier HQ')
      .replace('Aa Es', 'AA/ES')
      .replace('Expdr', 'Expenditure')
      .replace('Cfy', 'CFY')
      .replace('Cr', 'Crores')
      .replace('Hlec', 'HLEC')
      .replace('Lakh', 'Lakhs')
      .replace('Prev ', 'Previous ')
      .replace('Elekha', 'E-Lekha')
      .replace('Hqrs', 'HQrs')
      .replace('Financila', 'Financial');
  };

  const formatValue = (value, fieldType) => {
    if (value === null || value === undefined || value === '') return '';
    
    if (fieldType === 'date' && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || Database;
  };

  const getGroupFields = (group) => {
    if (!configColumns) return [];
    
    return configColumns
      .filter(col => {
        if (typeof col === 'object') {
          return col.group === group;
        }
        return false;
      })
      .map(col => typeof col === 'object' ? col.name : col);
  };

  const getGroupRequiredFields = (groupKey) => {
    if (!configColumns) return [];
    
    return configColumns
      .filter(col => {
        if (typeof col === 'object') {
          return col.group === groupKey && col.required;
        }
        return false;
      })
      .map(col => col.name);
  };

  const renderIdBadge = () => {
    const config = currentConfig || {};
    const id = formData[actualIdField];
    
    if (!id) return null;
    
    const needsRegeneration = /^\d+$/.test(String(id));
    
    return (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${
        needsRegeneration
          ? 'bg-yellow-100 dark:bg-yellow-900/20'
          : 'bg-blue-100 dark:bg-blue-900/20'
      }`}>
        <Key size={14} className={needsRegeneration ? 'text-yellow-600' : 'text-blue-600'} />
        <span className={`text-xs font-medium ${
          needsRegeneration ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400'
        }`}>
          {actualIdField}: {id}
        </span>
        {needsRegeneration && (
          <span className="text-[10px] text-yellow-600 dark:text-yellow-500">
            (Needs regeneration)
          </span>
        )}
      </div>
    );
  };

  const renderField = (field) => {
    const fieldType = getFieldType(field);
    const hasChanged = changedFields.has(field);
    const column = configColumns.find(col => 
      (typeof col === 'object' ? col.name : col) === field
    );
    const isRequired = column && typeof column === 'object' && column.required;
    const isIdField = field === actualIdField;
    const isCalculated = calculatedFields.has(field);
    const isReadonly = isIdField || isCalculated;
    
    return (
      <div key={field} className={fieldType === 'textarea' ? 'lg:col-span-4' : ''}>
        <label className={`block text-[11px] font-medium mb-1 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {getFieldLabel(field)}
          {isRequired && <span className="text-red-500">*</span>}
          {isIdField && (
            <Fingerprint size={10} className="text-yellow-500" />
          )}
          {hasChanged && (
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" title="Modified"></span>
          )}
          {isCalculated && (
            <span className="text-[9px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded inline-flex items-center gap-0.5">
              <Calculator size={8} />
              Auto
            </span>
          )}
        </label>
        
        {fieldType === 'textarea' ? (
          <textarea
            value={formatValue(formData[field], fieldType) || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={2}
            disabled={isReadonly}
            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
              isReadonly
                ? darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : hasChanged
                  ? darkMode
                    ? 'bg-yellow-900/20 border-yellow-600 text-gray-100'
                    : 'bg-yellow-50 border-yellow-400'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          />
        ) : (
          <input
            type={fieldType}
            value={formatValue(formData[field], fieldType) || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={isReadonly}
            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
              isReadonly
                ? darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : hasChanged
                  ? darkMode
                    ? 'bg-yellow-900/20 border-yellow-600 text-gray-100'
                    : 'bg-yellow-50 border-yellow-400'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          />
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  if (!databaseName) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl`}>
          <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
          <p className="text-center">No database selected</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const config = currentConfig || {};
  const ConfigIcon = getIconComponent(config.icon);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className={`relative w-[98vw] max-w-[98vw] h-[84vh] ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      } rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header - Compact for landscape */}
        <div className={`px-6 py-3 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Edit2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  Edit Row - {config.displayName || databaseName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {renderIdBadge()}
                  {(rowIndex !== null || rowId) && (
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                      {rowIndex !== null ? `Index: ${rowIndex}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[10px] font-medium">
                  {changedFields.size} unsaved
                </span>
              )}
              
              <button
                onClick={handleDuplicate}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Copy size={12} />
                Duplicate
              </button>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts - Compact */}
        {(error || success) && (
          <div className="px-6 py-2">
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                <AlertCircle size={14} />
                <span className="text-xs">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                <Check size={14} />
                <span className="text-xs">{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body - 4 columns layout for landscape */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-3">
            {/* Render fields based on column groups if they exist */}
            {currentConfig?.columnGroups ? (
              Object.entries(currentConfig.columnGroups)
                .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                .map(([groupKey, group]) => {
                  const GroupIcon = getIconComponent(group.icon);
                  const isExpanded = expandedSections[groupKey];
                  const groupFields = getGroupFields(groupKey);
                  
                  if (groupFields.length === 0) return null;
                  
                  const requiredFields = getGroupRequiredFields(groupKey);
                  
                  return (
                    <div key={groupKey} className={`rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <button
                        onClick={() => toggleSection(groupKey)}
                        className={`w-full px-4 py-2 flex items-center justify-between ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        } transition-colors rounded-t-xl`}
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon size={16} className="text-blue-500" />
                          <h3 className="font-semibold text-xs">{group.title}</h3>
                          {groupFields.some(field => changedFields.has(field)) && (
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                          )}
                          {requiredFields.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                              {requiredFields.length} Required
                            </span>
                          )}
                          {groupFields.some(f => calculatedFields.has(f)) && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                              Has Calculated Fields
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {groupFields.map(field => renderField(field))}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              // Render all fields in a single group if no groups defined
              <div className={`rounded-xl border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {columns.map(field => renderField(field))}
                </div>
              </div>
            )}

            {/* Ungrouped fields (if any) */}
            {(() => {
              if (!currentConfig?.columnGroups) return null;
              
              const groupedFields = new Set();
              Object.keys(currentConfig.columnGroups).forEach(groupKey => {
                getGroupFields(groupKey).forEach(field => groupedFields.add(field));
              });
              
              const ungroupedFields = columns.filter(col => 
                !groupedFields.has(col) && col !== actualIdField
              );
              
              if (ungroupedFields.length === 0) return null;
              
              return (
                <div className={`rounded-xl border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    onClick={() => toggleSection('additional')}
                    className={`w-full px-4 py-2 flex items-center justify-between ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } transition-colors rounded-t-xl`}
                  >
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-purple-500" />
                      <h3 className="font-semibold text-xs">Additional Fields</h3>
                      {ungroupedFields.some(field => changedFields.has(field)) && (
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                      )}
                    </div>
                    {expandedSections.additional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  {expandedSections.additional && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ungroupedFields.map(field => renderField(field))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer - Compact */}
        <div className={`px-6 py-2.5 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        } flex justify-between items-center`}>
          <div className="flex gap-2">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleting}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-xs text-red-700 dark:text-red-400">Confirm?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-medium hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 bg-gray-500 text-white rounded text-[10px] font-medium hover:bg-gray-600"
                >
                  No
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="text-[10px] text-gray-500 flex items-center gap-2 mr-3">
              <ConfigIcon size={14} className="text-blue-500" />
              Database: {databaseName}
              {calculatedFields.size > 0 && (
                <>
                  <span>•</span>
                  <Calculator size={12} />
                  {calculatedFields.size} calculated
                </>
              )}
            </div>

            {isDirty && (
              <button
                onClick={handleReset}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5`}
              >
                <RefreshCw size={14} />
                Reset
              </button>
            )}
            
            <button
              onClick={handleClose}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || !isDirty}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRow;