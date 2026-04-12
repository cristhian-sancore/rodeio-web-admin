const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function backup() {
    const source = path.join(__dirname, 'prisma', 'dev.db');
    const backupDir = path.join(__dirname, 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const baseName = `rodeio_bkp_${timestamp}`;
    const destDb = path.join(backupDir, `${baseName}.db`);
    const destZip = path.join(backupDir, `${baseName}.zip`);

    try {
        // 1. Copiar o banco
        fs.copyFileSync(source, destDb);
        console.log(`✅ Cópia do banco realizada: ${destDb}`);

        // 2. Compactar usando PowerShell (nativo no Windows)
        console.log(`📦 Compactando arquivo...`);
        const psCommand = `powershell -Command "Compress-Archive -Path '${destDb}' -DestinationPath '${destZip}' -Force"`;
        execSync(psCommand);

        // 3. Remover o arquivo .db descompactado para economizar espaço
        fs.unlinkSync(destDb);

        console.log(`✅ Backup completo e compactado com sucesso!`);
        console.log(`📂 Arquivo final: ${destZip}`);
    } catch (err) {
        console.error(`❌ Erro ao realizar backup: ${err.message}`);
    }
}

backup();
