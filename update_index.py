import re
import os

path = r'c:\Users\dark_\OneDrive\Documentos\D_Franklin\Professor IA Concursos Públicos\index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

css_new = '''
  /* ── DASHBOARD ESTUDEI ──────────────────────────────── */
  .dash-top { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px; }
  .dash-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.02); }
  .dash-label { font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; }
  .dash-value { font-size:28px; font-weight:800; color:var(--text); line-height:1; }
  .dash-sub { font-size:12px; color:var(--green); font-weight:600; margin-top:8px; }
  
  .dash-main { display:flex; gap:24px; }
  .dash-left { flex:2; display:flex; flex-direction:column; gap:16px; }
  .dash-right { flex:1; display:flex; flex-direction:column; gap:16px; }
  
  .streak-banner { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px; font-size:13px; font-weight:500; color:var(--text); }
  
  .dash-box { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px; display:flex; flex-direction:column; }
  .box-title { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.5px; }
  
  .dash-table { width:100%; border-collapse:collapse; font-size:13px; }
  .dash-table th { text-align:left; padding:8px; border-bottom:1px solid var(--border); color:var(--text-dim); font-weight:600; font-size:11px; text-transform:uppercase; }
  .dash-table td { padding:10px 8px; border-bottom:1px solid var(--border); font-weight:500; }
  .dash-table tr:last-child td { border-bottom:none; }
  .col-mat { color:var(--brand); font-weight:600; }
  .col-time { color:var(--text); }
  .col-ok { color:var(--green); }
  .col-err { color:#ef4444; }
  .badge-pct { background:var(--green); color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700; }
  .badge-pct.low { background:#ef4444; }
  
  .btn-novo { width:100%; background:var(--brand); color:#fff; font-weight:700; border:none; padding:14px; border-radius:var(--r); cursor:pointer; font-size:14px; box-shadow:0 4px 12px rgba(255,107,0,0.2); transition:transform .2s; }
  .btn-novo:hover { transform:translateY(-2px); }
  
  .btn-util { background:transparent; border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:var(--r-sm); font-size:12px; font-weight:600; cursor:pointer; transition:background .2s; }
  .btn-util:hover { background:var(--surface-hover); }
  
  .history-list { display:flex; flex-direction:column; gap:16px; overflow-y:auto; max-height:400px; padding-right:8px; }
  .hist-item { display:flex; gap:12px; position:relative; }
  .hist-line { position:absolute; left:5px; top:20px; bottom:-16px; width:2px; background:var(--border); }
  .hist-item:last-child .hist-line { display:none; }
  .hist-dot { width:12px; height:12px; background:var(--brand); border-radius:50%; margin-top:4px; position:relative; z-index:2; flex-shrink:0; }
  .hist-content { flex:1; }
  .hist-title { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:2px; display:flex; justify-content:space-between; }
  .hist-desc { font-size:13px; font-weight:500; color:var(--text); }
  .hist-stats { font-size:11px; color:var(--text-dim); margin-top:2px; font-family:'IBM Plex Mono', monospace; }
  
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(2px); z-index:999; display:none; align-items:center; justify-content:center; }
  .modal-content { background:var(--surface); border:1px solid var(--border); border-radius:12px; width:100%; max-width:500px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.3); }
  .modal-header { padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .modal-header h2 { font-size:18px; font-weight:700; color:var(--text); margin:0; }
  .btn-close { background:none; border:none; color:var(--text-dim); font-size:24px; cursor:pointer; }
  .modal-body { padding:20px; display:flex; flex-direction:column; gap:16px; }
  .modal-row { display:flex; gap:16px; }
  .modal-group { flex:1; display:flex; flex-direction:column; gap:6px; }
  .modal-group label { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; }
  .modal-group input, .modal-group select { background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px; border-radius:var(--r-sm); font-size:14px; font-family:'Inter', sans-serif; outline:none; }
  .modal-group input:focus, .modal-group select:focus { border-color:var(--brand); }
  .box-gray { background:var(--bg); padding:16px; border-radius:var(--r-sm); border:1px solid var(--border); }
  .modal-footer { padding:20px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:12px; background:var(--surface-hover); }
  .btn-save { background:var(--brand); color:#fff; border:none; padding:10px 20px; border-radius:var(--r-sm); font-weight:700; cursor:pointer; }
  
  @media(max-width:768px){
    .dash-top { grid-template-columns: 1fr; }
    .dash-main { flex-direction: column; }
    .modal-row { flex-direction: column; }
  }
'''
html = re.sub(r'\.tracker-body\{.*\.history-list::-webkit-scrollbar-thumb:hover \{ background: var\(--text-dim\); \}', css_new, html, flags=re.DOTALL)

