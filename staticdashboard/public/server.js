const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const XLSX = require('xlsx');

const app = express();
const PORT = 3456;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Data directory
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

// Initialize
ensureDataDir();

// Import database configurations
const databaseConfigs = {
  engineering: {
    displayName: 'Engineering Database',
    fileName: 'engineering.csv',
    idField: 's_no',
    idPrefix: 'ENG',
    idFormat: 'ENG-{timestamp}-{sequence}',
    columns: ['s_no', 'budget_head', 'name_of_scheme', 'sub_scheme_name', 'ftr_hq_name', 'shq_name', 'location', 'work_description', 'executive_agency', 'firm_name', 'sd_amount_lakh', 'expenditure_previous_fy', 'expenditure_current_fy', 'expenditure_total', 'expenditure_percent', 'physical_progress_percent', 'ts_date', 'tender_date', 'acceptance_date', 'award_date', 'pdc_agreement', 'pdc_revised', 'completion_date_actual', 'time_allowed_days', 'current_status', 'aa_es_reference', 'remarks']
  },
  operations: {
    displayName: 'Operations Database',
    fileName: 'operations.csv',
    idField: 'S_No',
    idPrefix: 'OPS',
    idFormat: 'OPS-{timestamp}-{sequence}',
    columns: ['S_No', 'WORK_TYPE', 'SOURCE_SHEET', 'NAME_OF_WORK', 'FRONTIER', 'SECTOR_HQ', 'LENGTH_KM', 'UNITS_AOR', 'HLEC_YEAR', 'SANCTIONED_AMOUNT_CR', 'SDC', 'PDC', 'COMPLETED_PERCENTAGE', 'REMARKS', 'APPROVED AMOUNT (CR)']
  },
  enggcurrentyear: {
    displayName: 'Engineering Current Year',
    fileName: 'enggcurrentyear.csv',
    idField: 'S/No.',
    idPrefix: 'ECY',
    idFormat: 'ECY-{timestamp}-{sequence}',
    columns: ['S/No.', 'ftr_hq', 'budget_head', 'Sub head', 'Allotment Previous Financial year', 'Expdr previous year', 'Liabilities', 'Fresh Sanction issued during CFY', 'Effective sanction', 'Allotment', 'Expdr booked as per e-lekha as on 22/07/25', '% Age of expdr as per e-lekha', 'Bill pending with PAD', 'Bill pending with HQrs', 'Total Expdr', '% Age of total Expdr', 'Balance fund']
  }
};

// Helper function to get configuration
const getConfig = (databaseName) => {
  return databaseConfigs[databaseName] || {
    displayName: 'Custom Database',
    fileName: `${databaseName}.csv`,
    idField: 'id',
    idPrefix: databaseName.toUpperCase().slice(0, 3),
    idFormat: '{prefix}-{timestamp}-{sequence}',
    columns: []
  };
};

// Helper function to generate unique ID
const generateId = (config, timestamp = Date.now(), sequence = 1) => {
  const idFormat = config.idFormat || '{prefix}-{timestamp}-{sequence}';
  
  return idFormat
    .replace('{prefix}', config.idPrefix)
    .replace('{timestamp}', timestamp)
    .replace('{sequence}', sequence);
};

// Helper function to check if ID needs regeneration
const needsIdRegeneration = (id) => {
  if (!id) return true;
  // Check if it's just a simple number
  if (/^\d+$/.test(String(id))) return true;
  // Check if it's a sequential number like "1", "2", "3"
  if (Number.isInteger(Number(id)) && Number(id) < 10000) return true;
  return false;
};

// Helper function to read CSV file
const readCSV = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
};

// Helper function to write CSV file
const writeCSV = async (filePath, data, columns) => {
  try {
    if (!data || data.length === 0) {
      // Write empty file with headers only
      const emptyData = [columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {})];
      const csvContent = stringify(emptyData, {
        header: true,
        columns: columns
      });
      await fs.writeFile(filePath, csvContent);
      return;
    }

    const csvContent = stringify(data, {
      header: true,
      columns: columns || Object.keys(data[0])
    });
    await fs.writeFile(filePath, csvContent);
  } catch (error) {
    console.error('Error writing CSV:', error);
    throw error;
  }
};

