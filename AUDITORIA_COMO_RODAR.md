# Auditoria de Execução e Deploy - Rodeio Web

Este documento resume a estrutura do repositório, fluxo de CI/CD e as formas de executar, testar e implantar o projeto **Rodeio Web** (`rodeio-web`).

---

## 1. Mapeamento do Repositório Git & Fluxo de Imagem

### Repositório Oficial do Código (GitHub)
* **URL do Repositório:** `https://github.com/cristhian221016/rodeio-web-admin` (ou `cristhian-sancore/rodeio-web-admin`)
* **Branch Principal:** `main`

### Fluxo de Build Automático (GitHub Actions -> GHCR)
Ao realizar um `git push` para a branch `main`:
1. O GitHub Actions executa o workflow [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).
2. O workflow faz o build do [Dockerfile](file:///Dockerfile) e publica a imagem Docker no **GitHub Container Registry (GHCR)**.
3. **Nome da Imagem Gerada:** `ghcr.io/cristhian221016/rodeio-pro:latest` (ou `ghcr.io/cristhian-sancore/rodeio-pro:latest`).

> 💡 **Esclarecimento:** O nome do repositório no GitHub é `rodeio-web-admin`, porém o nome da imagem Docker gerada no Container Registry para rodar nos containers é `rodeio-pro`.

---

## 2. Visão Geral da Stack Tecnológica
* **Framework:** Next.js 16 (React 19, TypeScript)
* **Banco de Dados:** PostgreSQL 16 (Produção/Docker) / SQLite (Desenvolvimento local)
* **ORM:** Prisma ORM (`prisma@6.2.1`)
* **Autenticação:** NextAuth.js
* **Hospedagem em Produção:** Stack no Portainer (`https://portainer.cristhiansancore.com.br`)

---

## 3. Como Rodar Localmente (Desenvolvimento)

### Pré-requisitos
* Node.js v20+ instalado
* PostgreSQL local ou container de BD ativo

### Passos:
1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Verificar/Configurar o arquivo `.env`:
   ```env
   DATABASE_URL="postgresql://rodeio_admin:rodeio_secure_pass_2026@localhost:5432/rodeio_db?schema=public"
   NEXTAUTH_SECRET=rodeio-super-secret-key-2026
   NEXTAUTH_URL=https://rodeio.cristhiansancore.com.br
   AUTH_TRUST_HOST=true
   ```

3. Sincronizar o schema do Prisma:
   ```bash
   npx prisma db push
   ```

4. Alimentar o banco inicial (Seeds/Admin):
   ```bash
   node seed-admin.js
   # ou
   node create-super-admin.js
   ```

5. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse em: [http://localhost:3000](http://localhost:3000)

---

## 4. Como Rodar Localmente via Docker Compose

Para subir a aplicação e o banco PostgreSQL localmente em containers:

```bash
docker compose up -d
```

* **Arquivo de Configuração:** `docker-compose.yml`
* **Serviços criados:**
  * `db`: Container PostgreSQL (porta `5432`)
  * `app`: Container Next.js (porta `3000`)

---

## 5. Como Rodar e Fazer Redeploy no Portainer (Produção)

A aplicação em produção é gerenciada via **Stack no Portainer**.

### Informações da Stack:
* **URL do Portainer:** `https://portainer.cristhiansancore.com.br`
* **ID da Stack:** `44`
* **ID do Endpoint:** `3`
* **Arquivo da Stack:** `portainer-stack.yml`

### Métodos de Redeploy:

#### Opção A: Pelo Painel Web do Portainer (Recomendado)
1. Acesse `https://portainer.cristhiansancore.com.br`.
2. Vá no menu **Stacks** e selecione a Stack **44** (`rodeio-web`).
3. Verifique se o conteúdo do arquivo `portainer-stack.yml` está atualizado na área de edição da Stack.
4. Marque a opção **"Re-pull image and update"** (Recarregar imagem e atualizar).
5. Clique em **Update the stack**.

#### Opção B: Via Script de API (`redeploy_portainer.js`)
Existe um script automatizado no projeto:
```bash
node redeploy_portainer.js
```
* **Atenção:** O token de API salvo atualmente no script retornou HTTP 401 (Não autorizado). Caso vá utilizar este script, gere um novo Access Token no Portainer (em *User Settings -> Access Tokens*) e atualize a constante `API_TOKEN` no arquivo `redeploy_portainer.js` ou crie o arquivo `.acesso-api`.
