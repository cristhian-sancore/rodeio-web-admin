const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function backupProject() {
    const rootDir = __dirname;
    const backupDir = path.join(rootDir, 'backups');
    const tempDir = path.join(rootDir, 'temp_backup_source');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const zipName = `rodeio_projeto_completo_${timestamp}.zip`;
    const zipPath = path.join(backupDir, zipName);

    try {
        console.log(`🚀 Iniciando backup completo do projeto...`);

        // 1. Limpar tempDir se existir
        if (fs.existsSync(tempDir)) {
            console.log(`🧹 Limpando diretório temporário...`);
            execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempDir}'"`, { stdio: 'inherit' });
        }

        // 2. Usar Robocopy para copiar arquivos excluindo o lixo
        // /S = Subdiretórios (exceto vazios)
        // /E = Subdiretórios (incluindo vazios)
        // /XD = Excluir Diretórios
        // /XF = Excluir Arquivos
        console.log(`📂 Coletando arquivos (ignorando node_modules, .next, etc)...`);
        const robocopyCmd = `robocopy "${rootDir}" "${tempDir}" /E /XD node_modules .next backups .git temp_backup_source /R:0 /W:0`;
        
        try {
            execSync(robocopyCmd);
        } catch (roboErr) {
            // Robocopy retorna códigos de erro > 0 mesmo em sucesso parcial (ex: arquivos em uso)
            // Códigos <= 8 são geralmente considerados sucessos ou alertas menores.
            if (roboErr.status > 8) {
                throw roboErr;
            }
        }

        // 3. Compactar a pasta temporária
        console.log(`📦 Compactando projeto em ${zipName}...`);
        const psZipCmd = `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force"`;
        execSync(psZipCmd, { stdio: 'inherit' });

        // 4. Remover diretório temporário
        console.log(`🗑️ Removendo arquivos temporários...`);
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempDir}'"`, { stdio: 'inherit' });

        console.log(`✅ Backup do projeto finalizado com sucesso!`);
        console.log(`📂 Local: ${zipPath}`);

    } catch (err) {
        console.error(`❌ Erro no backup do projeto: ${err.message}`);
        // Limpeza em caso de erro
        if (fs.existsSync(tempDir)) {
            execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempDir}'"`, { stdio: 'error' });
        }
    }
}

backupProject();