// Helper function to clean data (replace commas with semicolons)
const cleanData = (data) => {
  if (typeof data === 'string') {
    return data.replace(/,/g, ';');
  }
  if (Array.isArray(data)) {
    return data.map(cleanData);
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = cleanData(data[key]);
    }
    return cleaned;
  }
  return data;
};

// Helper function to ensure all rows have unique IDs
const ensureUniqueIds = async (data, config, databaseName) => {
  const idField = config.idField;
  const timestamp = Date.now();
  let needsUpdate = false;
  
  const processedData = data.map((row, index) => {
    const currentId = row[idField];
    
    if (needsIdRegeneration(currentId)) {
      needsUpdate = true;
      row[idField] = generateId(config, timestamp, index + 1);
      
      // For engineering database, also set s_no
      if (databaseName === 'engineering' && (!row.s_no || needsIdRegeneration(row.s_no))) {
        row.s_no = row[idField];
      }
      
      if (!row.created_at) {
        row.created_at = new Date().toISOString();
      }
      row.updated_at = new Date().toISOString();
    }
    
    return row;
  });
  
  return { data: processedData, updated: needsUpdate };
};

// API Routes

// Get database configurations
app.get('/api/configs', (req, res) => {
  res.json({
    configs: databaseConfigs,
    names: Object.keys(databaseConfigs)
  });
});

// Get list of databases
app.get('/api/databases', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const databases = [];
    
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(DATA_DIR, file);
        const stats = await fs.stat(filePath);
        const data = await readCSV(filePath);
        const name = file.replace('.csv', '');
        const config = getConfig(name);
        
        databases.push({
          name: name,
          filename: file,
          recordCount: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          size: stats.size,
          modified: stats.mtime,
          idField: config.idField,
          config: config
        });
      }
    }
    
    res.json({ databases });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  }
});

// Delete database
app.delete('/api/databases/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(DATA_DIR, `${name}.csv`);
    
    await fs.unlink(filePath);
    res.json({ message: 'Database deleted successfully' });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ error: 'Failed to delete database' });
  }
});

