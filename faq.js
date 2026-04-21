// Pre-fill Supabase defaults
const SB_URL = 'https://lrccotdkoptqwehvsbvk.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyY2NvdGRrb3B0cXdlaHZzYnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDcyNjMsImV4cCI6MjA5MTIyMzI2M30.Za9MeR-E_W-x_7_eIGe6ZsQPDvMhBFN1SLlEcHRQPz4';

// ── DATA ── loaded from Supabase ──────────────────────────
const DEFAULT_FAQS = [
  {id:1,topic:"leads",role:"both",q:"How do I add a new lead in Zoho CRM?",a:`<p>Go to <code>Leads</code> in the top navigation bar, then click <strong>+ New Lead</strong>. Fill in required fields (marked with *) and click <strong>Save</strong>.</p><ul><li>Required fields: Last Name, Company, Lead Source</li><li>Import in bulk via <code>Leads → Import</code></li></ul><div class="tip">Always check for duplicates before creating a new lead using <em>Find & Merge Duplicates</em>.</div>`,photo:""},
  {id:2,topic:"leads",role:"agent",q:"How do I convert a lead to a contact or deal?",a:`<p>Open the lead record, click <strong>Convert</strong> at the top. You'll be prompted to create a Contact, Account, and/or Deal.</p><ul><li>Existing fields auto-map to the new records</li><li>The original lead is marked as <em>Converted</em></li></ul>`,photo:""},
  {id:3,topic:"leads",role:"agent",q:"How do I assign a lead to myself or another agent?",a:`<p>Open the lead record and find the <strong>Lead Owner</strong> field. Click the pencil icon and select the desired user.</p><div class="tip">Use <code>Leads → Mass Update</code> to reassign multiple leads at once.</div>`,photo:""},
  {id:4,topic:"leads",role:"lead",q:"How do I reassign leads in bulk across the team?",a:`<p>Go to <code>Leads</code>, select records via checkboxes, then click <strong>Actions → Mass Update</strong> and change the <em>Lead Owner</em> field.</p>`,photo:""},
  {id:5,topic:"leads",role:"both",q:"How do I search for a specific contact or lead?",a:`<p>Use the <strong>global search bar</strong> at the top. For precise results, use <strong>Advanced Search</strong> inside the module.</p>`,photo:""},
  {id:6,topic:"leads",role:"both",q:"What does each lead status mean?",a:`<p>Lead statuses:</p><ul><li><strong>New</strong> — not yet contacted</li><li><strong>Attempted to Contact</strong> — outreach sent, no reply</li><li><strong>Connected</strong> — successfully reached</li><li><strong>Junk Lead</strong> — irrelevant/spam</li></ul>`,photo:""},
  {id:7,topic:"users",role:"lead",q:"How do I add a new user to our CRM?",a:`<p>Go to <code>Setup → Users & Control → Users</code> and click <strong>+ New User</strong>.</p>`,photo:""},
  {id:8,topic:"data",role:"both",q:"How do I log a call, email, or note on a record?",a:`<p>Open the lead or contact, scroll to <strong>Activities / Timeline</strong> and click Log a Call, Send Email, or Add Note.</p>`,photo:""},
];

let faqs = [];
let activeRoles = new Set(['agent','lead','both']);
let activeTopic = 'all';

