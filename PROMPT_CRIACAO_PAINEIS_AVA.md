# 🏛️ PROMPT MESTRE — CRIAÇÃO E PADRONIZAÇÃO DE PAINÉIS AVA (DELTA)

> **Instrução de Uso para IAs (Gemini / Claude / ChatGPT / Codex / Antigravity):**
> Este documento é a **ESPECIFICAÇÃO TÉCNICA E PEDAGÓGICA DEFINITIVA** para a criação de painéis de estudo interativos do AVA (Ambiente Virtual de Aprendizagem) voltados à preparação de alto nível para **Delegado de Polícia (Civil e Federal)**.
> 
> Sempre que o usuário solicitar a criação de um novo painel a partir de um PDF, edital ou assunto, siga **RIGOROSAMENTE** todas as diretrizes, a estrutura de 6 abas, o código CSS/JS e o fluxo de deploy detalhados neste documento.

---

## 🎯 1. PERFIL PEDAGÓGICO & DIRETRIZES COGNITIVAS

1. **Rigor e Densidade Teórica:** O aluno tem perfil analítico que valoriza textos densos, esquematizados e ricos em fundamentação doutrinária, conexões mentais, evolução dogmática e histórico dos institutos jurídicos. **É PROIBIDO gerar resumos rasos, listas telegráficas simplistas ou conteúdo genérico.**
2. **Foco em Carreiras Policiais (Delegado PC/PF):** Ênfase no posicionamento das bancas examinadoras (Cebraspe, Vunesp, FGV, FCC), jurisprudência atualizada dos Tribunais Superiores (STF e STJ com indicação de Temas de Repercussão Geral, Súmulas Vinculantes e Informativos recentes) e reflexos práticos na atividade de Polícia Judiciária.
3. **Estrutura Hexapartida Canônica:** Todo painel do AVA deve conter **obrigatoriamente as 6 abas**, dispostas na exata ordem abaixo:
   - `📖 Doutrina & Panorama` (`tab-resumo`)
   - `📌 Literais` (`tab-literais`)
   - `🔥 Pegadinhas` (`tab-pegadinhas`)
   - `🏛️ Jurisprudência` (`tab-juris`)
   - `🎯 Apostas 2026` (`tab-apostas`)
   - `✍️ Discursivas` (`tab-discursivas`)

---

## 🧱 2. DETALHAMENTO DE CONTEÚDO DAS 6 ABAS

### 📖 ABA 0: Doutrina & Panorama (`tab-resumo`)
- **Objetivo:** Estabelecer o panorama completo, a evolução histórica, as correntes doutrinárias divergentes, a terminologia clássica e contemporânea e a matriz sistemática do tema.
- **Componentes Obrigatórios:**
  - **Módulos Numerados:** Cada grande tópico é um card expansível (`.info-card.searchable`).
  - **Tabelas Comparativas (`.delta-table` dentro de `.table-responsive`):** Comparando correntes, teorias ou graus de eficácia.
  - **Grades Sinópticas (`.synopsis-grid` com `.synopsis-box`):** Destacando visões opostas (ex: Roxin vs. Jakobs, Teoria Maior vs. Menor, Eficácia Vertical vs. Horizontal).
  - **Caixas de Destaque (`.stmt-box` e `.blockquote`):** Para postulados, teses em destaque, fórmulas teóricas e mnemônicos.

### 📌 ABA 1: Literais (`tab-literais`)
- **Objetivo:** Dispositivos normativos essenciais com destaque visual para as palavras-chave que as bancas costumam alterar.
- **Formatação:** Citação literal em `.blockquote`, seguida de `.detail-row` contendo:
  - `🔄 Palavra Trocada / Pegadinha da Letra Fria`
  - `⚠️ Erro Frequente do Candidato`
  - `📊 Frequência e Bancas`

### 🔥 ABA 2: Pegadinhas (`tab-pegadinhas`)
- **Objetivo:** Neutralizar as armadilhas mais comuns elaboradas pelas bancas.
- **Formatação:**
  - Falsa assertiva de prova em `.false-stmt`.
  - Explicação técnica e cirúrgica do porquê está errada no `.detail-row`.

