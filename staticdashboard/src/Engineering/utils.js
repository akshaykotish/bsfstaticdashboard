// Calculate project metrics
export const calculateMetrics = (filteredData) => {
  const total = filteredData.length;
  if (total === 0) {
    return {
      totalProjects: 0,
      totalSanctionedCr: 0,
      totalExpenditureCr: 0,
      remainingBudgetCr: 0,
      avgProgress: 0,
      avgEfficiency: 0,
      avgHealthScore: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      critical: 0,
      delayed: 0,
      onTrack: 0,
      utilizationRate: 0,
      completionRate: 0,
      delayRate: 0,
      criticalRate: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      activeAgencies: 0,
      totalContractors: 0,
      totalLocations: 0,
      avgDuration: 0,
      completedThisMonth: 0,
      completedThisQuarter: 0,
      completedThisYear: 0,
      delayedUnder30: 0,
      delayed30to90: 0,
      delayedOver90: 0
    };
  }

  const totalSanctioned = filteredData.reduce((sum, item) => sum + (item.sanctioned_amount || 0), 0);
  const totalExpenditure = filteredData.reduce((sum, item) => sum + (item.total_expdr || 0), 0);
  const avgProgress = filteredData.reduce((sum, item) => sum + (item.physical_progress || 0), 0) / total;
  const avgEfficiency = filteredData.reduce((sum, item) => sum + (item.efficiency_score || 0), 0) / total;
  const avgHealthScore = filteredData.reduce((sum, item) => sum + (item.health_score || 0), 0) / total;
  
  const completed = filteredData.filter(item => item.physical_progress >= 100).length;
  const ongoing = filteredData.filter(item => item.physical_progress > 0 && item.physical_progress < 100).length;
  const notStarted = filteredData.filter(item => item.physical_progress === 0).length;
  
  const critical = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
  const highRisk = filteredData.filter(item => item.risk_level === 'HIGH').length;
  const mediumRisk = filteredData.filter(item => item.risk_level === 'MEDIUM').length;
  const lowRisk = filteredData.filter(item => item.risk_level === 'LOW').length;
  
  const delayed = filteredData.filter(item => item.delay_days > 0).length;
  const onTrack = filteredData.filter(item => item.delay_days === 0 && item.physical_progress > 0).length;
  
  const delayedUnder30 = filteredData.filter(item => item.delay_days > 0 && item.delay_days <= 30).length;
  const delayed30to90 = filteredData.filter(item => item.delay_days > 30 && item.delay_days <= 90).length;
  const delayedOver90 = filteredData.filter(item => item.delay_days > 90).length;
  
  // Calculate unique counts
  const uniqueAgencies = new Set(filteredData.map(item => item.executive_agency).filter(Boolean));
  const uniqueContractors = new Set(filteredData.map(item => item.firm_name).filter(Boolean));
  const uniqueLocations = new Set(filteredData.map(item => item.work_site?.split(',')[0]).filter(Boolean));
  
  // Calculate average duration
  const avgDuration = filteredData
    .filter(item => item.time_allowed_days)
    .reduce((sum, item) => sum + item.time_allowed_days, 0) / 
    filteredData.filter(item => item.time_allowed_days).length || 0;
  
  // Calculate recent completions
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const completedThisMonth = filteredData.filter(item => {
    if (item.physical_progress < 100 || !item.actual_completion_date) return false;
    const completionDate = new Date(item.actual_completion_date);
    return completionDate.getMonth() === thisMonth && completionDate.getFullYear() === thisYear;
  }).length;
  
  const completedThisQuarter = filteredData.filter(item => {
    if (item.physical_progress < 100 || !item.actual_completion_date) return false;
    const completionDate = new Date(item.actual_completion_date);
    const quarter = Math.floor(completionDate.getMonth() / 3);
    const currentQuarter = Math.floor(thisMonth / 3);
    return quarter === currentQuarter && completionDate.getFullYear() === thisYear;
  }).length;
  
  const completedThisYear = filteredData.filter(item => {
    if (item.physical_progress < 100 || !item.actual_completion_date) return false;
    const completionDate = new Date(item.actual_completion_date);
    return completionDate.getFullYear() === thisYear;
  }).length;
  
  return {
    totalProjects: total,
    totalSanctionedCr: totalSanctioned / 10000,
    totalExpenditureCr: totalExpenditure / 10000,
    remainingBudgetCr: (totalSanctioned - totalExpenditure) / 10000,
    avgProgress: avgProgress.toFixed(1),
    avgEfficiency: avgEfficiency.toFixed(1),
    avgHealthScore: avgHealthScore.toFixed(1),
    completed,
    ongoing,
    notStarted,
    critical,
    highRisk,
    mediumRisk,
    lowRisk,
    delayed,
    onTrack,
    utilizationRate: totalSanctioned ? ((totalExpenditure / totalSanctioned) * 100).toFixed(1) : 0,
    completionRate: total ? ((completed / total) * 100).toFixed(1) : 0,
    delayRate: total ? ((delayed / total) * 100).toFixed(1) : 0,
    criticalRate: total ? ((critical / total) * 100).toFixed(1) : 0,
    activeAgencies: uniqueAgencies.size,
    totalContractors: uniqueContractors.size,
    totalLocations: uniqueLocations.size,
    avgDuration: Math.round(avgDuration),
    completedThisMonth,
    completedThisQuarter,
    completedThisYear,
    delayedUnder30,
    delayed30to90,
    delayedOver90
  };
};

