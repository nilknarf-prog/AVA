import json
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_to_add = '''
  /* ── TRACKER ──────────────────────────────── */
  .tracker-section{
    margin-bottom: 40px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 24px;
    box-shadow: var(--shadow);
  }
  .tracker-header{
    display:flex; justify-content:space-between; align-items:flex-end;
    margin-bottom: 20px;
  }
  .tracker-title{font-size:16px; font-weight:800; color:var(--text);}
  .tracker-stats{
    display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:24px;
  }
  .stat-card{
    background: var(--surface2); padding: 12px; border-radius: var(--r-sm);
    border: 1px solid var(--border); text-align:center;
  }
  .stat-val{font-size:22px; font-weight:800; color:var(--brand); line-height:1;}
  .stat-lbl{font-size:11px; font-weight:600; color:var(--text-dim); text-transform:uppercase; margin-top:4px;}
  
  .tracker-body{ display:flex; gap: 30px; }
  .tracker-form{ flex:1; display:flex; flex-direction:column; gap:12px; }
  .form-row{ display:flex; gap:12px; }
  .form-group{ flex:1; display:flex; flex-direction:column; gap:4px; }
  .form-group label{ font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; }
  .form-group input, .form-group select{
    padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--r-sm);
    background: var(--bg); color: var(--text); font-family:'Inter', sans-serif; font-size:13px;
  }
  .form-group input:focus, .form-group select:focus{ border-color:var(--brand); outline:none; }
  .btn-save{
    background: var(--brand); color: #fff; border:none; padding:10px; border-radius:var(--r-sm);
    font-weight:700; font-size:13px; cursor:pointer; margin-top:8px; transition:opacity .2s;
  }
  .btn-save:hover{ opacity:.9; }
  .btn-util{
    background: transparent; border: 1px solid var(--border); color: var(--text-dim);
    padding:6px 10px; border-radius:var(--r-sm); font-size:11px; font-weight:600; cursor:pointer;
  }
  .btn-util:hover{ background: var(--surface2); color: var(--text); }

  .tracker-cal{ width: 280px; }
  .streak-box{
    display:flex; align-items:center; justify-content:space-between;
    background: var(--surface2); padding: 10px 14px; border-radius: var(--r-sm);
    margin-bottom: 12px; border: 1px solid var(--border);
  }
  .streak-val{ font-size: 16px; font-weight: 800; color: var(--green); }
  .cal-grid{
    display: grid; grid-template-columns: repeat(7, 1fr); gap:4px;
  }
  .cal-day{
    aspect-ratio: 1; border-radius: 3px; background: var(--surface2);
    display:flex; align-items:center; justify-content:center;
    font-size:10px; color:var(--text-dim); font-weight:600;
  }
  .cal-day.active{ background: var(--green); color: #fff; border-color:var(--green); }
  .cal-day.today{ border: 1px solid var(--brand); }
  
  .nudge-banner {
    display: none; background: rgba(255,107,0,0.1); border: 1px solid var(--brand);
    color: var(--brand); padding: 10px 14px; border-radius: var(--r-sm);
    font-size: 13px; font-weight: 600; margin-bottom: 20px; text-align:center;
  }

  @media(max-width:768px){
    .tracker-body{ flex-direction: column; }
    .tracker-cal{ width: 100%; }
    .tracker-stats{ grid-template-columns: repeat(2, 1fr); }
  }
</style>
'''
if "/* ── TRACKER" not in content:
    content = content.replace('</style>', css_to_add)

# 2. Update Hero Meta
content = content.replace('<span><strong>2</strong> painéis disponíveis</span>', '<span><strong>6</strong> painéis disponíveis</span>')

