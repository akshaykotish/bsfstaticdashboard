import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = 'http://localhost:3456';

// Import database configurations - handle both default and named exports
let databaseConfigs;
try {
  // Try to import from config.js
  const configModule = require('../System/config');
  databaseConfigs = configModule.databaseConfigs || configModule.default || configModule;
} catch (error) {
  console.warn('Could not load config.js, using fallback configuration');
  // Fallback configuration if config.js is not available
  databaseConfigs = {
    engineering: {
      displayName: 'Engineering Database',
      fileName: 'engineering.csv',
      idField: 's_no',
      idPrefix: 'ENG',
      columns: [
        's_no', 'source_sheet', 'budget_head', 'sub_scheme_name', 
        'ftr_hq_name', 'shq_name', 'work_description', 'executive_agency',
        'aa_es_reference', 'sd_amount_lakh', 'ts_date', 'tender_date',
        'acceptance_date', 'award_date', 'time_allowed_days', 
        'pdc_agreement', 'pdc_revised', 'firm_name', 
        'physical_progress_percent', 'expenditure_previous_fy',
        'expenditure_current_fy', 'expenditure_total', 
        'expenditure_percent', 'remarks', 'created_at', 'updated_at',
        'completion_date_actual', 'name_of_scheme', 'location'
      ]
    }
  };
}

// Helper functions for data processing

// Enhanced date parser to handle multiple formats including short year formats
const parseMultiFormatDate = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === 'N/A' || dateValue === 'NA') {
    return null;
  }

  // If it's already a Date object, validate it
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue.toISOString().split('T')[0];
  }

  // Convert to string and trim
  const dateStr = String(dateValue).trim();
  
  // Return null for empty or invalid strings
  if (!dateStr || dateStr === '0' || dateStr === 'null' || dateStr === 'undefined') {
    return null;
  }

  try {
    let parsedDate = null;

    // Format 1: DD.MM.YY (e.g., "18.09.24")
    if (/^\d{1,2}\.\d{1,2}\.\d{2}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('.');
      // Assume 20xx for years 00-30, 19xx for years 31-99
      const fullYear = parseInt(year) <= 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    }
    // Format 2: DD.MM.YYYY (e.g., "31.05.2024")
    else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('.');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format 3: DD/MM/YY
    else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      const fullYear = parseInt(year) <= 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    }
    // Format 4: DD/MM/YYYY (e.g., "31/05/2024")
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format 5: DD-MM-YY
    else if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      const fullYear = parseInt(year) <= 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    }
    // Format 6: DD-MM-YYYY (e.g., "31-05-2024")
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format 7: YYYY-MM-DD (ISO format)
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // Format 8: YYYY/MM/DD
    else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('/');
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format 9: DD Mon YYYY or DD Month YYYY (e.g., "25 Sep 2025", "4 December 2025")
    else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // Format 10: Mon DD, YYYY or Month DD, YYYY (e.g., "Sep 25, 2025", "December 4, 2025")
    else if (/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/.test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // Try direct parsing as last resort
    else {
      parsedDate = new Date(dateStr);
    }

    // Validate the parsed date
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      // Check if the date is reasonable (between 1900 and 2100)
      const year = parsedDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        // Return in ISO format (YYYY-MM-DD)
        return parsedDate.toISOString().split('T')[0];
      }
    }

    return null;
  } catch (err) {
    console.warn('Error parsing date:', dateStr, err);
    return null;
  }
};

