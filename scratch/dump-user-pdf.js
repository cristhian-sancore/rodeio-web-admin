const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = 'C:/coisas/RODEIO/SORTEIO 1º NOITE TOURO TRIVELATO.pdf';

if (!fs.existsSync(filePath)) {
    console.error("Arquivo não encontrado:", filePath);
    process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);

pdf(fileBuffer, {
    pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
            let lastY, lastX, text = '';
            for (let item of textContent.items) {
                const x = item.transform[4];
                const y = item.transform[5];
                
                if (lastY !== undefined && Math.abs(lastY - y) > 5) {
                    text += '\n';
                } else if (lastX !== undefined && (x - lastX) > 12) {
                    text += ' | ';
                } else if (lastX !== undefined && (x - lastX) > 1) {
                    text += ' ';
                }
                
                text += item.str;
                lastY = y;
                lastX = x + (item.width || (item.str.length * 4));
            }
            return text;
        });
    }
}).then(data => {
    console.log("--- START DUMP ---");
    console.log(data.text);
    console.log("--- END DUMP ---");
}).catch(err => {
    console.error(err);
});
