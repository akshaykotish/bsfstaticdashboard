//Engineering/Report.js
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
  Cross, EyeClosed, Table, ShieldCloseIcon, Database,
  Folder, Archive, Edit, DollarSign
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Report = ({ projectData, darkMode: initialDarkMode = false, isInModal = false, onclose }) => {
  const [exporting, setExporting] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const reportRef = useRef(null);
  const cachedImageRef = useRef(null);

  // Clean and process project data - using config.js column names
  const cleanProjectData = (data) => {
    if (!data) return {};
    
    const cleanData = {};
    Object.keys(data).forEach(key => {
      if (!key.includes('unnamed') && 
          !key.includes('serial_no_1') && 
          data[key] !== null && 
          data[key] !== undefined && 
          data[key] !== '') {
        cleanData[key] = data[key];
      }
    });
    
    return cleanData;
  };

  const project = cleanProjectData(projectData);

  // Calculate Time Allowed = PDC Agreement - Award Date - 10
  const calculateTimeAllowed = useCallback((row) => {
    if (!row.award_date || row.award_date === '' || row.award_date === 'N/A') {
      return { days: 0, formatted: 'N/A', status: 'not_started' };
    }

    try {
      const awardDate = new Date(row.award_date);
      if (isNaN(awardDate.getTime())) {
        return { days: 0, formatted: 'Invalid Date', status: 'error' };
      }

      let targetDate = null;
      let dateType = 'none';
      
      // Check for revised PDC first
      if (row.pdc_revised && row.pdc_revised !== '' && row.pdc_revised !== 'N/A') {
        targetDate = new Date(row.pdc_revised);
        dateType = 'revised';
        if (isNaN(targetDate.getTime())) targetDate = null;
      }
      
      // Check for PDC agreement
      if (!targetDate && row.pdc_agreement && row.pdc_agreement !== '' && row.pdc_agreement !== 'N/A') {
        targetDate = new Date(row.pdc_agreement);
        dateType = 'original';
        if (isNaN(targetDate.getTime())) targetDate = null;
      }

      if (!targetDate) {
        if (row.time_allowed_days && row.time_allowed_days > 0) {
          return { 
            days: row.time_allowed_days, 
            formatted: `${row.time_allowed_days} days (Contract)`,
            status: 'contract'
          };
        }
        return { days: 0, formatted: 'No PDC Set', status: 'no_pdc' };
      }

      const diffTime = targetDate - awardDate;
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Subtract 10 days as per requirement
      diffDays = diffDays - 10;
      
      const formatString = `${Math.abs(diffDays)} days${dateType === 'revised' ? ' (Revised)' : ''}`;
      
      return {
        days: diffDays,
        formatted: diffDays < 0 ? `Overdue: ${formatString}` : formatString,
        status: diffDays < 0 ? 'overdue' : 'normal',
        dateType: dateType
      };
    } catch (err) {
      console.warn('Error calculating time allowed:', err);
      return { days: 0, formatted: 'Error', status: 'error' };
    }
  }, []);

  // Calculate Expected Progress with monthly rate logic
  const calculateExpectedProgress = useCallback((row) => {
    if (!row.award_date || row.award_date === '' || row.award_date === 'N/A') {
      return 0;
    }

    try {
      const awardDate = new Date(row.award_date);
      if (isNaN(awardDate.getTime())) return 0;

      const today = new Date();
      let pdcDate = null;
      
      // Check revised PDC first if available
      if (row.pdc_revised && row.pdc_revised !== '' && row.pdc_revised !== 'N/A') {
        pdcDate = new Date(row.pdc_revised);
      } else if (row.pdc_agreement && row.pdc_agreement !== '' && row.pdc_agreement !== 'N/A') {
        pdcDate = new Date(row.pdc_agreement);
      }
      
      if (!pdcDate || isNaN(pdcDate.getTime())) {
        if (row.time_allowed_days && row.time_allowed_days > 0) {
          pdcDate = new Date(awardDate);
          pdcDate.setDate(pdcDate.getDate() + parseInt(row.time_allowed_days));
        } else {
          pdcDate = new Date(awardDate);
          pdcDate.setFullYear(pdcDate.getFullYear() + 1);
        }
      }

      const totalDurationMs = pdcDate - awardDate;
      const totalMonths = totalDurationMs / (1000 * 60 * 60 * 24 * 30.44);
      const elapsedMs = today - awardDate;
      const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30.44);
      
      if (today >= pdcDate) {
        return 100;
      }
      
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
  }, []);

  // Get Progress Status Display with proper pace calculation
  const getProgressStatusDisplay = useCallback((row) => {
    const progress = parseFloat(row.physical_progress_percent) || 0;
    
    // Determine category based on progress
    let category = 'UNKNOWN';
    if (!row.tender_date || row.tender_date === '') {
      category = 'TENDER_PROGRESS';
    } else if (row.tender_date && (!row.award_date || row.award_date === '')) {
      category = 'TENDERED_NOT_AWARDED';
    } else if (row.award_date && progress === 0) {
      category = 'AWARDED_NOT_STARTED';
    } else if (progress === 0) {
      category = 'NOT_STARTED';
    } else if (progress > 0 && progress <= 50) {
      category = 'PROGRESS_1_TO_50';
    } else if (progress > 50 && progress <= 71) {
      category = 'PROGRESS_51_TO_71';
    } else if (progress > 71 && progress < 100) {
      category = 'PROGRESS_71_TO_99';
    } else if (progress >= 100) {
      category = 'COMPLETED';
    }
    
    // Calculate health status with monthly rate logic
    const expectedProgress = calculateExpectedProgress(row);
    let healthStatus = 'NOT_APPLICABLE';
    
    if (progress >= 100 && parseFloat(row.expenditure_percent) < 100) {
      healthStatus = 'PAYMENT_PENDING';
    } else if (row.award_date) {
      const progressDiff = progress - expectedProgress;
      
      // Calculate monthly rate for proper pace determination
      const awardDate = new Date(row.award_date);
      const today = new Date();
      const elapsedMonths = Math.max(0, (today - awardDate) / (1000 * 60 * 60 * 24 * 30.44));
      
      let pdcDate = null;
      if (row.pdc_revised && row.pdc_revised !== '' && row.pdc_revised !== 'N/A') {
        pdcDate = new Date(row.pdc_revised);
      } else if (row.pdc_agreement && row.pdc_agreement !== '' && row.pdc_agreement !== 'N/A') {
        pdcDate = new Date(row.pdc_agreement);
      }
      
      if (pdcDate && !isNaN(pdcDate.getTime())) {
        const totalMonths = Math.max(1, (pdcDate - awardDate) / (1000 * 60 * 60 * 24 * 30.44));
        const monthlyRate = 100 / totalMonths;
        const monthsBehind = progressDiff / monthlyRate;
        
        if (monthsBehind >= -0.25) {
          healthStatus = 'PERFECT_PACE';
        } else if (monthsBehind >= -1) {
          healthStatus = 'SLOW_PACE';
        } else if (monthsBehind >= -2) {
          healthStatus = 'BAD_PACE';
        } else {
          healthStatus = 'SLEEP_PACE';
        }
      }
    }
    
    const categoryMap = {
      'TENDER_PROGRESS': { label: 'Tender in Progress', color: 'text-gray-600', icon: FileText },
      'TENDERED_NOT_AWARDED': { label: 'Tendered (Not Awarded)', color: 'text-yellow-600', icon: PauseCircle },
      'AWARDED_NOT_STARTED': { label: 'Awarded (Not Started)', color: 'text-orange-600', icon: PlayCircle },
      'NOT_STARTED': { label: 'Not Started', color: 'text-red-600', icon: XCircle },
      'PROGRESS_1_TO_50': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-red-500', icon: Activity },
      'PROGRESS_51_TO_71': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-yellow-500', icon: Activity },
      'PROGRESS_71_TO_99': { label: `Progress: ${progress.toFixed(0)}%`, color: 'text-blue-500', icon: Target },
      'COMPLETED': { label: 'Completed', color: 'text-green-600', icon: CheckCircle }
    };

    const healthMap = {
      'PERFECT_PACE': { label: 'Perfect Pace', color: 'text-green-500', icon: Zap },
      'SLOW_PACE': { label: 'Slow Pace', color: 'text-yellow-500', icon: Timer },
      'BAD_PACE': { label: 'Bad Pace', color: 'text-orange-500', icon: AlertTriangle },
      'SLEEP_PACE': { label: 'Sleep Pace', color: 'text-red-500', icon: PauseCircle },
      'PAYMENT_PENDING': { label: 'Payment Pending', color: 'text-amber-600', icon: CreditCard }
    };

    const categoryInfo = categoryMap[category] || { 
      label: `Progress: ${progress.toFixed(0)}%`, 
      color: 'text-gray-600', 
      icon: Activity 
    };
    
    const healthInfo = healthMap[healthStatus] || null;

    return {
      primary: categoryInfo,
      secondary: healthInfo,
      progress: progress
    };
  }, [calculateExpectedProgress]);

  // Process all calculated fields
  const processedProject = {
    ...project,
    calculated_time_allowed: project.calculated_time_allowed || calculateTimeAllowed(project),
    expected_progress: project.expected_progress || calculateExpectedProgress(project),
    progress_status_display: project.progress_status_display || getProgressStatusDisplay(project)
  };

  // Format functions
  const formatAmount = (value) => {
    // Handle various input types
    if (value === null || value === undefined || value === '') return '₹0 L';
    
    let amount = 0;
    if (typeof value === 'string') {
      // Remove any currency symbols or commas
      const cleanValue = value.replace(/[₹,]/g, '').trim();
      amount = parseFloat(cleanValue) || 0;
    } else {
      amount = parseFloat(value) || 0;
    }
    
    if (amount >= 100) {
      return `₹${(amount / 100).toFixed(2)} Cr`;
    }
    return `₹${amount.toFixed(2)} L`;
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A' || dateString === '') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatPercentage = (value) => {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(1)}%`;
  };

  // Calculate metrics based on config.js column names
  const calculateMetrics = () => {
    // Using proper column names from config.js
    const physicalProgress = parseFloat(project.physical_progress_percent) || 0;
    
    // Financial fields from config.js
    const sanctionedAmount = parseFloat(project.sd_amount_lakh) || 0;
    
    // Calculate total expenditure from config columns
    const previousFY = parseFloat(project.expenditure_previous_fy) || 0;
    const currentFY = parseFloat(project.expenditure_current_fy) || 0;
    const totalExpdr = parseFloat(project.expenditure_total) || previousFY + currentFY;
    
    const percentExpdr = parseFloat(project.expenditure_percent) || 
                        (sanctionedAmount > 0 ? (totalExpdr / sanctionedAmount * 100) : 0);
    
    const remainingAmount = sanctionedAmount - totalExpdr;
    const timeAllowedDays = parseFloat(project.time_allowed_days) || 0;
    
    // Calculate delay days based on PDC dates
    let delayDays = 0;
    if (physicalProgress < 100) {
      const pdcDate = project.pdc_revised || project.pdc_agreement;
      if (pdcDate && pdcDate !== '' && pdcDate !== 'N/A') {
        try {
          const pdc = new Date(pdcDate);
          const today = new Date();
          if (!isNaN(pdc.getTime()) && today > pdc) {
            delayDays = Math.ceil((today - pdc) / (1000 * 60 * 60 * 24));
          }
        } catch (e) {
          console.warn('Error calculating delay:', e);
        }
      }
    }
    
    // Calculate time elapsed from award date
    let timeElapsed = 0;
    if (project.award_date && project.award_date !== '' && project.award_date !== 'N/A') {
      try {
        const awardDate = new Date(project.award_date);
        const today = new Date();
        if (!isNaN(awardDate.getTime())) {
          timeElapsed = Math.floor((today - awardDate) / (1000 * 60 * 60 * 24));
        }
      } catch (e) {
        console.warn('Error calculating time elapsed:', e);
      }
    }
    
    // Determine health status based on monthly progress pace
    const expectedProgress = processedProject.expected_progress || 0;
    let healthStatus = 'Not Applicable';
    let paceStatus = { label: 'Not Applicable', color: 'gray', icon: Info };
    
    if (project.award_date && project.award_date !== '' && project.award_date !== 'N/A') {
      if (physicalProgress >= 100 && percentExpdr < 100) {
        healthStatus = 'Payment Pending';
        paceStatus = { label: 'Payment Pending', color: 'amber', icon: CreditCard };
      } else if (expectedProgress > 0) {
        const progressDifference = physicalProgress - expectedProgress;
        
        // Calculate monthly rate for pace determination
        const awardDate = new Date(project.award_date);
        const today = new Date();
        const elapsedMonths = Math.max(0, (today - awardDate) / (1000 * 60 * 60 * 24 * 30.44));
        
        let pdcDate = null;
        if (project.pdc_revised) {
          pdcDate = new Date(project.pdc_revised);
        } else if (project.pdc_agreement) {
          pdcDate = new Date(project.pdc_agreement);
        }
        
        if (pdcDate && !isNaN(pdcDate.getTime())) {
          const totalMonths = Math.max(1, (pdcDate - awardDate) / (1000 * 60 * 60 * 24 * 30.44));
          const monthlyRate = 100 / totalMonths;
          const monthsBehind = progressDifference / monthlyRate;
          
          if (monthsBehind >= -0.25) {
            healthStatus = 'Perfect Pace';
            paceStatus = { label: 'Perfect Pace', color: 'green', icon: Zap };
          } else if (monthsBehind >= -1) {
            healthStatus = 'Slow Pace';
            paceStatus = { label: 'Slow Pace', color: 'yellow', icon: Timer };
          } else if (monthsBehind >= -2) {
            healthStatus = 'Bad Pace';
            paceStatus = { label: 'Bad Pace', color: 'orange', icon: AlertTriangle };
          } else {
            healthStatus = 'Sleep Pace';
            paceStatus = { label: 'Sleep Pace', color: 'red', icon: PauseCircle };
          }
        }
      }
    }
    
    // Calculate efficiency score (progress vs expenditure)
    let efficiency = 0;
    if (percentExpdr > 0) {
      efficiency = Math.min(100, (physicalProgress / percentExpdr) * 100);
    } else if (physicalProgress > 0) {
      efficiency = 100;
    }
    
    // Determine risk level based on multiple factors
    let riskLevel = 'LOW';
    if ((delayDays > 90 && physicalProgress < 50) || 
        (physicalProgress < 25 && timeElapsed > 120) ||
        (efficiency < 30 && delayDays > 60)) {
      riskLevel = 'CRITICAL';
    } else if (delayDays > 90 || efficiency < 50 || 
               (physicalProgress < 50 && timeElapsed > 90)) {
      riskLevel = 'HIGH';
    } else if (delayDays > 30 || efficiency < 70 ||
               (physicalProgress < expectedProgress - 20)) {
      riskLevel = 'MEDIUM';
    }
    
    const riskColor = {
      'CRITICAL': 'red',
      'HIGH': 'orange', 
      'MEDIUM': 'yellow',
      'LOW': 'green'
    }[riskLevel] || 'gray';

    // Calculate budget variance
    let budgetVariance = 0;
    if (sanctionedAmount > 0) {
      budgetVariance = ((totalExpdr - sanctionedAmount) / sanctionedAmount * 100);
    }

    // Calculate monthly burn rate
    let monthlyBurnRate = 0;
    if (timeElapsed > 0) {
      const monthsElapsed = Math.max(1, Math.floor(timeElapsed / 30));
      monthlyBurnRate = totalExpdr / monthsElapsed;
    }

    // Return all calculated metrics
    return {
      physicalProgress,
      efficiency,
      delayDays,
      sanctionedAmount,
      totalExpdr,
      currentFY,
      previousFY,
      percentExpdr,
      remainingAmount,
      paceStatus,
      riskLevel,
      riskColor,
      healthStatus,
      timeElapsed,
      timeAllowedDays,
      budgetVariance,
      monthlyBurnRate,
      expectedProgress: processedProject.expected_progress || 0,
      progressDifference: physicalProgress - (processedProject.expected_progress || 0)
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
      link.download = `Report_${project.s_no || 'unknown'}_${Date.now()}.png`;
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
      
      pdf.save(`Report_${project.s_no || 'unknown'}_${Date.now()}.pdf`);
      
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
            <title>Print Report - ${project.s_no || 'unknown'}</title>
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
      return metrics.riskColor === 'red' ? 'text-red-600' :
             metrics.riskColor === 'orange' ? 'text-orange-600' :
             metrics.riskColor === 'yellow' ? 'text-yellow-600' :
             'text-green-600';
    }
    if (type === 'delay') {
      return value > 0 ? 'text-red-600' : 'text-green-600';
    }
    if (type === 'progress') {
      return value >= 75 ? 'text-green-600' :
             value >= 50 ? 'text-blue-600' :
             value >= 25 ? 'text-yellow-600' :
             'text-red-600';
    }
    return 'text-gray-600';
  };

  const getHealthColor = (status) => {
    const colors = {
      'PERFECT_PACE': 'bg-green-100 text-green-700',
      'SLOW_PACE': 'bg-yellow-100 text-yellow-700',
      'BAD_PACE': 'bg-orange-100 text-orange-700',
      'SLEEP_PACE': 'bg-red-100 text-red-700',
      'PAYMENT_PENDING': 'bg-amber-100 text-amber-700',
      'NOT_APPLICABLE': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors['NOT_APPLICABLE'];
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

  return (
    <div className="report-container">
      {/* Header with Actions */}
      <div className="report-header no-print">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FileText size={16} />
            </div>
            <div>
              <h1>{project.name_of_scheme || project.sub_scheme_name || 'Project Report'}</h1>
              <p>S.No: {project.s_no} | {formatDate(new Date())}</p>
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

            <button
              onClick={onclose}
              disabled={exporting}
              className="btn btn-close"
              title="Close Report"
            >
              <ShieldCloseIcon size={16} />
              <span>Close</span>
            </button>
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
            <div className='flag-divider'>

            </div>
            <div className="scheme-title-section">
              <h2>{project.name_of_scheme || project.sub_scheme_name || 'Project Name Not Available'}</h2>
            </div>
            <div className="project-meta">
              <span><Hash size={12} /> {project.s_no}</span>
              <span><MapPin size={12} /> {project.location || 'N/A'}</span>
              <span><Building2 size={12} /> {project.executive_agency}</span>
              <span><Users size={12} /> {project.firm_name}</span>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <TrendingUp size={14} />
                <span>Progress</span>
              </div>
              <div className={`metric-value ${getStatusColor(metrics.physicalProgress, 'progress')}`}>
                {formatPercentage(metrics.physicalProgress)}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${metrics.physicalProgress}%` }} />
              </div>
              <div className="metric-subtitle">
                Expected: {metrics.expectedProgress.toFixed(1)}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <IndianRupee size={14} />
                <span>Budget Used</span>
              </div>
              <div className={`metric-value text-green-600`}>
                {formatPercentage(metrics.percentExpdr)}
              </div>
              <div className="metric-subtitle">
                {formatAmount(metrics.totalExpdr)} / {formatAmount(metrics.sanctionedAmount)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Clock size={14} />
                <span>Delay</span>
              </div>
              <div className={`metric-value ${getStatusColor(metrics.delayDays, 'delay')}`}>
                {metrics.delayDays} days
              </div>
              <div className="metric-subtitle">
                {metrics.delayDays > 0 ? 'Behind Schedule' : 'On Track'}
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
                <metrics.paceStatus.icon size={10} />
                {metrics.paceStatus.label}
              </div>
            </div>
          </div>

          {/* Comprehensive Details Grid - All Fields */}
          <div className="details-grid">
            {/* Basic Information - Complete */}
            <div className="detail-card">
              <h3><FileText size={12} /> Complete Basic Information</h3>
              <div className="detail-items">
                {[
                  ['Serial No', project.s_no],
                  ['Source Sheet', project.source_sheet],
                  ['Budget Head', project.budget_head],
                  ['Scheme Name', project.name_of_scheme],
                  ['Sub Scheme', project.sub_scheme_name],
                  ['AA/ES Reference', project.aa_es_reference],
                  ['Created At', formatDate(project.created_at)],
                  ['Updated At', formatDate(project.updated_at)]
                ].filter(([_, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value detail-value-wrap">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Organizations - Complete */}
            <div className="detail-card">
              <h3><MapPin size={12} /> Complete Location & Organizations</h3>
              <div className="detail-items">
                {[
                  ['Frontier HQ', project.ftr_hq_name],
                  ['Sector HQ', project.shq_name],
                  ['Location', project.location],
                  ['Executive Agency', project.executive_agency],
                  ['Firm Name', project.firm_name]
                ].filter(([_, value]) => value && value !== 'N/A' && value !== '').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value detail-value-wrap">{value}</span>
                  </div>
                ))}
                {/* Work Description - Full Text */}
                {project.work_description && (
                  <div className="detail-item detail-item-full">
                    <span className="detail-label">Work Description:</span>
                    <span className="detail-value detail-value-wrap detail-value-multiline">
                      {project.work_description}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Financial Details */}
            <div className="detail-card">
              <h3><IndianRupee size={12} /> Complete Financial Analysis</h3>
              <div className="detail-items">
                {[
                  ['Sanctioned Amount', formatAmount(metrics.sanctionedAmount)],
                  ['Previous FY Expenditure', formatAmount(metrics.previousFY)],
                  ['Current FY Expenditure', formatAmount(metrics.currentFY)],
                  ['Total Expenditure', formatAmount(metrics.totalExpdr)],
                  ['Remaining Amount', formatAmount(metrics.remainingAmount)],
                  ['Utilization %', formatPercentage(metrics.percentExpdr)],
                  ['Budget Variance', metrics.budgetVariance !== 0 ? `${metrics.budgetVariance.toFixed(2)}%` : null],
                  ['Monthly Burn Rate', metrics.monthlyBurnRate > 0 ? formatAmount(metrics.monthlyBurnRate) : null],
                  ['Cost per Progress %', metrics.physicalProgress > 0 ? formatAmount(metrics.totalExpdr / metrics.physicalProgress) : null],
                  ['Projected Total Cost', metrics.physicalProgress > 0 ? formatAmount((metrics.totalExpdr / metrics.physicalProgress) * 100) : null]
                ].filter(([_, value]) => value && value !== '₹0 L' && value !== '₹0.00 L' && value !== null).map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Timeline & Dates */}
            <div className="detail-card">
              <h3><Calendar size={12} /> Complete Timeline & Dates</h3>
              <div className="detail-items">
                {[
                  ['TS Date', formatDate(project.ts_date)],
                  ['Tender Date', formatDate(project.tender_date)],
                  ['Acceptance Date', formatDate(project.acceptance_date)],
                  ['Award Date', formatDate(project.award_date)],
                  ['PDC Agreement', formatDate(project.pdc_agreement)],
                  ['PDC Revised', formatDate(project.pdc_revised)],
                  ['Actual Completion', formatDate(project.completion_date_actual)],
                  ['Time Allowed', processedProject.calculated_time_allowed?.formatted || 
                                  (metrics.timeAllowedDays > 0 ? `${metrics.timeAllowedDays} days` : null)],
                  ['Time Elapsed', metrics.timeElapsed > 0 ? `${metrics.timeElapsed} days` : null],
                  ['Days Remaining', metrics.timeElapsed > 0 && metrics.timeAllowedDays > 0 ? 
                                    `${Math.max(0, metrics.timeAllowedDays - metrics.timeElapsed)} days` : null],
                  ['Project Duration', project.award_date && project.pdc_agreement ? 
                                      `${Math.ceil((new Date(project.pdc_agreement) - new Date(project.award_date)) / (1000 * 60 * 60 * 24))} days` : null]
                ].filter(([_, value]) => value && value !== 'N/A' && value !== null).map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Progress & Performance */}
            <div className="detail-card">
              <h3><TrendingUp size={12} /> Complete Progress & Performance</h3>
              <div className="detail-items">
                <div className="progress-section">
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Physical Progress</span>
                      <span className="font-bold">{metrics.physicalProgress.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill primary" style={{ width: `${metrics.physicalProgress}%` }} />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Expected Progress</span>
                      <span>{metrics.expectedProgress.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar small">
                      <div className="progress-fill secondary" style={{ width: `${metrics.expectedProgress}%` }} />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>Financial Progress</span>
                      <span>{metrics.percentExpdr.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar small">
                      <div className="progress-fill financial" style={{ width: `${metrics.percentExpdr}%` }} />
                    </div>
                  </div>
                </div>
                {[
                  ['Health Status', metrics.paceStatus.label],
                  ['Current Status', project.current_status],
                  ['Progress Category', processedProject.progress_status_display?.primary?.label],
                  ['Progress Variance', `${metrics.progressDifference > 0 ? '+' : ''}${metrics.progressDifference.toFixed(1)}%`],
                  ['Efficiency Score', `${metrics.efficiency.toFixed(1)}%`],
                  ['Daily Progress Rate', metrics.timeElapsed > 0 ? `${(metrics.physicalProgress / metrics.timeElapsed).toFixed(3)}%` : null],
                  ['Required Daily Rate', metrics.timeAllowedDays > metrics.timeElapsed ? 
                                         `${((100 - metrics.physicalProgress) / (metrics.timeAllowedDays - metrics.timeElapsed)).toFixed(3)}%` : null]
                ].filter(([_, value]) => value !== null && value !== undefined && value !== 'N/A').map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <span className="detail-label">{label}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk & Quality Assessment */}
            <div className="detail-card">
              <h3><AlertTriangle size={12} /> Risk & Quality Assessment</h3>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Risk Level:</span>
                  <span className={`badge ${getRiskBadgeColor(metrics.riskLevel)}`}>
                    {metrics.riskLevel}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority:</span>
                  <span className="detail-value">{
                    metrics.sanctionedAmount > 10000 || metrics.delayDays > 90 ? 'HIGH' :
                    metrics.sanctionedAmount > 5000 || metrics.delayDays > 30 ? 'MEDIUM' : 'LOW'
                  }</span>
                </div>
                {metrics.delayDays > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Delay Impact:</span>
                    <span className="detail-value text-orange-600">
                      {metrics.delayDays} days behind schedule
                    </span>
                  </div>
                )}
                {metrics.progressDifference < -10 && (
                  <div className="detail-item">
                    <span className="detail-label">Progress Gap:</span>
                    <span className="detail-value text-red-600">
                      {Math.abs(metrics.progressDifference).toFixed(1)}% behind expected
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Quality Score:</span>
                  <span className="detail-value">
                    {Math.max(0, 100 - metrics.delayDays/10 - Math.abs(metrics.progressDifference)/2).toFixed(1)}%
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Completion Confidence:</span>
                  <span className="detail-value">
                    {metrics.physicalProgress >= 75 ? 'High' :
                     metrics.physicalProgress >= 50 ? 'Medium' :
                     metrics.physicalProgress >= 25 ? 'Low' : 'Very Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section - Full Text */}
          {project.remarks && project.remarks !== 'N/A' && project.remarks !== '' && (
            <div className="remarks-section">
              <h3><Info size={12} /> Complete Remarks</h3>
              <p className="remarks-text">{project.remarks}</p>
            </div>
          )}

          {/* Project Summary */}
          <div className="summary-section">
            <h3>Overall Project Summary</h3>
            <div className="summary-grid">
              <div>
                <div className="summary-value text-blue-600">{metrics.physicalProgress.toFixed(0)}%</div>
                <div className="summary-label">Complete</div>
              </div>
              <div>
                <div className="summary-value text-green-600">{formatAmount(metrics.sanctionedAmount)}</div>
                <div className="summary-label">Budget</div>
              </div>
              <div>
                <div className={`summary-value ${metrics.delayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.delayDays}
                </div>
                <div className="summary-label">Days {metrics.delayDays > 0 ? 'Delayed' : 'Ahead'}</div>
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
            Generated on {new Date().toLocaleString()} | WC HQ Engineering | www.akshaykotish.com | connect@akshaykotish.com
          </div>
        </div>
      </div>

      <style jsx>{`
        .report-container {
          width: 100%;
          background: white;
          min-height: 100vh;
        }

        .BrandingHeader{
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
          margin-bottom:1rem;
          margin-top: 1rem;
        }

        .BSFTitle{
          font-size: 15pt;
          font-weight: bold;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: row;
        }

        .bsflogo{
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

        .bsfheading{
          font-size: 14pt;
          font-weight: bold;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          align-content: flex-start;
          flex-direction: column;
        }

        .BSFoffice{
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
          background: red;
          color: #ffffff;
          border: 1px solid #e5e7eb;
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

        /* Export Mode - Applied when generating PNG */
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

        .scheme-title-section {
          margin: 1rem 0;
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        .scheme-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }

        .project-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .project-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.6rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 1rem;
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

        .progress-fill.secondary {
          background: #de2358ff;
        }

        .progress-fill.financial {
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
          background: #ffffffff;
          border: solid 1px #ccccccff;
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
          align-items: flex-start;
        }

        .detail-item-full {
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          color: #6b7280;
          flex-shrink: 0;
          min-width: 40%;
        }

        .detail-value {
          font-weight: 500;
          color: #111827;
          text-align: right;
          max-width: 60%;
        }

        .detail-value-wrap {
          word-wrap: break-word;
          word-break: break-word;
          white-space: normal;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .detail-value-multiline {
          text-align: left;
          max-width: 100%;
          margin-top: 0.25rem;
          line-height: 1.4;
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

        .remarks-section p,
        .remarks-text {
          font-size: 0.75rem;
          color: #4b5563;
          margin: 0;
          word-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          line-height: 1.5;
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
        .bg-amber-100 { background-color: #fef3c7; }
        .bg-gray-100 { background-color: #f3f4f6; }

        .text-red-700 { color: #b91c1c; }
        .text-orange-700 { color: #c2410c; }
        .text-yellow-700 { color: #a16207; }
        .text-green-700 { color: #15803d; }
        .text-amber-700 { color: #a16207; }
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