// Export database
app.get('/api/databases/:name/export', async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(DATA_DIR, `${name}.csv`);
    
    const fileContent = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
    res.send(fileContent);
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Get rows from CSV with automatic ID checking - UPGRADED TO REMOVE LIMIT
app.get('/api/csv/:database/rows', async (req, res) => {
  try {
    const { database } = req.params;
    const { 
      page = 1, 
      limit, // No default limit - if not provided, return all rows
      search = '', 
      sortBy = '', 
      sortOrder = 'asc',
      all = 'false' // New parameter to explicitly request all rows
    } = req.query;
    
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    let data = await readCSV(filePath);
    const config = getConfig(database);
    const idField = config.idField;
    
    console.log(`Fetching rows for ${database}: Total rows in file: ${data.length}`);
    
    // Ensure all rows have proper unique IDs
    const { data: processedData, updated } = await ensureUniqueIds(data, config, database);
    
    // Save if IDs were updated
    if (updated) {
      const columns = processedData.length > 0 ? Object.keys(processedData[0]) : [];
      // Ensure ID field is first
      if (columns.includes(idField)) {
        const index = columns.indexOf(idField);
        columns.splice(index, 1);
        columns.unshift(idField);
      }
      await writeCSV(filePath, processedData, columns);
      console.log('Updated IDs for rows that needed regeneration');
    }
    
    data = processedData;
    
    // Apply search filter
    if (search) {
      data = data.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
      console.log(`After search filter: ${data.length} rows`);
    }
    
    // Apply sorting
    if (sortBy && data.length > 0 && data[0].hasOwnProperty(sortBy)) {
      data.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    // Apply pagination ONLY if limit is specified and not requesting all rows
    let paginatedData = data;
    let currentPage = parseInt(page);
    let pageLimit = limit ? parseInt(limit) : data.length; // If no limit, return all
    
    if (all === 'true' || !limit) {
      // Return all data without pagination
      paginatedData = data;
      console.log(`Returning all ${data.length} rows (no pagination)`);
    } else {
      // Apply pagination with specified limit
      const startIndex = (currentPage - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      paginatedData = data.slice(startIndex, endIndex);
      console.log(`Pagination: Page ${currentPage}, Limit ${pageLimit}, Returning rows ${startIndex} to ${endIndex}`);
    }
    
    const response = {
      rows: paginatedData,
      total: data.length, // Always return total count of all data
      count: data.length, // Total count after filters
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(data.length / pageLimit),
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      idField: idField,
      config: config,
      idsUpdated: updated,
      allRows: all === 'true' || !limit // Indicate if all rows are being returned
    };
    
    console.log(`Response: Returning ${paginatedData.length} rows out of ${data.length} total`);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching rows:', error);
    res.status(500).json({ error: 'Failed to fetch rows' });
  }
});

// Get single row by index
app.get('/api/csv/:database/rows/:index', async (req, res) => {
  try {
    const { database, index } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const data = await readCSV(filePath);
    
    const rowIndex = parseInt(index);
    if (rowIndex >= 0 && rowIndex < data.length) {
      res.json({ row: data[rowIndex] });
    } else {
      res.status(404).json({ error: 'Row not found' });
    }
  } catch (error) {
    console.error('Error fetching row:', error);
    res.status(500).json({ error: 'Failed to fetch row' });
  }
});

// Add new row with automatic unique ID generation
app.post('/api/csv/:database/rows', async (req, res) => {
  try {
    const { database } = req.params;
    const newRow = cleanData(req.body);
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField;
    
    // Read existing data
    let data = await readCSV(filePath);
    
    // Always generate a new unique ID for new rows
    const timestamp = Date.now();
    const sequence = data.length + 1;
    newRow[idField] = generateId(config, timestamp, sequence);
    
    // For engineering database, also set s_no
    if (database === 'engineering' && !newRow.s_no) {
      newRow.s_no = newRow[idField];
    }
    
    // Check for duplicates based on ID
    const isDuplicate = data.some(row => row[idField] === newRow[idField]);
    if (isDuplicate) {
      // Generate alternative ID if duplicate
      newRow[idField] = generateId(config, timestamp + 1, sequence);
    }
    
    // Add timestamps
    newRow.created_at = new Date().toISOString();
    newRow.updated_at = new Date().toISOString();
    
    // Add the new row
    data.push(newRow);
    
    // Get all columns (including new ones from the new row)
    const allColumns = [...new Set([
      ...Object.keys(data[0] || {}),
      ...Object.keys(newRow)
    ])];
    
    // Ensure ID field is first
    if (allColumns.includes(idField)) {
      const index = allColumns.indexOf(idField);
      allColumns.splice(index, 1);
      allColumns.unshift(idField);
    }
    
    // Write back to file
    await writeCSV(filePath, data, allColumns);
    
    res.json({ 
      message: 'Row added successfully with unique ID', 
      row: newRow,
      index: data.length - 1,
      generatedId: newRow[idField]
    });
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({ error: 'Failed to add row' });
  }
});

// Update row (preserves ID)
app.put('/api/csv/:database/rows/:index', async (req, res) => {
  try {
    const { database, index } = req.params;
    const updatedRow = cleanData(req.body);
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField;
    
    let data = await readCSV(filePath);
    const rowIndex = parseInt(index);
    
    if (rowIndex >= 0 && rowIndex < data.length) {
      // Preserve original ID
      const originalId = data[rowIndex][idField];
      
      // Update the row
      data[rowIndex] = {
        ...data[rowIndex],
        ...updatedRow,
        [idField]: originalId, // Always preserve original ID
        updated_at: new Date().toISOString()
      };
      
      // Get all columns
      const allColumns = [...new Set(
        data.flatMap(row => Object.keys(row))
      )];
      
      // Ensure ID field is first
      if (allColumns.includes(idField)) {
        const idx = allColumns.indexOf(idField);
        allColumns.splice(idx, 1);
        allColumns.unshift(idField);
      }
      
      // Write back to file
      await writeCSV(filePath, data, allColumns);
      
      res.json({ 
        message: 'Row updated successfully', 
        row: data[rowIndex] 
      });
    } else {
      res.status(404).json({ error: 'Row not found' });
    }
  } catch (error) {
    console.error('Error updating row:', error);
    res.status(500).json({ error: 'Failed to update row' });
  }
});

// Delete row
app.delete('/api/csv/:database/rows/:index', async (req, res) => {
  try {
    const { database, index } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    
    let data = await readCSV(filePath);
    const rowIndex = parseInt(index);
    
    if (rowIndex >= 0 && rowIndex < data.length) {
      const deletedRow = data.splice(rowIndex, 1)[0];
      
      // Get columns from remaining data
      const columns = data.length > 0 ? Object.keys(data[0]) : Object.keys(deletedRow);
      
      // Write back to file
      await writeCSV(filePath, data, columns);
      
      res.json({ 
        message: 'Row deleted successfully',
        deletedRow 
      });
    } else {
      res.status(404).json({ error: 'Row not found' });
    }
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({ error: 'Failed to delete row' });
  }
});

// Analyze Excel file structure (works with both .xls and .xlsx)
app.post('/api/analyze/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Analyzing file:', req.file.originalname, 'Size:', req.file.size);
    
    const sheets = {};
    
    try {
      // Use XLSX package to read the file
      const workbook = XLSX.read(req.file.buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: true,
        cellStyles: true,
        sheetRows: 0 // Read ALL rows, no limit
      });
      
      console.log('Workbook loaded, sheets:', workbook.SheetNames);
      
      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Get sheet range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        console.log(`Processing sheet: ${sheetName}, range: ${worksheet['!ref']}`);
        
        // Convert sheet to JSON to get data - NO LIMIT
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Return array of arrays
          defval: '', // Default value for empty cells
          blankrows: false // Skip blank rows
        });
        
        // Get headers from first row
        const headers = jsonData.length > 0 ? jsonData[0].map(h => String(h || '').trim()).filter(h => h) : [];
        
        // Count data rows (excluding header)
        const dataRows = jsonData.length > 1 ? jsonData.slice(1).filter(row => 
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        ) : [];
        
        sheets[sheetName] = {
          name: sheetName,
          rowCount: dataRows.length,
          columns: headers,
          totalRows: range.e.r + 1, // End row + 1
          actualColumns: range.e.c + 1 // End column + 1
        };
        
        console.log(`Sheet ${sheetName} analysis:`, {
          columns: headers.length,
          rows: dataRows.length,
          totalRows: range.e.r + 1,
          headers: headers.slice(0, 5)
        });
      });
      
      if (Object.keys(sheets).length === 0) {
        sheets['Sheet1'] = {
          name: 'Sheet1',
          rowCount: 0,
          columns: [],
          totalRows: 0,
          actualColumns: 0,
          error: 'No sheets found in file'
        };
      }
      
    } catch (xlsxError) {
      console.error('Error reading Excel file:', xlsxError);
      sheets['Sheet1'] = {
        name: 'Sheet1',
        rowCount: 0,
        columns: [],
        totalRows: 0,
        actualColumns: 0,
        error: 'Error reading file: ' + xlsxError.message
      };
    }
    
    console.log('Analysis complete. Total sheets:', Object.keys(sheets).length);
    
    res.json({ sheets });
  } catch (error) {
    console.error('Error analyzing Excel:', error);
    res.status(500).json({ 
      error: 'Failed to analyze file',
      details: error.message 
    });
  }
});

