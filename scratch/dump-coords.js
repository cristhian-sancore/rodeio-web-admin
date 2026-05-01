const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = 'C:/coisas/RODEIO/SORTEIO 1º NOITE TOURO TRIVELATO.pdf';
const fileBuffer = fs.readFileSync(filePath);

pdf(fileBuffer, {
    pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
            let out = "";
            for (let item of textContent.items) {
                const x = Math.round(item.transform[4]);
                const y = Math.round(item.transform[5]);
                out += `[X:${x}, Y:${y}] ${item.str}\n`;
            }
            return out;
        });
    }
}).then(data => {
    console.log(data.text);
});
