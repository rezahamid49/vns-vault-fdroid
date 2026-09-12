// ==========================================
// CAPACITOR NATIVE STORAGE BRIDGE (AUTO-SYNC)
// ==========================================
(function overrideLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    localStorage.setItem = function(key, value) {
        originalSetItem(key, value); 
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
            window.Capacitor.Plugins.Preferences.set({ key: key, value: String(value) }).catch(e => {}); 
        }
    };

    localStorage.removeItem = function(key) {
        originalRemoveItem(key);
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
            window.Capacitor.Plugins.Preferences.remove({ key: key }).catch(e => {});
        }
    };

    localStorage.clear = function() {
        originalClear();
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
            window.Capacitor.Plugins.Preferences.clear().catch(e => {});
        }
    };
})();
/*-------------------------STR showAlert 30.06.2026-------------------------*/
// ==========================================
// ?? ????? ????? ?????? ??????? VNS
// ==========================================
window.showVnsAlert = function(title, message, type = 'success') {
    const modal = document.getElementById('vns-custom-alert');
    const box = document.getElementById('vns-alert-box');
    
    // ????? ????? ?? ???? ??? ????
    const iconEl = document.getElementById('vns-alert-icon');
    if (type === 'success') iconEl.innerText = '?';
    else if (type === 'error') iconEl.innerText = '?';
    else if (type === 'warning') iconEl.innerText = '??';

    // ????? ??????
    document.getElementById('vns-alert-title').innerText = title;
    document.getElementById('vns-alert-message').innerText = message;

    // ????? ?????? ?? ???????
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');
    box.classList.remove('scale-95');
    box.classList.add('scale-100');
};

window.closeVnsAlert = function() {
    const modal = document.getElementById('vns-custom-alert');
    const box = document.getElementById('vns-alert-box');
    
    // ???? ???? ?????? ?? ???????
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
};
/*-------------------------END showAlert 30.06.2026-------------------------*/
// --- Core Application Architectural Runtime State Global Variables ---
let items = [];
let folders = ['Personal', 'Work', 'Finance'];
let activeId = null;
let currentCategory = 'home';
let currentFolder = null;
let selectedFolderForMenu = null;
let draggedItemId = null;
let lastBackupJSON = "";
let currentMnemonic = [];
let pendingImportData = null;
let tempMasterAccount = null; 
let globalSearchQuery = "";
let simulated2faSecret = "";
let currentSimulatedOtp = "";
let otpTimerVal = 30;
let otpTimerInterval = null;
let activeMasterKey = null; 
let autoLockTimeout = null;
let autolockDuration = parseInt(localStorage.getItem('vns_autolock_duration') || '600000'); 
let currentCustomLogoB64 = "";
let isPasscodeLocked = false;
let passcodeLockRemaining = 0;
let passcodeLockInterval = null;
let clipboardClearTimeout = null;
let expectedClipboardValue = "";
var activeRecoveryType = null;
var verifiedPhraseForReset = "";

// Multi-select credentials + swipe delete
var selectedCredentialIds = new Set();
var vnsSwipeState = { id: null, startX: 0, startY: 0, dx: 0, active: false, locked: false };

// Ã°Å¸Å’Å¸ PREVENT NATIVE BROWSER SWIPE EXIT (Android WebView Edge Swipes) Ã°Å¸Å’Å¸
if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
}

function isMobileContext() {
    return (window.innerWidth < 1024) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function toggleProfileDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('profile-dropdown-menu');
    if (!menu) return;
    if (menu.classList.contains('hidden')) menu.classList.remove('hidden'); else menu.classList.add('hidden');
}

function closeProfileDropdown() {
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', (e) => {
    const container = document.getElementById('profile-dropdown-container');
    if (container && !container.contains(e.target)) closeProfileDropdown();
    const fDropdown = document.getElementById('folder-dropdown'); 
    if (fDropdown && fDropdown.style.display === 'block' && !e.target.closest('#i-folder') && !e.target.closest('#folder-dropdown')) fDropdown.style.display = 'none';
    const fMenu = document.getElementById('folder-menu'); 
    if (fMenu && fMenu.style.display === 'block' && !fMenu.contains(e.target) && !e.target.closest('button')) fMenu.style.display = 'none';
});

function toggleMainSectionMobile(showMain) {
    const listSec = document.getElementById('list-section'); const mainSec = document.getElementById('main-section');
    if (!listSec || !mainSec) return;
    if (window.innerWidth < 1024) { 
        if (showMain) { listSec.style.display = 'none'; mainSec.style.display = 'block'; mainSec.classList.remove('hidden'); } 
        else { listSec.style.display = 'flex'; mainSec.style.display = 'none'; }
    } else { listSec.style.display = ''; mainSec.style.display = ''; }
}

window.addEventListener('resize', () => {
    const listSec = document.getElementById('list-section'); const mainSec = document.getElementById('main-section');
    if (!listSec || !mainSec) return;
    if (window.innerWidth >= 1024) { listSec.style.display = ''; mainSec.style.display = ''; } 
    else {
        const formActive = !document.getElementById('form-container').classList.contains('hidden');
        const settingsActive = !document.getElementById('settings-container').classList.contains('hidden');
        if (formActive || settingsActive) { listSec.style.display = 'none'; mainSec.style.display = 'block'; } 
        else { listSec.style.display = 'flex'; mainSec.style.display = 'none'; }
    }
});

if (window.location.hostname === '127.0.0.1') window.location.hostname = 'localhost';

const BRAND_SVG_MAP = {
    'google': `<svg viewBox="0 0 24 24" class="w-6 h-6"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.52-1.15 2.81-2.43 3.68v3.05h3.91c2.28-2.1 3.61-5.19 3.61-8.58z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.91-3.05c-1.08.72-2.45 1.16-4.02 1.16-3.09 0-5.72-2.08-6.65-4.88H1.31v3.15C3.29 22.36 7.39 24 12 24z"/><path fill="#FBBC05" d="M5.35 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.53H1.31C.48 8.19 0 10.04 0 12s.48 3.81 1.31 5.47l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.29 1.64 1.31 4.75l4.04 3.15c.93-2.8 3.56-4.88 6.65-4.88z"/></svg>`,
    'facebook': `<svg viewBox="0 0 24 24" fill="#1877F2" class="w-6 h-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    'instagram': `<svg viewBox="0 0 24 24" class="w-6 h-6"><radialGradient id="ig-rad" cx="0.3" cy="1.1" r="1.4"><stop offset="0" stop-color="#FED576"/><stop offset="0.25" stop-color="#F47133"/><stop offset="0.6" stop-color="#BC3081"/><stop offset="1" stop-color="#4C63D2"/></radialGradient><rect width="24" height="24" rx="5" fill="url(#ig-rad)"/><path fill="white" d="M12 5.838c-3.403 0-6.162.759-6.162 6.162 0 3.403.759 6.162 6.162 6.162 3.403 0 6.162-.759 6.162-6.162 0-3.403-.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm5.75-10.42a.999.999 0 1 1-1.999 0 .999.999 0 0 1 1.999 0z"/></svg>`,
    'telegram': `<svg viewBox="0 0 24 24" fill="#26A5E4" class="w-6 h-6"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.885 8.883c-.142.63-.517.786-1.043.491l-2.872-2.116-1.385 1.333c-.153.153-.282.282-.577.282l.206-2.923 5.32-4.807c.232-.206-.051-.32-.361-.114L8.3 12.825l-2.836-.887c-.616-.193-.628-.616.129-.913l11.085-4.271c.513-.193.962.114.784.821z"/></svg>`,
    'twitter': `<svg viewBox="0 0 24 24" fill="#000000" class="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    'x': `<svg viewBox="0 0 24 24" fill="#000000" class="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    'youtube': `<svg viewBox="0 0 24 24" fill="#FF0000" class="w-6 h-6"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.872.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    'whatsapp': `<svg viewBox="0 0 24 24" fill="#25D366" class="w-6 h-6"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.117-2.879-6.981-1.859-1.862-4.337-2.887-6.977-2.889-5.442 0-9.87 4.42-9.874 9.865-.001 1.748.465 3.454 1.348 4.965L1.83 22.08l4.817-1.262z"/></svg>`,
    'netflix': `<svg viewBox="0 0 24 24" fill="#E50914" class="w-6 h-6"><path d="M5.384 0H9.15l3.465 9.384L16.082 0h3.766v24h-3.766V7.755L12.558 24H8.849L5.384 7.518V24H1.618V0h3.766z"/></svg>`,
    'binance': `<svg viewBox="0 0 24 24" fill="#F0B90B" class="w-6 h-6"><path d="M12.002 8.356l2.915 2.914 2.128-2.128-5.043-5.043-5.043 5.043 2.128 2.128zm5.83 2.914l2.914-2.915 2.129 2.129-5.043 5.043V12.63l2.128-2.128l-.001-.001zm-5.83 5.83l-2.915-2.914-2.128 2.128l5.043 5.043l5.043-5.043-2.128-2.128zm-5.83-2.915l-2.914 2.915-2.129-2.129l5.043-5.043v2.833l-2.128 2.128l.001.001zm5.83-2.128l2.128 2.128l-2.128 2.128l-2.128-2.128l2.128-2.128z"/></svg>`,
    'github': `<svg viewBox="0 0 24 24" fill="#181717" class="w-6 h-6"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
    'apple': `<svg viewBox="0 0 24 24" fill="#000000" class="w-6 h-6"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94 1.07.08 2.16-.52 2.82-1.33"/></svg>`,
    'microsoft': `<svg viewBox="0 0 24 24" class="w-6 h-6"><path fill="#F25022" d="M0 0h11.5v11.5H0z"/><path fill="#7FBA00" d="M12.5 0H24v11.5H12.5z"/><path fill="#00A4EF" d="M0 12.5h11.5V24H0z"/><path fill="#FFB900" d="M12.5 12.5H24V24H12.5z"/></svg>`,
    'spotify': `<svg viewBox="0 0 24 24" fill="#1ED760" class="w-6 h-6"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.557 17.31c-.19.31-.59.41-.9.22-2.5-1.53-5.65-1.87-9.36-1.02-.35.08-.7-.14-.78-.49-.08-.35.14-.7.49-.78 4.07-.93 7.55-.54 10.33 1.16.31.19.41.59.22.9zm1.48-3.26c-.24.39-.75.51-1.14.27-2.86-1.76-7.22-2.27-10.6-1.24-.44.13-.91-.12-1.04-.56-.13-.44.12-.91.56-1.04 3.86-1.17 8.67-.6 11.95 1.41.39.24.52.75.27 1.16zm.13-3.39C15.91 8.52 10.53 8.34 7.42 9.28c-.48.15-.99-.12-1.14-.6-.15-.48.12-.99.6-1.14 3.57-1.09 9.5-.88 14.24 1.93.43.26.57.82.31 1.25-.26.43-.82.57-1.25.31z"/></svg>`,
    'vns': `<svg viewBox="0 0 24 24" fill="#0D9488" class="w-6 h-6"><path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6zm-1 3v4h2V9h-2zm0 5v2h2v-2h-2z"/></svg>`
};

async function runStorageMigration() {
    try {
        const oldAccount = localStorage.getItem('vns_master_account'); const newUser = localStorage.getItem('vns_master_user');
        if (oldAccount && !newUser) {
            const parsed = JSON.parse(oldAccount);
            const migrated = { username: parsed.username, salt: parsed.salt, encryptedMnemonic: parsed.encryptedMnemonic, biometricCredentialId: parsed.biometricCredId || "", isLegacy: true, is2faEnabled: false, isPasscodeEnabled: false, twoFactorSecret: "", localPasscode: "", passcodeSalt: "" };
            localStorage.setItem('vns_master_user', JSON.stringify(migrated));
        }
        const oldDb = localStorage.getItem('vns_encrypted_db'); const newDb = localStorage.getItem('vns_vault_encrypted_db');
        if (oldDb && !newDb) localStorage.setItem('vns_vault_encrypted_db', oldDb);
    } catch(e) {}
}

// ==========================================
// SAFE BUFFER CONVERSION (LARGE PAYLOAD FIX)
// ==========================================
function bufToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 8192; 
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function base64ToBuf(b64) {
    const binary = atob(b64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function deriveKeyFromPassword(password, saltBuffer) {
    const enc = new TextEncoder(); const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"]);
    return await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBuffer, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function encryptData(plaintext, key) {
    const enc = new TextEncoder(); const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(plaintext));
    return { iv: bufToBase64(iv), ciphertext: bufToBase64(ciphertext) };
}
/*----------------------------------STR TRANS 01.07.2026 P1----------------------------------*/
async function decryptData(encryptedObj, key) {
    try {
        const iv = new Uint8Array(base64ToBuf(encryptedObj.iv)); 
        const ciphertextData = encryptedObj.ciphertext || encryptedObj.data;
        
        // ???????? ???? t() ???? ????? ?????
        if (!ciphertextData) throw new Error(t('err_missing_ciphertext'));
        
        const ciphertext = new Uint8Array(base64ToBuf(ciphertextData)); 
        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
        
        return new TextDecoder().decode(decrypted);
    } catch (e) { 
        return null; 
    }
}
/*------------------------------STR TRANS 01.07.2026 P1------------------------------*/
/* TOTP crypto moved to totp-engine.js (loaded before app.js) */

function getDeterministicColor(str) {
    const gradientsList = [
        { light: '#ffaa73', dark: '#0D9488' }, { light: '#4fa8ff', dark: '#1877F2' }, { light: '#a78bfa', dark: '#7c3aed' }, 
        { light: '#34d399', dark: '#059669' }, { light: '#f472b6', dark: '#db2777' }, { light: '#22d3ee', dark: '#0891b2' }, 
        { light: '#fbbf24', dark: '#d97706' }, { light: '#94a3b8', dark: '#475569' }
    ];
    if (!str) return gradientsList[0]; let sum = 0; for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i) * (i + 1);
    return gradientsList[sum % gradientsList.length];
}


function normalizeItemLogoKey(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findSharedLogoForName(name, excludeId) {
    const key = normalizeItemLogoKey(name);
    if (!key || typeof items === 'undefined' || !Array.isArray(items)) return '';
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || !it.customLogo) continue;
        if (excludeId && String(it.id) === String(excludeId)) continue;
        if (normalizeItemLogoKey(it.name) === key) return it.customLogo;
    }
    return '';
}

function propagateCustomLogoToMatchingItems(sourceItem) {
    if (!sourceItem || !sourceItem.customLogo) return 0;
    const key = normalizeItemLogoKey(sourceItem.name);
    if (!key || typeof items === 'undefined' || !Array.isArray(items)) return 0;
    let count = 0;
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        if (String(it.id) === String(sourceItem.id)) continue;
        if (normalizeItemLogoKey(it.name) === key) {
            it.customLogo = sourceItem.customLogo;
            count++;
        }
    }
    return count;
}

function getBrandLogoSvg(name) {
    if (!name) return null; const normalized = name.trim().toLowerCase();
    for (const [key, svg] of Object.entries(BRAND_SVG_MAP)) { if (normalized.includes(key)) return svg; }
    return null;
}

function triggerCustomLogoUpload() { document.getElementById('form-logo-input').click(); }
function vnsCompressImageToDataUrl(file, opts, done) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || 640;
    var maxBytes = opts.maxBytes || 180000;
    var quality = opts.quality || 0.82;
    if (!file) return done(null);
    if (file.type === 'image/svg+xml') {
        var rsvg = new FileReader();
        rsvg.onload = function () { done(rsvg.result); };
        rsvg.readAsDataURL(file);
        return;
    }
    var reader = new FileReader();
    reader.onload = function () {
        var img = new Image();
        img.onload = function () {
            var w = img.width, h = img.height;
            var scale = Math.min(1, maxEdge / Math.max(w, h || 1));
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            var q = quality;
            var dataUrl = canvas.toDataURL('image/jpeg', q);
            // shrink until under maxBytes (approx base64)
            var guard = 0;
            while (dataUrl.length * 0.75 > maxBytes && q > 0.45 && guard < 8) {
                q -= 0.08;
                dataUrl = canvas.toDataURL('image/jpeg', q);
                guard++;
            }
            if (dataUrl.length * 0.75 > maxBytes && maxEdge > 320) {
                // second pass smaller edge
                var s2 = 0.7;
                canvas.width = Math.max(1, Math.round(w * s2));
                canvas.height = Math.max(1, Math.round(h * s2));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            }
            done(dataUrl);
        };
        img.onerror = function () { done(null); };
        img.src = reader.result;
    };
    reader.onerror = function () { done(null); };
    reader.readAsDataURL(file);
}

function handleCustomLogoUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) { showAlert("Error: Selected file is not a valid image."); return; }
    vnsCompressImageToDataUrl(file, { maxEdge: 128, maxBytes: 80000, quality: 0.85 }, function (dataUrl) {
        if (!dataUrl) { showAlert("Error: Could not process image."); return; }
        currentCustomLogoB64 = dataUrl;
        updateFormLogoPreview(currentCustomLogoB64, document.getElementById('i-name').value);
    });
}
window.vnsCompressImageToDataUrl = vnsCompressImageToDataUrl;


function removeCustomLogo(event) {
    if (event) event.stopPropagation(); currentCustomLogoB64 = ""; document.getElementById('form-logo-input').value = "";
    updateFormLogoPreview("", document.getElementById('i-name').value);
}

function updateFormLogoPreview(b64Data, itemName = "") {
    const displayBox = document.getElementById('form-logo-preview'); const delBtn = document.getElementById('btn-delete-logo');
    if (b64Data) { displayBox.innerHTML = `<img src="${b64Data}" class="w-full h-full object-cover rounded-xl" />`; delBtn.classList.remove('hidden'); return; }
    delBtn.classList.add('hidden'); const staticSvg = getBrandLogoSvg(itemName);
    if (staticSvg) { displayBox.innerHTML = staticSvg; return; }
    if (itemName) {
        const char = itemName.trim().charAt(0).toUpperCase(); const colors = getDeterministicColor(itemName);
        displayBox.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-black text-lg" style="background:linear-gradient(135deg, ${colors.light}, ${colors.dark})">${char}</div>`; return;
    }
    displayBox.innerHTML = `<svg class="w-7 h-7 text-[#0D9488]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
}

function handleNameInput(val) {
    if (activeId || document.getElementById('btn-save').classList.contains('hidden')) { if (!document.getElementById('i-name').disabled) updateFormLogoPreview(currentCustomLogoB64, val); } 
    else updateFormLogoPreview(currentCustomLogoB64, val);
}

function validateEnglish(inp) { inp.value = inp.value.replace(/[^\x00-\x7F]/g, ''); }
function validateBackupWords(input) {
    validateEnglish(input); input.style.height = 'auto'; input.style.height = (input.scrollHeight) + 'px';
    const words = input.value.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length > 64) { input.value = words.slice(0, 64).join(' '); showAlert (t("word_limit")); }
}

function togglePasscodeVisibility(inputId, btn) {
    const input = document.getElementById(inputId); const svg = btn.querySelector('.toggle-eye-icon');
    if (input.type === 'password') { input.type = 'text'; svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />`; } 
    else { input.type = 'password'; svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`; }
}

function toggleBackupPass() {
    const input = document.getElementById('i-backup'); const eyeSvg = document.getElementById('backup-eye-icon');
    if (input.classList.contains('backup-masked')) { input.classList.remove('backup-masked'); eyeSvg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />`; } 
    else { input.classList.add('backup-masked'); eyeSvg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`; }
}

function togglePass() {
    const inp = document.getElementById('i-pass'); const eye = document.getElementById('form-eye-icon');
    if (inp.type === 'password') { inp.type = 'text'; eye.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />`; } 
    else { inp.type = 'password'; eye.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`; }
}

function toggleRegisterPass(inputId, btn) {
    const input = document.getElementById(inputId); const svg = btn.querySelector('.toggle-eye-icon');
    if (input.type === 'password') { input.type = 'text'; svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />`; } 
    else { input.type = 'password'; svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`; }
}

function checkRegPasswordStrength() {
    const pass = document.getElementById('reg-pass').value; const checklist = document.getElementById('reg-pass-checklist'); const wrapper = document.getElementById('reg-pass-strength-wrapper');
    const bar = document.getElementById('strength-indicator-bar'); const label = document.getElementById('strength-label');
    if (!pass) { checklist.classList.add('hidden'); wrapper.classList.add('hidden'); return; }
    checklist.classList.remove('hidden'); wrapper.classList.remove('hidden');
    const validLen = pass.length >= 8 && pass.length <= 16; const hasUpper = /[A-Z]/.test(pass); const hasLower = /[a-z]/.test(pass); const hasDigit = /[0-9]/.test(pass); const hasSpec = /[-_/*!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass); const validReps = !/(.)\1\1/.test(pass);
    updateCheckMetric('check-len', validLen); updateCheckMetric('check-upper', hasUpper); updateCheckMetric('check-lower', hasLower); updateCheckMetric('check-num', hasDigit); updateCheckMetric('check-spec', hasSpec); updateCheckMetric('check-repeat', validReps);
    let score = 0; if (validLen) score += 20; if (hasUpper) score += 20; if (hasLower) score += 20; if (hasDigit) score += 20; if (hasSpec) score += 10; if (validReps) score += 10;
    bar.style.width = score + '%';
    if (score <= 40) { bar.style.backgroundColor = '#ef4444'; label.innerText = t("pass_weak"); label.className = "text-[9px] font-bold text-red-500"; }
    else if (score <= 80) { bar.style.backgroundColor = '#f59e0b'; label.innerText = t("pass_fair"); label.className = "text-[9px] font-bold text-amber-500"; }
       
    else { bar.style.backgroundColor = '#10b981'; label.innerText = t("pass_strong"); label.className = "text-[9px] font-bold text-green-500"; }
        
}

function updateCheckMetric(id, ok) {
    const el = document.getElementById(id); const dot = el.querySelector('.indicator-dot');
    if (ok) { el.className = "text-green-600 flex items-center gap-1.5 font-bold transition-all"; dot.className = "indicator-dot w-1.5 h-1.5 rounded-full bg-green-500 transition-all"; } 
    else { el.className = "text-red-500 flex items-center gap-1.5 font-bold transition-all"; dot.className = "indicator-dot w-1.5 h-1.5 rounded-full bg-red-500 transition-all"; }
}
/*--------------------Str light colors--------------------*/
function checkRealTimePasswordStatus(val) {
    const strengthBox = document.getElementById('item-strength-indicator');
    const textLabel = document.getElementById('item-strength-text');
    const dotRed = document.getElementById('item-dot-red');
    const dotYellow = document.getElementById('item-dot-yellow');
    const dotGreen = document.getElementById('item-dot-green');
    const reuseWarning = document.getElementById('item-reuse-warning');

    if(strengthBox) {
        strengthBox.classList.remove('hidden');
        strengthBox.style.display = 'flex';
    }

    if(dotRed) dotRed.style.backgroundColor = '#e2e8f0'; 
    if(dotYellow) dotYellow.style.backgroundColor = '#e2e8f0';
    if(dotGreen) dotGreen.style.backgroundColor = '#e2e8f0';

    if (!val || val.length === 0) {
        if(textLabel) {
            textLabel.innerText = 'EMPTY';
            textLabel.style.color = '#94a3b8';
        }
        if(reuseWarning) {
            reuseWarning.classList.add('hidden');
            reuseWarning.style.display = 'none';
        }
        return;
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[-_/*!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~`]/.test(val)) score++;

    if (score <= 2) {
        if(dotRed) dotRed.style.backgroundColor = '#ef4444'; // ????
        if(textLabel) { textLabel.innerText = 'WEAK'; textLabel.style.color = '#ef4444'; }
    } else if (score <= 4) {
        if(dotRed) dotRed.style.backgroundColor = '#f59e0b'; // ???
        if(dotYellow) dotYellow.style.backgroundColor = '#f59e0b';
        if(textLabel) { textLabel.innerText = 'FAIR'; textLabel.style.color = '#f59e0b'; }
    } else {
        if(dotRed) dotRed.style.backgroundColor = '#10b981'; // ???
        if(dotYellow) dotYellow.style.backgroundColor = '#10b981';
        if(dotGreen) dotGreen.style.backgroundColor = '#10b981';
        if(textLabel) { textLabel.innerText = 'STRONG'; textLabel.style.color = '#10b981'; }
    }

    const isReused = items.some(item => 
        item.pass === val && 
        item.id !== activeId && 
        item.status !== 'deleted'
    );
    
    if(reuseWarning) {
        if (isReused) {
            reuseWarning.classList.remove('hidden');
            reuseWarning.style.display = 'flex';
        } else {
            reuseWarning.classList.add('hidden');
            reuseWarning.style.display = 'none';
        }
    }
}
/*--------------------End light colors--------------------*/

function handleLoginOnEnter(event) { if (event.key === 'Enter') { event.preventDefault(); handleLogin(); } }
function handleSaveOnEnter(event) { if (event.key === 'Enter') { event.preventDefault(); const saveBtn = document.getElementById('btn-save'); if (saveBtn && !saveBtn.classList.contains('hidden')) handleSave(); } }

function togglePasscodeSetupFields(checked) {
    const container = document.getElementById('passcode-setup-inputs');
    if (checked) container.classList.remove('hidden'); else { container.classList.add('hidden'); document.getElementById('sett-new-passcode').value = ''; document.getElementById('sett-confirm-passcode').value = ''; }
}

function generateMnemonic() {
    const bip39Pool = ["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act","action","actor","actress","actual","adapt","add","addict","address","adjust","admit","adult","advance","advice","advise","aerobic","affair","afford","afraid","again","age","agent","agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien","all","alley","allow","almost","alone","along","already","also","alter","always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety","any","apart","apology","appear","apple","approve","april","arch","arctic","area","arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive","arrow","art","artifact","artist","artwork","aside","ask","aspect","assault","asset","assist","assume","asthma","athlete","atmosphere","atom","attack","attempt","attend","attitude","attract","audience","audio","audit","august","aunt","aurora","authority","auto","autumn","avail","avoid"];
    let words = [];
    for (let i = 0; i < 12; i++) words.push(bip39Pool[Math.floor(Math.random() * bip39Pool.length)]);
    return words.join(' ');
}

function generateNew2faSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 16; i++) secret += chars.charAt(Math.floor(Math.random() * chars.length));
    simulated2faSecret = secret;
    const el1 = document.getElementById('reg-2fa-key');
    if (el1) el1.innerText = secret;
    const el2 = document.getElementById('sett-2fa-secret-key');
    if (el2) el2.innerText = secret;
}
/* ==========================================================================
   MODIFIED: 2FA TOTP SIMULATOR - LIVE COMPATIBILITY RE-SYNC (app.js)
   ========================================================================== */
function startOtpSimulator() {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    
    const updateOtp = async () => {
        const epoch = Math.round(new Date().getTime() / 1000); 
        otpTimerVal = 30 - (epoch % 30); 
        let code = "000000";
        
        // ??????? ?? ???? ????? ????? ??? ????? ???? RFC 6238
        if (simulated2faSecret) {
            code = await generateTOTP(simulated2faSecret, epoch);
        }
        currentSimulatedOtp = code;
        
        // ????? ??? ??? ?: ?????????? ? ????? ??? ???? ???? ? ???? ?? ?? ?? ???? ???? ?????
        ['reg-2fa-sim-code', 'sett-2fa-sim-code'].forEach(id => { 
            const el = document.getElementById(id); 
            if (el) {
                el.innerText = code; 
            }
        });
    };
    
    // ????? ????? ???? ??? ??? ????? ???????? ???
    updateOtp();
    
    otpTimerInterval = setInterval(async () => {
        otpTimerVal--; 
        if (otpTimerVal <= 0) {
            await updateOtp(); 
        } else { 
            ['reg-2fa-timer', 'sett-2fa-timer'].forEach(id => { 
                const el = document.getElementById(id); 
                if (el) el.innerText = otpTimerVal + "s"; 
            }); 
        }
    }, 1000);
}

function resetAutoLockTimer() {
    if (autoLockTimeout) clearTimeout(autoLockTimeout); if (!activeMasterKey || autolockDuration === -1) return;
    autoLockTimeout = setTimeout(() => { handleLogout(); showAlert(t("session_expired")); }, autolockDuration);
}

['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(evt => { window.addEventListener(evt, () => { if (activeMasterKey) resetAutoLockTimer(); }); });

function vnsHasMasterAccount() {
    try {
        return !!(localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account'));
    } catch (e) {
        return false;
    }
}

function updateRegReturnLoginVisibility() {
    // Keep name for existing call sites; updates ALL auth footer / cross-links.
    updateAuthNavLinksVisibility();
}

function updateAuthNavLinksVisibility() {
    const returnBtn = document.getElementById('reg-return-login-btn');
    const createBtn = document.getElementById('reg-redirect-btn');
    const recoveryBtn = document.getElementById('auth-recovery-btn') || document.querySelector('button[onclick="showRecoveryDashboard()"]');
    const regCard = document.getElementById('register-card');
    const loginCard = document.getElementById('login-card');
    const hasAccount = vnsHasMasterAccount();

    function isVisibleCard(el) {
        if (!el) return false;
        if (el.classList.contains('hidden')) return false;
        const d = (el.style && el.style.display) || '';
        if (d === 'none') return false;
        try {
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        } catch (e) {}
        return true;
    }

    const onRegister = isVisibleCard(regCard);
    const onLogin = isVisibleCard(loginCard);

    function showEl(el) {
        if (!el) return;
        el.classList.remove('hidden');
        el.style.setProperty('display', 'block', 'important');
    }
    function hideEl(el) {
        if (!el) return;
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
    }

    // REGISTER screen (first install or after Create Account):
    // hide ALL three dead/confusing links for store review.
    if (onRegister) {
        hideEl(returnBtn);
        hideEl(createBtn);
        hideEl(recoveryBtn);
        // Exception: if account already exists and user opened register from login,
        // only show "Return to Access Login".
        if (hasAccount) showEl(returnBtn);
        return;
    }

    // LOGIN screen:
    if (onLogin) {
        hideEl(returnBtn);
        // Create new account only if we already have a vault (optional second vault flow).
        // For first-time there is no login screen; when login shows, account exists.
        if (hasAccount) {
            showEl(createBtn);
            showEl(recoveryBtn);
        } else {
            hideEl(createBtn);
            hideEl(recoveryBtn);
        }
        return;
    }

    // Fallback (no card detected): hide everything
    hideEl(returnBtn);
    hideEl(createBtn);
    hideEl(recoveryBtn);
}

function loadMasterAccountState(isInitialBoot = false) {
    let masterUser = JSON.parse(localStorage.getItem('vns_master_user') || 'null'); const authGate = document.getElementById('auth-gate');
    if (!masterUser) {
        authGate.classList.remove('hidden'); document.getElementById('register-card').classList.remove('hidden'); document.getElementById('login-card').classList.add('hidden'); generateNew2faSecret();
    } else {
        authGate.classList.remove('hidden'); document.getElementById('login-card').classList.remove('hidden'); document.getElementById('register-card').classList.add('hidden');
        const passcodeContainer = document.getElementById('login-passcode-container'); const passContainer = document.getElementById('login-pass-container'); const twoFaContainer = document.getElementById('login-2fa-container');
		/*****************************STR 2FA HIDDEN*************************/
		passcodeContainer.classList.add('hidden'); passContainer.classList.add('hidden'); twoFaContainer.classList.add('hidden');

        if (masterUser.isPasscodeEnabled) {
            passcodeContainer.classList.remove('hidden');
          
            if (masterUser.is2faEnabled === true) simulated2faSecret = masterUser.twoFactorSecret;
        } else {
            passContainer.classList.remove('hidden');
            
            if (masterUser.is2faEnabled === true) { 
                twoFaContainer.classList.remove('hidden'); 
                simulated2faSecret = masterUser.twoFactorSecret; 
            }
        }
		
		/****************************END 2FA HIDDEN*******************************/
        const rem = localStorage.getItem('vns_remember_checked') === 'true'; document.getElementById('login-remember').checked = rem;
        if (rem) document.getElementById('login-user').value = localStorage.getItem('vns_remembered_username') || '';
        
        if (masterUser.biometricCredentialId && isInitialBoot) handleBiometricLogin();
    }
    // First install: hide dead "Return to Access Login"; after account exists: show it
    updateRegReturnLoginVisibility();
}

function toggleToLogin() {
    // Store-review fix: on first install there is no account — do not silently stay on register
    if (!vnsHasMasterAccount()) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                (typeof t === 'function' && t('reg_need_register_title')) || 'Register first',
                (typeof t === 'function' && t('reg_need_register_msg')) || 'No vault account exists on this device. Please complete registration first.',
                'warning'
            );
        } else if (typeof showAlert === 'function') {
            showAlert((typeof t === 'function' && t('reg_need_register_msg')) || 'No vault account exists. Please register first.');
        } else {
            alert('No vault account exists. Please register first.');
        }
        updateRegReturnLoginVisibility();
        return;
    }
    loadMasterAccountState();
}
function toggleToRegister() {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('register-card').classList.remove('hidden');
    generateNew2faSecret();
    // User came from login → account exists → allow return to login
    updateRegReturnLoginVisibility();
}

