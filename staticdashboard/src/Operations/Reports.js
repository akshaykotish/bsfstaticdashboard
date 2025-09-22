//Operations/Report.js


import React, { useState, useRef, useCallback } from 'react';
import { 
  FileText, Download, Printer, Camera, FileDown,
  IndianRupee, TrendingUp, Clock, AlertTriangle, CheckCircle,
  Activity, Shield, Calendar, MapPin, Building2, Users,
  Gauge, Timer, AlertCircle, Zap, PauseCircle, CreditCard,
  Info, Target, Award, Briefcase, Hash, Package, FileCheck,
  CalendarDays, CalendarClock, CalendarCheck, CalendarX,
  GitBranch, Layers, Navigation, Globe, Heart, PlayCircle,
  XCircle, BarChart3, PieChart, LineChart, Percent, TrendingDown,
  Cross, EyeClosed, Table, ShieldCloseIcon,
  Construction, Route, Building, Box, MoreHorizontal
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Report = ({ projectData, darkMode: initialDarkMode = false, isInModal = false, onclose }) => {
  const [exporting, setExporting] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const reportRef = useRef(null);
  const cachedImageRef = useRef(null);

  // Clean and process operations data
  const cleanProjectData = (data) => {
    if (!data) return {};
    
    const cleanData = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        cleanData[key] = data[key];
      }
    });
    
    // Enrichment: Calculate derived fields if not present
    if (cleanData.sanctioned_amount_cr && cleanData.spent_amount_cr === undefined) {
      cleanData.spent_amount_cr = (cleanData.completed_percentage || 0) * cleanData.sanctioned_amount_cr;
    }
    
    if (cleanData.sanctioned_amount_cr && cleanData.spent_amount_cr) {
      cleanData.remaining_amount_cr = cleanData.sanctioned_amount_cr - cleanData.spent_amount_cr;
    }
    
    // Derive completion status if not present
    if (cleanData.completed_percentage !== undefined && !cleanData.completion_status) {
      const progress = (cleanData.completed_percentage || 0) * 100;
      if (progress === 0) cleanData.completion_status = 'NOT_STARTED';
      else if (progress < 25) cleanData.completion_status = 'INITIAL';
      else if (progress < 50) cleanData.completion_status = 'IN_PROGRESS';
      else if (progress < 75) cleanData.completion_status = 'ADVANCED';
      else if (progress < 100) cleanData.completion_status = 'NEAR_COMPLETION';
      else cleanData.completion_status = 'COMPLETED';
    }
    
    // Derive project health if not present
    if (cleanData.days_to_pdc !== undefined && !cleanData.project_health) {
      if (cleanData.days_to_pdc < -90) cleanData.project_health = 'SEVERE_DELAY';
      else if (cleanData.days_to_pdc < -30) cleanData.project_health = 'MODERATE_DELAY';
      else if (cleanData.days_to_pdc < 0) cleanData.project_health = 'MINOR_DELAY';
      else cleanData.project_health = 'ON_TRACK';
    }
    
    // Derive risk level if not present
    if (!cleanData.risk_level) {
      if (cleanData.project_health === 'SEVERE_DELAY') cleanData.risk_level = 'CRITICAL';
      else if (cleanData.project_health === 'MODERATE_DELAY') cleanData.risk_level = 'HIGH';
      else if (cleanData.project_health === 'MINOR_DELAY') cleanData.risk_level = 'MEDIUM';
      else cleanData.risk_level = 'LOW';
    }
    
    // Set default priority if not present
    if (!cleanData.priority) {
      if (cleanData.risk_level === 'CRITICAL') cleanData.priority = 'URGENT';
      else if (cleanData.risk_level === 'HIGH') cleanData.priority = 'HIGH';
      else if (cleanData.risk_level === 'MEDIUM') cleanData.priority = 'MEDIUM';
      else cleanData.priority = 'LOW';
    }
    
    // Calculate efficiency score if not present
    if (!cleanData.efficiency_score && cleanData.completed_percentage !== undefined) {
      const progress = (cleanData.completed_percentage || 0) * 100;
      const expectedProgress = 50; // Default expected progress
      cleanData.efficiency_score = Math.min(100, (progress / expectedProgress) * 100);
    }
    
    return cleanData;
  };

  const project = cleanProjectData(projectData);

  // Format Operations date
  const formatOperationsDate = (dateString) => {
    if (!dateString || dateString === '') return 'N/A';
    
    // Handle Date objects
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Handle string dates
    if (typeof dateString !== 'string') return 'N/A';
    
    const cleanString = dateString.replace(/'/g, ' ').trim();
    const parts = cleanString.split(' ');
    
    if (parts.length >= 2) {
      const monthMap = {
        'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1,
        'Mar': 2, 'March': 2, 'Apr': 3, 'April': 3,
        'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
        'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8,
        'Oct': 9, 'October': 9, 'Nov': 10, 'November': 10,
        'Dec': 11, 'December': 11
      };
      
      const monthName = parts[0].replace(/[^a-zA-Z]/g, '');
      const year = parseInt(parts[parts.length - 1]);
      
      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        const date = new Date(year, monthMap[monthName], 1);
        return date.toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        });
      }
    }
    
    return dateString;
  };

  // Calculate days to PDC
  const calculateDaysToPDC = useCallback((row) => {
    if (!row.pdc || row.pdc === '') {
      return { days: null, formatted: 'No PDC Set', status: 'no_pdc' };
    }

    try {
      const currentDate = new Date();
      const pdcString = row.pdc.replace(/'/g, ' ').trim();
      const monthYear = pdcString.split(' ');
      
      if (monthYear.length >= 2) {
        const monthMap = {
          'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1,
          'Mar': 2, 'March': 2, 'Apr': 3, 'April': 3,
          'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
          'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8,
          'Oct': 9, 'October': 9, 'Nov': 10, 'November': 10,
          'Dec': 11, 'December': 11
        };
        
        const monthName = monthYear[0].replace(/[^a-zA-Z]/g, '');
        const year = parseInt(monthYear[monthYear.length - 1]);
        
        if (monthMap[monthName] !== undefined && !isNaN(year)) {
          const pdcDate = new Date(year, monthMap[monthName], 1);
          const diffTime = pdcDate - currentDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            days: diffDays,
            formatted: diffDays < 0 ? `${Math.abs(diffDays)} days overdue` : `${diffDays} days remaining`,
            status: diffDays < 0 ? 'overdue' : 'on_track'
          };
        }
      }
      
      return { days: null, formatted: 'Invalid Date', status: 'error' };
    } catch (err) {
      console.warn('Error calculating days to PDC:', err);
      return { days: null, formatted: 'Error', status: 'error' };
    }
  }, []);

  // Get work category icon
  const getWorkCategoryIcon = (category, workType) => {
    // Check work type first
    if (workType) {
      const type = workType.toUpperCase();
      if (type.includes('BOP')) return Shield;
      if (type.includes('FENCE') || type.includes('BFL')) return Box;
      if (type.includes('ROAD') || type.includes('AXIAL') || type.includes('LATERAL')) return Route;
      if (type.includes('BRIDGE')) return Construction;
      if (type.includes('INFRASTRUCTURE')) return Building;
    }
    
    // Then check category
    switch(category) {
      case 'BORDER_OUTPOST': return Shield;
      case 'FENCING': return Box;
      case 'ROAD': return Route;
      case 'BRIDGE': return Construction;
      case 'INFRASTRUCTURE': return Building;
      default: return MoreHorizontal;
    }
  };

  // Process all calculated fields
  const processedProject = {
    ...project,
    calculated_days_to_pdc: project.days_to_pdc !== undefined ? 
      { days: project.days_to_pdc, formatted: project.days_to_pdc < 0 ? 
        `${Math.abs(project.days_to_pdc)} days overdue` : 
        `${project.days_to_pdc} days remaining`, 
        status: project.days_to_pdc < 0 ? 'overdue' : 'on_track' 
      } : calculateDaysToPDC(project)
  };

  // Format functions
  const formatAmountCr = (value) => {
    const amount = parseFloat(value) || 0;
    return `₹${amount.toFixed(2)} Cr`;
  };

  const formatPercentage = (value) => {
    const num = (parseFloat(value) || 0) * 100;
    return `${num.toFixed(1)}%`;
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const completedPercentage = (parseFloat(project.completed_percentage) || 0) * 100;
    const efficiency = parseFloat(project.efficiency_score) || 0;
    const sanctionedAmount = parseFloat(project.sanctioned_amount_cr) || 0;
    const spentAmount = parseFloat(project.spent_amount_cr) || 0;
    const remainingAmount = parseFloat(project.remaining_amount_cr) || sanctionedAmount - spentAmount;
    const lengthKm = parseFloat(project.length_km) || 0;
    const unitsAor = project.units_aor || 0;
    
    const completionStatus = project.completion_status || 'NOT_STARTED';
    const projectHealth = project.project_health || 'N/A';
    const riskLevel = project.risk_level || 'LOW';
    const priority = project.priority || 'MEDIUM';
    
    const utilizationRate = sanctionedAmount > 0 ? (spentAmount / sanctionedAmount * 100) : 0;
    
    const WorkCategoryIcon = getWorkCategoryIcon(project.work_category, project.work_type);

    return {
      completedPercentage,
      efficiency,
      sanctionedAmount,
      spentAmount,
      remainingAmount,
      lengthKm,
      unitsAor,
      completionStatus,
      projectHealth,
      riskLevel,
      priority,
      utilizationRate,
      WorkCategoryIcon,
      daysToPodc: processedProject.calculated_days_to_pdc
    };
  };

  const metrics = calculateMetrics();

  // Generate PNG image from the report
  const generatePNG = async () => {
    const element = reportRef.current;
    if (!element) return null;

    element.classList.add('export-mode');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: 1697,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.report-content');
          if (clonedElement) {
            clonedElement.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
            clonedElement.style.backgroundColor = '#ffffff';
          }
        }
      });

      element.classList.remove('export-mode');
      return canvas;
    } catch (error) {
      element.classList.remove('export-mode');
      throw error;
    }
  };

  // Export as PNG
  const exportPNG = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await generatePNG();
      if (!canvas) {
        throw new Error('Failed to generate image');
      }

      cachedImageRef.current = canvas;

      const link = document.createElement('a');
      link.download = `Operations_Report_${project.s_no}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [project.s_no]);

  // Export as PDF using PNG
  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = cachedImageRef.current || await generatePNG();
      if (!canvas) {
        throw new Error('Failed to generate image');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
      
      pdf.save(`Operations_Report_${project.s_no}_${Date.now()}.pdf`);
      
      cachedImageRef.current = null;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [project.s_no]);

  // Print using PNG
  const handlePrint = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = cachedImageRef.current || await generatePNG();
      if (!canvas) {
        throw new Error('Failed to generate image');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Operations Report - ${project.s_no}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  width: auto;
                  height: auto;
                }
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #ffffff;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Report" onload="window.print(); window.close();" />
          </body>
        </html>
      `);

      printWindow.document.close();
      
      cachedImageRef.current = null;
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to print. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [project.s_no]);

  // Get status color class
  const getStatusColor = (value, type) => {
    if (type === 'risk') {
      return metrics.riskLevel === 'CRITICAL' ? 'text-red-600' :
             metrics.riskLevel === 'HIGH' ? 'text-orange-600' :
             metrics.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
             'text-green-600';
    }
    if (type === 'health') {
      return value === 'ON_TRACK' ? 'text-green-600' :
             value === 'MINOR_DELAY' ? 'text-yellow-600' :
             value === 'MODERATE_DELAY' ? 'text-orange-600' :
             value === 'SEVERE_DELAY' ? 'text-red-600' :
             'text-gray-600';
    }
    if (type === 'progress') {
      return value >= 75 ? 'text-green-600' :
             value >= 50 ? 'text-blue-600' :
             value >= 25 ? 'text-yellow-600' :
             'text-red-600';
    }
    if (type === 'days') {
      return value < 0 ? 'text-red-600' : 'text-green-600';
    }
    return 'text-gray-600';
  };

  const getCompletionBadgeColor = (status) => {
    const colors = {
      'NOT_STARTED': 'bg-red-100 text-red-700',
      'INITIAL': 'bg-orange-100 text-orange-700',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-700',
      'ADVANCED': 'bg-blue-100 text-blue-700',
      'NEAR_COMPLETION': 'bg-indigo-100 text-indigo-700',
      'COMPLETED': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadgeColor = (level) => {
    const colors = {
      'URGENT': 'bg-red-100 text-red-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'MEDIUM': 'bg-blue-100 text-blue-700',
      'LOW': 'bg-gray-100 text-gray-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'LOW': 'bg-green-100 text-green-700'
    };
    return colors[level] || colors['LOW'];
  };

  const getHealthBadgeColor = (status) => {
    const colors = {
      'ON_TRACK': 'bg-green-100 text-green-700',
      'MINOR_DELAY': 'bg-yellow-100 text-yellow-700',
      'MODERATE_DELAY': 'bg-orange-100 text-orange-700',
      'SEVERE_DELAY': 'bg-red-100 text-red-700',
      'N/A': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors['N/A'];
  };

  const CategoryIcon = metrics.WorkCategoryIcon;

  return (
    <div className="report-container">
      {/* Header with Actions */}
      <div className="report-header no-print">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <Construction size={16} />
            </div>
            <div>
              <h1>{project.name_of_work || 'Operations Report'}</h1>
              <p>S.No: {project.s_no} | {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              onClick={exportPNG}
              disabled={exporting}
              className="btn btn-primary"
              title="Export as PNG"
            >
              <Camera size={16} />
              <span>Export PNG</span>
            </button>

            <button
              onClick={exportPDF}
              disabled={exporting}
              className="btn btn-primary"
              title="Export as PDF"
            >
              <FileDown size={16} />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={exporting}
              className="btn btn-secondary"
              title="Print Report"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            {isInModal && (
              <button
                onClick={onclose}
                disabled={exporting}
                className="btn btn-close"
                title="Close Report"
              >
                <XCircle size={16} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="report-wrapper">
        <div ref={reportRef} className="report-content">
          {/* Project Header */}
          <div className="project-header">
            <div className='BrandingHeader'>
              <div className='BSFTitle'>
                <div className='bsflogo'>
                  <img src='./bsf.png' width={40} height={40} />
                </div>
                <div className='bsfheading'>
                  <span>Border Security Force</span>
                  <span>सीमा सुरक्षा बल</span>
                </div>
              </div>
              <div className='BSFoffice'>
                <h5>SDG HQ WESTERN COMMAND</h5>
                <span>MQRM+G2V, Ram Darbar Rd, Industrial Area Phase II,<br/> Chandigarh, 160003</span>
              </div>
            </div>
            <div className='flag-divider'></div>
            <h2>{project.name_of_work}</h2>
            <div className="project-meta">
              <span><Hash size={12} /> {project.s_no}</span>
              <span><CategoryIcon size={12} /> {project.work_category || project.work_type}</span>
              <span><Globe size={12} /> {project.frontier}</span>
              <span><Navigation size={12} /> {project.sector_hq}</span>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <TrendingUp size={14} />
                <span>Progress</span>
              </div>
              <div className={`metric-value ${getStatusColor(metrics.completedPercentage, 'progress')}`}>
                {formatPercentage(project.completed_percentage)}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${metrics.completedPercentage}%` }} />
              </div>
              <div className="metric-subtitle">
                {metrics.completionStatus.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <IndianRupee size={14} />
                <span>Budget Used</span>
              </div>
              <div className="metric-value text-green-600">
                {formatPercentage(metrics.utilizationRate / 100)}
              </div>
              <div className="metric-subtitle">
                {formatAmountCr(metrics.spentAmount)} / {formatAmountCr(metrics.sanctionedAmount)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Clock size={14} />
                <span>PDC Status</span>
              </div>
              <div className={`metric-value ${getStatusColor(metrics.daysToPodc?.days, 'days')}`}>
                {metrics.daysToPodc?.days ? Math.abs(metrics.daysToPodc.days) : 0} days
              </div>
              <div className="metric-subtitle">
                {metrics.daysToPodc?.status === 'overdue' ? 'Overdue' : 'Remaining'}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Shield size={14} />
                <span>Risk</span>
              </div>
              <div className={`metric-value ${getStatusColor(metrics.riskLevel, 'risk')}`}>
                {metrics.riskLevel}
              </div>
              <div className="metric-subtitle">
                Priority: {metrics.priority}
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className="details-grid">
            {/* Basic Information */}
            <div className="detail-card">
              <h3><FileText size={12} /> Basic Information</h3>
              <div className="detail-items">
                {[
                  ['Serial No', project.s_no],
                  ['Work Type', project.work_type],
                  ['Work Category', project.work_category],
                  ['Source Sheet', project.source_sheet],
                  ['HLEC Year', project.hlec_year],
                  ['HLEC Meeting', project.hlec_meeting]
                ].filter(([_, value]) => value && value !== 'N/A').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Specifications */}
            <div className="detail-card">
              <h3><MapPin size={12} /> Location & Specifications</h3>
              <div className="detail-items">
                {[
                  ['Frontier', project.frontier],
                  ['Sector HQ', project.sector_hq],
                  ['Length (Km)', project.length_km],
                  ['Units/AOR', project.units_aor]
                ].filter(([_, value]) => value && value !== 'N/A').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Details */}
            <div className="detail-card">
              <h3><IndianRupee size={12} /> Financial Details</h3>
              <div className="detail-items">
                {[
                  ['Sanctioned Amount', formatAmountCr(metrics.sanctionedAmount)],
                  ['Spent Amount', formatAmountCr(metrics.spentAmount)],
                  ['Remaining Amount', formatAmountCr(metrics.remainingAmount)],
                  ['Utilization', formatPercentage(metrics.utilizationRate / 100)]
                ].map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline & Dates */}
            <div className="detail-card">
              <h3><Calendar size={12} /> Timeline</h3>
              <div className="detail-items">
                {[
                  ['SDC', formatOperationsDate(project.sdc)],
                  ['PDC', formatOperationsDate(project.pdc)],
                  ['Days to PDC', metrics.daysToPodc?.formatted || 'N/A']
                ].filter(([_, value]) => value && value !== 'N/A').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress & Performance */}
            <div className="detail-card">
              <h3><TrendingUp size={12} /> Progress & Performance</h3>
              <div className="detail-items">
                <div className="progress-section">
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Physical Progress</span>
                      <span className="font-bold">{metrics.completedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill primary" style={{ width: `${metrics.completedPercentage}%` }} />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Efficiency Score</span>
                      <span>{metrics.efficiency.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar small">
                      <div className="progress-fill secondary" style={{ width: `${metrics.efficiency}%` }} />
                    </div>
                  </div>
                </div>
                {[
                  ['Completion Status', metrics.completionStatus.replace(/_/g, ' ')],
                  ['Project Health', metrics.projectHealth.replace(/_/g, ' ')]
                ].filter(([_, value]) => value && value !== 'N/A').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk & Priority Assessment */}
            <div className="detail-card">
              <h3><AlertTriangle size={12} /> Risk & Priority</h3>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Risk Level:</span>
                  <span className={`badge ${getRiskBadgeColor(metrics.riskLevel)}`}>
                    {metrics.riskLevel}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority:</span>
                  <span className={`badge ${getPriorityBadgeColor(metrics.priority)}`}>
                    {metrics.priority}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`badge ${getCompletionBadgeColor(metrics.completionStatus)}`}>
                    {metrics.completionStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                {metrics.projectHealth !== 'N/A' && (
                  <div className="detail-item">
                    <span className="detail-label">Health:</span>
                    <span className={`badge ${getHealthBadgeColor(metrics.projectHealth)}`}>
                      {metrics.projectHealth.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          {project.remarks && project.remarks !== 'N/A' && (
            <div className="remarks-section">
              <h3><Info size={12} /> Remarks</h3>
              <p>{project.remarks}</p>
            </div>
          )}

          {/* Project Summary */}
          <div className="summary-section">
            <h3>Overall Work Summary</h3>
            <div className="summary-grid">
              <div>
                <div className="summary-value text-blue-600">{metrics.completedPercentage.toFixed(0)}%</div>
                <div className="summary-label">Complete</div>
              </div>
              <div>
                <div className="summary-value text-green-600">{formatAmountCr(metrics.sanctionedAmount)}</div>
                <div className="summary-label">Budget</div>
              </div>
              <div>
                <div className={`summary-value ${metrics.daysToPodc?.days < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(metrics.daysToPodc?.days || 0)}
                </div>
                <div className="summary-label">Days {metrics.daysToPodc?.days < 0 ? 'Overdue' : 'to PDC'}</div>
              </div>
              <div>
                <div className={`summary-value ${getStatusColor(metrics.riskLevel, 'risk')}`}>
                  {metrics.riskLevel}
                </div>
                <div className="summary-label">Risk Level</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            Generated on {new Date().toLocaleString()} | Operations Division | BSF HQ | www.akshaykotish.com | connect@akshaykotish.com
          </div>
        </div>
      </div>

      <style jsx>{`
        .report-container {
          width: 100%;
          background: white;
          min-height: 100vh;
        }

        .BrandingHeader {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: row;
        }

        .flag-divider {
          height: 3px;
          width: 100%;
          background: linear-gradient(to right, #FF9933 0%, #FFFFFF 50%, #138808 100%);
          border: none;
          margin-bottom: 1rem;
          margin-top: 1rem;
        }

        .BSFTitle {
          font-size: 15pt;
          font-weight: bold;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: row;
        }

        .bsflogo {
          margin-right: 1rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-end;
          align-content: flex-end;
          flex-direction: row;
          width: 50px;
          height: 50px;
        }

        .bsfheading {
          font-size: 14pt;
          font-weight: bold;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: column;
        }

        .BSFoffice {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: column;
          font-size: 8pt;
        }

        /* Header Styles */
        .report-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .title-icon {
          padding: 0.4rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 0.275rem;
          color: white;
        }

        .header-title h1 {
          font-size: 1.025rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .header-title p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn:hover {
          transform: scale(1.02);
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: white;
          color: #3b82f6;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-close {
          background: #ef4444;
          color: #ffffff;
        }

        .btn-close:hover {
          background: #dc2626;
        }

        /* Report Content Styles */
        .report-wrapper {
          display: flex;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .report-content {
          width: 100%;
          max-width: 1200px;
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
        }

        /* Export Mode */
        .export-mode {
          width: 1200px !important;
          max-width: 1200px !important;
          padding: 2rem !important;
          background: white !important;
        }

        .export-mode * {
          box-shadow: none !important;
        }

        /* Project Header */
        .project-header {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .project-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .project-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.6rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .project-meta span {
          gap: 0.475rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-end;
          align-content: flex-end;
          flex-direction: row;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.3rem;
          margin-bottom: 1rem;
        }

        .metric-card {
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
        }

        .metric-header span {
          font-size: 0.55rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .progress-bar {
          width: 100%;
          height: 0.1rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar.small {
          height: 0.1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #2563eb);
          border-radius: 9999px;
          transition: width 0.3s;
        }

        .progress-fill.primary {
          background: linear-gradient(to right, #3b82f6, #2563eb);
        }

        .progress-fill.secondary {
          background: linear-gradient(to right, #10b981, #059669);
        }

        .metric-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.375rem;
        }

        /* Details Grid */
        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .detail-card {
          padding: 1rem;
          background: #ffffff;
          border: solid 1px #cccccc;
          border-radius: 0.5rem;
        }

        .detail-card h3 {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.775rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }

        .detail-items {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }

        .detail-label {
          color: #6b7280;
        }

        .detail-value {
          font-weight: 500;
          color: #111827;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .progress-section {
          margin-bottom: 1rem;
        }

        .progress-item {
          margin-bottom: 0.625rem;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.375rem;
          font-size: 0.75rem;
        }

        .badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Remarks Section */
        .remarks-section {
          padding: 1.25rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }

        .remarks-section h3 {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem 0;
        }

        .remarks-section p {
          font-size: 0.75rem;
          color: #4b5563;
          margin: 0;
        }

        /* Summary Section */
        .summary-section {
          padding: 1.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }

        .summary-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1.25rem 0;
          text-align: center;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          text-align: center;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.375rem;
        }

        /* Footer */
        .report-footer {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Text Colors */
        .text-red-600 { color: #dc2626; }
        .text-orange-600 { color: #ea580c; }
        .text-yellow-600 { color: #ca8a04; }
        .text-green-600 { color: #16a34a; }
        .text-blue-600 { color: #2563eb; }
        .text-gray-600 { color: #4b5563; }

        /* Background Colors */
        .bg-red-100 { background-color: #fee2e2; }
        .bg-orange-100 { background-color: #fed7aa; }
        .bg-yellow-100 { background-color: #fef3c7; }
        .bg-green-100 { background-color: #dcfce7; }
        .bg-blue-100 { background-color: #dbeafe; }
        .bg-indigo-100 { background-color: #e0e7ff; }
        .bg-gray-100 { background-color: #f3f4f6; }

        .text-red-700 { color: #b91c1c; }
        .text-orange-700 { color: #c2410c; }
        .text-yellow-700 { color: #a16207; }
        .text-green-700 { color: #15803d; }
        .text-blue-700 { color: #1d4ed8; }
        .text-indigo-700 { color: #4338ca; }
        .text-gray-700 { color: #374151; }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .details-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .header-actions {
            width: 100%;
            justify-content: center;
          }

          .metrics-grid,
          .details-grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .btn span {
            display: none;
          }

          .btn {
            padding: 0.5rem;
          }
        }

        /* Hide elements during print/export */
        .no-print {
          /* Will be hidden during export */
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Report;