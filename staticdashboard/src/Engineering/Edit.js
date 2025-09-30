import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, AlertCircle, Calendar, DollarSign, 
  MapPin, Building2, User, FileText, Hash,
  Loader, Check, ChevronDown, Info, RefreshCw,
  Trash2, Calculator, CalendarDays, Link2, Sparkles,
  Plus, Copy, AlertTriangle
} from 'lucide-react';

const API_URL = 'http://172.21.188.201:3456';

const Edit = ({ 
  isOpen, 
  onClose, 
  projectData, 
  darkMode,
  isNewProject = false,
  onSaveSuccess = () => {},
  onDeleteSuccess = () => {},
  onRefreshData = () => {}
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showPDCCalculator, setShowPDCCalculator] = useState(false);
  const [calculationMode, setCalculationMode] = useState('days-to-date');
  const [originalRowIndex, setOriginalRowIndex] = useState(null);
  const [generatingSerial, setGeneratingSerial] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const formRef = useRef(null);
  const BUFFER_DAYS = 10;

  // Field groups configuration
  const fieldGroups = [
    {
      title: 'Basic Information',
      icon: FileText,
      fields: [
        { key: 'serial_no', label: 'Serial No', type: 'text', width: 'col-span-1' },
        { key: 's_no', label: 'S.No (Alternative)', type: 'text', width: 'col-span-1' },
        { key: 'source_sheet', label: 'Source Sheet', type: 'text', width: 'col-span-1' },
        { key: 'budget_head', label: 'Budget Head', type: 'text', required: true, width: 'col-span-1' },
        { key: 'scheme_name', label: 'Scheme Code', type: 'text', width: 'col-span-1' },
        { key: 'scheme_name_1', label: 'Scheme Name', type: 'text', required: true, width: 'col-span-3' },
        { key: 'aa_es_reference', label: 'AA/ES Reference', type: 'text', width: 'col-span-2' },
        { key: 'location', label: 'Location', type: 'text', width: 'col-span-1' },
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
        { key: 'sd_amount_lakh', label: 'Sanctioned Amount (Lakhs)', type: 'number', required: true, min: 0.01, width: 'col-span-1', step: 'any' },
        { key: 'expenditure_previous_fy', label: 'Expenditure Previous FY', type: 'number', width: 'col-span-1', step: 'any' },
        { key: 'expenditure_current_fy', label: 'Current FY Expenditure', type: 'number', width: 'col-span-1', step: 'any' },
        { key: 'expenditure_total', label: 'Total Expenditure', type: 'number', width: 'col-span-1', readonly: true, step: 'any' },
        { key: 'expenditure_percent', label: 'Expenditure %', type: 'text', width: 'col-span-1', readonly: true },
      ]
    },
    {
      title: 'Timeline & Dates',
      icon: Calendar,
      fields: [
        { key: 'ts_date', label: 'TS Date', type: 'date', width: 'col-span-1' },
        { key: 'tender_date', label: 'Tender Date', type: 'date', width: 'col-span-1' },
        { key: 'acceptance_date', label: 'Acceptance Date', type: 'date', width: 'col-span-1' },
        { key: 'award_date', label: 'Award Date', type: 'date', width: 'col-span-1', important: true },
        { key: 'pdc_agreement', label: 'PDC Agreement', type: 'date', width: 'col-span-1', linkedField: 'time_allowed_days' },
        { key: 'pdc_agreement_1', label: 'PDC Agreement (Alt)', type: 'date', width: 'col-span-1' },
        { key: 'revised_pdc', label: 'Revised PDC', type: 'date', width: 'col-span-1' },
        { key: 'completion_date_actual', label: 'Actual Completion Date', type: 'date', width: 'col-span-1' },
        { key: 'time_allowed_days', label: 'Time Allowed (Days)', type: 'number', min: 0, width: 'col-span-1', linkedField: 'pdc_agreement' },
      ]
    },
    {
      title: 'Progress & Status',
      icon: Hash,
      fields: [
        { key: 'physical_progress', label: 'Physical Progress (%)', type: 'number', min: 0, max: 100, width: 'col-span-1', step: 'any' },
        { key: 'current_status', label: 'Current Status', type: 'number', min: 0, width: 'col-span-1', step: 'any' },
        { key: 'remarks', label: 'Remarks', type: 'textarea', width: 'col-span-3' },
      ]
    }
  ];

  // Helper function to safely parse values
  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeString = (value) => {
    if (value === null || value === undefined || value === 'N/A') return '';
    return String(value).trim();
  };

  // Parse date from various formats
  const parseDate = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === 'N/A') return '';
    
    try {
      // Handle various date formats
      const dateStr = String(dateValue).trim();
      
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.split('T')[0];
      }
      
      // DD.MM.YYYY format
      if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('.');
        const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // DD/MM/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Try parsing as Date object
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (err) {
      console.warn('Error parsing date:', dateValue, err);
    }
    
    return '';
  };

  // Generate unique serial number
  const generateUniqueSerialNo = async () => {
    setGeneratingSerial(true);
    try {
      const response = await fetch(`${API_URL}/api/csv/engineering.csv/rows`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      const existingSerials = new Set();
      
      if (result.rows) {
        result.rows.forEach(row => {
          if (row.serial_no) existingSerials.add(String(row.serial_no).trim());
          if (row.s_no) existingSerials.add(String(row.s_no).trim());
        });
      }
      
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 9000) + 1000;
      
      const patterns = [
        `PRJ-${year}${month}-${random}`,
        `ENG-${year}-${String(timestamp).slice(-6)}`,
        `P${year}${month}${String(random).padStart(4, '0')}`,
        `SN-${timestamp % 1000000}`,
        `PRJ${Date.now().toString(36).toUpperCase()}`,
      ];
      
      for (const pattern of patterns) {
        if (!existingSerials.has(pattern)) {
          setFormData(prev => ({ 
            ...prev, 
            serial_no: pattern,
            s_no: prev.s_no || pattern 
          }));
          setIsDirty(true);
          return pattern;
        }
      }
      
      const fallbackSerial = `AUTO-${timestamp}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setFormData(prev => ({ 
        ...prev, 
        serial_no: fallbackSerial,
        s_no: prev.s_no || fallbackSerial 
      }));
      setIsDirty(true);
      return fallbackSerial;
      
    } catch (error) {
      console.error('Error generating serial number:', error);
      const offlineSerial = `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setFormData(prev => ({ 
        ...prev, 
        serial_no: offlineSerial,
        s_no: prev.s_no || offlineSerial 
      }));
      setIsDirty(true);
      return offlineSerial;
    } finally {
      setGeneratingSerial(false);
    }
  };

  // Calculate PDC date from award date and time allowed
  const calculatePDCFromDays = (awardDate, timeAllowedDays) => {
    if (!awardDate || !timeAllowedDays || timeAllowedDays <= 0) return '';
    
    try {
      const award = new Date(awardDate);
      if (isNaN(award.getTime())) return '';
      
      const pdc = new Date(award);
      pdc.setDate(pdc.getDate() + parseInt(timeAllowedDays) + BUFFER_DAYS);
      
      return pdc.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Calculate time allowed days from award date and PDC
  const calculateDaysFromPDC = (awardDate, pdcDate) => {
    if (!awardDate || !pdcDate) return 0;
    
    try {
      const award = new Date(awardDate);
      const pdc = new Date(pdcDate);
      
      if (isNaN(award.getTime()) || isNaN(pdc.getTime())) return 0;
      
      const diffTime = pdc - award;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const actualTimeAllowed = Math.max(0, diffDays - BUFFER_DAYS);
      
      return actualTimeAllowed;
    } catch {
      return 0;
    }
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (isNewProject) {
        const defaults = {
          serial_no: '',
          s_no: '',
          source_sheet: 'New Entry',
          scheme_name: '',
          scheme_name_1: '',
          budget_head: '',
          ftr_hq: '',
          shq: '',
          work_site: '',
          executive_agency: '',
          firm_name: '',
          aa_es_reference: '',
          location: '',
          sd_amount_lakh: '',
          expenditure_previous_fy: 0,
          expenditure_current_fy: 0,
          expenditure_total: 0,
          expenditure_percent: '0',
          physical_progress: 0,
          current_status: 0,
          time_allowed_days: 0,
          remarks: '',
          ts_date: '',
          tender_date: '',
          acceptance_date: '',
          award_date: '',
          pdc_agreement: '',
          pdc_agreement_1: '',
          revised_pdc: '',
          completion_date_actual: ''
        };
        setFormData(defaults);
        setOriginalRowIndex(null);
        generateUniqueSerialNo();
      } else if (projectData) {
        // Extract row index
        let rowIdx = null;
        
        if (projectData.rowIndex !== undefined && projectData.rowIndex !== null) {
          rowIdx = parseInt(projectData.rowIndex);
        } else if (projectData.index !== undefined && projectData.index !== null) {
          rowIdx = parseInt(projectData.index);
        } else if (projectData.id !== undefined && projectData.id !== null) {
          rowIdx = parseInt(projectData.id) - 1;
        } else if (projectData._rowIndex !== undefined && projectData._rowIndex !== null) {
          rowIdx = parseInt(projectData._rowIndex);
        }
        
        setOriginalRowIndex(rowIdx);
        
        console.log('Loading project data:', projectData);
        
        // Map data from projectData with proper fallbacks and conversions
        const data = {
          serial_no: safeString(projectData.serial_no),
          s_no: safeString(projectData.s_no || projectData.serial_no),
          source_sheet: safeString(projectData.source_sheet),
          budget_head: safeString(projectData.budget_head),
          scheme_name: safeString(projectData.scheme_name),
          scheme_name_1: safeString(projectData.scheme_name_1 || projectData.scheme_name),
          aa_es_reference: safeString(projectData.aa_es_reference || projectData.aa_es_ref),
          location: safeString(projectData.location),
          ftr_hq: safeString(projectData.ftr_hq),
          shq: safeString(projectData.shq),
          work_site: safeString(projectData.work_site),
          executive_agency: safeString(projectData.executive_agency),
          firm_name: safeString(projectData.firm_name),
          sd_amount_lakh: safeParseFloat(projectData.sd_amount_lakh || projectData.sanctioned_amount),
          expenditure_previous_fy: safeParseFloat(projectData.expenditure_previous_fy || projectData.expdr_upto_31mar25),
          expenditure_current_fy: safeParseFloat(projectData.expenditure_current_fy || projectData.expdr_cfy),
          expenditure_total: safeParseFloat(projectData.expenditure_total || projectData.total_expdr),
          expenditure_percent: safeString(projectData.expenditure_percent || projectData.percent_expdr || '0').replace('%', ''),
          physical_progress: safeParseFloat(projectData.physical_progress),
          current_status: safeParseFloat(projectData.current_status || projectData.progress_status),
          time_allowed_days: safeParseFloat(projectData.time_allowed_days),
          remarks: safeString(projectData.remarks)
        };
        
        // Process date fields
        data.ts_date = parseDate(projectData.ts_date || projectData.date_ts);
        data.tender_date = parseDate(projectData.tender_date || projectData.date_tender);
        data.acceptance_date = parseDate(projectData.acceptance_date || projectData.date_acceptance);
        data.award_date = parseDate(projectData.award_date || projectData.date_award);
        data.pdc_agreement = parseDate(projectData.pdc_agreement);
        data.pdc_agreement_1 = parseDate(projectData.pdc_agreement_1);
        data.revised_pdc = parseDate(projectData.revised_pdc);
        data.completion_date_actual = parseDate(projectData.completion_date_actual || projectData.actual_completion_date);
        
        // Recalculate totals if needed
        if (!data.expenditure_total || data.expenditure_total === 0) {
          data.expenditure_total = Math.abs(data.expenditure_previous_fy) + Math.abs(data.expenditure_current_fy);
        }
        
        // Handle negative values by using absolute values
        data.expenditure_previous_fy = Math.abs(data.expenditure_previous_fy);
        data.expenditure_current_fy = Math.abs(data.expenditure_current_fy);
        data.expenditure_total = Math.abs(data.expenditure_total);
        
        if (data.sd_amount_lakh > 0) {
          const percent = ((data.expenditure_total / data.sd_amount_lakh) * 100).toFixed(2);
          data.expenditure_percent = percent;
        }
        
        console.log('Processed form data:', data);
        setFormData(data);
      }
      setError('');
      setSuccess('');
      setValidationErrors({});
      setIsDirty(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, projectData, isNewProject]);

  // Handle input changes
  const handleChange = (key, value) => {
    const field = fieldGroups.flatMap(g => g.fields).find(f => f.key === key);
    let processedValue = value;
    
    if (field && field.type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value) || 0;
    }
    
    setFormData(prev => {
      const newData = { ...prev, [key]: processedValue };
      
      // Auto-calculate linked fields
      if (key === 'award_date') {
        if (newData.time_allowed_days > 0) {
          const calculatedPDC = calculatePDCFromDays(processedValue, newData.time_allowed_days);
          if (calculatedPDC) {
            newData.pdc_agreement = calculatedPDC;
          }
        }
      } else if (key === 'time_allowed_days') {
        if (newData.award_date && processedValue > 0) {
          const calculatedPDC = calculatePDCFromDays(newData.award_date, processedValue);
          if (calculatedPDC) {
            newData.pdc_agreement = calculatedPDC;
          }
        }
      } else if (key === 'pdc_agreement') {
        if (newData.award_date && processedValue) {
          const calculatedDays = calculateDaysFromPDC(newData.award_date, processedValue);
          newData.time_allowed_days = calculatedDays;
        }
      }
      
      return newData;
    });
    
    setIsDirty(true);
    
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
        
        if (field.required) {
          if (field.type === 'text' && (!value || value === '')) {
            errors[field.key] = `${field.label} is required`;
          } else if (field.type === 'number' && field.key === 'sd_amount_lakh') {
            // Sanctioned amount must be greater than 0
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) {
              errors[field.key] = `${field.label} must be greater than 0`;
            }
          }
        }
        
        if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
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
    
    if (formData.award_date && formData.pdc_agreement) {
      const awardDate = new Date(formData.award_date);
      const pdcDate = new Date(formData.pdc_agreement);
      
      if (pdcDate < awardDate) {
        errors.pdc_agreement = 'PDC date cannot be before Award date';
      }
    }
    
    if (formData.revised_pdc && formData.pdc_agreement) {
      const pdcDate = new Date(formData.pdc_agreement);
      const revisedPDC = new Date(formData.revised_pdc);
      
      if (revisedPDC < pdcDate) {
        errors.revised_pdc = 'Revised PDC should be after original PDC';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save data
  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors');
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
      const submitData = {};
      
      // Prepare all fields for submission
      fieldGroups.forEach(group => {
        group.fields.forEach(field => {
          const value = formData[field.key];
          if (field.type === 'number') {
            submitData[field.key] = value === '' ? 0 : (value || 0);
          } else {
            submitData[field.key] = value || '';
          }
        });
      });

      // Ensure required numeric fields have valid values
      submitData.sd_amount_lakh = parseFloat(submitData.sd_amount_lakh) || 0.01;
      submitData.expenditure_previous_fy = Math.abs(parseFloat(submitData.expenditure_previous_fy) || 0);
      submitData.expenditure_current_fy = Math.abs(parseFloat(submitData.expenditure_current_fy) || 0);
      submitData.expenditure_total = submitData.expenditure_previous_fy + submitData.expenditure_current_fy;

      console.log('Submitting data:', submitData);

      if (isNewProject) {
        // Add new row - FIXED: Added /api prefix
        const response = await fetch(`${API_URL}/api/csv/engineering.csv/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        
        setSuccess('Project added successfully!');
        setIsDirty(false);
        
        if (onSaveSuccess) {
          await onSaveSuccess({ ...submitData, index: result.index });
        }
        
        if (onRefreshData) {
          await onRefreshData();
        }
        
        setTimeout(() => onClose(), 1500);
      } else {
        // Update existing row - FIXED: Added /api prefix
        if (originalRowIndex === null || originalRowIndex === undefined) {
          throw new Error('Cannot update: Row index is missing');
        }

        const response = await fetch(`${API_URL}/api/csv/engineering.csv/rows/${originalRowIndex}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        
        setSuccess('Project updated successfully!');
        setIsDirty(false);
        
        if (onSaveSuccess) {
          await onSaveSuccess({ ...submitData, index: originalRowIndex });
        }
        
        if (onRefreshData) {
          await onRefreshData();
        }
        
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save project data');
    } finally {
      setLoading(false);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (isNewProject || originalRowIndex === null) return;
    
    setLoading(true);
    setError('');

    try {
      // FIXED: Added /api prefix
      const response = await fetch(`${API_URL}/api/csv/engineering.csv/rows/${originalRowIndex}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const result = await response.json();
      
      setSuccess('Project deleted successfully!');
      setShowDeleteConfirm(false);
      
      if (onDeleteSuccess) {
        onDeleteSuccess(projectData);
      }
      
      if (onRefreshData) {
        await onRefreshData();
      }
      
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate total expenditure and percentage
  useEffect(() => {
    const prevFy = Math.abs(parseFloat(formData.expenditure_previous_fy) || 0);
    const currFy = Math.abs(parseFloat(formData.expenditure_current_fy) || 0);
    const total = prevFy + currFy;
    
    if (formData.expenditure_total !== total) {
      setFormData(prev => ({ ...prev, expenditure_total: total }));
    }
    
    const sanctioned = parseFloat(formData.sd_amount_lakh) || 0;
    if (sanctioned > 0) {
      const percentage = ((total / sanctioned) * 100).toFixed(2);
      if (formData.expenditure_percent !== percentage) {
        setFormData(prev => ({ ...prev, expenditure_percent: percentage }));
      }
    } else if (formData.expenditure_percent !== '0') {
      setFormData(prev => ({ ...prev, expenditure_percent: '0' }));
    }
  }, [formData.expenditure_previous_fy, formData.expenditure_current_fy, formData.sd_amount_lakh]);

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Duplicate project
  const handleDuplicate = () => {
    const duplicatedData = { 
      ...formData, 
      serial_no: '',
      s_no: '',
      source_sheet: 'Duplicated Entry'
    };
    setFormData(duplicatedData);
    setOriginalRowIndex(null);
    generateUniqueSerialNo();
    setSuccess('Project duplicated. Update the details and save as new.');
  };

  // PDC Calculator Component
  const PDCCalculator = () => (
    <div className={`fixed bottom-20 right-4 z-50 w-80 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-xl shadow-2xl p-4 border ${
      darkMode ? 'border-gray-700' : 'border-blue-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Calculator size={14} className="text-blue-500" />
          PDC Calculator
        </h3>
        <button
          onClick={() => setShowPDCCalculator(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setCalculationMode('days-to-date')}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              calculationMode === 'days-to-date'
                ? 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Days → Date
          </button>
          <button
            onClick={() => setCalculationMode('date-to-days')}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              calculationMode === 'date-to-days'
                ? 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Date → Days
          </button>
        </div>
        
        {calculationMode === 'days-to-date' ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Enter Time Allowed to calculate PDC date
            </p>
            {formData.award_date ? (
              <div className="text-xs">
                <span className="text-gray-500">Award Date: </span>
                <span className="font-medium">{formData.award_date}</span>
              </div>
            ) : (
              <p className="text-xs text-orange-500">Set Award Date first</p>
            )}
            {formData.time_allowed_days > 0 && formData.award_date && (
              <>
                <div className="text-xs">
                  <span className="text-gray-500">Time Allowed: </span>
                  <span className="font-medium">{formData.time_allowed_days} days</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Buffer Days: </span>
                  <span className="font-medium">+10 days</span>
                </div>
                <div className="text-xs border-t pt-1">
                  <span className="text-gray-500">Calculated PDC: </span>
                  <span className="font-medium text-blue-600">
                    {calculatePDCFromDays(formData.award_date, formData.time_allowed_days)}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Enter PDC date to calculate Time Allowed
            </p>
            {formData.award_date ? (
              <div className="text-xs">
                <span className="text-gray-500">Award Date: </span>
                <span className="font-medium">{formData.award_date}</span>
              </div>
            ) : (
              <p className="text-xs text-orange-500">Set Award Date first</p>
            )}
            {formData.pdc_agreement && formData.award_date && (
              <>
                <div className="text-xs">
                  <span className="text-gray-500">PDC Date: </span>
                  <span className="font-medium">{formData.pdc_agreement}</span>
                </div>
                <div className="text-xs border-t pt-1">
                  <span className="text-gray-500">Calculated Time Allowed: </span>
                  <span className="font-medium text-blue-600">
                    {calculateDaysFromPDC(formData.award_date, formData.pdc_agreement)} days
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
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
              {!isNewProject && formData.scheme_name_1 && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>
                  {formData.scheme_name_1} | Serial No: {formData.serial_no || formData.s_no || 'N/A'}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isNewProject && (
                <button
                  onClick={generateUniqueSerialNo}
                  disabled={generatingSerial}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    generatingSerial 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white transition-colors flex items-center gap-2`}
                >
                  {generatingSerial ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Generate Serial
                </button>
              )}
              
              {!isNewProject && (
                <button
                  onClick={handleDuplicate}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
              )}
              
              <button
                onClick={() => setShowPDCCalculator(!showPDCCalculator)}
                className={`p-2 rounded-lg ${
                  showPDCCalculator 
                    ? 'bg-blue-700 text-white' 
                    : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-blue-700 text-white'
                } transition-colors`}
              >
                <Calculator size={20} />
              </button>
              
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'
                } transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-white'} />
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
                      <div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.readonly && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Auto
                          </span>
                        )}
                        {field.linkedField && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center gap-1 inline-flex">
                            <Link2 size={8} />
                            Linked
                          </span>
                        )}
                      </div>
                      
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
                              : field.linkedField
                                ? darkMode
                                  ? 'bg-gray-700 border-blue-600 text-gray-100 focus:ring-blue-400'
                                  : 'bg-blue-50 border-blue-300 focus:ring-blue-400'
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
              <>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Project
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400">Confirm deletion?</span>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex gap-2">
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
      
      {/* PDC Calculator Panel */}
      {showPDCCalculator && <PDCCalculator />}
    </div>
  );
};

export default Edit;