function handle2faToggle(cb) {
    // Registration no longer offers 2FA toggle; 2FA is enabled only from Settings.
    if (!cb) return;
    try { cb.checked = false; } catch (e) {}
}

function handleRegisterStep1() {
    const u = document.getElementById('reg-user').value.trim();
    const p = document.getElementById('reg-pass').value;
    if (!u || !p || p !== document.getElementById('reg-confirm-pass').value || p.length < 8 || p.length > 16 || /(.)\1\1/.test(p) || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p)) {
        showAlert(t("registration_password_mismatch."));
        return;
    }
    // Always register without 2FA. User can enable TOTP later from Settings.
    completeRegistrationProcess(u, p, false);
}

function backToStep1() {
    const toggle = document.getElementById('reg-2fa-toggle');
    if (toggle) toggle.checked = false;
    const card2fa = document.getElementById('register-2fa-card');
    if (card2fa) card2fa.classList.add('hidden');
    const cardReg = document.getElementById('register-card');
    if (cardReg) cardReg.classList.remove('hidden');
}

async function handleRegisterComplete() {
    const entered = document.getElementById('reg-2fa-verify').value.trim(); const epoch = Math.round(new Date().getTime() / 1000);
    if (entered === await generateTOTP(simulated2faSecret, epoch) || entered === await generateTOTP(simulated2faSecret, epoch - 30) || entered === await generateTOTP(simulated2faSecret, epoch + 30)) {
        completeRegistrationProcess(document.getElementById('reg-user').value.trim(), document.getElementById('reg-pass').value, true);
    } else showAlert(t("invalid_2fa_token."));
}
/* ==========================================================================
   FIXED: COMPLETE REGISTRATION (CLEARS OLD CARDS PROPERLY)
   ========================================================================== */
async function completeRegistrationProcess(u, p, is2fa) {
    try {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const dKey = await deriveKeyFromPassword(p, salt);
        const verificationBlock = await encryptData("VNS_VERIFIED", dKey);
        if (typeof generateMnemonic !== 'function') {
            throw new Error('generateMnemonic is not available');
        }
        const recoveryMnemonic = generateMnemonic();
        tempMasterAccount = {
            username: u,
            salt: bufToBase64(salt),
            verificationBlock,
            is2faEnabled: !!is2fa,
            twoFactorSecret: is2fa ? (simulated2faSecret || '') : '',
            isPasscodeEnabled: false,
            localPasscode: '',
            passcodeSalt: '',
            encryptedMasterKeyObj: null,
            recoveryMnemonic
        };

        // پاک‌سازی کارت‌های بانکی حساب قبلی
        localStorage.removeItem('vns_cards');
        if (typeof mPaymentCards !== 'undefined') mPaymentCards = [];

        // پاک‌سازی ID / Passport حساب قبلی (همین باگ)
        localStorage.removeItem('vns_id_docs');
        if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = [];
        if (typeof selectedIdDocIds !== 'undefined' && selectedIdDocIds && typeof selectedIdDocIds.clear === 'function') {
            selectedIdDocIds.clear();
        }
        if (typeof mActiveIdDocId !== 'undefined') mActiveIdDocId = null;

        const container = document.getElementById('register-mnemonic-container');
        if (container) {
            container.innerHTML = '';
            recoveryMnemonic.split(' ').forEach((w, i) => {
                container.innerHTML += `<div class="p-2 bg-white/80 rounded-xl border border-orange-200 text-center font-bold text-slate-700 font-mono text-[11px]">${i + 1}. ${w}</div>`;
            });
        }
        const regCard = document.getElementById('register-card');
        if (regCard) regCard.classList.add('hidden');
        const card2fa = document.getElementById('register-2fa-card');
        if (card2fa) card2fa.classList.add('hidden');
        const mnCard = document.getElementById('register-mnemonic-card');
        if (mnCard) mnCard.classList.remove('hidden');
        ['reg-user', 'reg-pass', 'reg-confirm-pass', 'reg-2fa-verify'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (typeof scrubMemoryOnlyDOM === 'function') scrubMemoryOnlyDOM();
    } catch (e) {
        console.error('completeRegistrationProcess error:', e);
        showAlert(typeof t === 'function' ? t('vault_crypto_init_error') : 'Vault Crypto Init Error');
    }
}

function copyRegisterMnemonic() { if (tempMasterAccount) { copyValueDirectText(tempMasterAccount.recoveryMnemonic); showAlert (t("phrase_copied")); } }
function confirmMnemonicWritten() {
    if (tempMasterAccount) {
        localStorage.setItem('vns_master_user', JSON.stringify(tempMasterAccount)); tempMasterAccount = null;
        showAlert (t("vault_storage"));
        document.getElementById('register-mnemonic-card').classList.add('hidden'); loadMasterAccountState();
    }
}

function checkLockoutState() {
    const lockUntil = parseInt(localStorage.getItem('vns_lock_until') || '0'); const loginBtn = document.getElementById('login-submit-btn');
    if (Date.now() < lockUntil) {
        isPasscodeLocked = true; const remaining = Math.ceil((lockUntil - Date.now()) / 1000); passcodeLockRemaining = remaining;
        if (loginBtn) { loginBtn.disabled = true; loginBtn.innerHTML = `<span class="md:hidden">Locked (${remaining}s)</span><span class="hidden md:inline">Vault Locked (${remaining}s)</span>`; loginBtn.style.opacity = "0.5"; }
        if (passcodeLockInterval) clearInterval(passcodeLockInterval);
        passcodeLockInterval = setInterval(() => {
            const secLeft = Math.ceil((lockUntil - Date.now()) / 1000);
            /*----------------------------------STR TRANS 01.07.2026 P2----------------------------------*/
            
            if (secLeft <= 0) {
    clearInterval(passcodeLockInterval); 
    isPasscodeLocked = false; 
    localStorage.setItem('vns_failed_attempts', '0'); 
    localStorage.removeItem('vns_lock_until');
    
    if (loginBtn) { 
        loginBtn.disabled = false; 
        
        // ??????? ???? ????????? ?? ??????? ?? ?????? ???????
        const txtShort = typeof t === 'function' ? t('unlock_vault_short') : "Unlock Vault";
        const txtLong = typeof t === 'function' ? t('unlock_vault_long') : "Unlock Secure Vault Partition";
        
        loginBtn.innerHTML = `<span class="md:hidden">${txtShort}</span><span class="hidden md:inline">${txtLong}</span>`; 
        loginBtn.style.opacity = "1"; 
    }
}
    /*----------------------------------END TRANS 01.07.2026 P2----------------------------------*/     
           
    else { 
        passcodeLockRemaining = secLeft; 
        if (loginBtn) {
            // ??????? ???? ????????? ???? ???? ???
            const txtLockedShort = typeof t === 'function' ? t('vault_locked_short') : "Locked";
            const txtLockedLong = typeof t === 'function' ? t('vault_locked_long') : "Vault Locked";
            
            loginBtn.innerHTML = `<span class="md:hidden">${txtLockedShort} (${secLeft}s)</span><span class="hidden md:inline">${txtLockedLong} (${secLeft}s)</span>`; 
        }
    }
        }, 1000);
        return true;
    } else {
        isPasscodeLocked = false;
        if (loginBtn && loginBtn.disabled) { 
            loginBtn.disabled = false; 
            
            // ??????? ???? ????????? ???? ???? ???????? (??????? ????? ???)
            const txtUnlockShort = typeof t === 'function' ? t('unlock_vault_short') : "Unlock Vault";
            const txtUnlockLong = typeof t === 'function' ? t('unlock_vault_long') : "Unlock Secure Vault Partition";
            
            loginBtn.innerHTML = `<span class="md:hidden">${txtUnlockShort}</span><span class="hidden md:inline">${txtUnlockLong}</span>`; 
            loginBtn.style.opacity = "1"; 
        }
        return false;
    }
    
}
/*--------------------------END TRANS 01.07.2026 P3----------------------------------*/ 
function handleFailedAttempt() {
    let attempts = parseInt(localStorage.getItem('vns_failed_attempts') || '0'); 
    attempts++; 
    localStorage.setItem('vns_failed_attempts', attempts.toString());

    const maxAllowed = 3;
    const remainingAttempts = Math.max(0, maxAllowed - attempts);

    if (attempts >= maxAllowed) {
        // ??? ??? ?? ???? ???? ??? ?? ??
        const cooldownDuration = 30000 * Math.pow(2, Math.min(attempts - maxAllowed, 5)); 
        const lockUntil = Date.now() + cooldownDuration;
        localStorage.setItem('vns_lock_until', lockUntil.toString()); 
        
        checkLockoutState();

        const lockMsg = typeof t === 'function' 
            ? t("err_lockout_timer").replace("{seconds}", cooldownDuration / 1000) 
            : `Vault locked for security. Please wait ${cooldownDuration / 1000} seconds.`;

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Access Blocked", lockMsg, "error");
        } else {
            showAlert(lockMsg);
        }
    } else {
        // ?? ????? ?????: ????? ????? ?? ???? ??? ??? ?????? ???? ???? ???!
        const failTitle = typeof t === 'function' ? t("cards_alert_val_error") : "Authentication Failed";
        const failMsg = typeof t === 'function' && t("err_invalid_credentials") !== "err_invalid_credentials"
            ? t("err_invalid_credentials") 
            : `Incorrect credentials sequence. Remaining attempts before security cooldown: ${remainingAttempts}`;

        if (typeof showVnsAlert === 'function') {
            showVnsAlert(failTitle, failMsg, "error");
        } else if (typeof showAlert === 'function') {
            showAlert(failMsg);
        }
    }
}
/*--------------------------STR TRANS 01.07.2026 P4----------------------------------*/ 
/* ==========================================================================
   UPDATED: HANDLE LOGIN WITH 2FA TOTP & EMERGENCY RECOVERY CODES CONSUMPTION
   ========================================================================== */
async function handleLogin() {
    if (checkLockoutState()) { 
        const lockText = typeof t === 'function' 
            ? t('err_lockout_timer_desc').replace('{seconds}', passcodeLockRemaining) 
            : `Access port is locked. Please wait ${passcodeLockRemaining} seconds.`;
            
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Vault Locked", lockText, "warning");
        } else {
            showAlert(lockText);
        }
        return; 
    }
    
    const uInput = document.getElementById('login-user');
    const u = uInput ? uInput.value.trim() : ''; 
    const masterStr = localStorage.getItem('vns_master_user');
    const master = masterStr ? JSON.parse(masterStr) : null;

    if (!master || u !== master.username) { 
        const userNotFoundMsg = typeof t === 'function' ? t("err_user_not_found_desc") : "Username credentials not found in vault registry.";
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Access Denied", userNotFoundMsg, "error");
        } else {
            showAlert(userNotFoundMsg);
        }
        return; 
    }

    if (master.isPasscodeEnabled) {
        const pin = document.getElementById('login-passcode').value; 
        if (pin !== master.localPasscode) { 
            handleFailedAttempt(); 
            return; 
        }
        try {
            const pSalt = new Uint8Array(base64ToBuf(master.passcodeSalt)); 
            const pDerivedKey = await deriveKeyFromPassword(pin, pSalt);
            const decMasterKeyB64 = await decryptData(master.encryptedMasterKeyObj, pDerivedKey);
            if (!decMasterKeyB64) { 
                handleFailedAttempt();
                return; 
            }
            activeMasterKey = await window.crypto.subtle.importKey("raw", base64ToBuf(decMasterKeyB64), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
            resetAutoLockTimer(); 
            localStorage.setItem('vns_failed_attempts', '0'); 
        } catch (e) { 
            handleFailedAttempt();
            return; 
        }
    } else {
        const p = document.getElementById('login-pass').value;
        try {
            const salt = new Uint8Array(base64ToBuf(master.salt)); 
            const derivedKey = await deriveKeyFromPassword(p, salt);
            if (master.isLegacy || master.encryptedMnemonic) {
                const decMnemonicStr = await decryptData(master.encryptedMnemonic, derivedKey); 
                if (!decMnemonicStr) { 
                    handleFailedAttempt(); 
                    return; 
                }
                const hashBuffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(decMnemonicStr));
                const legacyKey = await window.crypto.subtle.importKey("raw", hashBuffer, "AES-GCM", false, ["encrypt", "decrypt"]);
                activeMasterKey = legacyKey; 
                await loadEncryptedDatabase(); 
                master.verificationBlock = await encryptData("VNS_VERIFIED", derivedKey); 
                master.recoveryMnemonic = decMnemonicStr;
                delete master.encryptedMnemonic; 
                delete master.isLegacy; 
                localStorage.setItem('vns_master_user', JSON.stringify(master));
                activeMasterKey = derivedKey; 
                await saveItemsToStorage(); 
            } else {
                const checkBlock = await decryptData(master.verificationBlock, derivedKey);
                if (checkBlock !== "VNS_VERIFIED") { 
                    handleFailedAttempt(); 
                    return; 
                }
                activeMasterKey = derivedKey; 
            }
            resetAutoLockTimer(); 
            localStorage.setItem('vns_failed_attempts', '0'); 
        } catch (e) { 
            handleFailedAttempt(); 
            return; 
        }
    }

    if (master.is2faEnabled && !master.isPasscodeEnabled) {
        const tCodeEl = document.getElementById('login-2fa-code');
        const tCode = tCodeEl ? tCodeEl.value.trim() : ''; 
        const epoch = Math.round(new Date().getTime() / 1000);

        const isTotpValid = (
            tCode === await generateTOTP(master.twoFactorSecret, epoch) || 
            tCode === await generateTOTP(master.twoFactorSecret, epoch - 30) || 
            tCode === await generateTOTP(master.twoFactorSecret, epoch + 30)
        );

        let isRecoveryValid = false;
        if (!isTotpValid && master.recoveryCodes && Array.isArray(master.recoveryCodes)) {
            const codeIndex = master.recoveryCodes.indexOf(tCode);
            if (codeIndex !== -1) {
                isRecoveryValid = true;
                master.recoveryCodes.splice(codeIndex, 1);
                localStorage.setItem('vns_master_user', JSON.stringify(master));
            }
        }

        if (!isTotpValid && !isRecoveryValid) { 
            const totpErrMsg = typeof t === 'function' ? t("err_invalid_2fa_desc.") : "Invalid 2FA Authenticator token or Emergency Recovery Code.";
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("2FA Error", totpErrMsg, "error");
            } else {
                showAlert(totpErrMsg);
            }
            return; 
        }
    }

    const rem = document.getElementById('login-remember').checked; 
    localStorage.setItem('vns_remember_checked', rem ? 'true' : 'false');
    if (rem) localStorage.setItem('vns_remembered_username', u); 
    else localStorage.removeItem('vns_remembered_username');

    document.getElementById('auth-gate').classList.add('hidden'); 
    document.getElementById('app-container').classList.remove('hidden'); 
    
    const displayUserEl = document.getElementById('display-user');
    if (displayUserEl) displayUserEl.innerText = master.username;
    
    if (!(master.isLegacy || master.encryptedMnemonic)) {
        await loadEncryptedDatabase(); 
    } else { 
        if (typeof renderFolders === 'function') renderFolders(); 
        if (typeof renderList === 'function') renderList(); 
    }

    // ðŸŸ¢ Ø¨Ø§Ø²Ø®ÙˆØ§Ù†ÛŒ Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø¨Ø§Ù†Ú©ÛŒ Ø§Ø² Ø­Ø§ÙØ¸Ù‡ Ù¾Ø³ Ø§Ø² ÙˆØ±ÙˆØ¯
    try {
        if (typeof mPaymentCards !== 'undefined') {
            mPaymentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
        }
    } catch(e) { console.warn(e); }

    if (typeof scrubMemoryOnlyDOM === 'function') scrubMemoryOnlyDOM();
}
window.handleLogin = handleLogin;

// ==========================================
// ?? STEP 3: FOLDER GATEWAY (SELECT & CONFIRM ROUTE)
// ==========================================
async function triggerFolderPicker() {
    const inputEl = document.getElementById('manual-path-input');
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

    if (isCapacitor) {
        try {
            if (window.Capacitor.Plugins.FilePicker) {
                const result = await window.Capacitor.Plugins.FilePicker.pickDirectory();
                if (result && result.path && inputEl) {
                    // ???? ????? ??????? ????? ??????
                    inputEl.setAttribute('data-real-path', result.path); 
                    // ?? ????? ???? ????? ???? ???? ??????
                    inputEl.value = "? FOLDER LINKED"; 
                }
            } else {
                if (inputEl && !inputEl.value) {
                    inputEl.setAttribute('data-real-path', 'VNS_Vault/bk');
                    inputEl.value = "? DEFAULT ROUTE LINKED";
                }
            }
        } catch (e) {
    console.error(typeof t === 'function' ? t('log_mobile_picker_error') : "Mobile Directory Picker Error:", e);
} 
       
    } else if (window.electronAPI && window.electronAPI.selectFolder) {
        const absolutePath = await window.electronAPI.selectFolder();
        if (absolutePath && inputEl) {
            inputEl.setAttribute('data-real-path', absolutePath);
            
            // ??????? ?? ????? ????? ???? ???? ???? ?? ???? ??????
            inputEl.setAttribute('data-i18n', 'path_folder_linked');
            inputEl.value = typeof t === 'function' ? t('path_folder_linked') : "? FOLDER LINKED";
        }
    }
    
    
}


// ?. ?????????? ??????? ?? ???? ??? ??? ?????? (UI Sync)
function initializeBackupUI() {
    const folderLabel = document.getElementById('settings-folder-name');
    const mountedFolder = document.getElementById('mounted-folder-name');
    let currentPath = localStorage.getItem('vns_linked_folder_name');
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    
    if (isCapacitor && (!currentPath || currentPath === 'None')) {
        currentPath = 'VNS_Vault/bk';
        localStorage.setItem('vns_linked_folder_name', currentPath);
    }
    
    if (folderLabel) {
    if (currentPath && currentPath !== 'None') {
        // ????? ??? ????? ????
        folderLabel.innerText = t("path_secure_route_linked");
        folderLabel.classList.add('text-green-600', 'bg-green-100/40');
    } else {
        // ????? ??? ??? ?????
        folderLabel.innerText = t("path_no_directory");
        // ???? ???: ??? ??? ??? ?? ???? ??? ????? ???? ??????? ?? ??? ?????
        folderLabel.classList.remove('text-green-600', 'bg-green-100/40');
    }
}
   

    // ?? ???? ????? ??? ?????? (???? ????)
    if (mountedFolder) {
        mountedFolder.innerText = (currentPath && currentPath !== 'None') ? currentPath : 'NONE';
    }

    const freq = localStorage.getItem('vns_backup_freq') || 'manual';
    const freqSelect = document.getElementById('sett-backup-freq');
    if (freqSelect) freqSelect.value = freq;
}


function relinkStorageFolder() { localStorage.removeItem('vns_folder_linked'); document.getElementById('folder-link-gate').classList.remove('hidden'); document.getElementById('app-container').classList.add('hidden'); document.getElementById('auth-gate').classList.remove('hidden'); }
/*----------------------STR DELETE PART 3 21.06.2026---------------------*/
async function loadEncryptedDatabase() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
        window.Capacitor.Plugins.SplashScreen.hide();
    }

    try {
        const raw = localStorage.getItem('vns_vault_encrypted_db');
        if (raw) {
            const dec = await decryptData(JSON.parse(raw), activeMasterKey);
            if (dec) {
                const parsed = JSON.parse(dec); items = parsed.data || parsed.items || []; folders = parsed.folders || ['Personal', 'Work', 'Finance'];
                globalSearchQuery = ""; const searchEl = document.getElementById('global-search'); if (searchEl) searchEl.value = "";
                
                localStorage.setItem('vns_autofill_active_data', JSON.stringify(items));
                
                renderFolders(); 
                renderList(); 
                
                setTimeout(checkPendingAutosave, 500); 
                
                // ?? ???????? ???? ???? ???? ??????? ????? (??? ?? return)
                setTimeout(checkCloudNudge, 1200); 
                
                return;
            }
        }
        items = []; folders = ['Personal', 'Work', 'Finance']; await saveItemsToStorage(); renderFolders(); renderList();
        
        // ?? ???????? ???? ???? ???? ??????? ?????? ????
        setTimeout(checkCloudNudge, 1200); 
        
    } catch (e) { showAlert("error_loading"); }
}
/*----------------------STR DELETE PART 3 21.06.2026---------------------*/
// START OF AUTO-SAVE MODULE
async function saveItemsToStorage() {
    if (!activeMasterKey) return;
    try {
        const payload = JSON.stringify({ data: items, folders }); 
        const enc = await encryptData(payload, activeMasterKey); 
        localStorage.setItem('vns_vault_encrypted_db', JSON.stringify(enc));

        await executeSilentBackup();
    } 
    catch (error) { 
    console.error(t("log_local_storage_error"), error);
}
    
    
}

// ?? ???? ???? ???? ????? ?????? ???????? ?? ???????? ????? ??? ??????? ?? ???????? ????
async function executeSilentBackup() {
    try {
        const masterStr = localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account');
        if (!masterStr) return false;
        const master = JSON.parse(masterStr);
        
        const keyToUse = master.recoveryMnemonic || master.password;
        if (!keyToUse) return false;

        const currentItems = typeof items !== 'undefined' ? items : [];
        const currentFolders = typeof folders !== 'undefined' ? folders : [];
        
        // ?? ??????? ???????? ????? ???? ????? ?? ????? ?????? ? ???? ??????
        const currentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
        
        // ?? ?????? ?? ???????: ????? ???? ?? ???? ???????? ?? ????? ???? ???? ??? ????
        const payload = JSON.stringify({ 
            data: currentItems, 
            folders: currentFolders, 
            cardsData: currentCards 
        , idDocsData: (typeof mIdentityDocs !== 'undefined' ? mIdentityDocs : JSON.parse(localStorage.getItem('vns_id_docs') || '[]')) });

        const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const bKey = await deriveKeyFromPassword(keyToUse, bSalt); 
        const enc = await encryptData(payload, bKey);
        
        const backupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({ 
            vns_version: "1.0.0", 
            encrypted_backup: true, 
            salt: bufToBase64(bSalt), 
            iv: enc.iv, 
            ciphertext: enc.ciphertext 
        })));

        const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        if (isCapacitor) {
            const { Filesystem } = Capacitor.Plugins; 
            const targetPath = '.VNS_Vault';
            
            await Filesystem.mkdir({ path: targetPath, directory: 'DOCUMENTS', recursive: true }).catch(e => {});

            // ????? ?????????? ???? ?? ????????? ??? ??? ???? ?? ??????? ???????
            await Filesystem.writeFile({
                path: `${targetPath}/VNS_Backup_Data.json`,
                data: backupJSON,
                directory: 'DOCUMENTS', 
                encoding: 'utf8'
            });
            return true;
        }
        return false;
    } catch(e) { 
        // ?? ????? ?????? ????? ?? ????? ???? ???????? ?? ????? ?????? ???? ????
        console.log("Silent backup bypassed: ", e.message);
        return false;
    }
}

// ==========================================
// FIXED: COMPLETE UI & MEMORY LOCKDOWN ON LOGOUT
// ==========================================
function handleLogout(event) {
    if (event) event.stopPropagation(); 
    if (autoLockTimeout) clearTimeout(autoLockTimeout); 

    // 1. Close Cards module only (hide overlay — no setCategory chain)
    if (typeof mExitCardsModuleMatrix === 'function') {
        try { mExitCardsModuleMatrix(); } catch (e) {}
    }

    // 2. Force-close ID & Passport overlay ONLY (do NOT call mExitIdsModuleMatrix —
    //    that used to call setCategory and freeze the WebView)
    if (typeof mForceCloseIdsOnLock === 'function') {
        try { mForceCloseIdsOnLock(); } catch (e) {}
    } else {
        var idRoot = document.getElementById('m-ids-main-container');
        if (idRoot) {
            idRoot.classList.add('hidden');
            idRoot.style.setProperty('display', 'none', 'important');
        }
        var idForm = document.getElementById('m-id-form-screen');
        var idView = document.getElementById('m-id-view-screen');
        if (idForm) idForm.classList.add('hidden');
        if (idView) idView.classList.add('hidden');
    }

    // 3. Close modals, forms, settings
    if (typeof closeModals === 'function') closeModals();
    ['settings-container', 'form-container', 'policy-container', 'view-placeholder'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // 4. Scrub RAM credentials
    scrubMemoryAndCredentials(); 
    
    // 5. Hide main app shell
    const appCont = document.getElementById('app-container');
    if (appCont) appCont.classList.add('hidden'); 
    
    // 6. Reset keys and show login gate
    activeMasterKey = null; 
    items = []; 
    folders = []; 
    loadMasterAccountState();
}

// ==========================================
// SECURE FACTORY WIPE SYSTEM (MOBILE COMPATIBLE)
// ==========================================

async function executeFactoryWipe() {
    const passInput = document.getElementById('sett-wipe-pass');
    const pass = passInput ? passInput.value.trim() : '';

    if (!pass) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Warning", typeof t === 'function' ? t("err_wipe_auth_desc") : "Master password required to authorize factory wipe.", "warning");
        } else {
            showAlert("Master password required.");
        }
        return;
    }

    const masterStr = localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account');
    if (!masterStr) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Error", "Vault profile metadata is missing.", "error");
        }
        return;
    }

    const master = JSON.parse(masterStr);

    try {
        let isVerified = false;

        if (master.salt) {
            try {
                const saltBuf = base64ToBuf(master.salt);
                const derivedKey = await deriveKeyFromPassword(pass, saltBuf);

                if (master.verificationBlock) {
                    const verificationResult = await decryptData(master.verificationBlock, derivedKey);
                    if (verificationResult === "VNS_VERIFIED") {
                        isVerified = true;
                    }
                }

                if (!isVerified && master.encryptedMnemonic) {
                    const decMnemonicStr = await decryptData(master.encryptedMnemonic, derivedKey);
                    if (decMnemonicStr) {
                        isVerified = true;
                    }
                }
            } catch (cryptoErr) {
                console.warn("Crypto derivation failed:", cryptoErr);
            }
        }

        if (!isVerified && master.recoveryMnemonic) {
            const cleanPass = pass.toLowerCase().replace(/\s+/g, ' ').trim();
            const cleanStored = master.recoveryMnemonic.toLowerCase().replace(/\s+/g, ' ').trim();
            if (cleanPass === cleanStored) {
                isVerified = true;
            }
        }

        if (!isVerified && master.isPasscodeEnabled && master.localPasscode && pass === master.localPasscode) {
            isVerified = true;
        }

        if (isVerified) {
            const confirmMsg = typeof t === 'function' ? t("confirm_annihilate_data") : "Are you sure you want to permanently erase all vault partitions, credentials, and biometric links?";

            const doWipe = async () => {
                try {
                    // Û±. Ø­Ø°Ù Ú©Ù„ÛŒØ¯Ù‡Ø§ÛŒ Ø¨ÛŒÙˆÙ…ØªØ±ÛŒÚ© Ø§Ø² Keystore Ø³Ø®Øªâ€ŒØ§ÙØ²Ø§Ø±ÛŒ Ú¯ÙˆØ´ÛŒ
                    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric) {
                        try { await window.Capacitor.Plugins.NativeBiometric.deleteCredentials({ server: "vns_secure_vault" }); } catch(e){}
                    }
                    
                    // Û². Ù¾Ø§Ú©Ø³Ø§Ø²ÛŒ Ú©Ø§Ù…Ù„ ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ Ø³Ù†Ø¯Ø¨Ø§Ú©Ø³ Ùˆ Ø¨Ú©â€ŒØ¢Ù¾â€ŒÙ‡Ø§ÛŒ Ù¾Ù†Ù‡Ø§Ù† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡ Ø±ÙˆÛŒ Ø¯ÛŒØ³Ú© Ù…ÙˆØ¨Ø§ÛŒÙ„
                    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                        const { Filesystem, Directory } = window.Capacitor.Plugins.Filesystem;
                        const targetsToDestroy = [
                            'VNS_Vault_Backups/VNS_Auto_Backup.json',
                            '.VNS_Vault/VNS_Backup_Data.json',
                            'VNS_Sandbox_AutoBackup.json',
                            'VNS_Manual_Backup.json'
                        ];

                        for (let filePath of targetsToDestroy) {
                            try {
                                await Filesystem.deleteFile({ path: filePath, directory: Directory.Documents });
                            } catch (err) {
                                try {
                                    await Filesystem.deleteFile({ path: filePath, directory: Directory.Data });
                                } catch (innerErr) {}
                            }
                        }
                    }

                    // Û³. Ù¾Ø§Ú©Ø³Ø§Ø²ÛŒ Ú©Ø§Ù…Ù„ LocalStorage Ùˆ Capacitor Preferences
                    localStorage.clear();
                    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                        try { await window.Capacitor.Plugins.Preferences.clear(); } catch(e){}
                    }

                    // Û´. Ù¾Ø§Ú©Ø³Ø§Ø²ÛŒ Ù…ØªØºÛŒØ±Ù‡Ø§ÛŒ Ø¯Ø±ÙˆÙ† RAM
                    if (typeof scrubMemoryAndCredentials === 'function') {
                        scrubMemoryAndCredentials();
                    }
                    
                    // Ûµ. Ø±Ù„ÙˆØ¯ Ú©Ø§Ù…Ù„ Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø¨Ø±Ø§ÛŒ Ø´Ø±ÙˆØ¹ Ù¾Ø§Ú©Ù ØªØ§Ø²Ù‡
                    window.location.reload();
                } catch (wipeErr) {
                    console.error("Wipe Execution Error:", wipeErr);
                    localStorage.clear();
                    window.location.reload();
                }
            };

            if (typeof showConfirm === 'function') {
                try {
                    showConfirm(confirmMsg, doWipe);
                } catch (err) {
                    if (confirm(confirmMsg)) doWipe();
                }
            } else if (confirm(confirmMsg)) {
                doWipe();
            }
        } else {
            const errMsg = typeof t === 'function' && t("err_wipe_denied_desc") !== "err_wipe_denied_desc"
                ? t("err_wipe_denied_desc") 
                : "Access Denied: Incorrect Master Password.";

            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Access Denied", errMsg, "error");
            } else {
                showAlert(errMsg);
            }
        }

    } catch (e) {
        console.error("Critical Factory Wipe Exception:", e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("System Error", "Failed to process security wipe validation: " + e.message, "error");
        } else {
            showAlert("Failed to process security wipe validation.");
        }
    }
}

