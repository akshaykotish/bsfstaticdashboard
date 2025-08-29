import { useState, useEffect, useCallback, useRef } from 'react';

// Helper functions for data processing
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

const calculateRiskLevel = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
  const delay = calculateDelay(row);
  const efficiency = calculateEfficiency(row);
  
  if (delay > 180 || (progress < 30 && delay > 90) || efficiency < 30) return 'CRITICAL';
  if (delay > 90 || (progress < 50 && delay > 30) || efficiency < 50) return 'HIGH';
  if (delay > 30 || progress < 70 || efficiency < 70) return 'MEDIUM';
  return 'LOW';
};

const determinePriority = (row) => {
  const amount = parseFloat(row.sanctioned_amount) || 0;
  const progress = parseFloat(row.physical_progress) || 0;
  const delay = calculateDelay(row);
  
  if (amount > 10000 || (progress < 30 && amount > 5000) || delay > 90) return 'HIGH';
  if (amount > 5000 || (progress < 50 && amount > 2500) || delay > 30) return 'MEDIUM';
  return 'LOW';
};

const calculateHealthScore = (row) => {
  const progress = parseFloat(row.physical_progress) || 0;
  const efficiency = calculateEfficiency(row);
  const delayPenalty = Math.min(30, calculateDelay(row) / 6);
  return Math.max(0, (progress * 0.4 + efficiency * 0.4 - delayPenalty + 20));
};

const determineStatus = (progress) => {
  if (progress >= 100) return 'COMPLETED';
  if (progress > 75) return 'NEAR_COMPLETION';
  if (progress > 50) return 'ADVANCED';
  if (progress > 25) return 'IN_PROGRESS';
  if (progress > 0) return 'INITIAL';
  return 'NOT_STARTED';
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

  // Process raw CSV data
  const processData = useCallback((data) => {
    return data
      .filter(row => row.serial_no && row.scheme_name)
      .map((row, index) => {
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
          cleanRow[cleanKey] = row[key];
        });

        const processedRow = {
          id: index + 1,
          serial_no: cleanRow.serial_no || index + 1,
          budget_head: cleanRow.budget_head || 'N/A',
          scheme_name: cleanRow.scheme_name || 'Unnamed Scheme',
          ftr_hq: cleanRow.ftr_hq || 'Unknown',
          shq: cleanRow.shq || 'Unknown',
          work_site: cleanRow.work_site || 'Unknown Location',
          executive_agency: cleanRow.executive_agency || 'Unknown Agency',
          sanctioned_amount: parseFloat(cleanRow.sanctioned_amount) || 0,
          date_award: cleanRow.date_award || '',
          date_tender: cleanRow.date_tender || '',
          pdc_agreement: cleanRow.pdc_agreement || '',
          revised_pdc: cleanRow.revised_pdc || '',
          actual_completion_date: cleanRow.actual_completion_date || '',
          firm_name: cleanRow.firm_name || 'Unknown Contractor',
          physical_progress: parseFloat(cleanRow.physical_progress) || 0,
          progress_status: cleanRow.progress_status || 'Unknown',
          expdr_upto_31mar25: parseFloat(cleanRow.expdr_upto_31mar25) || 0,
          expdr_cfy: parseFloat(cleanRow.expdr_cfy) || 0,
          total_expdr: parseFloat(cleanRow.total_expdr) || 0,
          percent_expdr: parseFloat(cleanRow.percent_expdr) || 0,
          time_allowed_days: parseInt(cleanRow.time_allowed_days) || 0,
          remarks: cleanRow.remarks || '',
          aa_es_ref: cleanRow.aa_es_ref || '',
          date_acceptance: cleanRow.date_acceptance || '',
          aa_es_pending_with: cleanRow.aa_es_pending_with || ''
        };

        processedRow.remaining_amount = processedRow.sanctioned_amount - processedRow.total_expdr;
        processedRow.efficiency_score = calculateEfficiency(processedRow);
        processedRow.delay_days = calculateDelay(processedRow);
        processedRow.risk_level = calculateRiskLevel(processedRow);
        processedRow.priority = determinePriority(processedRow);
        processedRow.health_score = calculateHealthScore(processedRow);
        processedRow.status = determineStatus(processedRow.physical_progress);
        
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
    // Don't start if component is unmounted
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use fetch to get the CSV file
      const response = await fetch('/engineering.csv', {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,application/csv,text/plain'
        }
      });
      
      // Check if component is still mounted after fetch
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling data processing');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }
      

      const fileContent = await response.text();
      console.log(fileContent);

      
      // Check again if component is still mounted
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
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
      });
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, cancelling data processing');
        return;
      }
      
      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }
      
      // Process data
      const processedData = processData(result.data);
      
      // Calculate data statistics
      const stats = {
        totalRecords: processedData.length,
        dateRange: {
          earliest: processedData
            .filter(d => d.date_award)
            .reduce((min, d) => {
              const date = new Date(d.date_award);
              return date < min ? date : min;
            }, new Date()),
          latest: new Date()
        },
        completenessScore: calculateDataCompleteness(processedData),
        lastUpdate: new Date()
      };
      
      // Final check before updating state
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
      // Only handle errors if component is still mounted
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
    if (data.length === 0) return 0;
    
    const requiredFields = [
      'serial_no', 'scheme_name', 'budget_head', 'work_site',
      'executive_agency', 'sanctioned_amount', 'physical_progress'
    ];
    
    let totalCompleteness = 0;
    data.forEach(row => {
      const filledFields = requiredFields.filter(field => row[field] && row[field] !== 'N/A').length;
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
    if (rawData.length === 0) return null;
    
    const aggregateByField = (data, field) => {
      const grouped = {};
      
      data.forEach(item => {
        const key = item[field] || 'Unknown';
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
        grouped[key].totalBudget += item.sanctioned_amount;
        grouped[key].totalExpenditure += item.total_expdr;
        grouped[key].avgProgress += item.physical_progress;
        grouped[key].avgEfficiency += item.efficiency_score;
        grouped[key].projects.push(item.id);
      });
      
      Object.keys(grouped).forEach(key => {
        grouped[key].avgProgress /= grouped[key].count;
        grouped[key].avgEfficiency /= grouped[key].count;
      });
      
      return grouped;
    };

    const aggregateByLocation = (data) => {
      const locations = {};
      
      data.forEach(item => {
        const location = item.work_site?.split(',')[0]?.trim() || 'Unknown';
        if (!locations[location]) {
          locations[location] = {
            count: 0,
            totalBudget: 0,
            coords: null,
            projects: []
          };
        }
        
        locations[location].count++;
        locations[location].totalBudget += item.sanctioned_amount;
        locations[location].projects.push(item.id);
      });
      
      return locations;
    };

    const generateTimelineStats = (data) => {
      const timeline = {};
      
      data.forEach(item => {
        if (item.date_award) {
          const date = new Date(item.date_award);
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
          timeline[monthKey].budget += item.sanctioned_amount;
          timeline[monthKey].expenditure += item.total_expdr;
          
          if (item.physical_progress >= 100) {
            timeline[monthKey].completed++;
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
      byContractor: aggregateByField(rawData, 'firm_name'),
      timeline: generateTimelineStats(rawData)
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