html_new = '''
  <!-- DASHBOARD SECTION -->
  <section class="dashboard-section" style="margin-bottom:40px;">
    
    <div class="dash-top">
      <div class="dash-card">
        <div class="dash-label">Tempo de Estudo</div>
        <div class="dash-value" id="stHours">0h</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">Desempenho Geral</div>
        <div class="dash-value" id="stPct">0%</div>
        <div class="dash-sub" id="stAcertosErros">0 Acertos / 0 Erros</div>
      </div>
      <div class="dash-card">
        <div class="dash-label">Total de Sessões</div>
        <div class="dash-value" id="stSess">0</div>
      </div>
    </div>

    <div class="dash-main">
      <div class="dash-left">
        <div class="streak-banner" id="streakBanner">
           Você está há 0 dias sem estudar! Seu recorde é de 0 dias sem falhas. 📅
        </div>
        
        <div class="dash-box mt-4">
           <div class="box-title">Painel de Disciplinas</div>
           <div style="overflow-x:auto;">
             <table class="dash-table" id="painelTable">
               <thead>
                 <tr>
                   <th>Disciplinas</th>
                   <th>Tempo</th>
                   <th>✔️</th>
                   <th>❌</th>
                   <th>%</th>
                 </tr>
               </thead>
               <tbody></tbody>
             </table>
           </div>
        </div>
      </div>
      
      <div class="dash-right">
         <button class="btn-novo" onclick="openRegistroModal()">+ Registrar Estudo</button>
         
         <div class="dash-box mt-4">
           <div class="box-title">Backup de Dados</div>
           <div style="display:flex; gap:8px;">
             <button class="btn-util" style="flex:1;" onclick="exportData()">Exportar JSON</button>
             <button class="btn-util" style="flex:1;" onclick="importData()">Importar JSON</button>
           </div>
         </div>
         
         <div class="dash-box mt-4" style="flex:1;">
           <div class="box-title">Últimas Atividades</div>
           <div class="history-list" id="historyList"></div>
         </div>
      </div>
    </div>
  </section>

  <!-- MODAL -->
  <div id="registroModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Registro de Estudo</h2>
        <button onclick="closeRegistroModal()" class="btn-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-row">
          <div class="modal-group">
            <label>Data</label>
            <input type="date" id="modalData">
          </div>
          <div class="modal-group">
            <label>Tempo (min)</label>
            <input type="number" id="modalTempo" placeholder="Ex: 60">
          </div>
        </div>
        <div class="modal-row">
          <div class="modal-group">
            <label>Categoria / Matéria</label>
            <select id="modalMat">
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
              <option value="RLM/REV">Revisão/Flashcards</option>
            </select>
          </div>
        </div>
        <div class="modal-group">
          <label>Tópico / Assunto</label>
          <input type="text" id="modalAssunto" placeholder="Ex: Teoria do Crime">
        </div>
        <div class="modal-row box-gray">
          <div class="modal-group">
            <label style="color:var(--green);">Questões (Acertos)</label>
            <input type="number" id="modalAcertos" placeholder="0">
          </div>
          <div class="modal-group">
            <label style="color:#ef4444;">Questões (Erros)</label>
            <input type="number" id="modalErros" placeholder="0">
          </div>
        </div>
        <div class="modal-group">
          <label>Comentários (Opcional)</label>
          <input type="text" id="modalObs" placeholder="Anotações da sessão...">
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeRegistroModal()" class="btn-util">Cancelar</button>
        <button onclick="saveModalSession()" class="btn-save">Salvar Registro</button>
      </div>
    </div>
  </div>
'''
html = re.sub(r'<!-- TRACKER SECTION -->.*?</section>', html_new, html, flags=re.DOTALL)