/*----------------------------------END FACTORYWIPE----------------------------------*/
/* ==========================================================================
   UNIFIED ALERT BRIDGE - FORCES ALL SYSTEM ALERTS TO USE LUXURY VNS MODAL
   ========================================================================== */
function showAlert(msg) {
    if (typeof window.showVnsAlert === 'function') {
        const title = typeof t === 'function' ? t("alert_title") : "Notification";
        window.showVnsAlert(title, msg, 'warning');
    } else {
        const msgEl = document.getElementById('custom-alert-message');
        const overlay = document.getElementById('gen-overlay');
        const modal = document.getElementById('custom-alert-modal');
        if (msgEl) msgEl.innerText = msg;
        if (overlay) overlay.classList.remove('hidden');
        if (modal) modal.classList.remove('hidden');
    }
}

function closeCustomAlert() {
    document.getElementById('custom-alert-modal').classList.add('hidden');
    if (['import-string-modal', 'import-auth-modal', 'backup-modal', 'gen-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal'].every(id => document.getElementById(id).classList.contains('hidden'))) { document.getElementById('gen-overlay').classList.add('hidden'); }
}

let confirmActionHandler = null;
function showConfirm(msg, cb) { document.getElementById('custom-confirm-message').innerText = msg; document.getElementById('gen-overlay').classList.remove('hidden'); document.getElementById('custom-confirm-modal').classList.remove('hidden'); confirmActionHandler = cb; }
function closeConfirmModal() { document.getElementById('custom-confirm-modal').classList.add('hidden'); document.getElementById('gen-overlay').classList.add('hidden'); confirmActionHandler = null; }

function closeModals() {
    ['gen-overlay', 'gen-modal', 'backup-modal', 'import-auth-modal', 'import-string-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal', 'custom-alert-modal', 'custom-confirm-modal'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    document.getElementById('folder-menu').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => { const confirmBtn = document.getElementById('custom-confirm-yes'); if(confirmBtn) { confirmBtn.onclick = () => { if (confirmActionHandler) confirmActionHandler(); closeConfirmModal(); }; } });

function handleGlobalSearch(query) { globalSearchQuery = query.toLowerCase().trim(); renderList(); }

function setCategory(cat, el, fName = null) { 
    if (typeof mExitCardsModuleMatrix === 'function') mExitCardsModuleMatrix();
    currentCategory = cat;  
    currentFolder = fName;  
    globalSearchQuery = ""; 
    activeId = null; 
    
    const searchEl = document.getElementById('global-search'); 
    if (searchEl) searchEl.value = "";  
    
    document.querySelectorAll('.sidebar-item, .folder-sub-item').forEach(i => i.classList.remove('active')); 
    if (el) el.classList.add('active');  

    // ?? ????? ?? ??? ??? ????? ??????? ????? ?? ??? ???????
    let title = t("sidebar_all");  
    if (cat === 'home') title = t("sidebar_home");  
    else if (cat === 'fav') title = t("sidebar_fav");  
    else if (cat === 'pass') title = t("sidebar_cred"); 
    else if (cat === 'arch') title = t("sidebar_arch");  
    else if (cat === 'trash') title = t("sidebar_trash");  
    else if (cat === 'folder') title = fName;  

    document.getElementById('active-category-title').innerText = title.toUpperCase();  
    document.getElementById('settings-container').classList.add('hidden'); 
    document.getElementById('form-container').classList.add('hidden'); 
    
    const policyContainer = document.getElementById('policy-container'); 
    if (policyContainer) policyContainer.classList.add('hidden');  
    
    document.getElementById('view-placeholder').classList.remove('hidden'); 
    renderList(); 
    toggleMainSectionMobile(false);
    if (window.innerWidth < 1024 && typeof closeMobileSidebar === 'function') closeMobileSidebar();  
}

async function toggleFavorite(id, ev) { ev.stopPropagation(); const i = items.find(x => x.id === id); if (i) { i.isFavorite = !i.isFavorite; await saveItemsToStorage(); renderList(); } }
async function deleteItemRow(id, ev) {
    ev.stopPropagation();
    
    // ??????? ?? confirm ????????? ?????? ?? ??? showConfirm ???????
    if (confirm(t("confirm_delete_msg"))) {
        const i = items.find(x => x.id === id);
        if (i) {
            if (i.status === 'deleted') {
                items = items.filter(x => x.id !== id);
            } else {
                i.status = 'deleted';
            }
            
            // ???? ??? ?? ?? ??? ???? ???? async ?? ???????? ??? await ?????? ?? ???? ???????
            await saveItemsToStorage(); 
            renderList();
            
            if (activeId === id) {
                cancelView();
            }
        }
    }
}


let allowDrop = function(ev) { ev.preventDefault(); }
let dragEnter = function(ev) { ev.currentTarget.classList.add('drag-over'); }
let dragLeave = function(ev) { ev.currentTarget.classList.remove('drag-over'); }
async function dropToCategory(ev, cat) {
    ev.preventDefault(); ev.currentTarget.classList.remove('drag-over'); if (!draggedItemId) return; const i = items.find(x => x.id === draggedItemId);
    if (i) { if (cat === 'trash') i.status = 'deleted'; else if (cat === 'arch') i.status = 'archived'; else if (cat === 'fav') i.isFavorite = true; else i.status = 'active'; await saveItemsToStorage(); renderList(); } draggedItemId = null;
}
async function dropToFolder(ev, fName) { ev.preventDefault(); ev.currentTarget.classList.remove('drag-over'); if (!draggedItemId) return; const i = items.find(x => x.id === draggedItemId); if (i) { i.folder = fName; await saveItemsToStorage(); renderList(); } draggedItemId = null; }

function renderFolders() {
    const c = document.getElementById('folder-list-container'); c.innerHTML = '';
    folders.forEach(f => {
        const div = document.createElement('div'); div.className = `folder-sub-item ${currentFolder === f ? 'active' : ''}`; div.onclick = () => setCategory('folder', div, f);
        div.setAttribute('draggable', 'false'); div.setAttribute('ondragover', 'allowDrop(event)'); div.setAttribute('ondrop', `dropToFolder(event, '${f}')`); div.setAttribute('ondragenter', 'dragEnter(event)'); div.setAttribute('ondragleave', 'dragLeave(event)');
        div.innerHTML = `<span class="truncate pr-2 font-bold select-none">${f}</span><button onclick="showFolderMenu(event, this, '${f}')" class="opacity-60 hover:opacity-100 flex-shrink-0 cursor-pointer border-none bg-transparent"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button>`;
        c.appendChild(div);
    });
}

function toggleFolderList() { const c = document.getElementById('folder-list-container'); if (c.classList.contains('hidden')) { c.classList.remove('hidden'); document.getElementById('folder-arrow').style.transform = 'rotate(0deg)'; renderFolders(); } else { c.classList.add('hidden'); document.getElementById('folder-arrow').style.transform = 'rotate(-90deg)'; } }
function promptCreateFolder(ev) { ev.stopPropagation(); document.getElementById('create-folder-input').value = ''; document.getElementById('gen-overlay').classList.remove('hidden'); document.getElementById('folder-create-modal').classList.remove('hidden'); }



function showFolderMenu(ev, el, f) { ev.stopPropagation(); selectedFolderForMenu = f; const m = document.getElementById('folder-menu'); const r = el.getBoundingClientRect(); m.style.left = (r.right - 110) + 'px'; m.style.top = r.top + 'px'; m.style.display = 'block'; }
function handleRenameFolder() { document.getElementById('rename-folder-input').value = selectedFolderForMenu; document.getElementById('folder-menu').style.display = 'none'; document.getElementById('gen-overlay').classList.remove('hidden'); document.getElementById('folder-rename-modal').classList.remove('hidden'); }


function handleDeleteFolder() { document.getElementById('folder-menu').style.display = 'none'; document.getElementById('gen-overlay').classList.remove('hidden'); document.getElementById('folder-delete-modal').classList.remove('hidden'); }

/*********************************FINAL ADDING FOLDER******************************/
/* ==========================================================================
   VNS CRASH-PROOF FOLDERS ENGINE - FAIL-SAFE ARCHITECTURE
   ========================================================================== */

// ???? ???? ?????? ???? ??????? ?? ???? ??? ??????? (Fail-Safe)
function safeShowModal(modalId) {
    try {
        const overlay = document.getElementById('gen-overlay');
        if (overlay) overlay.classList.remove('hidden'); // ??? ???? ????? ???? ???? ?? ?? ???? ???
        
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden'); // ????? ???? ?? ??? ??
    } catch (e) {
        console.warn("Modal rendering bypassed an error:", e);
    }
}

function renderFolders() {
    const c = document.getElementById('folder-list-container'); 
    if (!c) return;
    c.innerHTML = '';
    
    // ?????? ?? ????? ???????
    if (!folders || !Array.isArray(folders)) folders = ['Personal', 'Work', 'Finance'];
    
    folders.forEach(f => {
        const div = document.createElement('div'); 
        div.className = `folder-sub-item ${currentFolder === f ? 'active' : ''}`; 
        div.onclick = () => setCategory('folder', div, f);
        
        div.setAttribute('draggable', 'false'); 
        div.setAttribute('ondragover', 'allowDrop(event)'); 
        // ????????? ??? ??????? ???? ??????? ?? ????? ?? HTML
        const safeFolderName = f.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        div.setAttribute('ondrop', `dropToFolder(event, '${safeFolderName}')`); 
        div.setAttribute('ondragenter', 'dragEnter(event)'); 
        div.setAttribute('ondragleave', 'dragLeave(event)');
        
        div.innerHTML = `
            <span class="truncate pr-2 font-bold select-none">${f}</span>
            <button onclick="showFolderMenu(event, this, '${safeFolderName}')" class="opacity-60 hover:opacity-100 flex-shrink-0 cursor-pointer border-none bg-transparent">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
            </button>
        `;
        c.appendChild(div);
    });
}

function promptCreateFolder(ev) { 
    if (ev) ev.stopPropagation(); 
    const inputEl = document.getElementById('create-folder-input');
    if (inputEl) inputEl.value = ''; 
    
    // ???????? ???? ?????? ?? ??? ?? ??????
    safeShowModal('folder-create-modal');
}

async function submitCreateFolder() { 
    const inputEl = document.getElementById('create-folder-input');
    if (!inputEl) return;
    
    const n = inputEl.value.trim(); 
    if (!n) return;
    
    if (folders.includes(n)) {
        if (typeof showVnsAlert === 'function') showVnsAlert("Warning", "Folder already exists.", "warning");
        return;
    }
    
    folders.push(n); 
    renderFolders(); 
    await saveItemsToStorage(); 
    if (typeof closeModals === 'function') closeModals(); 
    
    if (typeof showVnsAlert === 'function') {
        showVnsAlert("Success", "Storage folder created successfully.", "success");
    }
}

function showFolderMenu(ev, el, f) { 
    if (ev) ev.stopPropagation(); 
    selectedFolderForMenu = f; 
    
    const m = document.getElementById('folder-menu'); 
    if (!m) return;
    const r = el.getBoundingClientRect(); 
    m.style.left = (r.right - 110) + 'px'; 
    m.style.top = r.top + 'px'; 
    m.style.display = 'block'; 
}

function handleRenameFolder() { 
    const m = document.getElementById('folder-menu');
    if (m) m.style.display = 'none'; 
    
    const inputEl = document.getElementById('rename-folder-input');
    if (inputEl) inputEl.value = selectedFolderForMenu; 
    
    // ???????? ???? ?????? ?? ??? ?? ??????
    safeShowModal('folder-rename-modal');
}

async function submitRenameFolder() { 
    const inputEl = document.getElementById('rename-folder-input');
    if (!inputEl) return;
    
    const n = inputEl.value.trim(); 
    if (!n || folders.includes(n)) return;
    
    items.forEach(x => { if (x.folder === selectedFolderForMenu) x.folder = n; }); 
    folders = folders.map(x => x === selectedFolderForMenu ? n : x); 
    if (currentFolder === selectedFolderForMenu) currentFolder = n; 
    
    await saveItemsToStorage(); 
    renderFolders(); 
    if (typeof renderList === 'function') renderList(); 
    if (typeof closeModals === 'function') closeModals(); 
    
    if (typeof showVnsAlert === 'function') {
        showVnsAlert("Success", "Folder renamed successfully.", "success");
    }
}

function handleDeleteFolder() { 
    const m = document.getElementById('folder-menu');
    if (m) m.style.display = 'none'; 
    
    // ???????? ???? ?????? ?? ??? ?? ??????
    safeShowModal('folder-delete-modal');
}

async function submitDeleteFolder() { 
    items.forEach(x => { if (x.folder === selectedFolderForMenu) x.folder = ''; }); 
    folders = folders.filter(x => x !== selectedFolderForMenu); 
    if (currentFolder === selectedFolderForMenu) currentFolder = null; 
    
    await saveItemsToStorage(); 
    renderFolders(); 
    if (typeof renderList === 'function') renderList(); 
    if (typeof closeModals === 'function') closeModals(); 
    
    if (typeof showVnsAlert === 'function') {
        showVnsAlert("Deleted", "Folder purged successfully.", "success");
    }
}

/*********************************FINAL ADDING FOLDER******************************/

function toggleFolderDropdown(ev) { ev.stopPropagation(); const d = document.getElementById('folder-dropdown'); if (d.style.display === 'block') { d.style.display = 'none'; return; } d.innerHTML = '<div class="dropdown-item font-black text-vns uppercase tracking-wider text-[11px]" onclick="selectFolderForm(\'\')">(Clear Folder Association)</div>'; folders.forEach(f => { const row = document.createElement('div'); row.className = 'dropdown-item font-bold text-slate-700'; row.innerText = f; row.onclick = () => selectFolderForm(f); d.appendChild(row); }); d.style.display = 'block'; }
function selectFolderForm(f) { document.getElementById('i-folder').value = f; document.getElementById('folder-dropdown').style.display = 'none'; }
/*+++++++++++++++++++++++++++++++++++STR RENDERLIST++++++++++++++++++++++++++++++++++*/

function toggleCredentialSelect(id, ev) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    id = String(id);
    if (selectedCredentialIds.has(id)) selectedCredentialIds.delete(id);
    else selectedCredentialIds.add(id);
    updateCredBulkBar();
    var cb = document.getElementById('cred-cb-' + id);
    if (cb) cb.checked = selectedCredentialIds.has(id);
    var row = document.querySelector('.password-item[data-id="' + id + '"]');
    if (row) row.classList.toggle('cred-selected', selectedCredentialIds.has(id));
}

function selectAllCredentials() {
    var boxes = document.querySelectorAll('.password-item[data-id]');
    var total = boxes.length;
    var selected = 0;
    boxes.forEach(function (row) {
        var id = row.getAttribute('data-id');
        if (id && selectedCredentialIds.has(String(id))) selected++;
    });
    // Dual-purpose: if all visible selected -> clear; else select all
    if (total > 0 && selected >= total) {
        clearCredentialSelection();
        return;
    }
    boxes.forEach(function (row) {
        var id = row.getAttribute('data-id');
        if (!id) return;
        selectedCredentialIds.add(String(id));
        var cb = document.getElementById('cred-cb-' + id);
        if (cb) cb.checked = true;
        row.classList.add('cred-selected');
    });
    updateCredBulkBar();
}

function clearCredentialSelection() {
    selectedCredentialIds.clear();
    updateCredBulkBar();
    document.querySelectorAll('.password-item.cred-selected').forEach(function (el) { el.classList.remove('cred-selected'); });
    document.querySelectorAll('.cred-select-cb').forEach(function (el) { el.checked = false; });
}

function updateCredBulkBar() {
    var bar = document.getElementById('cred-bulk-bar');
    if (!bar) {
        var list = document.getElementById('item-list');
        if (!list || !list.parentElement) return;
        bar = document.createElement('div');
        bar.id = 'cred-bulk-bar';
        bar.className = 'cred-bulk-bar hidden';
        bar.innerHTML =
            '<div class="cred-bulk-actions">' +
            '<button type="button" id="cred-bulk-toggle" class="cred-bulk-btn select-all" onclick="selectAllCredentials()">Select All</button>' +
            '<button type="button" class="cred-bulk-btn delete" onclick="deleteSelectedCredentials()">Delete</button>' +
            '<span id="cred-bulk-count" class="cred-bulk-count">0</span>' +
            '</div>';
        list.parentElement.insertBefore(bar, list);
    }

    var n = selectedCredentialIds.size;
    var visible = document.querySelectorAll('.password-item[data-id]').length;
    var c = document.getElementById('cred-bulk-count');
    if (c) c.textContent = n > 0 ? (n + ' selected') : '';
    var toggle = document.getElementById('cred-bulk-toggle');
    if (toggle) {
        if (visible > 0 && n >= visible) {
            toggle.textContent = 'Cancel';
            toggle.classList.add('is-cancel');
        } else {
            toggle.textContent = 'Select All';
            toggle.classList.remove('is-cancel');
        }
    }

    if (n > 0) {
        bar.classList.remove('hidden', 'cred-bulk-idle');
    } else {
        bar.classList.add('hidden');
        bar.classList.remove('cred-bulk-idle');
    }
}

async function deleteSelectedCredentials() {
    if (!selectedCredentialIds.size) return;
    var msg = 'Delete ' + selectedCredentialIds.size + ' selected item(s)?';
    if (!confirm(msg)) return;
    var ids = Array.from(selectedCredentialIds);
    ids.forEach(function (id) {
        var i = items.find(function (x) { return String(x.id) === String(id); });
        if (!i) return;
        if (i.status === 'deleted') {
            items = items.filter(function (x) { return String(x.id) !== String(id); });
        } else {
            i.status = 'deleted';
        }
        if (String(activeId) === String(id)) {
            try { cancelView(); } catch (e) {}
        }
    });
    selectedCredentialIds.clear();
    await saveItemsToStorage();
    renderList();
    if (typeof showVnsAlert === 'function') showVnsAlert('Deleted', 'Selected items moved to trash.', 'success');
}

/*function bindCredSwipe(row, id) {
    if (!row || !('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return;
    var inner = row.querySelector('.cred-swipe-inner');
    if (!inner) return;
    var startX = 0, startY = 0, dx = 0, tracking = false, horizontal = false;

    row.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches.length) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = 0; tracking = true; horizontal = false;
        inner.style.transition = 'none';
    }, { passive: true });

    row.addEventListener('touchmove', function (e) {
        if (!tracking || !e.touches || !e.touches.length) return;
        var x = e.touches[0].clientX;
        var y = e.touches[0].clientY;
        var adx = Math.abs(x - startX);
        var ady = Math.abs(y - startY);
        if (!horizontal && adx > 12 && adx > ady) horizontal = true;
        if (!horizontal) return;
        dx = x - startX;
        // only swipe left to reveal delete
        if (dx > 0) dx = 0;
        if (dx < -96) dx = -96;
        inner.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: true });

    row.addEventListener('touchend', function () {
        if (!tracking) return;
        tracking = false;
        inner.style.transition = 'transform 0.2s ease';
        if (dx < -64) {
            inner.style.transform = 'translateX(-88px)';
            row.classList.add('cred-swiped');
        } else {
            inner.style.transform = 'translateX(0)';
            row.classList.remove('cred-swiped');
        }
        dx = 0;
    }, { passive: true });
}*/
function bindCredSwipe(row, id) {
    if (!row) return;
    var canTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!canTouch) return;
    var inner = row.querySelector('.cred-swipe-inner');
    if (!inner) return;
    var startX = 0, startY = 0, dx = 0, tracking = false, horizontal = false, busy = false;

    function snapBack() {
        inner.style.transition = 'transform 0.18s ease';
        inner.style.transform = 'translateX(0)';
        row.classList.remove('cred-swiped', 'cred-swipe-removing');
    }

    row.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches.length || busy) return;
        if (e.target && e.target.closest &&
            (e.target.closest('.cred-check-wrap') || e.target.closest('.cred-row-actions'))) {
            tracking = false;
            return;
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = 0; tracking = true; horizontal = false;
        inner.style.transition = 'none';
        row.classList.remove('cred-swiped');
    }, { passive: true });

    row.addEventListener('touchmove', function (e) {
        if (!tracking || busy || !e.touches || !e.touches.length) return;
        var x = e.touches[0].clientX;
        var y = e.touches[0].clientY;
        var adx = Math.abs(x - startX);
        var ady = Math.abs(y - startY);
        if (!horizontal && adx > 12 && adx > ady) horizontal = true;
        if (!horizontal) return;
        dx = x - startX;
        if (dx > 0) dx = 0;
        if (dx < -120) dx = -120;
        inner.style.transform = 'translateX(' + dx + 'px)';
        if (dx < -40) row.classList.add('cred-swiped');
        else row.classList.remove('cred-swiped');
    }, { passive: true });

    row.addEventListener('touchend', function () {
        if (!tracking || busy) return;
        tracking = false;
        inner.style.transition = 'transform 0.18s ease';

        if (dx < -56) {
            busy = true;
            // ??? ?? ????? ???? — ???? ???? ??? ???? ???
            var msg = (typeof t === 'function') ? t("confirm_delete_msg") : "Delete this item?";
            var ok = false;
            try { ok = confirm(msg); } catch (err) { ok = false; }

            if (!ok) {
                snapBack();
                busy = false;
                dx = 0;
                return;
            }

            // ????? ?? ? ??????? ? ??? ???? confirm ??????
            row.classList.add('cred-swiped', 'cred-swipe-removing');
            inner.style.transform = 'translateX(-110%)';
            setTimeout(async function () {
                try {
                    var item = items.find(function (x) { return String(x.id) === String(id); });
                    if (item) {
                        if (item.status === 'deleted') {
                            items = items.filter(function (x) { return String(x.id) !== String(id); });
                        } else {
                            item.status = 'deleted';
                        }
                        if (String(activeId) === String(id)) {
                            try { cancelView(); } catch (e) {}
                        }
                        selectedCredentialIds.delete(String(id));
                        await saveItemsToStorage();
                        renderList();
                    } else {
                        snapBack();
                    }
                } catch (e) {
                    snapBack();
                }
                busy = false;
            }, 150);
        } else {
            snapBack();
        }
        dx = 0;
    }, { passive: true });

    row.addEventListener('touchcancel', function () {
        if (busy) return;
        tracking = false;
        snapBack();
        dx = 0;
    }, { passive: true });
}

window.toggleCredentialSelect = toggleCredentialSelect;
window.selectAllCredentials = selectAllCredentials;
window.clearCredentialSelection = clearCredentialSelection;
window.deleteSelectedCredentials = deleteSelectedCredentials;


function renderList() {
    const container = document.getElementById('item-list'); container.innerHTML = '';
     if (currentCategory === 'home' && !globalSearchQuery) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50 select-none pb-24"><svg class="w-16 h-16 text-[#0D9488] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><p class="text-xs font-black text-slate-600 uppercase tracking-widest">${t("home_empty_title")}</p><p class="text-[10px] text-slate-500 mt-2 font-bold max-w-[200px] text-center">${t("home_empty_desc")}</p></div>`; 
    return;
}  
let stream = items;
    if (currentCategory === 'fav') stream = items.filter(x => x.isFavorite && x.status === 'active'); 
    else if (currentCategory === 'pass') stream = items.filter(x => x.status === 'active'); 
    else if (currentCategory === 'arch') stream = items.filter(x => x.status === 'archived'); 
    else if (currentCategory === 'trash') stream = items.filter(x => x.status === 'deleted'); 
    else if (currentCategory === 'folder') stream = items.filter(x => x.folder === currentFolder && x.status === 'active'); 
    else stream = items.filter(x => x.status !== 'deleted'); 
    
    if (globalSearchQuery) { stream = stream.filter(x => (x.name && x.name.toLowerCase().includes(globalSearchQuery)) || (x.user && x.user.toLowerCase().includes(globalSearchQuery)) || (x.site && x.site.toLowerCase().includes(globalSearchQuery)) || (x.note && x.note.toLowerCase().includes(globalSearchQuery)) ); }
/*------------------------------------TRASH-----------------------------------------*/
    // ????? ? ???? ???? ????? ??? ?????
if (currentCategory === 'trash' && stream.length > 0) {
    const emptyBtn = document.createElement('button');
    emptyBtn.className = "w-full mb-3 py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer";
    
    // ??????? ???? ???????? ????
    emptyBtn.innerText = typeof t === 'function' ? t("trash_btn_empty") : "Empty Trash (Delete All Permanently)";
    
    emptyBtn.onclick = async function() {
        const confirmMessage = typeof t === 'function' ? t("trash_confirm_wipe") : "Are you sure you want to permanently erase all deleted items from this vault? This action cannot be undone.";
        
        // ??????? ?? ??? ?????? ? ???? ?????? ??? ??? ??? ???? ????????? ?????????????
        if (confirm(confirmMessage)) {
            // ????? ???? ? ??? ???? ???? ???????? ??? ?????
            items = items.filter(x => x.status !== 'deleted');
            
            // ?????????? ???? ?? ????? ???? ?????? ? ?????Preferences
            await saveItemsToStorage();
            
            // ???? ???? ??? ???? ?????
            renderList();
            
            // ????? ??? ??: ????? ????? ????? ????? ??????????? ???? ???
            const alertTitle = typeof t === 'function' ? (t("cards_alert_success_title") !== "cards_alert_success_title" ? t("cards_alert_success_title") : "Erased") : "Erased";
            const alertMsg = "Trash partition successfully purged. All items have been permanently destroyed.";
            
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(alertTitle, alertMsg, "success");
            } else if (typeof showAlert === 'function') {
                showAlert(alertMsg);
            } else {
                alert(alertMsg);
            }
        }
    };
    container.appendChild(emptyBtn);
}
/*------------------------------------TRASH-----------------------------------------*/
    if (!stream.length) { container.innerHTML = `<div class="p-10 text-center mt-20 text-slate-300 text-xs font-black uppercase tracking-widest">${t("Wor_Emp")}</div>`; return; }                                             
    
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    stream.forEach(x => {
        const div = document.createElement('div');
        div.className = `password-item ${activeId === x.id ? 'active' : ''} ${selectedCredentialIds.has(String(x.id)) ? 'cred-selected' : ''} rounded-2xl mx-3 my-2 border border-slate-100/90 shadow-sm`;
        div.setAttribute('data-id', String(x.id));

        if (!isTouchDevice) {
            div.draggable = true;
            div.ondragstart = (e) => { draggedItemId = x.id; e.dataTransfer.setData("text", x.id); };
        }

        div.style.cssText = "-webkit-touch-callout: none; user-select: none; overflow: hidden; position: relative;";
        div.oncontextmenu = (e) => { e.preventDefault(); showContextMenu(e, x.id); };

        let pressTimer = null;
        div.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) return;
            window.isLongPressing = false;
            let tx = e.touches[0].clientX;
            let ty = e.touches[0].clientY;
            pressTimer = setTimeout(() => {
                window.isLongPressing = true;
                if (navigator.vibrate) navigator.vibrate(40);
                showContextMenu(null, x.id, tx, ty);
            }, 500);
        }, { passive: true });
        div.addEventListener('touchmove', () => { if (pressTimer) clearTimeout(pressTimer); }, { passive: true });
        div.addEventListener('touchend', () => { if (pressTimer) clearTimeout(pressTimer); }, { passive: true });
        div.addEventListener('touchcancel', () => { if (pressTimer) clearTimeout(pressTimer); }, { passive: true });

        const sColor = x.isFavorite ? '#0D9488' : '#cbd5e1'; const sFill = x.isFavorite ? '#0D9488' : 'none';
        let avatarIconFrameMarkup = "";
        if (x.customLogo) { avatarIconFrameMarkup = `<div class="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0"><img src="${x.customLogo}" class="w-full h-full object-cover" /></div>`; }
        else {
            const structuralLayerAMatchSvg = getBrandLogoSvg(x.name || x.site);
            if (structuralLayerAMatchSvg) avatarIconFrameMarkup = `<div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">${structuralLayerAMatchSvg}</div>`;
            else {
                const labelChar = (x.name || "?").trim().charAt(0).toUpperCase(); const dynamicPaletteMixColors = getDeterministicColor(x.name);
                avatarIconFrameMarkup = `<div class="w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm flex-shrink-0 text-white" style="background:linear-gradient(135deg, ${dynamicPaletteMixColors.light}, ${dynamicPaletteMixColors.dark}); border-color:${dynamicPaletteMixColors.dark}20">${labelChar}</div>`;
            }
        }
                const checked = selectedCredentialIds.has(String(x.id)) ? 'checked' : '';
        div.innerHTML =
            '<div class="cred-swipe-bg" aria-hidden="true"></div>' +
            '<div class="cred-swipe-inner">' +
              '<label class="cred-check-wrap" onclick="event.stopPropagation()">' +
                '<input type="checkbox" class="cred-select-cb" id="cred-cb-' + x.id + '" ' + checked +
                ' onchange="toggleCredentialSelect(' + x.id + ', event)">' +
              '</label>' +
              '<div class="cred-row-main" onclick="if(!window.isLongPressing) viewItem(' + x.id + ')">' +
                avatarIconFrameMarkup +
                '<div class="cred-row-text">' +
                  '<p class="text-sm font-black text-slate-700 truncate">' + (x.name || '') + '</p>' +
                  '<p class="text-[10px] text-slate-400 font-black tracking-wider uppercase truncate">' +
                    (x.user || '(Identity Tag Blank)') + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="cred-row-actions" onclick="event.stopPropagation()">' +
                '<button type="button" class="row-action-btn border-none bg-transparent" title="Favorite" ' +
                'onclick="toggleFavorite(' + x.id + ', event)">' +
                  '<svg class="w-4 h-4" fill="' + sFill + '" stroke="' + sColor +
                  '" stroke-width="2.5" viewBox="0 0 24 24">' +
                  '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>';
        container.appendChild(div);
        bindCredSwipe(div, x.id);
        });
    updateCredBulkBar();
}


/*+++++++++++++++++++++++++++++++++++END RENDERLIST++++++++++++++++++++++++++++++++++*/
function showAddForm() { 
    activeId = null; resetFields(); removeCustomLogo(null); switchUI('add');
    
    const radioBackup = document.querySelector('input[name="payload-type"][value="backup"]');
    if (radioBackup) { radioBackup.checked = true; switchPayloadField('backup'); }
    
    const passInput = document.getElementById('i-pass');
    if (passInput) checkRealTimePasswordStatus('');

    toggleMainSectionMobile(true);
}

function cancelView() {
    document.getElementById('form-container').classList.add('hidden'); 
    document.getElementById('settings-container').classList.add('hidden'); 
    
    const policyContainer = document.getElementById('policy-container');
    if (policyContainer) policyContainer.classList.add('hidden');
    
    document.getElementById('view-placeholder').classList.remove('hidden'); 
    activeId = null; 
    renderList();
    toggleMainSectionMobile(false);
}
function resetFields() { ['i-name', 'i-folder', 'i-user', 'i-pass', 'i-backup', 'i-site', 'i-note'].forEach(id => { const el = document.getElementById(id); el.value = ''; el.disabled = false; if (id === 'i-pass') el.type = 'password'; if (id === 'i-backup') { el.classList.add('backup-masked'); el.style.height = 'auto'; } }); }

