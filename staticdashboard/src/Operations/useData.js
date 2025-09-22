import { useState, useEffect, useCallback, useRef } from 'react';

// Helper functions for Operations-specific data processing

// Calculate completion status based on percentage
const calculateCompletionStatus = (row) => {
  const percentage = parseFloat(row.completed_percentage) || 0;
  
  if (percentage === 0) return 'NOT_STARTED';
  if (percentage < 0.25) return 'INITIAL';
  if (percentage < 0.5) return 'IN_PROGRESS';
  if (percentage < 0.75) return 'ADVANCED';
  if (percentage < 1.0) return 'NEAR_COMPLETION';
  if (percentage >= 1.0) return 'COMPLETED';
  
  return 'UNKNOWN';
};

// Calculate project health based on completion and timeline
const calculateProjectHealth = (row) => {
  const completionPercentage = parseFloat(row.completed_percentage) || 0;
  const currentDate = new Date();
  
  // Parse PDC date
  let pdcDate = null;
  if (row.pdc) {
    // Handle various date formats (e.g., "June' 2025", "Dec'2025")
    const pdcString = row.pdc.replace(/'/g, ' ').trim();
    const monthYear = pdcString.split(' ');
    
    if (monthYear.length >= 2) {
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'June': 5,
        'Jul': 6, 'July': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const monthName = monthYear[0].replace(/[^a-zA-Z]/g, '');
      const year = parseInt(monthYear[monthYear.length - 1]);
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        pdcDate = new Date(year, monthMap[monthName], 1);
      }
    }
  }
  
  // Calculate expected progress based on time elapsed
  let expectedProgress = 0;
  if (pdcDate && row.sdc) {
    const sdcString = row.sdc.replace(/'/g, ' ').trim();
    const sdcMonthYear = sdcString.split(' ');
    
    if (sdcMonthYear.length >= 2) {
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'June': 5,
        'Jul': 6, 'July': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const monthName = sdcMonthYear[0].replace(/[^a-zA-Z]/g, '');
      const year = parseInt(sdcMonthYear[sdcMonthYear.length - 1]);
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        const sdcDate = new Date(year, monthMap[monthName], 1);
        const totalDuration = pdcDate - sdcDate;
        const elapsedTime = currentDate - sdcDate;
        
        if (totalDuration > 0) {
          expectedProgress = Math.min(1.0, Math.max(0, elapsedTime / totalDuration));
        }
      }
    }
  }
  
  // Determine health status based on actual vs expected progress
  const progressDifference = completionPercentage - expectedProgress;
  
  if (progressDifference >= 0) {
    return 'ON_TRACK';
  } else if (progressDifference >= -0.1) {
    return 'MINOR_DELAY';
  } else if (progressDifference >= -0.25) {
    return 'MODERATE_DELAY';
  } else {
    return 'SEVERE_DELAY';
  }
};

// Calculate risk level based on various factors
const calculateRiskLevel = (row) => {
  const completionPercentage = parseFloat(row.completed_percentage) || 0;
  const health = calculateProjectHealth(row);
  const amount = parseFloat(row.sanctioned_amount_cr) || 0;
  
  // High-value projects have higher inherent risk
  const amountRisk = amount > 100 ? 2 : amount > 50 ? 1 : 0;
  
  // Health-based risk
  const healthRisk = {
    'ON_TRACK': 0,
    'MINOR_DELAY': 1,
    'MODERATE_DELAY': 2,
    'SEVERE_DELAY': 3
  }[health] || 0;
  
  // Completion-based risk (projects stuck at low completion are risky)
  const completionRisk = completionPercentage < 0.25 && health === 'SEVERE_DELAY' ? 2 : 0;
  
  const totalRisk = amountRisk + healthRisk + completionRisk;
  
  if (totalRisk >= 5) return 'CRITICAL';
  if (totalRisk >= 3) return 'HIGH';
  if (totalRisk >= 1) return 'MEDIUM';
  return 'LOW';
};

// Calculate priority based on multiple factors
const calculatePriority = (row) => {
  const workType = row.work_type || '';
  const amount = parseFloat(row.sanctioned_amount_cr) || 0;
  const completionPercentage = parseFloat(row.completed_percentage) || 0;
  const risk = calculateRiskLevel(row);
  
  // Border-related works get higher priority
  const isHighPriorityType = ['BOP', 'BORDER_FENCE', 'ROAD'].includes(workType.toUpperCase());
  
  if (isHighPriorityType && (amount > 50 || risk === 'CRITICAL')) {
    return 'URGENT';
  } else if (amount > 75 || risk === 'HIGH') {
    return 'HIGH';
  } else if (amount > 25 || completionPercentage > 0.5) {
    return 'MEDIUM';
  }
  return 'LOW';
};

// Parse HLEC year information
const parseHLECInfo = (hlecString) => {
  if (!hlecString) return { meeting: null, year: null };
  
  // Format: "52nd/ 2022" or "45th/ 2018"
  const parts = hlecString.split('/');
  if (parts.length >= 2) {
    const meeting = parts[0].trim();
    const year = parseInt(parts[1].trim());
    return { 
      meeting: meeting,
      year: isNaN(year) ? null : year
    };
  }
  
  return { meeting: hlecString, year: null };
};