js_new = '''
  function renderTracker(todayStr) {
    let totalMins = 0;
    let totalQts = 0;
    let totalAcertos = 0;
    const daysStudied = new Set();
    const painelMap = {};

    logs.forEach(l => {
      const tm = parseInt(l.tempo || 0);
      const q = parseInt(l.qts || 0);
      const a = parseInt(l.acertos || 0);
      
      totalMins += tm;
      totalQts += q;
      totalAcertos += a;
      
      if (tm > 0 || q > 0) daysStudied.add(l.date);
      
      if(!painelMap[l.mat]) painelMap[l.mat] = { tempo:0, acertos:0, erros:0 };
      painelMap[l.mat].tempo += tm;
      painelMap[l.mat].acertos += a;
      painelMap[l.mat].erros += (q - a);
    });

    const totalHours = (totalMins / 60).toFixed(1);
    const totalErros = totalQts - totalAcertos;
    const pct = totalQts > 0 ? Math.round((totalAcertos / totalQts) * 100) : 0;

    document.getElementById('stHours').innerText = `${totalHours}h`;
    document.getElementById('stSess').innerText = logs.length;
    document.getElementById('stPct').innerText = `${pct}%`;
    document.getElementById('stAcertosErros').innerText = `${totalAcertos} Acertos / ${totalErros} Erros`;

    if (!daysStudied.has(todayStr)) {
      document.getElementById('nudgeBanner').style.display = 'block';
    } else {
      document.getElementById('nudgeBanner').style.display = 'none';
    }

    calcStreak(daysStudied, todayStr);
    renderPainel(painelMap);
    renderHistory();
  }

  function renderPainel(map) {
    const tbody = document.querySelector('#painelTable tbody');
    tbody.innerHTML = '';
    
    const matNames = {
      'DP': 'Direito Penal', 'DC': 'Dir. Constitucional', 'DCV': 'Direito Civil',
      'DA': 'Dir. Administrativo', 'DPP': 'Processo Penal', 'ML': 'Medicina Legal',
      'LPE': 'Leg. Penal Especial', 'DH': 'Direitos Humanos', 'DE': 'Dir. Empresarial',
      'CR': 'Criminologia', 'RLM/REV': 'Revisão / Flashcards'
    };
    
    for(const [mat, data] of Object.entries(map)) {
      const name = matNames[mat] || mat;
      const hours = Math.floor(data.tempo / 60);
      const mins = data.tempo % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
      
      const totalQ = data.acertos + data.erros;
      const pct = totalQ > 0 ? Math.round((data.acertos/totalQ)*100) : 0;
      const pctClass = pct >= 70 ? 'badge-pct' : 'badge-pct low';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-mat">${name}</td>
        <td class="col-time">${timeStr}</td>
        <td class="col-ok">${data.acertos}</td>
        <td class="col-err">${data.erros}</td>
        <td><span class="${pctClass}">${pct}%</span></td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    if (logs.length === 0) {
      container.innerHTML = '<div style="font-size:13px; color:var(--text-dim); text-align:center; padding: 20px;">Nenhum estudo registrado.</div>';
      return;
    }
    
    const sortedLogs = [...logs].map((l, i) => ({...l, originalIndex: i})).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    sortedLogs.slice(0, 15).forEach(l => {
      const div = document.createElement('div');
      div.className = 'hist-item';
      
      let statsHTML = '';
      if (l.tempo > 0) statsHTML += `⏳ ${l.tempo}min `;
      if (l.qts > 0) statsHTML += `🎯 ${l.acertos}/${l.qts} `;
      
      const dateParts = l.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : l.date;

      div.innerHTML = `
        <div class="hist-line"></div>
        <div class="hist-dot"></div>
        <div class="hist-content">
          <div class="hist-title">
            <span>${l.mat}</span>
            <span style="font-family:'IBM Plex Mono', monospace;">${formattedDate} <button class="btn-del" onclick="deleteSession(${l.originalIndex})" style="border:none;background:none;color:var(--text-dim);cursor:pointer;margin-left:8px;" title="Excluir">&times;</button></span>
          </div>
          <div class="hist-desc">${l.assunto}</div>
          <div class="hist-stats">${statsHTML} ${l.obs ? `| 📝 ${l.obs}` : ''}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function calcStreak(daysStudied, todayStr) {
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sortedDates = Array.from(daysStudied).sort();
    let prevDate = null;
    sortedDates.forEach(dStr => {
      if(!prevDate) {
        tempStreak = 1;
      } else {
        const pd = new Date(prevDate+'T00:00:00');
        const curr = new Date(dStr+'T00:00:00');
        pd.setDate(pd.getDate()+1);
        if (pd.getTime() === curr.getTime()) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if(tempStreak > maxStreak) maxStreak = tempStreak;
      prevDate = dStr;
    });

    let d = new Date(todayStr + 'T00:00:00');
    if (daysStudied.has(todayStr)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 1);
    }
    while(true) {
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (daysStudied.has(dStr)) {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    
    let text = `Você está há ${currentStreak} dias estudando sem falhar! 🔥`;
    if(currentStreak === 0) text = `Você não estudou hoje ainda. Seu recorde é de ${maxStreak} dias sem falhas. 📅`;
    else text += ` Seu recorde histórico é ${maxStreak} dias.`;
    
    document.getElementById('streakBanner').innerText = text;
  }

  // MODAL FUNCTIONS
  function openRegistroModal() {
    const now = new Date();
    document.getElementById('modalData').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    document.getElementById('registroModal').style.display = 'flex';
  }
  function closeRegistroModal() {
    document.getElementById('registroModal').style.display = 'none';
  }
  
  function saveModalSession() {
    const dt = document.getElementById('modalData').value;
    const mat = document.getElementById('modalMat').value;
    const assunto = document.getElementById('modalAssunto').value;
    const tempo = document.getElementById('modalTempo').value;
    const acertos = document.getElementById('modalAcertos').value || 0;
    const erros = document.getElementById('modalErros').value || 0;
    const obs = document.getElementById('modalObs').value;

    if (!dt || !assunto) {
      alert('Data e Assunto são obrigatórios!');
      return;
    }

    const qts = parseInt(acertos) + parseInt(erros);

    logs.push({
      date: dt,
      mat: mat,
      assunto: assunto,
      tempo: tempo ? parseInt(tempo) : 0,
      qts: qts,
      acertos: parseInt(acertos),
      obs: obs
    });

    saveLocal();
    closeRegistroModal();
    
    document.getElementById('modalAssunto').value = '';
    document.getElementById('modalTempo').value = '';
    document.getElementById('modalAcertos').value = '';
    document.getElementById('modalErros').value = '';
    document.getElementById('modalObs').value = '';
    
    const now = new Date();
    renderTracker(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  }

  function deleteSession(index) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      logs.splice(index, 1);
      saveLocal();
      const now = new Date();
      renderTracker(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    }
  }
'''
html = re.sub(r'function renderTracker\(todayStr\).*?function exportData\(\)', js_new + r'\n  function exportData()', html, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