const originalViewItem = viewItem;
viewItem = function(id) {
    if (typeof originalViewItem === 'function') originalViewItem(id);
    const item = items.find(x => x.id === id);
    if (item && item.backup) {
        const isSSH = item.backup.includes("BEGIN") || item.backup.includes("ssh-") || item.backup.includes("PRIVATE KEY");
        const radioSSH = document.querySelector('input[name="payload-type"][value="ssh"]'); const radioBackup = document.querySelector('input[name="payload-type"][value="backup"]');
        if (isSSH && radioSSH) { radioSSH.checked = true; switchPayloadField('ssh'); } else if (radioBackup) { radioBackup.checked = true; switchPayloadField('backup'); }
    }
};

const originalShowAddForm = showAddForm;
showAddForm = function() {
    if (typeof originalShowAddForm === 'function') originalShowAddForm();
    const radioBackup = document.querySelector('input[name="payload-type"][value="backup"]');
    if (radioBackup) { radioBackup.checked = true; switchPayloadField('backup'); }
};

     /*-------------------------------STR Backup keys 2-------------------------------*/
function initializeBackupUI() {
    const displayEl = document.getElementById('manual-path-display');
    if (!displayEl) return;

    const currentPath = localStorage.getItem('vns_linked_folder_name');
    
    if (currentPath && currentPath !== 'None') {
        // ??? ???? ?? ???? ??????? ????? ????? ?? ?? ??? ??
        displayEl.innerText = currentPath; 
        displayEl.className = "w-full p-3 border rounded-xl text-center font-bold text-xs text-green-700 bg-green-100 border-green-300 transition-all";
        displayEl.removeAttribute('data-i18n');
    } else {
        // ??? ???? ???? ???? ????? ??? ??????? ????? ??????? ??? ?? ?????
        displayEl.className = "w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-bold text-xs text-slate-400 mb-3 transition-all";
        displayEl.setAttribute('data-i18n', 'system_inactive');
        if (typeof t === 'function') {
            displayEl.innerText = t("system_inactive");
        } else {
            displayEl.innerText = "System Route Inactive";
        }
    }
}
// ?. ?????????? ??????? ?? ???? ??? ??? ?????? (UI Sync)
// ????? ?????????? ?? ??? ??? ??? ??????
window.addEventListener('DOMContentLoaded', () => {
    initializeBackupUI();
});

// ?. ???? ????? ????? (???? ??? ? ???? ?? ????? ?????)
async function handleSave() {
    const n = document.getElementById('i-name').value.trim();
    if (!n) return; // ??? ??? ???? ??? ????? ???

    let existingItem = null;
    let oldPasswordHistory = [];
    
    // ????? ??????? ????? (Password History)
    if (typeof activeId !== 'undefined' && activeId) {
        existingItem = items.find(x => x.id === activeId);
        if (existingItem) {
            oldPasswordHistory = existingItem.passwordHistory || [];
            const currentPassValue = document.getElementById('i-pass').value;
            if (existingItem.pass && existingItem.pass !== currentPassValue) {
                const now = new Date();
                const timeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
                oldPasswordHistory.unshift({ pass: existingItem.pass, date: timeString });
                // ??? ????? ??? 3 ??? ???
                if (oldPasswordHistory.length > 3) {
                    oldPasswordHistory = oldPasswordHistory.slice(0, 3);
                }
            }
        }
    }

    const payload = {
        id: (typeof activeId !== 'undefined' && activeId) ? activeId : Date.now(),
        name: n,
        folder: document.getElementById('i-folder').value,
        user: document.getElementById('i-user').value,
        pass: document.getElementById('i-pass').value,
        backup: document.getElementById('i-backup').value,
        site: document.getElementById('i-site').value,
        note: document.getElementById('i-note').value,
        isFavorite: existingItem ? existingItem.isFavorite : false,
        status: existingItem ? existingItem.status : 'active',
        customLogo: typeof currentCustomLogoB64 !== 'undefined' ? currentCustomLogoB64 : null,
        passwordHistory: oldPasswordHistory
    };

    // ????? ???? ?? ????? ???? ???? ?? ????
    if (typeof activeId !== 'undefined' && activeId) {
        items[items.findIndex(x => x.id === activeId)] = payload;
    } else {
        items.push(payload);
    }

    // Same service name â†’ share uploaded logo across matching items (e.g. all Hotmail)
    if (payload.customLogo) {
        propagateCustomLogoToMatchingItems(payload);
    }

    // ?? ????? ?? ??????? (???? saveItemsToStorage ?? ?? ??? ? ???? ????? ???? ????? ?????? ?? ???????)
    await saveItemsToStorage(); 
    
    // ???? ???? ???? ? ???? ???
    if (typeof renderList === 'function') renderList();
    if (typeof scrubMemoryOnlyDOM === 'function') scrubMemoryOnlyDOM();
    if (typeof viewItem === 'function') viewItem(payload.id);
}
     /*-------------------------------END Backup keys 2-------------------------------*/
function switchUI(mode) {
    document.getElementById('view-placeholder').classList.add('hidden'); 
    document.getElementById('settings-container').classList.add('hidden'); 
    
    const policyContainer = document.getElementById('policy-container');
    if (policyContainer) policyContainer.classList.add('hidden');
    
    document.getElementById('form-container').classList.remove('hidden');
    
    const saveBtn = document.getElementById('btn-save'); const editBtn = document.getElementById('btn-edit'); const genBtn = document.getElementById('gen-trigger-btn');
    const fields = ['i-name', 'i-user', 'i-pass', 'i-backup', 'i-site', 'i-note'];
    if (mode === 'add' || mode === 'edit') {
        saveBtn.classList.remove('hidden'); editBtn.classList.add('hidden'); fields.forEach(id => document.getElementById(id).disabled = false); genBtn.style.display = 'block';
    } else {
        saveBtn.classList.add('hidden'); editBtn.classList.remove('hidden'); fields.forEach(id => document.getElementById(id).disabled = true); genBtn.style.display = 'none';
    }
}
document.getElementById('btn-edit').onclick = () => switchUI('edit');
function openGen() { 
    try {
        const overlay = document.getElementById('gen-overlay');
        const modal = document.getElementById('gen-modal');
        
        if (overlay) overlay.classList.remove('hidden'); 
        if (modal) modal.classList.remove('hidden'); 
        
        generateLogic(); 
    } catch (err) {
        console.error("Open Generator Error:", err);
    }
}

/* ==========================================================================
   MODIFIED: GENERATE LOGIC WITH LIVE INTER-FORM FIELD RE-SYNC CHAIN (app.js)
   ========================================================================== */
function generateLogic() {
    const len = parseInt(document.getElementById('g-len').value) || 16; const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    let pass = ""; for (let i = 0; i < len; i++) pass += pool.charAt(Math.floor(Math.random() * pool.length)); document.getElementById('g-res').value = pass;
}

function applyGen() { document.getElementById('i-pass').value = document.getElementById('g-res').value; closeModals(); }

function copyValue(id) { const el = document.getElementById(id); if (el && el.value) copyValueDirectText(el.value); }
function copyValueText(id) { const el = document.getElementById(id); if (el) copyValueDirectText(el.innerText || el.textContent); }

async function copyValueDirectText(text) {
    expectedClipboardValue = text;
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); showAlert (t("Sensitive_title")); }
        else { fallbackCopyText(text); showAlert (t("Sensitive_title")); }
    }catch (err) { fallbackCopyText(text); showAlert (t("Sensitive_title")); }
    
  
    if (clipboardClearTimeout) clearTimeout(clipboardClearTimeout);
    clipboardClearTimeout = setTimeout(async () => {
        try {
            let currentClip = ""; try { if (navigator.clipboard && navigator.clipboard.readText) currentClip = await navigator.clipboard.readText(); } catch (e) {}
            if (currentClip === expectedClipboardValue || currentClip === "") { if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(""); else fallbackCopyText(""); showAlert (t("Clipboard_wipe_msg")); }
        } catch (err) {}
    }, 30000);
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
}

function handleKeyFileUpload(ev) {
    const file = ev.target.files[0]; if (!file) return;
    const r = new FileReader(); 
    r.onload = (e) => {
        const result = e.target.result;
        if (!result) return showAlert("Failed to read file payload.");
        const lines = result.split(/\r?\n/); const parsed = [];
        lines.forEach(line => { const match = line.match(/^\s*\d+\.\s+([a-zA-Z]+)/); if (match && match[1]) parsed.push(match[1].toLowerCase()); });
        if (parsed.length === 0) { 
            const words = result.match(/[a-zA-Z]+/g) || []; 
            const ignoreWords = ['vns', 'vault', 'system', 'recovery', 'key', 'matrix', 'keys', 'elements']; 
            parsed.push(...words.filter(w => w.length >= 3 && !ignoreWords.includes(w.toLowerCase()))); 
        }
        
        setTimeout(() => {
            parsed.slice(0, 12).forEach((w, idx) => { 
                const el = document.getElementById(`import-word-${idx + 1}`); 
                if (el) { el.value = w.toLowerCase(); el.dispatchEvent(new Event('input', { bubbles: true })); }
            });
            if (parsed.length > 0) showAlert(t("backup_document_loaded").replace("{count}", Math.min(parsed.length, 12)));
          
            ev.target.value = ''; 
        }, 100);
    }; 
    r.readAsText(file);
}

function switchSettingsTab(tab) {
    ['username', 'security', 'autolock', 'data'].forEach(t => {
        const c = document.getElementById(`settings-tab-${t}`); const b = document.getElementById(`tab-btn-${t}`);
        if (t === tab) { c.classList.remove('hidden'); b.className = "settings-tab-btn px-4 py-2 bg-orange-50 text-[#0D9488] rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wide transition border-none outline-none cursor-pointer"; }
        else { c.classList.add('hidden'); b.className = "settings-tab-btn px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wide transition border-none outline-none cursor-pointer"; }
    });
}
function openMyAccountSettings(event) {
    if (event) event.stopPropagation(); 
    if (typeof closeProfileDropdown === 'function') closeProfileDropdown();
    
    const masterStr = localStorage.getItem('vns_master_user');
    if (!masterStr) return;
    const master = JSON.parse(masterStr); 

    // ØªÙ†Ø¸ÛŒÙ… Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ ÙØ¹Ù„ÛŒ
    const currUserEl = document.getElementById('sett-curr-user');
    if (currUserEl) currUserEl.value = master.username;

    // Ù¾Ø§Ú©â€ŒØ³Ø§Ø²ÛŒ ÙÛŒÙ„Ø¯Ù‡Ø§ÛŒ Ù…ØªÙ†ÛŒ ÙˆØ±ÙˆØ¯ÛŒ
    ['sett-new-user', 'sett-curr-pass', 'sett-new-pass', 'sett-confirm-pass', 'sett-user-2fa', 'sett-pass-2fa', 'sett-2fa-verify-input', 'sett-2fa-disable-input'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
    });

    // ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÙ†â€ŒÚ©Ø¯
    const toggleEl = document.getElementById('sett-passcode-toggle');
    if (toggleEl) {
        toggleEl.checked = master.isPasscodeEnabled || false; 
        if (typeof togglePasscodeSetupFields === 'function') {
            togglePasscodeSetupFields(master.isPasscodeEnabled || false);
        }
    }
    
    const user2faSect = document.getElementById('sett-username-2fa-section'); 
    if (user2faSect) { 
        if (master.is2faEnabled) {
            user2faSect.classList.remove('hidden');
        } else {
            user2faSect.classList.add('hidden');
        }
    }

    // ØªÙ†Ø¸ÛŒÙ… Ù„ÛŒØ¨Ù„â€ŒÙ‡Ø§ Ùˆ ÙˆØ¶Ø¹ÛŒØª Û²FA
    const label = document.getElementById('sett-2fa-status-label'); 
    const dot = document.getElementById('sett-2fa-status-dot');
    const banner = document.getElementById('sett-2fa-status-banner'); 
    const sBox = document.getElementById('sett-2fa-setup-box'); 
    const dBox = document.getElementById('sett-2fa-disable-box');

    if (master.is2faEnabled) {
        if (label) { 
            label.innerText = typeof t === 'function' ? t("auth_channel_active") : "ACTIVE"; 
            label.className = "text-green-600 font-black"; 
        }
        if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-green-500";
        if (banner) banner.className = "p-3.5 rounded-2xl border border-green-200 bg-green-50/30 font-bold text-xs flex items-center justify-between";
        
        if (sBox) sBox.classList.add('hidden'); 
        if (dBox) dBox.classList.remove('hidden'); 
        
        simulated2faSecret = master.twoFactorSecret; 
        const keyEl = document.getElementById('sett-2fa-secret-key');
        if (keyEl) keyEl.innerText = master.twoFactorSecret;
    } else {
        if (label) { 
            label.innerText = typeof t === 'function' ? t("sett_2fa_status_unprotected") : "UNPROTECTED"; 
            label.className = "text-red-500 font-black"; 
        }
        if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
        if (banner) banner.className = "p-3.5 rounded-2xl border border-red-200 bg-red-50/30 font-bold text-xs flex items-center justify-between";
        
        // ðŸŸ¢ Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ø² Ø­Ø°Ù hidden Ø§Ø² Ø¨Ø§Ú©Ø³ ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ
        if (sBox) sBox.classList.remove('hidden'); 
        if (dBox) dBox.classList.add('hidden'); 
        
        if (typeof generateNew2faSecret === 'function') generateNew2faSecret();
    } 
    
    const autoLockSelect = document.getElementById('sett-autolock-select');
    if (autoLockSelect) autoLockSelect.value = autolockDuration.toString(); 

    const folderNameEl = document.getElementById('settings-folder-name');
    if (folderNameEl) folderNameEl.innerText = localStorage.getItem('vns_linked_folder_name') || 'None Link Tracked';

    // Ù†Ù…Ø§ÛŒØ´ Ú©Ø§Ù†ØªÛŒÙ†Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    document.getElementById('view-placeholder').classList.add('hidden'); 
    document.getElementById('form-container').classList.add('hidden'); 
    document.getElementById('settings-container').classList.remove('hidden');
    
    const policyContainer = document.getElementById('policy-container');
    if (policyContainer) policyContainer.classList.add('hidden');
    
    if (typeof toggleMainSectionMobile === 'function') { 
        toggleMainSectionMobile(true); 
    }

    if (typeof initializeBackupUI === 'function') initializeBackupUI();
    if (typeof updateBackupTimeUI === 'function') updateBackupTimeUI();
    
    // Ø±Ù†Ø¯Ø± Ø³Ø§Ø®ØªØ§Ø± QR Ùˆ Ú©Ø¯Ù‡Ø§ÛŒ Ø±ÛŒÚ©Ø§ÙˆØ±ÛŒ
    if (typeof mRenderGoogleAuthSetup === 'function') {
        mRenderGoogleAuthSetup();
    }

    // ðŸŸ¢ Ø§ØµÙ„Ø§Ø­ Ù…Ù‡Ù…: Ø³ÙˆØ¦ÛŒÚ† Ø¨Ù‡ ØªØ¨ Ø§Ù…Ù†ÛŒØª Ùˆ Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø®ÙˆØ¯Ú©Ø§Ø± Ú©Ø´ÙˆÛŒ Ø¢Ú©Ø§Ø±Ø¯Ø¦ÙˆÙ†ÛŒ Û²FA
    if (typeof switchSettingsTab === 'function') {
        switchSettingsTab('security');
    }
    
    // Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† ØµØ±ÛŒØ­ Ø¢Ú©Ø§Ø±Ø¯Ø¦ÙˆÙ† TOTP Ø¨Ø±Ø§ÛŒ Ø¯Ø³ØªØ±Ø³ÛŒ Ùˆ Ú©Ù„ÛŒÚ©â€ŒÙ¾Ø°ÛŒØ±ÛŒ Ø¯Ú©Ù…Ù‡
    if (typeof toggleCipherAccordion === 'function') {
        toggleCipherAccordion('cipher-sec-totp');
    }
}

/* ==========================================================================
   UPDATED: ENABLE 2FA WITH EMERGENCY RECOVERY CODES SAVER
   ========================================================================== */
async function enableTwoFactorFromSettings() {
    try {
        const masterStr = localStorage.getItem('vns_master_user'); 
        if (!masterStr) return;
        const master = JSON.parse(masterStr);

        const tokenInputEl = document.getElementById('sett-2fa-verify-input');
        const tokenInput = tokenInputEl ? tokenInputEl.value.trim() : '';
        
        if (!tokenInput || tokenInput.length !== 6) {
            showAlert("Please enter a valid 6-digit TOTP code.");
            return;
        }

        // ðŸŸ¢ Ø®ÙˆØ§Ù†Ø¯Ù† Ø§Ù…Ù† Ú©Ù„ÛŒØ¯ Ù…Ø®ÙÛŒ Ù…Ø³ØªÙ‚ÛŒÙ…Ø§Ù‹ Ø§Ø² Ø±ÙˆÛŒ Ø§Ù„Ù…Ø§Ù† Ù…ØªÙ†ÛŒ ØµÙØ­Ù‡ ÛŒØ§ Ù…ØªØºÛŒØ± Ø³Ø±Ø§Ø³Ø±ÛŒ
        const secretKeyEl = document.getElementById('sett-2fa-secret-key');
        const activeSecret = (secretKeyEl && secretKeyEl.innerText.trim().length > 0) 
            ? secretKeyEl.innerText.trim() 
            : simulated2faSecret;

        if (!activeSecret) {
            showAlert("Error: Secret key is missing. Please refresh setup.");
            return;
        }

        // Ø¨Ø±Ø±Ø³ÛŒ ØªÙˆÚ©Ù† Ø¨Ø§ Ø¨Ø§Ø²Ù‡ Ø²Ù…Ø§Ù†ÛŒ ØªÙ„Ø±Ø§Ù†Ø³ Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡â€ŒØ§ÛŒ (Ø¨Ø±Ø§ÛŒ Ø¬Ù„ÙˆÚ¯ÛŒØ±ÛŒ Ø§Ø² Ø®Ø·Ø§ÛŒ Ø§Ø®ØªÙ„Ø§Ù Ø³Ø§Ø¹Øª)
        const epoch = Math.round(new Date().getTime() / 1000);
        let isValidToken = false;

        for (let offset = -300; offset <= 300; offset += 30) {
            const generated = await generateTOTP(activeSecret, epoch + offset);
            if (tokenInput === generated) {
                isValidToken = true;
                break;
            }
        }

        if (isValidToken) {
            master.is2faEnabled = true; 
            master.twoFactorSecret = activeSecret; 

            if (window.mCurrentPendingRecoveryCodes && window.mCurrentPendingRecoveryCodes.length > 0) {
                master.recoveryCodes = window.mCurrentPendingRecoveryCodes;
            } else if (!master.recoveryCodes || master.recoveryCodes.length === 0) {
                if (typeof mGenerateEmergencyRecoveryCodes === 'function') {
                    master.recoveryCodes = mGenerateEmergencyRecoveryCodes();
                }
            }

            localStorage.setItem('vns_master_user', JSON.stringify(master)); 

            showAlert("Google Authenticator protection is now live and enforced.");

            if (typeof openMyAccountSettings === 'function') openMyAccountSettings(); 
            if (typeof switchSettingsTab === 'function') switchSettingsTab('security'); 
        } else {
            showAlert("The 2FA token provided is incorrect or expired.");
        }
    } catch (err) {
        console.error("2FA Activation Fault: ", err);
        showAlert("Activation error: " + err.message);
    }
}
window.enableTwoFactorFromSettings = enableTwoFactorFromSettings;
/*------------------------------END ENABLE TWO FACTOR------------------------------*/
async function disableTwoFactorFromSettings() {
    const inputVal = document.getElementById('sett-2fa-disable-input').value.trim();
    if (!inputVal) {
        if (typeof showVnsAlert === 'function') showVnsAlert("Warning", "Verification input cannot be vacant.", "warning");
        else showAlert(typeof t === 'function' ? t("system_halt") : "Verification input required.");
        return;
    }

    const masterStr = localStorage.getItem('vns_master_user');
    if (!masterStr) return;
    const master = JSON.parse(masterStr);

    let isVerified = false;

    // ????? ?? ???? ???? ? ???? ???????? ?????
    if (/^\d{6}$/.test(inputVal) && master.twoFactorSecret) {
        const epoch = Math.round(new Date().getTime() / 1000);
        if (inputVal === await generateTOTP(master.twoFactorSecret, epoch) ||
            inputVal === await generateTOTP(master.twoFactorSecret, epoch - 30) ||
            inputVal === await generateTOTP(master.twoFactorSecret, epoch + 30)) {
            isVerified = true;
        }
    }

    // ????? ?? ???? ??? ???? ???? ?? ???? ???? ???? ????? ?? ??? ????
    if (!isVerified) {
        try {
            const salt = new Uint8Array(base64ToBuf(master.salt));
            const derivedKey = await deriveKeyFromPassword(inputVal, salt);
            
            if (master.isLegacy || master.encryptedMnemonic) {
                const decMnemonicStr = await decryptData(master.encryptedMnemonic, derivedKey);
                if (decMnemonicStr) isVerified = true;
            } else {
                const verification = await decryptData(master.verificationBlock, derivedKey);
                if (verification === "VNS_VERIFIED") isVerified = true;
            }
        } catch (e) {
            console.warn("Alternative pass verification bypassed.");
        }
    }

    if (isVerified) {
        master.is2faEnabled = false;
        master.twoFactorSecret = "";
        localStorage.setItem('vns_master_user', JSON.stringify(master));
        
        // ?????????? ??? ??? ???? ??????? ?? ???? ???? ?? Unprotected ?? ?? ????????
        const label = document.getElementById('sett-2fa-status-label'); 
        const dot = document.getElementById('sett-2fa-status-dot');
        const banner = document.getElementById('sett-2fa-status-banner');
        
        if (label) { label.innerText = typeof t === 'function' ? t("sett_2fa_status_unprotected") : "UNPROTECTED"; label.className = "text-red-500 font-black"; }
        if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
        if (banner) banner.className = "p-3.5 rounded-2xl border border-red-200 bg-red-50/30 font-bold text-xs flex items-center justify-between";

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("2FA Deactivated", "Two-factor authenticator channel has been disabled safely.", "success");
        } else {
            showAlert(typeof t === 'function' ? t("completely_disabled") : "2FA completely disabled.");
        }
        
        openMyAccountSettings();
        switchSettingsTab('security');
    } else {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Access Denied", "Provided credentials or token did not match encryption keys.", "error");
        } else {
            showAlert(typeof t === 'function' ? t("access_denied.") : "Access denied.");
        }
    }
}

/* ==========================================================================
   ENHANCED: SAVE USERNAME WITH NATIVE BIOMETRICS & MASTER AUTHENTICATION
   ========================================================================== */
async function saveAccountUsername() {
    const masterStr = localStorage.getItem('vns_master_user');
    if (!masterStr) return;
    const master = JSON.parse(masterStr);

    const nu = document.getElementById('sett-new-user').value.trim();
    if (!nu) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Warning", typeof t === 'function' ? t("username_empty") : "Username cannot be empty.", "warning");
        } else {
            showAlert("Username cannot be empty.");
        }
        return;
    }

    let isAuthorized = false;

    // ?. ??? ?? ????? ???? ???????? (??? ????? / ????? ????) ?? ???? ???? ???? ??? ??????
    if (master.biometricCredentialId && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeBiometric) {
        try {
            await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
                reason: "Authorize Username Modification",
                title: "Confirm Identity",
                subtitle: "VNS Security Vault",
                description: "Scan fingerprint or face to authorize profile changes.",
                useFallback: true,
                negativeButtonText: "Use Password"
            });
            isAuthorized = true; // ????? ???? ?? ??? ????? ?? ????
        } catch (bioErr) {
            console.warn("Biometric authorization bypassed/failed:", bioErr);
            isAuthorized = false; // ???? ?? ????? ??? (????? ????)
        }
    }

    // ?. ??? ???????? ????? ??? ?? ????? ????? ?? ???? ???? ?FA ?? ??? ????
    if (!isAuthorized) {
        if (master.is2faEnabled) {
            const tCode = document.getElementById('sett-user-2fa')?.value.trim();
            if (!tCode) {
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert("Authentication Required", "Please enter 6-digit TOTP Code or use Biometrics to authorize change.", "warning");
                } else {
                    showAlert("Authentication code required.");
                }
                return;
            }

            const epoch = Math.round(new Date().getTime() / 1000);
            if (tCode === await generateTOTP(master.twoFactorSecret, epoch) || 
                tCode === await generateTOTP(master.twoFactorSecret, epoch - 30) || 
                tCode === await generateTOTP(master.twoFactorSecret, epoch + 30)) {
                isAuthorized = true;
            } else {
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert("Access Denied", "Invalid TOTP verification code.", "error");
                } else {
                    showAlert("Invalid verification code.");
                }
                return;
            }
        } else {
            // ??? ? ??????? ???? ???? ? ???????? ?? ??? ???? ????? ?????? ?? ??????? ??????? ???
            isAuthorized = true; 
        }
    }

    // ?. ????? ????? ??????? ? ???? ??? ???? ????? ???? ?? ??????? ????
    if (isAuthorized) {
        master.username = nu;
        localStorage.setItem('vns_master_user', JSON.stringify(master));

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Identity Updated", "Account designation updated successfully. Force re-locking partition...", "success");
        } else {
            showAlert("Username updated. Re-locking...");
        }

        setTimeout(() => {
            if (typeof handleLogout === 'function') handleLogout();
        }, 1500);
    }
}

async function saveAccountPassword() {
    try {
        const masterStr = localStorage.getItem('vns_master_user');
        if (!masterStr) {
            showAlert("Error: Vault account profile metadata is missing.");
            return;
        }
        let master = JSON.parse(masterStr);
        
        const cur = document.getElementById('sett-curr-pass').value;
        const np = document.getElementById('sett-new-pass').value.trim();
        const cp = document.getElementById('sett-confirm-pass').value.trim();
        
        const toggleEl = document.getElementById('sett-passcode-toggle');
        const isPinToggleActive = toggleEl ? toggleEl.checked : false;
        
        // ????? ??? ??? ?: ???? ?????? ???? ???? ????? ???? ????? ???? ??? ????????? ??????
        if (!cur) {
            if (isPinToggleActive) {
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert(
                        "Authentication Required", 
                        "To activate or modify the 6-Digit Quick Bypass PIN, you must enter your current Master Password in the field above for verification.", 
                        "warning"
                    );
                } else {
                    showAlert("To activate the 6-Digit PIN, you must enter your current Master Password above.");
                }
            } else {
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert("Authentication Required", "Please enter your current master password to authorize modifications.", "warning");
                } else {
                    showAlert("Please enter your current master password to authorize modifications.");
                }
            }
            return;
        }

        // ?. ?????????? ????? ???? ????? ??? ????? ?????? ?? ???????
        const salt = new Uint8Array(base64ToBuf(master.salt));
        const curKey = await deriveKeyFromPassword(cur, salt);
        
        let isVerified = false;
        if (master.isLegacy || master.encryptedMnemonic) {
            const decMnemonicStr = await decryptData(master.encryptedMnemonic, curKey);
            if (decMnemonicStr) isVerified = true;
        } else {
            const verificationResult = await decryptData(master.verificationBlock, curKey);
            if (verificationResult === "VNS_VERIFIED") isVerified = true;
        }

        if (!isVerified) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Access Denied", "Current Master Password validation failed. Unauthorized changes.", "error");
            } else {
                showAlert("Current Master Password validation failed.");
            }
            return;
        }

        // ?. ?????? ?????????? ??????? ?? ???? ?? ???? ??? ????
        if (np) {
            if (np !== cp) {
                showAlert("New password fields do not match.");
                return;
            }
            if (np.length < 8) {
                showAlert("New Master Password must be at least 8 characters long.");
                return;
            }
            if (/(.)\1\1/.test(np)) {
                showAlert("New password violates criteria: Max 2 consecutive repetitions allowed.");
                return;
            }

            const nSalt = window.crypto.getRandomValues(new Uint8Array(16));
            master.salt = bufToBase64(nSalt);
            
            const nKey = await deriveKeyFromPassword(np, nSalt);
            master.verificationBlock = await encryptData("VNS_VERIFIED", nKey);
            
            const payload = JSON.stringify({ data: items, folders });
            const enc = await encryptData(payload, nKey);
            localStorage.setItem('vns_vault_encrypted_db', JSON.stringify(enc));
            
            if (master.encryptedMnemonic) {
                const decMnemonicStr = await decryptData(master.encryptedMnemonic, curKey);
                master.recoveryMnemonic = decMnemonicStr;
                delete master.encryptedMnemonic;
                delete master.isLegacy;
            }
            
            activeMasterKey = nKey;
        }

        // ?. ?????????? ???? ?????? ? ???? ?? ??? ???? ?????? ??? ?????????? ????
        // ??? ???????? ??? ????? ?????? ???? ???? ????? ???? ? ?? ???? catch ?????? ??????
        master = await executePasscodeLayerSync(master);
        
        // ????? ????? ??????? ?? ??????? ???? ?? ???? ???? ?? ???? ??????
        localStorage.setItem('vns_master_user', JSON.stringify(master));
        
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Security Vault Re-Keyed", "Master security configurations updated. Force re-locking partition gateway...", "success");
        } else {
            showAlert("Master security configurations updated. Force re-locking partition gateway...");
        }
        
        setTimeout(() => {
            handleLogout();
        }, 1500);

    } catch (err) {
        // ??????? ?? ???? ???????? ????? ?? ???? ??? ?????? ??????
        console.warn("Operation aborted due to validation error:", err.message);
    }
}
// ???? ???? ???? ?????????? ?????? ? ???? ???? ???? ??? ?? ???????? ????? ????

async function executePasscodeLayerSync(masterObject) {
    const toggleEl = document.getElementById('sett-passcode-toggle');
    const toggle = toggleEl ? toggleEl.checked : false;
    
    if (toggle) {
        const p1 = document.getElementById('sett-new-passcode').value;
        const p2 = document.getElementById('sett-confirm-passcode').value;
        
        // ?. ????? ????? ??? ?????? ? ????
        if (!p1 || p1.length !== 6) {
            const pinErrTitle = typeof t === 'function' ? t("cards_alert_val_error") : "PIN Validation Error";
            const pinErrMsg = "Bypass PIN vector array must be exactly 6 digits long.";
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(pinErrTitle, pinErrMsg, "warning");
            } else {
                showAlert(pinErrMsg);
            }
            throw new Error("Invalid PIN Length Exception");
        }
        
        // ?. ????? ?????? ???????? ?? ??????
        if (p1 !== p2) {
            const mismatchTitle = typeof t === 'function' ? t("cards_alert_val_error") : "PIN Mismatch";
            const mismatchMsg = "Bypass PIN verification structures do not match.";
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(mismatchTitle, mismatchMsg, "warning");
            } else {
                showAlert(mismatchMsg);
            }
            throw new Error("PIN Mismatch Exception");
        }
        
        // ?. ??????? ????? ???????? ?? ?? ???? ???? ?? ???? ??????????
        if (activeMasterKey) {
            const pSalt = window.crypto.getRandomValues(new Uint8Array(16));
            const pKey = await deriveKeyFromPassword(p1, pSalt);
            const rawMKey = await window.crypto.subtle.exportKey("raw", activeMasterKey);
            
            masterObject.passcodeSalt = bufToBase64(pSalt);
            masterObject.encryptedMasterKeyObj = await encryptData(bufToBase64(rawMKey), pKey);
            masterObject.localPasscode = p1;
            masterObject.isPasscodeEnabled = true;
            
            // ????? ????? ?????? ???? ?????? ? ????
            const successTitle = typeof t === 'function' ? t("cards_alert_success_title") : "PIN Layer Armed";
            const successMsg = "6-Digit Bypass PIN vector successfully initialized and synced.";
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(successTitle, successMsg, "success");
            }
        } else {
            alert("Cryptographic runtime master key is vacant. Action denied.");
            throw new Error("Vacant Master Key Exception");
        }
    } else {
        // ???????????? ???? ?????? ?? ???? ??????? ??? ???
        masterObject.isPasscodeEnabled = false;
        masterObject.localPasscode = "";
        masterObject.passcodeSalt = "";
        masterObject.encryptedMasterKeyObj = null;
    }
    return masterObject;
}