### 🏛️ ABA 3: Jurisprudência (`tab-juris`)
- **Objetivo:** Precedentes vinculantes do STF e STJ, Teses de Repercussão Geral, Recursos Repetitivos, Súmulas Vinculantes e Informativos recentes.
- **Formatação:** Identificação clara do Tribunal e Órgão com `.badge-tag.bg-purple`, tese fixada em `.blockquote` ou `.stmt-box` e requisitos cumulativos detalhados.

### 🎯 ABA 4: Apostas 2026 (`tab-apostas`)
- **Objetivo:** Inovações legislativas recentes (últimos 2 a 3 anos), decisões de Plenário do STF/STJ ainda pouco exploradas e tendências fortes para as próximas provas.

### ✍️ ABA 5: Discursivas (`tab-discursivas`)
- **Objetivo:** Treinamento para a 2ª fase e prova oral de Delegado.
- **Formatação:**
  - Enunciado da questão em `.simulado-q`.
  - **Esqueleto de Resposta (Espelho de Correção):** Lista em `.skeleton-list` contendo os tópicos exatos e fundamentos normativos/jurisprudenciais que o candidato precisa pontuar para obter nota máxima.

---

## 🎨 3. TEMPLATE HTML / CSS / JAVASCRIPT PADRONIZADO

