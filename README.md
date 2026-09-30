# UserEx / Topology Hub

Repositório de topologias de rede do ecossistema KNS. Backend Java 17 + Quarkus
3.39.5, PostgreSQL e frontend Next.js 16 + TypeScript. A interface segue a direção
**UserEx / Hybrid Controlled**: escura, orientada a dados, com Orbit, Inter,
JetBrains Mono e ícones Lucide servidos localmente.

## Funcionalidades

- Cadastro e login com e-mail/senha; Google e GitHub via OAuth Authorization Code + PKCE.
- Sessões persistentes de 12 horas, revogadas no logout e ao alterar o acesso de um usuário.
- Cookies HttpOnly, SameSite=Lax, Secure em produção. Somente hashes dos tokens são armazenados.
- Perfis USER e ADMIN verificados no servidor; cadastro público nunca concede administração.
- CRUD de topologias públicas/privadas, busca por nome/descrição, paginação e controle de concorrência por revisão.
- Importação/exportação de JSON KNS com validação de nós, endpoints e métricas dos links.
- Grafo interativo com seleção de nós e zoom; tabelas de nós/links; JSON com linhas e cópia.
- Métricas **configuradas**: atraso médio dos links, menor bandwidth e maior loss; não são telemetria ou resultados de simulação.
- Administração de contas, alteração de perfil, desativação/reativação, moderação de topologias e auditoria.
- Migrações Flyway, OpenAPI, health checks, testes de integração e testes de navegador.

## Executar localmente (sem Docker)

Requisitos: JDK 17+, Maven 3.9+, Node.js 20.9+ (Node 24 usado na validação).

No diretório `backend`, copie `.env.example` para `.env`. Para criar o primeiro
administrador, configure `HUB_ADMIN_EMAIL` e `HUB_ADMIN_PASSWORD` com uma senha
única de pelo menos 12 caracteres e até 72 bytes. Não existe senha padrão.
Uma conta já existente nunca é promovida silenciosamente no bootstrap.

