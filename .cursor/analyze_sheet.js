const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ID da planilha
const spreadsheetId = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';

async function main() {
  try {
    // Tenta ler as credenciais
    let auth;
    const credentialsPaths = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      './credentials.json',
      '../credentials.json',
      './.cursor/credentials.json'
    ];
    
    let credsFile = null;
    for (const p of credentialsPaths) {
      if (p && fs.existsSync(p)) {
        credsFile = p;
        break;
      }
    }
    
    if (credsFile) {
      console.log('Using credentials file:', credsFile);
      auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(credsFile),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      console.log('No credentials file found. Using API key only.');
      // Alternativa usando apenas API key
      auth = null;
    }
    
    // Configurar o cliente Sheets
    const sheets = google.sheets({ 
      version: 'v4',
      auth: auth ? await auth.getClient() : undefined
    });
    
    // Listar todas as abas da planilha
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    });
    
    console.log('Planilha encontrada:', sheetsResponse.data.properties.title);
    console.log('\nAbas disponíveis:');
    
    const sheetNames = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
    sheetNames.forEach(name => console.log(`- ${name}`));
    
    // Para cada aba, analisar as primeiras linhas para ver a estrutura
    console.log('\nDetalhes de cada aba:');
    
    for (const sheetName of sheetNames) {
      console.log(`\n#### Aba: ${sheetName} ####`);
      
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z10` // Primeiras 10 linhas, até coluna Z
      });
      
      const values = dataResponse.data.values || [];
      
      if (values.length === 0) {
        console.log('Aba vazia');
        continue;
      }
      
      // A primeira linha contém os cabeçalhos
      const headers = values[0];
      console.log('Colunas:', headers.join(', '));
      
      if (values.length > 1) {
        console.log(`Total de ${values.length} linhas (contando cabeçalho)`);
        console.log('Exemplo da primeira linha de dados:');
        console.log(values[1]);
      } else {
        console.log('Sem dados além do cabeçalho');
      }
    }
    
  } catch (error) {
    console.error('Erro ao analisar planilha:', error);
  }
}

main(); 