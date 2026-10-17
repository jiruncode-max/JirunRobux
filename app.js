/* =========================================================================
   app.js — Core Engine, Security Lock & Dynamic UI Injection
   ========================================================================= */

let currentMember = null;
try {
    const savedSession = sessionStorage.getItem('rbx_member_auth');
    if (savedSession) currentMember = JSON.parse(savedSession);
} catch(e) {}

let myBalance = currentMember ? currentMember.balance : 0;
let accountName = currentMember ? currentMember.name : "Member";
let targetUser = "";
let searchTimeout;
let hsToken = 0;
let ppCurrentTarget = null;

// TAMPILKAN KOTAK LOGIN JIKA BELUM TERAUTENTIKASI
if (!currentMember) {
    showLoginLockScreen();
} else {
    initRobloxApp();
}

function showLoginLockScreen() {
    const lockMarkup = `
    <div id="auth-lock-overlay" class="auth-lock-overlay">
        <div class="auth-card">
            <div class="auth-badge-icon">🔒</div>
            <h2 class="auth-title">Akses Khusus Member</h2>
            <p class="auth-desc">Silakan masukkan username dan password member untuk membuka akses.</p>
            <div id="auth-error-msg" class="auth-error-msg"></div>

            <div class="auth-input-group">
                <label>USERNAME</label>
                <input type="text" id="login-user" class="input-box" placeholder="Contoh: asep" autocomplete="off">
            </div>

            <div class="auth-input-group">
                <label>PASSWORD</label>
                <input type="password" id="login-pass" class="input-box" placeholder="••••••••">
            </div>

            <button class="primary-btn" id="login-submit-btn" onclick="submitMemberLogin()">Buka Akses</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', lockMarkup);

    document.getElementById('login-pass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitMemberLogin();
    });
}

async function submitMemberLogin() {
    const uInput = document.getElementById('login-user').value.trim();
    const pInput = document.getElementById('login-pass').value.trim();
    const errEl = document.getElementById('auth-error-msg');
    const btn = document.getElementById('login-submit-btn');

    if (!uInput || !pInput) {
        errEl.innerText = 'Username dan Password wajib diisi!';
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';
    btn.innerText = 'Memeriksa...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uInput, password: pInput })
        });
        const data = await res.json();

        if (data && data.ok) {
            sessionStorage.setItem('rbx_member_auth', JSON.stringify(data.user));
            currentMember = data.user;
            accountName = data.user.name;
            myBalance = data.user.balance;

            document.getElementById('auth-lock-overlay').remove();
            initRobloxApp();
        } else {
            errEl.innerText = data.message || 'Username atau Password salah!';
            errEl.style.display = 'block';
            btn.innerText = 'Buka Akses';
            btn.disabled = false;
        }
    } catch(e) {
        errEl.innerText = 'Gagal menghubungi server verifikasi!';
        errEl.style.display = 'block';
        btn.innerText = 'Buka Akses';
        btn.disabled = false;
    }
}

function initRobloxApp() {
    const uiMarkup = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <symbol id="icon-robux" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="
                M12 1 L21.53 6.5 L21.53 17.5 L12 23 L2.47 17.5 L2.47 6.5 Z
                M12 3.9 L19.01 7.95 L19.01 16.05 L12 20.1 L4.99 16.05 L4.99 7.95 Z
                M12 5.3 L17.8 8.65 L17.8 15.35 L12 18.7 L6.2 15.35 L6.2 8.65 Z
                M8.9 8.9 L15.1 8.9 L15.1 15.1 L8.9 15.1 Z"/>
        </symbol>
    </svg>

    <header class="rbx-header">
        <div class="rbx-header-left">
            <div class="rbx-hamburger-btn" title="Menu">
                <div class="rbx-hamburger-lines">
                    <span></span><span></span><span></span>
                </div>
                <div class="rbx-hamburger-dot"></div>
            </div>
            <a href="#" class="rbx-logo-link" aria-label="Roblox">
                <span class="rbx-logo-text">R</span><span class="rbx-logo-o"></span><span class="rbx-logo-text">BLOX</span>
            </a>
        </div>
        <div class="rbx-header-center">
            <div class="rbx-search-box">
                <svg class="rbx-icon-search" viewBox="0 0 24 24">
                    <circle cx="10.5" cy="10.5" r="7"/>
                    <line x1="16" y1="16" x2="21.5" y2="21.5"/>
                </svg>
                <input type="text" class="rbx-search-input" id="header-search-input" placeholder="Cari" autocomplete="off">
            </div>
            <div id="header-search-dropdown">
                <div id="hs-status"></div>
                <div id="hs-items"></div>
            </div>
        </div>
        <div class="rbx-header-right">
            <div class="rbx-user-chip-disabled" title="Profil">
                <div class="rbx-avatar-mini">
                    <img src="https://e.top4top.io/p_3929zl5vw0.png" alt="Avatar">
                </div>
                <span id="header-username">${accountName}</span>
            </div>
            <div class="rbx-robux-disabled" title="Robux">
                <svg class="rbx-robux-svg"><use href="#icon-robux"/></svg>
            </div>
            <div class="rbx-bell-clickable" onclick="openSettings()" title="Pengaturan">
                <svg class="rbx-bell-svg" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
            </div>
        </div>
    </header>

    <div id="target-photo-popup">
        <div class="photo-popup-card">
            <button class="photo-popup-close" onclick="closePhotoPopup()" aria-label="Tutup">
                <svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
            <div class="pp-hero">
                <img id="pp-hero-avatar" alt="" style="display:none;">
                <div class="pp-hero-shadow"></div>
                <div class="pp-hero-fallback" id="pp-hero-fallback">?</div>
            </div>
            <div class="pp-body">
                <div class="pp-idrow">
                    <div class="pp-avatar-circle">
                        <span id="pp-fallback">?</span>
                        <img id="pp-avatar" src="" alt="">
                        <span class="pp-online-dot" title="Online"></span>
                    </div>
                    <div class="pp-names">
                        <div class="pp-display-name" id="pp-name">Name</div>
                        <div class="pp-username" id="pp-username">@name</div>
                    </div>
                </div>
                <div class="pp-stats">
                    <div class="pp-stat-chip"><b id="pp-friends">-</b> Teman</div>
                    <div class="pp-stat-chip"><b id="pp-followers">-</b> Pengikut</div>
                    <div class="pp-stat-chip"><b id="pp-following">-</b> Mengikuti</div>
                </div>
                <div class="pp-actions">
                    <button class="pp-btn" onclick="ppChatAction()">Chat</button>
                    <button class="pp-btn" id="pp-addfriend" onclick="ppAddFriend()">Tambahkan teman...</button>
                    <button class="pp-btn-round" id="pp-more-btn" onclick="toggleThreeDotsMenu(event)">•••</button>
                    <div id="pp-dots-menu" class="pp-menu-popover">
                        <div class="pp-menu-item active-action" onclick="openSendRobuxFromMenu()">Kirim Robux</div>
                        <div class="pp-menu-item" onclick="ppToast('Fitur segera hadir')">Sesuaikan nama</div>
                        <div class="pp-menu-item" onclick="ppToast('Berhasil mengikuti!')">Ikuti</div>
                        <div class="pp-menu-item" onclick="ppToast('Informasi akun resmi Roblox')">Tentang profil ini</div>
                        <div class="pp-menu-item" onclick="ppToast('Teman dihapus')">Hapus Teman</div>
                        <div class="pp-menu-item" onclick="ppToast('Akun diblokir')">Blokir</div>
                        <div class="pp-menu-item" onclick="ppToast('Laporan dikirim ke Roblox')">Laporkan</div>
                    </div>
                </div>
                <div class="pp-wearing">
                    <div class="pp-wearing-title">Saat ini Memakai</div>
                    <div class="pp-wearing-row" id="pp-wearing-row"></div>
                    <button class="pp-view-full" onclick="ppToast('Membuka profil lengkap...')">Lihat profil lengkap</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal-side-wrapper" id="modal-side">
        <div class="modal-card-rbx">
            <div class="modal-header">
                <div class="modal-title"><svg class="hex-sm"><use href="#icon-robux"/></svg> Kirim Robux</div>
                <div class="modal-balance"><svg class="hex-xs"><use href="#icon-robux"/></svg> <span id="modal-balance">0</span></div>
                <button class="close-btn" onclick="closeSendRobuxModal()">&times;</button>
            </div>
            <div id="step-2">
                <div class="user-profile">
                    <div class="avatar-container"><img id="real-avatar" src="" alt="Avatar"></div>
                    <div class="display-name" id="display-name-text">Name</div>
                    <div class="username-tag" id="username-tag-text">@name</div>
                </div>
                <div class="amount-wrapper">
                    <svg class="hex-lg"><use href="#icon-robux"/></svg>
                    <input type="text" id="amount-input" class="amount-input" value="" placeholder="0" inputmode="numeric">
                </div>
                <div class="preset-grid">
                    <button class="preset-btn" onclick="setAmount(25)">25</button>
                    <button class="preset-btn" onclick="setAmount(50)">50</button>
                    <button class="preset-btn" onclick="setAmount(100)">100</button>
                    <button class="preset-btn" onclick="setAmount(200)">200</button>
                </div>
                <button class="primary-btn" id="send-btn" disabled onclick="sendRobux()">Kirim Robux</button>
            </div>
            <div id="step-3">
                <div class="success-check">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#393b3d" stroke-width="1.8"/>
                        <path d="M7.2 12.4l3.1 3.1 6.5-7" stroke="#393b3d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <p class="success-text" id="success-text">Kamu mengirim Robux</p>
                <button class="oke-btn" onclick="closeSendRobuxModal()">OKE</button>
            </div>
        </div>
    </div>

    <div class="settings-overlay" id="settings-modal">
        <div class="settings-modal-card">
            <div class="modal-header">
                <div class="modal-title"><svg class="hex-sm"><use href="#icon-robux"/></svg> Pengaturan</div>
                <button class="close-btn" onclick="closeSettings()">&times;</button>
            </div>
            <div class="settings-row">
                <div class="settings-row-icon">👤</div>
                <div class="settings-row-body">
                    <label class="settings-label">NAMA AKUN</label>
                    <input type="text" id="settings-name" class="input-box" placeholder="Nama akun" maxlength="20">
                </div>
            </div>
            <div class="settings-row">
                <div class="settings-row-icon">💎</div>
                <div class="settings-row-body">
                    <label class="settings-label">SALDO ROBUX</label>
                    <input type="text" id="settings-balance" class="input-box" placeholder="0">
                </div>
            </div>
            <button class="primary-btn" onclick="saveSettings()">Simpan Perubahan</button>
            <button class="primary-btn" style="background:#d92d20;margin-top:8px;" onclick="logoutMember()">Keluar Akun</button>
        </div>
    </div>

    <div id="pp-toast"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', uiMarkup);
    bindAppEvents();
    updateBalances();
}

function logoutMember() {
    sessionStorage.removeItem('rbx_member_auth');
    location.reload();
}

function bindAppEvents() {
    const amountInput = document.getElementById('amount-input');
    amountInput.addEventListener('input', function() {
        const digits = this.value.replace(/[^0-9]/g, '');
        this.value = digits === '' ? '' : parseInt(digits, 10).toLocaleString('en-US');
        this.classList.toggle('filled', digits !== '');
        validateAmount();
    });

    const headerSearchInput = document.getElementById('header-search-input');
    headerSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(executeHeaderSearch, 200);
    });
    headerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            executeHeaderSearch();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.rbx-header-center')) hsHide();
        if (!e.target.closest('#pp-more-btn') && !e.target.closest('#pp-dots-menu')) {
            const m = document.getElementById('pp-dots-menu');
            if (m) m.classList.remove('show');
        }
    });
}

function formatNum(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function updateBalances() { 
    const el = document.getElementById('modal-balance');
    if (el) el.innerText = formatNum(myBalance); 
}

function openSettings() {
    document.getElementById('settings-name').value = accountName;
    document.getElementById('settings-balance').value = formatNum(myBalance);
    document.getElementById('settings-modal').classList.add('show');
}
function closeSettings() { document.getElementById('settings-modal').classList.remove('show'); }
function saveSettings() {
    const newName = document.getElementById('settings-name').value.trim();
    if (newName) {
        accountName = newName;
        document.getElementById('header-username').innerText = accountName;
    }
    const newBalance = parseInt(document.getElementById('settings-balance').value.replace(/,/g, ''), 10);
    if (!isNaN(newBalance) && newBalance >= 0) {
        myBalance = newBalance;
        updateBalances();
    }
    closeSettings();
    ppToast('Perubahan disimpan!');
}

function validateAmount() {
    const amt = parseInt(document.getElementById('amount-input').value.replace(/[^0-9]/g, ''), 10);
    document.getElementById('send-btn').disabled = !(amt > 0 && amt <= myBalance);
}
function setAmount(val) { 
    const amountInput = document.getElementById('amount-input');
    amountInput.value = formatNum(val); 
    amountInput.classList.add('filled');
    validateAmount();
}
function getRawAmount() { return parseInt(document.getElementById('amount-input').value.replace(/[^0-9]/g, ''), 10); }

// API KONEKSI ROBLOX
const API = '/api/user';
async function apiGet(params) {
    try {
        const res = await fetch(API + '?' + params);
        if (!res.ok) return null;
        const d = await res.json();
        return (d && d.ok !== false) ? d : null;
    } catch (e) { return null; }
}

async function exactMatchUser(cleanKw) {
    const d = await apiGet('username=' + encodeURIComponent(cleanKw));
    return (d && d.found && d.user) ? d.user : null;
}
async function searchUsers(cleanKw) {
    const d = await apiGet('search=' + encodeURIComponent(cleanKw));
    return (d && d.results && d.results.length > 0) ? d.results : [];
}
async function getUserById(id) {
    const d = await apiGet('id=' + id);
    return (d && d.found && d.user) ? d.user : null;
}
async function fetchAvatarMap(userIds) {
    const map = {};
    if (!userIds || !userIds.length) return map;
    const d = await apiGet('avatar=' + userIds.join(','));
    if (d && d.images) Object.assign(map, d.images);
    return map;
}
async function fetchAvatarUrl(id) {
    const map = await fetchAvatarMap([id]);
    return map[id] || null;
}
async function fetchFullBodyAvatar(id){
    if(!id) return null;
    const d = await apiGet('body=' + id);
    return (d && d.imageUrl) ? d.imageUrl : await fetchAvatarUrl(id);
}
async function fetchSocialCounts(id){
    const out = { friends:'-', followers:'-', following:'-' };
    if(!id) return out;
    const d = await apiGet('stats=' + id);
    return (d && d.stats) ? d.stats : out;
}
async function fetchCurrentlyWearing(id){
    if(!id) return [];
    const d = await apiGet('wearing=' + id);
    return (d && d.items) ? d.items : [];
}

function parsePastedInput(raw) {
    let text = (raw || '').trim();
    const urlMatch = text.match(/(?:roblox\.com\/users\/|roblox\.com\/id\/)(\d+)/i);
    if (urlMatch) return { id: parseInt(urlMatch[1], 10), keyword: urlMatch[1] };
    if (/^\d{4,}$/.test(text)) return { id: parseInt(text, 10), keyword: text };
    return { keyword: text.replace(/^@+/, '').trim() };
}

function hsHide() {
    const d = document.getElementById('header-search-dropdown');
    if (d) {
        d.classList.remove('show');
        document.getElementById('hs-items').innerHTML = '';
    }
}

async function executeHeaderSearch() {
    const headerSearchInput = document.getElementById('header-search-input');
    const headerDropdown = document.getElementById('header-search-dropdown');
    const hsStatus = document.getElementById('hs-status');
    const hsItems = document.getElementById('hs-items');

    const raw = headerSearchInput.value.trim().replace(/^@+/, '');
    if (!raw) { hsHide(); return; }

    const parsed = parsePastedInput(raw);
    const kw = parsed.keyword;
    const myToken = ++hsToken;

    headerDropdown.classList.add('show');
    hsItems.innerHTML = '';
    hsStatus.innerText = '';

    if (!kw && !parsed.id) { hsHide(); return; }

    if (parsed.id) {
        const user = await getUserById(parsed.id);
        if (myToken !== hsToken) return;
        if (user) { renderHsResultsFast([user], true); return; }
    }

    const [exact, results] = await Promise.all([exactMatchUser(kw), searchUsers(kw)]);
    if (myToken !== hsToken) return;

    let merged = [];
    if (exact && exact.id) merged.push(exact);
    (results || []).forEach(u => {
        if (u.id && !merged.some(m => (m.name || '').toLowerCase() === (u.name || '').toLowerCase())) {
            merged.push(u);
        }
    });

    if (merged.length > 0) {
        renderHsResultsFast(merged, !!exact);
    } else {
        hsStatus.innerText = '';
    }
}

function renderHsResultsFast(users, isExact) {
    const hsStatus = document.getElementById('hs-status');
    const hsItems = document.getElementById('hs-items');
    hsStatus.innerText = isExact ? '' : users.length + ' hasil — klik untuk pilih';
    hsItems.innerHTML = users.map(u => {
        const nm = (u.name || '').replace(/'/g, "\\'");
        const dn = (u.displayName || u.name || '').replace(/'/g, "\\'");
        return `<div class="hs-item" id="hs-u-${u.id || 'x'}" onclick="hsPick(${u.id || 'null'}, '${nm}', '${dn}', '')">
            <img src="" alt="" style="visibility:hidden">
            <div>
                <div class="hs-name">${dn.replace(/</g, '&lt;')}</div>
                <div class="hs-user">@${nm.replace(/</g, '&lt;')}</div>
            </div>
        </div>`;
    }).join('');

    fetchAvatarMap(users.map(u => u.id).filter(Boolean)).then(map => {
        users.forEach(u => {
            if (!u.id || !map[u.id]) return;
            const el = document.getElementById('hs-u-' + u.id);
            if (el) {
                const img = el.querySelector('img');
                if (img) { img.src = map[u.id]; img.style.visibility = 'visible'; }
                el.setAttribute('onclick', `hsPick(${u.id}, '${(u.name||'').replace(/'/g, "\\'")}', '${(u.displayName || u.name || '').replace(/'/g, "\\'")}', '${map[u.id]}')`);
            }
        });
    });
}