// ???? ??????? ?? ???????? ?????? ???? ????? ?????? ???? ????? ?? ?? ???? ???? ??????? ???????
async function savePasscodeLayerSettings() {
    // ?????? ?????????? ?????? ?? ???? ??????? ?? ???? ?????? ????? ??
    return true;
}
function saveAccountAutolock() { const v = parseInt(document.getElementById('sett-autolock-select').value); localStorage.setItem('vns_autolock_duration', v.toString()); autolockDuration = v; if (activeMasterKey) resetAutoLockTimer(); showAlert("auto_lock_timeout_updated"); }


// ?. ????? ???? ????? ?????? ???? ?????? (???? ???? prompt ???????)
function askSecurePrompt(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all";
        
        const box = document.createElement('div');
        box.className = "bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-4 border border-slate-100 transform scale-100 transition-all";
        
        const title = document.createElement('h3');
        title.className = "text-sm font-black text-[#0D9488] uppercase tracking-widest text-center";
        title.innerText = "Security Lock";
        
        const msg = document.createElement('p');
        msg.className = "text-xs font-bold text-slate-500 text-center leading-relaxed";
        msg.innerText = message;
        
        const input = document.createElement('input');
        input.type = "password";
        input.className = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-black tracking-widest focus:border-[#0D9488] outline-none transition-all";
        input.placeholder = "********";
        
        const btnRow = document.createElement('div');
        btnRow.className = "flex gap-3 mt-2";
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = "flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all border-none outline-none cursor-pointer";
        // ??????? ?????? ?? ???? ????? ??? ????? ???? ??????? ??????
cancelBtn.innerText = (typeof t === 'function' && t("btn_cancel") !== "btn_cancel") ? t("btn_cancel") : "Cancel";
cancelBtn.setAttribute('data-i18n', 'btn_cancel');
        
        const okBtn = document.createElement('button');
        okBtn.className = "flex-1 py-3 bg-[#0D9488] text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-teal-700 transition-all shadow-md border-none outline-none cursor-pointer";
        okBtn.innerText = t("btn_unlock_export");
        /*okBtn.innerText = "Unlock & Export";*/
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(okBtn);
        box.appendChild(title);
        box.appendChild(msg);
        box.appendChild(input);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        input.focus();
        
        const cleanup = () => document.body.removeChild(overlay);
        cancelBtn.onclick = () => { cleanup(); resolve(null); };
        okBtn.onclick = () => { cleanup(); resolve(input.value); };
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') okBtn.click(); 
        };
    });
}
     /* ==========================================================================
   FIXED: TXT EXPORT AUTHENTICATION VALIDATION
   ========================================================================== */
async function handleExportData() {
    try {
        const masterStr = localStorage.getItem('vns_master_user');
        if (!masterStr) return;
        const master = JSON.parse(masterStr);
        let isVerified = false;

        if (master.is2faEnabled) {
            const codeInput = await askSecurePrompt("Enter 6-Digit Google Authenticator Code:");
            if (!codeInput) return;       
            const epoch = Math.round(new Date().getTime() / 1000);
            
            if (codeInput === await generateTOTP(master.twoFactorSecret, epoch) || 
                codeInput === await generateTOTP(master.twoFactorSecret, epoch - 30) || 
                codeInput === await generateTOTP(master.twoFactorSecret, epoch + 30)) {
                isVerified = true;
            }
        } else { 
            const pInput = await askSecurePrompt("Enter Master Password to authorize Export:");
            if (!pInput) return;
            const salt = new Uint8Array(base64ToBuf(master.salt));
            const derivedKey = await deriveKeyFromPassword(pInput, salt);
            
            if (master.isLegacy || master.encryptedMnemonic) {
                if (await decryptData(master.encryptedMnemonic, derivedKey)) isVerified = true;
            } else {
                if (await decryptData(master.verificationBlock, derivedKey) === "VNS_VERIFIED") isVerified = true;
            }
        }

        if (!isVerified) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Access Denied", "Invalid security credentials provided.", "error");
            } else {
                showAlert("Invalid security credentials provided.");
            }
            return;
        }
        
        let out = "VNS SECURE VAULT DE-CIPHERED MANIFESTS\n" + "=".repeat(40) + "\n";
        items.forEach(i => out += `Label: ${i.name}\nUser: ${i.user}\nPass: ${i.pass}\nBackup: ${i.backup}\nRoute: ${i.site}\nNotes: ${i.note}\n` + "-".repeat(30) + "\n");
        
        if (typeof executeSecureDownload === 'function') {
            await executeSecureDownload("vns_plaintext_manifest.txt", "\uFEFF" + out, "text/plain");
        } else {
            const a = document.createElement("a"); 
            a.href = URL.createObjectURL(new Blob(["\uFEFF" + out], { type: "text/plain;charset=utf-8" })); 
            a.download = "vns_plaintext_manifest.txt"; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

    } catch (err) {
        console.error("Export Fault:", err);
    }
}

    function triggerImportString() { 
    const textarea = document.getElementById('import-string-textarea');
    if (textarea) textarea.value = ''; 
    
    const overlay = document.getElementById('gen-overlay');
    const modal = document.getElementById('import-string-modal');
    if (overlay) overlay.classList.remove('hidden'); 
    if (modal) modal.classList.remove('hidden'); 
}

function submitImportString() { 
    const textarea = document.getElementById('import-string-textarea');
    const str = textarea ? textarea.value.trim() : ''; 
    
    if (!str) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Warning", "Cipher string payload cannot be vacant.", "warning");
        } else {
            showAlert("Payload string required.");
        }
        return; 
    }
    
    pendingImportData = str; 
    
    const importModal = document.getElementById('import-string-modal');
    if (importModal) importModal.classList.add('hidden'); 
    
    // ??? ???? ?????? ????? ????? ???? ?? ??????? ???? ?????? ???????
    if (typeof openImportAuthModal === 'function') {
        openImportAuthModal(str); 
    }
}
function submitImportString() { const str = document.getElementById('import-string-textarea').value.trim(); if (!str) return; pendingImportData = str; document.getElementById('import-string-modal').classList.add('hidden'); openImportAuthModal(str); }

// ?? ???? ????? ??? ???? handleImportFile ???? ?????? - ????? ?????? ?? ?????? ?? ????
function handleImportFile(ev) { 
    const f = ev.target.files[0]; 
    if (!f) return; 
    const r = new FileReader(); 
    r.onload = (e) => { 
        pendingImportData = e.target.result; 
        
        // ?? ????? ??? ????: ????? ?????? ?? ????? ???? HTML ??????
        openImportAuthModal(e.target.result); 
        ev.target.value = ''; 
    }; 
    r.readAsText(f); 
}

// ?? ???? ????? ??? ???? submitImportString ???? ??????
function submitImportString() { 
    const str = document.getElementById('import-string-textarea').value.trim(); 
    if (!str) return; 
    pendingImportData = str; 
    
    // ?? ?????????? ????? ???? ??? ???? ????? ?? ???? ????
    document.getElementById('import-string-modal').classList.add('hidden'); 
    openImportAuthModal(str); 
}


// ?? ???? ????????? ? ???? ???? ???? openImportAuthModal ???? ????? ??????
function openImportAuthModal(data) {
    const c = document.getElementById('import-mnemonic-inputs'); 
    if (c) {
        c.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            c.innerHTML += `<input type="text" class="mnemonic-input font-bold" id="import-word-${i}" placeholder="${i}">`;
        }
    }
    
    // ?? ?? ??? ????: ????? ???? ???? ????? ?FA ??? ?? ??????? ????????? ???? ??????? ?? ????
    const container2fa = document.getElementById('import-2fa-container');
    if (container2fa) {
        container2fa.classList.add('hidden');
    }
    
    // ?? ????????? ? ????? ???? ????? ?? ???? ???? ??? ???? ??????
    const overlay = document.getElementById('gen-overlay');
    const importAuthModal = document.getElementById('import-auth-modal');
    
    if (overlay) overlay.classList.remove('hidden');
    if (importAuthModal) importAuthModal.classList.remove('hidden');
}  

    async function executeRestore() {
    // ðŸŸ¢ Û±. Ø§Ú¯Ø± Ú©Ø§Ø±Ø¨Ø± Ù„Ø§Ú¯ÛŒÙ† Ù†ÛŒØ³Øª (ØµÙØ­Ù‡ Ø§ÙˆÙ„ÛŒÙ‡)ØŒ Ø§Ø¬Ø±Ø§ Ù†Ø´ÙˆØ¯ ØªØ§ ØªØ¯Ø§Ø®Ù„ÛŒ Ø§ÛŒØ¬Ø§Ø¯ Ù†Ú©Ù†Ø¯
    if (!activeMasterKey) {
        console.warn("Restore disabled on pre-login screen.");
        return;
    }

    let words = [];
    for (let i = 1; i <= 12; i++) {
        const el = document.getElementById(`import-word-${i}`);
        const v = el ? el.value.trim().toLowerCase() : '';
        if (v) words.push(v);
    }

    if (words.length !== 12) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Warning", "Please fill all 12 recovery words.", "warning");
        } else {
            showAlert("Please fill all 12 recovery words.");
        }
        return;
    }

    const mnemonicString = words.join(' ');

    try {
        if (!pendingImportData) {
            showAlert("No import payload found.");
            return;
        }

        let jsonString = pendingImportData.trim();
        let json;
        try {
            const cleanB64 = jsonString.replace(/\s/g, '');
            jsonString = new TextDecoder().decode(base64ToBuf(cleanB64));
            json = JSON.parse(jsonString);
        } catch (e) {
            json = JSON.parse(pendingImportData.trim());
        }

        let payload = null;
        if (json.encrypted_backup) {
            const bSalt = new Uint8Array(base64ToBuf(json.salt));
            const bKey = await deriveKeyFromPassword(mnemonicString, bSalt);
            payload = await decryptData({ iv: json.iv, ciphertext: json.ciphertext }, bKey);
        }

        if (!payload && json.iv && (json.data || json.ciphertext)) {
            const ciphertextData = json.ciphertext || json.data;
            try {
                const hashBuffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(mnemonicString));
                const legacyKey = await window.crypto.subtle.importKey("raw", hashBuffer, "AES-GCM", false, ["encrypt", "decrypt"]);
                payload = await decryptData({ iv: json.iv, ciphertext: ciphertextData }, legacyKey);
            } catch (e) { }
        }

        if (!payload) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Restore Failed", "Decryption failed. 12-Word phrase mismatch.", "error");
            } else {
                showAlert("Decryption failed. 12-Word phrase mismatch.");
            }
            return;
        }

        // Û². Ø§Ø³ØªØ®Ø±Ø§Ø¬ ØªÙ…Ø§Ù… Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ (Ù¾Ø³ÙˆØ±Ø¯Ù‡Ø§ + Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ + Ù¾ÙˆØ´Ù‡â€ŒÙ‡Ø§)
        const parsed = JSON.parse(payload);
        items = parsed.items || parsed.data || [];
        folders = parsed.folders || folders;

        if (parsed.cardsData && Array.isArray(parsed.cardsData)) {
            localStorage.setItem('vns_cards', JSON.stringify(parsed.cardsData));
            if (typeof mPaymentCards !== 'undefined') mPaymentCards = parsed.cardsData;
        }
        if (parsed.idDocsData && Array.isArray(parsed.idDocsData)) {
            localStorage.setItem('vns_id_docs', JSON.stringify(parsed.idDocsData));
            if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = parsed.idDocsData;
            if (typeof mLoadIdDocsFromStorage === 'function') mLoadIdDocsFromStorage();
        }

        // Û³. Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø§Ù…Ù† Ùˆ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ UI Ø¯Ø± Ù…Ø­ÛŒØ· ØªÙ†Ø¸ÛŒÙ…Ø§Øª
        await saveItemsToStorage();

        if (typeof closeModals === 'function') closeModals();
        if (typeof renderFolders === 'function') renderFolders();
        if (typeof renderList === 'function') renderList();
        if (typeof mRenderCardsContainer === 'function') mRenderCardsContainer();

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Success", "Vault Data & Cards Restored Successfully!", "success");
        } else {
            showAlert("Vault Data & Cards Restored Successfully!");
        }

    } catch (e) {
        console.error("Restore Execution Error:", e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Error", "Error processing backup payload: " + e.message, "error");
        } else {
            showAlert("Error processing backup payload.");
        }
    }
}
window.executeRestore = executeRestore;

 

// ?? ???? ??? ???? ?????? ?? ????? ???? ?? Async ? ??????????? ???????? ????? ??????
async function verifyBackup2faCode() {
    const masterStr = localStorage.getItem('vns_master_user');
    if (!masterStr) return;
    const master = JSON.parse(masterStr);
    
    const inputEl = document.getElementById('backup-2fa-verify-input');
    if (!inputEl) return;
    
    const inputVal = inputEl.value.trim(); 
    if (!inputVal) return;

    const epoch = Math.round(new Date().getTime() / 1000);
    let isVerified = false;
    
    // ?. ???????? ???? ? ????
    if (/^\d{6}$/.test(inputVal) && master.twoFactorSecret) {
        if (inputVal === await generateTOTP(master.twoFactorSecret, epoch) || 
            inputVal === await generateTOTP(master.twoFactorSecret, epoch - 30) || 
            inputVal === await generateTOTP(master.twoFactorSecret, epoch + 30)) {
            isVerified = true;
        }
    }
    
    // ?. ???????? ?? ????? ???? (??? ???????)
    if (!isVerified) {
        try {
            const salt = new Uint8Array(base64ToBuf(master.salt));
            const derivedKey = await deriveKeyFromPassword(inputVal, salt);
            if (master.isLegacy || master.encryptedMnemonic) {
                const decMnemonicStr = await decryptData(master.encryptedMnemonic, derivedKey);
                if (decMnemonicStr) isVerified = true;
            } else {
                const verification = await decryptData(master.verificationBlock, derivedKey);
                if (verification === "VNS_VERIFIED") isVerified = true;
            }
        } catch (e) {} 
    }
    
    if (isVerified) {
        try {
            let targetMnemonic = master.recoveryMnemonic;
            if (!targetMnemonic && master.encryptedMnemonic && activeMasterKey) {
                targetMnemonic = await decryptData(master.encryptedMnemonic, activeMasterKey);
            }
            
            // ??? ????? ??????? ??????? ???? ?? ????? ????????? ???? ??????? ?? ???? ????? ??
            if (!targetMnemonic) {
                targetMnemonic = master.recoveryMnemonic || "vns vault secure recovery matrix token system keys";
            }
            
            const cards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
            const payload = JSON.stringify({ data: items, folders, cardsData: cards, idDocsData: JSON.parse(localStorage.getItem('vns_id_docs') || '[]') }); 
            
            const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
            const bKey = await deriveKeyFromPassword(targetMnemonic, bSalt); 
            const enc = await encryptData(payload, bKey);
            
            lastBackupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({ 
                vns_version: "7.0.0", 
                encrypted_backup: true, 
                salt: bufToBase64(bSalt), 
                iv: enc.iv, 
                ciphertext: enc.ciphertext 
            })));

            // ????? ????? ???? ????? ????? ???
            const gateBox = document.getElementById('backup-gate-box');
            const contentBox = document.getElementById('backup-content-box');
            if (gateBox) gateBox.classList.add('hidden'); 
            if (contentBox) contentBox.classList.remove('hidden');
            
            currentMnemonic = targetMnemonic.split(' '); 
            const c = document.getElementById('mnemonic-container'); 
            if (c) {
                c.innerHTML = '';
                currentMnemonic.forEach((w, i) => c.innerHTML += `<div class="mnemonic-word font-mono">${i+1}. ${w}</div>`);
            }
            
            localStorage.setItem('vns_last_backup_date_string', new Date().toLocaleString());
            if (typeof updateBackupTimeUI === 'function') updateBackupTimeUI();
            
        } catch (error) {
            console.error("Backup Generation Error:", error);
            if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t("err_critical_backup_matrix") : "Critical backup generation error.");
        }
    } else {
        if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t("err_access_denied_invalid_token_pass") : "Invalid verification token or master password.");
    }
}

function copyMnemonic() { 
    copyValueDirectText(currentMnemonic.join(' ')); 
    showAlert(t("success_recovery_phrase_copied")); 
}

function copyBackupString() { 
    if (lastBackupJSON) { 
        copyValueDirectText(lastBackupJSON); 
        showAlert(t("success_backup_string_copied")); 
    } 
} 
 
// ==========================================
// UNIVERSAL SECURE DOWNLOAD HANDLER (Beta - FIX)
// ==========================================
async function executeSecureDownload(filename, content, mimeType) {
    // 1. Capacitor Native Filesystem
    if (window.Capacitor && window.Capacitor.Plugins) {
    const Filesystem = window.Capacitor.Plugins.Filesystem;
    const Share = window.Capacitor.Plugins.Share;
    
    if (Filesystem && Share) {
        try {
            const result = await Filesystem.writeFile({
                path: filename,
                data: content,
                directory: 'CACHE', // ???? ????? ????
                encoding: 'utf8'    // ???? ????? ????
            });
            
            await Share.share({
                title: filename,
                url: result.uri, 
                dialogTitle: t("dialog_save_vault_file")
            });
            return; 
        } catch (e) {
            console.warn(t("log_cap_file_share_failed"), e);
        }
    }
    
    if (Share) {
        try {
            await Share.share({
                title: filename,
                text: content,
                dialogTitle: t("dialog_save_vault_data")
            });
            return;
        } catch(e) {
            console.warn(t("log_cap_text_share_failed"), e);
        }
    }
}
   
 
    // 2. Web Fallback Download
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 300);
        
        if (!isMobileContext()) {
            showAlert(t("success_file_downloaded"));
        }
    } catch (e) {
        showAlert(t("err_download_blocked"));
    }
}

async function restoreSandboxBackup() {
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    if (!isCapacitor) {
        if (typeof showAlert === 'function') showAlert(t("info_extraction_optimized_mobile"));
        return;
    }
    const confirmRestore = confirm(t("confirm_restore_sandbox_backup"));
if (!confirmRestore) return;

    try {
        const { Filesystem, Directory } = Capacitor.Plugins;
        const result = await Filesystem.readFile({
            path: 'VNS_Sandbox_AutoBackup.json',
            directory: Directory.Data,
            encoding: 'utf8'
        });

        if (!result || !result.data) {
    throw new Error(t("err_sandbox_backup_corrupted"));
}

        const masterStr = localStorage.getItem('vns_master_user');
        if (!masterStr) return;
        const master = JSON.parse(masterStr);
        const backupObj = JSON.parse(new TextDecoder().decode(base64ToBuf(result.data)));
if (!backupObj.encrypted_backup) throw new Error(t("err_invalid_backup_format"));

        const derivedKey = await deriveKeyFromPassword(master.recoveryMnemonic, base64ToBuf(backupObj.salt));
        const decryptedStr = await decryptData({ iv: backupObj.iv, ciphertext: backupObj.ciphertext }, derivedKey);
        if (!decryptedStr) throw new Error(t("err_decryption_failed_key"));

        const parsedData = JSON.parse(decryptedStr);
        items = parsedData.data || parsedData.items || [];
        folders = parsedData.folders || [t("folder_personal"), t("folder_work"), t("folder_finance")];
        const newPayload = JSON.stringify({ data: items, folders }); 
        const newEnc = await encryptData(newPayload, activeMasterKey); 
        localStorage.setItem('vns_vault_encrypted_db', JSON.stringify(newEnc));

        if (typeof renderFolders === 'function') renderFolders();
        if (typeof renderList === 'function') renderList();
        
        if (typeof showAlert === 'function') showAlert(t("success_sandbox_restored"));

    } catch (error) {
    console.error(t("log_sandbox_extraction_error"), error);
    if (typeof showAlert === 'function') showAlert(t("err_restore_failed_no_sandbox"));
}
}
// END OF SANDBOX RESTORE MODULE

// ==========================================
// PREPARE BACKUP MODAL (FIXED)
// ==========================================
function prepareBackup() {
    // ??? ???? ????? ???? ????? ?????? ?? ??? ??? ?? ????? ??? ?? ?????? ?????? ??? ??? ?? ????? ???
    const overlay = document.getElementById('gen-overlay');
    const backupModal = document.getElementById('backup-modal');
    const gateBox = document.getElementById('backup-gate-box');
    const contentBox = document.getElementById('backup-content-box');
    
    if (overlay) overlay.classList.remove('hidden');
    if (backupModal) backupModal.classList.remove('hidden');
    
    if (gateBox) gateBox.classList.remove('hidden');
    if (contentBox) contentBox.classList.add('hidden');
    
    const verifyInput = document.getElementById('backup-2fa-verify-input');
    if (verifyInput) verifyInput.value = '';
}
// END OF SANDBOX RESTORE MODULE
// ==========================================
// OVERRIDDEN DOWNLOAD FUNCTIONS
// ==========================================
async function downloadMnemonic() { 
    const out = t("recovery_key_matrix_header") + "\n" + "=".repeat(40) + "\n" + currentMnemonic.map((w, i) => `${i+1}. ${w}`).join('\n'); 
    await executeSecureDownload("vns_recovery_keys.txt", out, "text/plain");
}

async function downloadBackup() { 
    if (!lastBackupJSON) {
        showAlert(t("err_no_backup_data_memory"));
        return;
    }
    await executeSecureDownload("vns_secure_vault_backup.json", lastBackupJSON, "application/json");
}
function sendBackupToEmail() {
    if (!lastBackupJSON) return; 
    const sub = encodeURIComponent(t("email_sub_security_backup"));
    const body = encodeURIComponent(t("email_body_security_backup") + "\n" + "=".repeat(50) + "\n\n" + t("email_body_inject_instruction") + "\n\n" + lastBackupJSON);
    window.location.href = `mailto:?subject=${sub}&body=${body}`; 
    showAlert(t("info_email_client_launch"));
}

function goToSecuritySettingsFromBackup() { closeModals(); openMyAccountSettings(); switchSettingsTab('security'); }
function toggleMobileSidebar() { const s = document.getElementById('sidebar-container'); const o = document.getElementById('sidebar-overlay'); if (s.classList.contains('-translate-x-full')) { s.classList.remove('-translate-x-full'); o.classList.remove('hidden'); } else closeMobileSidebar(); }
function closeMobileSidebar() { document.getElementById('sidebar-container').classList.add('-translate-x-full'); document.getElementById('sidebar-overlay').classList.add('hidden'); }

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const alertModal = document.getElementById('custom-alert-modal'); if (alertModal && !alertModal.classList.contains('hidden')) { closeCustomAlert(); e.preventDefault(); } }
});

function secureScrubInput(id) {
    const el = document.getElementById(id); if (!el) return;
    const originalType = el.type; try { el.type = "text"; } catch (e) {}
    el.value = "X".repeat(Math.max(el.value.length, 32)); el.value = Math.random().toString(36).substring(2); el.value = "";
    try { el.type = originalType; } catch (e) {}
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}

function scrubMemoryOnlyDOM() {
    const sensitiveInputs = [
        'reg-pass', 'reg-confirm-pass', 'reg-2fa-verify', 'login-pass', 'login-passcode', 'login-2fa-code', 
        'i-pass', 'i-backup', 'sett-curr-pass', 'sett-new-pass', 'sett-confirm-pass', 'sett-new-passcode', 
        'sett-confirm-passcode', 'sett-user-2fa', 'sett-pass-2fa', 'sett-2fa-verify-input', 'sett-2fa-disable-input', 
        'backup-2fa-verify-input', 'm-input-number', 'm-input-cvv', 'm-input-account', 'm-input-iban'
    ];
    sensitiveInputs.forEach(id => { secureScrubInput(id); }); 
    if (typeof initAntiKeylogger === 'function') initAntiKeylogger();
}
  
function scrubMemoryAndCredentials() { 
    scrubMemoryOnlyDOM(); 
    
    // ?. ??????? ???????? ?????? ????????
    tempMasterAccount = null; 
    lastBackupJSON = ""; 
    currentMnemonic = []; 
    simulated2faSecret = ""; 
    currentSimulatedOtp = ""; 
    currentCustomLogoB64 = ""; 
    activeMasterKey = null; 
    
    // ?. ??????? ???? ????? ???????? ????? ?? RAM
    if (typeof mPaymentCards !== 'undefined') {
        mPaymentCards = [];
    }
    
    // ?. ??????? ?? ?????? ?? ????????? ????
    localStorage.removeItem('vns_autofill_active_data'); 
    
    // ?. ???????? Garbage Collector ?? ???? ????
    if (window.gc) { 
        try { window.gc(); } catch (e) {} 
    } 
}

function initAntiKeylogger() {
    const pwIds = ['reg-pass', 'login-pass', 'i-pass', 'sett-curr-pass', 'sett-new-pass', 'sett-confirm-pass'];
    pwIds.forEach(id => { const el = document.getElementById(id); if (el) { el.removeAttribute('onkeydown'); el.addEventListener('keydown', (e) => { if (e.key === 'Enter') return; const delayAmount = Math.floor(Math.random() * 10) + 2; const start = performance.now(); while (performance.now() - start < delayAmount) {} }); } });
}

async function generateSSHKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    const privBuf = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey); const pubBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privPem = formatPemStructure(privBuf, "OPENSSH PRIVATE KEY"); const pubPem = formatPemStructure(pubBuf, "PUBLIC KEY");
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", pubBuf);
    const fingerprint = "SHA256:" + btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)));
    return { privateKey: privPem, publicKey: pubPem, fingerprint: fingerprint };
}

function formatPemStructure(buffer, label) {
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    const formatted = base64.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
}
function switchPayloadField(type) {
    const label = document.getElementById('payload-label'); 
    const textarea = document.getElementById('i-backup'); 
    const eyeIcon = document.getElementById('backup-eye-icon');
    const userInput = document.getElementById('i-user'); 
    const passInput = document.getElementById('i-pass');
    const userLabel = userInput ? userInput.closest('.input-group').previousElementSibling : null; 
    const passLabel = passInput ? passInput.closest('.input-group').previousElementSibling : null;
    
    if (!label || !textarea) return;
    const existingGenBtn = document.getElementById('ssh-gen-btn-dynamic'); 
    if (existingGenBtn) existingGenBtn.remove();
    
    if (type === 'ssh') {
        // ????? ???????? ?? ???? SSH (???? ?????)
        label.setAttribute('data-i18n', 'form_lbl_ssh_priv');
        textarea.setAttribute('data-i18n', 'form_ssh_ph');
        if (userLabel) userLabel.setAttribute('data-i18n', 'form_lbl_ssh_pub');
        if (passLabel) passLabel.setAttribute('data-i18n', 'form_lbl_ssh_finger');
        
        textarea.classList.remove('backup-masked'); 
        if (eyeIcon) eyeIcon.style.display = "none";
        
        if (userInput && userInput.tagName === 'INPUT') {
            const ta = document.createElement('textarea'); ta.id = 'i-user'; ta.className = userInput.className + ' h-20 resize-y'; ta.value = userInput.value;
            ta.oninput = userInput.oninput; userInput.parentNode.replaceChild(ta, userInput);
        }
        if (passInput && passInput.tagName === 'INPUT') {
            const ta = document.createElement('textarea'); ta.id = 'i-pass'; ta.className = passInput.className + ' h-12 resize-y'; ta.value = passInput.value;
            ta.oninput = passInput.oninput; passInput.parentNode.replaceChild(ta, passInput);
        }
        
        const genBtn = document.createElement('button'); genBtn.id = 'ssh-gen-btn-dynamic'; genBtn.type = 'button';
        genBtn.className = 'mt-2 mb-4 px-4 py-2 bg-[#0D9488] text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-md hover:bg-[#e16519] transition-all w-full';
        genBtn.setAttribute('data-i18n', 'form_btn_gen_ssh'); // ????? ???? ????? ?? ????
        genBtn.innerText = t("btn_regenerate_ssh_key");
        const generateAndFillSSH = async () => {
            const keys = await generateSSHKeyPair();
            const backupField = document.getElementById('i-backup'); const userField = document.getElementById('i-user'); const passField = document.getElementById('i-pass');
            if (backupField) backupField.value = keys.privateKey; if (userField) userField.value = keys.publicKey; if (passField) passField.value = keys.fingerprint;
        };
        genBtn.onclick = generateAndFillSSH; label.parentNode.insertBefore(genBtn, label);
        setTimeout(() => { const currPriv = document.getElementById('i-backup')?.value; const currPub = document.getElementById('i-user')?.value; if (!currPriv && !currPub) generateAndFillSSH(); }, 50);

    } else {
        // ????? ???????? ?? ???? Backup (???? ?????)
        label.setAttribute('data-i18n', 'form_lbl_backup');
        textarea.setAttribute('data-i18n', 'form_backup_ph');
        if (userLabel) userLabel.setAttribute('data-i18n', 'form_lbl_user');
        if (passLabel) passLabel.setAttribute('data-i18n', 'form_lbl_pass');
        
        textarea.classList.add('backup-masked'); 
        if (eyeIcon) eyeIcon.style.display = "block";
        
        const currUser = document.getElementById('i-user');
        if (currUser && currUser.tagName === 'TEXTAREA') {
            const inp = document.createElement('input'); inp.type = 'text'; inp.id = 'i-user'; inp.className = currUser.className.replace(' h-20 resize-y', ''); inp.value = currUser.value;
            inp.oninput = function() { validateEnglish(this); }; inp.onkeydown = handleSaveOnEnter; currUser.parentNode.replaceChild(inp, currUser);
        }
        const currPass = document.getElementById('i-pass');
        if (currPass && currPass.tagName === 'TEXTAREA') {
            const inp = document.createElement('input'); inp.type = 'password'; inp.id = 'i-pass'; inp.className = currPass.className.replace(' h-12 resize-y', ''); inp.value = currPass.value;
            inp.oninput = function() { validateEnglish(this); }; inp.onkeydown = handleSaveOnEnter; currPass.parentNode.replaceChild(inp, currPass);
        }
    }
    
    // ?? ????? ?? ????? ????? ????????? ?? ?????? ???? ?? ??? ??? ??????? ???? ????? ???
    if (typeof applyLanguage === 'function') {
        applyLanguage();
    }
}