// Upload Excel file with automatic unique ID generation for every row - NO LIMITS
app.post('/api/upload/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { 
      database_name, 
      column_mapping = '{}', 
      key_columns = '[]',
      config_name = '',
      id_field = '',
      id_prefix = ''
    } = req.body;
    
    const columnMapping = JSON.parse(column_mapping);
    const keyColumns = JSON.parse(key_columns);
    
    if (!database_name) {
      return res.status(400).json({ error: 'Database name is required' });
    }

    console.log('Processing upload for database:', database_name);
    console.log('File:', req.file.originalname, 'Size:', req.file.size);

    const filePath = path.join(DATA_DIR, `${database_name}.csv`);
    
    // Get configuration
    const config = config_name ? getConfig(config_name) : getConfig(database_name);
    if (id_field) config.idField = id_field;
    if (id_prefix) config.idPrefix = id_prefix;
    
    const idField = config.idField;
    console.log('Using ID field:', idField, 'Prefix:', config.idPrefix);
    
    // Read existing data if file exists
    let existingData = [];
    try {
      existingData = await readCSV(filePath);
      console.log('Existing data rows:', existingData.length);
    } catch {
      console.log('No existing data file');
    }

    // Parse Excel file using XLSX with NO ROW LIMIT
    const workbook = XLSX.read(req.file.buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: true,
      cellStyles: true,
      dateNF: 'yyyy-mm-dd',
      sheetRows: 0 // Read ALL rows, no limit
    });
    
    console.log('Workbook loaded, sheets:', workbook.SheetNames);
    
    let allNewData = [];
    const stats = {
      total_records: 0,
      new_records: 0,
      duplicates_skipped: 0,
      sheets_processed: 0,
      ids_generated: 0
    };

    const timestamp = Date.now();
    let globalSequence = existingData.length + 1;

    // Process each worksheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON - NO LIMIT
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Get array of arrays
        defval: '', // Default value for empty cells
        blankrows: false, // Skip blank rows
        dateNF: 'yyyy-mm-dd'
      });
      
      console.log(`Sheet ${sheetName} has ${jsonData.length} rows (including header)`);
      
      if (jsonData.length === 0) {
        console.log(`Sheet ${sheetName} is empty, skipping`);
        return;
      }
      
      // Get headers from first row
      const headers = jsonData[0].map(h => String(h || '').trim());
      console.log(`Found headers:`, headers.slice(0, 10));
      
      // Apply column mapping to headers
      const mappedHeaders = headers.map(header => {
        if (!header) return null;
        return columnMapping[header] || header;
      });
      
      // Process ALL data rows (skip header row)
      let sheetRowCount = 0;
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell && cell !== 0)) {
          continue;
        }
        
        const rowData = {
          source_sheet: sheetName
        };
        
        let hasData = false;
        
        // Map each cell to its header
        row.forEach((cell, index) => {
          if (index < mappedHeaders.length && mappedHeaders[index]) {
            const value = cell;
            if (value !== null && value !== undefined && value !== '') {
              hasData = true;
              
              // Handle different value types
              if (value instanceof Date) {
                // Format date as YYYY-MM-DD
                rowData[mappedHeaders[index]] = value.toISOString().split('T')[0];
              } else if (typeof value === 'number') {
                rowData[mappedHeaders[index]] = value.toString();
              } else {
                rowData[mappedHeaders[index]] = cleanData(String(value));
              }
            }
          }
        });
        
        if (hasData) {
          allNewData.push(rowData);
          sheetRowCount++;
        }
      }
      
      console.log(`Sheet ${sheetName} extracted ${sheetRowCount} data rows`);
      stats.sheets_processed++;
    });

    console.log('Total rows extracted from all sheets:', allNewData.length);

    // Generate unique IDs for ALL rows and check for duplicates
    const processedData = [];
    
    for (let i = 0; i < allNewData.length; i++) {
      const row = allNewData[i];
      stats.total_records++;
      
      // Always generate a unique ID for each row
      row[idField] = generateId(config, timestamp, globalSequence++);
      stats.ids_generated++;
      
      if (i % 100 === 0) {
        console.log(`Processing row ${i + 1}/${allNewData.length}`);
      }
      
      // Check for duplicates based on key columns
      let isDuplicate = false;
      if (keyColumns.length > 0 && keyColumns[0] !== idField) {
        isDuplicate = [...existingData, ...processedData].some(existingRow => 
          keyColumns.every(key => key !== idField && existingRow[key] === row[key])
        );
      }
      
      if (!isDuplicate) {
        row.created_at = new Date().toISOString();
        row.updated_at = new Date().toISOString();
        processedData.push(row);
        stats.new_records++;
      } else {
        stats.duplicates_skipped++;
      }
    }

    console.log('Processing complete:', {
      totalExtracted: allNewData.length,
      processed: processedData.length,
      duplicatesSkipped: stats.duplicates_skipped
    });

    // Merge with existing data
    const finalData = [...existingData, ...processedData];
    
    // Get all unique columns
    const allColumns = [...new Set(
      finalData.flatMap(row => Object.keys(row))
    )];
    
    // Ensure ID field is first column
    if (allColumns.includes(idField)) {
      const index = allColumns.indexOf(idField);
      allColumns.splice(index, 1);
      allColumns.unshift(idField);
    }
    
    console.log('Final data summary:', {
      totalRows: finalData.length,
      columns: allColumns.length,
      idField: idField
    });
    
    // Write to CSV file
    await writeCSV(filePath, finalData, allColumns);
    
    console.log('Upload complete!');
    
    res.json({
      message: 'File uploaded and processed successfully with unique IDs for all rows',
      filename: database_name,
      stats
    });
  } catch (error) {
    console.error('Error uploading Excel:', error);
    res.status(500).json({ error: error.message || 'Failed to upload Excel file' });
  }
});

