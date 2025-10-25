// config.js - Database Configuration Module
// This module defines all database schemas and their configurations

/**
 * Database configurations for the application
 * Each database has its own schema, display properties, and calculation methods
 */
const databaseConfigs = {
  engineering: {
    displayName: 'Engineering Database',
    fileName: 'engineering.csv',
    idField: 's_no',
    idPrefix: 'ENG',
    idFormat: 'ENG-{timestamp}-{sequence}',
    description: 'Engineering projects and infrastructure data',
    icon: 'Building2',
    color: 'blue',
    columns: [
      // Basic Information
      { name: 's_no', type: 'id', required: true, label: 'Serial Number (ID)', group: 'basic' },
      { name: 'budget_head', type: 'text', required: true, label: 'Budget Head', group: 'basic' },
      { name: 'name_of_scheme', type: 'text', required: true, label: 'Name of Scheme', group: 'basic' },
      { name: 'sub_scheme_name', type: 'text', required: false, label: 'Sub Scheme Name', group: 'basic' },
      { name: 'aa_es_reference', type: 'text', required: false, label: 'AA/ES Reference', group: 'basic' },
      
      // Location & Organization
      { name: 'ftr_hq_name', type: 'text', required: true, label: 'Frontier HQ Name', group: 'location' },
      { name: 'shq_name', type: 'text', required: true, label: 'SHQ Name', group: 'location' },
      { name: 'location', type: 'text', required: false, label: 'Location', group: 'location' },
      { name: 'work_description', type: 'textarea', required: false, label: 'Work Description', group: 'location' },
      { name: 'executive_agency', type: 'text', required: true, label: 'Executive Agency', group: 'location' },
      { name: 'firm_name', type: 'text', required: false, label: 'Firm Name', group: 'location' },
      
      // Financial Details
      { name: 'sd_amount_lakh', type: 'number', required: false, label: 'Sanctioned Amount (Lakhs)', group: 'financial' },
      { name: 'expenditure_previous_fy', type: 'number', required: false, label: 'Expenditure Previous FY', defaultValue: '0', group: 'financial' },
      { name: 'expenditure_current_fy', type: 'number', required: false, label: 'Expenditure Current FY', defaultValue: '0', group: 'financial' },
      { name: 'expenditure_total', type: 'number', required: false, label: 'Expenditure Total', calculated: true, group: 'financial' },
      { name: 'expenditure_percent', type: 'number', required: false, label: 'Expenditure Percent', calculated: true, group: 'financial' },
      
      // Timeline & Dates
      { name: 'ts_date', type: 'date', required: false, label: 'TS Date', group: 'timeline' },
      { name: 'tender_date', type: 'date', required: false, label: 'Tender Date', group: 'timeline' },
      { name: 'acceptance_date', type: 'date', required: false, label: 'Acceptance Date', group: 'timeline' },
      { name: 'award_date', type: 'date', required: false, label: 'Award Date', group: 'timeline' },
      { name: 'pdc_agreement', type: 'date', required: false, label: 'PDC Agreement', group: 'timeline' },
      { name: 'pdc_revised', type: 'date', required: false, label: 'PDC Revised', group: 'timeline' },
      { name: 'completion_date_actual', type: 'date', required: false, label: 'Completion Date Actual', group: 'timeline' },
      { name: 'time_allowed_days', type: 'number', required: false, label: 'Time Allowed (Days)', group: 'timeline' },
      
      // Progress & Status
      { name: 'physical_progress_percent', type: 'number', required: false, label: 'Physical Progress Percent', defaultValue: '0', group: 'progress' },
      { name: 'current_status', type: 'text', required: false, label: 'Current Status', defaultValue: 'In Progress', group: 'progress' },
      { name: 'remarks', type: 'textarea', required: false, label: 'Remarks', group: 'progress' }
    ],
    columnGroups: {
      basic: { title: 'Basic Information', icon: 'FileText', order: 1 },
      location: { title: 'Location & Organization', icon: 'MapPin', order: 2 },
      financial: { title: 'Financial Details', icon: 'DollarSign', order: 3 },
      timeline: { title: 'Timeline & Dates', icon: 'Calendar', order: 4 },
      progress: { title: 'Progress & Status', icon: 'Hash', order: 5 }
    },
    calculations: {
      expenditure_total: (row) => {
        const prev = parseFloat(row.expenditure_previous_fy) || 0;
        const curr = parseFloat(row.expenditure_current_fy) || 0;
        return (prev + curr).toString();
      },
      expenditure_percent: (row) => {
        const total = parseFloat(row.expenditure_total) || 0;
        const sanctioned = parseFloat(row.sd_amount_lakh) || 0;
        return sanctioned > 0 ? ((total / sanctioned) * 100).toFixed(2) : '0';
      }
    },
    comparisonColumns: ['name_of_scheme', 'ftr_hq_name', 'shq_name', 'location', 'work_description', 'executive_agency', 'firm_name', 'sd_amount_lakh']
  },
  
  operations: {
    displayName: 'Operations Database',
    fileName: 'operations.csv',
    idField: 'S_No',
    idPrefix: 'OPS',
    idFormat: 'OPS-{timestamp}-{sequence}',
    description: 'Operations management and tracking',
    icon: 'Activity',
    color: 'green',
    columns: [
      // Basic Information
      { name: 'S_No', type: 'id', required: true, label: 'Serial Number (ID)', group: 'basic' },
      { name: 'WORK_TYPE', type: 'text', required: false, label: 'Work Type', group: 'basic' },
      { name: 'SOURCE_SHEET', type: 'text', required: false, label: 'Source Sheet', defaultValue: 'Manual Entry', group: 'basic' },
      { name: 'NAME_OF_WORK', type: 'text', required: true, label: 'Name of Work', group: 'basic' },
      
      // Location Details
      { name: 'FRONTIER', type: 'text', required: true, label: 'Frontier', group: 'location' },
      { name: 'SECTOR_HQ', type: 'text', required: true, label: 'Sector HQ', group: 'location' },
      { name: 'UNITS_AOR', type: 'text', required: false, label: 'Units AOR', group: 'location' },
      { name: 'LENGTH_KM', type: 'number', required: false, label: 'Length (KM)', group: 'location' },
      
      // Financial Details
      { name: 'SANCTIONED_AMOUNT_CR', type: 'number', required: false, label: 'Sanctioned Amount (Crores)', group: 'financial' },
      { name: 'APPROVED AMOUNT (CR)', type: 'number', required: false, label: 'Approved Amount (Crores)', group: 'financial' },
      
      // Timeline
      { name: 'HLEC_YEAR', type: 'text', required: false, label: 'HLEC Year', group: 'timeline' },
      { name: 'SDC', type: 'date', required: false, label: 'SDC', group: 'timeline' },
      { name: 'PDC', type: 'date', required: false, label: 'PDC', group: 'timeline' },
      
      // Progress
      { name: 'COMPLETED_PERCENTAGE', type: 'number', required: false, label: 'Completed %', defaultValue: '0', group: 'progress' },
      { name: 'REMARKS', type: 'textarea', required: false, label: 'Remarks', group: 'progress' }
    ],
    columnGroups: {
      basic: { title: 'Basic Information', icon: 'FileText', order: 1 },
      location: { title: 'Location Details', icon: 'MapPin', order: 2 },
      financial: { title: 'Financial Details', icon: 'DollarSign', order: 3 },
      timeline: { title: 'Timeline', icon: 'Calendar', order: 4 },
      progress: { title: 'Progress', icon: 'Hash', order: 5 }
    },
    calculations: {},
    comparisonColumns: ['NAME_OF_WORK', 'FRONTIER', 'SECTOR_HQ', 'LENGTH_KM', 'SANCTIONED_AMOUNT_CR']
  },
  
  enggcurrentyear: {
    displayName: 'Engineering Current Year Budget',
    fileName: 'enggcurrentyear.csv',
    idField: 'S/No.',
    idPrefix: 'ECY',
    idFormat: 'ECY-{timestamp}-{sequence}',
    description: 'Current year engineering budget and financial tracking',
    icon: 'Calendar',
    color: 'purple',
    columns: [
      // Basic Information
      { name: 'S/No.', type: 'id', required: true, label: 'Serial Number (ID)', group: 'basic' },
      { name: 'ftr_hq_name', type: 'text', required: true, label: 'Frontier HQ Name', group: 'basic' },
      { name: 'shq_name', type: 'text', required: false, label: 'SHQ Name', group: 'basic' },
      { name: 'budget_head', type: 'text', required: true, label: 'Budget Head', group: 'basic' },
      { name: 'sub_scheme-name', type: 'text', required: false, label: 'Sub Scheme Name', group: 'basic' },
      { name: 'executive_agency', type: 'text', required: false, label: 'Executive Agency', group: 'basic' },
      
      // Previous Year Financial Data
      { name: 'Allotment Previous Financila year', type: 'number', required: false, label: 'Allotment Previous Financial Year', defaultValue: '0', group: 'previous_year' },
      { name: 'Expdr previous year', type: 'number', required: false, label: 'Expenditure Previous Year', defaultValue: '0', group: 'previous_year' },
      { name: 'Liabilities', type: 'number', required: false, label: 'Liabilities', defaultValue: '0', group: 'previous_year' },
      
      // Current Year Sanctions & Allotments
      { name: 'Fresh Sanction issued during CFY', type: 'number', required: false, label: 'Fresh Sanction Issued During CFY', defaultValue: '0', group: 'current_sanctions' },
      { name: 'Effective sanction', type: 'number', required: false, label: 'Effective Sanction', defaultValue: '0', group: 'current_sanctions' },
      { name: 'Allotment CFY', type: 'number', required: false, label: 'Allotment Current FY', defaultValue: '0', group: 'current_sanctions' },
      { name: 'Allotment (FY 24-25)', type: 'number', required: false, label: 'Allotment (FY 24-25)', defaultValue: '0', group: 'current_sanctions' },
      
      // Current Year Expenditure
      { name: 'Expdr_as_per_elekha', type: 'number', required: false, label: 'Expenditure as per E-lekha', defaultValue: '0', group: 'current_expenditure' },
      { name: '% Age of expdr as per e-lekha', type: 'number', required: false, label: '% of Expenditure (E-lekha)', calculated: true, group: 'current_expenditure' },
      
      // Pending Bills
      { name: 'Bill pending with PAD', type: 'number', required: false, label: 'Bills Pending with PAD', defaultValue: '0', group: 'pending' },
      { name: 'Bill pending with HQrs', type: 'number', required: false, label: 'Bills Pending with HQrs', defaultValue: '0', group: 'pending' },
      
      // Total Expenditure & Balance
      { name: 'Total Expdr as per contengency register', type: 'number', required: false, label: 'Total Expenditure (Contingency Register)', defaultValue: '0', group: 'totals' },
      { name: '% Age of total Expdr', type: 'number', required: false, label: '% of Total Expenditure', calculated: true, group: 'totals' },
      { name: 'Balance fund', type: 'number', required: false, label: 'Balance Fund', calculated: true, group: 'totals' },
      { name: 'Expdr plan for balance fund', type: 'number', required: false, label: 'Expenditure Plan for Balance Fund', defaultValue: '0', group: 'totals' }
    ],
    columnGroups: {
      basic: { title: 'Basic Information', icon: 'FileText', order: 1 },
      previous_year: { title: 'Previous Year Data', icon: 'Clock', order: 2 },
      current_sanctions: { title: 'Current Year Sanctions', icon: 'DollarSign', order: 3 },
      current_expenditure: { title: 'Current Year Expenditure', icon: 'Calculator', order: 4 },
      pending: { title: 'Pending Bills', icon: 'Clock', order: 5 },
      totals: { title: 'Totals & Balance', icon: 'Hash', order: 6 }
    },
    calculations: {
      '% Age of expdr as per e-lekha': (row) => {
        const allotmentCFY = parseFloat(row['Allotment CFY']) || 0;
        const currentExpdr = parseFloat(row['Expdr_as_per_elekha']) || 0;
        return allotmentCFY > 0 ? ((currentExpdr / allotmentCFY) * 100).toFixed(2) : '0';
      },
      '% Age of total Expdr': (row) => {
        const allotmentCFY = parseFloat(row['Allotment CFY']) || 0;
        const totalExpdr = parseFloat(row['Total Expdr as per contengency register']) || 0;
        return allotmentCFY > 0 ? ((totalExpdr / allotmentCFY) * 100).toFixed(2) : '0';
      },
      'Balance fund': (row) => {
        const allotmentCFY = parseFloat(row['Allotment CFY']) || 0;
        const totalExpdr = parseFloat(row['Total Expdr as per contengency register']) || 0;
        const pendingPAD = parseFloat(row['Bill pending with PAD']) || 0;
        const pendingHQrs = parseFloat(row['Bill pending with HQrs']) || 0;
        return (allotmentCFY - totalExpdr - pendingPAD - pendingHQrs).toFixed(2);
      }
    },
    comparisonColumns: ['ftr_hq_name', 'shq_name', 'budget_head', 'sub_scheme-name', 'Allotment CFY']
  },
  
  // Template for custom databases
  custom: {
    displayName: 'Custom Database',
    fileName: 'custom.csv',
    idField: 'id',
    idPrefix: 'CUSTOM',
    idFormat: '{prefix}-{timestamp}-{sequence}',
    description: 'Custom database configuration',
    icon: 'Database',
    color: 'gray',
    columns: [
      { name: 'id', type: 'id', required: true, label: 'ID', group: 'basic' }
    ],
    columnGroups: {
      basic: { title: 'All Fields', icon: 'FileText', order: 1 }
    },
    calculations: {},
    comparisonColumns: []
  }
};

