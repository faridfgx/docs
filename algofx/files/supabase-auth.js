// ===================================
// AlgoFX – Supabase Auth (Key-Only)
// ===================================

const SUPABASE_URL      = 'https://elyndlcrgzgqlyfhsxbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseW5kbGNyZ3pncWx5ZmhzeGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTI2MjMsImV4cCI6MjA4NjMyODYyM30.Ka3PVYrRm_e9BJfDqtpoKFG_bvRUvp92QNrd8UKJYww';

// Use window.supabaseClient so it can be rebuilt after tab suspend
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

let currentUser = null;
let userProfile  = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initAuth() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await refreshProfile();
    renderUI();
  } else {
    renderUI();
  }

  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION') return;
    if (session?.user) {
      currentUser = session.user;
      await refreshProfile();
      renderUI();
    } else {
      currentUser = null;
      userProfile  = null;
      renderUI();
    }
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function refreshProfile() {
  if (!currentUser) return;
  try {
    const { data, error } = await window.supabaseClient.rpc('get_my_profile');
    if (error || !data?.success) return;
    userProfile = data;
  } catch (err) {
    console.error('[Auth] refreshProfile:', err);
  }
}

function hasValidLicense() {
  if (!userProfile?.is_pro || !userProfile?.expires_at) return false;
  return new Date(userProfile.expires_at) > new Date();
}

// ─── Anonymous session ────────────────────────────────────────────────────────

async function ensureAnonymousSession() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session?.user) { currentUser = session.user; return true; }
  const { data, error } = await window.supabaseClient.auth.signInAnonymously();
  if (error) { console.error('[Auth] anon sign-in failed:', error.message); return false; }
  if (data?.user) { currentUser = data.user; return true; }
  return false;
}

// ─── Extract algo name from code ─────────────────────────────────────────────

function extractAlgoName(code) {
  if (!code) return 'algorithme';
  for (const line of code.split('\n')) {
    const match = line.trim().match(/algorithme\s+([a-z0-9_]+)/i);
    if (match?.[1]) return match[1];
  }
  return 'algorithme';
}

// ─── Custom name prompt modal ─────────────────────────────────────────────────

function showNamePrompt(defaultName) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'name-prompt-overlay';
    overlay.innerHTML = `
      <div class="name-prompt-box">
        <h3>Sauvegarder dans le cloud</h3>
        <p>Nom de l'algorithme :</p>
        <input type="text" id="namePromptInput" value="${escapeHtml(defaultName)}" maxlength="80" spellcheck="false">
        <div class="name-prompt-actions">
          <button class="modal-btn btn-cancel-neutral" id="namePromptCancel">Annuler</button>
          <button class="modal-btn btn-run"            id="namePromptConfirm">Sauvegarder</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const input   = overlay.querySelector('#namePromptInput');
    const confirm = overlay.querySelector('#namePromptConfirm');
    const cancel  = overlay.querySelector('#namePromptCancel');

    setTimeout(() => { input.focus(); input.select(); }, 50);

    function finish(value) { overlay.remove(); resolve(value); }

    confirm.onclick = () => finish(input.value.trim() || defaultName);
    cancel.onclick  = () => finish(null);
    overlay.onclick = (e) => { if (e.target === overlay) finish(null); };
    input.onkeydown = (e) => {
      if (e.key === 'Enter')  finish(input.value.trim() || defaultName);
      if (e.key === 'Escape') finish(null);
    };
  });
}

// ─── Login modal ──────────────────────────────────────────────────────────────

function openLoginModal() {
  document.getElementById('loginModal')?.classList.add('active');
  clearMessages();
  const emailGroup = document.getElementById('loginEmailGroup');
  if (emailGroup) emailGroup.style.display = currentUser ? 'none' : 'block';
}

function closeLoginModal() {
  document.getElementById('loginModal')?.classList.remove('active');
  clearMessages();
}

async function handleLogin(event) {
  event.preventDefault();

  const key   = document.getElementById('accessKey')?.value?.trim();
  const email = document.getElementById('loginEmail')?.value?.trim() || null;
  const btn   = document.getElementById('loginSubmitBtn');

  if (!key) { showError("Veuillez saisir votre clé d'accès."); return; }

  btn.disabled    = true;
  btn.textContent = 'Connexion…';
  clearMessages();

  try {
    const sessionOk = await ensureAnonymousSession();
    if (!sessionOk) {
      showError("Impossible de créer une session. Activez les connexions anonymes dans Supabase.");
      return;
    }

    const { data, error } = await window.supabaseClient.rpc('login_with_key', { p_key: key, p_email: email });
    if (error) { showError('Erreur serveur : ' + error.message); return; }

    if (!data?.success) {
      const msgs = {
        invalid_key:       'Clé invalide ou expirée.',
        not_authenticated: 'Erreur de session — rechargez la page.'
      };
      showError(msgs[data?.error] ?? `Erreur : ${data?.error}`);
      return;
    }

    await refreshProfile();

    const expiry     = new Date(data.expires_at);
    const isLifetime = expiry.getFullYear() >= 2099;
    const label      = isLifetime
      ? 'Accès à vie 🎉'
      : `jusqu'au ${expiry.toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })}`;
    const action = data.action === 'restored'    ? 'Connexion restaurée'
                 : data.action === 'transferred' ? 'Session restaurée'
                 : 'Clé activée';

    showSuccess(`✓ ${action} ! ${label}`);
    setTimeout(() => { closeLoginModal(); renderUI(); }, 2000);

  } catch (err) {
    showError('Erreur inattendue : ' + err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Se connecter';
  }
}

