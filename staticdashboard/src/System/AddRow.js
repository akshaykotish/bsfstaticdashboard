import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, X, AlertCircle, Check, Loader, 
  Database, Calendar, DollarSign, MapPin, Building2, 
  User, FileText, Hash, RefreshCw, Copy, Sparkles,
  ChevronDown, ChevronUp, Info, Key, Fingerprint,
  Calculator, Clock, Shield, Activity, Layers
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

const AddRow = ({ 
  isOpen, 
  onClose, 
  darkMode = false,
  databaseName = '',
  idField = '',
  onSuccess = () => {},
  defaultValues = {}
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [columns, setColumns] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [showIdInfo, setShowIdInfo] = useState(true);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [calculatedFields, setCalculatedFields] = useState(new Set());

  // Load configuration when database changes
  useEffect(() => {
    if (isOpen && databaseName) {
      loadDatabaseConfig();
    }
  }, [isOpen, databaseName]);

  const loadDatabaseConfig = () => {
    const config = getConfig(databaseName);
    
    if (config && config !== databaseConfigs.custom) {
      setCurrentConfig(config);
      
      // Extract column names from config
      const columnNames = config.columns.map(col => 
        typeof col === 'object' ? col.name : col
      );
      setColumns(columnNames);
      
      // Initialize expanded sections based on groups
      const sections = {};
      Object.keys(config.columnGroups || {}).forEach(key => {
        sections[key] = true; // Start with all sections expanded
      });
      setExpandedSections(sections);
      
      // Initialize form data with default values
      const initialData = { ...defaultValues };
      
      // Set default values from config
      config.columns.forEach(col => {
        const colName = typeof col === 'object' ? col.name : col;
        const colObj = typeof col === 'object' ? col : null;
        
        // Skip ID field and timestamps
        if (colName === config.idField || colName === 'created_at' || colName === 'updated_at') {
          return;
        }
        
        // Set default value if specified in column config
        if (colObj && colObj.defaultValue !== undefined && !initialData[colName]) {
          initialData[colName] = colObj.defaultValue;
        } else if (!initialData[colName]) {
          initialData[colName] = '';
        }
      });
      
      setFormData(initialData);
      
      // Track calculated fields
      const calcFields = new Set(Object.keys(config.calculations || {}));
      setCalculatedFields(calcFields);
      
      // Apply initial calculations
      if (config.calculations && Object.keys(config.calculations).length > 0) {
        const calculatedData = applyCalculations(databaseName, initialData);
        setFormData(calculatedData);
      }
    } else {
      // Handle custom database without predefined config
      fetchColumnsFromServer();
    }
    
    setError('');
    setSuccess('');
  };

  const fetchColumnsFromServer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`);
      if (response.ok) {
        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
          setColumns(data.columns.filter(col => col !== idField));
          
          // Create a single group for all columns
          setCurrentConfig({
            displayName: databaseName,
            idField: idField || 'id',
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
          
          // Initialize empty form data
          const initialData = { ...defaultValues };
          data.columns.forEach(col => {
            if (col !== idField && !initialData.hasOwnProperty(col)) {
              initialData[col] = '';
            }
          });
          delete initialData[idField];
          setFormData(initialData);
        }
      }
    } catch (err) {
      console.error('Error fetching columns:', err);
      setError('Failed to load database columns');
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error('A record with similar data already exists');
        }
        throw new Error(errorData.error || 'Failed to add row');
      }

      const result = await response.json();
      const generatedId = result.generatedId || result.row?.[currentConfig?.idField];
      
      setSuccess(`Row added successfully! Generated ID: ${generatedId}`);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add row');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (currentConfig) {
      const resetData = {};
      
      // Initialize with default values from config
      currentConfig.columns.forEach(col => {
        const colName = typeof col === 'object' ? col.name : col;
        const colObj = typeof col === 'object' ? col : null;
        
        if (colName === currentConfig.idField) return;
        
        if (colObj && colObj.defaultValue !== undefined) {
          resetData[colName] = colObj.defaultValue;
        } else {
          resetData[colName] = '';
        }
      });
      
      // Apply default values passed as props
      Object.assign(resetData, defaultValues);
      delete resetData[currentConfig.idField];
      
      // Apply calculations
      if (currentConfig.calculations && Object.keys(currentConfig.calculations).length > 0) {
        const calculatedData = applyCalculations(databaseName, resetData);
        setFormData(calculatedData);
      } else {
        setFormData(resetData);
      }
    } else {
      setFormData({});
    }
    setSuccess('Form reset to default values');
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

  const handleClose = () => {
    if (Object.keys(formData).some(key => formData[key] && formData[key] !== '0')) {
      if (window.confirm('You have unsaved data. Are you sure you want to close?')) {
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
      
      // Skip ID field
      if (colName === currentConfig.idField) return;
      
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

  if (!isOpen) return null;

  if (!databaseName) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl`}>
          <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
          <p className="text-center">Please select a database first</p>
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
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-green-500 to-green-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                  Add New Row - {config.displayName || databaseName}
                </h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-green-100'} flex items-center gap-2`}>
                  <Key size={12} />
                  ID will be auto-generated: {getExampleId()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-green-700'
              } transition-colors`}
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* ID Information Banner - Compact */}
        {showIdInfo && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Fingerprint size={16} className="text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 inline">
                  Automatic ID Generation - 
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 inline ml-1">
                  A unique ID ({getExampleId()}) will be generated automatically.
                  {config.calculations && Object.keys(config.calculations).length > 0 && (
                    <span className="ml-2">
                      <Calculator size={10} className="inline mr-1" />
                      {Object.keys(config.calculations).length} field(s) will be auto-calculated
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowIdInfo(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

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
                <span className="text-xs font-medium">{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body - 4 columns layout for landscape */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-3">
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
                      className={`w-full px-4 py-2 flex items-center justify-between ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } transition-colors rounded-t-xl`}
                    >
                      <div className="flex items-center gap-2">
                        <GroupIcon size={16} className={`text-${config.color || 'blue'}-500`} />
                        <h3 className="font-semibold text-xs">{group.title}</h3>
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
                        {groupFields.map(field => {
                          const fieldType = getFieldType(field);
                          const column = currentConfig?.columns.find(col => 
                            (typeof col === 'object' ? col.name : col) === field
                          );
                          const isRequired = column && typeof column === 'object' && column.required;
                          const isCalculated = calculatedFields.has(field);
                          
                          return (
                            <div key={field} className={fieldType === 'textarea' ? 'lg:col-span-4' : ''}>
                              <label className={`block text-[11px] font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {getFieldLabel(field)}
                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                                {isCalculated && (
                                  <span className="text-[9px] px-1 py-0.5 ml-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded inline-flex items-center gap-0.5">
                                    <Calculator size={8} />
                                    Auto
                                  </span>
                                )}
                              </label>
                              
                              {fieldType === 'textarea' ? (
                                <textarea
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  rows={2}
                                  disabled={isCalculated}
                                  placeholder={isRequired ? 'Required' : 'Optional'}
                                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                                    isCalculated
                                      ? darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                                      : darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' 
                                        : 'bg-white border-gray-300 placeholder-gray-400'
                                  } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                />
                              ) : (
                                <input
                                  type={fieldType}
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  disabled={isCalculated}
                                  placeholder={isRequired ? 'Required' : 'Optional'}
                                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border ${
                                    isCalculated
                                      ? darkMode
                                        ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                                      : darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' 
                                        : 'bg-white border-gray-300 placeholder-gray-400'
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
          </div>
        </div>

        {/* Footer - Compact */}
        <div className={`px-6 py-2.5 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        } flex justify-between items-center`}>
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <ConfigIcon size={14} className={`text-${config.color || 'gray'}-500`} />
            Fields marked with <span className="text-red-500">*</span> are required
            {calculatedFields.size > 0 && (
              <>
                <span className="mx-1">•</span>
                <Calculator size={12} />
                {calculatedFields.size} calculated field(s)
              </>
            )}
          </div>
          
          <div className="flex gap-2">
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
              onClick={handleSubmit}
              disabled={loading}
              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Add Row
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRow;