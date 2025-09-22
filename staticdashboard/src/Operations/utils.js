// Calculate Operations project metrics
export const calculateMetrics = (filteredData) => {
  const total = filteredData.length;
  if (total === 0) {
    return {
      totalWorks: 0,
      totalSanctionedCr: 0,
      totalSpentCr: 0,
      remainingBudgetCr: 0,
      avgProgress: 0,
      avgEfficiency: 0,
      completedWorks: 0,
      ongoingWorks: 0,
      notStartedWorks: 0,
      criticalProjects: 0,
      onTrackProjects: 0,
      utilizationRate: 0,
      completionRate: 0,
      criticalRate: 0,
      highRiskProjects: 0,
      mediumRiskProjects: 0,
      lowRiskProjects: 0,
      totalFrontiers: 0,
      totalSectorHQs: 0,
      totalWorkTypes: 0,
      avgLengthKm: 0,
      totalUnitsAOR: 0,
      overdueProjects: 0,
      nearPDCProjects: 0,
      urgentPriority: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      bopProjects: 0,
      fencingProjects: 0,
      roadProjects: 0,
      bridgeProjects: 0,
      infrastructureProjects: 0
    };
  }

  // Calculate financial totals (already in Crores)
  const totalSanctioned = filteredData.reduce((sum, item) => sum + (item.sanctioned_amount_cr || 0), 0);
  const totalSpent = filteredData.reduce((sum, item) => sum + (item.spent_amount_cr || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (item.remaining_amount_cr || 0), 0);
  
  // Calculate progress metrics (percentage is stored as decimal)
  const avgProgress = filteredData.reduce((sum, item) => sum + ((item.completed_percentage || 0) * 100), 0) / total;
  const avgEfficiency = filteredData.reduce((sum, item) => sum + (item.efficiency_score || 0), 0) / total;
  
  // Count by completion status
  const completedWorks = filteredData.filter(item => item.completion_status === 'COMPLETED').length;
  const ongoingWorks = filteredData.filter(item => 
    item.completion_status && !['COMPLETED', 'NOT_STARTED'].includes(item.completion_status)
  ).length;
  const notStartedWorks = filteredData.filter(item => item.completion_status === 'NOT_STARTED').length;
  
  // Count by risk level
  const criticalProjects = filteredData.filter(item => item.risk_level === 'CRITICAL').length;
  const highRiskProjects = filteredData.filter(item => item.risk_level === 'HIGH').length;
  const mediumRiskProjects = filteredData.filter(item => item.risk_level === 'MEDIUM').length;
  const lowRiskProjects = filteredData.filter(item => item.risk_level === 'LOW').length;
  
  // Count by project health
  const onTrackProjects = filteredData.filter(item => item.project_health === 'ON_TRACK').length;
  
  // Count by priority
  const urgentPriority = filteredData.filter(item => item.priority === 'URGENT').length;
  const highPriority = filteredData.filter(item => item.priority === 'HIGH').length;
  const mediumPriority = filteredData.filter(item => item.priority === 'MEDIUM').length;
  const lowPriority = filteredData.filter(item => item.priority === 'LOW').length;
  
  // Count by work category
  const bopProjects = filteredData.filter(item => item.work_category === 'BORDER_OUTPOST').length;
  const fencingProjects = filteredData.filter(item => item.work_category === 'FENCING').length;
  const roadProjects = filteredData.filter(item => item.work_category === 'ROAD').length;
  const bridgeProjects = filteredData.filter(item => item.work_category === 'BRIDGE').length;
  const infrastructureProjects = filteredData.filter(item => item.work_category === 'INFRASTRUCTURE').length;
  
  // Count PDC status
  const overdueProjects = filteredData.filter(item => item.days_to_pdc < 0).length;
  const nearPDCProjects = filteredData.filter(item => item.days_to_pdc >= 0 && item.days_to_pdc <= 90).length;
  
  // Calculate unique counts
  const uniqueFrontiers = new Set(filteredData.map(item => item.frontier).filter(Boolean));
  const uniqueSectorHQs = new Set(filteredData.map(item => item.sector_hq).filter(Boolean));
  const uniqueWorkTypes = new Set(filteredData.map(item => item.work_type).filter(Boolean));
  
  // Calculate average length and total units
  const avgLengthKm = filteredData
    .filter(item => item.length_km)
    .reduce((sum, item) => sum + item.length_km, 0) / 
    filteredData.filter(item => item.length_km).length || 0;
  
  const totalUnitsAOR = filteredData.reduce((sum, item) => sum + (item.units_aor || 0), 0);
  
  return {
    totalWorks: total,
    totalSanctionedCr: totalSanctioned,
    totalSpentCr: totalSpent,
    remainingBudgetCr: totalRemaining,
    avgProgress: avgProgress.toFixed(1),
    avgEfficiency: avgEfficiency.toFixed(1),
    completedWorks,
    ongoingWorks,
    notStartedWorks,
    criticalProjects,
    highRiskProjects,
    mediumRiskProjects,
    lowRiskProjects,
    onTrackProjects,
    utilizationRate: totalSanctioned ? ((totalSpent / totalSanctioned) * 100).toFixed(1) : 0,
    completionRate: total ? ((completedWorks / total) * 100).toFixed(1) : 0,
    criticalRate: total ? ((criticalProjects / total) * 100).toFixed(1) : 0,
    totalFrontiers: uniqueFrontiers.size,
    totalSectorHQs: uniqueSectorHQs.size,
    totalWorkTypes: uniqueWorkTypes.size,
    avgLengthKm: avgLengthKm.toFixed(1),
    totalUnitsAOR,
    overdueProjects,
    nearPDCProjects,
    urgentPriority,
    highPriority,
    mediumPriority,
    lowPriority,
    bopProjects,
    fencingProjects,
    roadProjects,
    bridgeProjects,
    infrastructureProjects
  };
};

// Export Operations data in various formats
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
  
  downloadFile(csvContent, 'operations-data.csv', 'text/csv');
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
  downloadFile(jsonContent, 'operations-data.json', 'application/json');
};