// ─── Request key modal ────────────────────────────────────────────────────────

function showRequestKeyForm() {
  closeLoginModal();
  document.getElementById('requestKeyModal')?.classList.add('active');
}

function closeRequestKeyModal() {
  const modal = document.getElementById('requestKeyModal');
  modal?.classList.remove('active');
  document.getElementById('requestKeyForm')?.reset();
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  const errEl = document.getElementById('requestErrorMessage');
  const okEl  = document.getElementById('requestSuccessMessage');
  if (errEl) errEl.textContent = '';
  if (okEl)  okEl.textContent  = '';
}

function showLoginForm() {
  closeRequestKeyModal();
  openLoginModal();
}

async function handleRequestKey(event) {
  event.preventDefault();

  const email   = document.getElementById('requestEmail')?.value?.trim();
  const keyType = document.querySelector('input[name="keyType"]:checked')?.value;
  const btn     = document.getElementById('requestBtn');
  const errEl   = document.getElementById('requestErrorMessage');
  const okEl    = document.getElementById('requestSuccessMessage');

  if (errEl) errEl.textContent = '';
  if (okEl)  okEl.textContent  = '';

  if (!email || !keyType) {
    if (errEl) errEl.textContent = 'Veuillez choisir une formule et entrer votre email.';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Envoi…';

  try {
    const { error } = await window.supabaseClient
      .from('key_requests').insert({ email, key_type: keyType });

    setTimeout(() => closeRequestKeyModal(), 1800);

    if (error) {
      if (error.code === '23505' || error.status === 409) {
        showToast('📬 Vous avez déjà une demande en attente. Vérifiez votre email sous 24h.', 'info');
      } else {
        showToast('Erreur : ' + error.message, 'error');
      }
      return;
    }

    showToast(`✓ Demande envoyée ! Vous recevrez votre clé à ${email} sous 24h.`, 'success');

  } catch (err) {
    showToast('Erreur inattendue : ' + err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Envoyer la demande';
  }
}

function highlightPlan() {
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  document.querySelector('input[name="keyType"]:checked')?.closest('.plan-card')?.classList.add('selected');
}

// ─── Toast notification ───────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  document.querySelector('.algofx-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = `algofx-toast algofx-toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('algofx-toast-visible'));

  setTimeout(() => {
    toast.classList.remove('algofx-toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── Cloud Save ───────────────────────────────────────────────────────────────

async function cloudSave() {
  if (!currentUser) { openLoginModal(); return; }
  if (!hasValidLicense()) { alert('Votre licence PRO est expirée.'); return; }

  const code = document.getElementById('codeEditor')?.value?.trim();
  if (!code) { alert('Éditeur vide.'); return; }

  await refreshProfile();
  if (userProfile.slots_used >= userProfile.slots_limit) {
    alert(`Quota atteint (${userProfile.slots_limit} algorithmes max).`);
    return;
  }

  const suggested = extractAlgoName(code);
  const name      = await showNamePrompt(suggested);
  if (!name) return;

  const { error } = await window.supabaseClient
    .from('algorithms')
    .insert({ user_id: currentUser.id, name, code });

  if (error) { showToast('Erreur : ' + error.message, 'error'); return; }

  await refreshProfile();
  updateSlotCounter();
  showToast(`✓ "${name}" sauvegardé dans le cloud.`, 'success');
}

// ─── Saved Algorithms Modal ───────────────────────────────────────────────────

async function openSavedAlgorithmsModal() {
  if (!currentUser) { openLoginModal(); return; }
  document.getElementById('savedAlgorithmsModal')?.classList.add('active');
  await loadSavedAlgorithmsList();
}

async function loadSavedAlgorithmsList() {
  const list = document.getElementById('savedAlgorithmsList');
  if (!list) return;

  list.innerHTML = '<div class="empty-state"><p>Chargement…</p></div>';

  const { data, error } = await window.supabaseClient
    .from('algorithms')
    .select('id, name, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    list.innerHTML = `<div class="empty-state"><p>Erreur : ${error.message}</p></div>`;
    return;
  }

  if (!data?.length) {
    list.innerHTML = '<div class="empty-state"><p>Aucun algorithme sauvegardé</p></div>';
    return;
  }

  list.innerHTML = '';
  data.forEach(algo => {
    const date = new Date(algo.updated_at || algo.created_at).toLocaleDateString('fr-FR');
    const div  = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `
      <div class="saved-item-info">
        <strong class="saved-item-name">${escapeHtml(algo.name)}</strong>
        <span class="saved-item-date">${date}</span>
      </div>
      <div class="saved-item-actions">
        <button class="saved-btn saved-btn-open"   onclick="loadAlgorithm(${algo.id})">📂 Ouvrir</button>
        <button class="saved-btn saved-btn-delete" onclick="deleteAlgorithm(${algo.id}, '${escapeHtml(algo.name)}')">🗑️</button>
      </div>`;
    list.appendChild(div);
  });

  await refreshProfile();
  updateSlotCounter();
}

async function loadAlgorithm(id) {
  const { data, error } = await window.supabaseClient
    .from('algorithms').select('name, code').eq('id', id).single();
  if (error || !data) { showToast('Erreur lors du chargement.', 'error'); return; }
  const editor = document.getElementById('codeEditor');
  if (editor) { editor.value = data.code; editor.dispatchEvent(new Event('input')); }
  closeSavedAlgorithmsModal();
  showToast(`✓ "${data.name}" chargé.`, 'success');
}

async function deleteAlgorithm(id, name) {
  if (!confirm(`Supprimer "${name}" ?`)) return;
  const { error } = await window.supabaseClient.from('algorithms').delete().eq('id', id);
  if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
  await loadSavedAlgorithmsList();
}

function closeSavedAlgorithmsModal() {
  document.getElementById('savedAlgorithmsModal')?.classList.remove('active');
}

// ─── Slot counter ─────────────────────────────────────────────────────────────

function updateSlotCounter() {
  const el = document.getElementById('slotCounter');
  if (el && userProfile) el.textContent = `${userProfile.slots_used}/${userProfile.slots_limit} slots utilisés`;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout() {
  await window.supabaseClient.auth.signOut();
  currentUser = null;
  userProfile  = null;
  renderUI();
}

// ─── UI ───────────────────────────────────────────────────────────────────────

function renderUI() {
  const isPro = hasValidLicense();
  const show  = (id, v) => { const el = document.getElementById(id); if (el) el.style.display = v ? 'inline-block' : 'none'; };

  show('cloudSaveBtn', isPro);
  show('cloudLoadBtn', isPro);
  show('logoutBtn',    !!currentUser);
  show('loginMenuBtn', !isPro);

  const badge = document.getElementById('proBadge');
  if (badge) {
    badge.style.display = isPro ? 'inline-flex' : 'none';
    if (isPro && userProfile?.expires_at) {
      const expiry = new Date(userProfile.expires_at);
      badge.title  = expiry.getFullYear() >= 2099
        ? 'PRO – Accès à vie'
        : `PRO jusqu'au ${expiry.toLocaleDateString('fr-FR')}`;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showError(msg) {
  const el = document.getElementById('errorMessage');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  const ok = document.getElementById('successMessage');
  if (ok) ok.style.display = 'none';
}

function showSuccess(msg) {
  const el = document.getElementById('successMessage');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  const err = document.getElementById('errorMessage');
  if (err) err.style.display = 'none';
}

function clearMessages() {
  ['errorMessage', 'successMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}

function escapeHtml(str) {
  // simple, safe, drop-in replacement
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
// ─── Silence stray lock errors from suspended old client ──────────────────────
window.addEventListener('unhandledrejection', (e) => {
  if (e?.reason?.message?.includes('LockManager')) e.preventDefault();
});

// ─── Tab recovery ─────────────────────────────────────────────────────────────

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;

  try {
    const raw = localStorage.getItem('sb-elyndlcrgzgqlyfhsxbv-auth-token');
    if (!raw) return;

    const stored = JSON.parse(raw);
    const user   = stored?.user;
    const expiry = stored?.expires_at;

    if (!user || (expiry && expiry * 1000 < Date.now())) {
      currentUser = null;
      userProfile  = null;
      renderUI();
      return;
    }

    // ── Build a lock-free client — never touches LockManager ─────────────────
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession:     false, // ← no lock needed
        autoRefreshToken:   false, // ← no lock needed
        detectSessionInUrl: false
      }
    });

    // ── Inject tokens manually so API calls (rpc, from) work ─────────────────
    await window.supabaseClient.auth.setSession({
      access_token:  stored.access_token,
      refresh_token: stored.refresh_token
    });

    // ── Restore UI instantly ──────────────────────────────────────────────────
    currentUser = user;
    renderUI();

    // ── Background profile refresh ────────────────────────────────────────────
    refreshProfile().then(() => renderUI()).catch(() => {});

  } catch (err) {
    console.warn('[Auth] Tab recovery error:', err.message);
  }
});