// Export data in various formats
export const exportData = (data, format = 'csv', metrics = null) => {
  switch(format) {
    case 'csv':
      exportCSV(data);
      break;
    case 'json':
      exportJSON(data, metrics);
      break;
    case 'xlsx':
      exportExcel(data, metrics);
      break;
    default:
      exportCSV(data);
  }
};

const exportCSV = (data) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  downloadFile(csvContent, 'engineering-data.csv', 'text/csv');
};

const exportJSON = (data, metrics) => {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      metrics: metrics
    },
    data: data
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, 'engineering-data.json', 'application/json');
};

const exportExcel = (data, metrics) => {
  // For Excel export, we'll create a simple HTML table that Excel can read
  let htmlContent = '<html><head><meta charset="utf-8"></head><body>';
  
  // Add metrics summary if available
  if (metrics) {
    htmlContent += '<h2>Engineering Dashboard Summary</h2>';
    htmlContent += '<table border="1"><tbody>';
    htmlContent += `<tr><td>Total Projects</td><td>${metrics.totalProjects}</td></tr>`;
    htmlContent += `<tr><td>Total Budget (Cr)</td><td>${metrics.totalSanctionedCr.toFixed(2)}</td></tr>`;
    htmlContent += `<tr><td>Completion Rate</td><td>${metrics.completionRate}%</td></tr>`;
    htmlContent += `<tr><td>Critical Projects</td><td>${metrics.critical}</td></tr>`;
    htmlContent += '</tbody></table><br/><br/>';
  }
  
  // Add data table
  htmlContent += '<h2>Project Details</h2>';
  htmlContent += '<table border="1"><thead><tr>';
  
  const headers = Object.keys(data[0]);
  headers.forEach(header => {
    htmlContent += `<th>${header}</th>`;
  });
  htmlContent += '</tr></thead><tbody>';
  
  data.forEach(row => {
    htmlContent += '<tr>';
    headers.forEach(header => {
      htmlContent += `<td>${row[header] ?? ''}</td>`;
    });
    htmlContent += '</tr>';
  });
  
  htmlContent += '</tbody></table></body></html>';
  
  downloadFile(htmlContent, 'engineering-data.xls', 'application/vnd.ms-excel');
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Print report
export const printReport = (data, metrics, activeTab) => {
  const printWindow = window.open('', '_blank');
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Engineering Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #f97316; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f97316; color: white; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #f97316; }
        .metric-label { color: #666; font-size: 14px; }
        @media print { 
          body { padding: 10px; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <h1>Engineering Analytics Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <p>Report Type: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis</p>
      
      <h2>Key Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Projects</div>
          <div class="metric-value">${metrics.totalProjects}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Budget</div>
          <div class="metric-value">₹${metrics.totalSanctionedCr.toFixed(2)} Cr</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Completion Rate</div>
          <div class="metric-value">${metrics.completionRate}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Critical Projects</div>
          <div class="metric-value">${metrics.critical}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Delayed Projects</div>
          <div class="metric-value">${metrics.delayed}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average Progress</div>
          <div class="metric-value">${metrics.avgProgress}%</div>
        </div>
      </div>
      
      <div class="page-break"></div>
      
      <h2>Project Details (Top 50)</h2>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Scheme Name</th>
            <th>Location</th>
            <th>Agency</th>
            <th>Budget (L)</th>
            <th>Progress (%)</th>
            <th>Risk Level</th>
            <th>Delay (days)</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add top 50 projects to the report
  data.slice(0, 50).forEach(project => {
    htmlContent += `
      <tr>
        <td>${project.serial_no}</td>
        <td>${project.scheme_name}</td>
        <td>${project.work_site}</td>
        <td>${project.executive_agency}</td>
        <td>₹${(project.sanctioned_amount / 100).toFixed(2)}</td>
        <td>${project.physical_progress}%</td>
        <td>${project.risk_level}</td>
        <td>${project.delay_days}</td>
      </tr>
    `;
  });
  
  htmlContent += `
        </tbody>
      </table>
      
      <p style="margin-top: 30px; text-align: center; color: #666;">
        End of Report - Total Records: ${data.length}
      </p>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};

// Format currency
export const formatCurrency = (value, decimals = 2) => {
  if (!value) return '₹0';
  return `₹${(value / 100).toFixed(decimals)}L`;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (!value) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    COMPLETED: 'text-green-600',
    NEAR_COMPLETION: 'text-blue-600',
    ADVANCED: 'text-cyan-600',
    IN_PROGRESS: 'text-orange-600',
    INITIAL: 'text-yellow-600',
    NOT_STARTED: 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
};

// Get risk color
export const getRiskColor = (level) => {
  const colors = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LOW: 'bg-green-100 text-green-700 border-green-300'
  };
  return colors[level] || 'bg-gray-100 text-gray-700 border-gray-300';
};

// Calculate trend
export const calculateTrend = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue * 100).toFixed(1);
};

// Group data by field
export const groupBy = (data, field) => {
  return data.reduce((groups, item) => {
    const key = item[field] || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

// Sort data
export const sortData = (data, key, direction = 'asc') => {
  return [...data].sort((a, b) => {
    const aVal = a[key] || 0;
    const bVal = b[key] || 0;
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validate date range
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

// Parse CSV date
export const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Calculate project age
export const calculateProjectAge = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get quarter from date
export const getQuarter = (date) => {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};