// Regenerate IDs for a database
app.post('/api/databases/:name/regenerate-ids', async (req, res) => {
  try {
    const { name } = req.params;
    const { config_name = '' } = req.body;
    
    const filePath = path.join(DATA_DIR, `${name}.csv`);
    const config = config_name ? getConfig(config_name) : getConfig(name);
    const idField = config.idField;
    
    let data = await readCSV(filePath);
    
    if (data.length === 0) {
      return res.json({ message: 'No data to update', updated: 0, total: 0 });
    }
    
    console.log(`Regenerating IDs for ${data.length} rows in ${name}`);
    
    let updatedCount = 0;
    const timestamp = Date.now();
    
    // Regenerate IDs for all rows that need it
    data = data.map((row, index) => {
      const currentId = row[idField];
      
      if (needsIdRegeneration(currentId)) {
        updatedCount++;
        row[idField] = generateId(config, timestamp, index + 1);
        
        // For engineering database, also update s_no
        if (name === 'engineering' && needsIdRegeneration(row.s_no)) {
          row.s_no = row[idField];
        }
        
        row.updated_at = new Date().toISOString();
      }
      
      if (index % 100 === 0) {
        console.log(`Processed ${index + 1}/${data.length} rows`);
      }
      
      return row;
    });
    
    // Save updated data
    const columns = Object.keys(data[0]);
    
    // Ensure ID field is first column
    if (columns.includes(idField)) {
      const index = columns.indexOf(idField);
      columns.splice(index, 1);
      columns.unshift(idField);
    }
    
    await writeCSV(filePath, data, columns);
    
    console.log(`ID regeneration complete: ${updatedCount} IDs updated`);
    
    res.json({
      message: 'IDs regenerated successfully',
      updated: updatedCount,
      total: data.length
    });
  } catch (error) {
    console.error('Error regenerating IDs:', error);
    res.status(500).json({ error: 'Failed to regenerate IDs' });
  }
});