const exportExcel = (data, metrics) => {
  // For Excel export, we'll create a simple HTML table that Excel can read
  let htmlContent = '<html><head><meta charset="utf-8"></head><body>';
  
  // Add metrics summary if available
  if (metrics) {
    htmlContent += '<h2>Operations Dashboard Summary</h2>';
    htmlContent += '<table border="1"><tbody>';
    htmlContent += `<tr><td>Total Works</td><td>${metrics.totalWorks}</td></tr>`;
    htmlContent += `<tr><td>Total Budget (Cr)</td><td>${metrics.totalSanctionedCr.toFixed(2)}</td></tr>`;
    htmlContent += `<tr><td>Total Spent (Cr)</td><td>${metrics.totalSpentCr.toFixed(2)}</td></tr>`;
    htmlContent += `<tr><td>Completion Rate</td><td>${metrics.completionRate}%</td></tr>`;
    htmlContent += `<tr><td>Critical Projects</td><td>${metrics.criticalProjects}</td></tr>`;
    htmlContent += `<tr><td>Overdue Projects</td><td>${metrics.overdueProjects}</td></tr>`;
    htmlContent += '</tbody></table><br/><br/>';
  }
  
  // Add data table
  htmlContent += '<h2>Operations Details</h2>';
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
  
  downloadFile(htmlContent, 'operations-data.xls', 'application/vnd.ms-excel');
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

// Print Operations report
export const printReport = (data, metrics, activeTab) => {
  const printWindow = window.open('', '_blank');
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Operations Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #2563eb; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #2563eb; color: white; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { color: #666; font-size: 14px; }
        @media print { 
          body { padding: 10px; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <h1>Border Operations Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <p>Report Type: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis</p>
      
      <h2>Key Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Works</div>
          <div class="metric-value">${metrics.totalWorks}</div>
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
          <div class="metric-value">${metrics.criticalProjects}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Overdue Projects</div>
          <div class="metric-value">${metrics.overdueProjects}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average Progress</div>
          <div class="metric-value">${metrics.avgProgress}%</div>
        </div>
      </div>
      
      <div class="page-break"></div>
      
      <h2>Work Categories</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Border Outposts (BOP)</td><td>${metrics.bopProjects}</td></tr>
          <tr><td>Fencing</td><td>${metrics.fencingProjects}</td></tr>
          <tr><td>Roads</td><td>${metrics.roadProjects}</td></tr>
          <tr><td>Bridges</td><td>${metrics.bridgeProjects}</td></tr>
          <tr><td>Infrastructure</td><td>${metrics.infrastructureProjects}</td></tr>
        </tbody>
      </table>
      
      <h2>Operations Details (Top 50)</h2>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Work Name</th>
            <th>Type</th>
            <th>Frontier</th>
            <th>Sector HQ</th>
            <th>Budget (Cr)</th>
            <th>Progress (%)</th>
            <th>Risk Level</th>
            <th>Days to PDC</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add top 50 projects to the report
  data.slice(0, 50).forEach(project => {
    htmlContent += `
      <tr>
        <td>${project.s_no}</td>
        <td>${project.name_of_work}</td>
        <td>${project.work_type}</td>
        <td>${project.frontier}</td>
        <td>${project.sector_hq}</td>
        <td>₹${project.sanctioned_amount_cr?.toFixed(2) || 0}</td>
        <td>${((project.completed_percentage || 0) * 100).toFixed(0)}%</td>
        <td>${project.risk_level}</td>
        <td>${project.days_to_pdc || 0}</td>
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

// Format currency in Crores
export const formatCurrency = (value, decimals = 2) => {
  if (!value) return '₹0';
  return `₹${value.toFixed(decimals)} Cr`;
};

// Format percentage (Operations data has percentage as decimal)
export const formatPercentage = (value, decimals = 1) => {
  if (!value) return '0%';
  // Check if value is already a percentage or decimal
  const percentValue = value <= 1 ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
};

// Get completion status color
export const getStatusColor = (status) => {
  const colors = {
    COMPLETED: 'text-green-600',
    NEAR_COMPLETION: 'text-indigo-600',
    ADVANCED: 'text-blue-600',
    IN_PROGRESS: 'text-yellow-600',
    INITIAL: 'text-orange-600',
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

// Get project health color
export const getHealthColor = (health) => {
  const colors = {
    ON_TRACK: 'text-green-600',
    MINOR_DELAY: 'text-yellow-600',
    MODERATE_DELAY: 'text-orange-600',
    SEVERE_DELAY: 'text-red-600'
  };
  return colors[health] || 'text-gray-600';
};

// Get work category icon name
export const getWorkCategoryIcon = (category) => {
  const icons = {
    BORDER_OUTPOST: 'Shield',
    FENCING: 'Box',
    ROAD: 'Route',
    BRIDGE: 'Bridge',
    INFRASTRUCTURE: 'Building',
    OTHER: 'MoreHorizontal'
  };
  return icons[category] || 'MoreHorizontal';
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

// Parse Operations date format (e.g., "June' 2025", "Dec'2025")
export const parseOperationsDate = (dateString) => {
  if (!dateString || dateString === '') return null;
  
  const cleanString = dateString.replace(/'/g, ' ').trim();
  const parts = cleanString.split(' ');
  
  if (parts.length >= 2) {
    const monthMap = {
      'Jan': 0, 'January': 0,
      'Feb': 1, 'February': 1,
      'Mar': 2, 'March': 2,
      'Apr': 3, 'April': 3,
      'May': 4,
      'Jun': 5, 'June': 5,
      'Jul': 6, 'July': 6,
      'Aug': 7, 'August': 7,
      'Sep': 8, 'September': 8,
      'Oct': 9, 'October': 9,
      'Nov': 10, 'November': 10,
      'Dec': 11, 'December': 11
    };
    
    const monthName = parts[0].replace(/[^a-zA-Z]/g, '');
    const year = parseInt(parts[parts.length - 1]);
    
    if (monthMap[monthName] !== undefined && !isNaN(year)) {
      return new Date(year, monthMap[monthName], 1);
    }
  }
  
  return null;
};

// Format Operations date for display
export const formatOperationsDate = (dateString) => {
  const date = parseOperationsDate(dateString);
  if (!date) return dateString || 'N/A';
  
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric'
  });
};

// Calculate days to PDC
export const calculateDaysToPDC = (pdcDateString) => {
  const pdcDate = parseOperationsDate(pdcDateString);
  if (!pdcDate) return null;
  
  const currentDate = new Date();
  const diffTime = pdcDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Get quarter from date
export const getQuarter = (date) => {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
};

// Calculate work duration
export const calculateWorkDuration = (sdcDateString, pdcDateString) => {
  const sdcDate = parseOperationsDate(sdcDateString);
  const pdcDate = parseOperationsDate(pdcDateString);
  
  if (!sdcDate || !pdcDate) return null;
  
  const diffTime = Math.abs(pdcDate - sdcDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Check if date is in range
export const isDateInRange = (dateString, startDate, endDate) => {
  const date = parseOperationsDate(dateString);
  if (!date) return false;
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (start && end) {
    return date >= start && date <= end;
  } else if (start) {
    return date >= start;
  } else if (end) {
    return date <= end;
  }
  return true;
};