// Ã°Å¸Å’Å¸ BIOMETRIC INTEGRATION - TPM/KEYSTORE + HMS FALLBACK FOR HUAWEI Ã°Å¸Å’Å¸
async function _deriveBioFallbackKey(salt) {
    const enc = new TextEncoder();
    const deviceSeed = (navigator.userAgent || "vns") + (screen.width || 0) + (screen.height || 0);
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(deviceSeed), "PBKDF2", false, ["deriveKey"]
    );
    return await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function registerBiometricIdentity() {
    if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) {
        showAlert(t("err_biometric_plugin_unavailable"));
        return;
    }
    try {
        const result = await window.Capacitor.Plugins.NativeBiometric.isAvailable();
        if (!result.isAvailable) {
            showAlert(t("err_biometric_sensor_disabled"));
            return;
        }
        const biometryType = result.biometryType;
await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
    reason: t("bio_reason_auth_link"),
    title: t("bio_title_activate_lock"),
    subtitle: t("bio_subtitle_vns_vault"),
    description: t("bio_desc_scan_finger_face"),
    useFallback: true,
    negativeButtonText: t("btn_cancel"),
    allowDeviceCredential: false,
    confirmationRequired: false
});
        const rawMKey = await window.crypto.subtle.exportKey("raw", activeMasterKey);
        const b64Key = bufToBase64(rawMKey);

        let keystoreSuccess = false;
        try {
            await window.Capacitor.Plugins.NativeBiometric.setCredentials({
                username: "vns_admin",
                password: b64Key,
                server: "vns_secure_vault"
            });
            const verify = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                server: "vns_secure_vault"
            });
            if (verify && verify.password === b64Key) {
                keystoreSuccess = true;
            }
        }catch (ksErr) {
    console.warn(t("log_keystore_fallback_hms"), ksErr);
}

        if (!keystoreSuccess) {
            const fallbackSalt = "vns_bio_fallback_" + (navigator.userAgent.length);
            const fallbackKey = await _deriveBioFallbackKey(fallbackSalt);
            const enc = await encryptData(b64Key, fallbackKey);
            localStorage.setItem('vns_bio_fallback_enc', JSON.stringify(enc));
            localStorage.setItem('vns_bio_fallback_salt', fallbackSalt);
        }

        const master = JSON.parse(localStorage.getItem('vns_master_user'));
        if (master) {
            master.biometricCredentialId = "hardware_keystore_active";
            master.biometricType = biometryType;
            master.biometricUseFallback = !keystoreSuccess;
            localStorage.setItem('vns_master_user', JSON.stringify(master));
            showAlert(t("success_hardware_biometric_linked"));
        }
    } catch (e) {
    console.error(t("log_biometric_setup_failed"), e);
    showAlert(t("err_biometric_auth_cancelled_failed"));
}
}
  /* ==========================================================================
   FIXED: HANDLE BIOMETRIC LOGIN (RELOADS CARDS PROPERLY)
   ========================================================================== */  
async function handleBiometricLogin() {
    if (checkLockoutState()) { 
        showAlert(t("err_access_blocked_wait_seconds").replace("{seconds}", passcodeLockRemaining)); 
        return; 
    }

    const master = JSON.parse(localStorage.getItem('vns_master_user'));
    if (!master || !master.biometricCredentialId) {
        showAlert (t("biometric_not_linked"));
        return;
    }

    if (!window.Capacitor || !window.Capacitor.Plugins.NativeBiometric) {
        showAlert(t("err_biometric_plugin_not_installed"));
        return;
    }
    try {
        await window.Capacitor.Plugins.NativeBiometric.verifyIdentity({
            reason: t("bio_reason_auth_unlock"),
            title: t("bio_title_unlock_vault"),
            subtitle: t("bio_subtitle_vns_vault"),
            description: t("bio_desc_scan_finger_face"),
            useFallback: true,
            negativeButtonText: t("btn_cancel"),
            confirmationRequired: false
        });

        let b64Key = null;

        if (!master.biometricUseFallback) {
            try {
                const credentials = await window.Capacitor.Plugins.NativeBiometric.getCredentials({
                    server: "vns_secure_vault"
                });
                if (credentials && credentials.password) {
                    b64Key = credentials.password;
                }
            } catch (ksErr) {
                console.warn(t("log_keystore_read_fallback_hms"), ksErr);
            }
        }

        if (!b64Key) {
            const fallbackSalt = localStorage.getItem('vns_bio_fallback_salt');
            const fallbackEncRaw = localStorage.getItem('vns_bio_fallback_enc');
            if (fallbackSalt && fallbackEncRaw) {
                try {
                    const fallbackKey = await _deriveBioFallbackKey(fallbackSalt);
                    b64Key = await decryptData(JSON.parse(fallbackEncRaw), fallbackKey);
                }catch (fbErr) {
                    console.error(t("log_hms_fallback_decryption_failed"), fbErr);
                } 
            }
        }

        if (!b64Key) {
            showAlert(t("err_bio_key_retrieval"));
            return;
        }

        activeMasterKey = await window.crypto.subtle.importKey(
            "raw",
            base64ToBuf(b64Key),
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        resetAutoLockTimer();
        localStorage.setItem('vns_failed_attempts', '0');

        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('display-user').innerText = master.username;

        const mountBanner = document.getElementById('mounted-banner');
        const pathName = localStorage.getItem('vns_linked_folder_name') || t("default_usb_dir_link");
        if (mountBanner) { mountBanner.classList.remove('hidden'); document.getElementById('mounted-folder-name').innerText = pathName.toUpperCase(); }

        await loadEncryptedDatabase();

        // ðŸŸ¢ Ø¨Ø§Ø²Ø®ÙˆØ§Ù†ÛŒ Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø¨Ø§Ù†Ú©ÛŒ Ø§Ø² Ø­Ø§ÙØ¸Ù‡ Ù¾Ø³ Ø§Ø² ÙˆØ±ÙˆØ¯ Ø¨ÛŒÙˆÙ…ØªØ±ÛŒÚ©
        try {
            if (typeof mPaymentCards !== 'undefined') {
                mPaymentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
            }
        } catch(e) { console.warn(e); }

        scrubMemoryOnlyDOM();

    }catch (err) {
        console.error(t("log_bio_login_failed"), err);
        showAlert(t("biometric_expired")); 
    }
}
// =============================================
// STRICT MOBILE SWIPE & BACK NAVIGATION HANDLER
// =============================================

if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    document.body.style.touchAction = 'pan-y'; 
}

function _vnsNavPush() {
    try { 
        window.history.pushState({ locked: true }, document.title, window.location.href); 
    } catch(e) {}
}

let vnsStartX = 0;
let vnsStartY = 0;
let vnsLastExitTime = 0;

function handleAppBackNavigation() {
    const formCont = document.getElementById('form-container');
    const settCont = document.getElementById('settings-container');
    const overlay = document.getElementById('gen-overlay');
    
    const isFormOpen = formCont && !formCont.classList.contains('hidden');
    const isSettOpen = settCont && !settCont.classList.contains('hidden');
    const isModalOpen = overlay && !overlay.classList.contains('hidden');
    
    if (isModalOpen) {
        closeModals();
        return;
    } 
    
    if (isSettOpen) {
        const isIdentityProfileActive = !document.getElementById('settings-tab-username').classList.contains('hidden');
        if (!isIdentityProfileActive) {
            switchSettingsTab('username');
        } else {
            cancelView();
        }
        return;
    } 
    
    if (isFormOpen) {
        cancelView();
        return;
    }
    
    const now = Date.now();
    if (now - vnsLastExitTime < 2000) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.exitApp();
        } else if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else {
            window.close();
        }
    } else {
        vnsLastExitTime = now;
        showAlert(t("Swipe_application"));
    }
}
document.addEventListener('touchstart', function(e) {
    vnsStartX = e.changedTouches[0].clientX;
    vnsStartY = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!isMobileContext()) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const diffX = endX - vnsStartX;
    const diffY = endY - vnsStartY;
    
    if (Math.abs(diffX) > 100 && Math.abs(diffY) < 40) {
        if (diffX > 0) { 
            handleAppBackNavigation();
        } else { 
            const sidebar = document.getElementById('sidebar-container');
            if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
                closeMobileSidebar();
            }
        }
    }
}, { passive: true });

window.addEventListener('popstate', function(event) {
    handleAppBackNavigation();
    _vnsNavPush();
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', function() {
            handleAppBackNavigation();
        });
    }
});
// =============================================
// OPTICAL QR TRANSFER PROTOCOLS (OFFLINE TRANSFER)
// =============================================

/* ????? ??? ???? ??????? ?? ???? ??? ?? ???????? */
var vnsHtml5QrcodeScanner = null;
var pendingOpticalItem = null;

function generateOfflineQRForItem(itemId) {
    const targetItem = items.find(x => x.id === itemId);
    if (!targetItem) return;

    if (!activeMasterKey) {
        if (typeof showVnsAlert === 'function') showVnsAlert("Error", "Cryptographic key not ready.", "error");
        else showAlert("Cryptographic key not ready.");
        return;
    }

    const container = document.getElementById('qr-canvas-container');
    if (!container) return;

    container.innerHTML = `
        <div class="w-full text-left space-y-3 p-2">
            <p class="text-[10px] font-black text-slate-500 uppercase mb-1 border-b border-slate-100 pb-2">Select Data to Transfer:</p>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-name" checked class="accent-[#0D9488] w-4 h-4"> Title Name</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-user" checked class="accent-[#0D9488] w-4 h-4"> Username</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-pass" checked class="accent-[#0D9488] w-4 h-4"> Password</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-site" checked class="accent-[#0D9488] w-4 h-4"> Target Domain/URL</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-note" checked class="accent-[#0D9488] w-4 h-4"> Notes</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-backup" checked class="accent-[#0D9488] w-4 h-4"> Backup Payload</label>
            <button id="btn-render-qr" type="button" class="w-full mt-4 py-3 bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-xl text-xs font-black shadow-md uppercase transition-all border-none cursor-pointer">Generate QR Matrix</button>
        </div>
    `;

    document.getElementById('gen-overlay').classList.remove('hidden');
    document.getElementById('qr-display-modal').classList.remove('hidden');

    document.getElementById('btn-render-qr').onclick = async () => {
        const partialItem = { id: targetItem.id };
        if (document.getElementById('chk-name').checked) partialItem.name = targetItem.name;
        if (document.getElementById('chk-user').checked) partialItem.user = targetItem.user;
        if (document.getElementById('chk-pass').checked) partialItem.pass = targetItem.pass;
        if (document.getElementById('chk-site').checked) partialItem.site = targetItem.site;
        if (document.getElementById('chk-note').checked) partialItem.note = targetItem.note;
        if (document.getElementById('chk-backup').checked) partialItem.backup = targetItem.backup;

        try {
            const payloadString = JSON.stringify(partialItem);
            const encryptedData = await encryptData(payloadString, activeMasterKey);
            
            const transferObj = {
                vns_opt: "1.2",
                iv: encryptedData.iv,
                cipher: encryptedData.ciphertext
            };

            const b64TransferString = bufToBase64(new TextEncoder().encode(JSON.stringify(transferObj)));

            container.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(container, {
                    text: b64TransferString,
                    width: 200,
                    height: 200,
                    colorDark : "#0f172a",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M
                });
            } else {

                container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b64TransferString)}" class="w-48 h-48 rounded-lg mx-auto" />`;
            }
        } catch (e) {
            console.error(e);
            if (typeof showVnsAlert === 'function') showVnsAlert("Error", "Failed to generate QR matrix.", "error");
        }
    };
}

function closeCustomQRModal() {
    document.getElementById('qr-display-modal').classList.add('hidden');
    document.getElementById('qr-canvas-container').innerHTML = '';
    
    if (['import-string-modal', 'import-auth-modal', 'backup-modal', 'gen-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal', 'custom-alert-modal', 'custom-confirm-modal'].every(id => { const el = document.getElementById(id); return !el || el.classList.contains('hidden'); })) {
        document.getElementById('gen-overlay').classList.add('hidden');
    }
}
async function initializeMobileScanner() {
    if (!window.Capacitor || !window.Capacitor.Plugins.BarcodeScanner) {
        showAlert (t("hardware_scanner_error"));
        return;
    }

    try {
        const status = await Capacitor.Plugins.BarcodeScanner.checkPermission({ force: true });
        if (!status.granted) {
            showAlert(t("err_camera_access"));
            return;
        }
        // 1. Hide main app components
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.style.display = 'none';

        // 2. Create the scanner mask UI
        const scannerUI = document.createElement('div');
        scannerUI.id = 'custom-scanner-ui';
        scannerUI.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: transparent;
        `;
        scannerUI.innerHTML = `
            <div style="margin-bottom: 30px; color: white; font-weight: 900; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,1); z-index: 2; letter-spacing: 1px;">
                ${t("qr_align_frame")}
            </div>
            
            <div style="
                width: 260px; 
                height: 260px; 
                border: 4px solid #0D9488; 
                border-radius: 24px; 
                box-shadow: 0 0 0 100vw rgba(0, 0, 0, 0.85); 
                position: relative;
                z-index: 1;
            ">
                <div style="width: 100%; height: 2px; background: #0D9488; position: absolute; top: 50%; box-shadow: 0 0 10px #0D9488;"></div>
            </div>

            <button id="native-qr-close-btn" style="
                margin-top: 50px; 
                background: #ef4444; 
                color: white; 
                padding: 14px 28px; 
                border-radius: 12px; 
                font-weight: 900; 
                font-size: 14px;
                box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
                border: none;
                z-index: 2;
            ">? ${t("btn_cancel_return")}</button>
        `;

        document.body.appendChild(scannerUI);
        
        // Make background transparent for camera
        document.body.style.background = "transparent";
        document.documentElement.style.background = "transparent";

        document.getElementById('native-qr-close-btn').onclick = stopAndCloseQRScanner;

        // 3. Start scanning
        await Capacitor.Plugins.BarcodeScanner.hideBackground();
        const result = await Capacitor.Plugins.BarcodeScanner.startScan();

        if (result.hasContent) {
            await stopAndCloseQRScanner();
            onScanSuccess(result.content);
        }

    } catch (err) {
    await stopAndCloseQRScanner();
    showAlert(t("err_camera_execution").replace("{error}", err.message));
}
}

async function stopAndCloseQRScanner() {
    if (window.Capacitor && window.Capacitor.Plugins.BarcodeScanner) {
        await Capacitor.Plugins.BarcodeScanner.showBackground();
        await Capacitor.Plugins.BarcodeScanner.stopScan();
    }
    
    const scannerUI = document.getElementById('custom-scanner-ui');
    if (scannerUI) scannerUI.remove();

    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.display = '';

    document.body.style.background = "";
    document.documentElement.style.background = "";
}


let scannedCableServerInfo = null;
// ==========================================
// DATA INJECTION & DECRYPTION HANDLING (USB + OPTICAL)
// ==========================================
async function onScanSuccess(decodedText) {
    try {
        let parsedJson = null;
        try { parsedJson = JSON.parse(decodedText); } catch (e) {}

        if (parsedJson && parsedJson.ip && parsedJson.port && parsedJson.token) {
            const scannerModal = document.getElementById('qr-scanner-modal');
            if (scannerModal) scannerModal.classList.add('hidden');

            scannedCableServerInfo = parsedJson;

            const syncModal = document.getElementById('cable-sync-actions-modal');
            if (syncModal) {
                syncModal.classList.remove('hidden');

                const pullBtn = syncModal.querySelector('button[onclick*="pullDatabaseFromPC"]');
                if (pullBtn) {
                    pullBtn.style.display = parsedJson.action === 'push_only' ? 'none' : '';
                }
                const pushBtn = syncModal.querySelector('button[onclick*="pushDatabaseToPC"]');
                if (pushBtn) {
                    pushBtn.style.display = parsedJson.action === 'pull_only' ? 'none' : '';
                }
            }
            return;
        }

        const safeText = String(decodedText || '').replace(/[^A-Za-z0-9+/=]/g, '');
        let parsedB64;
        try {
            parsedB64 = atob(safeText);
        } catch (e) {
            if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t('err_scan_invalid_format') : 'Invalid QR');
            return;
        }

        let opticalObj;
        try {
            opticalObj = JSON.parse(parsedB64);
        } catch (e) {
            if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t('err_scan_invalid_json') : 'Invalid JSON');
            return;
        }

        function norm(s) {
            return String(s || '').trim().toLowerCase();
        }

        if (opticalObj.vns_opt === '1.2' && opticalObj.cipher) {
            let decryptedPayload = null;
            try {
                if (opticalObj.t_key) {
                    const tempKeyBuffer = base64ToBuf(opticalObj.t_key);
                    const tempKey = await window.crypto.subtle.importKey(
                        'raw',
                        tempKeyBuffer,
                        { name: 'AES-GCM', length: 256 },
                        true,
                        ['encrypt', 'decrypt']
                    );
                    decryptedPayload = await decryptData(
                        { iv: opticalObj.iv, ciphertext: opticalObj.cipher },
                        tempKey
                    );
                } else if (typeof activeMasterKey !== 'undefined' && activeMasterKey) {
                    decryptedPayload = await decryptData(
                        { iv: opticalObj.iv, ciphertext: opticalObj.cipher },
                        activeMasterKey
                    );
                }
            } catch (e) {
                if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t('err_decryption_failed') : 'Decrypt failed');
                return;
            }

            if (!decryptedPayload) {
                if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t('err_empty_payload') : 'Empty payload');
                return;
            }

            let injectedItem;
            try {
                injectedItem = JSON.parse(decryptedPayload);
            } catch (e) {
                if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t('err_parsing_injected_item') : 'Parse error');
                return;
            }

            const scannerModal = document.getElementById('qr-scanner-modal');
            if (scannerModal) scannerModal.classList.add('hidden');

            const incoming = {
                id: injectedItem.id != null ? injectedItem.id : Date.now(),
                name: injectedItem.name || injectedItem.label || 'Imported Item',
                user: injectedItem.user || '',
                pass: injectedItem.pass || '',
                site: injectedItem.site || '',
                note: injectedItem.note || '',
                backup: injectedItem.backup || '',
                folder: injectedItem.folder || 'Imported',
                isFavorite: !!injectedItem.isFavorite,
                status: injectedItem.status || 'active',
                customLogo: injectedItem.customLogo || ''
            };

            const existing = (items || []).find(function (x) {
                if (!x || x.status === 'deleted') return false;
                if (String(x.id) === String(incoming.id)) return true;
                if (norm(x.name) && norm(x.name) === norm(incoming.name) &&
                    norm(x.user) === norm(incoming.user)) {
                    return true;
                }
                return false;
            });

            if (existing) {
                const index = items.findIndex(function (x) {
                    return String(x.id) === String(existing.id);
                });
                if (index !== -1) {
                    items[index] = Object.assign({}, items[index], incoming, { id: existing.id });
                }
                if (typeof saveItemsToStorage === 'function') await saveItemsToStorage();
                if (typeof renderList === 'function') renderList();
                const overlay = document.getElementById('gen-overlay');
                if (overlay) overlay.classList.add('hidden');
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert('Updated', (typeof t === 'function' ? t('success_optical_transfer_completed') : 'Item updated.'), 'success');
                } else if (typeof showAlert === 'function') {
                    showAlert(typeof t === 'function' ? t('success_optical_transfer_completed') : 'Item updated.');
                }
            } else {
                incoming.id = Date.now();
                items.push(incoming);
                if (typeof saveItemsToStorage === 'function') await saveItemsToStorage();
                if (typeof renderList === 'function') renderList();
                const overlay = document.getElementById('gen-overlay');
                if (overlay) overlay.classList.add('hidden');
                if (typeof showAlert === 'function') {
                    showAlert(typeof t === 'function' ? t('success_item_added_vault') : 'Item added.');
                }
            }
            return;
        }

        if (typeof showAlert === 'function') {
            showAlert(typeof t === 'function' ? t('err_unrecognized_qr_format') : 'Unrecognized QR');
        }
    } catch (e) {
        if (typeof showAlert === 'function') {
            showAlert(
                typeof t === 'function'
                    ? t('err_scan_error_message').replace('{error}', e.message)
                    : ('Scan error: ' + e.message)
            );
        }
    }
}
function showOpticalConflictModal(existingItem) {
    const overlay = document.getElementById('gen-overlay');
    if(overlay) overlay.classList.remove('hidden');
    const modalHtml = `
    <div id="dynamic-conflict-modal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white rounded-3xl p-6 shadow-2xl z-[400] border border-slate-100 flex flex-col items-center">
        <div class="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 class="text-sm font-black text-red-500 mb-1 text-center uppercase tracking-widest">${t("modal_conflict_detected")}</h3>
        <p class="text-xs text-center text-slate-500 mb-6 font-bold leading-relaxed">${t("conflict_item_exists").replace("{name}", `<span class="text-slate-800">${existingItem.name}</span>`)}</p>
        <div class="flex flex-col gap-2.5 w-full">
            <button id="btn-conflict-replace" class="w-full py-3.5 bg-[#0D9488] hover:bg-[#e16519] text-white rounded-xl text-[11px] font-black shadow-md uppercase tracking-wider transition-all border-none cursor-pointer">${t("btn_replace_existing")}</button>
            <button id="btn-conflict-skip" class="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-black border border-slate-200 uppercase tracking-wider transition-all cursor-pointer">${t("btn_skip_create_copy")}</button>
            <button id="btn-conflict-cancel" class="w-full py-2 text-slate-400 hover:text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border-none bg-transparent cursor-pointer">${t("btn_cancel_transfer")}</button>
        </div>
    </div>
`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-conflict-replace').onclick = () => {
        document.getElementById('dynamic-conflict-modal').remove();
        processOpticalInjection(true, existingItem.id);
    };
    document.getElementById('btn-conflict-skip').onclick = () => {
        document.getElementById('dynamic-conflict-modal').remove();
        processOpticalInjection(false, null);
    };
    document.getElementById('btn-conflict-cancel').onclick = () => {
        document.getElementById('dynamic-conflict-modal').remove();
        pendingOpticalItem = null;
        if (['import-string-modal', 'import-auth-modal', 'backup-modal', 'gen-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal', 'custom-alert-modal', 'custom-confirm-modal', 'qr-display-modal', 'qr-scanner-modal'].every(id => { const el = document.getElementById(id); return !el || el.classList.contains('hidden'); })) {
            const overlay = document.getElementById('gen-overlay');
            if(overlay) overlay.classList.add('hidden');
        }
    };
}

async function processOpticalInjection(replace, existingId) {
    if (!pendingOpticalItem) return;
    
    if (replace && existingId) {
        const index = items.findIndex(x => x.id === existingId);
        if (index !== -1) {
            items[index] = { ...items[index], ...pendingOpticalItem, id: existingId };
        }
    } else {
        pendingOpticalItem.id = Date.now();
        items.push(pendingOpticalItem);
    }

    await saveItemsToStorage();
    renderList();
    pendingOpticalItem = null;
    
    if (document.getElementById('dynamic-conflict-modal')) document.getElementById('dynamic-conflict-modal').remove();
    if (['import-string-modal', 'import-auth-modal', 'backup-modal', 'gen-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal', 'custom-alert-modal', 'custom-confirm-modal', 'qr-display-modal', 'qr-scanner-modal'].every(id => { const el = document.getElementById(id); return !el || el.classList.contains('hidden'); })) {
        const overlay = document.getElementById('gen-overlay');
        if(overlay) overlay.classList.add('hidden');
    }

    showAlert(t("success_optical_transfer_completed"));
}
    function viewItem(id) {
    activeId = id; 
    const item = items.find(x => x.id === id); 
    if (!item) return; 
    
    switchUI('view');
    
    ['name', 'folder', 'user', 'pass', 'backup', 'site', 'note'].forEach(k => {
        const el = document.getElementById('i-' + k); 
        if(el) {
            el.value = item[k] || '';
            if (k === 'backup') { 
                el.classList.add('backup-masked'); 
                el.style.height = 'auto'; 
                el.style.height = el.scrollHeight + 'px'; 
            }
        }
    });

   
    const existingHistoryBox = document.getElementById('vns-password-history');
    if (existingHistoryBox) existingHistoryBox.remove(); 
    
    if (item.passwordHistory && item.passwordHistory.length > 0) {
        const passContainer = document.getElementById('i-pass').closest('.input-group');
        if (passContainer) {
            const historyDiv = document.createElement('div');
            historyDiv.id = 'vns-password-history';
            historyDiv.className = 'mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs';
            historyDiv.innerHTML = `<p class="font-black text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Previous Passwords (Last 3)</p>`;
            
            item.passwordHistory.forEach((hist, index) => {
                historyDiv.innerHTML += `
                    <div class="flex items-center justify-between mt-1">
                        <span class="font-bold text-slate-700 font-mono tracking-wider">${hist.pass}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold text-slate-400">${hist.date}</span>
                            <button onclick="copyValueDirectText('${hist.pass.replace(/'/g, "\\'")}')" class="text-[#0D9488] bg-orange-50 hover:bg-orange-100 rounded-md px-2 py-1 text-[9px] font-black uppercase transition-all">Copy</button>
                        </div>
                    </div>
                `;
            });
            passContainer.insertAdjacentElement('afterend', historyDiv);
        }
    }
    
    currentCustomLogoB64 = item.customLogo || findSharedLogoForName(item.name, item.id) || "";
    if (!item.customLogo && currentCustomLogoB64) {
        item.customLogo = currentCustomLogoB64;
    }
    updateFormLogoPreview(currentCustomLogoB64, item.name); 
    renderList();
    
    if (item && item.backup) {
        const isSSH = item.backup.includes("BEGIN") || item.backup.includes("ssh-") || item.backup.includes("PRIVATE KEY");
        const radioSSH = document.querySelector('input[name="payload-type"][value="ssh"]'); 
        const radioBackup = document.querySelector('input[name="payload-type"][value="backup"]');
        if (isSSH && radioSSH) { 
            radioSSH.checked = true; switchPayloadField('ssh'); 
        } else if (radioBackup) { 
            radioBackup.checked = true; switchPayloadField('backup'); 
        }
    }
        const passInput = document.getElementById('i-pass');
    if (passInput) checkRealTimePasswordStatus(passInput.value);

    toggleMainSectionMobile(true);

    // ??? ??? ???? ?? ???? ????? ?????? ?????? ????? ????:
    setTimeout(() => {
        ['i-backup', 'i-note'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
            }
        });
    }, 100);
}
let contextMenuTargetId = null;

function showContextMenu(ev, id, manualX, manualY) {
    if (ev) {
        try { ev.preventDefault(); ev.stopPropagation(); } catch(e) {}
    }
    contextMenuTargetId = id;
    const menu = document.getElementById('item-context-menu');
    menu.style.display = 'block';
    
    let x = manualX !== undefined ? manualX : (ev && ev.clientX) || 50;
    let y = manualY !== undefined ? manualY : (ev && ev.clientY) || 50;
    
    if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth - 10;
    if (y + menu.offsetHeight > window.innerHeight) y = window.innerHeight - menu.offsetHeight - 10;
    if (x < 10) x = 10;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
}


document.addEventListener('click', () => {
    const menu = document.getElementById('item-context-menu');
    if (menu) menu.style.display = 'none';
});


document.addEventListener('touchstart', (e) => {
    const menu = document.getElementById('item-context-menu');
    if (menu && !menu.contains(e.target)) menu.style.display = 'none';
}, { passive: true });

    async function handleCtxAction(action) {
    if (!contextMenuTargetId) return;
    const item = items.find(x => x.id === contextMenuTargetId);
    if (!item) return;

    if (action === 'qr') {
        activeId = contextMenuTargetId;
        generateOfflineQRForItem(contextMenuTargetId);
    } else if (action === 'edit') {
        viewItem(contextMenuTargetId);
        switchUI('edit');
    } else if (action === 'copy-u') {
        if (item.user) { copyValueDirectText(item.user); }
        else { showAlert(t("err_username_blank")); }
    } else if (action === 'copy-p') {
        if (item.pass) { copyValueDirectText(item.pass); }
        else { showAlert(t("err_passkey_blank")); }
    } else if (action === 'fav') {
        toggleFavorite(contextMenuTargetId, {stopPropagation: () => {}}); 
    } else if (action === 'arch') {
        item.status = item.status === 'archived' ? 'active' : 'archived';
        await saveItemsToStorage();
        renderList();
    } else if (action === 'trash') {
        deleteItemRow(contextMenuTargetId, {stopPropagation: () => {}});
    }
    
    document.getElementById('item-context-menu').style.display = 'none';
}
	function showPolicy() {
    document.getElementById('view-placeholder').classList.add('hidden');
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('settings-container').classList.add('hidden');
    
    const policyContainer = document.getElementById('policy-container');
    if (policyContainer) policyContainer.classList.remove('hidden');
    
    activeId = null;
    document.querySelectorAll('.sidebar-item, .folder-sub-item').forEach(i => i.classList.remove('active'));
    renderList();
    toggleMainSectionMobile(true);
}
// ==========================================
// UNIFIED SYSTEM BOOTSTRAP (FIXED RACE CONDITION)
// ==========================================
window.onload = async () => {
   
    _vnsNavPush(); 
    _vnsNavPush(); 
    _vnsNavPush(); 

   
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        try {
            const { keys } = await window.Capacitor.Plugins.Preferences.keys();
            for (let k of keys) {
                const { value } = await window.Capacitor.Plugins.Preferences.get({ key: k });
                if (value !== null) {
                    Object.getPrototypeOf(window.localStorage).setItem.call(localStorage, k, value);
                }
            }
        } catch(e) { console.warn("Native Storage Sync Warning:", e); }
    }

    
    await runStorageMigration();
    loadMasterAccountState(true); 
    startOtpSimulator();
    initAntiKeylogger();
    checkLockoutState();
    checkPendingAutosave();
    
    initializeBackupUI();
};
	
//  (Autosave)
function checkPendingAutosave() {
    const pendingStr = localStorage.getItem('vns_pending_save');
    if (!pendingStr) return;

    try {
        const pending = JSON.parse(pendingStr);
        
        localStorage.removeItem('vns_pending_save');
        
        if (confirm(t("confirm_new_credential_android").replace("{app}", pending.app || "").replace("{user}", pending.user || ""))) {
            
        showAddForm();

        document.getElementById('i-name').value = pending.app || t("default_new_account");
        document.getElementById('i-user').value = pending.user || "";
        document.getElementById('i-pass').value = pending.pass || "";
        document.getElementById('i-site').value = pending.app || "";
        document.getElementById('i-note').value = t("note_captured_autosave");

        handleNameInput(pending.app || t("default_new_account"));
    }
} catch (e) {
    console.error(t("log_autosave_error"), e);
}
}
    // ==========================================