# 3. Tracker UI
tracker_html = '''
  <!-- NUDGE BANNER -->
  <div id="nudgeBanner" class="nudge-banner">⚠️ Você ainda não registrou estudo hoje. Mantenha a ofensiva!</div>

  <!-- TRACKER SECTION -->
  <section class="tracker-section">
    <div class="tracker-header">
      <div class="tracker-title">Acompanhamento Diário</div>
      <div style="display:flex; gap:8px;">
        <button class="btn-util" onclick="exportData()">Exportar</button>
        <button class="btn-util" onclick="importData()">Importar</button>
      </div>
    </div>
    
    <div class="tracker-stats">
      <div class="stat-card">
        <div class="stat-val" id="stHours">0h</div>
        <div class="stat-lbl">Horas Est.</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="stSess">0</div>
        <div class="stat-lbl">Sessões</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="stQ">0</div>
        <div class="stat-lbl">Questões</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="stPct">0%</div>
        <div class="stat-lbl">Acertos</div>
      </div>
    </div>

    <div class="tracker-body">
      <div class="tracker-form">
        <div class="form-row">
          <div class="form-group">
            <label>Data</label>
            <input type="date" id="tfDate" />
          </div>
          <div class="form-group">
            <label>Matéria</label>
            <select id="tfMat">
              <option value="DP">Direito Penal (DP)</option>
              <option value="DC">Dir. Constitucional (DC)</option>
              <option value="DCV">Direito Civil (DCV)</option>
              <option value="DA">Dir. Administrativo (DA)</option>
              <option value="DPP">Processo Penal (DPP)</option>
              <option value="ML">Medicina Legal (ML)</option>
              <option value="LPE">Leg. Penal Especial (LPE)</option>
              <option value="DH">Direitos Humanos (DH)</option>
              <option value="DE">Dir. Empresarial (DE)</option>
              <option value="CR">Criminologia (CR)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Assunto</label>
          <input type="text" id="tfAssunto" placeholder="Ex: Teoria do Crime" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Tempo (min)</label>
            <input type="number" id="tfTempo" placeholder="60" min="0" />
          </div>
          <div class="form-group">
            <label>Questões</label>
            <input type="number" id="tfQts" placeholder="0" min="0" />
          </div>
          <div class="form-group">
            <label>Acertos</label>
            <input type="number" id="tfAcertos" placeholder="0" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label>Observação</label>
          <input type="text" id="tfObs" placeholder="(Opcional)" />
        </div>
        <button class="btn-save" onclick="saveSession()">+ SALVAR SESSÃO</button>
      </div>

      <div class="tracker-cal">
        <div class="streak-box">
          <span style="font-size:13px; font-weight:700; color:var(--text-muted);">OFENSIVA</span>
          <span class="streak-val" id="streakVal">0 dias 🔥</span>
        </div>
        <div style="font-size:10px; color:var(--text-dim); margin-bottom:8px; font-weight:600; text-align:center;">ÚLTIMOS 28 DIAS</div>
        <div class="cal-grid" id="calGrid">
          <!-- JS fills this -->
        </div>
      </div>
    </div>
  </section>

  <!-- DIVIDER -->
'''
if "<!-- TRACKER SECTION -->" not in content:
    content = content.replace('  <!-- DIVIDER -->', tracker_html)

# 4. Update Materia DC
dc_new = '''
    <!-- Direito Constitucional -->
    <details class="materia">
      <summary>
        <div class="materia-left">
          <div class="materia-tag">DC</div>
          <div>
            <div class="materia-title">Direito Constitucional</div>
            <div class="materia-sub">Teoria · Organização do Estado · Direitos fundamentais</div>
          </div>
        </div>
        <span class="materia-count count-active">1 painel</span>
        <span class="chevron-d">▼</span>
      </summary>
      <div class="assuntos">
        <a class="assunto-row linked" href="./direito-constitucional-teoria.html">
          <div class="assunto-left">
            <div class="assunto-dot"></div>
            <span class="assunto-title">Teoria</span>
          </div>
          <span class="assunto-status">Cebraspe · Semana 01</span>
          <span class="assunto-arrow">→</span>
        </a>
      </div>
    </details>
'''
content = re.sub(r'<!-- Direito Constitucional -->.*?</div>\s*</details>', dc_new.strip(), content, flags=re.DOTALL)

