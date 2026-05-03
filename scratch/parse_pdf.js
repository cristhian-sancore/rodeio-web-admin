const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\Cliente\\Downloads\\nova xavantina\\RESULTADO 1º NOITE EXPONOVA XAVANTINA.pdf';

async function parsePdf() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        
        console.log('--- CONTEÚDO DO PDF ---');
        console.log(data.text);
        console.log('--- FIM DO CONTEÚDO ---');
    } catch (error) {
        console.error('Erro ao ler PDF:', error);
    }
}

parsePdf();
