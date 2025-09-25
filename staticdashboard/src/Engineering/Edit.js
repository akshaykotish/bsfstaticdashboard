import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, AlertCircle, Calendar, DollarSign, 
  MapPin, Building2, User, FileText, Hash,
  Loader, Check, ChevronDown, Info, RefreshCw,
  Trash2
} from 'lucide-react';

const API_URL = 'http://localhost:3456';

const Edit = ({ 
  isOpen, 
  onClose, 
  projectData, 
  darkMode,
  isNewProject = false,
  onSaveSuccess = () => {},
  onDeleteSuccess = () => {},
  onRefreshData = () => {} // Prop for refreshing data
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  
  const formRef = useRef(null);

  // All fields from CSV - organized into groups
  const fieldGroups = [
    {
      title: 'Basic Information',
      icon: FileText,
      fields: [
        { key: 'serial_no', label: 'Serial No', type: 'text', required: true, width: 'col-span-1' },
        { key: 'source_sheet', label: 'Source Sheet', type: 'text', width: 'col-span-1' },
        { key: 'budget_head', label: 'Budget Head', type: 'text', required: true, width: 'col-span-1' },
        { key: 'scheme_name', label: 'Scheme Name', type: 'text', required: true, width: 'col-span-3' },
        { key: 'aa_es_ref', label: 'AA/ES Reference', type: 'text', width: 'col-span-2' },
        { key: 'aa_es_pending_with', label: 'AA/ES Pending With', type: 'text', width: 'col-span-1' },
      ]
    },
    {
      title: 'Location & Organizations',
      icon: MapPin,
      fields: [
        { key: 'ftr_hq', label: 'Frontier HQ', type: 'text', required: true, width: 'col-span-1' },
        { key: 'shq', label: 'Sector HQ', type: 'text', required: true, width: 'col-span-1' },
        { key: 'work_site', label: 'Work Site', type: 'text', required: true, width: 'col-span-1' },
        { key: 'executive_agency', label: 'Executive Agency', type: 'text', required: true, width: 'col-span-2' },
        { key: 'firm_name', label: 'Contractor/Firm Name', type: 'text', width: 'col-span-1' },
      ]
    },
    {
      title: 'Financial Details',
      icon: DollarSign,
      fields: [
        { key: 'sanctioned_amount', label: 'Sanctioned Amount (Lakhs)', type: 'number', required: true, min: 0, width: 'col-span-1', step: 'any' },
        { key: 'expdr_upto_31mar25', label: 'Expenditure upto 31 Mar 25', type: 'number', min: 0, width: 'col-span-1', step: 'any' },
        { key: 'expdr_cfy', label: 'Current FY Expenditure', type: 'number', min: 0, width: 'col-span-1', step: 'any' },
        { key: 'total_expdr', label: 'Total Expenditure', type: 'number', min: 0, width: 'col-span-1', readonly: true, step: 'any' },
        { key: 'percent_expdr', label: 'Expenditure %', type: 'number', min: 0, max: 200, width: 'col-span-1', readonly: true, step: 'any' },
        { key: 'remaining_amount', label: 'Remaining Amount', type: 'number', width: 'col-span-1', readonly: true, step: 'any' },
      ]
    },
    {
      title: 'Timeline & Dates',
      icon: Calendar,
      fields: [
        { key: 'date_ts', label: 'Date TS', type: 'date', width: 'col-span-1' },
        { key: 'date_tender', label: 'Tender Date', type: 'date', width: 'col-span-1' },
        { key: 'date_acceptance', label: 'Acceptance Date', type: 'date', width: 'col-span-1' },
        { key: 'date_award', label: 'Award Date', type: 'date', width: 'col-span-1' },
        { key: 'pdc_agreement', label: 'PDC Agreement', type: 'date', width: 'col-span-1' },
        { key: 'revised_pdc', label: 'Revised PDC', type: 'date', width: 'col-span-1' },
        { key: 'actual_completion_date', label: 'Actual Completion Date', type: 'date', width: 'col-span-1' },
        { key: 'time_allowed_days', label: 'Time Allowed (Days)', type: 'number', min: 0, width: 'col-span-1' },
      ]
    },
    {
      title: 'Progress & Status',
      icon: Hash,
      fields: [
        { key: 'physical_progress', label: 'Physical Progress (%)', type: 'number', min: 0, max: 100, width: 'col-span-1', step: 'any' },
        { key: 'progress_status', label: 'Progress Status', type: 'number', min: 0, width: 'col-span-1', step: 'any' },
        { key: 'remarks', label: 'Remarks', type: 'textarea', width: 'col-span-3' },
      ]
    }
  ];

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (isNewProject) {
        // Set default values for new project
        const defaults = {
          serial_no: '',
          source_sheet: '',
          scheme_name: '',
          budget_head: '',
          ftr_hq: '',
          shq: '',
          work_site: '',
          executive_agency: '',
          firm_name: '',
          aa_es_ref: '',
          aa_es_pending_with: '',
          sanctioned_amount: 0,
          expdr_upto_31mar25: 0,
          expdr_cfy: 0,
          total_expdr: 0,
          percent_expdr: 0,
          remaining_amount: 0,
          physical_progress: 0,
          progress_status: 0,
          time_allowed_days: 0,
          remarks: ''
        };
        setFormData(defaults);
      } else if (projectData) {
        // Load existing project data - preserve all fields
        const data = { ...projectData };
        
        // Ensure numeric fields are numbers
        const numericFields = ['sanctioned_amount', 'expdr_upto_31mar25', 'expdr_cfy', 
                               'total_expdr', 'percent_expdr', 'remaining_amount',
                               'physical_progress', 'progress_status', 'time_allowed_days'];
        
        numericFields.forEach(field => {
          if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
            data[field] = parseFloat(data[field]) || 0;
          } else {
            data[field] = 0;
          }
        });
        
        // Format dates for input fields
        const dateFields = ['date_ts', 'date_tender', 'date_acceptance', 'date_award', 
                           'pdc_agreement', 'revised_pdc', 'actual_completion_date'];
        
        dateFields.forEach(field => {
          if (data[field] && data[field] !== 'N/A' && data[field] !== '') {
            try {
              const date = new Date(data[field]);
              if (!isNaN(date.getTime())) {
                data[field] = date.toISOString().split('T')[0];
              } else {
                data[field] = '';
              }
            } catch {
              data[field] = '';
            }
          } else {
            data[field] = '';
          }
        });
        
        setFormData(data);
      }
      setError('');
      setSuccess('');
      setValidationErrors({});
      setIsDirty(false);
    }
  }, [isOpen, projectData, isNewProject]);

  // Handle input changes
  const handleChange = (key, value) => {
    // For number fields, ensure we're storing numbers
    const field = fieldGroups.flatMap(g => g.fields).find(f => f.key === key);
    let processedValue = value;
    
    if (field && field.type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [key]: processedValue
    }));
    setIsDirty(true);
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    fieldGroups.forEach(group => {
      group.fields.forEach(field => {
        const value = formData[field.key];
        
        // Required field validation
        if (field.required && (!value || value === '' || (field.type === 'number' && value === 0))) {
          if (field.key === 'sanctioned_amount' && value === 0) {
            errors[field.key] = `${field.label} must be greater than 0`;
          } else if (!value || value === '') {
            errors[field.key] = `${field.label} is required`;
          }
        }
        
        // Number validation
        if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            errors[field.key] = `${field.label} must be a number`;
          } else {
            if (field.min !== undefined && numValue < field.min) {
              errors[field.key] = `${field.label} must be at least ${field.min}`;
            }
            if (field.max !== undefined && numValue > field.max) {
              errors[field.key] = `${field.label} must not exceed ${field.max}`;
            }
          }
        }
      });
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save data - Updated to trigger data refresh instead of page reload
  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors');
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission - preserve all original fields
      const submitData = { ...formData };
      
      // Ensure numeric fields are numbers
      const numericFields = ['sanctioned_amount', 'expdr_upto_31mar25', 'expdr_cfy', 
                             'total_expdr', 'percent_expdr', 'remaining_amount',
                             'physical_progress', 'progress_status', 'time_allowed_days'];
      
      numericFields.forEach(field => {
        if (submitData[field] !== undefined) {
          submitData[field] = parseFloat(submitData[field]) || 0;
        }
      });
      
      // Convert empty date strings to null
      const dateFields = ['date_ts', 'date_tender', 'date_acceptance', 'date_award', 
                         'pdc_agreement', 'revised_pdc', 'actual_completion_date'];
      
      dateFields.forEach(field => {
        if (submitData[field] === '') {
          submitData[field] = null;
        }
      });

      // Determine the row index - use serial_no or id field
      let rowIndex;
      if (!isNewProject) {
        // Try different approaches to get the row index
        if (projectData.rowIndex !== undefined) {
          rowIndex = projectData.rowIndex;
        } else if (projectData.id !== undefined) {
          rowIndex = projectData.id - 1;
        } else if (projectData.serial_no !== undefined) {
          // If using serial_no, it might already be the row index
          rowIndex = parseInt(projectData.serial_no) - 1;
        } else {
          throw new Error('Cannot determine row index for update');
        }
      }

      const endpoint = isNewProject 
        ? `${API_URL}/csv/engineering.csv/add`
        : `${API_URL}/csv/engineering.csv/update`;

      const body = isNewProject
        ? { row: submitData }
        : { 
            rowIndex: rowIndex,
            updates: submitData 
          };

      console.log('Saving project:', { endpoint, body, isNewProject });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(isNewProject ? 'Project added successfully!' : 'Project updated successfully!');
        setIsDirty(false);
        
        // Notify parent component of successful save FIRST
        if (onSaveSuccess && typeof onSaveSuccess === 'function') {
          await onSaveSuccess(submitData);
        }
        
        // Then call the refresh function to update data without page reload
        if (onRefreshData && typeof onRefreshData === 'function') {
          await onRefreshData();
        }
        
        // Close modal after brief delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to save data');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save project data');
    } finally {
      setLoading(false);
    }
  };

  // Delete project - Updated to trigger data refresh instead of page reload
  const handleDelete = async () => {
    if (isNewProject || !projectData) return;
    
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/csv/engineering.csv/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rowIndex: projectData.id - 1 }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Project deleted successfully!');
        
        // Call the refresh function to update data without page reload
        if (onRefreshData && typeof onRefreshData === 'function') {
          await onRefreshData();
        }
        
        // Notify parent component of successful deletion
        onDeleteSuccess(projectData);
        
        // Close modal after brief delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate total expenditure and remaining amount
  useEffect(() => {
    const expdr31mar = parseFloat(formData.expdr_upto_31mar25) || 0;
    const expdrCfy = parseFloat(formData.expdr_cfy) || 0;
    const total = expdr31mar + expdrCfy;
    
    if (formData.total_expdr !== total) {
      setFormData(prev => ({ ...prev, total_expdr: total }));
    }
    
    // Calculate percentage
    const sanctioned = parseFloat(formData.sanctioned_amount) || 0;
    if (sanctioned > 0) {
      const percentage = (total / sanctioned) * 100;
      if (formData.percent_expdr !== percentage) {
        setFormData(prev => ({ ...prev, percent_expdr: parseFloat(percentage.toFixed(2)) }));
      }
    } else {
      if (formData.percent_expdr !== 0) {
        setFormData(prev => ({ ...prev, percent_expdr: 0 }));
      }
    }
    
    // Calculate remaining amount
    const remaining = sanctioned - total;
    if (formData.remaining_amount !== remaining) {
      setFormData(prev => ({ ...prev, remaining_amount: remaining }));
    }
  }, [formData.expdr_upto_31mar25, formData.expdr_cfy, formData.sanctioned_amount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              onClose();
            }
          } else {
            onClose();
          }
        }}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-6xl max-h-[90vh] ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      } rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-white'}`}>
                {isNewProject ? 'Add New Project' : 'Edit Project'}
              </h2>
              {!isNewProject && formData.scheme_name && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                  {formData.scheme_name} | Serial No: {formData.serial_no}
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                if (isDirty) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
              } transition-colors`}
            >
              <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
            </button>
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
        <div ref={formRef} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {fieldGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={`p-5 rounded-xl border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <group.icon size={16} />
                  {group.title}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {group.fields.map((field) => (
                    <div 
                      key={field.key} 
                      id={`field-${field.key}`}
                      className={field.width || 'col-span-1'}
                    >
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.readonly && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Auto
                          </span>
                        )}
                      </label>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          rows={3}
                          disabled={field.readonly}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            field.readonly
                              ? darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                              : validationErrors[field.key]
                                ? 'border-red-500 focus:ring-red-400'
                                : darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400' 
                                  : 'bg-white border-gray-200 focus:ring-blue-400'
                          } focus:ring-2 focus:outline-none transition-colors`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] ?? ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          min={field.min}
                          max={field.max}
                          step={field.step || (field.type === 'number' ? 'any' : undefined)}
                          disabled={field.readonly}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            field.readonly
                              ? darkMode
                                ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                              : validationErrors[field.key]
                                ? 'border-red-500 focus:ring-red-400'
                                : darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400' 
                                  : 'bg-white border-gray-200 focus:ring-blue-400'
                          } focus:ring-2 focus:outline-none transition-colors`}
                        />
                      )}
                      
                      {validationErrors[field.key] && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        } flex justify-between items-center`}>
          <div className="flex gap-2">
            {!isNewProject && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete Project
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
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
              disabled={loading}
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
                  {isNewProject ? 'Add Project' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Edit;