// Calculate expected progress based on time elapsed
const calculateExpectedProgress = (row) => {
  const awardDate = parseMultiFormatDate(row.award_date);
  if (!awardDate) return 0;

  try {
    const award = new Date(awardDate);
    const today = new Date();
    
    // Get PDC date (use revised if available, otherwise original)
    let pdcDateStr = parseMultiFormatDate(row.pdc_revised) || 
                     parseMultiFormatDate(row.pdc_agreement);
    
    let pdcDate = pdcDateStr ? new Date(pdcDateStr) : null;
    
    // If no PDC date or invalid, use time_allowed_days
    if (!pdcDate || isNaN(pdcDate.getTime())) {
      if (row.time_allowed_days && row.time_allowed_days > 0) {
        pdcDate = new Date(award);
        pdcDate.setDate(pdcDate.getDate() + parseInt(row.time_allowed_days));
      } else {
        // Default to 365 days if no timeline info
        pdcDate = new Date(award);
        pdcDate.setFullYear(pdcDate.getFullYear() + 1);
      }
    }

    // Calculate total project duration in months
    const totalDurationMs = pdcDate - award;
    const totalMonths = totalDurationMs / (1000 * 60 * 60 * 24 * 30.44);
    
    // Calculate elapsed time in months
    const elapsedMs = today - award;
    const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30.44);
    
    // If project should be completed by now
    if (today >= pdcDate) {
      return 100;
    }
    
    // Calculate expected progress
    if (totalMonths > 0) {
      const monthlyProgress = 100 / totalMonths;
      const expectedProgress = monthlyProgress * elapsedMonths;
      return Math.min(100, Math.max(0, expectedProgress));
    }
    
    return 0;
  } catch (err) {
    console.warn('Error calculating expected progress:', err);
    return 0;
  }
};

// Enhanced health calculation based on pace
const calculateHealthScore = (row) => {
  const actualProgress = parseFloat(row.physical_progress_percent) || 0;
  const expectedProgress = calculateExpectedProgress(row);
  
  // Special case: Payment Pending (completed but not fully paid)
  if (actualProgress >= 100 && row.expenditure_percent < 100) {
    return 'PAYMENT_PENDING';
  }
  
  // If project hasn't started yet and no award date
  const awardDate = parseMultiFormatDate(row.award_date);
  if (!awardDate) {
    return 'NOT_APPLICABLE';
  }
  
  // Calculate progress ratio
  const progressRatio = expectedProgress > 0 ? (actualProgress / expectedProgress) : 0;
  
  // Categorize based on pace
  if (progressRatio >= 0.95) {
    return 'PERFECT_PACE';
  } else if (progressRatio >= 0.75) {
    return 'SLOW_PACE';
  } else if (progressRatio >= 0.50) {
    return 'BAD_PACE';
  } else if (actualProgress > 0) {
    return 'SLEEP_PACE';
  } else if (expectedProgress > 10) {
    return 'SLEEP_PACE';
  } else {
    return 'SLOW_PACE';
  }
};

// Convert health status to numeric score
const getHealthScoreNumeric = (healthStatus) => {
  const scores = {
    'PERFECT_PACE': 100,
    'SLOW_PACE': 75,
    'BAD_PACE': 50,
    'SLEEP_PACE': 25,
    'PAYMENT_PENDING': 90,
    'NOT_APPLICABLE': null
  };
  return scores[healthStatus] ?? 50;
};

// Enhanced physical progress categorization
const determineProgressStatus = (row) => {
  const progress = parseFloat(row.physical_progress_percent) || 0;
  
  // Check tender and award status first
  const tenderDate = parseMultiFormatDate(row.tender_date);
  const awardDate = parseMultiFormatDate(row.award_date);
  
  if (!tenderDate) {
    return 'TENDER_PROGRESS';
  }
  
  if (tenderDate && !awardDate) {
    return 'TENDERED_NOT_AWARDED';
  }
  
  if (awardDate && progress === 0) {
    return 'AWARDED_NOT_STARTED';
  }
  
  // Progress-based categories
  if (progress === 0) {
    return 'NOT_STARTED';
  } else if (progress > 0 && progress <= 50) {
    return 'PROGRESS_1_TO_50';
  } else if (progress > 50 && progress <= 71) {
    return 'PROGRESS_51_TO_71';
  } else if (progress > 71 && progress < 100) {
    return 'PROGRESS_71_TO_99';
  } else if (progress >= 100) {
    return 'COMPLETED';
  }
  
  return 'UNKNOWN';
};