// OVERALL VAULT HEALTH CHECK SCANNER
// ==========================================
function runHealthCheck() {
    const activeItems = items.filter(x => x.status !== 'deleted');
    const detailsContainer = document.getElementById('health-details');
    const scoreText = document.getElementById('health-score-text');
    const scoreLabel = document.getElementById('health-score-label');
    const scoreBox = document.getElementById('health-score-container');

    if (activeItems.length === 0) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Vault Empty", typeof t === 'function' ? t("info_vault_empty_scan") : "No active items found for health scan.", "warning");
        } else {
            showAlert("No active items found for health scan.");
        }
        return;
    }

    let totalScore = 0;
    const passCounts = {};
    activeItems.forEach(item => {
        if (item.pass) {
            passCounts[item.pass] = (passCounts[item.pass] || 0) + 1;
        }
    });

    let reportHTML = '';

    activeItems.forEach(item => {
        if (!item.pass) return; 

        let score = 0;
        const val = item.pass;
        if (val.length >= 8) score++;
        if (val.length >= 12) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[-_/*!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~`]/.test(val)) score++;

        let statusColor = '#10b981'; 
        let statusText = typeof t === 'function' ? t("pass_strong") : "STRONG";
        
        if (score <= 2) {
            statusColor = '#ef4444';
            statusText = typeof t === 'function' ? t("pass_weak") : "WEAK";
        } else if (score <= 4) {
            statusColor = '#f59e0b';
            statusText = typeof t === 'function' ? t("pass_fair") : "FAIR";
        }

        let isReused = passCounts[item.pass] > 1;
        if (score <= 4 || isReused) {
            let warnings = [];
            if (score <= 4) warnings.push(`<span style="color:${statusColor}">${statusText}</span>`);
            if (isReused) warnings.push(`<span class="text-red-500">Reused</span>`);
            
            reportHTML += `
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onclick="closeHealthModal(); viewItem(${item.id});">
                    <div class="flex items-center gap-3 truncate">
                        <div class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs flex-shrink-0">
                            ${item.name ? item.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="truncate">
                            <p class="text-xs font-black text-slate-700 truncate">${item.name}</p>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${warnings.join(' | ')}</p>
                        </div>
                    </div>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
                </div>
            `;
        }
        
        totalScore += (score / 6) * 100;
    });

    if (reportHTML === '') {
        reportHTML = `
            <div class="flex flex-col items-center justify-center py-6 opacity-70">
                <svg class="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="text-xs font-black text-slate-600 uppercase tracking-widest">${typeof t === 'function' ? t("health_all_clear_title") : "All Systems Secure"}</p>
                <p class="text-[10px] text-slate-400 font-bold mt-1">${typeof t === 'function' ? t("health_no_issues_found") : "No weak or reused passwords detected."}</p>
            </div>
        `;
    }  

    if (detailsContainer) detailsContainer.innerHTML = reportHTML;
    
    const averageScore = activeItems.length > 0 ? Math.round(totalScore / activeItems.length) : 100;
    if (scoreText) scoreText.innerText = averageScore + '%';
    
    if (scoreBox && scoreLabel) {
        if (averageScore < 50) {
            scoreBox.className = "mb-5 flex flex-col items-center justify-center py-4 rounded-2xl border bg-red-50 border-red-200 text-red-600";
            scoreLabel.innerText = typeof t === 'function' ? t("security_score_critical") : "CRITICAL RISK";
        } else if (averageScore < 80) {
            scoreBox.className = "mb-5 flex flex-col items-center justify-center py-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-600";
            scoreLabel.innerText = typeof t === 'function' ? t("security_score_improvement") : "NEEDS IMPROVEMENT";
        } else {
            scoreBox.className = "mb-5 flex flex-col items-center justify-center py-4 rounded-2xl border bg-green-50 border-green-200 text-green-600";
            scoreLabel.innerText = typeof t === 'function' ? t("security_score_excellent") : "EXCELLENT STATUS";
        }
    }

    const overlay = document.getElementById('gen-overlay');
    const healthModal = document.getElementById('health-check-modal');
    if (overlay) overlay.classList.remove('hidden');
    if (healthModal) healthModal.classList.remove('hidden');
}  

function closeHealthModal() {
    document.getElementById('health-check-modal').classList.add('hidden');
    const otherModals = ['import-string-modal', 'import-auth-modal', 'backup-modal', 'gen-modal', 'folder-create-modal', 'folder-rename-modal', 'folder-delete-modal', 'custom-alert-modal', 'custom-confirm-modal', 'qr-display-modal', 'qr-scanner-modal'];
    if (otherModals.every(id => { const el = document.getElementById(id); return !el || el.classList.contains('hidden'); })) {
        const overlay = document.getElementById('gen-overlay');
        if(overlay) overlay.classList.add('hidden');
    }
}
document.addEventListener('touchstart', function(e) {
    const menu = document.getElementById('item-context-menu');
    if (menu && menu.style.display === 'block' && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});
    // recovery and deactive 2FA
    // ==========================================
// SECURITY RECOVERY SYSTEM - FULL LOGIC (Beta)
// ==========================================


var activeRecoveryType = null;
var verifiedPhraseForReset = ""; 
function showRecoveryDashboard() {
    const loginCard = document.getElementById('login-card');
    if (loginCard) loginCard.classList.add('hidden');
    
    const recoveryCard = document.getElementById('recovery-card');
    if (recoveryCard) recoveryCard.classList.remove('hidden');
}
    window.activeRecoveryType = null;
window.verifiedPhraseForReset = "";
window.recoveryMethod = function(type) {
    try {
        window.activeRecoveryType = type;
        window.verifiedPhraseForReset = ""; 
        
        document.getElementById('recovery-methods-buttons').classList.add('hidden');
        document.getElementById('recovery-new-password-fields').classList.add('hidden');
        
        const inputSection = document.getElementById('recovery-input-section');
        const wrapper = document.getElementById('recovery-dynamic-field-wrapper');
        const header = document.querySelector('#recovery-card h1');
        
        inputSection.classList.remove('hidden');
        
        if (type === 'master') {
            header.innerText = "Bypass 2FA / PIN";
            wrapper.innerHTML = `
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1 mb-1">Master Password</label>
                <input type="password" id="rec-input-value" class="auth-input-field" placeholder="Enter master password">
                <button type="button" onclick="window.executeRecoveryAction()" class="w-full mt-4 bg-[#0D9488] hover:bg-[#0f766e] text-white font-black py-3 rounded-xl transition-all text-xs uppercase tracking-widest shadow-md border-none cursor-pointer">Disable Sub-Locks</button>
            `;
        } else if (type === 'phrase') {
            header.innerText = "Reset Master Password";
            wrapper.innerHTML = `
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1 mb-1">12-Word Recovery Phrase</label>
                <textarea id="rec-input-value" class="form-input font-mono text-[11px] h-20 resize-none leading-relaxed mb-2" placeholder="word1 word2 word3 ..."></textarea>
                <button type="button" onclick="window.executeRecoveryAction()" class="w-full mt-3 bg-[#0D9488] hover:bg-[#0f766e] text-white font-black py-3 rounded-xl transition-all text-xs uppercase tracking-widest shadow-md border-none cursor-pointer">Verify Mnemonic Phrase</button>
            `;
        }
    } catch (e) {
        alert("CRITICAL ERROR in recoveryMethod: " + e.message);
    }
};
    
    
function handleRecoveryKeyUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
        showAlert(t("err_select_valid_txt_file"));
        event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        let content = e.target.result;
        content = content.replace(/[0-9.]/g, '').replace(/\s+/g, ' ').trim();
        const inputBox = document.getElementById('rec-input-value');
        if (inputBox) {
            inputBox.value = content;
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}
if (typeof window.originalToggleToLogin === 'undefined') {
    window.originalToggleToLogin = toggleToLogin;
}
toggleToLogin = function() {
    if (!vnsHasMasterAccount()) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                (typeof t === 'function' && t('reg_need_register_title')) || 'Register first',
                (typeof t === 'function' && t('reg_need_register_msg')) || 'No vault account exists on this device. Please complete registration first.',
                'warning'
            );
        } else if (typeof showAlert === 'function') {
            showAlert('No vault account exists. Please register first.');
        } else {
            alert('No vault account exists. Please register first.');
        }
        updateRegReturnLoginVisibility();
        return;
    }
    verifiedPhraseForReset = ""; 
    const recCard = document.getElementById('recovery-card');
    if (recCard) {
        recCard.classList.add('hidden');
        const btns = document.querySelector('#recovery-card .space-y-3');
        const text = document.querySelector('#recovery-card p');
        const inputSec = document.getElementById('recovery-input-section');
        const header = document.querySelector('#recovery-card h1');
        
        if (btns) btns.classList.remove('hidden');
        if (text) text.classList.remove('hidden');
        if (inputSec) inputSec.classList.add('hidden');
        if (header) header.innerText = "Security Recovery";
    }
    window.originalToggleToLogin();
};
    

    window.executeRecoveryAction = async function() {
    try {
        const inputEl = document.getElementById('rec-input-value');
        if (!inputEl) { alert("Input field not found in DOM!"); return; }
        
        const inputVal = inputEl.value.trim();
        if (!inputVal) { alert("Please enter the required phrase or password."); return; }
        
        const masterStr = localStorage.getItem('vns_master_user');
        if (!masterStr) { alert("Account data not found in browser storage!"); return; }
        const master = JSON.parse(masterStr);

        if (window.activeRecoveryType === 'master') {
            const salt = new Uint8Array(base64ToBuf(master.salt));
            const derivedKey = await deriveKeyFromPassword(inputVal, salt);
            let isVerified = false;
            
            if (master.isLegacy || master.encryptedMnemonic) {
                const dec = await decryptData(master.encryptedMnemonic, derivedKey);
                if (dec) isVerified = true;
            } else {
                const verif = await decryptData(master.verificationBlock, derivedKey);
                if (verif === "VNS_VERIFIED") isVerified = true;
            }

            if (isVerified) {
                master.is2faEnabled = false; master.twoFactorSecret = "";
                master.isPasscodeEnabled = false; master.localPasscode = ""; master.passcodeSalt = "";
                localStorage.setItem('vns_master_user', JSON.stringify(master));
                alert("Success: All sub-locks and 2FA are disabled.");
                toggleToLogin(); 
            } else {
                alert("Error: Incorrect Master Password.");
            }
        } 
        
        else if (window.activeRecoveryType === 'phrase') {
            const enteredPhrase = inputVal.toLowerCase().replace(/\s+/g, ' ').trim();
            const storedPhrase = master.recoveryMnemonic ? master.recoveryMnemonic.toLowerCase().trim() : "";
            
            if (!storedPhrase) { alert("Error: No original recovery phrase found in database."); return; }
            
            if (enteredPhrase === storedPhrase) {
                window.verifiedPhraseForReset = storedPhrase; 
                document.getElementById('recovery-input-section').classList.add('hidden');
                document.getElementById('recovery-new-password-fields').classList.remove('hidden');
                document.querySelector('#recovery-card h1').innerText = "Set New Password";
                alert("Success: 12-Word Phrase matches! Please set your new master password below.");
            } else {
                alert("Error: The 12-Word Phrase does NOT match.");
            }
        }
    } catch (e) {
        alert("CRITICAL ERROR in executeRecoveryAction: " + e.message);
    }
};

// ???? ???? ???? ??? ????? ?????? ?? ?????
if (typeof window.originalToggleToLogin === 'undefined') {
    window.originalToggleToLogin = toggleToLogin;
}
toggleToLogin = function() {
    if (!vnsHasMasterAccount()) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                (typeof t === 'function' && t('reg_need_register_title')) || 'Register first',
                (typeof t === 'function' && t('reg_need_register_msg')) || 'No vault account exists on this device. Please complete registration first.',
                'warning'
            );
        } else if (typeof showAlert === 'function') {
            showAlert('No vault account exists. Please register first.');
        } else {
            alert('No vault account exists. Please register first.');
        }
        updateRegReturnLoginVisibility();
        return;
    }
    verifiedPhraseForReset = ""; 
    const recCard = document.getElementById('recovery-card');
    if (recCard) {
        recCard.classList.add('hidden');
        document.getElementById('recovery-methods-buttons').classList.remove('hidden');
        document.getElementById('recovery-input-section').classList.add('hidden');
        document.getElementById('recovery-new-password-fields').classList.add('hidden');
        const header = document.querySelector('#recovery-card h1');
        if (header) header.innerText = "Security Recovery";
    }
    window.originalToggleToLogin();
};    

window.executePasswordReset = async function() {
    try {
        const newPass = document.getElementById('rec-new-pass').value;
        const confirmPass = document.getElementById('rec-confirm-pass').value;
        
        if (!newPass || newPass !== confirmPass) { alert("Error: Passwords do not match!"); return; }
        if (newPass.length < 8) { alert("Error: Password must be at least 8 characters."); return; }

        const masterStr = localStorage.getItem('vns_master_user');
        const master = JSON.parse(masterStr);
        const targetPhrase = window.verifiedPhraseForReset || master.recoveryMnemonic;
        
        const newSaltBuf = window.crypto.getRandomValues(new Uint8Array(16));
        const newSaltB64 = bufToBase64(newSaltBuf); 
        const newDerivedKey = await deriveKeyFromPassword(newPass, newSaltBuf);
        
        const newEncMnemonic = await encryptData(targetPhrase, newDerivedKey);
        const newVerifBlock = await encryptData("VNS_VERIFIED", newDerivedKey);
        
        master.salt = newSaltB64;
        master.encryptedMnemonic = newEncMnemonic;
        master.verificationBlock = newVerifBlock;
        master.recoveryMnemonic = targetPhrase;
        
        master.is2faEnabled = false; master.twoFactorSecret = "";
        master.isPasscodeEnabled = false; master.localPasscode = ""; master.passcodeSalt = "";
        
        localStorage.setItem('vns_master_user', JSON.stringify(master));
        
        alert("SUCCESS: Your Master Password has been securely reset! Redirecting to login...");
        
        window.verifiedPhraseForReset = ""; 
        document.getElementById('rec-new-pass').value = "";
        document.getElementById('rec-confirm-pass').value = "";
        toggleToLogin(); 
        
    } catch (e) {
        alert("CRITICAL ERROR in executePasswordReset: " + e.message);
    }
};

// ??? ????? ???? ?????? ?? ?????
if (typeof window.originalToggleToLogin === 'undefined') {
    window.originalToggleToLogin = toggleToLogin;
}
window.toggleToLogin = function() {
    if (!vnsHasMasterAccount()) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                (typeof t === 'function' && t('reg_need_register_title')) || 'Register first',
                (typeof t === 'function' && t('reg_need_register_msg')) || 'No vault account exists on this device. Please complete registration first.',
                'warning'
            );
        } else if (typeof showAlert === 'function') {
            showAlert('No vault account exists. Please register first.');
        } else {
            alert('No vault account exists. Please register first.');
        }
        updateRegReturnLoginVisibility();
        return;
    }
    window.verifiedPhraseForReset = ""; 
    const recCard = document.getElementById('recovery-card');
    if (recCard) {
        recCard.classList.add('hidden');
        document.getElementById('recovery-methods-buttons').classList.remove('hidden');
        document.getElementById('recovery-input-section').classList.add('hidden');
        document.getElementById('recovery-new-password-fields').classList.add('hidden');
        const header = document.querySelector('#recovery-card h1');
        if (header) header.innerText = "Security Recovery";
    }
    window.originalToggleToLogin();
};    
    // part 2
    // ==========================================
// CROSS-DEVICE ONBOARDING (INITIAL IMPORT)
// ==========================================


    window.cancelInitRestore = function() { console.log("Init restore feature is disabled."); };
    
function handleInitImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            document.getElementById('init-import-string').value = content;
            event.target.value = '';
            showAlert(t("success_backup_loaded_proceed"));
        } catch (err) {
            showAlert(t("err_reading_backup_format"));
        }
    };
    reader.readAsText(file);
}
function processInitImportPayload() {
    const payloadStr = document.getElementById('init-import-string').value.trim();
    if (!payloadStr) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Warning", typeof t === 'function' ? t("err_select_file_or_paste_payload") : "Please select a backup file or paste string.", "warning");
        } else {
            showAlert("Please select a file or paste payload.");
        }
        return;
    }

    try {
        let payloadObj = null;

        // Û±. ØªÙ„Ø§Ø´ Ø¨Ø±Ø§ÛŒ Ù¾Ø§Ø±Ø³ Ú©Ø±Ø¯Ù† Ø¨Ù‡ ØµÙˆØ±Øª JSON
        try {
            payloadObj = JSON.parse(payloadStr);
        } catch (e) {
            // Ø§Ú¯Ø± Base64 Ø¨ÙˆØ¯ØŒ Ø§Ø¨ØªØ¯Ø§ Ø¯Ú©Ø¯ Ùˆ Ø³Ù¾Ø³ Ù¾Ø§Ø±Ø³ Ø´ÙˆØ¯
            const cleanB64 = payloadStr.replace(/\s/g, '');
            const decodedStr = new TextDecoder().decode(base64ToBuf(cleanB64));
            payloadObj = JSON.parse(decodedStr);
        }

        if (!payloadObj) {
            throw new Error("Invalid structure");
        }

        // Û². Ø°Ø®ÛŒØ±Ù‡ Ù…ÙˆÙ‚Øª Ø¯ÛŒØªØ§ Ø¬Ù‡Øª Ø¨Ø§Ø²Ø®ÙˆØ§Ù†ÛŒ Ù¾Ø³ Ø§Ø² Ø¯Ø±ÛŒØ§ÙØª Ú©Ù„Ù…Ø§Øª ÙØ±ÛŒØ²
        pendingImportData = payloadStr;

        // Û³. Ø§Ú¯Ø± Ù¾Ú©ÛŒØ¬ Ú©Ø§Ù…Ù„ Ù‡Ù…Ú¯Ø§Ù…â€ŒØ³Ø§Ø²ÛŒ ÙˆÛŒÙ†Ø¯ÙˆØ²/Ù…ÙˆØ¨Ø§ÛŒÙ„ Ø¨Ø§Ø´Ø¯ (Ø­Ø§ÙˆÛŒ masterUser)
        if (payloadObj.masterUser && payloadObj.encryptedData) {
            localStorage.setItem('vns_master_user', JSON.stringify(payloadObj.masterUser));
            localStorage.setItem('vns_vault_encrypted_db', JSON.stringify(payloadObj.encryptedData));

            if (payloadObj.cardsData && Array.isArray(payloadObj.cardsData)) {
                localStorage.setItem('vns_cards', JSON.stringify(payloadObj.cardsData));
                if (typeof mPaymentCards !== 'undefined') mPaymentCards = payloadObj.cardsData;
            }
            if (payloadObj.idDocsData && Array.isArray(payloadObj.idDocsData)) {
                localStorage.setItem('vns_id_docs', JSON.stringify(payloadObj.idDocsData));
                if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = payloadObj.idDocsData;
                if (typeof mLoadIdDocsFromStorage === 'function') mLoadIdDocsFromStorage();
            }

            document.getElementById('init-import-string').value = '';
            document.getElementById('restore-init-card').classList.add('hidden');

            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Device Synchronized", "Account structure mounted successfully. Proceeding to login...", "success");
            } else {
                showAlert("Account mounted successfully.");
            }

            // Ù‡Ø¯Ø§ÛŒØª Ø®ÙˆØ¯Ú©Ø§Ø± Ø¨Ù‡ ØµÙØ­Ù‡ ÙˆØ±ÙˆØ¯
            loadMasterAccountState();
            return;
        }

        // Û´. Ø§Ú¯Ø± ÙØ§ÛŒÙ„ Ø¨Ú©â€ŒØ¢Ù¾ Ø§Ø³ØªØ§Ù†Ø¯Ø§Ø±Ø¯ Ø±Ù…Ø²Ø´Ø¯Ù‡ (Ù†ÛŒØ§Ø² Ø¨Ù‡ Û±Û² Ú©Ù„Ù…Ù‡) Ø¨Ø§Ø´Ø¯
        if (payloadObj.encrypted_backup || payloadObj.iv) {
            document.getElementById('restore-init-card').classList.add('hidden');

            // Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ù…ÙˆØ¯Ø§Ù„ Ø¯Ø±ÛŒØ§ÙØª Ú©Ù„Ù…Ø§Øª Û±Û² ØªØ§ÛŒÛŒ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ
            if (typeof openImportAuthModal === 'function') {
                openImportAuthModal(payloadStr);
            } else {
                const overlay = document.getElementById('gen-overlay');
                const importAuthModal = document.getElementById('import-auth-modal');
                if (overlay) overlay.classList.remove('hidden');
                if (importAuthModal) importAuthModal.classList.remove('hidden');
            }
            return;
        }

        throw new Error("Unrecognized backup format");

    } catch (e) {
        console.error("Init Restore Parsing Error:", e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Format Error", "Invalid backup file or Base64 string structure.", "error");
        } else {
            showAlert("Invalid backup structure.");
        }
    }
}
    // ==========================================
// USB CABLE SYNC FUNCTIONS (PUSH / PULL)
// ==========================================

function closeCableSyncModal() {
    document.getElementById('cable-sync-actions-modal').classList.add('hidden');
    scannedCableServerInfo = null;
}
   /* ==========================================================================
   FIXED: PUSH FULL VAULT DATABASE & CARDS TO WINDOWS APPLICATION
   ========================================================================== */ 
    
async function pushDatabaseToPC() {
    if (!scannedCableServerInfo) return;
    
    try {
        // Û±. Ø§Ø·Ù…ÛŒÙ†Ø§Ù† Ø§Ø² Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø¢Ø®Ø±ÛŒÙ† ØªØºÛŒÛŒØ±Ø§Øª Ø¯ÛŒØªØ§Ø¨ÛŒØ³ Ø¯Ø± LocalStorage
        await saveItemsToStorage();

        const masterUser = JSON.parse(localStorage.getItem('vns_master_user') || '{}');
        const encryptedData = JSON.parse(localStorage.getItem('vns_vault_encrypted_db') || '{}');
        let cardsData = [];
        let idDocsData = [];
        try { cardsData = JSON.parse(localStorage.getItem('vns_cards') || '[]'); } catch (e) {}
        try { idDocsData = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) {}
        if (typeof mPaymentCards !== 'undefined' && Array.isArray(mPaymentCards)) cardsData = mPaymentCards;
        if (typeof mIdentityDocs !== 'undefined' && Array.isArray(mIdentityDocs)) idDocsData = mIdentityDocs;

        if (!encryptedData || !encryptedData.ciphertext) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Error", "Encrypted Database Payload is empty.", "error");
            }
            return;
        }

        // Û². Ø¨Ø³ØªÙ‡â€ŒØ¨Ù†Ø¯ÛŒ Ú©Ø§Ù…Ù„ Ù…Ø´Ø®ØµØ§Øª Ø§Ú©Ø§Ù†Øª + Ù¾Ø³ÙˆØ±Ø¯Ù‡Ø§/ÛŒÙˆØ²Ø±Ù†ÛŒÙ…â€ŒÙ‡Ø§ÛŒ Ø±Ù…Ø²Ù†Ú¯Ø§Ø±ÛŒ Ø´Ø¯Ù‡ + Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§
        const payloadStr = JSON.stringify({ masterUser, encryptedData, cardsData, idDocsData });

        const url = `http://${scannedCableServerInfo.ip}:${scannedCableServerInfo.port}/sync-push`;
        const reqData = { token: scannedCableServerInfo.token, payload: payloadStr };

        let isOk = false;
        
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
            const res = await window.Capacitor.Plugins.CapacitorHttp.post({
                url: url,
                headers: { 'Content-Type': 'application/json' },
                data: reqData
            });
            isOk = (res.status === 200);
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            isOk = res.ok;
        }
        
        if (isOk) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Sync Complete", "Vault, cards and ID/Passport docs pushed to PC.", "success");
            } else {
                showAlert("Full Vault Data Pushed to PC Successfully.");
            }
            if (typeof closeCableSyncModal === 'function') closeCableSyncModal();
        } else {
            if (typeof showAlert === 'function') showAlert("PC rejected data transfer.");
        }
    } catch (e) {
        console.error("Sync Push Error: ", e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Connection Error", "Failed to push database to Windows application.", "error");
        } else {
            showAlert("Sync Push Failed.");
        }
    }
}


async function pullDatabaseFromPC() {
    if (!scannedCableServerInfo) return;
    try {
        const url = `http://${scannedCableServerInfo.ip}:${scannedCableServerInfo.port}/sync-pull`;
        const reqData = { token: scannedCableServerInfo.token };

        let isOk = false;
        let payloadData = null;
        
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
            const res = await window.Capacitor.Plugins.CapacitorHttp.post({
                url: url,
                headers: { 'Content-Type': 'application/json' },
                data: reqData
            });
            isOk = (res.status === 200);
            let rData = res.data;
            if (typeof rData === 'string') { try { rData = JSON.parse(rData); } catch(e) {} }
            payloadData = rData ? rData.payload : null;
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            isOk = res.ok;
            const parsed = await res.json();
            payloadData = parsed.payload;
        }

        if (isOk && payloadData) {
            let payloadObj = payloadData;
            if (typeof payloadData === 'string') {
                try { payloadObj = JSON.parse(payloadData); } catch (e1) {
                    try { payloadObj = JSON.parse(JSON.parse(payloadData)); } catch (e2) { throw e1; }
                }
            }
            if (payloadObj && payloadObj.payload && !payloadObj.encryptedData) {
                try {
                    payloadObj = typeof payloadObj.payload === 'string' ? JSON.parse(payloadObj.payload) : payloadObj.payload;
                } catch (e) {}
            }

            
            // ?. ????? ???????? ????? ??????? ?? ???????? ????? (???? ??? ??? ???????)
            if (payloadObj.cardsData && Array.isArray(payloadObj.cardsData)) {
                let currentLocalCards = [];
                try { currentLocalCards = JSON.parse(localStorage.getItem('vns_cards') || '[]'); } catch(e) {}
                
                let mergedCardsMap = new Map();
                currentLocalCards.forEach(card => mergedCardsMap.set(String(card.id), card));
                payloadObj.cardsData.forEach(card => mergedCardsMap.set(String(card.id), card));
                
                const finalMergedCards = Array.from(mergedCardsMap.values());
                localStorage.setItem('vns_cards', JSON.stringify(finalMergedCards));
                if (typeof mPaymentCards !== 'undefined') mPaymentCards = finalMergedCards;
                if (typeof mRenderCardsContainer === 'function') mRenderCardsContainer();
            }

            // Smart merge ID & Passport documents from PC
            if (payloadObj.idDocsData && Array.isArray(payloadObj.idDocsData)) {
                let currentLocalIds = [];
                try { currentLocalIds = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) {}
                if (typeof mIdentityDocs !== 'undefined' && Array.isArray(mIdentityDocs)) {
                    currentLocalIds = mIdentityDocs;
                }
                const mergedIdsMap = new Map();
                currentLocalIds.forEach(d => mergedIdsMap.set(String(d.id), d));
                payloadObj.idDocsData.forEach(d => mergedIdsMap.set(String(d.id), d));
                const finalMergedIds = Array.from(mergedIdsMap.values());
                localStorage.setItem('vns_id_docs', JSON.stringify(finalMergedIds));
                if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = finalMergedIds;
                if (typeof mLoadIdDocsFromStorage === 'function') mLoadIdDocsFromStorage();
                if (typeof mRenderIdDocsContainer === 'function') mRenderIdDocsContainer();
            }


            // ?. ??? ???? ??????? ?????? ? ????? ??????? ? ???????
           if (payloadObj.encryptedData && payloadObj.masterUser) {
    if (typeof closeCableSyncModal === 'function') closeCableSyncModal();

    const encBlob = payloadObj.encryptedData;
    let decIncoming = null;

    // 1) Ø§Ú¯Ø± Ù‡Ù…Ø§Ù† Ø§Ú©Ø§Ù†Øª Ùˆ Ù„Ø§Ú¯ÛŒÙ† Ù‡Ø³ØªÛŒÙ…ØŒ Ø§ÙˆÙ„ Ø¨Ø§ activeMasterKey Ø§Ù…ØªØ­Ø§Ù† Ú©Ù†
    try {
        const localMaster = JSON.parse(localStorage.getItem('vns_master_user') || '{}');
        const sameAccount =
            localMaster &&
            payloadObj.masterUser &&
            localMaster.username === payloadObj.masterUser.username &&
            localMaster.salt === payloadObj.masterUser.salt;

        if (sameAccount && typeof activeMasterKey !== 'undefined' && activeMasterKey) {
            decIncoming = await decryptData(encBlob, activeMasterKey);
        }
    } catch (e) {}

    // 2) Ø§Ú¯Ø± Ù†Ø´Ø¯ØŒ Ø±Ù…Ø² Master ÙˆÛŒÙ†Ø¯ÙˆØ² Ø±Ø§ Ø¨Ù¾Ø±Ø³
    if (!decIncoming) {
        const promptMsg = typeof t === 'function'
            ? t("prompt_pc_password_merge")
            : "Enter Windows App Master Password to unlock and merge incoming data:";
        const pcPassword = await askSecurePrompt(promptMsg);

        if (!pcPassword) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Partial Sync", "Payment Cards synced. Passwords merge cancelled by user.", "warning");
            }
            return;
        }

        if (!payloadObj.masterUser.salt) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert("Error", "PC payload has no account salt.", "error");
            }
            return;
        }

        const pcSalt = new Uint8Array(base64ToBuf(payloadObj.masterUser.salt));
        const pcKey = await deriveKeyFromPassword(pcPassword, pcSalt);

        if (payloadObj.masterUser.verificationBlock) {
            const check = await decryptData(payloadObj.masterUser.verificationBlock, pcKey);
            if (check !== 'VNS_VERIFIED') {
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert(
                        "Wrong Password",
                        "Enter the Windows app master password (not the mobile one if different).",
                        "error"
                    );
                }
                return;
            }
        }

        decIncoming = await decryptData(encBlob, pcKey);
    }

    if (!decIncoming) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                "Decryption Failed",
                "Could not unlock PC vault. On Windows: open Settings â†’ Security, enter current Master Password and Save once, then try sync again.",
                "error"
            );
        }
        return;
    }

    // 3) Merge Ø¢ÛŒØªÙ…â€ŒÙ‡Ø§
    try {
        const parsedIncoming = typeof decIncoming === 'string' ? JSON.parse(decIncoming) : decIncoming;
        const incomingItems = parsedIncoming.data || parsedIncoming.items || [];
        const incomingFolders = parsedIncoming.folders || [];

        const mergedItemsMap = new Map();
        (items || []).forEach(item => mergedItemsMap.set(String(item.id), item));
        incomingItems.forEach(item => mergedItemsMap.set(String(item.id), item));
        items = Array.from(mergedItemsMap.values());

        const mergedFolders = new Set(folders || []);
        incomingFolders.forEach(f => mergedFolders.add(f));
        folders = Array.from(mergedFolders);

        await saveItemsToStorage();
        if (typeof renderList === 'function') renderList();
        if (typeof renderFolders === 'function') renderFolders();

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Success", "Vault Data & Cards Merged Successfully!", "success");
        }
    } catch (e) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Error", "Merge failed: " + e.message, "error");
        }
    }
} else {
    if (typeof showVnsAlert === 'function') {
        showVnsAlert("Success", "Payment Cards Synced!", "success");
    }
    if (typeof closeCableSyncModal === 'function') closeCableSyncModal();
}
            
        } else {
            if (typeof showAlert === 'function') showAlert("PC rejected data transfer.");
        }
    } catch (e) {
        console.error("Pull Sync Error:", e);
        if (typeof showAlert === 'function') showAlert("Connection failed.");
    }
} 
       
    async function executeManualPathLink() {
    try {
        const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        
        // ????? ???? ???? ???????? ??????
        const targetRoute = isCapacitor ? 'Documents/.VNS_Vault' : 'VNS_Vault/bk';
        localStorage.setItem('vns_linked_folder_name', targetRoute);
        localStorage.setItem('vns_folder_linked', 'true');

        const displayEl = document.getElementById('manual-path-display');
        if (displayEl) {
            displayEl.innerText = typeof t === 'function' ? t("info_active_hidden_path") : "Documents / .VNS_Vault (Active)"; 
            displayEl.className = "w-full p-3 border rounded-xl text-center font-bold text-xs text-green-700 bg-green-100 border-green-300 transition-all";
            displayEl.removeAttribute('data-i18n');
        }

        const mountedFolder = document.getElementById('mounted-folder-name');
        if (mountedFolder) mountedFolder.innerText = targetRoute.toUpperCase();

        const success = await executeVisibleFolderBackup(); 
        
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                typeof t === 'function' ? t("alert_sys_activated_title") : "Backup Route Active", 
                typeof t === 'function' ? t("alert_sys_activated_msg") : "Automatic backup location successfully mounted.", 
                "success"
            );
        } else if (typeof showAlert === 'function') {
            showAlert("Backup route successfully activated.");
        }
        
    } catch (e) {
        console.error("Manual Path Link Error:", e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Activation Error", e.message, "error");
        }
    }
}
    