function hsPick(id, name, displayName, ava) {
    hsHide();
    document.getElementById('header-search-input').value = '';
    openTargetProfile({ id: id, name: name, displayName: displayName || name }, ava || null);
}

function ppEl(id){ return document.getElementById(id); }

function toggleThreeDotsMenu(e) {
    e.stopPropagation();
    document.getElementById('pp-dots-menu').classList.toggle('show');
}

async function loadCurrentlyWearing(user){
    const row = ppEl('pp-wearing-row');
    row.innerHTML = '<div style="color:#8a939c;font-size:13px;padding:10px 0;">Memuat item & harga asli...</div>';

    const items = await fetchCurrentlyWearing(user.id);
    if (ppCurrentTarget !== user) return;

    if (items && items.length > 0) {
        row.innerHTML = items.map(item => `
            <div class="pp-wear-card">
                <div class="pp-wear-thumb">
                    <img src="${item.image}" alt="${(item.name || '').replace(/"/g, '&quot;')}" onerror="this.onerror=null;this.src='https://thumbnails.roblox.com/v1/assets?assetIds=${item.id}&size=150x150&format=Png';">
                </div>
                <div class="pp-wear-name" title="${item.name}">${item.name}</div>
                <div class="pp-wear-price">
                    <svg viewBox="0 0 24 24"><use href="#icon-robux"/></svg>
                    <span>${item.price}</span>
                </div>
            </div>
        `).join('');
    } else {
        row.innerHTML = '<div style="color:#8a939c;font-size:13px;padding:10px 0;">Tidak ada item yang dapat dimuat.</div>';
    }
}

async function openTargetProfile(user, avatarUrl){
    if(!user) return;
    ppCurrentTarget = user;

    ppEl('pp-name').innerText = user.displayName || user.name;
    ppEl('pp-username').innerText = '@' + user.name;
    ppEl('pp-friends').innerText = '...';
    ppEl('pp-followers').innerText = '...';
    ppEl('pp-following').innerText = '...';

    const headImg = ppEl('pp-avatar'), headFb = ppEl('pp-fallback');
    headImg.style.display = 'none'; headFb.style.display = 'flex';
    headFb.innerText = (user.displayName || user.name || '?').charAt(0).toUpperCase();

    const heroImg = ppEl('pp-hero-avatar'), heroFb = ppEl('pp-hero-fallback');
    heroImg.style.display = 'none'; heroFb.style.display = 'block';
    heroFb.innerText = (user.displayName || user.name || '?').charAt(0).toUpperCase();

    ppEl('target-photo-popup').classList.add('show');
    document.body.style.overflow = 'hidden';

    const head = avatarUrl || (user.id ? await fetchAvatarUrl(user.id) : null);
    if (head){
        headImg.src = head; headImg.style.display = 'block'; headFb.style.display = 'none';
    }

    if (user.id) {
        fetchFullBodyAvatar(user.id).then(body => {
            if (ppCurrentTarget === user && body) {
                heroImg.src = body; heroImg.style.display = 'block'; heroFb.style.display = 'none';
            }
        });
        loadCurrentlyWearing(user);
        fetchSocialCounts(user.id).then(c => {
            if (ppCurrentTarget === user){
                ppEl('pp-friends').innerText = c.friends;
                ppEl('pp-followers').innerText = c.followers;
                ppEl('pp-following').innerText = c.following;
            }
        });
    }
}

function closePhotoPopup(){
    ppEl('target-photo-popup').classList.remove('show');
    closeSendRobuxModal();
    document.body.style.overflow = '';
    ppCurrentTarget = null;
}

function openSendRobuxFromMenu() {
    document.getElementById('pp-dots-menu').classList.remove('show');
    if (!ppCurrentTarget) return;

    const t = ppCurrentTarget;
    targetUser = t.name;

    document.getElementById('display-name-text').innerText = t.displayName || t.name;
    document.getElementById('username-tag-text').innerText = '@' + t.name;

    const img = document.getElementById('real-avatar');
    img.src = "https://e.top4top.io/p_3929zl5vw0.png";

    if (t.id) {
        fetchAvatarUrl(t.id).then(url => { if (url) img.src = url; });
    }

    const amountInput = document.getElementById('amount-input');
    amountInput.value = '';
    amountInput.classList.remove('filled');
    document.getElementById('send-btn').disabled = true;

    document.getElementById('step-2').style.display = 'block';
    document.getElementById('step-3').style.display = 'none';

    const modalWrapper = document.getElementById('modal-side');
    modalWrapper.classList.remove('success-position-right');
    modalWrapper.classList.add('show');
}

function closeSendRobuxModal() {
    const modalWrapper = document.getElementById('modal-side');
    modalWrapper.classList.remove('show');
    modalWrapper.classList.remove('success-position-right');
    document.getElementById('step-2').style.display = 'block';
    document.getElementById('step-3').style.display = 'none';
}

function ppToast(msg){
    const t = ppEl('pp-toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}
function ppChatAction() { ppToast('Membuka obrolan...'); }
function ppAddFriend(){
    const btn = ppEl('pp-addfriend');
    btn.innerText = 'Permintaan Dikirim';
    btn.disabled = true;
    ppToast('Permintaan pertemanan terkirim!');
    setTimeout(() => { btn.innerText = 'Tambahkan teman...'; btn.disabled = false; }, 3000);
}

function sendRobux() {
    const amt = getRawAmount(); 
    if (isNaN(amt) || amt <= 0) return;
    if (amt > myBalance) { ppToast('Saldo Robux tidak cukup!'); return; }

    myBalance -= amt;
    updateBalances();
    
    ppEl('target-photo-popup').classList.remove('show');
    document.body.style.overflow = '';

    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-3').style.display = 'flex';
    document.getElementById('success-text').innerText = 'Kamu mengirim ' + formatNum(amt) + ' Robux';

    const modalWrapper = document.getElementById('modal-side');
    modalWrapper.classList.add('success-position-right');
}