// Get database statistics
app.get('/api/stats/:database', async (req, res) => {
  try {
    const { database } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const data = await readCSV(filePath);
    const config = getConfig(database);
    
    console.log(`Getting stats for ${database}: ${data.length} total records`);
    
    const stats = {
      totalRecords: data.length,
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      idField: config.idField,
      config: config,
      idsNeedingRegeneration: 0
    };
    
    // Count IDs that need regeneration
    stats.idsNeedingRegeneration = data.filter(row => 
      needsIdRegeneration(row[config.idField])
    ).length;
    
    // Calculate additional statistics based on database type
    if (database === 'engineering') {
      const totalSanctioned = data.reduce((sum, row) => 
        sum + (parseFloat(row.sd_amount_lakh) || 0), 0
      );
      const totalExpenditure = data.reduce((sum, row) => 
        sum + (parseFloat(row.expenditure_total) || 0), 0
      );
      const avgProgress = data.length > 0 
        ? data.reduce((sum, row) => sum + (parseFloat(row.physical_progress_percent) || 0), 0) / data.length
        : 0;
      
      stats.financial = {
        totalSanctioned,
        totalExpenditure,
        avgProgress
      };
    } else if (database === 'operations') {
      const totalLength = data.reduce((sum, row) => 
        sum + (parseFloat(row.LENGTH_KM) || 0), 0
      );
      const totalAmount = data.reduce((sum, row) => 
        sum + (parseFloat(row['SANCTIONED_AMOUNT_CR']) || 0), 0
      );
      const avgCompletion = data.length > 0
        ? data.reduce((sum, row) => sum + (parseFloat(row.COMPLETED_PERCENTAGE) || 0), 0) / data.length
        : 0;
      
      stats.financial = {
        totalLength,
        totalAmount,
        avgCompletion
      };
    } else if (database === 'enggcurrentyear') {
      const totalAllotment = data.reduce((sum, row) => 
        sum + (parseFloat(row.Allotment) || 0), 0
      );
      const totalExpenditure = data.reduce((sum, row) => 
        sum + (parseFloat(row['Total Expdr']) || 0), 0
      );
      const balanceFund = data.reduce((sum, row) => 
        sum + (parseFloat(row['Balance fund']) || 0), 0
      );
      
      stats.financial = {
        totalAllotment,
        totalExpenditure,
        balanceFund
      };
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Add these new endpoints to server.js
// These would be inserted into the existing server.js file

// Get single row by ID
app.get('/api/csv/:database/row/:id', async (req, res) => {
  try {
    const { database, id } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField || 'id';
    
    // Read the CSV file
    const data = await readCSV(filePath);
    
    // Find the row by ID
    const row = data.find(r => String(r[idField]) === String(id));
    
    if (row) {
      res.json({ row });
    } else {
      res.status(404).json({ error: `Row with ID '${id}' not found` });
    }
  } catch (error) {
    console.error('Error fetching row by ID:', error);
    res.status(500).json({ error: 'Failed to fetch row' });
  }
});

// Update row by ID
app.put('/api/csv/:database/row/:id', async (req, res) => {
  try {
    const { database, id } = req.params;
    const updatedRow = cleanData(req.body);
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField || 'id';
    
    // Read the CSV file
    let data = await readCSV(filePath);
    
    // Find the row index by ID
    const rowIndex = data.findIndex(r => String(r[idField]) === String(id));
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: `Row with ID '${id}' not found` });
    }
    
    // Preserve original ID
    const originalId = data[rowIndex][idField];
    
    // Update the row
    data[rowIndex] = {
      ...data[rowIndex],
      ...updatedRow,
      [idField]: originalId, // Always preserve original ID
      updated_at: new Date().toISOString()
    };
    
    // Get all columns
    const allColumns = [...new Set(
      data.flatMap(row => Object.keys(row))
    )];
    
    // Ensure ID field is first
    if (allColumns.includes(idField)) {
      const idx = allColumns.indexOf(idField);
      allColumns.splice(idx, 1);
      allColumns.unshift(idField);
    }
    
    // Write back to file
    await writeCSV(filePath, data, allColumns);
    
    res.json({ 
      message: 'Row updated successfully', 
      row: data[rowIndex] 
    });
  } catch (error) {
    console.error('Error updating row by ID:', error);
    res.status(500).json({ error: 'Failed to update row' });
  }
});

// Delete row by ID
app.delete('/api/csv/:database/row/:id', async (req, res) => {
  try {
    const { database, id } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField || 'id';
    
    // Read the CSV file
    let data = await readCSV(filePath);
    
    // Find the row index by ID
    const rowIndex = data.findIndex(r => String(r[idField]) === String(id));
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: `Row with ID '${id}' not found` });
    }
    
    // Delete the row
    const deletedRow = data.splice(rowIndex, 1)[0];
    
    // Get columns from remaining data
    const columns = data.length > 0 ? Object.keys(data[0]) : Object.keys(deletedRow);
    
    // Write back to file
    await writeCSV(filePath, data, columns);
    
    res.json({ 
      message: 'Row deleted successfully',
      deletedRow,
      remainingCount: data.length
    });
  } catch (error) {
    console.error('Error deleting row by ID:', error);
    res.status(500).json({ error: 'Failed to delete row' });
  }
});