/**
 * Returns database configuration by name
 * @param {string} databaseName - The name of the database configuration to retrieve
 * @return {Object} The database configuration object
 */
const getConfig = (databaseName) => {
  return databaseConfigs[databaseName] || databaseConfigs.custom;
};

/**
 * Returns all available database names
 * @return {string[]} Array of database names
 */
const getDatabaseNames = () => {
  return Object.keys(databaseConfigs).filter(name => name !== 'custom');
};

/**
 * Generates ID based on configuration
 * @param {string} databaseName - The database configuration to use
 * @param {number} timestamp - Timestamp to use in ID generation (default: current timestamp)
 * @param {number} sequence - Sequence number to use in ID generation (default: 1)
 * @return {string} Generated ID string
 */
const generateId = (databaseName, timestamp = Date.now(), sequence = 1) => {
  const config = databaseConfigs[databaseName] || databaseConfigs.custom;
  const idFormat = config.idFormat;
  
  return idFormat
    .replace('{prefix}', config.idPrefix)
    .replace('{timestamp}', timestamp)
    .replace('{sequence}', sequence);
};

/**
 * Applies calculations to a row based on database configuration
 * @param {string} databaseName - The database configuration to use
 * @param {Object} row - The data row to apply calculations to
 * @return {Object} Updated row with calculations applied
 */
const applyCalculations = (databaseName, row) => {
  const config = databaseConfigs[databaseName] || databaseConfigs.custom;
  const updatedRow = { ...row };
  
  Object.entries(config.calculations).forEach(([field, calculator]) => {
    updatedRow[field] = calculator(updatedRow);
  });
  
  return updatedRow;
};

// Create the final exports object
const configExports = {
  databaseConfigs,
  getConfig,
  getDatabaseNames,
  generateId,
  applyCalculations
};

// Export for use in React applications
export default configExports;

// For CommonJS compatibility (if needed in non-React parts of the application)
export {
  databaseConfigs,
  getConfig,
  getDatabaseNames,
  generateId,
  applyCalculations
};