# 5. Update Materia DCV
dcv_new = '''
    <!-- Direito Civil -->
    <details class="materia">
      <summary>
        <div class="materia-left">
          <div class="materia-tag">DCV</div>
          <div>
            <div class="materia-title">Direito Civil</div>
            <div class="materia-sub">LINDB · Pessoas · Bens · Negócio jurídico · Responsabilidade civil</div>
          </div>
        </div>
        <span class="materia-count count-active">1 painel</span>
        <span class="chevron-d">▼</span>
      </summary>
      <div class="assuntos">
        <a class="assunto-row linked" href="./direito-civil-lindb-pessoas.html">
          <div class="assunto-left">
            <div class="assunto-dot"></div>
            <span class="assunto-title">LINDB e Pessoas</span>
          </div>
          <span class="assunto-status">Cebraspe · Semana 01</span>
          <span class="assunto-arrow">→</span>
        </a>
      </div>
    </details>
'''
content = re.sub(r'<!-- Direito Civil -->.*?</div>\s*</details>', dcv_new.strip(), content, flags=re.DOTALL)

# 6. Update Materia DP
dp_new = '''
    <!-- Direito Penal -->
    <details class="materia">
      <summary>
        <div class="materia-left">
          <div class="materia-tag">DP</div>
          <div>
            <div class="materia-title">Direito Penal</div>
            <div class="materia-sub">Princípios · Teoria do crime · Penas · Parte especial</div>
          </div>
        </div>
        <span class="materia-count count-active">2 painéis</span>
        <span class="chevron-d">▼</span>
      </summary>
      <div class="assuntos">
        <a class="assunto-row linked" href="./direito-penal-nocoes-principios.html">
          <div class="assunto-left">
            <div class="assunto-dot"></div>
            <span class="assunto-title">Noções e Princípios</span>
          </div>
          <span class="assunto-status">Cebraspe · Semana 01</span>
          <span class="assunto-arrow">→</span>
        </a>
        <a class="assunto-row linked" href="./direito_penal_teoria_do_crime.html">
          <div class="assunto-left">
            <div class="assunto-dot"></div>
            <span class="assunto-title">Teoria do Crime</span>
          </div>
          <span class="assunto-status">Cebraspe/PF</span>
          <span class="assunto-arrow">→</span>
        </a>
      </div>
    </details>
'''
content = re.sub(r'<!-- Direito Penal -->.*?</div>\s*</details>', dp_new.strip(), content, flags=re.DOTALL)

# 7. Update Materia ML
ml_new = '''
    <!-- Medicina Legal -->
    <details class="materia">
      <summary>
        <div class="materia-left">
          <div class="materia-tag">ML</div>
          <div>
            <div class="materia-title">Medicina Legal</div>
            <div class="materia-sub">Perícias · Tanatologia · Lesões · Sexologia forense · Toxicologia</div>
          </div>
        </div>
        <span class="materia-count count-active">1 painel</span>
        <span class="chevron-d">▼</span>
      </summary>
      <div class="assuntos">
        <a class="assunto-row linked" href="./medicina-legal-pericias-documentos.html">
          <div class="assunto-left">
            <div class="assunto-dot"></div>
            <span class="assunto-title">Perícias e Documentos</span>
          </div>
          <span class="assunto-status">Cebraspe · Semana 01</span>
          <span class="assunto-arrow">→</span>
        </a>
      </div>
    </details>
'''
content = re.sub(r'<!-- Medicina Legal -->.*?</div>\s*</details>', ml_new.strip(), content, flags=re.DOTALL)

