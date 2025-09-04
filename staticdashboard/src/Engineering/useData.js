import { useState, useEffect, useCallback, useRef } from 'react';

// Helper functions for data processing

// NEW: Calculate expected progress based on time elapsed
const calculateExpectedProgress = (row) => {
  // If no date_award, can't calculate expected progress
  if (!row.date_award || row.date_award === '' || row.date_award === 'N/A') {
    return 0;
  }

  try {
    const awardDate = new Date(row.date_award);
    if (isNaN(awardDate.getTime())) return 0;

    const today = new Date();
    
    // Get PDC date (use revised if available, otherwise original)
    let pdcDate = null;
    if (row.revised_pdc && row.revised_pdc !== '' && row.revised_pdc !== 'N/A') {
      pdcDate = new Date(row.revised_pdc);
    } else if (row.pdc_agreement && row.pdc_agreement !== '' && row.pdc_agreement !== 'N/A') {
      pdcDate = new Date(row.pdc_agreement);
    }
    
    // If no PDC date or invalid, use time_allowed_days
    if (!pdcDate || isNaN(pdcDate.getTime())) {
      if (row.time_allowed_days && row.time_allowed_days > 0) {
        pdcDate = new Date(awardDate);
        pdcDate.setDate(pdcDate.getDate() + parseInt(row.time_allowed_days));
      } else {
        // Default to 365 days if no timeline info
        pdcDate = new Date(awardDate);
        pdcDate.setFullYear(pdcDate.getFullYear() + 1);
      }
    }

    // Calculate total project duration in months
    const totalDurationMs = pdcDate - awardDate;
    const totalMonths = totalDurationMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
    
    // Calculate elapsed time in months
    const elapsedMs = today - awardDate;
    const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30.44);
    
    // If project should be completed by now
    if (today >= pdcDate) {
      return 100;
    }
    
    // Calculate expected progress (100% / total months * elapsed months)
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

// NEW: Enhanced health calculation based on pace
const calculateHealthScore = (row) => {
  const actualProgress = parseFloat(row.physical_progress) || 0;
  const expectedProgress = calculateExpectedProgress(row);
  
  // Special case: Payment Pending (completed but not fully paid)
  if (actualProgress >= 100 && row.percent_expdr < 100) {
    return 'PAYMENT_PENDING';
  }
  
  // If project hasn't started yet and no award date
  if (!row.date_award || row.date_award === '' || row.date_award === 'N/A') {
    return 'NOT_APPLICABLE';
  }
  
  // Calculate progress difference
  const progressDiff = actualProgress - expectedProgress;
  const progressRatio = expectedProgress > 0 ? (actualProgress / expectedProgress) : 0;
  
  // Categorize based on pace
  if (progressRatio >= 0.95) {
    return 'PERFECT_PACE'; // Within 5% of expected or ahead
  } else if (progressRatio >= 0.75) {
    return 'SLOW_PACE'; // 75-95% of expected progress
  } else if (progressRatio >= 0.50) {
    return 'BAD_PACE'; // 50-75% of expected progress
  } else if (actualProgress > 0) {
    return 'SLEEP_PACE'; // Less than 50% of expected but started
  } else if (expectedProgress > 10) {
    return 'SLEEP_PACE'; // Should have started by now but hasn't
  } else {
    return 'SLOW_PACE'; // Recently awarded, give some buffer
  }
};

// NEW: Convert health status to numeric score for averaging
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

// NEW: Enhanced physical progress categorization
const determineProgressStatus = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
  
  // Check tender and award status first
  if (!row.date_tender || row.date_tender === '' || row.date_tender === 'N/A') {
    return 'TENDER_PROGRESS';
  }
  
  if (row.date_tender && (!row.date_award || row.date_award === '' || row.date_award === 'N/A')) {
    return 'TENDERED_NOT_AWARDED';
  }
  
  if (row.date_award && progress === 0) {
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

// Enhanced risk calculation based on new health scores
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
  
  // Low risk
  return 'LOW';
};

// Keep existing helper functions
const calculateEfficiency = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
  const expdr = parseFloat(row.percent_expdr) || 0;
  if (expdr === 0) return progress > 0 ? 100 : 0;
  return Math.min(100, (progress / expdr) * 100);
};

