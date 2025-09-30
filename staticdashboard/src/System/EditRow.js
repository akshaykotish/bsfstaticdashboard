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

const EditRow = ({ 
  isOpen, 
  onClose, 
  darkMode = false,
  databaseName = '',
  idField = '',
  rowIndex = null,
  rowData = null,
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

  // Load configuration and data when component opens
  useEffect(() => {
    if (isOpen && databaseName && (rowIndex !== null || rowData)) {
      loadDatabaseConfig();
      fetchRowData();
    }
  }, [isOpen, rowIndex, rowData, databaseName]);

  // Track changes
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
    setIsDirty(hasChanges);

    const changes = new Set();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== originalData[key]) {
        changes.add(key);
      }
    });
    setChangedFields(changes);
  }, [formData, originalData]);

  const loadDatabaseConfig = () => {
    const config = getConfig(databaseName);
    
    if (config && config !== databaseConfigs.custom) {
      setCurrentConfig(config);
      
      // Extract column names from config
      const columnNames = config.columns.map(col => 
        typeof col === 'object' ? col.name : col
      );
      setColumns(columnNames);
      
      // Initialize expanded sections
      const sections = {};
      Object.keys(config.columnGroups || {}).forEach(key => {
        sections[key] = true;
      });
      setExpandedSections(sections);
      
      // Track calculated fields
      const calcFields = new Set(Object.keys(config.calculations || {}));
      setCalculatedFields(calcFields);
    } else {
      // Handle custom database
      fetchColumnsFromServer();
    }
  };

  const fetchColumnsFromServer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`);
      if (response.ok) {
        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
          setColumns(data.columns);
          
          // Create a single group for all columns
          setCurrentConfig({
            displayName: databaseName,
            idField: idField || data.idField || 'id',
            idPrefix: databaseName.toUpperCase().slice(0, 3),
            columns: data.columns.map(col => ({ name: col, type: 'text', required: false })),
            columnGroups: {
              all: {
                title: 'All Fields',
                icon: 'FileText',
                order: 1
              }
            },
            calculations: {}
          });
          
          setExpandedSections({ all: true });
        }
      }
    } catch (err) {
      console.error('Error fetching columns:', err);
    }
  };

  const fetchRowData = async () => {
    try {
      let data;
      
      if (rowData) {
        data = rowData;
      } else if (rowIndex !== null) {
        const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`);
        if (!response.ok) throw new Error('Failed to fetch row data');
        const result = await response.json();
        data = result.row;
      } else {
        throw new Error('No row data available');
      }

      setFormData(data);
      setOriginalData(data);
      setError('');
      setSuccess('');
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Error loading row data: ' + err.message);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Apply calculations if configuration exists
      if (currentConfig && currentConfig.calculations && Object.keys(currentConfig.calculations).length > 0) {
        return applyCalculations(databaseName, updated);
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    if (!currentConfig) return true;
    
    // Collect all required fields from columns
    const requiredFields = [];
    currentConfig.columns.forEach(col => {
      if (typeof col === 'object' && col.required && col.name !== currentConfig.idField) {
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
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update row');
      }

      const result = await response.json();
      setSuccess('Row updated successfully! ID preserved.');
      setOriginalData(formData);
      setIsDirty(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update row');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows/${rowIndex}`, {
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
      setError(err.message || 'Failed to delete row');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = () => {
    const duplicatedData = { ...formData };
    const idField = currentConfig?.idField || 'id';
    
    delete duplicatedData[idField];
    delete duplicatedData.created_at;
    delete duplicatedData.updated_at;
    
    setFormData(duplicatedData);
    setSuccess('Row duplicated. ID will be auto-generated when saved.');
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
    // First check if the field has a type defined in config
    const column = currentConfig?.columns.find(col => 
      (typeof col === 'object' ? col.name : col) === field
    );
    
    if (column && typeof column === 'object' && column.type) {
      return column.type;
    }
    
    // Fallback to field name analysis
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
        fieldLower.includes('days') || fieldLower === 'completed_percentage' ||
        fieldLower.includes('age of')) {
      return 'number';
    }
    
    if (fieldLower === 'remarks' || fieldLower.includes('description')) {
      return 'textarea';
    }
    
    return 'text';
  };

  const getFieldLabel = (field) => {
    // Check if the field has a label defined in config
    const column = currentConfig?.columns.find(col => 
      (typeof col === 'object' ? col.name : col) === field
    );
    
    if (column && typeof column === 'object' && column.label) {
      return column.label;
    }
    
    // Fallback to automatic label generation
    if (field === 'S_No' || field === 'S/No.') return 'Serial Number';
    if (field === 's_no') return 'Serial Number';
    
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('Fy', 'FY')
      .replace('Pdc', 'PDC')
      .replace('Sdc', 'SDC')
      .replace('Shq', 'SHQ')
      .replace('Ftr Hq', 'Frontier HQ')
      .replace('Aa Es', 'AA/ES')
      .replace('Sd Amount Lakh', 'Sanctioned Amount (Lakhs)')
      .replace('Expdr', 'Expenditure')
      .replace('Cr', 'Crores')
      .replace('Hlec', 'HLEC');
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

  // Get icon component from string
  const getIconComponent = (iconName) => {
    return iconMap[iconName] || Database;
  };

  // Get fields for a specific group
  const getGroupFields = (group) => {
    const groupFields = [];
    
    currentConfig?.columns.forEach(col => {
      const colName = typeof col === 'object' ? col.name : col;
      const colObj = typeof col === 'object' ? col : null;
      
      // Check if field belongs to this group
      if (colObj && colObj.group === group) {
        groupFields.push(colName);
      }
    });
    
    return groupFields;
  };

  // Get required fields for a group
  const getGroupRequiredFields = (groupKey) => {
    const requiredFields = [];
    
    currentConfig?.columns.forEach(col => {
      if (typeof col === 'object' && col.group === groupKey && col.required) {
        requiredFields.push(col.name);
      }
    });
    
    return requiredFields;
  };

  // Generate example ID for display
  const getExampleId = () => {
    if (!currentConfig) return 'CUSTOM-1234567890-1';
    return generateId(databaseName, Date.now(), 1);
  };

  const renderIdBadge = () => {
    const config = currentConfig || {};
    const idFieldName = config.idField || idField || 'id';
    const id = formData[idFieldName];
    
    if (!id) return null;
    
    const needsRegeneration = /^\d+$/.test(String(id));
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
        needsRegeneration
          ? 'bg-yellow-100 dark:bg-yellow-900/20'
          : `bg-${config.color || 'blue'}-100 dark:bg-${config.color || 'blue'}-900/20`
      }`}>
        <Key size={16} className={needsRegeneration ? 'text-yellow-600' : `text-${config.color || 'blue'}-600`} />
        <span className={`text-sm font-medium ${
          needsRegeneration ? 'text-yellow-700 dark:text-yellow-400' : `text-${config.color || 'blue'}-700 dark:text-${config.color || 'blue'}-400`
        }`}>
          {idFieldName}: {id}
        </span>
        {needsRegeneration && (
          <span className="text-xs text-yellow-600 dark:text-yellow-500">
            (Needs regeneration)
          </span>
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
  const idFieldName = config.idField || idField || 'id';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-5xl max-h-[90vh] ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      } rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Edit2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  Edit Row - {config.displayName || databaseName}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {renderIdBadge()}
                  {rowIndex !== null && (
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                      Row #{rowIndex + 1}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs font-medium">
                  {changedFields.size} unsaved changes
                </span>
              )}
              
              <button
                onClick={handleDuplicate}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Copy size={14} />
                Duplicate
              </button>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div className="px-6 py-3">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                <Check size={16} />
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {Object.entries(config.columnGroups || {})
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
                      className={`w-full px-4 py-3 flex items-center justify-between ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } transition-colors rounded-t-xl`}
                    >
                      <div className="flex items-center gap-2">
                        <GroupIcon size={18} className={`text-${config.color || 'blue'}-500`} />
                        <h3 className="font-semibold text-sm">{group.title}</h3>
                        {groupFields.some(field => changedFields.has(field)) && (
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        )}
                        {calculatedFields.size > 0 && groupFields.some(f => calculatedFields.has(f)) && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                            Has Calculated Fields
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupFields.map(field => {
                          const fieldType = getFieldType(field);
                          const hasChanged = changedFields.has(field);
                          const column = currentConfig?.columns.find(col => 
                            (typeof col === 'object' ? col.name : col) === field
                          );
                          const isRequired = column && typeof column === 'object' && column.required;
                          const isIdField = field === idFieldName;
                          const isCalculated = calculatedFields.has(field);
                          const isReadonly = isIdField || isCalculated;
                          
                          return (
                            <div key={field} className={fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                              <label className={`block text-xs font-medium mb-1 flex items-center gap-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {getFieldLabel(field)}
                                {isRequired && <span className="text-red-500">*</span>}
                                {isIdField && (
                                  <Fingerprint size={12} className="text-yellow-500" />
                                )}
                                {hasChanged && (
                                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" title="Modified"></span>
                                )}
                                {isReadonly && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded inline-flex items-center gap-1">
                                    {isIdField ? (
                                      <>
                                        <Key size={10} />
                                        ID
                                      </>
                                    ) : (
                                      <>
                                        <Calculator size={10} />
                                        Auto
                                      </>
                                    )}
                                  </span>
                                )}
                              </label>
                              
                              {fieldType === 'textarea' ? (
                                <textarea
                                  value={formatValue(formData[field], fieldType) || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  rows={3}
                                  disabled={isReadonly}
                                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
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
                                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
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
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Additional Fields (for fields not in any group) */}
            {columns.length > 0 && (() => {
              const groupedFields = new Set();
              Object.keys(config.columnGroups || {}).forEach(groupKey => {
                getGroupFields(groupKey).forEach(field => groupedFields.add(field));
              });
              
              const ungroupedFields = columns.filter(col => 
                !groupedFields.has(col) && col !== idFieldName
              );
              
              if (ungroupedFields.length === 0) return null;
              
              return (
                <div className={`rounded-xl border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    onClick={() => toggleSection('additional')}
                    className={`w-full px-4 py-3 flex items-center justify-between ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } transition-colors rounded-t-xl`}
                  >
                    <div className="flex items-center gap-2">
                      <Database size={18} className="text-purple-500" />
                      <h3 className="font-semibold text-sm">Additional Fields</h3>
                      {ungroupedFields.some(field => changedFields.has(field)) && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      )}
                    </div>
                    {expandedSections.additional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedSections.additional && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ungroupedFields.map(field => {
                        const fieldType = getFieldType(field);
                        const hasChanged = changedFields.has(field);
                        
                        return (
                          <div key={field} className={fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className={`block text-xs font-medium mb-1 flex items-center gap-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {getFieldLabel(field)}
                              {hasChanged && (
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" title="Modified"></span>
                              )}
                            </label>
                            {fieldType === 'textarea' ? (
                              <textarea
                                value={formData[field] || ''}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                  hasChanged
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
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                  hasChanged
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
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        } flex justify-between items-center`}>
          <div className="flex gap-2">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">Confirm deletion?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                >
                  No
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-2 mr-4">
              <ConfigIcon size={16} className={`text-${config.color || 'gray'}-500`} />
              {calculatedFields.size > 0 && (
                <>
                  <Calculator size={14} />
                  {calculatedFields.size} calculated field(s)
                </>
              )}
            </div>

            {isDirty && (
              <button
                onClick={handleReset}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                <RefreshCw size={16} />
                Reset
              </button>
            )}
            
            <button
              onClick={handleClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
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