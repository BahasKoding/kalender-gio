// kalender.js
(function () {
  'use strict';

  // ====== Keys & Constants ======
  const STORAGE_KEY     = 'kalender-konten-youtube-panjang';
  const ATTENDANCE_KEY  = 'kalender-absen-100';
  const CELEBRATED_KEY  = 'kalender-absen-last-celebrated';
  const ATTENDANCE_SIZE = 100;

  const MILESTONES = {
    10: 'Pemanasan',
    20: 'Konsisten Banget',
    30: 'Pegang Ritme',
    40: 'Maratoner',
    50: 'Setengah Jalan',
    60: 'Tahan Banting',
    70: 'Mesin Konten',
    80: 'Elite Creator',
    90: 'Legend Grind',
    100: 'Century Club'
  };

  const CHECKLIST_BY_STATUS = {
    'Ide':    ["Hook jelas", "Riset keyword", "Thumbnail konsep"],
    'Riset':  ["Cek kompetitor", "Cari 3 keyword turunan", "Validasi search intent"],
    'Naskah': ["Outline 5 poin", "CTA kuat", "Opening 30 detik nempel"],
    'Rekam':  ["Audio clear", "B-roll cukup", "Framing rapi"],
    'Edit':   ["Cut dead air", "Subtitle", "Musik halus"],
    'QA':     ["Cek typo", "Pacing enak", "No clipping audio"],
    'Upload': ["Judul & Deskripsi", "Tag & Chapter", "End screen & Cards", "Thumbnail final"],
  };

  // ====== Elements ======
  const els = {
    title:        document.getElementById('title'),
    avgCTR:       document.getElementById('avg_ctr'),
    avgRet:       document.getElementById('avg_ret'),
    btnAdd:       document.getElementById('btn_add'),
    btnExport:    document.getElementById('btn_export'),
    btnClear:     document.getElementById('btn_clear'),
    fileInput:    document.getElementById('file_input'),
    tbody:        document.getElementById('tbody_rows'),
    statViews:    document.getElementById('stat_views'),
    statWatch:    document.getElementById('stat_watch'),
    statCTR:      document.getElementById('stat_ctr'),
    statRET:      document.getElementById('stat_ret'),
    statCTRNote:  document.getElementById('stat_ctr_note'),
    statRETNote:  document.getElementById('stat_ret_note'),
    statRev:      document.getElementById('stat_rev'),
    absenHead:    document.getElementById('absen_head'),
    absenChecks:  document.getElementById('absen_checks'),
    absenMilestones: document.getElementById('absen_milestones'),
    absenDone:    document.getElementById('absen_done'),
    gelarWrap:    document.getElementById('gelar_wrap'),
  };

  // CTA Elements & Keys
  const CTA_URL         = 'https://giomaulana.myr.id/coaching/private-mentoring-30-hari';
  const CTA_BOTTOM_KEY  = 'cta_bottom_shown_v1';
  const ctaTop          = document.getElementById('cta_top');
  const ctaTopClose     = document.getElementById('cta_top_close');
  const ctaTopBtn       = document.getElementById('cta_top_btn');
  const ctaBottom       = document.getElementById('cta_bottom');
  const ctaBottomClose  = document.getElementById('cta_bottom_close');
  const ctaBottomBtn    = document.getElementById('cta_bottom_btn');

  // ====== State ======
  let state          = load() || seed();
  let absen          = loadAbsen() || Array(ATTENDANCE_SIZE).fill(false);
  let lastCelebrated = loadCelebrated();

  // ====== Persistence ======
  function load() {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function loadAbsen() {
    try { const s = localStorage.getItem(ATTENDANCE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  }
  function saveAbsen() { localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(absen)); }

  function loadCelebrated() {
    try {
      const s = localStorage.getItem(CELEBRATED_KEY);
      const n = s == null ? 0 : Number(s);
      return Number.isFinite(n) ? n : 0;
    } catch { return 0; }
  }
  function saveCelebrated(n) { localStorage.setItem(CELEBRATED_KEY, String(n)); }

  // ====== Seed & Helpers ======
  function seed() {
    return {
      title: 'Kalender Konten YouTube Panjang',
      channelAvg: { ctr: 5, retention: 45 },
      rows: [
        mkRow(1, 'Cara Rawat Cupang Biar Warnanya Ngejreng', 'Ide', todayISO()),
        mkRow(2, '5 Kesalahan Fatal Pemula di YouTube Shorts', 'Naskah', plus7(todayISO())),
        mkRow(3, 'Strategi Upload 1 Video Panjang per Minggu', 'Edit', plus7(plus7(todayISO())))
      ],
    };
  }
  function mkRow(week, idea = '', status = 'Ide', targetISO) {
    return {
      id: crypto.randomUUID(),
      week, idea, status,
      checklist: (CHECKLIST_BY_STATUS[status] || []).map(t => ({ text: t, done: false })),
      target: targetISO || todayISO(),
      views: '', watchTime: '', ctr: '', retention: '', revenue: ''
    };
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function plus7(iso) { const d = new Date(iso); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }

  function currencyIDR(n) {
    try {
      const num = Number(n || 0);
      if (!isFinite(num) || num <= 0) return 'Rp 0';
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    } catch { return 'Rp 0'; }
  }
  function formatLargeNumber(n) {
    const num = Number(n || 0);
    if (!isFinite(num) || num <= 0) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000)     return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString('id-ID');
  }

  // ====== Audio (LOCAL FILES) ======
  // Sound untuk tiap checklist dicentang
  function playTickSound() {
    try {
      const el = document.getElementById('tick-audio');
      if (!el) return;
      // clone agar bisa overlap saat centang cepat
      const clone = el.cloneNode(true);
      clone.volume = el.volume ?? 1;
      document.body.appendChild(clone);
      const p = clone.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      clone.addEventListener('ended', () => clone.remove());
      setTimeout(() => clone.remove(), 3000);
    } catch {}
  }

  // Sound untuk milestone (kelipatan 10)
  function playCelebrateSound() {
    try {
      const el = document.getElementById('milestone-audio');
      if (!el) return;
      el.pause();
      el.currentTime = 0;
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
  }

  // ====== SweetAlert2 Loader (CDN) ======
  function ensureSwal() {
    return new Promise((resolve) => {
      if (window.Swal) return resolve(window.Swal);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      s.async = true;
      s.onload = () => resolve(window.Swal);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  // ====== Table Cell Builders ======
  function tdInput(type, value, onChange, align, attrs) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = type; input.value = value ?? '';
    input.style.width = '100%'; input.style.textAlign = align || 'left';
    if (type === 'number') {
      input.classList.add('number-large');
      input.style.fontFamily = 'Monaco, Menlo, monospace';
    }
    if (attrs) Object.entries(attrs).forEach(([k, v]) => input.setAttribute(k, v));
    input.addEventListener('input', e => onChange(e.target.value));
    td.appendChild(input);
    return td;
  }

  function tdSelect(value, onChange) {
    const td = document.createElement('td');
    const sel = document.createElement('select');
    sel.style.width = '100%';
    ['Ide', 'Riset', 'Naskah', 'Rekam', 'Edit', 'QA', 'Upload'].forEach(s => {
      const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sel.appendChild(opt);
    });
    sel.value = value; sel.addEventListener('change', e => onChange(e.target.value));
    td.appendChild(sel);
    return td;
  }

  function tdChecklist(r) {
    const td = document.createElement('td');
    const wrap = document.createElement('div'); wrap.className = 'checklist-wrap';

    r.checklist.forEach((c, i) => {
      const label = document.createElement('label'); label.className = 'chip' + (c.done ? ' good' : '');
      label.style.cursor = 'pointer';

      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = c.done;
      cb.addEventListener('change', e => {
        const checked = e.target.checked;
        r.checklist[i].done = checked;
        save(); updateStats();

        if (checked) { label.classList.add('good'); playTickSound(); }
        else { label.classList.remove('good'); }
      });

      const span = document.createElement('span'); span.textContent = c.text;
      label.appendChild(cb); label.appendChild(span); wrap.appendChild(label);
    });

    td.appendChild(wrap);
    return td;
  }

  function btn(txt, onClick, kind) {
    const b = document.createElement('button');
    b.textContent = txt;
    if (kind === 'danger') b.classList.add('danger');
    b.addEventListener('click', onClick);
    b.classList.add('icon');
    return b;
  }

  // ====== Render Weekly Table ======
  function render() {
    els.title.value = state.title;
    els.avgCTR.value = state.channelAvg.ctr;
    els.avgRet.value = state.channelAvg.retention;

    els.tbody.innerHTML = '';
    state.rows.forEach((r) => {
      const tr = document.createElement('tr');

      tr.appendChild(tdInput('number', r.week, v => setField(r.id, 'week', Number(v || 0)), 'center'));
      tr.appendChild(tdInput('text',   r.idea, v => setField(r.id, 'idea', v)));
      tr.appendChild(tdSelect(r.status, val => changeStatus(r.id, val)));
      tr.appendChild(tdChecklist(r));
      tr.appendChild(tdInput('date',   r.target, v => setField(r.id, 'target', v)));
      tr.appendChild(tdInput('number', r.views, v => setField(r.id, 'views', v), 'right'));
      tr.appendChild(tdInput('number', r.watchTime, v => setField(r.id, 'watchTime', v), 'right', { step: '0.1' }));

      const ctrTd = tdInput('number', r.ctr, v => setField(r.id, 'ctr', v), 'right', { step: '0.1' });
      if (Number(r.ctr) >= Number(state.channelAvg.ctr) && r.ctr !== '') ctrTd.style.backgroundColor = 'var(--emerald-50)';
      tr.appendChild(ctrTd);

      const retTd = tdInput('number', r.retention, v => setField(r.id, 'retention', v), 'right', { step: '0.1' });
      if (Number(r.retention) >= Number(state.channelAvg.retention) && r.retention !== '') retTd.style.backgroundColor = 'var(--emerald-50)';
      tr.appendChild(retTd);

      tr.appendChild(tdInput('number', r.revenue, v => setField(r.id, 'revenue', v), 'right', { step: '1000' }));

      const tdAct = document.createElement('td');
      const ganda = btn('⟳', () => duplicateRow(r.id), '');
      ganda.title = 'Gandakan baris (minggu +1)';
      const hapus = btn('🗑', () => removeRow(r.id), 'danger');
      tdAct.appendChild(ganda); tdAct.appendChild(document.createTextNode(' ')); tdAct.appendChild(hapus);
      tr.appendChild(tdAct);

      els.tbody.appendChild(tr);
    });

    updateStats();
    renderAttendance(); // juga menghitung milestone & bunyi jika perlu
  }

  // ====== Stats ======
  function updateStats() {
    const rows = state.rows;

    const sum = rows.reduce((acc, r) => {
      const v = Number(r.views || 0);
      const w = Number(r.watchTime || 0);
      const c = Number(r.ctr || 0);
      const t = Number(r.retention || 0);
      const rev = Number(r.revenue || 0);

      acc.views += isFinite(v) ? v : 0;
      acc.watch += isFinite(w) ? w : 0;
      acc.rev   += isFinite(rev) ? rev : 0;

      if (r.ctr !== '' && isFinite(c)) { acc.ctr += c; acc.ctrN += 1; }
      if (r.retention !== '' && isFinite(t)) { acc.ret += t; acc.retN += 1; }

      if (r.ctr !== '' && isFinite(c) && c >= Number(state.channelAvg.ctr)) acc.ctrAbove += 1;
      if (r.retention !== '' && isFinite(t) && t >= Number(state.channelAvg.retention)) acc.retAbove += 1;

      const totalCk = (r.checklist || []).length;
      const doneCk  = (r.checklist || []).filter(x => x.done).length;
      acc.ckTotal += totalCk;
      acc.ckDone  += doneCk;

      return acc;
    }, { views: 0, watch: 0, rev: 0, ctr: 0, ret: 0, ctrN: 0, retN: 0, ctrAbove: 0, retAbove: 0, ckTotal: 0, ckDone: 0 });

    const avgCTR = sum.ctrN ? (sum.ctr / sum.ctrN) : 0;
    const avgRET = sum.retN ? (sum.ret / sum.retN) : 0;

    els.statViews.textContent = formatLargeNumber(sum.views);
    els.statWatch.textContent = (sum.watch || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });
    els.statCTR.textContent   = avgCTR.toFixed(1) + '%';
    els.statRET.textContent   = avgRET.toFixed(1) + '%';
    els.statRev.textContent   = currencyIDR(sum.rev);

    const ctrAvg = Number(state.channelAvg.ctr);
    const retAvg = Number(state.channelAvg.retention);
    els.statCTRNote.textContent = sum.ctrN ? `${sum.ctrAbove}/${sum.ctrN} video ≥ rata-rata channel (${ctrAvg}%)` : 'Belum ada data CTR';
    els.statRETNote.textContent = sum.retN ? `${sum.retAbove}/${sum.retN} video ≥ rata-rata channel (${retAvg}%)` : 'Belum ada data Retention';
  }

  // ====== Attendance 1..100 ======
  function renderAttendance() {
    // Header 1..100
    els.absenHead.innerHTML = '';
    for (let i = 1; i <= ATTENDANCE_SIZE; i++) {
      const th = document.createElement('th'); th.textContent = String(i); els.absenHead.appendChild(th);
    }

    // Checks row
    els.absenChecks.innerHTML = '';
    for (let i = 0; i < ATTENDANCE_SIZE; i++) {
      const td = document.createElement('td');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!absen[i];
      cb.addEventListener('change', e => {
        absen[i] = e.target.checked;
        saveAbsen();
        // Re-render untuk hitung ulang progress & milestones
        renderAttendance();
      });
      td.appendChild(cb);
      els.absenChecks.appendChild(td);
    }

    // Milestones icons row
    els.absenMilestones.innerHTML = '';
    for (let i = 1; i <= ATTENDANCE_SIZE; i++) {
      const td = document.createElement('td');
      if (MILESTONES[i]) { td.textContent = '🏁'; td.title = MILESTONES[i]; }
      els.absenMilestones.appendChild(td);
    }

    // Counter + Gelar
    const done = absen.filter(Boolean).length;
    els.absenDone.textContent = String(done);

    els.gelarWrap.innerHTML = '';
    Object.entries(MILESTONES).forEach(([k, label]) => {
      if (done >= Number(k)) {
        const badge = document.createElement('span');
        badge.className = 'badge ok';
        badge.textContent = `${k} • ${label}`;
        els.gelarWrap.appendChild(badge);
      }
    });

    // Milestone trigger (10,20,...)
    if (done > 0 && done % 10 === 0 && done !== lastCelebrated) {
      playCelebrateSound();

      ensureSwal().then((Swal) => {
        const label = MILESTONES[done] || `Milestone ${done}`;
        const html = `
          <div style="line-height:1.6">
            <div style="font-size:18px;margin-bottom:6px"><b>Congrats! 🎉</b></div>
            <div>Strike <b>${done}</b> tercapai.</div>
            <div style="margin-top:6px"><span style="
              display:inline-block;padding:4px 8px;border-radius:999px;
              background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-weight:600;">
              ${done} • ${label}
            </span></div>
          </div>
        `;
        if (Swal) {
          Swal.fire({
            html,
            icon: 'success',
            confirmButtonText: 'Mantap!',
            timer: 3500,
            timerProgressBar: true,
            showCloseButton: true
          });
        } else {
          alert(`Congrats! Strike ${done} tercapai (${label}).`);
        }
      });

      lastCelebrated = done;
      saveCelebrated(done);
    }
  }

  // ====== CSV ======
  function rowsToCSV(rows) {
    const esc = (s) => {
      const str = (s ?? '').toString();
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const header = ['week','idea','status','target','views','watchTime','ctr','retention','revenue','checklist_done','checklist_total'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const line = [
        r.week, r.idea, r.status, r.target, r.views, r.watchTime, r.ctr, r.retention, r.revenue,
        (r.checklist || []).filter(c => c.done).length,
        (r.checklist || []).length
      ].map(esc).join(',');
      lines.push(line);
    });
    return lines.join('\n');
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    const rows = [];
    let i = 0, cur = '', inQ = false, rec = [];
    const pushField = () => { rec.push(cur); cur = ''; };
    const pushRec   = () => { if (rec.length) rows.push(rec); rec = []; };
    while (i < text.length) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
        } else { cur += ch; }
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ',') pushField();
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          pushField(); pushRec();
        } else { cur += ch; }
      }
      i++;
    }
    if (cur !== '' || rec.length) { pushField(); pushRec(); }
    return rows;
  }

  function importCSV(text) {
    const rows = parseCSV(text);
    if (!rows.length) return;
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = (name) => header.indexOf(name);
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row.length) continue;
      const week      = Number(row[idx('week')] || (out.length + 1));
      const idea      = row[idx('idea')] ?? '';
      const status    = row[idx('status')] || 'Ide';
      const target    = row[idx('target')] || todayISO();
      const views     = row[idx('views')] ?? '';
      const watchTime = row[idx('watchtime')] ?? row[idx('watch_time')] ?? '';
      const ctr       = row[idx('ctr')] ?? '';
      const retention = row[idx('retention')] ?? '';
      const revenue   = row[idx('revenue')] ?? '';
      const base = mkRow(week, idea, status, target);
      base.views = views; base.watchTime = watchTime; base.ctr = ctr; base.retention = retention; base.revenue = revenue;
      out.push(base);
    }
    out.sort((a, b) => Number(a.week) - Number(b.week));
    out.forEach((r, i) => r.week = i + 1);
    state.rows = out;
    save();
    render();
  }

  // ====== Mutations ======
  function setField(id, field, value) {
    state.rows = state.rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    save();
    updateStats();
  }
  function changeStatus(id, newStatus) {
    state.rows = state.rows.map(r => {
      if (r.id !== id) return r;
      const need = CHECKLIST_BY_STATUS[newStatus] || [];
      const map  = new Map(r.checklist.map(c => [c.text, c.done]));
      return { ...r, status: newStatus, checklist: need.map(t => ({ text: t, done: map.get(t) || false })) };
    });
    save();
    render();
  }
  function addWeek() {
    const last = state.rows[state.rows.length - 1];
    const nextWeek = last ? Number(last.week) + 1 : 1;
    const nextDate = last ? plus7(last.target) : plus7(todayISO());
    state.rows.push(mkRow(nextWeek, '', 'Ide', nextDate));
    save();
    render();
  }
  function duplicateRow(id) {
    const idx = state.rows.findIndex(r => r.id === id);
    if (idx < 0) return;
    const base = state.rows[idx];
    const copy = { ...base, id: crypto.randomUUID(), week: Number(base.week) + 1, target: plus7(base.target) };
    copy.views = ''; copy.watchTime = ''; copy.ctr = ''; copy.retention = ''; copy.revenue = '';
    copy.checklist = copy.checklist.map(c => ({ ...c, done: false }));
    state.rows.splice(idx + 1, 0, copy);
    state.rows = state.rows.map((r, i) => ({ ...r, week: i + 1 }));
    save();
    render();
  }
  function removeRow(id) {
    state.rows = state.rows.filter(r => r.id !== id);
    state.rows = state.rows.map((r, i) => ({ ...r, week: i + 1 }));
    save();
    render();
  }

  // === Init CTA Top (tanpa tombol close & tanpa localStorage) ===
  (function initCtaTop(){
    if (!ctaTop) return;

    // Paksa tampil (kalau sebelumnya sudah pernah di-dismiss)
    try { localStorage.removeItem('cta_top_dismissed_v1'); } catch {}
    ctaTop.style.display = '';

    // Buang tombol X kalau masih ada di HTML
    ctaTopClose?.remove();

    // Pastikan link CTA benar
    ctaTopBtn?.setAttribute('href', CTA_URL);
  })();

  // === Init CTA Bottom (muncul saat scroll ke bawah, sekali saja) ===
  (function initCtaBottom(){
    if (!ctaBottom) return;

    // Paksa tampil
    ctaBottom.style.display = '';

    // Buang tombol X supaya tidak bisa ditutup
    ctaBottomClose?.remove();

    // Pastikan link benar
    ctaBottomBtn?.setAttribute('href', CTA_URL);
  })();



  // ====== Listeners ======
  els.btnAdd?.addEventListener('click', addWeek);
  els.btnExport?.addEventListener('click', () => {
    const csv = rowsToCSV(state.rows);
    const nm = (state.title || 'kalender').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    download(`${nm}.csv`, csv);
  });
  els.btnClear?.addEventListener('click', () => {
    if (confirm('Hapus semua data kalender & absen di perangkat ini?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ATTENDANCE_KEY);
      localStorage.removeItem(CELEBRATED_KEY);
      state = seed();
      absen = Array(ATTENDANCE_SIZE).fill(false);
      lastCelebrated = 0;
      render();
    }
  });
  els.fileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importCSV(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  });

  els.title?.addEventListener('input', e => {
    state.title = e.target.value || 'Kalender Konten YouTube Panjang';
    save();
  });
  els.avgCTR?.addEventListener('input', e => {
    const v = Number(e.target.value || 0);
    state.channelAvg.ctr = Number.isFinite(v) ? v : 0;
    save(); render();
  });
  els.avgRet?.addEventListener('input', e => {
    const v = Number(e.target.value || 0);
    state.channelAvg.retention = Number.isFinite(v) ? v : 0;
    save(); render();
  });

  // ====== Initial Render ======
  render();
})();