// Calculate efficiency score
const calculateEfficiencyScore = (row) => {
  const completionPercentage = parseFloat(row.completed_percentage) || 0;
  const health = calculateProjectHealth(row);
  
  let baseScore = completionPercentage * 100;
  
  // Adjust based on health status
  const healthMultiplier = {
    'ON_TRACK': 1.2,
    'MINOR_DELAY': 1.0,
    'MODERATE_DELAY': 0.8,
    'SEVERE_DELAY': 0.6
  }[health] || 1.0;
  
  return Math.min(100, Math.max(0, baseScore * healthMultiplier));
};

// Safe string conversion helper
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

// Safe number conversion helper
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

// Main Operations data hook
export const useDataOperations = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const isMountedRef = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Process raw CSV data for Operations with CORRECT field mapping
  const processData = useCallback((data) => {
    return data
      .filter(row => row && (row.S_No || row.NAME_OF_WORK || row.s_no || row.name_of_work))
      .map((row, index) => {
        // Handle both uppercase (from CSV) and lowercase field names
        const getField = (fieldNames) => {
          for (const field of fieldNames) {
            if (row[field] !== undefined && row[field] !== null) {
              return row[field];
            }
          }
          return null;
        };
        
        // Parse HLEC information
        const hlecValue = getField(['HLEC_YEAR', 'hlec_year']);
        const hlecInfo = parseHLECInfo(hlecValue);

        // Process each field with proper type conversion
        const processedRow = {
          id: index + 1,
          s_no: safeString(getField(['S_No', 's_no']) || index + 1),
          work_type: safeString(getField(['WORK_TYPE', 'work_type']) || 'UNKNOWN'),
          source_sheet: safeString(getField(['SOURCE_SHEET', 'source_sheet']) || ''),
          name_of_work: safeString(getField(['NAME_OF_WORK', 'name_of_work']) || 'Unnamed Work'),
          frontier: safeString(getField(['FRONTIER', 'frontier']) || 'Unknown'),
          sector_hq: safeString(getField(['SECTOR_HQ', 'sector_hq']) || 'Unknown'),
          length_km: safeNumber(getField(['LENGTH_KM', 'length_km']), 0),
          units_aor: safeNumber(getField(['UNITS_AOR', 'units_aor']), 0),
          hlec_year: safeString(hlecValue || ''),
          hlec_meeting: hlecInfo.meeting,
          hlec_year_number: hlecInfo.year,
          sanctioned_amount_cr: safeNumber(getField(['SANCTIONED_AMOUNT_CR', 'sanctioned_amount_cr']), 0),
          sdc: safeString(getField(['SDC', 'sdc']) || ''),
          pdc: safeString(getField(['PDC', 'pdc']) || ''),
          completed_percentage: safeNumber(getField(['COMPLETED_PERCENTAGE', 'completed_percentage']), 0),
          remarks: safeString(getField(['REMARKS', 'remarks']) || '')
        };

        // Calculate derived fields
        processedRow.completion_status = calculateCompletionStatus(processedRow);
        processedRow.project_health = calculateProjectHealth(processedRow);
        processedRow.risk_level = calculateRiskLevel(processedRow);
        processedRow.priority = calculatePriority(processedRow);
        processedRow.efficiency_score = calculateEfficiencyScore(processedRow);
        
        // Calculate remaining amount (in crores)
        processedRow.remaining_amount_cr = processedRow.sanctioned_amount_cr * (1 - processedRow.completed_percentage);
        
        // Calculate spent amount (in crores)
        processedRow.spent_amount_cr = processedRow.sanctioned_amount_cr * processedRow.completed_percentage;
        
        // Determine work category based on work_type
        const workTypeUpper = processedRow.work_type.toUpperCase();
        if (workTypeUpper.includes('BOP')) {
          processedRow.work_category = 'BORDER_OUTPOST';
        } else if (workTypeUpper.includes('FENCE') || workTypeUpper.includes('FENCING')) {
          processedRow.work_category = 'FENCING';
        } else if (workTypeUpper.includes('ROAD')) {
          processedRow.work_category = 'ROAD';
        } else if (workTypeUpper.includes('BRIDGE')) {
          processedRow.work_category = 'BRIDGE';
        } else if (workTypeUpper.includes('BUILDING') || workTypeUpper.includes('QUARTER')) {
          processedRow.work_category = 'INFRASTRUCTURE';
        } else {
          processedRow.work_category = 'OTHER';
        }
        
        // Calculate days to PDC
        if (processedRow.pdc) {
          const currentDate = new Date();
          const pdcString = processedRow.pdc.replace(/'/g, ' ').trim();
          const monthYear = pdcString.split(' ');
          
          if (monthYear.length >= 2) {
            const monthMap = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'June': 5,
              'Jul': 6, 'July': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const monthName = monthYear[0].replace(/[^a-zA-Z]/g, '');
            const year = parseInt(monthYear[monthYear.length - 1]);
            
            if (monthMap[monthName] !== undefined && !isNaN(year)) {
              const pdcDate = new Date(year, monthMap[monthName], 1);
              const diffTime = pdcDate - currentDate;
              processedRow.days_to_pdc = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
              processedRow.days_to_pdc = null;
            }
          } else {
            processedRow.days_to_pdc = null;
          }
        } else {
          processedRow.days_to_pdc = null;
        }
        
        return processedRow;
      });
  }, []);

  // Load data from CSV using fetch with minimal logging
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try fetching from multiple paths
      let response;
      const fetchUrls = [
        '/operations.csv',
        './operations.csv',
        `${window.location.origin}/operations.csv`,
        `${window.location.protocol}//${window.location.host}/operations.csv`
      ];
      
      for (const url of fetchUrls) {
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/csv,application/csv,text/plain,*/*'
            },
            cache: 'no-cache',
            credentials: 'same-origin'
          });
          
          if (response.ok) {
            break;
          }
        } catch (fetchError) {
          // Continue to next URL
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load operations.csv. Please ensure the file exists in the public folder.`);
      }
      
      if (!isMountedRef.current) return;
      
      const fileContent = await response.text();
      
      if (!fileContent || fileContent.length === 0) {
        throw new Error('CSV file is empty');
      }
      
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
          return header.trim();
        }
      });
      
      if (!isMountedRef.current) return;
      
      // Process data
      const processedData = processData(result.data);
      
      // Calculate data statistics
      const stats = {
        totalRecords: processedData.length,
        workTypes: [...new Set(processedData.map(d => d.work_type))].length,
        frontiers: [...new Set(processedData.map(d => d.frontier))].length,
        sectorHQs: [...new Set(processedData.map(d => d.sector_hq))].length,
        totalBudgetCr: processedData.reduce((sum, d) => sum + d.sanctioned_amount_cr, 0),
        totalSpentCr: processedData.reduce((sum, d) => sum + d.spent_amount_cr, 0),
        completedProjects: processedData.filter(d => d.completion_status === 'COMPLETED').length,
        ongoingProjects: processedData.filter(d => d.completed_percentage > 0 && d.completed_percentage < 1).length,
        notStartedProjects: processedData.filter(d => d.completed_percentage === 0).length,
        averageCompletion: (processedData.reduce((sum, d) => sum + d.completed_percentage, 0) / processedData.length) * 100,
        criticalProjects: processedData.filter(d => d.risk_level === 'CRITICAL').length,
        highPriorityProjects: processedData.filter(d => d.priority === 'URGENT' || d.priority === 'HIGH').length,
        lastUpdate: new Date()
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
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => {
          if (isMountedRef.current) {
            loadData();
          }
        }, 1000 * retryCount.current);
      } else {
        setError(err.message || 'Failed to load operations data');
        setLoading(false);
      }
    }
  }, [processData]);

  // Calculate data completeness
  const calculateDataCompleteness = (data) => {
    if (!data || data.length === 0) return 0;
    
    const requiredFields = [
      's_no', 'name_of_work', 'work_type', 'frontier',
      'sector_hq', 'sanctioned_amount_cr', 'completed_percentage'
    ];
    
    let totalCompleteness = 0;
    data.forEach(row => {
      const filledFields = requiredFields.filter(field => 
        row[field] && row[field] !== '' && row[field] !== 'N/A' && row[field] !== 'Unknown'
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
            totalSpent: 0,
            avgCompletion: 0,
            avgEfficiency: 0,
            projects: []
          };
        }
        
        grouped[key].count++;
        grouped[key].totalBudget += item.sanctioned_amount_cr || 0;
        grouped[key].totalSpent += item.spent_amount_cr || 0;
        grouped[key].avgCompletion += item.completed_percentage || 0;
        grouped[key].avgEfficiency += item.efficiency_score || 0;
        grouped[key].projects.push(item.id);
      });
      
      Object.keys(grouped).forEach(key => {
        if (grouped[key].count > 0) {
          grouped[key].avgCompletion = (grouped[key].avgCompletion / grouped[key].count) * 100;
          grouped[key].avgEfficiency /= grouped[key].count;
        }
      });
      
      return grouped;
    };

    return {
      byWorkType: aggregateByField(rawData, 'work_type'),
      byFrontier: aggregateByField(rawData, 'frontier'),
      bySectorHQ: aggregateByField(rawData, 'sector_hq'),
      byWorkCategory: aggregateByField(rawData, 'work_category'),
      byRiskLevel: aggregateByField(rawData, 'risk_level'),
      byCompletionStatus: aggregateByField(rawData, 'completion_status'),
      byProjectHealth: aggregateByField(rawData, 'project_health'),
      byPriority: aggregateByField(rawData, 'priority')
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
    getAggregateStats,
    calculateDataCompleteness
  };
};