Todo novo painel deve ser criado em arquivo `.html` independente, seguindo a estrutura de código abaixo:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Delta · [MATÉRIA] - [ASSUNTO] · Delegado</title>
<meta name="description" content="Painel Delta para Delegado (PC/PF): [ASSUNTO] — doutrina aprofundada, literais, pegadinhas, jurisprudência STF/STJ, apostas e discursivas."/>
<meta name="author" content="Delta"/>
<meta name="theme-color" content="#ff6b00"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="pt_BR"/>
<meta property="og:site_name" content="Delta · AVA Delegado"/>
<meta property="og:title" content="[MATÉRIA] · [ASSUNTO] — Delta"/>
<meta property="og:description" content="Doutrina esquematizada, literais, pegadinhas, jurisprudência e discursivas para Delegado."/>
<meta name="twitter:card" content="summary"/>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="./assets/stopwatch.css"/>
<style>
  /* ── VARIÁVEIS - TEMA CLARO ── */
  :root {
    --brand: #ff6b00;
    --brand-dim: #cc5500;
    --brand-glow: rgba(255,107,0,0.10);
    --bg: #f8fafc;
    --surface: #ffffff;
    --surface2: #f1f5f9;
    --surface3: #e2e8f0;
    --border: #e2e8f0;
    --border-hot: #ff6b00;
    --text: #0f172a;
    --text-muted: #475569;
    --text-dim: #94a3b8;
    
    --yellow: #f59e0b;
    --yellow-bg: rgba(245, 158, 11, 0.12);
    --yellow-border: rgba(245, 158, 11, 0.25);
    
    --red: #ef4444;
    --red-bg: rgba(239, 68, 68, 0.12);
    --red-border: rgba(239, 68, 68, 0.25);
    
    --blue: #3b82f6;
    --blue-bg: rgba(59, 130, 246, 0.12);
    --blue-border: rgba(59, 130, 246, 0.25);
    
    --green: #10b981;
    --green-bg: rgba(16, 185, 129, 0.12);
    --green-border: rgba(16, 185, 129, 0.25);
    
    --purple: #8b5cf6;
    --purple-bg: rgba(139, 92, 246, 0.12);
    --purple-border: rgba(139, 92, 246, 0.25);
    
    --r: 8px;
    --r-sm: 5px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  /* ── VARIÁVEIS - TEMA ESCURO ── */
  body.dark-theme {
    --brand: #ff6b00;
    --brand-dim: #cc5500;
    --brand-glow: rgba(255,107,0,0.18);
    --bg: #0b0f1a;
    --surface: #131929;
    --surface2: #1a2235;
    --surface3: #1f2a3c;
    --border: rgba(255,255,255,0.08);
    --border-hot: rgba(255,107,0,0.35);
    --text: #e8eaf0;
    --text-muted: #8a93a8;
    --text-dim: #5a6478;

    --yellow: #fbbf24;
    --yellow-bg: rgba(251, 191, 36, 0.12);
    --yellow-border: rgba(251, 191, 36, 0.25);

    --red: #f87171;
    --red-bg: rgba(248, 113, 113, 0.12);
    --red-border: rgba(248, 113, 113, 0.25);

    --blue: #60a5fa;
    --blue-bg: rgba(96, 165, 250, 0.12);
    --blue-border: rgba(96, 165, 250, 0.25);

    --green: #4ade80;
    --green-bg: rgba(74, 222, 128, 0.12);
    --green-border: rgba(74, 222, 128, 0.25);

    --purple: #c084fc;
    --purple-bg: rgba(192, 132, 252, 0.12);
    --purple-border: rgba(192, 132, 252, 0.25);

    --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  }

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{
    font-family:'Inter',sans-serif;
    background:var(--bg);
    color:var(--text);
    min-height:100vh;
    line-height:1.65;
    font-size:15px;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body::before{
    content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(ellipse 80% 50% at 10% 10%, var(--brand-glow) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 90% 80%, rgba(255,107,0,0.04) 0%, transparent 60%);
    transition: background 0.3s ease;
  }

  /* ── HEADER ─────────────────────────────── */
  header{
    position:sticky;top:0;z-index:100;
    background:var(--surface);
    backdrop-filter:blur(14px);
    border-bottom:1px solid var(--border-hot);
    padding:0 24px;
    transition: background-color 0.3s ease;
  }
  body:not(.dark-theme) header { background: rgba(255, 255, 255, 0.92); }
  body.dark-theme header { background: rgba(11, 15, 26, 0.92); }

  .header-inner{
    max-width:1100px;margin:0 auto;
    display:flex;align-items:center;justify-content:space-between;
    height:60px;gap:16px;
  }
  .brand{
    font-size:13px;font-weight:800;letter-spacing:.12em;
    color:var(--brand);text-transform:uppercase;white-space:nowrap;
  }
  .title-block{flex:1;min-width:0;}
  .title-block h1{
    font-size:14px;font-weight:700;
    color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .title-block .badge{
    display:inline-block;margin-top:2px;
    font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
    color:var(--brand);background:var(--brand-glow);
    border:1px solid rgba(255,107,0,0.3);
    padding:1px 7px;border-radius:20px;
  }
  .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
  }
  .theme-toggle-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
  }
  .theme-toggle-btn:hover {
      background: var(--surface2);
      color: var(--text);
  }
  
  /* ── MAIN ────────────────────────────────── */
  main{max-width:1100px;margin:0 auto;padding:28px 20px 80px; position:relative; z-index:1;}

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand);
    text-decoration: none;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: .05em;
    transition: transform .2s;
  }
  .back-link:hover { transform: translateX(-3px); }

  /* ── TABS ────────────────────────────────── */
  .tabs-nav{
    display:flex;gap:4px;
    border-bottom:1px solid var(--border);
    margin-bottom:28px;
    overflow-x:auto;
    scrollbar-width:none;
  }
  .tabs-nav::-webkit-scrollbar{display:none;}
  .tab-btn{
    flex-shrink:0;
    padding:10px 18px;
    font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    color:var(--text-muted);background:transparent;border:none;cursor:pointer;
    border-bottom:2px solid transparent;
    transition:all .2s;
  }
  .tab-btn:hover{color:var(--text);}
  .tab-btn.active{color:var(--brand);border-bottom-color:var(--brand);}
  .tab-panel{display:none;}
  .tab-panel.active{display:block;animation:fadeIn .25s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

  /* ── SEARCH ──────────────────────────────── */
  .search-wrap{margin-bottom:22px;position:relative;}
  .search-input{
    width:100%;
    background:var(--surface);
    border:1px solid var(--border);
    border-radius:var(--r);
    padding:10px 14px 10px 40px;
    color:var(--text);
    font-family:'Inter',sans-serif;font-size:14px;
    outline:none;transition:border-color .2s;
    box-shadow: var(--shadow);
  }
  .search-input:focus{border-color:var(--border-hot);}
  .search-icon{
    position:absolute;left:13px;top:50%;transform:translateY(-50%);
    color:var(--text-dim);font-size:15px;pointer-events:none;
  }
  .search-clear{
    position:absolute;right:12px;top:50%;transform:translateY(-50%);
    color:var(--text-dim);background:none;border:none;cursor:pointer;
    font-size:16px;padding:4px;display:none;
  }

  /* ── SECTION HEADING ─────────────────────── */
  .sec-header{
    display:flex;align-items:center;gap:10px;
    margin-bottom:18px;
  }
  .sec-header h2{
    font-size:16px;font-weight:800;letter-spacing:-.01em;color:var(--text);
  }
  .sec-header .tag{
    font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:var(--brand);background:var(--brand-glow);
    border:1px solid rgba(255,107,0,.3);
    padding:2px 8px;border-radius:20px;
  }

  /* ── CARDS ───────────────────────────────── */
  .info-card{
    background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r);
    margin-bottom:14px;overflow:hidden;
    transition:border-color .2s, box-shadow 0.2s;
    box-shadow: var(--shadow);
  }
  .info-card:hover{border-color:var(--border-hot);}
  .card-head{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 18px;cursor:pointer;gap:12px;
    user-select:none;
  }
  .card-head-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}
  .card-head h3{
      font-size:14px;font-weight:700;color:var(--text);
      overflow:hidden;text-overflow:ellipsis;
  }
  .chevron{color:var(--text-dim);transition:transform .25s;font-size:12px;flex-shrink:0;}
  .card-body{
    padding:0 18px;max-height:0;overflow:hidden;
    transition:max-height .4s ease, padding .4s ease;
  }
  .card-body.open{max-height:4500px;padding:0 18px 18px;}
  
  /* ── BADGES & ELEMENTS ───────────────────── */
  .badge-tag{
    font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    padding:3px 9px;border-radius:20px;flex-shrink:0;
  }
  .bg-brand { color: var(--brand); background: var(--brand-glow); border: 1px solid rgba(255,107,0,.3); }
  .bg-blue { color: var(--blue); background: var(--blue-bg); border: 1px solid var(--blue-border); }
  .bg-yellow { color: var(--yellow); background: var(--yellow-bg); border: 1px solid var(--yellow-border); }
  .bg-green { color: var(--green); background: var(--green-bg); border: 1px solid var(--green-border); }
  .bg-red { color: var(--red); background: var(--red-bg); border: 1px solid var(--red-border); }
  .bg-purple { color: var(--purple); background: var(--purple-bg); border: 1px solid var(--purple-border); }

  .blockquote{
    font-family:'IBM Plex Mono',monospace;
    font-size:13px;line-height:1.7;
    color:var(--text); 
    background:var(--surface2);
    border-left:4px solid var(--brand);
    border-radius:0 var(--r-sm) var(--r-sm) 0;
    padding:12px 16px;
    margin-bottom:14px;
  }
  
  .detail-row{
    display:flex;gap:10px;align-items:flex-start;
    padding:10px 0;border-top:1px solid var(--border);
    font-size:13.5px;
  }
  .detail-row:first-of-type{border-top:none;}
  .detail-icon{font-size:15px;flex-shrink:0;margin-top:2px;}
  .detail-label{font-weight:700;color:var(--text-muted);margin-right:4px;}
  .detail-text{color:var(--text);flex:1;}
  
  mark.y{background:var(--yellow-bg);color:var(--yellow);border-radius:2px;padding:0 2px;}
  mark.r{background:var(--red-bg);color:var(--red);border-radius:2px;padding:0 2px;}
  mark.b{background:var(--blue-bg);color:var(--blue);border-radius:2px;padding:0 2px;}
  mark.g{background:var(--green-bg);color:var(--green);border-radius:2px;padding:0 2px;}
  mark.p{background:var(--purple-bg);color:var(--purple);border-radius:2px;padding:0 2px;}

  .false-stmt{
    font-size:13.5px;font-style:italic;
    color:var(--red);
    background:var(--red-bg);
    border:1px solid var(--red-border);
    border-radius:var(--r-sm);
    padding:10px 14px;
    margin-bottom:14px;
    line-height:1.6;
  }
  .false-stmt::before{content:'❝ ';font-style:normal;opacity:.6;}
  
  .stmt-box{
    font-size:13px;
    color:var(--text);
    background:var(--surface2);
    border:1px solid var(--border);
    border-left:4px solid var(--yellow);
    border-radius:var(--r-sm);
    padding:10px 14px;margin-top:8px;
    line-height:1.6;
  }
  
  .simulado-box{
    background:var(--surface2);border:1px solid var(--border);
    border-radius:var(--r-sm);padding:14px 16px;margin-top:12px;
  }
  .simulado-label{
    font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:var(--text-dim);margin-bottom:10px;
  }
  .simulado-q{
    font-size:13.5px;color:var(--text-muted);
    font-style:italic;line-height:1.6;margin-bottom:12px;
  }

  .skeleton-list {
      list-style: none;
      margin-top: 10px;
  }
  .skeleton-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 8px;
      font-size: 13.5px;
      color: var(--text);
  }
  .skeleton-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--brand);
      font-weight: bold;
      font-size: 16px;
  }

  /* ── DOUTRINA & PANORAMA COMPONENTES ── */
  .doctrine-narrative {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text);
    margin-bottom: 16px;
  }
  .doctrine-narrative p { margin-bottom: 12px; }
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    margin: 14px 0 18px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
  }
  .delta-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  .delta-table th {
    background: var(--surface2);
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: .05em;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }
  .delta-table td {
    padding: 11px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }
  .delta-table tr:last-child td { border-bottom: none; }
  .synopsis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 14px 0;
  }
  @media(max-width: 768px) { .synopsis-grid { grid-template-columns: 1fr; } }
  .synopsis-box {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 14px;
  }
  .synopsis-box h4 {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--brand);
    margin-bottom: 8px;
  }
  .synopsis-box p { font-size: 13px; color: var(--text); line-height: 1.6; }

  /* ── FOOTER ──────────────────────────────── */
  footer{
    text-align:center;padding:28px;
    font-size:12px;color:var(--text-dim);
    border-top:1px solid var(--border);
  }
  footer span{color:var(--brand); font-weight: 600;}

  /* ── RESPONSIVE ──────────────────────────── */
  @media(max-width:600px){
    .header-inner{padding:0 4px;}
    main{padding:20px 12px 60px;}
    .tab-btn{padding:9px 12px;font-size:11px;}
    .card-head h3{font-size:13px;}
  }