async function loadFAQsFromSupabase() {
  const debugEl = document.getElementById('sb-debug');
  if (debugEl) debugEl.textContent = 'Fetching from Supabase…';
  try {
    const res = await fetch(`${SB_URL}/rest/v1/faqs?select=*&order=id.asc`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    if (debugEl) debugEl.textContent = `Status: ${res.status} | Response: ${text.substring(0,200)}`;
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    const rows = JSON.parse(text);
    if (rows && rows.length > 0) {
      faqs = rows.map(r => ({ id:r.id, topic:r.topic, role:r.role, q:r.question, a:r.answer, photo:r.photo||'' }));
      if (debugEl) debugEl.textContent = `✓ Loaded ${faqs.length} FAQs from Supabase`;
    } else {
      if (debugEl) debugEl.textContent = '⚠ Table is empty — using defaults';
      faqs = DEFAULT_FAQS;
    }
  } catch(e) {
    if (debugEl) debugEl.textContent = `✗ Error: ${e.message}`;
    try {
      const saved = localStorage.getItem('zoho_faqs');
      faqs = saved ? JSON.parse(saved).map(f=>({...f,q:f.question||f.q,a:f.answer||f.a})) : DEFAULT_FAQS;
    } catch(e2) { faqs = DEFAULT_FAQS; }
  }
  filterFAQ();
}

const topicMeta = {
  leads: { label: 'Leads & Contacts', icon: '👤', color: '#1D5C8A', bg: '#E8F1F8' },
  users: { label: 'User & Role Management', icon: '🔐', color: '#1A6B45', bg: '#E6F4EE' },
  data: { label: 'Data Entry & Fields', icon: '📋', color: '#4A3A8C', bg: '#EEEAF8' }
};

function toggleRole(role, el) {
  if (activeRoles.has(role)) {
    if (activeRoles.size === 1) return;
    activeRoles.delete(role);
    el.className = 'chip';
  } else {
    activeRoles.add(role);
    el.className = `chip active-${role}`;
  }
  filterFAQ();
}

function setTopic(topic, el) {
  activeTopic = topic;
  document.querySelectorAll('[data-topic]').forEach(c => c.className = 'chip');
  el.className = 'chip active-topic';
  filterFAQ();
}

function filterFAQ() {
  const q = document.getElementById('search').value.toLowerCase();
  const container = document.getElementById('faq-list');
  const noRes = document.getElementById('no-results');

  const grouped = { leads: [], users: [], data: [] };
  faqs.forEach(f => {
    if (!activeRoles.has(f.role)) return;
    if (activeTopic !== 'all' && activeTopic !== f.topic) return;
    if (q && !f.q.toLowerCase().includes(q) && !f.a.toLowerCase().includes(q)) return;
    grouped[f.topic].push(f);
  });

  const keys = activeTopic === 'all' ? ['leads','users','data'] : [activeTopic];
  let html = '';
  let total = 0;

  keys.forEach(k => {
    if (!grouped[k] || !grouped[k].length) return;
    const m = topicMeta[k];
    total += grouped[k].length;
    html += `<div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:${m.bg};color:${m.color}">${m.icon}</div>
        <span class="section-title">${m.label}</span>
        <span class="section-count">${grouped[k].length} article${grouped[k].length>1?'s':''}</span>
      </div>`;
    grouped[k].forEach(f => {
      const badgeClass = `badge-${f.role}`;
      const badgeLabel = f.role === 'agent' ? 'Agent' : f.role === 'lead' ? 'Team Lead' : 'Both';
      const photoHtml = f.photo
        ? `<img class="faq-photo" src="${f.photo}" alt="" onerror="this.style.display='none'">`
        : `<div class="faq-photo-placeholder">?</div>`;
      const imgSection = f.photo ? `<div class="faq-img-wrap"><img src="${f.photo}" alt="FAQ image"></div>` : '';
      html += `<div class="faq-card">
        <div class="faq-q" onclick="toggle(this)">
          ${photoHtml}
          <span class="role-badge ${badgeClass}">${badgeLabel}</span>
          <span class="faq-q-text">${f.q}</span>
          <svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="faq-a">
          <div class="faq-a-inner">${f.a}${imgSection}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });

  container.innerHTML = html;
  noRes.style.display = total === 0 ? 'block' : 'none';

  document.getElementById('faq-count-badge').textContent = `${total} article${total!==1?'s':''}`;
  document.getElementById('footer-count').textContent = `${total} article${total!==1?'s':''}`;
  renderStats(grouped, keys);
}

function renderStats(grouped, keys) {
  let total = 0, agents = 0, leads = 0, both = 0;
  keys.forEach(k => {
    (grouped[k]||[]).forEach(f => {
      total++;
      if(f.role==='agent') agents++;
      else if(f.role==='lead') leads++;
      else both++;
    });
  });
  document.getElementById('stats-bar').innerHTML = `
    <div class="stat"><div class="stat-num">${total}</div><div class="stat-label">Total Articles</div></div>
    <div class="stat"><div class="stat-num" style="color:var(--accent)">${agents}</div><div class="stat-label">Agent Tips</div></div>
    <div class="stat"><div class="stat-num" style="color:var(--green)">${leads}</div><div class="stat-label">Lead Tips</div></div>
    <div class="stat"><div class="stat-num" style="color:var(--purple)">${both}</div><div class="stat-label">Shared</div></div>
  `;
}

function toggle(el) {
  const ans = el.nextElementSibling;
  const chev = el.querySelector('.faq-chevron');
  ans.classList.toggle('open');
  chev.classList.toggle('open');
}

// Listen for updates from admin panel
window.addEventListener('storage', e => {
  if (e.key === 'zoho_faqs') { loadFAQsFromSupabase(); }
});


// ── LEAD LOOKUP ────────────────────────────────────────────────────────────────

// ── GET TOKEN FROM SUPABASE ONLY ─────────────────
async function getActiveToken() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/zoho_tokens?id=eq.1&select=access_token`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await res.json();
    if (rows && rows.length > 0 && rows[0].access_token && rows[0].access_token !== '') {
      return rows[0].access_token;
    }
  } catch(e) { console.error('Token fetch error:', e.message); }
  return '';
}

function initTokenSetup() { /* no-op — token managed via Supabase */ }

function showToast(msg) {
  let t = document.getElementById('lu-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'lu-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1A1814;color:white;padding:12px 20px;border-radius:10px;font-size:13px;z-index:999;transition:all 0.25s;opacity:0;transform:translateY(8px);pointer-events:none;font-family:DM Sans,sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 3000);
}

function getStatusClass(status) {
  if (!status) return 'status-other';
  const s = status.toLowerCase();
  if (s === 'new') return 'status-new';
  if (s.includes('connect')) return 'status-connected';
  if (s.includes('attempt')) return 'status-attempted';
  return 'status-other';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) { return dateStr; }
}

function renderLeadCard(lead) {
  const name = lead.Last_Name || 'Unknown';
  const phone = lead.Phone || '—';
  const status = lead.Lead_Status || '—';
  const subStatus = lead.Sub_Lead_Status || '—';
  const queueStatus = lead.Lead_Queue_Status || '—';
  const owner = lead.Owner ? (lead.Owner.name || lead.Owner) : '—';
  const ownerEmail = lead.Owner ? (lead.Owner.email || '—') : '—';
  const workingAgent = lead.Working_Agent || '—';
  const ucid = lead.UCID_Number || '—';
  const source = lead.Lead_Source || '—';
  const callId = lead.Call_ID || '—';
  const inbound = lead.Inbound_Call_Count || 0;
  const statusClass = getStatusClass(status);

  return `<div class="lead-card">
    <div class="lead-card-top">
      <div>
        <div class="lead-name">${name}</div>
        <div class="lead-company">${phone}</div>
      </div>
      <span class="lead-status-pill ${statusClass}">${status}</span>
    </div>
    <div class="lead-meta">
      <div class="lead-meta-item"><span class="meta-label">Sub Status</span><span class="meta-value">${subStatus}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Queue Status</span><span class="meta-value">${queueStatus}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Owner</span><span class="meta-value highlight">${owner}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Owner Email</span><span class="meta-value">${ownerEmail}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Working Agent</span><span class="meta-value">${workingAgent}</span></div>
      <div class="lead-meta-item"><span class="meta-label">UCID</span><span class="meta-value">${ucid}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Lead Source</span><span class="meta-value">${source}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Inbound Calls</span><span class="meta-value">${inbound}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Call ID</span><span class="meta-value" style="font-size:11px">${callId}</span></div>
      <div class="lead-meta-item"><span class="meta-label">Lead ID</span><span class="meta-value" style="font-size:11px">${lead.id || '—'}</span></div>
    </div>
  </div>`;
}

async function getActiveToken() {
  // Always fetch latest token from Supabase — admin panel keeps it fresh every 29 min
  try {
    const res = await fetch(`${SB_URL}/rest/v1/zoho_tokens?id=eq.1&select=access_token`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await res.json();
    if (rows && rows.length > 0 && rows[0].access_token && rows[0].access_token !== '') {
      return rows[0].access_token;  // Always use Supabase token — freshest one
    }
  } catch(e) { /* fall through */ }
  // Fallback to localStorage if Supabase unreachable
  return localStorage.getItem('zoho_access_token') || '';
}

// ── ERROR POPUP ───────────────────────────────────────────────
function showErrorPopup(title, detail) {
  const existing = document.getElementById('error-popup-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'error-popup-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:1.5rem;max-width:480px;width:100%;border:1px solid #E8E4DC;font-family:DM Sans,sans-serif">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
        <div style="width:36px;height:36px;border-radius:50%;background:#FBEAEA;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A32020" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style="font-size:15px;font-weight:500;color:#1A1814">${title}</div>
      </div>
      <pre style="background:#F7F5F0;border-radius:8px;padding:12px;font-size:12px;color:#5C5850;overflow:auto;white-space:pre-wrap;max-height:200px;border:1px solid #E8E4DC">${detail}</pre>
      <button onclick="document.getElementById('error-popup-overlay').remove()" style="margin-top:1rem;width:100%;padding:10px;background:#1D5C8A;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:DM Sans,sans-serif">Close</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

// ── LEAD LOOKUP ───────────────────────────────────────────────
async function searchLead(inputValue, accessToken) {
  inputValue = inputValue.trim();
const fromDate = '2026-10-15T00:00:00+05:30';
const toDate = new Date().toISOString();
  let searchField = '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;

  if (emailRegex.test(inputValue)) searchField = 'Email';
  else if (phoneRegex.test(inputValue)) searchField = 'Phone';
  else searchField = 'Customer_ID';

const query = `
select id, Last_Name, Phone, Owner, Agent_Assigned_Time, Call_connected_with,
First_Activity_Done_by, Working_Agent, Lead_Status, UCID_Number,
Sub_Lead_Status, Lead_Queue_Status, Inbound_Call_Count, East_Coast_Route,
Lead_Source, Expired, Inbound_Call_Count1, L1_Auto_OB_Call_Count,
L1_Manual_Call_Count, L1_Rechurn_Call_Count, L2_Auto_OB_Call_Count,
L2_Manual_Call_Count, L2_Rechurn_Call_Count, L2_Inbond_Call_Count,
L1_Inbond_Call_Count, Manual_Call_Count, Auto_OB_Call_Count, Call_ID
from Leads
where (
  (${searchField} = '${inputValue}' AND Lead_Status != 'Contacted')
  AND (Lead_Queue_Status  != 'Disqualified' AND Lead_Queue_Status  != 'DISQUALIFIED LEADS')
  AND (Created_Time between '${fromDate}' and '${toDate}' AND Expired = false)
)
ORDER BY Created_Time DESC
limit 1
`;
  // 🔥 CALL YOUR BACKEND INSTEAD OF ZOHO
  const res = await fetch('/api/zoho', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: query,
      token: accessToken
    })
  });

  const data = await res.json();
  return { data, status: res.status };
}

async function lookupLeads() {
  const inputValue = document.getElementById('customer-id-input').value.trim();
  if (!inputValue) {
    document.getElementById('lead-results-wrap').innerHTML =
      `<div class="lookup-error"><span>⚠</span> Please enter a Customer ID, phone number, or email.</div>`;
    return;
  }

  const token = await getActiveToken();
  if (!token) {
    document.getElementById('lead-results-wrap').innerHTML =
      `<div class="lookup-error"><span>⚠</span> Access token not available. Please ask your admin to update the Zoho token in Supabase.</div>`;
    return;
  }

  const btn = document.getElementById('lookup-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;margin:0;border-width:2px"></div> Searching…`;
  document.getElementById('lead-results-wrap').innerHTML =
    `<div class="lookup-loading"><div class="spinner"></div>Searching for <strong>${inputValue}</strong>…</div>`;

  try {
    const { data, status } = await searchLead(inputValue, token);

    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Search Leads`;

    // ── Handle Zoho errors ──
    if (status === 401) {
      showErrorPopup('Token Expired', 'Your Zoho access token is expired or invalid.\n\nError: 401 Unauthorized\n\nAsk your admin to update the token in Supabase.');
      document.getElementById('lead-results-wrap').innerHTML = `<div class="lookup-error">⚠ Token expired — see error popup.</div>`;
      return;
    }

    if (data.status === 'error' || data.code || (data.errors && data.errors.length)) {
      const errDetail = JSON.stringify(data, null, 2);
      showErrorPopup('Zoho API Error', errDetail);
      document.getElementById('lead-results-wrap').innerHTML = `<div class="lookup-error">⚠ Zoho returned an error — see popup for details.</div>`;
      return;
    }

    if (!status.toString().startsWith('2')) {
      showErrorPopup(`HTTP ${status} Error`, JSON.stringify(data, null, 2));
      document.getElementById('lead-results-wrap').innerHTML = `<div class="lookup-error">⚠ API error ${status} — see popup for details.</div>`;
      return;
    }

    const leads = data.data || [];

    if (!leads.length) {
      document.getElementById('lead-results-wrap').innerHTML = `
        <div class="lookup-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <p>No active leads found for <strong>${inputValue}</strong></p>
          <p style="font-size:12px;margin-top:6px">Filters: Expired = false · Lead_Status ≠ Contacted · Not Disqualified</p>
        </div>`;
      return;
    }

    document.getElementById('lead-results-wrap').innerHTML = `
      <div class="lead-results">
        <div class="lead-results-header">
          <span class="results-title">Results for: <strong>${inputValue}</strong></span>
          <span class="results-count">${leads.length} lead${leads.length!==1?'s':''}</span>
        </div>
        <div class="lead-grid">${leads.map(renderLeadCard).join('')}</div>
      </div>`;

  } catch(err) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Search Leads`;
    showErrorPopup('Network Error', `${err.message}\n\nThis usually means:\n• CORS is blocking the request (open from Vercel, not local file)\n• No internet connection\n• Zoho API is unreachable`);
    document.getElementById('lead-results-wrap').innerHTML = `<div class="lookup-error">⚠ Network error — see popup for details.</div>`;
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', async () => {
  initTokenSetup();
  await loadFAQsFromSupabase();
});
