import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Edit2, Save, X, Plus, Trash2, Search, Filter,
  Download, Upload, RefreshCw, CheckCircle, AlertCircle,
  Database, Copy, Eye, EyeOff, Moon, Sun, Grid,
  List, ChevronUp, ChevronDown, FileText, Lock,
  Unlock, History, ArrowLeft, ArrowRight, Settings,
  IndianRupee, Calendar, MapPin, Building2, User,
  AlertTriangle, Info, Check, XCircle, Loader
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Edit = () => {
  // State Management
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [changes, setChanges] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [notification, setNotification] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');

  // Column definitions with validation rules
  const columns = [
    { key: 'serial_no', label: 'S.No', type: 'number', required: true, editable: false },
    { key: 'scheme_name', label: 'Scheme Name', type: 'text', required: true },
    { key: 'budget_head', label: 'Budget Head', type: 'text' },
    { key: 'frontier_hq', label: 'Frontier HQ', type: 'text' },
    { key: 'sector_hq', label: 'Sector HQ', type: 'text' },
    { key: 'work_site', label: 'Work Site', type: 'text' },
    { key: 'executive_agency', label: 'Executive Agency', type: 'text' },
    { key: 'firm_name', label: 'Contractor', type: 'text' },
    { key: 'sanctioned_amount', label: 'Sanctioned Amount', type: 'currency', min: 0 },
    { key: 'total_expdr', label: 'Total Expenditure', type: 'currency', min: 0 },
    { key: 'percent_expdr', label: 'Expenditure %', type: 'percentage', min: 0, max: 100 },
    { key: 'physical_progress', label: 'Physical Progress', type: 'percentage', min: 0, max: 100 },
    { key: 'expected_progress', label: 'Expected Progress', type: 'percentage', min: 0, max: 100 },
    { key: 'delay_days', label: 'Delay Days', type: 'number', min: 0 },
    { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    { key: 'status', label: 'Status', type: 'select', options: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'] },
    { key: 'health_status', label: 'Health Status', type: 'select', options: ['GOOD', 'FAIR', 'POOR', 'CRITICAL'] },
    { key: 'efficiency_score', label: 'Efficiency Score', type: 'number', min: 0, max: 100 },
    { key: 'health_score', label: 'Health Score', type: 'number', min: 0, max: 100 },
    { key: 'time_allowed_days', label: 'Time Allowed (Days)', type: 'number', min: 0 },
    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'expected_completion_date', label: 'Expected Completion', type: 'date' },
    { key: 'actual_completion_date', label: 'Actual Completion', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' }
  ];

  // Initialize column visibility
  useEffect(() => {
    const initialVisibility = {};
    columns.forEach(col => {
      initialVisibility[col.key] = true;
    });
    setColumnVisibility(initialVisibility);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && Object.keys(changes).length > 0) {
      const timer = setTimeout(() => {
        saveChanges();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [changes, autoSave]);

  // Notification auto-hide
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // API Functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/engineering`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setOriginalData(JSON.parse(JSON.stringify(result)));
      showNotification('Data loaded successfully', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const changedRecords = Object.keys(changes).map(id => {
        const record = data.find(r => r.id === id || r.serial_no === parseInt(id));
        return { ...record, ...changes[id] };
      });

      const response = await fetch(`${API_URL}/api/engineering/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedRecords)
      });

      if (!response.ok) throw new Error('Failed to save changes');
      
      const result = await response.json();
      setOriginalData(JSON.parse(JSON.stringify(data)));
      setChanges({});
      setLastSaved(new Date());
      showNotification(`${result.updated} records updated successfully`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addRow = async () => {
    const newRow = {
      id: `new_${Date.now()}`,
      serial_no: Math.max(...data.map(d => d.serial_no || 0)) + 1,
      scheme_name: 'New Project',
      budget_head: '',
      frontier_hq: '',
      sector_hq: '',
      work_site: '',
      executive_agency: '',
      firm_name: '',
      sanctioned_amount: 0,
      total_expdr: 0,
      percent_expdr: 0,
      physical_progress: 0,
      expected_progress: 0,
      delay_days: 0,
      risk_level: 'LOW',
      status: 'NOT_STARTED',
      health_status: 'GOOD',
      efficiency_score: 0,
      health_score: 0,
      time_allowed_days: 0,
      start_date: new Date().toISOString().split('T')[0],
      expected_completion_date: '',
      actual_completion_date: '',
      remarks: '',
      isNew: true
    };

    setData([newRow, ...data]);
    addToHistory();
    showNotification('New row added', 'success');
  };

  const deleteRows = async (rowIds) => {
    try {
      const response = await fetch(`${API_URL}/api/engineering/batch`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: rowIds })
      });

      if (!response.ok) throw new Error('Failed to delete rows');
      
      setData(data.filter(row => !rowIds.includes(row.id || row.serial_no)));
      setSelectedRows([]);
      addToHistory();
      showNotification(`${rowIds.length} row(s) deleted`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const duplicateRows = () => {
    const newRows = selectedRows.map(id => {
      const original = data.find(r => r.id === id || r.serial_no === id);
      return {
        ...original,
        id: `new_${Date.now()}_${Math.random()}`,
        serial_no: Math.max(...data.map(d => d.serial_no || 0)) + 1,
        scheme_name: `${original.scheme_name} (Copy)`,
        isNew: true
      };
    });
    setData([...newRows, ...data]);
    addToHistory();
    showNotification(`${newRows.length} row(s) duplicated`, 'success');
  };

  // Helper Functions
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const addToHistory = () => {
    const newHistory = [...history.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(data))];
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const validateCell = (value, column) => {
    if (column.required && !value) {
      return 'This field is required';
    }
    if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'Must be a number';
      if (column.min !== undefined && numValue < column.min) {
        return `Must be at least ${column.min}`;
      }
      if (column.max !== undefined && numValue > column.max) {
        return `Must be at most ${column.max}`;
      }
    }
    if (column.type === 'date' && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid date';
    }
    return null;
  };

  const handleCellEdit = (rowId, columnKey, value) => {
    const column = columns.find(c => c.key === columnKey);
    const error = validateCell(value, column);
    
    if (error) {
      setValidationErrors({ ...validationErrors, [`${rowId}_${columnKey}`]: error });
      return;
    }
    
    // Clear validation error
    const newErrors = { ...validationErrors };
    delete newErrors[`${rowId}_${columnKey}`];
    setValidationErrors(newErrors);
    
    // Update data
    const newData = data.map(row => {
      if (row.id === rowId || row.serial_no === rowId) {
        return { ...row, [columnKey]: value };
      }
      return row;
    });
    
    setData(newData);
    
    // Track changes
    const existingChanges = changes[rowId] || {};
    setChanges({
      ...changes,
      [rowId]: { ...existingChanges, [columnKey]: value }
    });
    
    addToHistory();
  };

  const handleBulkEdit = () => {
    if (!bulkEditField || bulkEditValue === '') return;
    
    const column = columns.find(c => c.key === bulkEditField);
    const error = validateCell(bulkEditValue, column);
    
    if (error) {
      showNotification(error, 'error');
      return;
    }
    
    const newData = data.map(row => {
      if (selectedRows.includes(row.id || row.serial_no)) {
        return { ...row, [bulkEditField]: bulkEditValue };
      }
      return row;
    });
    
    setData(newData);
    
    // Track changes for all selected rows
    const newChanges = { ...changes };
    selectedRows.forEach(rowId => {
      const existingChanges = newChanges[rowId] || {};
      newChanges[rowId] = { ...existingChanges, [bulkEditField]: bulkEditValue };
    });
    setChanges(newChanges);
    
    setBulkEditMode(false);
    setBulkEditField('');
    setBulkEditValue('');
    addToHistory();
    showNotification(`${selectedRows.length} rows updated`, 'success');
  };

  const exportData = (format = 'csv') => {
    const exportableData = filteredData;
    
    if (format === 'csv') {
      const headers = columns.filter(c => columnVisibility[c.key]).map(c => c.label).join(',');
      const rows = exportableData.map(row => 
        columns.filter(c => columnVisibility[c.key]).map(c => {
          const value = row[c.key];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineering_data_${new Date().toISOString()}.csv`;
      a.click();
    } else if (format === 'json') {
      const json = JSON.stringify(exportableData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineering_data_${new Date().toISOString()}.json`;
      a.click();
    }
    
    showNotification(`Data exported as ${format.toUpperCase()}`, 'success');
  };

  const importData = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedData;
        if (file.name.endsWith('.csv')) {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          importedData = lines.slice(1).map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((header, index) => {
              const column = columns.find(c => c.label === header);
              if (column) {
                row[column.key] = values[index]?.trim();
              }
            });
            return row;
          });
        } else if (file.name.endsWith('.json')) {
          importedData = JSON.parse(e.target.result);
        }
        
        // Add to existing data
        setData([...data, ...importedData]);
        showNotification(`Imported ${importedData.length} rows`, 'success');
      } catch (error) {
        showNotification('Failed to import data', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Sorting and Filtering
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aString < bString ? -1 : aString > bString ? 1 : 0;
      } else {
        return aString > bString ? -1 : aString < bString ? 1 : 0;
      }
    });
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    let filtered = sortedData;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => {
          const rowValue = String(row[key]).toLowerCase();
          return rowValue.includes(value.toLowerCase());
        });
      }
    });
    
    return filtered;
  }, [sortedData, searchTerm, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Format currency
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    const absValue = Math.abs(value);
    if (absValue >= 10000) {
      return `₹${(value / 100).toFixed(2)} Cr`;
    } else if (absValue >= 100) {
      return `₹${value.toFixed(2)} L`;
    } else {
      return `₹${(value * 100).toFixed(2)} K`;
    }
  };

  // Render cell based on type
  const renderCell = (row, column) => {
    const value = row[column.key];
    const cellKey = `${row.id || row.serial_no}_${column.key}`;
    const isEditing = editingCell === cellKey;
    const hasError = validationErrors[cellKey];
    const hasChange = changes[row.id || row.serial_no]?.[column.key] !== undefined;
    
    if (isEditing) {
      return (
        <div className="relative">
          {column.type === 'select' ? (
            <select
              className={`w-full px-2 py-1 border rounded ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white'
              } ${hasError ? 'border-red-500' : 'border-blue-500'}`}
              defaultValue={value}
              onBlur={(e) => {
                handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              autoFocus
            >
              {column.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : column.type === 'textarea' ? (
            <textarea
              className={`w-full px-2 py-1 border rounded resize-none ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white'
              } ${hasError ? 'border-red-500' : 'border-blue-500'}`}
              defaultValue={value}
              rows={3}
              onBlur={(e) => {
                handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              autoFocus
            />
          ) : (
            <input
              type={column.type === 'date' ? 'date' : column.type === 'number' || column.type === 'currency' || column.type === 'percentage' ? 'number' : 'text'}
              className={`w-full px-2 py-1 border rounded ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white'
              } ${hasError ? 'border-red-500' : 'border-blue-500'}`}
              defaultValue={value}
              min={column.min}
              max={column.max}
              step={column.type === 'percentage' ? '0.01' : column.type === 'currency' ? '0.01' : '1'}
              onBlur={(e) => {
                handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellEdit(row.id || row.serial_no, column.key, e.target.value);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              autoFocus
            />
          )}
          {hasError && (
            <div className="absolute top-full left-0 mt-1 p-1 bg-red-500 text-white text-xs rounded z-10">
              {hasError}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div
        className={`cursor-pointer px-2 py-1 ${
          hasChange ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''
        } ${column.editable === false ? 'opacity-75' : ''}`}
        onClick={() => column.editable !== false && setEditingCell(cellKey)}
      >
        {column.type === 'currency' ? formatCurrency(value) :
         column.type === 'percentage' ? `${value || 0}%` :
         column.type === 'date' && value ? new Date(value).toLocaleDateString() :
         value || '-'}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="text-blue-500" />
                Engineering Data Editor
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{data.length} total rows</span>
                <span>•</span>
                <span>{filteredData.length} filtered</span>
                <span>•</span>
                <span>{selectedRows.length} selected</span>
                {Object.keys(changes).length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-orange-500 font-medium">
                      {Object.keys(changes).length} unsaved changes
                    </span>
                  </>
                )}
                {lastSaved && (
                  <>
                    <span>•</span>
                    <span className="text-green-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Save/Cancel */}
              {Object.keys(changes).length > 0 && (
                <>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setData(originalData);
                      setChanges({});
                      showNotification('Changes discarded', 'info');
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                  >
                    <X size={16} />
                    Discard
                  </button>
                </>
              )}
              
              {/* Auto-save toggle */}
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  autoSave ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {autoSave ? <CheckCircle size={16} /> : <Circle size={16} />}
                Auto-save
              </button>
              
              {/* History */}
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                } disabled:opacity-50`}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                } disabled:opacity-50`}
              >
                <ArrowRight size={16} />
              </button>
              
              {/* View toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {viewMode === 'table' ? <Grid size={16} /> : <List size={16} />}
              </button>
              
              {/* Dark mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              
              {/* Refresh */}
              <button
                onClick={fetchData}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      } px-4 py-3`}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                }`}
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Row
            </button>
            
            {selectedRows.length > 0 && (
              <>
                <button
                  onClick={duplicateRows}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <Copy size={16} />
                  Duplicate ({selectedRows.length})
                </button>
                
                <button
                  onClick={() => setBulkEditMode(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Bulk Edit
                </button>
                
                <button
                  onClick={() => {
                    if (confirm(`Delete ${selectedRows.length} row(s)?`)) {
                      deleteRows(selectedRows);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete ({selectedRows.length})
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showFilters ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            
            {/* Export dropdown */}
            <div className="relative group">
              <button className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>
              <div className={`absolute top-full mt-1 right-0 w-32 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
              opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10`}>
                <button
                  onClick={() => exportData('csv')}
                  className={`w-full px-3 py-2 text-left hover:${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } transition-colors`}
                >
                  CSV
                </button>
                <button
                  onClick={() => exportData('json')}
                  className={`w-full px-3 py-2 text-left hover:${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } transition-colors`}
                >
                  JSON
                </button>
              </div>
            </div>
            
            {/* Import */}
            <label className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    importData(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
        
        {/* Column filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {columns.slice(0, 12).map(column => (
                <div key={column.key}>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{column.label}</label>
                  <input
                    type="text"
                    placeholder={`Filter ${column.label}`}
                    value={filters[column.key] || ''}
                    onChange={(e) => setFilters({ ...filters, [column.key]: e.target.value })}
                    className={`w-full px-2 py-1 text-sm rounded ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                    }`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setFilters({})}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {bulkEditMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}>
            <h2 className="text-xl font-bold mb-4">Bulk Edit {selectedRows.length} Rows</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field to Edit</label>
                <select
                  value={bulkEditField}
                  onChange={(e) => setBulkEditField(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <option value="">Select field...</option>
                  {columns.filter(c => c.editable !== false).map(col => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
              </div>
              
              {bulkEditField && (
                <div>
                  <label className="block text-sm font-medium mb-1">New Value</label>
                  {columns.find(c => c.key === bulkEditField)?.type === 'select' ? (
                    <select
                      value={bulkEditValue}
                      onChange={(e) => setBulkEditValue(e.target.value)}
                      className={`w-full px-3 py-2 rounded ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <option value="">Select value...</option>
                      {columns.find(c => c.key === bulkEditField)?.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={columns.find(c => c.key === bulkEditField)?.type === 'number' ? 'number' : 'text'}
                      value={bulkEditValue}
                      onChange={(e) => setBulkEditValue(e.target.value)}
                      className={`w-full px-3 py-2 rounded ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleBulkEdit}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply Changes
              </button>
              <button
                onClick={() => {
                  setBulkEditMode(false);
                  setBulkEditField('');
                  setBulkEditValue('');
                }}
                className={`flex-1 px-4 py-2 rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {viewMode === 'table' ? (
          /* Table View */
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0 z-10`}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(paginatedData.map(r => r.id || r.serial_no));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    {columns.filter(col => columnVisibility[col.key]).map(column => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{column.label}</span>
                          {sortConfig.key === column.key && (
                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={row.id || row.serial_no}
                      className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                        ${row.isNew ? 'bg-green-50 dark:bg-green-900/20' : ''}
                        ${selectedRows.includes(row.id || row.serial_no) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id || row.serial_no)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, row.id || row.serial_no]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== (row.id || row.serial_no)));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      {columns.filter(col => columnVisibility[col.key]).map(column => (
                        <td key={column.key} className="px-4 py-2">
                          {renderCell(row, column)}
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => duplicateRows([row.id || row.serial_no])}
                            className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this row?')) {
                                deleteRows([row.id || row.serial_no]);
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}
              flex flex-col md:flex-row justify-between items-center gap-3`}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } disabled:opacity-50`}
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } disabled:opacity-50`}
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } disabled:opacity-50`}
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } disabled:opacity-50`}
                >
                  Last
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedData.map((row) => (
              <div
                key={row.id || row.serial_no}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm
                  ${row.isNew ? 'ring-2 ring-green-500' : ''}
                  ${selectedRows.includes(row.id || row.serial_no) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-sm truncate flex-1">{row.scheme_name}</h3>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id || row.serial_no)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows([...selectedRows, row.id || row.serial_no]);
                      } else {
                        setSelectedRows(selectedRows.filter(id => id !== (row.id || row.serial_no)));
                      }
                    }}
                    className="rounded ml-2"
                  />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Budget:</span>
                    <span className="font-medium">{formatCurrency(row.sanctioned_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Progress:</span>
                    <span className="font-medium">{row.physical_progress || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risk:</span>
                    <span className={`font-medium ${
                      row.risk_level === 'CRITICAL' ? 'text-red-500' :
                      row.risk_level === 'HIGH' ? 'text-orange-500' :
                      row.risk_level === 'MEDIUM' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {row.risk_level}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agency:</span>
                    <span className="font-medium truncate">{row.executive_agency || '-'}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRows([row.id || row.serial_no]);
                      setViewMode('table');
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => duplicateRows([row.id || row.serial_no])}
                    className="flex-1 px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this row?')) {
                        deleteRows([row.id || row.serial_no]);
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-orange-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> :
           notification.type === 'error' ? <XCircle size={20} /> :
           notification.type === 'warning' ? <AlertTriangle size={20} /> :
           <Info size={20} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Column Visibility Settings */}
      <div className={`fixed bottom-4 left-4 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-y-auto z-40
        ${Object.values(columnVisibility).some(v => !v) ? 'block' : 'hidden'}`}>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Eye size={16} />
          Hidden Columns
        </h3>
        <div className="space-y-2">
          {columns.filter(col => !columnVisibility[col.key]).map(col => (
            <button
              key={col.key}
              onClick={() => setColumnVisibility({ ...columnVisibility, [col.key]: true })}
              className={`w-full text-left px-2 py-1 rounded text-sm ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Show {col.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper component for circle icon
const Circle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

export default Edit;