</style>
<link rel="stylesheet" href="./assets/tokens.css"/>
</head>
<body>

<!-- ═══ HEADER ═══════════════════════════════ -->
<header>
  <div class="header-inner">
    <div class="brand">⚖️ Delta</div>
    <div class="title-block">
      <h1>[MATÉRIA] · [TÍTULO DO ASSUNTO]</h1>
      <span class="badge">Delegado PC · PF · Cebraspe / Vunesp</span>
    </div>
    <div class="header-actions">
        <button class="theme-toggle-btn" id="themeToggle" onclick="toggleTheme()" title="Alternar Tema Claro/Escuro">
            ☀️
        </button>
    </div>
  </div>
</header>

<!-- ═══ MAIN ══════════════════════════════════ -->
<main>

  <a href="./index.html" class="back-link">← Voltar ao índice</a>

  <!-- SEARCH -->
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" class="search-input" id="searchInput" placeholder="Buscar em todos os blocos..." oninput="handleSearch()" />
    <button class="search-clear" id="searchClear" onclick="clearSearch()">✕</button>
  </div>

  <!-- TABS NAV -->
  <nav class="tabs-nav" role="tablist">
    <button class="tab-btn active" onclick="showTab('resumo',this)">📖 Doutrina & Panorama</button>
    <button class="tab-btn" onclick="showTab('literais',this)">📌 Literais</button>
    <button class="tab-btn" onclick="showTab('pegadinhas',this)">🔥 Pegadinhas</button>
    <button class="tab-btn" onclick="showTab('juris',this)">🏛️ Jurisprudência</button>
    <button class="tab-btn" onclick="showTab('apostas',this)">🎯 Apostas 2026</button>
    <button class="tab-btn" onclick="showTab('discursivas',this)">✍️ Discursivas</button>
  </nav>

  <!-- ════════ TAB 0: DOUTRINA & PANORAMA ════════ -->
  <div class="tab-panel active" id="tab-resumo">
    <!-- Módulos conceituais aprofundados, tabelas e sinopses -->
  </div>

  <!-- ════════ TAB 1: LITERAIS ════════ -->
  <div class="tab-panel" id="tab-literais">
    <!-- Textos de lei com marcações e palavras trocadas -->
  </div>

  <!-- ════════ TAB 2: PEGADINHAS ════════ -->
  <div class="tab-panel" id="tab-pegadinhas">
    <!-- Falsas assertivas e distratores com análise do erro -->
  </div>

  <!-- ════════ TAB 3: JURISPRUDÊNCIA ════════ -->
  <div class="tab-panel" id="tab-juris">
    <!-- Súmulas vinculantes, teses do STF/STJ e informativos -->
  </div>

  <!-- ════════ TAB 4: APOSTAS ════════ -->
  <div class="tab-panel" id="tab-apostas">
    <!-- Tendências e inovações legislativas recentes -->
  </div>

  <!-- ════════ TAB 5: DISCURSIVAS ════════ -->
  <div class="tab-panel" id="tab-discursivas">
    <!-- Propostas de questões abertas com espelhos de correção -->
  </div>

