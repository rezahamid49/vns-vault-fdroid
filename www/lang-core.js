// ==========================================
// MULTI-LANGUAGE SYSTEM - CORE ENGINE (lang-core.js)
// ==========================================

window.translations = window.translations || {};

let currentLang = localStorage.getItem('vns_lang') || 'en';

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');

        if (window.translations[currentLang] && window.translations[currentLang][key]) {
            if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                el.setAttribute('placeholder', window.translations[currentLang][key]);
            } else {
                el.innerText = window.translations[currentLang][key];
            }
        }
    });

    // RTL for Persian & Arabic, LTR for English & Chinese
    if (currentLang === 'fa' || currentLang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    // Sync all three language dropdowns
    ['lang-selector', 'login-lang-selector', 'reg-lang-selector'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = currentLang;
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('vns_lang', lang);
    applyLanguage();
}

document.addEventListener('DOMContentLoaded', applyLanguage);

// Dynamic translator for JS strings (e.g. alerts, w-id.js via t())
function t(key) {
    const lang = localStorage.getItem('vns_lang') || 'en';
    const dictionary = window.translations[lang] || window.translations['en'] || {};
    return dictionary[key] || key;
}