// Calculate delay with proper date parsing
const calculateDelay = (row) => {
  if (row.physical_progress_percent >= 100) return 0;
  
  const pdcStr = parseMultiFormatDate(row.pdc_revised) || 
                 parseMultiFormatDate(row.pdc_agreement);
  
  if (!pdcStr) return 0;
  
  const pdc = new Date(pdcStr);
  const today = new Date();
  const diffTime = today - pdc;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Calculate efficiency
const calculateEfficiency = (row) => {
  const progress = parseFloat(row.physical_progress_percent) || 0;
  const expdr = parseFloat(row.expenditure_percent) || 0;
  if (expdr === 0) return progress > 0 ? 100 : 0;
  return Math.min(100, (progress / expdr) * 100);
};

// Enhanced risk calculation
const calculateRiskLevel = (row) => {
  const progress = parseFloat(row.physical_progress_percent) || 0;
  const healthStatus = row.health_status || calculateHealthScore(row);
  const delay = calculateDelay(row);
  const efficiency = calculateEfficiency(row);
  
  // Critical risk conditions
  if (healthStatus === 'SLEEP_PACE' && delay > 90) return 'CRITICAL';
  if (healthStatus === 'BAD_PACE' && delay > 180) return 'CRITICAL';
  if (progress < 25 && delay > 120) return 'CRITICAL';
  if (efficiency < 30 && delay > 60) return 'CRITICAL';
  
  // High risk conditions
  if (healthStatus === 'SLEEP_PACE') return 'HIGH';
  if (healthStatus === 'BAD_PACE' && delay > 90) return 'HIGH';
  if (delay > 90 || efficiency < 50) return 'HIGH';
  
  // Medium risk conditions
  if (healthStatus === 'BAD_PACE') return 'MEDIUM';
  if (healthStatus === 'SLOW_PACE' && delay > 30) return 'MEDIUM';
  if (delay > 30 || efficiency < 70) return 'MEDIUM';
  
  return 'LOW';
};

// Determine priority
const determinePriority = (row) => {
  const amount = parseFloat(row.sd_amount_lakh) || 0;
  const progress = parseFloat(row.physical_progress_percent) || 0;
  const delay = calculateDelay(row);
  
  if (amount > 10000 || (progress < 30 && amount > 5000) || delay > 90) return 'HIGH';
  if (amount > 5000 || (progress < 50 && amount > 2500) || delay > 30) return 'MEDIUM';
  return 'LOW';
};

// Determine status
const determineStatus = (progressStatus) => {
  const statusMap = {
    'TENDER_PROGRESS': 'TENDER_PROGRESS',
    'TENDERED_NOT_AWARDED': 'TENDERED',
    'AWARDED_NOT_STARTED': 'NOT_STARTED',
    'NOT_STARTED': 'NOT_STARTED',
    'PROGRESS_1_TO_50': 'IN_PROGRESS',
    'PROGRESS_51_TO_71': 'ADVANCED',
    'PROGRESS_71_TO_99': 'NEAR_COMPLETION',
    'COMPLETED': 'COMPLETED',
    'UNKNOWN': 'UNKNOWN'
  };
  
  return statusMap[progressStatus] || 'UNKNOWN';
};

// Calculate quality score
const calculateQualityScore = (row) => {
  let score = 100;
  
  if (row.delay_days > 0) score -= Math.min(30, row.delay_days / 10);
  if (row.budget_variance > 0) score -= Math.min(20, row.budget_variance / 5);
  if (row.efficiency_score < 70) score -= (70 - row.efficiency_score) / 2;
  if (row.delay_days === 0 && row.physical_progress_percent > 50) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

// Forecast completion with proper date handling
const forecastCompletion = (row) => {
  if (row.physical_progress_percent >= 100) {
    return parseMultiFormatDate(row.completion_date_actual) || 'Completed';
  }
  if (row.physical_progress_percent === 0) return 'Not Started';
  
  const awardDateStr = parseMultiFormatDate(row.award_date);
  if (!awardDateStr) {
    return 'No start date';
  }
  
  try {
    const awardDate = new Date(awardDateStr);
    const today = new Date();
    const daysSinceAward = Math.floor((today - awardDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceAward <= 0) {
      return 'Project not started';
    }
    
    const remainingProgress = 100 - row.physical_progress_percent;
    const avgProgressRate = row.physical_progress_percent / daysSinceAward;
    
    if (avgProgressRate === 0 || !isFinite(avgProgressRate)) {
      return 'Unable to forecast';
    }
    
    const daysToComplete = Math.ceil(remainingProgress / avgProgressRate);
    
    if (!isFinite(daysToComplete) || daysToComplete < 0) {
      return 'Unable to forecast';
    }
    
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + daysToComplete);
    
    return forecastDate.toISOString().split('T')[0];
  } catch (err) {
    console.warn('Error in forecastCompletion:', err);
    return 'Unable to forecast';
  }
};

// Safe string conversion helper
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

// Safe number conversion helper
const safeNumber = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Main data hook
export const useData = (databaseName = 'engineering') => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const [columns, setColumns] = useState([]);
  const isMountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Get database configuration
  const dbConfig = databaseConfigs[databaseName] || databaseConfigs.engineering || {
    displayName: 'Engineering Database',
    fileName: 'engineering.csv',
    idField: 's_no',
    idPrefix: 'ENG',
    columns: []
  };

  // Process raw CSV data with enhanced date processing
  const processData = useCallback((data) => {
    return data
      .filter(row => row && row[dbConfig.idField])
      .map((row, index) => {
        // Apply calculations from config if they exist
        if (dbConfig.calculations) {
          const updatedRow = { ...row };
          Object.entries(dbConfig.calculations).forEach(([field, calculator]) => {
            if (typeof calculator === 'function') {
              updatedRow[field] = calculator(updatedRow);
            }
          });
          row = updatedRow;
        }

        // Process dates and numbers based on field names
        const processedRow = { ...row };
        
        // Process each field
        Object.keys(row).forEach(fieldName => {
          const fieldLower = fieldName.toLowerCase();
          
          // Process date fields
          if (fieldLower.includes('date') || fieldLower.includes('pdc') || fieldLower.includes('sdc')) {
            if (row[fieldName]) {
              processedRow[fieldName] = parseMultiFormatDate(row[fieldName]);
            }
          } 
          // Process number fields - BUT EXCLUDE work_description even if it contains "work"
          else if (fieldName !== 'work_description' && 
                   (fieldLower.includes('amount') || fieldLower.includes('expdr') || 
                   fieldLower.includes('expenditure') || fieldLower.includes('percent') ||
                   fieldLower.includes('progress') || fieldLower.includes('days') ||
                   fieldLower.includes('lakh') || fieldLower.includes('cr') ||
                   fieldLower.includes('time_allowed') || fieldLower.includes('physical_progress'))) {
            processedRow[fieldName] = safeNumber(row[fieldName], 0);
          }
          // Ensure string fields are properly handled
          else {
            processedRow[fieldName] = safeString(row[fieldName]);
          }
        });

        // Add derived fields for dashboard compatibility
        processedRow.id = row[dbConfig.idField] || index + 1;
        processedRow.delay_days = calculateDelay(processedRow);
        processedRow.expected_progress = calculateExpectedProgress(processedRow);
        processedRow.health_status = calculateHealthScore(processedRow);
        processedRow.health_score = getHealthScoreNumeric(processedRow.health_status);
        processedRow.progress_category = determineProgressStatus(processedRow);
        processedRow.risk_level = calculateRiskLevel(processedRow);
        processedRow.priority = determinePriority(processedRow);
        processedRow.status = determineStatus(processedRow.progress_category);
        processedRow.efficiency_score = calculateEfficiency(processedRow);
        processedRow.quality_score = calculateQualityScore(processedRow);
        processedRow.forecast_completion = forecastCompletion(processedRow);
        
        // Calculate budget variance
        const sanctioned = safeNumber(processedRow.sd_amount_lakh);
        const expended = safeNumber(processedRow.expenditure_total);
        processedRow.budget_variance = sanctioned > 0 
          ? ((expended - sanctioned) / sanctioned * 100).toFixed(2)
          : 0;
        
        // Calculate monthly burn rate
        if (processedRow.award_date) {
          const awardDate = new Date(processedRow.award_date);
          const monthsElapsed = Math.max(1, Math.floor((new Date() - awardDate) / (1000 * 60 * 60 * 24 * 30)));
          processedRow.monthly_burn_rate = (expended / monthsElapsed).toFixed(2);
        } else {
          processedRow.monthly_burn_rate = 0;
        }
        
        return processedRow;
      });
  }, [dbConfig]);

  // Load data from server using the API
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from server API
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows?all=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Loaded ${result.rows.length} records from ${databaseName}`);
      
      if (!isMountedRef.current) return;
      
      // Process data with enhanced date handling
      const processedData = processData(result.rows);
      console.log(`Processed ${processedData.length} records`);
      
      // Debug: Check if work_description field exists
      if (processedData.length > 0) {
        const sampleRow = processedData[0];
        console.log('Sample row fields:', Object.keys(sampleRow).slice(0, 15));
        
        // Check work_description specifically
        const workDescCount = processedData.filter(d => 
          d.work_description && d.work_description !== ''
        ).length;
        console.log(`Rows with work_description: ${workDescCount}/${processedData.length}`);
      }
      
      // Set columns from server response
      setColumns(result.columns || []);
      
      // Calculate data statistics
      const stats = {
        totalRecords: processedData.length,
        dateRange: {
          earliest: processedData
            .filter(d => d.award_date && d.award_date !== '')
            .reduce((min, d) => {
              try {
                const date = new Date(d.award_date);
                if (!isNaN(date.getTime())) {
                  return !min || date < min ? date : min;
                }
                return min;
              } catch {
                return min;
              }
            }, null) || new Date(),
          latest: new Date()
        },
        completenessScore: calculateDataCompleteness(processedData),
        lastUpdate: new Date(),
        healthDistribution: processedData.reduce((acc, item) => {
          acc[item.health_status] = (acc[item.health_status] || 0) + 1;
          return acc;
        }, {}),
        idField: result.idField,
        config: result.config
      };
      
      if (!isMountedRef.current) return;
      
      setRawData(processedData);
      setDataStats(stats);
      setLastUpdate(new Date());
      setLoading(false);
      retryCount.current = 0;
      
      return processedData;
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading data:', err);
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying... Attempt ${retryCount.current} of ${maxRetries}`);
        setTimeout(() => {
          if (isMountedRef.current) {
            loadData();
          }
        }, 1000 * retryCount.current);
      } else {
        setError(err.message || 'Failed to load data from server');
        setLoading(false);
      }
    }
  }, [databaseName, processData]);

  // Calculate data completeness
  const calculateDataCompleteness = (data) => {
    if (!data || data.length === 0) return 0;
    
    // Use default required fields for engineering database
    const requiredFields = ['s_no', 'name_of_scheme', 'budget_head', 'executive_agency'];
    
    let totalCompleteness = 0;
    data.forEach(row => {
      const filledFields = requiredFields.filter(field => 
        row[field] && row[field] !== 'N/A' && row[field] !== ''
      ).length;
      totalCompleteness += (filledFields / requiredFields.length) * 100;
    });
    
    return (totalCompleteness / data.length).toFixed(1);
  };

  // Refetch data
  const refetch = useCallback(() => {
    setRawData([]);
    retryCount.current = 0;
    loadData();
  }, [loadData]);

  // Update single record
  const updateRecord = useCallback(async (index, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update record');
      
      const result = await response.json();
      
      // Update local data
      setRawData(prevData => 
        prevData.map((record, i) => 
          i === index 
            ? { ...record, ...result.row, lastModified: new Date() }
            : record
        )
      );
      
      return result;
    } catch (err) {
      console.error('Error updating record:', err);
      throw err;
    }
  }, [databaseName]);

  // Add new record
  const addRecord = useCallback(async (newRecord) => {
    try {
      const response = await fetch(`${API_URL}/api/csv/${databaseName}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRecord)
      });
      
      if (!response.ok) throw new Error('Failed to add record');
      
      const result = await response.json();
      
      // Process and add to local data
      const processedRecord = processData([result.row])[0];
      setRawData(prevData => [...prevData, processedRecord]);
      
      return result;
    } catch (err) {
      console.error('Error adding record:', err);
      throw err;
    }
  }, [databaseName, processData]);

  // Delete records
  const deleteRecords = useCallback(async (indices) => {
    try {
      const deletePromises = indices.map(index => 
        fetch(`${API_URL}/api/csv/${databaseName}/rows/${index}`, {
          method: 'DELETE'
        })
      );
      
      await Promise.all(deletePromises);
      
      // Remove from local data
      setRawData(prevData => 
        prevData.filter((_, index) => !indices.includes(index))
      );
      
      return { deleted: indices.length };
    } catch (err) {
      console.error('Error deleting records:', err);
      throw err;
    }
  }, [databaseName]);

  // Get aggregate statistics
  const getAggregateStats = useCallback(() => {
    if (!rawData || rawData.length === 0) return null;
    
    const aggregateByField = (data, field) => {
      const grouped = {};
      
      data.forEach(item => {
        const key = safeString(item[field] || 'Unknown');
        if (!grouped[key]) {
          grouped[key] = {
            count: 0,
            totalBudget: 0,
            totalExpenditure: 0,
            avgProgress: 0,
            avgEfficiency: 0,
            projects: []
          };
        }
        
        grouped[key].count++;
        grouped[key].totalBudget += item.sd_amount_lakh || 0;
        grouped[key].totalExpenditure += item.expenditure_total || 0;
        grouped[key].avgProgress += item.physical_progress_percent || 0;
        grouped[key].avgEfficiency += item.efficiency_score || 0;
        grouped[key].projects.push(item.id);
      });
      
      Object.keys(grouped).forEach(key => {
        if (grouped[key].count > 0) {
          grouped[key].avgProgress /= grouped[key].count;
          grouped[key].avgEfficiency /= grouped[key].count;
        }
      });
      
      return grouped;
    };

    const generateTimelineStats = (data) => {
      const timeline = {};
      
      data.forEach(item => {
        if (item.award_date) {
          try {
            const date = new Date(item.award_date);
            if (!isNaN(date.getTime())) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              
              if (!timeline[monthKey]) {
                timeline[monthKey] = {
                  started: 0,
                  completed: 0,
                  budget: 0,
                  expenditure: 0
                };
              }
              
              timeline[monthKey].started++;
              timeline[monthKey].budget += item.sd_amount_lakh || 0;
              timeline[monthKey].expenditure += item.expenditure_total || 0;
              
              if (item.physical_progress_percent >= 100) {
                timeline[monthKey].completed++;
              }
            }
          } catch (err) {
            console.warn('Invalid date in timeline stats:', item.award_date);
          }
        }
      });
      
      return timeline;
    };
    
    return {
      byAgency: aggregateByField(rawData, 'executive_agency'),
      byBudgetHead: aggregateByField(rawData, 'budget_head'),
      byRiskLevel: aggregateByField(rawData, 'risk_level'),
      byStatus: aggregateByField(rawData, 'status'),
      byLocation: aggregateByField(rawData, 'location'),
      byContractor: aggregateByField(rawData, 'firm_name'),
      byFrontierHQ: aggregateByField(rawData, 'ftr_hq_name'),
      bySectorHQ: aggregateByField(rawData, 'shq_name'),
      timeline: generateTimelineStats(rawData),
      byHealthStatus: aggregateByField(rawData, 'health_status'),
      byProgressCategory: aggregateByField(rawData, 'progress_category')
    };
  }, [rawData]);

  // Initial data load
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  return {
    rawData,
    loading,
    error,
    lastUpdate,
    dataStats,
    columns,
    refetch,
    updateRecord,
    addRecord,
    deleteRecords,
    getAggregateStats,
    databaseConfig: dbConfig
  };
};