</main>

<footer>
  Biblioteca de Estudos <span>Delta</span> · [MATÉRIA] - [ASSUNTO]
</footer>

<script>
// ─── THEME TOGGLE (Claro / Escuro) ────────────
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('delta-theme', 'dark');
        btn.textContent = '🌙';
    } else {
        localStorage.setItem('delta-theme', 'light');
        btn.textContent = '☀️';
    }
}

// Check saved theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('delta-theme');
    const btn = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (btn) btn.textContent = '🌙';
    } else {
        if (btn) btn.textContent = '☀️';
    }
});

// ─── TABS ─────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById('tab-' + id);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ─── ACCORDION ────────────────────────────────
function toggle(head) {
  const body = head.nextElementSibling;
  const chevron = head.querySelector('.chevron');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// ─── SEARCH ───────────────────────────────────
function handleSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const clear = document.getElementById('searchClear');
  clear.style.display = q ? 'block' : 'none';
  if (!q) {
    document.querySelectorAll('.searchable').forEach(c => c.style.display = '');
    return;
  }
  
  document.querySelectorAll('.searchable').forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').style.display = 'none';
  document.querySelectorAll('.searchable').forEach(c => c.style.display = '');
}

// ─── AUTO-OPEN FIRST ITEM ON EACH TAB ─────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const first = panel.querySelector('.card-head');
    if (first) {
      const body = first.nextElementSibling;
      const chevron = first.querySelector('.chevron');
      if (body) body.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
  });
});
</script>
<script src="./assets/base.js" defer></script>
<script src="./assets/stopwatch.js" defer></script>
</body>
</html>
```

---

## 🚀 4. FLUXO DE TRABALHO & DEPLOY AUTOMÁTICO NA VERCEL

Sempre que um novo painel for criado ou atualizado, a IA deve obrigatoriamente executar a seguinte sequência de ações:

1. **Geração do Arquivo HTML:** Salvar na raiz do projeto com nomenclatura padronizada em kebab-case (ex: `direito-constitucional-direitos-fundamentais.html`).
2. **Atualização do `index.html`:**
   - Inserir o link `<a class="assunto-row linked" href="./NOME-DO-ARQUIVO.html">` dentro do respectivo `<details class="materia">`.
   - Atualizar a contagem de painéis da matéria (`<span class="materia-count count-active">X painéis</span>`).
3. **Commit & Push para o GitHub:**
   ```bash
   git add .
   git commit -m "feat(painel): adicionar painel [MATÉRIA] - [ASSUNTO]"
   git push origin main
   ```
4. **Deploy Automático:** O envio para a branch `main` no repositório remoto (`origin/main`) dispara automaticamente a pipeline de build da Vercel, disponibilizando o novo painel online de forma imediata para acesso em qualquer dispositivo móvel ou desktop.