const calculateDelay = (row) => {
  if (!row.pdc_agreement || row.physical_progress >= 100) return 0;
  const pdc = new Date(row.pdc_agreement);
  const today = new Date();
  const diffTime = today - pdc;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const determinePriority = (row) => {
  const amount = parseFloat(row.sanctioned_amount) || 0;
  const progress = parseFloat(row.physical_progress) || 0;
  const delay = calculateDelay(row);
  
  if (amount > 10000 || (progress < 30 && amount > 5000) || delay > 90) return 'HIGH';
  if (amount > 5000 || (progress < 50 && amount > 2500) || delay > 30) return 'MEDIUM';
  return 'LOW';
};

// Updated determineStatus to use new progress categories
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

const calculateQualityScore = (row) => {
  let score = 100;
  
  if (row.delay_days > 0) score -= Math.min(30, row.delay_days / 10);
  if (row.budget_variance > 0) score -= Math.min(20, row.budget_variance / 5);
  if (row.efficiency_score < 70) score -= (70 - row.efficiency_score) / 2;
  if (row.delay_days === 0 && row.physical_progress > 50) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

const forecastCompletion = (row) => {
  if (row.physical_progress >= 100) return row.actual_completion_date;
  if (row.physical_progress === 0) return 'Not Started';
  
  const remainingProgress = 100 - row.physical_progress;
  const avgProgressRate = row.date_award 
    ? row.physical_progress / Math.max(1, Math.floor((new Date() - new Date(row.date_award)) / (1000 * 60 * 60 * 24)))
    : 5;
  
  if (avgProgressRate === 0) return 'Unable to forecast';
  
  const daysToComplete = Math.ceil(remainingProgress / avgProgressRate);
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + daysToComplete);
  
  return forecastDate.toISOString().split('T')[0];
};

// Safe string conversion helper
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
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

  // Process raw CSV data with proper type checking
  const processData = useCallback((data) => {
    return data
      .filter(row => row && (row.serial_no || row.scheme_name))
      .map((row, index) => {
        const cleanRow = {};
        
        // Clean and normalize all keys
        Object.keys(row).forEach(key => {
          if (key) {
            const cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
            cleanRow[cleanKey] = row[key];
          }
        });

        // Process each field with safe string conversion where needed
        const processedRow = {
          id: index + 1,
          serial_no: safeString(cleanRow.serial_no || index + 1),
          budget_head: safeString(cleanRow.budget_head || 'N/A'),
          scheme_name: safeString(cleanRow.scheme_name || 'Unnamed Scheme'),
          ftr_hq: safeString(cleanRow.ftr_hq || 'Unknown'),
          shq: safeString(cleanRow.shq || 'Unknown'),
          work_site: safeString(cleanRow.work_site || 'Unknown Location'),
          executive_agency: safeString(cleanRow.executive_agency || 'Unknown Agency'),
          sanctioned_amount: parseFloat(cleanRow.sanctioned_amount) || 0,
          date_award: safeString(cleanRow.date_award || ''),
          date_tender: safeString(cleanRow.date_tender || ''),
          pdc_agreement: safeString(cleanRow.pdc_agreement || ''),
          revised_pdc: safeString(cleanRow.revised_pdc || ''),
          actual_completion_date: safeString(cleanRow.actual_completion_date || ''),
          firm_name: safeString(cleanRow.firm_name || 'Unknown Contractor'),
          physical_progress: parseFloat(cleanRow.physical_progress) || 0,
          progress_status: safeString(cleanRow.progress_status || 'Unknown'),
          expdr_upto_31mar25: parseFloat(cleanRow.expdr_upto_31mar25) || 0,
          expdr_cfy: parseFloat(cleanRow.expdr_cfy) || 0,
          total_expdr: parseFloat(cleanRow.total_expdr) || 0,
          percent_expdr: parseFloat(cleanRow.percent_expdr) || 0,
          time_allowed_days: parseInt(cleanRow.time_allowed_days) || 0,
          remarks: safeString(cleanRow.remarks || ''),
          aa_es_ref: safeString(cleanRow.aa_es_ref || ''),
          date_acceptance: safeString(cleanRow.date_acceptance || ''),
          aa_es_pending_with: safeString(cleanRow.aa_es_pending_with || '')
        };

        // Calculate derived fields with new logic
        processedRow.remaining_amount = processedRow.sanctioned_amount - processedRow.total_expdr;
        processedRow.efficiency_score = calculateEfficiency(processedRow);
        processedRow.delay_days = calculateDelay(processedRow);
        
        // NEW: Calculate expected progress
        processedRow.expected_progress = calculateExpectedProgress(processedRow);
        
        // NEW: Calculate health status (pace-based)
        processedRow.health_status = calculateHealthScore(processedRow);
        processedRow.health_score = getHealthScoreNumeric(processedRow.health_status);
        
        // NEW: Determine progress status
        processedRow.progress_category = determineProgressStatus(processedRow);
        
        // Calculate risk with new health logic
        processedRow.risk_level = calculateRiskLevel(processedRow);
        processedRow.priority = determinePriority(processedRow);
        
        // Map progress category to status for compatibility
        processedRow.status = determineStatus(processedRow.progress_category);
        
        processedRow.budget_variance = processedRow.sanctioned_amount > 0 
          ? ((processedRow.total_expdr - processedRow.sanctioned_amount) / processedRow.sanctioned_amount * 100).toFixed(2)
          : 0;
        
        processedRow.completion_ratio = processedRow.time_allowed_days > 0
          ? (processedRow.physical_progress / 100 * processedRow.time_allowed_days).toFixed(0)
          : 0;
        
        processedRow.monthly_burn_rate = processedRow.date_award
          ? (processedRow.total_expdr / Math.max(1, Math.floor((new Date() - new Date(processedRow.date_award)) / (1000 * 60 * 60 * 24 * 30)))).toFixed(2)
          : 0;
        
        processedRow.quality_score = calculateQualityScore(processedRow);
        processedRow.forecast_completion = forecastCompletion(processedRow);
        
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
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling data processing');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }
      
      const fileContent = await response.text();
      console.log('CSV file loaded, processing...');
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling CSV parsing');
        return;
      }
      
      // Parse CSV using dynamic import
      const Papa = await import('papaparse');
      
      const result = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        transformHeader: (header) => {
          // Safely transform headers
          if (!header) return '';
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        }
      });
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling data processing');
        return;
      }
      
      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }
      
      // Process data with error handling
      const processedData = processData(result.data);
      console.log(`Processed ${processedData.length} records`);
      
      // Log health status distribution for debugging
      const healthDistribution = processedData.reduce((acc, item) => {
        acc[item.health_status] = (acc[item.health_status] || 0) + 1;
        return acc;
      }, {});
      console.log('Health Status Distribution:', healthDistribution);
      
      // Calculate data statistics
      const stats = {
        totalRecords: processedData.length,
        dateRange: {
          earliest: processedData
            .filter(d => d.date_award)
            .reduce((min, d) => {
              try {
                const date = new Date(d.date_award);
                return date < min ? date : min;
              } catch {
                return min;
              }
            }, new Date()),
          latest: new Date()
        },
        completenessScore: calculateDataCompleteness(processedData),
        lastUpdate: new Date(),
        healthDistribution
      };
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, not updating state');
        return;
      }
      
      setRawData(processedData);
      setDataStats(stats);
      setLastUpdate(new Date());
      setLoading(false);
      retryCount.current = 0;
      
      return processedData;
      
    } catch (err) {
      if (!isMountedRef.current) {
        console.log('Component unmounted, ignoring error');
        return;
      }
      
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
      'executive_agency', 'sanctioned_amount', 'physical_progress'
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

  // Get aggregate statistics with safe string handling
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
        const workSite = safeString(item.work_site);
        const location = workSite ? workSite.split(',')[0].trim() : 'Unknown';
        
        if (!locations[location]) {
          locations[location] = {
            count: 0,
            totalBudget: 0,
            coords: null,
            projects: []
          };
        }
        
        locations[location].count++;
        locations[location].totalBudget += item.sanctioned_amount || 0;
        locations[location].projects.push(item.id);
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
    
    // NEW: Aggregate by health status
    const aggregateByHealthStatus = (data) => {
      const healthGroups = {
        'PERFECT_PACE': { count: 0, projects: [] },
        'SLOW_PACE': { count: 0, projects: [] },
        'BAD_PACE': { count: 0, projects: [] },
        'SLEEP_PACE': { count: 0, projects: [] },
        'PAYMENT_PENDING': { count: 0, projects: [] },
        'NOT_APPLICABLE': { count: 0, projects: [] }
      };
      
      data.forEach(item => {
        const status = item.health_status || 'NOT_APPLICABLE';
        if (healthGroups[status]) {
          healthGroups[status].count++;
          healthGroups[status].projects.push(item.id);
        }
      });
      
      return healthGroups;
    };
    
    // NEW: Aggregate by progress category
    const aggregateByProgressCategory = (data) => {
      const categories = {};
      
      data.forEach(item => {
        const category = item.progress_category || 'UNKNOWN';
        if (!categories[category]) {
          categories[category] = { count: 0, projects: [] };
        }
        categories[category].count++;
        categories[category].projects.push(item.id);
      });
      
      return categories;
    };
    
    return {
      byAgency: aggregateByField(rawData, 'executive_agency'),
      byBudgetHead: aggregateByField(rawData, 'budget_head'),
      byRiskLevel: aggregateByField(rawData, 'risk_level'),
      byStatus: aggregateByField(rawData, 'status'),
      byLocation: aggregateByLocation(rawData),
      byContractor: aggregateByField(rawData, 'firm_name'),
      timeline: generateTimelineStats(rawData),
      byHealthStatus: aggregateByHealthStatus(rawData),
      byProgressCategory: aggregateByProgressCategory(rawData)
    };
  }, [rawData]);

  // Initial data load
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    // Cleanup on unmount
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