import { useState, useEffect, useCallback, useRef } from 'react';

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
  const awardDate = parseMultiFormatDate(row.award_date || row.date_award);
  if (!awardDate) return 0;

  try {
    const award = new Date(awardDate);
    const today = new Date();
    
    // Get PDC date (use revised if available, otherwise original)
    let pdcDateStr = parseMultiFormatDate(row.revised_pdc) || 
                     parseMultiFormatDate(row.pdc_agreement) || 
                     parseMultiFormatDate(row.pdc_agreement_1);
    
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
  const actualProgress = parseFloat(row.physical_progress) || 0;
  const expectedProgress = calculateExpectedProgress(row);
  
  // Special case: Payment Pending (completed but not fully paid)
  if (actualProgress >= 100 && row.expenditure_percent < 100) {
    return 'PAYMENT_PENDING';
  }
  
  // If project hasn't started yet and no award date
  const awardDate = parseMultiFormatDate(row.award_date || row.date_award);
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
  const progress = parseFloat(row.physical_progress) || 0;
  
  // Check tender and award status first
  const tenderDate = parseMultiFormatDate(row.tender_date || row.date_tender);
  const awardDate = parseMultiFormatDate(row.award_date || row.date_award);
  
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
  if (row.physical_progress >= 100) return 0;
  
  const pdcStr = parseMultiFormatDate(row.revised_pdc) || 
                 parseMultiFormatDate(row.pdc_agreement) || 
                 parseMultiFormatDate(row.pdc_agreement_1);
  
  if (!pdcStr) return 0;
  
  const pdc = new Date(pdcStr);
  const today = new Date();
  const diffTime = today - pdc;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Enhanced risk calculation
const calculateRiskLevel = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
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

// Calculate efficiency
const calculateEfficiency = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
  const expdr = parseFloat(row.expenditure_percent) || 0;
  if (expdr === 0) return progress > 0 ? 100 : 0;
  return Math.min(100, (progress / expdr) * 100);
};