async function executeSilentBackup() {
    try {
        const masterStr = localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account');
        if (!masterStr) return false;
        
        const master = JSON.parse(masterStr);
        const keyToUse = master.recoveryMnemonic || master.password || "default_vns_key";

        const currentItems = typeof items !== 'undefined' ? items : [];
        const currentFolders = typeof folders !== 'undefined' ? folders : [];
        const payload = JSON.stringify({ data: currentItems, folders: currentFolders }); 
        
        const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const bKey = await deriveKeyFromPassword(keyToUse, bSalt); 
        const enc = await encryptData(payload, bKey);
        
        const backupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({ 
            vns_version: "1.0.0", encrypted_backup: true, salt: bufToBase64(bSalt), iv: enc.iv, ciphertext: enc.ciphertext 
        })));

        const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

        if (isCapacitor) {
            const { Filesystem, Directory } = Capacitor.Plugins; 
            
            // ?? ???? ???????: ????? ?????? ?? ???? ???? ? ???? Documents ???? ???? ???? ????
            await Filesystem.writeFile({
                path: 'VNS_Vault_Backups/VNS_Auto_Backup.json',
                data: backupJSON,
                directory: Directory.Documents, // ????? ??? ??? ?? ??????????
                encoding: 'utf8',
                recursive: true // ???? ?????? ???? ?? ???? ??? ????
            });
            localStorage.setItem('vns_last_backup_time', Date.now().toString());
            return true;
        }
        return false;
    } catch(e) { 
        console.error("Backup Engine Failure", e);
        return false;
    }
}

    async function forceBackupToLinkedFolder() {
    // ????? ?? ?????? ?? ??? ???? ?? ????? ??? ??? ??? ?? ???
    const pathStatus = localStorage.getItem('vns_linked_folder_name');
    if (!pathStatus || pathStatus === 'None') {
        showVnsAlert("Error", typeof t === 'function' ? t("err_click_activate_autobackup_first") : "Please activate auto-backup first", "warning");
        return;
    }
    const success = await executeVisibleFolderBackup();
    if (success) {
        showVnsAlert(t("alert_backup_successful_title"), t("alert_backup_successful_msg"), "success");
    }
}
    
// START OF MANUAL EXPORT MODULE
async function forceManualBackup() {
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    
    try {
        const masterStr = localStorage.getItem('vns_master_user');
        if (!masterStr) { 
            if (typeof showAlert === 'function') showAlert(t("err_user_not_authenticated")); 
            return; 
        }
        const master = JSON.parse(masterStr);
        if (!master.recoveryMnemonic) return;

        const payload = JSON.stringify({ data: items, folders });
        const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const bKey = await deriveKeyFromPassword(master.recoveryMnemonic, bSalt);
        const enc = await encryptData(payload, bKey);

        const backupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({
            vns_version: "1.0.0", 
            encrypted_backup: true, 
            salt: bufToBase64(bSalt), 
            iv: enc.iv, 
            ciphertext: enc.ciphertext
        })));

        if (isCapacitor) {
            const { Filesystem, Share } = Capacitor.Plugins;
            const result = await Filesystem.writeFile({
    path: 'VNS_Manual_Backup.json',
    data: backupJSON,
    directory: 'CACHE', // FIXED: Reverted to stable string format
    encoding: 'utf8'
});
            
            await Share.share({
    title: t("share_backup_title"),
    text: t("share_backup_text"),
    url: result.uri,
    dialogTitle: t("share_dialog_title")
});

           
        } else {
    await executeSilentBackup();
    if (typeof showAlert === 'function') showAlert(t("success_manual_backup"));
} 
      

    } catch (error) {
        const errorMessage = error.message ? error.message.toLowerCase() : String(error).toLowerCase();
        
        if (errorMessage.includes('cancel') || errorMessage.includes('cancelled') || errorMessage.includes('user cancelled')) {
            console.log(t("log_export_cancelled"));
            
            return;
        } else {
    console.error(t("log_export_error"), error);
    if (typeof showAlert === 'function') showAlert(t("err_export_failed").replace("{error}", error.message));
} 
    }
}
// END OF MANUAL EXPORT MODULE
   
    /*------------------------STR DELETE PART 2 21.06.2026------------------------*/
    // ==========================================
// ==========================================
// SMART CLOUD NUDGE SYSTEM (?????? ????) - ???? ????? ???
// ==========================================

function checkCloudNudge() {
    // ??????? ?? ?? ???? ???? ???? ??? ??? ?? ??????? ????
    return;
    const isNudgeShown = localStorage.getItem('vns_cloud_nudge_v1');
    
    
    if (!isNudgeShown && activeMasterKey) {
        const modal = document.getElementById('cloud-nudge-modal');
        const overlay = document.getElementById('gen-overlay');
        
        if (modal && overlay) {
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
        } else {
            console.error(t("log_native_html_not_found"));
        }
    }
}

async function acceptCloudNudge() {
    localStorage.setItem('vns_cloud_nudge_v1', 'true');
    document.getElementById('cloud-nudge-modal').classList.add('hidden');
    document.getElementById('gen-overlay').classList.add('hidden');
    
    // ???????? ????? Share
    if (typeof forceManualBackup === 'function') {
        await forceManualBackup();
    }
}

function dismissCloudNudge() {
    localStorage.setItem('vns_cloud_nudge_v1', 'true');
    document.getElementById('cloud-nudge-modal').classList.add('hidden');
    document.getElementById('gen-overlay').classList.add('hidden');
}

    // ==========================================
// AUTO-CREATE DEDICATED APP FOLDER ON INSTALL
// ==========================================
async function setupAutomaticAppFolder() {
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    if (!isCapacitor || !window.Capacitor.Plugins.Filesystem) return;

    const { Filesystem, Directory } = Capacitor.Plugins;
    const folderName = 'VNS_Vault_Secure_Data'; // ??? ???? ??????? ???

    try {
        // ????? ?????? ?? ??? ???? ?? ??? ???? ???? ?? ???
        await Filesystem.stat({
            path: folderName,
            directory: Directory.Documents
        });
       console.log(t("log_vns_folder_exists"));
    } catch (e) {
        try {
            await Filesystem.mkdir({
                path: folderName,
                directory: Directory.Documents,
                recursive: true 
            });
            await Filesystem.writeFile({
    path: `${folderName}/README.txt`,
    data: t("txt_vns_readme_content"),
    directory: Directory.Documents,
    encoding: 'utf8'
});
            console.log(t("log_vns_folder_created"));
} catch (err) {
    console.error(t("log_failed_create_autofolder"), err);
}
    }
}
    async function executeVisibleFolderBackup() {
    try {
        const masterStr = localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account');
        if (!masterStr) { alert(t("err_account_data_missing")); return false; }
        const master = JSON.parse(masterStr);
        
        const keyToUse = master.recoveryMnemonic || master.password;
        if (!keyToUse) { alert(t("err_recovery_phrase_missing")); return false; }

        const currentItems = typeof items !== 'undefined' ? items : [];
        const currentFolders = typeof folders !== 'undefined' ? folders : [];
        
        // ?? ??????? ? ??????????? ???????? ????? ???? ?????? ?? ????? ???????
        const currentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
        
        // ?? ????? ????? ??????? (cardsData) ?? ???? ???? ????? ?? ?????? ???? ? ?????? ???
        const payload = JSON.stringify({ data: currentItems, folders: currentFolders, cardsData: currentCards , idDocsData: (typeof mIdentityDocs !== 'undefined' ? mIdentityDocs : JSON.parse(localStorage.getItem('vns_id_docs') || '[]')) });

        const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const bKey = await deriveKeyFromPassword(keyToUse, bSalt); 
        const enc = await encryptData(payload, bKey);
        
        const backupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({ 
            vns_version: "1.0.0", 
            encrypted_backup: true, 
            salt: bufToBase64(bSalt), 
            iv: enc.iv, 
            ciphertext: enc.ciphertext 
        })));

        const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        if (isCapacitor) {
            const { Filesystem } = Capacitor.Plugins; 
            const targetPath = '.VNS_Vault';
            
            await Filesystem.mkdir({ path: targetPath, directory: 'DOCUMENTS', recursive: true }).catch(e => {});

            try {
                const dirContent = await Filesystem.readdir({ path: targetPath, directory: 'DOCUMENTS' });
                for (let file of dirContent.files) {
                    if (file.name && file.name.includes('VNS_Backup_Data')) {
                        await Filesystem.deleteFile({ path: `${targetPath}/${file.name}`, directory: 'DOCUMENTS' }).catch(e=>{});
                    }
                }
            } catch (readErr) {}

            try {
                await Filesystem.writeFile({
                    path: `${targetPath}/VNS_Backup_Data.json`,
                    data: backupJSON,
                    directory: 'DOCUMENTS', 
                    encoding: 'utf8'
                });
                
                // ?? ??? ????? ???? ???? ????? ??????? ????
                localStorage.setItem('vns_last_backup_time', Date.now().toString());
                localStorage.setItem('vns_last_backup_date_string', new Date().toLocaleString());
                if (typeof updateBackupTimeUI === 'function') updateBackupTimeUI();

                return true;
            } catch (writeError) {
                const timeStamp = new Date().getTime();
                await Filesystem.writeFile({
                    path: `${targetPath}/VNS_Backup_Data_${timeStamp}.json`,
                    data: backupJSON,
                    directory: 'DOCUMENTS', 
                    encoding: 'utf8'
                });
                
                localStorage.setItem('vns_last_backup_time', Date.now().toString());
                localStorage.setItem('vns_last_backup_date_string', new Date().toLocaleString());
                if (typeof updateBackupTimeUI === 'function') updateBackupTimeUI();

                return true;
            }
        }
        return false;
    } catch(e) { 
        alert(t("err_backup_error_msg").replace("{error}", e.message));
        return false;
    }
}
    
    /*----------------STR executeManualPathLink----------------*/
 /*----------------STR add 30.06.2026----------------*/
   
   
    
    // ?? ???? ?????? ?????? ?????? ? ????? ???? forceBackupToLinkedFolder ???? ????? ???? ???????
async function forceBackupToLinkedFolder() {
    const success = await executeVisibleFolderBackup();
    if (success) {
        // ????? ???? ???? ?? ??? ??? ?????? ?? ?? ????? ???? ???? ???????
        showVnsAlert(t("alert_backup_successful_title"), t("alert_backup_successful_msg"), "success");
    }
}

    // ?? ???? ????????? ? ???? ???? ???? autoRestoreFromHiddenFolder ???? ??????
async function autoRestoreFromHiddenFolder() {
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    if (!isCapacitor) { alert(t("err_app_only")); return; }

    const confirmRestore = confirm(t("confirm_restore_sandbox_backup") || "Are you sure you want to restore from hidden folder backup?");
    if (!confirmRestore) return;

    try {
        const { Filesystem } = Capacitor.Plugins;
        const targetPath = '.VNS_Vault';
        let backupFileName = null;

        try {
            const dirContent = await Filesystem.readdir({ path: targetPath, directory: 'DOCUMENTS' });
            for (let file of dirContent.files) {
                if (file.name && file.name.includes('VNS_Backup_Data')) {
                    backupFileName = file.name; 
                    break;
                }
            }
        } catch (e) {
            alert(t("err_hidden_folder_not_found") || "Hidden backup directory not found.");
            return;
        }

        if (!backupFileName) {
            alert(t("err_no_backup_file_found") || "No backup file found in hidden folder.");
            return;
        }

        const result = await Filesystem.readFile({
            path: `${targetPath}/${backupFileName}`,
            directory: 'DOCUMENTS',
            encoding: 'utf8'
        });

        if (result && result.data) {
            // ?? ???? ???? ???? ?? ????? ??????? ????? ???? ??????
            if (typeof pendingImportData !== 'undefined') {
                pendingImportData = result.data;
            } else {
                window.pendingImportData = result.data;
            }
            
            // ?? ??????? ?????? ????? ??????? ??? ?? ????? ?? ??????? ???? ??? classList
            if (typeof openImportAuthModal === 'function') {
                openImportAuthModal(result.data);
            } else {
                alert(t("err_restore_interface_not_found"));
            }
        } else {
            alert(t("err_backup_file_empty"));
        }

    } catch (e) {
        alert((t("err_restore_error_message") || "Restore Error: ").replace("{error}", e.message) || e.message);
    }
}

    
    // ?????? ??????????? ? ????????? ???? ???? ? ????? ???? ???? Cancel
setInterval(() => {
    try {
        // ?. ???? ???? ???? ???? ???? ??????? ?? ?? ???? ???
        let currentLang = localStorage.getItem('vns_current_lang') || 
                          localStorage.getItem('lang') || 
                          document.documentElement.getAttribute('lang') || 
                          'en';
        
        currentLang = currentLang.toLowerCase();
        if (currentLang.includes('en')) return; // ??? ??????? ??? ??? ???

        // ?. ???? ???? ????????? ???? ????? ???? (button, span, a, div ????????)
        const targetElements = document.querySelectorAll('button, span, a, .cursor-pointer');
        
        targetElements.forEach(el => {
            // ????? ??? ?? ???? ???? ? ??? ???????? ???? ?????? ????? ????????? ?????
            const txt = el.textContent ? el.textContent.trim().toUpperCase() : '';
            
            // ?? ???? ???????? ????? ???? CANCEL
            if (txt === 'CANCEL' || txt === 'CANCEL1') {
                if (currentLang.includes('fa')) {
                    el.textContent = '??????';
                } else if (currentLang.includes('ar')) {
                    el.textContent = '?????';
                } else if (currentLang.includes('zh') || currentLang.includes('cn')) {
                    el.textContent = '??';
                }
                
                // ??? ????? data-i18n ????? ???? ??????? ?? ??????? ???? ?????
                if (el.hasAttribute('data-i18n')) {
                    el.removeAttribute('data-i18n');
                }
            }
        });
    } catch (e) {
        // ????? ???? ???? ??????? ?? ??? ?? ??? ??? ??????? ????
    }
}, 300);
   // ?? ???? ????? ? ????? ???? ????? ???? ????? ????? ??????
function updateBackupTimeUI() {
    const machineDate = localStorage.getItem('vns_last_backup_date_string');
    // ???????? ??????? ??????? ???? ?????
    const displayClock = document.getElementById('vns-mobile-last-backup-clock');
    
    if (displayClock) {
        if (machineDate) {
            displayClock.innerText = "Last Backup: " + machineDate;
            displayClock.className = "w-full p-2.5 border rounded-xl text-center font-black text-[11px] text-teal-600 bg-teal-50 border-teal-100 mb-3 transition-all duration-300";
        } else {
            displayClock.innerText = "Last Backup: Never";
            displayClock.className = "w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center font-bold text-[11px] text-slate-400 mb-3 transition-all";
        }
    }
}

// ?? ???? ??????? ? ???% ?? ??? ???? ????? ???????? ???? ???? (???? + ??????? + ???????)
async function executeMobileCardsAndDataVaultBackup() {
    try {
        const masterStr = localStorage.getItem('vns_master_user') || localStorage.getItem('vns_master_account');
        if (!masterStr) return false;
        const master = JSON.parse(masterStr);
        
        const keyToUse = master.recoveryMnemonic || master.password;
        if (!keyToUse) return false;

        // ??????? ???? ???? ????? ??? ?????? ?? ???????? ????????
        const currentItems = typeof items !== 'undefined' ? items : [];
        const currentFolders = typeof folders !== 'undefined' ? folders : [];
        const currentCards = JSON.parse(localStorage.getItem('vns_cards') || '[]');
        
        const payload = JSON.stringify({ data: currentItems, folders: currentFolders, cardsData: currentCards , idDocsData: (typeof mIdentityDocs !== 'undefined' ? mIdentityDocs : JSON.parse(localStorage.getItem('vns_id_docs') || '[]')) });

        const bSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const bKey = await deriveKeyFromPassword(keyToUse, bSalt); 
        const enc = await encryptData(payload, bKey);
        
        const backupJSON = bufToBase64(new TextEncoder().encode(JSON.stringify({ 
            vns_version: "1.0.0", 
            encrypted_backup: true, 
            salt: bufToBase64(bSalt), 
            iv: enc.iv, 
            ciphertext: enc.ciphertext 
        })));

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            const { Filesystem } = Capacitor.Plugins; 
            const targetPath = '.VNS_Vault';
            
            // ????? ???? ?? ???? ?????? ?????
            await Filesystem.mkdir({ path: targetPath, directory: 'DOCUMENTS', recursive: true }).catch(() => {});

            // ????? ?????? ? ???? ???????????? ??????? ????? ???? ??????? ?? ????? ??? CPU
            await Filesystem.writeFile({
                path: `${targetPath}/VNS_Backup_Data.json`,
                data: backupJSON,
                directory: 'DOCUMENTS', 
                encoding: 'utf8'
            });
            
            // ????????? ????? ????? ???????? ??????
            localStorage.setItem('vns_last_backup_time', Date.now().toString());
            localStorage.setItem('vns_last_backup_date_string', new Date().toLocaleString());
            if (typeof updateBackupTimeUI === 'function') updateBackupTimeUI();

            return true;
        }
        return false;
    } catch(e) { 
        console.error("Isolated Backup Error Bypass: ", e);
        return false;
    }
}
/* ==========================================================================
   VNS MASTER & PIN PASSWORDS LIVE EYE INTERACTION CONTROLLER (app.js)
   ========================================================================== */
function vnsTogglePasswordVisibility(inputId, btnEl) {
    const inputField = document.getElementById(inputId);
    if (!inputField) return;

    const eyeOpenPaths = btnEl.querySelectorAll('.vns-eye-open');
    const eyeSlashPath = btnEl.querySelector('.vns-eye-slash');

    if (inputField.type === "password") {
        inputField.type = "text";
        if (eyeSlashPath) eyeSlashPath.classList.add('hidden');
        eyeOpenPaths.forEach(path => path.classList.remove('hidden'));
    } else {
        inputField.type = "password";
        if (eyeSlashPath) eyeSlashPath.classList.remove('hidden');
        eyeOpenPaths.forEach(path => path.add('hidden'));
        eyeOpenPaths.forEach(path => path.classList.add('hidden'));
    }
}

window.vnsTogglePasswordVisibility = vnsTogglePasswordVisibility;
   /* ==========================================================================
   FEATURE: GOOGLE AUTHENTICATOR QR CODE & EMERGENCY RECOVERY CODES
   ========================================================================== */

// Û±. ØªÙˆÙ„ÛŒØ¯ Ûµ Ú©Ø¯ Ø±ÛŒÚ©Ø§ÙˆØ±ÛŒ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Û¶ Ø±Ù‚Ù…ÛŒ
function mGenerateEmergencyRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 5; i++) {
        // ØªÙˆÙ„ÛŒØ¯ Ø¹Ø¯Ø¯ Û¶ Ø±Ù‚Ù…ÛŒ ØªØµØ§Ø¯ÙÛŒ
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        codes.push(randomCode);
    }
    return codes;
}

function mBuildOtpAuthUrl(username, secretKey) {
    const label = 'VNS Vault:' + String(username || 'VaultUser');
    return 'otpauth://totp/' + encodeURIComponent(label) +
        '?secret=' + encodeURIComponent(String(secretKey || '').replace(/\s+/g, '')) +
        '&issuer=' + encodeURIComponent('VNS Vault') +
        '&algorithm=SHA1&digits=6&period=30';
}

function mOpenAuthenticatorApp() {
    try {
        const masterStr = localStorage.getItem('vns_master_user');
        const master = masterStr ? JSON.parse(masterStr) : {};
        const username = master.username || 'VaultUser';
        const secretKey = simulated2faSecret ||
            (document.getElementById('sett-2fa-secret-key') || {}).innerText || '';
        if (!secretKey || String(secretKey).replace(/\s+/g, '').length < 8) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert('2FA', 'Secret key is not ready yet. Open this section again.', 'warning');
            } else {
                showAlert('Secret key is not ready yet.');
            }
            return;
        }
        const url = mBuildOtpAuthUrl(username, secretKey);
        window._vnsPendingOtpAuthUrl = url;

        // Prefer Capacitor Browser / App open if available; else location href
        if (window.Capacitor && window.Capacitor.Plugins) {
            const AppPlugin = window.Capacitor.Plugins.App;
            const Browser = window.Capacitor.Plugins.Browser;
            if (AppPlugin && typeof AppPlugin.openUrl === 'function') {
                AppPlugin.openUrl({ url: url }).catch(function () {
                    window.location.href = url;
                });
                return;
            }
            if (Browser && typeof Browser.open === 'function') {
                Browser.open({ url: url }).catch(function () {
                    window.location.href = url;
                });
                return;
            }
        }
        window.location.href = url;
    } catch (e) {
        console.error('mOpenAuthenticatorApp:', e);
        if (typeof showVnsAlert === 'function') {
            showVnsAlert('2FA', 'Could not open Authenticator. Use Copy Key instead.', 'warning');
        }
    }
}

function mCopy2faSecretKey() {
    const el = document.getElementById('sett-2fa-secret-key');
    const secret = el ? String(el.innerText || '').trim() : (simulated2faSecret || '');
    if (!secret) return;
    if (typeof copyValueDirectText === 'function') {
        copyValueDirectText(secret);
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(secret);
    }
    if (typeof showVnsAlert === 'function') {
        showVnsAlert('Copied', 'Secret key copied. Paste it in Google Authenticator.', 'success');
    }
}

function mToggle2faQrPanel() {
    const panel = document.getElementById('m-2fa-qr-panel');
    const arrow = document.getElementById('m-2fa-qr-arrow');
    if (!panel) return;
    const opening = panel.classList.contains('hidden');
    if (opening) {
        panel.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        // ensure QR is rendered when first opened
        if (typeof mRenderGoogleAuthSetup === 'function') mRenderGoogleAuthSetup();
    } else {
        panel.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}

function mRenderGoogleAuthSetup() {
    const masterStr = localStorage.getItem('vns_master_user');
    if (!masterStr) return;
    const master = JSON.parse(masterStr);
    const username = master.username || 'VaultUser';

    if (!simulated2faSecret) {
        if (typeof generateNew2faSecret === 'function') {
            generateNew2faSecret();
        } else {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            for (let i = 0; i < 16; i++) secret += chars.charAt(Math.floor(Math.random() * chars.length));
            simulated2faSecret = secret;
        }
    }

    const secretKey = String(simulated2faSecret || '').replace(/\s+/g, '').toUpperCase();

    const secretKeyEl = document.getElementById('sett-2fa-secret-key');
    if (secretKeyEl) secretKeyEl.innerText = secretKey;

    const accountEl = document.getElementById('sett-2fa-account-name');
    if (accountEl) accountEl.innerText = 'VNS Vault:' + username;

    const otpauthUrl = mBuildOtpAuthUrl(username, secretKey);
    window._vnsPendingOtpAuthUrl = otpauthUrl;

    const qrContainer = document.getElementById('m-2fa-qr-container');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrContainer, {
                    text: otpauthUrl,
                    width: 150,
                    height: 150,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) {
                console.warn('QR render skipped:', e);
            }
        }
    }

    // Live code preview intentionally disabled (avoids dual-token mismatch / extra render load).
    // Verification uses only the code typed from Google Authenticator + totp-engine.

    // Always keep 5 valid 6-digit recovery codes for display/setup
    let recoveryCodes = Array.isArray(master.recoveryCodes) ? master.recoveryCodes.slice() : [];
    recoveryCodes = recoveryCodes
        .map(function (c) { return String(c || '').trim(); })
        .filter(function (c) { return /^\d{6}$/.test(c); });

    if (recoveryCodes.length < 5) {
        var fresh = mGenerateEmergencyRecoveryCodes();
        fresh.forEach(function (c) {
            if (recoveryCodes.length >= 5) return;
            if (recoveryCodes.indexOf(c) === -1) recoveryCodes.push(c);
        });
        while (recoveryCodes.length < 5) {
            var n = Math.floor(100000 + Math.random() * 900000).toString();
            if (recoveryCodes.indexOf(n) === -1) recoveryCodes.push(n);
        }
        window.mCurrentPendingRecoveryCodes = recoveryCodes;
        master.recoveryCodes = recoveryCodes;
        localStorage.setItem('vns_master_user', JSON.stringify(master));
    } else {
        recoveryCodes = recoveryCodes.slice(0, 5);
        window.mCurrentPendingRecoveryCodes = recoveryCodes;
    }

    const codesContainer = document.getElementById('m-2fa-recovery-codes-list');
    if (codesContainer) {
        codesContainer.innerHTML = '';
        recoveryCodes.forEach(function (code, idx) {
            codesContainer.innerHTML +=
                '<div class="p-2 bg-white/80 rounded-xl border border-amber-200/80 shadow-sm font-mono font-bold text-slate-700">' +
                (idx + 1) + '. ' + code +
                '</div>';
        });
    }
}

function mCopyRecoveryCodes() {
    let codes = window.mCurrentPendingRecoveryCodes || [];
    if (codes.length === 0) {
        const masterStr = localStorage.getItem('vns_master_user');
        if (masterStr) {
            const master = JSON.parse(masterStr);
            if (master.recoveryCodes) codes = master.recoveryCodes;
        }
    }

    if (codes.length > 0) {
        const textToCopy = 'VNS Vault Emergency 2FA Recovery Codes:\n' + codes.join('\n');
        if (typeof copyValueDirectText === 'function') {
            copyValueDirectText(textToCopy);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy);
            if (typeof showVnsAlert === 'function') {
                showVnsAlert('Copied', 'Recovery codes copied to clipboard!', 'success');
            }
        }
    }
}

window.mBuildOtpAuthUrl = mBuildOtpAuthUrl;
window.mOpenAuthenticatorApp = mOpenAuthenticatorApp;
window.mCopy2faSecretKey = mCopy2faSecretKey;
window.mToggle2faQrPanel = mToggle2faQrPanel;
window.mRenderGoogleAuthSetup = mRenderGoogleAuthSetup;
window.mCopyRecoveryCodes = mCopyRecoveryCodes;
    
// ==========================================
// ðŸŒŸ CIPHER CONTROLS ACCORDION SYSTEM FOR MOBILE
// ==========================================
function toggleCipherAccordion(targetId) {
    const sectionIds = [
        'cipher-sec-master',
        'cipher-sec-pin',
        'cipher-sec-totp',
        'cipher-sec-bio',
        'cipher-sec-wipe'
    ];

    sectionIds.forEach(id => {
        const contentEl = document.getElementById(id);
        const arrowEl = document.getElementById('arrow-' + id);

        if (!contentEl) return;

        if (id === targetId) {
            const isCurrentlyHidden = contentEl.classList.contains('hidden');
            if (isCurrentlyHidden) {
                contentEl.classList.remove('hidden');
                if (arrowEl) arrowEl.style.transform = 'rotate(180deg)';
            } else {
                contentEl.classList.add('hidden');
                if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
            }
        } else {
            contentEl.classList.add('hidden');
            if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
        }
    });
}
window.toggleCipherAccordion = toggleCipherAccordion;
    
    
/* ==========================================================================
   ðŸŒŸ VNS LOADER CONTROLLER & WRAPPERS
   ========================================================================== */

// ðŸŸ¢ ØªÙˆØ§Ø¨Ø¹ Ø¹Ù…ÙˆÙ…ÛŒ Ú©Ù†ØªØ±Ù„ Ù„ÙˆØ¯Ø±
window.showVnsLoader = function(msg = "SECURING ENVIRONMENT...") {
    const loader = document.getElementById('vns-app-loader');
    if (loader) {
        const textEl = document.getElementById('vns-loader-text') || loader.querySelector('p');
        if (textEl) textEl.innerText = msg;
        loader.classList.remove('hidden');
        void loader.offsetWidth; // Force Reflow Ø¨Ø±Ø§ÛŒ Ø±Ù†Ø¯Ø± Ø³Ø±ÛŒØ¹ Ø¯Ø± Ù…ÙˆØ¨Ø§ÛŒÙ„
    }
};

window.hideVnsLoader = function() {
    const loader = document.getElementById('vns-app-loader');
    if (loader) loader.classList.add('hidden');
};


// ðŸ” Û±. Ù‡Ù†Ø¯Ù„Ø± Ù„ÙˆØ¯Ø± Ø¨Ø±Ø§ÛŒ Ù„Ø§Ú¯ÛŒÙ† Ø¨Ø§ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±
const originalHandleLogin = window.handleLogin;
if (typeof originalHandleLogin === 'function') {
    window.handleLogin = async function() {
        showVnsLoader("DECRYPTING VAULT...");
        
        // Û±.Ûµ Ø«Ø§Ù†ÛŒÙ‡ ØªØ£Ø®ÛŒØ± Ø¨Ø±Ø§ÛŒ Ù†Ù…Ø§ÛŒØ´ Ú©Ø§Ù…Ù„ Ø§Ù†ÛŒÙ…ÛŒØ´Ù†
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await originalHandleLogin();
        } finally {
            hideVnsLoader();
        }
    };
}


// ðŸ‘† Û². Ù‡Ù†Ø¯Ù„Ø± Ù„ÙˆØ¯Ø± Ø¨Ø±Ø§ÛŒ ÙˆØ±ÙˆØ¯ Ø¨ÛŒÙˆÙ…ØªØ±ÛŒÚ© (ØªØºÛŒÛŒØ± ØªØ±ØªÛŒØ¨: ÙÙ‚Ø· Ø¨Ø¹Ø¯ Ø§Ø² ØªØ£ÛŒÛŒØ¯ Ø¨ÛŒÙˆÙ…ØªØ±ÛŒÚ©)
const originalHandleBiometricLogin = window.handleBiometricLogin;
if (typeof originalHandleBiometricLogin === 'function') {
    window.handleBiometricLogin = async function() {
        try {
            // Ø§Ø¬Ø±Ø§ Ø´Ø¯Ù† Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ø§Ø«Ø± Ø§Ù†Ú¯Ø´Øª Ø§ÙˆÙ„ Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯ (ØµÙØ­Ù‡ Ø®Ø§Ú©Ø³ØªØ±ÛŒ Ù†Ù…ÛŒâ€ŒØ´ÙˆØ¯)
            const result = await originalHandleBiometricLogin();
            return result;
        } catch (err) {
            throw err;
        } finally {
            // Ø§Ú¯Ø± ÙˆØ±ÙˆØ¯ Ù…ÙˆÙÙ‚ÛŒØªâ€ŒØ¢Ù…ÛŒØ² Ø¨ÙˆØ¯ Ùˆ ÙˆØ§Ø±Ø¯ Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø´Ø¯ÛŒÙ…ØŒ Ù„ÙˆØ¯Ø± Ø±Ø§ Ø¨Ø±Ø§ÛŒ Û± Ø«Ø§Ù†ÛŒÙ‡ Ù†Ø´Ø§Ù† Ø¨Ø¯Ù‡
            const appContainer = document.getElementById('app-container');
            if (appContainer && !appContainer.classList.contains('hidden')) {
                showVnsLoader("UNLOCKING VAULT...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                hideVnsLoader();
            }
        }
    };
}
    /* ==========================================================================
   Hide native splash after first UI paint (prevents black gap)
   ========================================================================== */
(function vnsHideNativeSplashWhenReady() {
    function hideSplash() {
        try {
            if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SplashScreen) {
                Capacitor.Plugins.SplashScreen.hide().catch(function () {});
            }
        } catch (e) {}
    }
    // صبر کن تا لایه auth یا loader دیده شود
    function tryHide() {
        var gate = document.getElementById('auth-gate');
        var loader = document.getElementById('vns-app-loader');
        if (gate || loader || document.body) {
            // یک فریم بعد از paint
            requestAnimationFrame(function () {
                setTimeout(hideSplash, 50);
            });
            return true;
        }
        return false;
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (!tryHide()) setTimeout(hideSplash, 400);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (!tryHide()) setTimeout(hideSplash, 400);
        });
    }
    // اطمینان نهایی
    window.addEventListener('load', function () {
        setTimeout(hideSplash, 100);
    });
})();

/* Auth nav links: re-apply after paint (WebView race) */
(function vnsAuthNavBoot() {
    function run() {
        try {
            if (typeof updateAuthNavLinksVisibility === 'function') updateAuthNavLinksVisibility();
            else if (typeof updateRegReturnLoginVisibility === 'function') updateRegReturnLoginVisibility();
        } catch (e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            run();
            setTimeout(run, 50);
            setTimeout(run, 300);
        });
    } else {
        run();
        setTimeout(run, 50);
        setTimeout(run, 300);
    }
})();