# 8. Tracker JS
js_to_add = '''
<script>
  const STORAGE_KEY = 'delta_estudos';
  
  const SEED_DATA = [
    { date: '2026-06-30', mat: 'DA', assunto: 'Onboarding', tempo: 0, qts: 0, acertos: 0, obs: 'Marco inicial' },
    { date: '2026-07-07', mat: 'DP', assunto: 'Teoria do Crime', tempo: 70, qts: 0, acertos: 0, obs: 'Estudo de ontem' },
    { date: '2026-07-08', mat: 'DC', assunto: 'Diagnóstico Semana 01', tempo: 62, qts: 56, acertos: 48, obs: '85.7%' },
    { date: '2026-07-08', mat: 'DCV', assunto: 'Revisão Missão 1', tempo: 45, qts: 0, acertos: 0, obs: 'Revisão aprofundada' }
  ];

  let logs = [];

  function initTracker() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      logs = SEED_DATA;
      saveLocal();
    } else {
      logs = JSON.parse(saved);
    }
    
    // Set default date to today in local timezone
    const now = new Date();
    // Format YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    document.getElementById('tfDate').value = todayStr;

    renderTracker(todayStr);
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  function renderTracker(todayStr) {
    let totalMins = 0;
    let totalQts = 0;
    let totalAcertos = 0;
    const daysStudied = new Set();

    logs.forEach(l => {
      totalMins += parseInt(l.tempo || 0);
      totalQts += parseInt(l.qts || 0);
      totalAcertos += parseInt(l.acertos || 0);
      if (parseInt(l.tempo || 0) > 0 || parseInt(l.qts || 0) > 0) {
        daysStudied.add(l.date);
      }
    });

    const totalHours = (totalMins / 60).toFixed(1);
    const pct = totalQts > 0 ? Math.round((totalAcertos / totalQts) * 100) : 0;

    document.getElementById('stHours').innerText = `${totalHours}h`;
    document.getElementById('stSess').innerText = logs.length;
    document.getElementById('stQ').innerText = totalQts;
    document.getElementById('stPct').innerText = `${pct}%`;

    if (!daysStudied.has(todayStr)) {
      document.getElementById('nudgeBanner').style.display = 'block';
    } else {
      document.getElementById('nudgeBanner').style.display = 'none';
    }

    renderCalendar(daysStudied, todayStr);
    calcStreak(daysStudied, todayStr);
  }

  function renderCalendar(daysStudied, todayStr) {
    const cal = document.getElementById('calGrid');
    cal.innerHTML = '';
    
    const todayObj = new Date(todayStr + 'T00:00:00');
    
    // show last 28 days
    const start = new Date(todayObj);
    start.setDate(start.getDate() - 27);
    
    for (let i = 0; i <= 27; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dStr = `${dy}-${dm}-${dd}`;
      
      const div = document.createElement('div');
      div.className = 'cal-day';
      div.innerText = dd;
      div.title = dStr;
      
      if (dStr === todayStr) div.classList.add('today');
      if (daysStudied.has(dStr)) div.classList.add('active');
      
      cal.appendChild(div);
    }
  }

  function calcStreak(daysStudied, todayStr) {
    let streak = 0;
    const d = new Date(todayStr + 'T00:00:00');
    
    if (daysStudied.has(todayStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // check if missed today but studied yesterday
      d.setDate(d.getDate() - 1);
    }

    while(true) {
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dStr = `${dy}-${dm}-${dd}`;
      
      if (daysStudied.has(dStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    
    document.getElementById('streakVal').innerText = `${streak} dias 🔥`;
  }

  function saveSession() {
    const dt = document.getElementById('tfDate').value;
    const mat = document.getElementById('tfMat').value;
    const assunto = document.getElementById('tfAssunto').value;
    const tempo = document.getElementById('tfTempo').value;
    const qts = document.getElementById('tfQts').value;
    const acertos = document.getElementById('tfAcertos').value;
    const obs = document.getElementById('tfObs').value;

    if (!dt || !assunto) {
      alert('Data e Assunto são obrigatórios!');
      return;
    }

    logs.push({
      date: dt,
      mat: mat,
      assunto: assunto,
      tempo: tempo ? parseInt(tempo) : 0,
      qts: qts ? parseInt(qts) : 0,
      acertos: acertos ? parseInt(acertos) : 0,
      obs: obs
    });

    saveLocal();
    document.getElementById('tfAssunto').value = '';
    document.getElementById('tfTempo').value = '';
    document.getElementById('tfQts').value = '';
    document.getElementById('tfAcertos').value = '';
    document.getElementById('tfObs').value = '';
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    renderTracker(`${yyyy}-${mm}-${dd}`);
  }

  function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "delta_estudos_backup.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function importData() {
    const p = prompt("Cole aqui o JSON de backup:");
    if (p) {
      try {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) {
          logs = parsed;
          saveLocal();
          location.reload();
        }
      } catch (e) {
        alert("JSON inválido");
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initTracker);
</script>
</body>
'''
if "const STORAGE_KEY = 'delta_estudos';" not in content:
    content = content.replace('</body>', js_to_add)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
