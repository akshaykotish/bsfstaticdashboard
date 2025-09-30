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
    }
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
    calculations: {}
  },
  
  enggcurrentyear: {
    displayName: 'Engineering Current Year',
    fileName: 'enggcurrentyear.csv',
    idField: 'S/No.',
    idPrefix: 'ECY',
    idFormat: 'ECY-{timestamp}-{sequence}',
    description: 'Current year engineering financial data',
    icon: 'Calendar',
    color: 'purple',
    columns: [
      // Basic Information
      { name: 'S/No.', type: 'id', required: true, label: 'Serial Number (ID)', group: 'basic' },
      { name: 'Name of Ftr HQ', type: 'text', required: true, label: 'Name of Frontier HQ', group: 'basic' },
      { name: 'Budget head', type: 'text', required: true, label: 'Budget Head', group: 'basic' },
      { name: 'Name of scheme', type: 'text', required: false, label: 'Name of Scheme', group: 'basic' },
      
      // Financial Allocations
      { name: 'Allotment Previous Financila year', type: 'number', required: false, label: 'Allotment Previous Financial Year', group: 'financial' },
      { name: 'Liabilities', type: 'number', required: false, label: 'Liabilities', group: 'financial' },
      { name: 'Fresh Sanction issued during CFY', type: 'number', required: false, label: 'Fresh Sanction Issued During CFY', group: 'financial' },
      { name: 'Effective sanction', type: 'number', required: false, label: 'Effective Sanction', group: 'financial' },
      { name: 'Allotment CFY', type: 'number', required: false, label: 'Allotment Current FY', group: 'financial' },
      { name: 'Allotment  (FY 24-25)', type: 'number', required: false, label: 'Allotment (FY 24-25)', group: 'financial' },
      
      // Expenditure Details
      { name: 'Expdr previous year', type: 'number', required: false, label: 'Expenditure Previous Year', defaultValue: '0', group: 'expenditure' },
      { name: 'Expdr booked as per e-lekha as on 22/07/25', type: 'number', required: false, label: 'Expenditure as per E-lekha (22/07/25)', defaultValue: '0', group: 'expenditure' },
      { name: 'Expdr booked as per e-lekha as on 31/03/25', type: 'number', required: false, label: 'Expenditure as per E-lekha (31/03/25)', defaultValue: '0', group: 'expenditure' },
      { name: 'Total Expdr as per contengency register', type: 'number', required: false, label: 'Total Expenditure per Contingency Register', group: 'expenditure' },
      { name: '% Age of expdr as per e-lekha', type: 'number', required: false, label: 'Percentage of Expenditure (E-lekha)', calculated: true, group: 'expenditure' },
      { name: '% Age of total Expdr', type: 'number', required: false, label: 'Percentage of Total Expenditure', calculated: true, group: 'expenditure' },
      
      // Pending Bills
      { name: 'Bill pending with PAD', type: 'number', required: false, label: 'Bills Pending with PAD', defaultValue: '0', group: 'pending' },
      { name: 'Bill pending with HQrs', type: 'number', required: false, label: 'Bills Pending with HQrs', defaultValue: '0', group: 'pending' },
      
      // Balance and Planning
      { name: 'Balance fund', type: 'number', required: false, label: 'Balance Fund', calculated: true, group: 'balance' },
      { name: 'Expdr plan for balance fund', type: 'number', required: false, label: 'Expenditure Plan for Balance Fund', group: 'balance' }
    ],
    columnGroups: {
      basic: { title: 'Basic Information', icon: 'FileText', order: 1 },
      financial: { title: 'Financial Allocations', icon: 'DollarSign', order: 2 },
      expenditure: { title: 'Expenditure Details', icon: 'Calculator', order: 3 },
      pending: { title: 'Pending Bills', icon: 'Clock', order: 4 },
      balance: { title: 'Balance & Planning', icon: 'Hash', order: 5 }
    },
    calculations: {
      '% Age of expdr as per e-lekha': (row) => {
        const allotmentCFY = parseFloat(row['Allotment CFY']) || 0;
        const currentExpdr = parseFloat(row['Expdr booked as per e-lekha as on 22/07/25']) || 0;
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
    }
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
    calculations: {}
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