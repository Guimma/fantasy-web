const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class SheetsMCPServer {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
    
    // Buscar credenciais de vários locais possíveis
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath && fs.existsSync(credentialsPath)) {
      this.credentialsPath = path.resolve(credentialsPath);
    } else if (fs.existsSync('./credentials.json')) {
      this.credentialsPath = path.resolve('./credentials.json');
    } else if (fs.existsSync('../credentials.json')) {
      this.credentialsPath = path.resolve('../credentials.json');
    } else {
      console.error('Credentials file not found');
      this.credentialsPath = null;
    }
    
    console.log('Using spreadsheet ID:', this.spreadsheetId);
    console.log('Using credentials path:', this.credentialsPath);
  }

  async initialize() {
    try {
      if (this.credentialsPath) {
        // Usar arquivo de credenciais
        this.auth = new google.auth.GoogleAuth({
          keyFile: this.credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const client = await this.auth.getClient();
        this.sheets = google.sheets({ version: 'v4', auth: client });
      } else {
        // Tentativa alternativa: usar OAuth2 diretamente para interface web
        console.log('No credentials file found, using direct API access');
        this.sheets = google.sheets({ version: 'v4' });
      }
      
      console.log('Sheets MCP Server initialized successfully');
      return true;
    } catch (error) {
      console.error('Initialization error:', error.message);
      return false;
    }
  }

  async handleRequest(requestStr) {
    try {
      const { type, query, data } = JSON.parse(requestStr);
      
      switch (type) {
        case 'search':
          return await this.searchSheets(query);
        case 'get_sheet_data':
          return await this.getSheetData(query);
        case 'get_sheet_structure':
          return await this.getSheetStructure(query);
        case 'get_all_sheets':
          return await this.getAllSheets();
        case 'analyze_sheet':
          return await this.analyzeSheet(query);
        case 'update_cell':
          return await this.updateCell(query, data);
        default:
          return { error: 'Unknown request type' };
      }
    } catch (error) {
      return { error: `Error parsing request: ${error.message}` };
    }
  }

  async searchSheets(query) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      const sheets = response.data.sheets.map(sheet => sheet.properties.title);
      return { sheets };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getSheetData(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
      });
      
      return { data: response.data.values };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getSheetStructure(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        ranges: [sheetName],
        includeGridData: true
      });
      
      const sheet = response.data.sheets[0];
      const headers = [];
      
      if (sheet && sheet.data && sheet.data[0] && sheet.data[0].rowData && sheet.data[0].rowData.length > 0) {
        const headerRow = sheet.data[0].rowData[0];
        if (headerRow.values) {
          headerRow.values.forEach(cell => {
            headers.push(cell.formattedValue || '');
          });
        }
      }
      
      return { 
        sheetName,
        headers,
        rowCount: sheet.properties.gridProperties.rowCount,
        columnCount: sheet.properties.gridProperties.columnCount
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getAllSheets() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      const sheets = response.data.sheets.map(sheet => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
        rowCount: sheet.properties.gridProperties.rowCount,
        columnCount: sheet.properties.gridProperties.columnCount
      }));
      
      return { sheets };
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeSheet(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
      });
      
      const values = response.data.values || [];
      
      if (values.length === 0) {
        return { 
          sheetName,
          isEmpty: true,
          analysis: "Sheet is empty"
        };
      }
      
      const headers = values[0] || [];
      const dataRows = values.slice(1);
      
      const columnAnalysis = headers.map((header, index) => {
        const columnValues = dataRows.map(row => row[index]).filter(val => val !== undefined && val !== null && val !== '');
        const uniqueValues = [...new Set(columnValues)];
        
        return {
          column: header,
          count: columnValues.length,
          uniqueCount: uniqueValues.length,
          nonEmpty: columnValues.length,
          empty: dataRows.length - columnValues.length,
          examples: uniqueValues.slice(0, 5)
        };
      });
      
      return { 
        sheetName,
        rowCount: values.length,
        dataRowCount: dataRows.length,
        headers,
        columnAnalysis
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async updateCell(query, data) {
    try {
      if (!query.range || !data.value) {
        return { error: 'Range and value are required' };
      }
      
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: query.range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[data.value]]
        }
      });
      
      return { 
        success: true,
        updatedCells: response.data.updatedCells,
        updatedRange: response.data.updatedRange
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

async function main() {
  const server = new SheetsMCPServer();
  const initialized = await server.initialize();
  
  if (!initialized) {
    console.error('Failed to initialize the MCP server');
    process.exit(1);
  }

  if (process.argv.length > 2) {
    const command = process.argv[2];
    let result;
    
    if (command === 'list-sheets') {
      result = await server.getAllSheets();
    } else if (command === 'analyze') {
      const sheetName = process.argv[3] || 'Sheet1';
      result = await server.analyzeSheet(sheetName);
    } else if (command === 'get-structure') {
      const sheetName = process.argv[3] || 'Sheet1';
      result = await server.getSheetStructure(sheetName);
    } else if (command === 'get-data') {
      const sheetName = process.argv[3] || 'Sheet1';
      result = await server.getSheetData(sheetName);
    }
    
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // MCP server mode
  process.stdin.setEncoding('utf8');
  let inputBuffer = '';

  process.stdin.on('data', async (chunk) => {
    inputBuffer += chunk;
    
    // Try to find complete messages
    const delim = '\n';
    let delimIndex;
    
    while ((delimIndex = inputBuffer.indexOf(delim)) !== -1) {
      const message = inputBuffer.substring(0, delimIndex);
      inputBuffer = inputBuffer.substring(delimIndex + delim.length);
      
      const result = await server.handleRequest(message);
      process.stdout.write(JSON.stringify(result) + delim);
    }
  });

  process.stdin.on('end', () => {
    // Process any remaining input
    if (inputBuffer.length > 0) {
      server.handleRequest(inputBuffer)
        .then(result => {
          process.stdout.write(JSON.stringify(result) + '\n');
          process.exit(0);
        })
        .catch(error => {
          console.error('Error processing request:', error);
          process.exit(1);
        });
    } else {
      process.exit(0);
    }
  });

  // Keep the process alive
  console.log('Sheets MCP Server running. Waiting for input...');
}

main();

module.exports = { SheetsMCPServer }; 