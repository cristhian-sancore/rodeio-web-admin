/**
 * SCRIPT DE REDEPLOY AUTOMATIZADO - PORTAINER API (Manual Stack version)
 * Este script força o pull da imagem mais recente e recria o container para stacks manuais.
 */

const PORTAINER_URL = 'https://portainer.cristhiansancore.com.br';
const API_TOKEN = 'ptr_qxZG4bcG7z1VLvalJX3dQKy/dDuWicAL+j4OTV0CEo8=';
const STACK_ID = 44; 
const ENDPOINT_ID = 3;

async function redeploy() {
    console.log('🚀 Iniciando atualização remota via Portainer API (Manual Stack)...');
    
    try {
        const headers = { 
            'X-API-Key': API_TOKEN,
            'Content-Type': 'application/json'
        };

        // 1. Obter o conteúdo atual do docker-compose.yml
        console.log(`🔍 Recuperando docker-compose da stack ${STACK_ID}...`);
        const fileRes = await fetch(`${PORTAINER_URL}/api/stacks/${STACK_ID}/file`, { headers });
        if (!fileRes.ok) throw new Error(`Falha ao buscar arquivo: ${fileRes.status}`);
        const { StackFileContent } = await fileRes.json();

        // 2. Obter detalhes da stack para pegar o env
        const stackRes = await fetch(`${PORTAINER_URL}/api/stacks/${STACK_ID}`, { headers });
        const stack = await stackRes.json();

        // 3. Forçar atualização enviando o mesmo arquivo com flag de pull
        console.log('🔄 Enviando atualização de stack (Force Pull)...');
        const updateRes = await fetch(`${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                stackFileContent: StackFileContent,
                env: stack.Env || [],
                prune: true,
                pullImage: true // Portainer v2.16+ supports this in the payload
            })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error(`Erro no redeploy: ${updateRes.status} ${errText}`);
        }

        console.log('✅ SUCESSO! O Portainer está recriando a stack com a imagem mais recente.');
        console.log('⏳ A produção estará atualizada em instantes.');
    } catch (err) {
        console.error('❌ FALHA NO REDEPLOY:', err.message);
        process.exit(1);
    }
}

redeploy();
