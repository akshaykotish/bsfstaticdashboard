const express = require('express');
const fs = require('fs').promises;
const csv = require('csv-parse');
const { stringify } = require('csv-stringify');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3456;

// Middleware
app.use(express.json());
app.use(cors());

// CSV folder path
const CSV_FOLDER = './'; // Adjust this path as needed

// Helper function to read CSV file
async function readCSV(filename) {
    try {
        const filePath = path.join(CSV_FOLDER, filename);
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        return new Promise((resolve, reject) => {
            csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: (value, context) => {
                    // Try to parse numbers
                    if (context.header) return value;
                    const num = Number(value);
                    if (!isNaN(num) && value.trim() !== '') {
                        return num;
                    }
                    return value;
                }
            }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });
    } catch (error) {
        throw new Error(`Error reading CSV: ${error.message}`);
    }
}

// Helper function to write CSV file
async function writeCSV(filename, data) {
    try {
        const filePath = path.join(CSV_FOLDER, filename);
        
        return new Promise((resolve, reject) => {
            stringify(data, {
                header: true,
                columns: Object.keys(data[0] || {})
            }, async (err, output) => {
                if (err) reject(err);
                else {
                    await fs.writeFile(filePath, output);
                    resolve();
                }
            });
        });
    } catch (error) {
        throw new Error(`Error writing CSV: ${error.message}`);
    }
}

// GET endpoint to retrieve CSV data
app.get('/csv/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const data = await readCSV(filename);
        res.json({
            success: true,
            filename: filename,
            rowCount: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to update a specific row
app.post('/csv/:filename/update', async (req, res) => {
    try {
        const { filename } = req.params;
        const { rowIndex, updates } = req.body;
        
        if (rowIndex === undefined || !updates) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: rowIndex and updates'
            });
        }
        
        const data = await readCSV(filename);
        
        if (rowIndex < 0 || rowIndex >= data.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid row index'
            });
        }
        
        // Update the specific row
        data[rowIndex] = { ...data[rowIndex], ...updates };
        
        await writeCSV(filename, data);
        
        res.json({
            success: true,
            message: 'Row updated successfully',
            updatedRow: data[rowIndex]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to update multiple rows
app.post('/csv/:filename/update-multiple', async (req, res) => {
    try {
        const { filename } = req.params;
        const { updates } = req.body; // Array of {rowIndex, updates}
        
        if (!Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                error: 'Updates must be an array'
            });
        }
        
        const data = await readCSV(filename);
        
        // Apply all updates
        for (const update of updates) {
            if (update.rowIndex >= 0 && update.rowIndex < data.length) {
                data[update.rowIndex] = { ...data[update.rowIndex], ...update.updates };
            }
        }
        
        await writeCSV(filename, data);
        
        res.json({
            success: true,
            message: `${updates.length} rows updated successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to add a new row
app.post('/csv/:filename/add', async (req, res) => {
    try {
        const { filename } = req.params;
        const { row } = req.body;
        
        if (!row) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: row'
            });
        }
        
        const data = await readCSV(filename);
        data.push(row);
        
        await writeCSV(filename, data);
        
        res.json({
            success: true,
            message: 'Row added successfully',
            newRowIndex: data.length - 1,
            totalRows: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to delete a row
app.post('/csv/:filename/delete', async (req, res) => {
    try {
        const { filename } = req.params;
        const { rowIndex } = req.body;
        
        if (rowIndex === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: rowIndex'
            });
        }
        
        const data = await readCSV(filename);
        
        if (rowIndex < 0 || rowIndex >= data.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid row index'
            });
        }
        
        const deletedRow = data.splice(rowIndex, 1)[0];
        
        await writeCSV(filename, data);
        
        res.json({
            success: true,
            message: 'Row deleted successfully',
            deletedRow: deletedRow,
            remainingRows: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to update by condition
app.post('/csv/:filename/update-where', async (req, res) => {
    try {
        const { filename } = req.params;
        const { condition, updates } = req.body;
        
        if (!condition || !updates) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: condition and updates'
            });
        }
        
        const data = await readCSV(filename);
        let updatedCount = 0;
        
        // Update rows that match the condition
        for (let i = 0; i < data.length; i++) {
            let match = true;
            for (const [key, value] of Object.entries(condition)) {
                if (data[i][key] != value) {
                    match = false;
                    break;
                }
            }
            if (match) {
                data[i] = { ...data[i], ...updates };
                updatedCount++;
            }
        }
        
        await writeCSV(filename, data);
        
        res.json({
            success: true,
            message: `${updatedCount} rows updated`,
            updatedCount: updatedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST endpoint to search rows
app.post('/csv/:filename/search', async (req, res) => {
    try {
        const { filename } = req.params;
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: query'
            });
        }
        
        const data = await readCSV(filename);
        const results = [];
        
        // Search for rows that match the query
        for (let i = 0; i < data.length; i++) {
            let match = true;
            for (const [key, value] of Object.entries(query)) {
                if (data[i][key] != value) {
                    match = false;
                    break;
                }
            }
            if (match) {
                results.push({
                    rowIndex: i,
                    data: data[i]
                });
            }
        }
        
        res.json({
            success: true,
            matchCount: results.length,
            results: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET endpoint to list available CSV files
app.get('/csv', async (req, res) => {
    try {
        const files = await fs.readdir(CSV_FOLDER);
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        
        const fileInfo = [];
        for (const file of csvFiles) {
            const stats = await fs.stat(path.join(CSV_FOLDER, file));
            fileInfo.push({
                filename: file,
                size: stats.size,
                modified: stats.mtime
            });
        }
        
        res.json({
            success: true,
            files: fileInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CSV Editor Server running on port ${PORT}`);
    console.log(`API Endpoints:`);
    console.log(`  GET  /csv                     - List all CSV files`);
    console.log(`  GET  /csv/:filename           - Get CSV data`);
    console.log(`  POST /csv/:filename/update    - Update a row`);
    console.log(`  POST /csv/:filename/update-multiple - Update multiple rows`);
    console.log(`  POST /csv/:filename/add       - Add a new row`);
    console.log(`  POST /csv/:filename/delete    - Delete a row`);
    console.log(`  POST /csv/:filename/update-where - Update rows by condition`);
    console.log(`  POST /csv/:filename/search    - Search rows`);
});