```powershell
cd backend
mvn quarkus:dev -Dquarkus.analytics.disabled=true
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

- Interface: http://localhost:3001
- API: http://localhost:8082/api
- Health: http://localhost:8082/q/health
- OpenAPI/Swagger (desenvolvimento): http://localhost:8082/q/swagger-ui

A porta 3001 evita conflito com outros projetos nesta workspace. `HUB_WEB_ORIGIN`
deve corresponder exatamente à origem usada no navegador (inclusive porta).
O frontend encaminha `/api/*` ao backend: não é necessário habilitar CORS.
Configure `HUB_API_URL` no frontend antes do build se mudar a URL da API.

O perfil dev usa H2 persistente em `backend/data/`, com as mesmas migrações
utilizadas pelo PostgreSQL. Os testes usam H2 em memória. H2 não deve ser usado
como substituto do PostgreSQL em produção.

## PostgreSQL / Docker Compose

Copie `.env.example` da raiz para `.env`, defina `DB_PASSWORD` e, opcionalmente,
as credenciais de bootstrap e OAuth. Para desenvolvimento com HTTP local use
`HUB_COOKIE_SECURE=false`. Para produção use HTTPS, a origem pública exata e
`HUB_COOKIE_SECURE=true`.

```sh
docker compose up --build -d
```

Acesse http://localhost:3001. Apenas o frontend publica uma porta; banco e backend
ficam na rede interna. Os dados ficam no volume `hub-db`. Migrações são aplicadas
no startup; em produção, o ORM valida o schema, sem recriar tabelas.

Build manual:

```sh
cd backend
mvn -B verify
# Defina DB_URL, DB_USER e DB_PASSWORD antes de executar:
java -jar target/quarkus-app/quarkus-run.jar

cd ../frontend
npm ci
npm run build
npm start
```

## Google e GitHub

As integrações estão implementadas, mas exigem aplicativos registrados nos
provedores. Não há credenciais OAuth embutidas. Os botões ficam desabilitados
enquanto o provedor não estiver configurado.

No Google Cloud, crie um OAuth Client do tipo Web application:

- Origem local: `http://localhost:3001`
- Redirect URI: `http://localhost:3001/api/auth/oauth/google/callback`
- Variáveis do backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

No GitHub, crie uma OAuth App:

- Homepage: `http://localhost:3001`
- Callback: `http://localhost:3001/api/auth/oauth/github/callback`
- Variáveis: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

Em produção, substitua a origem por seu domínio HTTPS nos provedores e em
`HUB_WEB_ORIGIN`. Reinicie o backend após configurar as credenciais.

O fluxo valida state de uso único, cookie de correlação, expiração de 10 minutos
e PKCE S256. Solicita apenas identidade e e-mail; tokens externos não são
persistidos. Google deve informar e-mail verificado; GitHub deve informar e-mail
primário verificado. Contas com o mesmo e-mail **não são vinculadas automaticamente**:
o usuário deve entrar pelo método original. Vinculação explícita de contas é
uma evolução posterior.

Referências: [Google OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps),
[Quarkus Panache](https://quarkus.io/guides/hibernate-orm-panache/),
[Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites).

## Contrato da API

Todas as mutações exigem `Content-Type: application/json` e `X-Hub-Request: 1`.
Quando `Origin` está presente, deve corresponder a `HUB_WEB_ORIGIN`.
A autenticação usa o cookie `hub_session`; nenhum token vai para localStorage.

| Método | Endpoint | Acesso |
| --- | --- | --- |
| POST | /api/auth/register | Público |
| POST | /api/auth/login | Público |
| POST | /api/auth/logout | Revoga a sessão atual |
| GET | /api/auth/me | Autenticado |
| GET | /api/auth/oauth/providers | Provedores habilitados |
| GET | /api/auth/oauth/{google\|github} | Inicia login social |
| GET | /api/topologies?q=&scope=public&page=0&size=12 | Público |
| GET | /api/topologies?scope=mine | Próprias topologias |
| GET | /api/topologies?scope=all | Admin |
| POST | /api/topologies | Autenticado |
| GET | /api/topologies/{id} | Público, proprietário ou admin |
| PUT | /api/topologies/{id} | Proprietário ou admin; exige version atual |
| DELETE | /api/topologies/{id} | Proprietário ou admin |
| GET | /api/topologies/{id}/download | Mesma visibilidade da topologia |
| GET | /api/admin/stats | Admin |
| GET | /api/admin/users?page=0 | Admin |
| PATCH | /api/admin/users/{id} | Admin; role e active |
| GET | /api/admin/audit | Admin; 50 eventos recentes |

Exemplo de criação:

```json
{
  "title": "Rede ponto a ponto",
  "description": "Dois nós e uma conexão.",
  "visibility": "PRIVATE",
  "graph": {
    "nodes": 2,
    "links": [
      {"from": 0, "to": 1, "delay": 5, "bandwidth": 100, "loss": 0}
    ]
  }
}
```

No PUT, adicione `version` conforme a resposta atual. A revisão é controle
otimista de concorrência, não armazenamento de snapshots históricos.
Erros de validação de links informam o JSON path relevante.
Limites: 5000 nós, 20000 links, 800 KB por grafo, 1 MB por requisição,
até 50 registros por página. A visualização tem limite explícito de prévia;
as tabelas e o download preservam todos os dados.

## Testar

```sh
cd backend
mvn -B -ntp verify
cd ../frontend
npm ci
npm run build
npx playwright install chromium
```

Com os serviços locais em execução:

```sh
# HUB_ADMIN_EMAIL e HUB_ADMIN_PASSWORD habilitam o teste administrativo.
npm test
```

Os testes de navegador criam contas de teste e excluem a topologia criada.
Use um banco de desenvolvimento isolado. O teste administrativo é ignorado
quando suas credenciais não estão disponíveis. Testes OAuth de state/PKCE não
substituem a validação real com aplicativos Google/GitHub configurados.

## Organização e limites desta versão

- `backend/`: recursos REST, sessões, OAuth, entidades Panache, Flyway e testes.
- `frontend/src/app/tokens.css`: fonte única dos tokens visuais UserEx.
- `frontend/src/components/`: shell, estados, grafo, JSON viewer, módulos e formulários.
- `compose.yaml`: PostgreSQL + backend + frontend.
- `.github/workflows/ci.yml`: build e testes automatizados.

Recuperação de senha, verificação de e-mail do cadastro local, vínculo entre
provedores, favoritos, coleções e execução remota de simulações não fazem parte
deste CRUD inicial. A limitação de tentativas de login é por identidade e por
instância; para múltiplas réplicas, centralize os limites no gateway ou em Redis.
Administradores podem consultar topologias privadas para moderação; essa regra
é indicada no formulário de visibilidade.