// Find row index by ID (helper endpoint)
app.get('/api/csv/:database/findRowIndex/:id', async (req, res) => {
  try {
    const { database, id } = req.params;
    const filePath = path.join(DATA_DIR, `${database}.csv`);
    const config = getConfig(database);
    const idField = config.idField || 'id';
    
    // Read the CSV file
    const data = await readCSV(filePath);
    
    // Find the row index by ID
    const rowIndex = data.findIndex(r => String(r[idField]) === String(id));
    
    if (rowIndex === -1) {
      res.status(404).json({ error: `Row with ID '${id}' not found`, found: false });
    } else {
      res.json({ 
        rowIndex, 
        found: true, 
        message: `Row with ID '${id}' found at index ${rowIndex}` 
      });
    }
  } catch (error) {
    console.error('Error finding row index by ID:', error);
    res.status(500).json({ error: 'Failed to find row index', found: false });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '3.1.0',
    features: {
      automaticIdGeneration: true,
      databaseConfigurations: true,
      duplicateDetection: true,
      columnMapping: true,
      unlimitedRows: true // New feature flag
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log('Features enabled:');
  console.log('  ✓ Automatic unique ID generation for all rows');
  console.log('  ✓ Database configurations support');
  console.log('  ✓ ID regeneration for existing data');
  console.log('  ✓ Duplicate detection');
  console.log('  ✓ Column mapping');
  console.log('  ✓ UNLIMITED ROW SUPPORT - No limits on data size');
  console.log('Supported databases:', Object.keys(databaseConfigs).join(', '));
});