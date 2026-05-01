const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = 'C:/coisas/RODEIO/SORTEIO 1º NOITE TOURO TRIVELATO.pdf';
const fileBuffer = fs.readFileSync(filePath);

pdf(fileBuffer, {
    pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
            let lastY, text = '';
            
            const items = textContent.items.sort((a, b) => {
                const yA = a.transform[5];
                const yB = b.transform[5];
                if (Math.abs(yA - yB) > 5) return yB - yA;
                return a.transform[4] - b.transform[4];
            });

            for (let item of items) {
                const x = item.transform[4];
                const y = item.transform[5];
                
                if (lastY !== undefined && Math.abs(lastY - y) > 5) {
                    text += '\n';
                }
                
                // Usando thresholds para forçar colunas
                if (x >= 60 && x < 65) text += ' | '; 
                if (x >= 190 && x < 195) text += ' | ';
                if (x >= 310 && x < 315) text += ' | ';
                if (x >= 410 && x < 415) text += ' | ';
                if (x >= 530 && x < 545) text += ' | ';
                
                text += item.str;
                lastY = y;
            }
            return text;
        });
    }
}).then(data => {
    console.log("--- START DUMP (GRID) ---");
    console.log(data.text);
    console.log("--- END DUMP ---");
});