// Determine priority
const determinePriority = (row) => {
  const amount = parseFloat(row.sanctioned_amount) || parseFloat(row.sd_amount_lakh) || 0;
  const progress = parseFloat(row.physical_progress) || 0;
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
  if (row.delay_days === 0 && row.physical_progress > 50) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

// Forecast completion with proper date handling
const forecastCompletion = (row) => {
  if (row.physical_progress >= 100) {
    return parseMultiFormatDate(row.completion_date_actual) || 'Completed';
  }
  if (row.physical_progress === 0) return 'Not Started';
  
  const awardDateStr = parseMultiFormatDate(row.award_date || row.date_award);
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
    
    const remainingProgress = 100 - row.physical_progress;
    const avgProgressRate = row.physical_progress / daysSinceAward;
    
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

// Safe number conversion helper (ensures amounts are in lakhs)
const safeNumber = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Main data hook
export const useData = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const isMountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Process raw CSV data with enhanced date processing
  const processData = useCallback((data) => {
    return data
      .filter(row => row && (row.serial_no || row.s_no || row.scheme_name || row.scheme_name_1))
      .map((row, index) => {
        const cleanRow = {};
        
        // Clean and normalize all keys
        Object.keys(row).forEach(key => {
          if (key) {
            const cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
            cleanRow[cleanKey] = row[key];
          }
        });

        // Get scheme name
        const schemeName = safeString(
          cleanRow.scheme_name_1 || 
          cleanRow.scheme_name || 
          'Unnamed Scheme'
        );

        // Get sanctioned amount (already in lakhs from sd_amount_lakh)
        const sanctionedAmount = safeNumber(cleanRow.sd_amount_lakh) || 0;

        // Process location field
        let locationValue = '';
        if (cleanRow.location !== undefined && cleanRow.location !== null) {
          if (typeof cleanRow.location === 'number') {
            locationValue = cleanRow.location.toString();
          } else if (typeof cleanRow.location === 'string') {
            locationValue = cleanRow.location;
          } else if (cleanRow.location && typeof cleanRow.location === 'object' && cleanRow.location.toString) {
            locationValue = cleanRow.location.toString();
          } else {
            locationValue = '';
          }
        }

        // Process all date fields with enhanced parser
        const processedRow = {
          id: index + 1,
          serial_no: safeString(cleanRow.serial_no || cleanRow.s_no || index + 1),
          budget_head: safeString(cleanRow.budget_head || 'N/A'),
          scheme_name: schemeName,
          ftr_hq: safeString(cleanRow.ftr_hq || 'Unknown'),
          shq: safeString(cleanRow.shq || 'Unknown'),
          location: safeString(locationValue || 'N/A'),
          work_site: safeString(cleanRow.work_site || locationValue || 'Unknown Location'),
          executive_agency: safeString(cleanRow.executive_agency || 'Unknown Agency'),
          sanctioned_amount: sanctionedAmount, // Already in lakhs
          
          // Process all date fields with the enhanced parser
          award_date: parseMultiFormatDate(cleanRow.award_date) || '',
          date_award: parseMultiFormatDate(cleanRow.award_date) || '',
          tender_date: parseMultiFormatDate(cleanRow.tender_date) || '',
          date_tender: parseMultiFormatDate(cleanRow.tender_date) || '',
          pdc_agreement: parseMultiFormatDate(cleanRow.pdc_agreement || cleanRow.pdc_agreement_1) || '',
          revised_pdc: parseMultiFormatDate(cleanRow.revised_pdc) || '',
          completion_date_actual: parseMultiFormatDate(cleanRow.completion_date_actual) || '',
          actual_completion_date: parseMultiFormatDate(cleanRow.completion_date_actual) || '',
          acceptance_date: parseMultiFormatDate(cleanRow.acceptance_date) || '',
          date_acceptance: parseMultiFormatDate(cleanRow.acceptance_date) || '',
          ts_date: parseMultiFormatDate(cleanRow.ts_date) || '',
          date_ts: parseMultiFormatDate(cleanRow.ts_date) || '',
          
          firm_name: safeString(cleanRow.firm_name || 'Unknown Contractor'),
          physical_progress: safeNumber(cleanRow.physical_progress, 0),
          current_status: safeNumber(cleanRow.current_status, 0),
          
          // Expenditure fields (ensure they're in lakhs)
          expenditure_previous_fy: safeNumber(cleanRow.expenditure_previous_fy, 0),
          expenditure_current_fy: safeNumber(cleanRow.expenditure_current_fy, 0),
          expenditure_total: safeNumber(cleanRow.expenditure_total, 0),
          
          expenditure_percent: safeString(cleanRow.expenditure_percent || '0').replace('%', ''),
          time_allowed_days: safeNumber(cleanRow.time_allowed_days, 0),
          remarks: safeString(cleanRow.remarks || ''),
          aa_es_reference: safeString(cleanRow.aa_es_reference || ''),
          source_sheet: safeString(cleanRow.source_sheet || '')
        };

        // Parse expenditure percent
        processedRow.percent_expdr = safeNumber(processedRow.expenditure_percent, 0);
        
        // Map fields for compatibility
        processedRow.aa_es_ref = processedRow.aa_es_reference;
        
        // Calculate total expenditure (in lakhs)
        processedRow.total_expdr = processedRow.expenditure_total || 
          (processedRow.expenditure_previous_fy + processedRow.expenditure_current_fy);
        
        // Map current FY expenditure
        processedRow.expdr_cfy = processedRow.expenditure_current_fy;
        processedRow.expdr_upto_31mar25 = processedRow.expenditure_previous_fy;
        
        // Calculate derived fields
        processedRow.remaining_amount = processedRow.sanctioned_amount - processedRow.total_expdr;
        processedRow.efficiency_score = calculateEfficiency(processedRow);
        processedRow.delay_days = calculateDelay(processedRow);
        
        // Calculate expected progress
        processedRow.expected_progress = calculateExpectedProgress(processedRow);
        
        // Calculate health status
        processedRow.health_status = calculateHealthScore(processedRow);
        processedRow.health_score = getHealthScoreNumeric(processedRow.health_status);
        
        // Determine progress status
        processedRow.progress_category = determineProgressStatus(processedRow);
        
        // Calculate risk
        processedRow.risk_level = calculateRiskLevel(processedRow);
        processedRow.priority = determinePriority(processedRow);
        
        // Map status
        processedRow.status = determineStatus(processedRow.progress_category);
        processedRow.progress_status = processedRow.current_status || processedRow.status;
        
        // Calculate budget variance
        processedRow.budget_variance = processedRow.sanctioned_amount > 0 
          ? ((processedRow.total_expdr - processedRow.sanctioned_amount) / processedRow.sanctioned_amount * 100).toFixed(2)
          : 0;
        
        // Calculate completion ratio
        processedRow.completion_ratio = processedRow.time_allowed_days > 0
          ? (processedRow.physical_progress / 100 * processedRow.time_allowed_days).toFixed(0)
          : 0;
        
        // Calculate monthly burn rate (in lakhs)
        if (processedRow.award_date) {
          const awardDate = new Date(processedRow.award_date);
          const monthsElapsed = Math.max(1, Math.floor((new Date() - awardDate) / (1000 * 60 * 60 * 24 * 30)));
          processedRow.monthly_burn_rate = (processedRow.total_expdr / monthsElapsed).toFixed(2);
        } else {
          processedRow.monthly_burn_rate = 0;
        }
        
        processedRow.quality_score = calculateQualityScore(processedRow);
        processedRow.forecast_completion = forecastCompletion(processedRow);
        
        // Add placeholder for missing field
        processedRow.aa_es_pending_with = '';
        
        return processedRow;
      });
  }, []);

  // Load data from CSV using fetch
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/engineering.csv', {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,application/csv,text/plain'
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }
      
      const fileContent = await response.text();
      console.log('CSV file loaded, processing...');
      
      if (!isMountedRef.current) return;
      
      // Parse CSV using dynamic import
      const Papa = await import('papaparse');
      
      const result = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        transformHeader: (header) => {
          if (!header) return '';
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }
      
      // Process data with enhanced date handling
      const processedData = processData(result.data);
      console.log(`Processed ${processedData.length} records`);
      
      // Log sample date formats for debugging
      if (processedData.length > 0) {
        console.log('Sample processed dates:', {
          award_date: processedData[0].award_date,
          tender_date: processedData[0].tender_date,
          pdc_agreement: processedData[0].pdc_agreement,
          completion_date: processedData[0].completion_date_actual
        });
      }
      
      // Calculate data statistics
      const stats = {
        totalRecords: processedData.length,
        dateRange: {
          earliest: processedData
            .filter(d => d.date_award && d.date_award !== '')
            .reduce((min, d) => {
              try {
                const date = new Date(d.date_award);
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
        sourceSheets: [...new Set(processedData.map(d => d.source_sheet).filter(Boolean))],
        uniqueLocations: [...new Set(processedData.map(d => d.location).filter(l => l && l !== 'N/A'))]
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
        setError(err.message || 'Failed to load engineering data');
        setLoading(false);
      }
    }
  }, [processData]);

  // Calculate data completeness
  const calculateDataCompleteness = (data) => {
    if (!data || data.length === 0) return 0;
    
    const requiredFields = [
      'serial_no', 'scheme_name', 'budget_head', 'work_site',
      'executive_agency', 'sanctioned_amount', 'physical_progress',
      'location'
    ];
    
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
  const updateRecord = useCallback((id, updates) => {
    setRawData(prevData => 
      prevData.map(record => 
        record.id === id 
          ? { ...record, ...updates, lastModified: new Date() }
          : record
      )
    );
  }, []);

  // Batch update records
  const batchUpdate = useCallback((ids, updates) => {
    setRawData(prevData =>
      prevData.map(record =>
        ids.includes(record.id)
          ? { ...record, ...updates, lastModified: new Date() }
          : record
      )
    );
  }, []);

  // Add new record
  const addRecord = useCallback((newRecord) => {
    const processedRecord = processData([newRecord])[0];
    setRawData(prevData => [...prevData, processedRecord]);
  }, [processData]);

  // Delete records
  const deleteRecords = useCallback((ids) => {
    setRawData(prevData => prevData.filter(record => !ids.includes(record.id)));
  }, []);

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
        grouped[key].totalBudget += item.sanctioned_amount || 0;
        grouped[key].totalExpenditure += item.total_expdr || 0;
        grouped[key].avgProgress += item.physical_progress || 0;
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

    const aggregateByLocation = (data) => {
      const locations = {};
      
      data.forEach(item => {
        const locationField = safeString(item.location);
        const workSite = safeString(item.work_site);
        
        let location = 'Unknown';
        if (locationField && locationField !== 'N/A' && locationField !== '') {
          location = locationField;
        } else if (workSite && workSite !== 'Unknown Location') {
          location = workSite.split(',')[0].trim();
        }
        
        if (!locations[location]) {
          locations[location] = {
            count: 0,
            totalBudget: 0,
            totalExpenditure: 0,
            avgProgress: 0,
            coords: null,
            projects: []
          };
        }
        
        locations[location].count++;
        locations[location].totalBudget += item.sanctioned_amount || 0;
        locations[location].totalExpenditure += item.total_expdr || 0;
        locations[location].avgProgress += item.physical_progress || 0;
        locations[location].projects.push(item.id);
      });
      
      Object.keys(locations).forEach(key => {
        if (locations[key].count > 0) {
          locations[key].avgProgress /= locations[key].count;
        }
      });
      
      return locations;
    };

    const generateTimelineStats = (data) => {
      const timeline = {};
      
      data.forEach(item => {
        if (item.date_award) {
          try {
            const date = new Date(item.date_award);
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
              timeline[monthKey].budget += item.sanctioned_amount || 0;
              timeline[monthKey].expenditure += item.total_expdr || 0;
              
              if (item.physical_progress >= 100) {
                timeline[monthKey].completed++;
              }
            }
          } catch (err) {
            console.warn('Invalid date in timeline stats:', item.date_award);
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
      byLocation: aggregateByLocation(rawData),
      byLocationField: aggregateByField(rawData, 'location'),
      byContractor: aggregateByField(rawData, 'firm_name'),
      byFrontierHQ: aggregateByField(rawData, 'ftr_hq'),
      bySectorHQ: aggregateByField(rawData, 'shq'),
      timeline: generateTimelineStats(rawData),
      byHealthStatus: aggregateByField(rawData, 'health_status'),
      byProgressCategory: aggregateByField(rawData, 'progress_category'),
      bySourceSheet: aggregateByField(rawData, 'source_sheet')
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
    refetch,
    updateRecord,
    batchUpdate,
    addRecord,
    deleteRecords,
    getAggregateStats
  };
};