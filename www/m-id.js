/* ==========================================================================
   VNS SECURE VAULT - MOBILE ID & PASSPORT MODULE (m-id.js)
   Storage key: vns_id_docs (shared with Windows)
   ========================================================================== */

var mIdentityDocs = [];
try { mIdentityDocs = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) { mIdentityDocs = []; }
var mActiveIdDocId = null;
var mIdRevealTimers = {};
var mIdVnsIsExiting = false;
var selectedIdDocIds = new Set();

function mIdT(key, fallback) {
    if (typeof t === 'function') {
        var v = t(key);
        if (v && v !== key) return v;
    }
    return fallback || key;
}

function mIdTypeLabel(type) {
    var map = {
        passport: mIdT('id_type_passport', 'Passport'),
        national_id: mIdT('id_type_national_id', 'National ID'),
        residence: mIdT('id_type_residence', 'Residence Permit'),
        driver: mIdT('id_type_driver_license', 'Driver License'),
        other: mIdT('id_type_other', 'Other Document')
    };
    return map[type] || mIdT('id_type_other', 'Document');
}

function mIdTypeTheme(type) {
    var map = {
        passport: 'm-id-theme-passport',
        national_id: 'm-id-theme-id',
        residence: 'm-id-theme-res',
        driver: 'm-id-theme-driver',
        other: 'm-id-theme-other'
    };
    return map[type] || 'm-id-theme-other';
}

function mEscapeIdHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


function mCompressImageFile(file, opts, done) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || 640;
    var maxBytes = opts.maxBytes || 120000;
    var quality = opts.quality || 0.8;
    if (typeof vnsCompressImageToDataUrl === 'function') {
        vnsCompressImageToDataUrl(file, { maxEdge: maxEdge, maxBytes: maxBytes, quality: quality }, done);
        return;
    }
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
            var guard = 0;
            while (dataUrl.length * 0.75 > maxBytes && q > 0.45 && guard < 8) {
                q -= 0.08;
                dataUrl = canvas.toDataURL('image/jpeg', q);
                guard++;
            }
            done(dataUrl);
        };
        img.onerror = function () { done(null); };
        img.src = reader.result;
    };
    reader.onerror = function () { done(null); };
    reader.readAsDataURL(file);
}

function mOnIdBgModeChange() {
    var mode = ((document.getElementById('m-id-input-bg-mode') || {}).value) || 'theme';
    var colors = document.getElementById('m-id-bg-colors-wrap');
    var imgWrap = document.getElementById('m-id-bg-image-wrap');
    var c2 = document.getElementById('m-id-input-bg-c2');
    var c2lbl = document.getElementById('m-id-bg-c2-lbl');
    if (colors) {
        if (mode === 'solid' || mode === 'gradient') colors.classList.remove('hidden');
        else colors.classList.add('hidden');
    }
    if (imgWrap) {
        if (mode === 'image') imgWrap.classList.remove('hidden');
        else imgWrap.classList.add('hidden');
    }
    if (c2) c2.style.display = (mode === 'gradient') ? '' : 'none';
    if (c2lbl) c2lbl.style.display = (mode === 'gradient') ? '' : 'none';
}
window.mOnIdBgModeChange = mOnIdBgModeChange;

function mClearIdLogo() {
    var hid = document.getElementById('m-id-logo-data');
    var prev = document.getElementById('m-id-logo-preview');
    var file = document.getElementById('m-id-logo-file');
    if (hid) hid.value = '';
    if (file) file.value = '';
    if (prev) { prev.removeAttribute('src'); prev.classList.add('hidden'); }
}
window.mClearIdLogo = mClearIdLogo;

function mBuildCardFaceStyle(doc) {
    var mode = (doc && doc.bgMode) || (doc && doc.cardBackground ? 'image' : 'theme');
    var style = '';
    if (mode === 'solid' && doc.bgColor1) {
        style = 'background:' + doc.bgColor1 + ';';
    } else if (mode === 'gradient' && doc.bgColor1) {
        var c2 = doc.bgColor2 || doc.bgColor1;
        style = 'background:linear-gradient(135deg,' + doc.bgColor1 + ',' + c2 + ');';
    } else if (mode === 'image' && doc.cardBackground) {
        style = "background-image:url('" + String(doc.cardBackground).replace(/'/g, '%27') + "');";
    }
    return style;
}

function mBuildCardThemeClass(doc) {
    var mode = (doc && doc.bgMode) || (doc && doc.cardBackground ? 'image' : 'theme');
    if (mode === 'solid' || mode === 'gradient') return 'm-id-theme-custom';
    if (mode === 'image' && doc.cardBackground) return 'm-id-theme-custom';
    return mIdTypeTheme(doc.type);
}


function mMaskDocNumber(num) {
    var s = String(num || '').replace(/\s/g, '');
    if (s.length <= 4) return s ? ('****' + s) : '—';
    return '•••• ' + s.slice(-4);
}

function mFormatIdDateInput(raw) {
    var d = String(raw || '').replace(/[^0-9]/g, '').slice(0, 8);
    if (d.length <= 4) return d;
    if (d.length <= 6) return d.slice(0, 4) + '/' + d.slice(4);
    return d.slice(0, 4) + '/' + d.slice(4, 6) + '/' + d.slice(6, 8);
}

function mBindIdDateFields() {
    var ph = mIdT('id_date_ph', 'YYYY/MM/DD');
    ['m-id-input-birth', 'm-id-input-issue', 'm-id-input-expiry'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('inputmode', 'numeric');
        el.setAttribute('maxlength', '10');
        el.setAttribute('placeholder', ph);
        if (el.value) el.value = mFormatIdDateInput(el.value.replace(/[\/\-.]/g, ''));
        el.oninput = function (e) {
            e.target.value = mFormatIdDateInput(e.target.value);
            try { e.target.setSelectionRange(e.target.value.length, e.target.value.length); } catch (err) {}
        };
        el.onblur = function (e) { e.target.value = mFormatIdDateInput(e.target.value); };
    });
}

function mParseIdDate(str) {
    if (!str) return null;
    var s = String(str).trim();
    var m = s.match(/^(\d{4})[\/\-.](\d{2})[\/\-.](\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    var t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
}

function mIsIdExpirySoon(dateStr) {
    var d = mParseIdDate(dateStr);
    if (!d) return false;
    var diff = d.getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function mSaveIdDocsToStorage() {
    localStorage.setItem('vns_id_docs', JSON.stringify(mIdentityDocs));
}

function mLoadIdDocsFromStorage() {
    try { mIdentityDocs = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) { mIdentityDocs = []; }
    if (!Array.isArray(mIdentityDocs)) mIdentityDocs = [];
}

function mSetMobileIdsCategory(element) {
    // Always clear exit lock flag so UI is interactive again
    mIdVnsIsExiting = false;

    var listSec = document.getElementById('list-section');
    if (listSec) listSec.style.setProperty('display', 'none', 'important');
    var mainSec = document.getElementById('main-section');
    if (mainSec) mainSec.style.setProperty('display', 'none', 'important');
    var cardsRoot = document.getElementById('m-cards-main-container');
    if (cardsRoot) {
        cardsRoot.classList.add('hidden');
        cardsRoot.style.setProperty('display', 'none', 'important');
    }
    var root = document.getElementById('m-ids-main-container');
    if (root) {
        root.classList.remove('hidden');
        root.style.setProperty('display', 'flex', 'important');
        root.style.setProperty('flex-direction', 'column', 'important');
        root.style.setProperty('visibility', 'visible', 'important');
        root.style.setProperty('opacity', '1', 'important');
        root.style.setProperty('z-index', '200', 'important');
        root.style.setProperty('pointer-events', 'auto', 'important');
    }
    // Clear any lock-time inline display on form/view so they can open normally
    var formScr = document.getElementById('m-id-form-screen');
    var viewScr = document.getElementById('m-id-view-screen');
    if (formScr) {
        formScr.classList.add('hidden');
        formScr.style.removeProperty('display');
        formScr.style.removeProperty('pointer-events');
    }
    if (viewScr) {
        viewScr.classList.add('hidden');
        viewScr.style.removeProperty('display');
        viewScr.style.removeProperty('pointer-events');
    }
    document.querySelectorAll('.sidebar-item, .folder-sub-item').forEach(function (i) { i.classList.remove('active'); });
    if (element) element.classList.add('active');
    var titleEl = document.getElementById('active-category-title');
    if (titleEl) titleEl.innerText = mIdT('id_module_title', 'ID & Passport');
    mLoadIdDocsFromStorage();
    mRenderIdDocsContainer();
    if (window.innerWidth < 1024 && typeof closeMobileSidebar === 'function') {
        try { closeMobileSidebar(); } catch (e) {}
    }
}


function mExitIdsModuleMatrix() {
    if (mIdVnsIsExiting) return;
    mIdVnsIsExiting = true;
    try {
        var root = document.getElementById('m-ids-main-container');
        if (root) {
            root.classList.add('hidden');
            root.style.setProperty('display', 'none', 'important');
            root.style.removeProperty('visibility');
            root.style.removeProperty('z-index');
            root.style.removeProperty('pointer-events');
            root.style.removeProperty('opacity');
        }
        var listSec = document.getElementById('list-section');
        if (listSec) { listSec.style.removeProperty('display'); listSec.style.display = ''; }
        var mainSec = document.getElementById('main-section');
        if (mainSec) { mainSec.style.removeProperty('display'); mainSec.style.display = ''; }
        mCloseIdScreens();
        var formScr = document.getElementById('m-id-form-screen');
        var viewScr = document.getElementById('m-id-view-screen');
        if (formScr) formScr.style.removeProperty('display');
        if (viewScr) viewScr.style.removeProperty('display');
        // Do NOT call setCategory here — it re-enters mExitCardsModuleMatrix and can freeze WebView.
        // Just restore list UI; sidebar active state is optional.
        document.querySelectorAll('.sidebar-item, .folder-sub-item').forEach(function (i) { i.classList.remove('active'); });
        var homeEl = document.querySelector('.sidebar-item[cat="home"]');
        if (homeEl) homeEl.classList.add('active');
        var titleEl = document.getElementById('active-category-title');
        if (titleEl && typeof t === 'function') {
            try { titleEl.innerText = t('sidebar_home') || 'Home'; } catch (e) { titleEl.innerText = 'Home'; }
        }
        if (typeof currentCategory !== 'undefined') currentCategory = 'home';
    } finally {
        mIdVnsIsExiting = false;
    }
}


function mCloseIdScreens() {
    var form = document.getElementById('m-id-form-screen');
    var view = document.getElementById('m-id-view-screen');
    if (form) form.classList.add('hidden');
    if (view) view.classList.add('hidden');
    mActiveIdDocId = null;
}

function mToggleIdSelect(id, ev) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    id = String(id);
    if (selectedIdDocIds.has(id)) selectedIdDocIds.delete(id);
    else selectedIdDocIds.add(id);
    mUpdateIdBulkBar();
    var outer = document.querySelector('.m-id-outer[data-id="' + id + '"]');
    if (outer) {
        outer.classList.toggle('id-selected', selectedIdDocIds.has(id));
        var cb = outer.querySelector('.m-id-select-cb');
        if (cb) cb.checked = selectedIdDocIds.has(id);
    }
}

function mClearIdSelection() {
    selectedIdDocIds.clear();
    mUpdateIdBulkBar();
    document.querySelectorAll('.m-id-outer.id-selected').forEach(function (el) { el.classList.remove('id-selected'); });
    document.querySelectorAll('.m-id-select-cb').forEach(function (el) { el.checked = false; });
}

function mUpdateIdBulkBar() {
    var bar = document.getElementById('m-id-bulk-bar');
    var host = document.getElementById('m-id-items-container');
    if (!bar && host && host.parentElement) {
        bar = document.createElement('div');
        bar.id = 'm-id-bulk-bar';
        bar.className = 'm-bulk-bar hidden';
        bar.innerHTML =
            '<span id="m-id-bulk-count" class="m-bulk-count">0</span>' +
            '<div class="m-bulk-actions">' +
            '<button type="button" class="m-bulk-btn cancel" onclick="mClearIdSelection()">' + mIdT('btn_cancel', 'Cancel') + '</button>' +
            '<button type="button" class="m-bulk-btn delete" onclick="mDeleteSelectedIdDocs()">' + mIdT('btn_delete', 'Delete') + '</button>' +
            '</div>';
        host.parentElement.insertBefore(bar, host);
    }
    if (!bar) return;
    var n = selectedIdDocIds.size;
    var c = document.getElementById('m-id-bulk-count');
    if (c) {
        c.textContent = n
            ? mIdT('m_id_selected_count', '{n} selected').replace('{n}', String(n))
            : mIdT('m_id_selected_none', '0 selected');
    }
    // refresh button labels if bar already existed
    var cancelBtn = bar.querySelector('.m-bulk-btn.cancel');
    var deleteBtn = bar.querySelector('.m-bulk-btn.delete');
    if (cancelBtn) cancelBtn.textContent = mIdT('btn_cancel', 'Cancel');
    if (deleteBtn) deleteBtn.textContent = mIdT('btn_delete', 'Delete');
    if (n > 0) bar.classList.remove('hidden');
    else bar.classList.add('hidden');
}

function mDeleteSelectedIdDocs() {
    if (!selectedIdDocIds.size) return;
    var msg = mIdT('m_id_confirm_delete_many', 'Delete {n} selected document(s)?').replace('{n}', String(selectedIdDocIds.size));
    if (!confirm(msg)) return;
    var ids = Array.from(selectedIdDocIds);
    mIdentityDocs = mIdentityDocs.filter(function (d) { return ids.indexOf(String(d.id)) === -1; });
    mSaveIdDocsToStorage();
    selectedIdDocIds.clear();
    mRenderIdDocsContainer();
    if (typeof showVnsAlert === 'function') {
        showVnsAlert(mIdT('alert_deleted_title', 'Deleted'), mIdT('m_id_docs_removed', 'Selected documents removed.'), 'success');
    }
}

window.mToggleIdSelect = mToggleIdSelect;
window.mClearIdSelection = mClearIdSelection;
window.mDeleteSelectedIdDocs = mDeleteSelectedIdDocs;

function mRenderIdDocsContainer() {
    var scroller = document.getElementById('m-id-items-container');
    if (!scroller) return;
    scroller.innerHTML = '';
    mLoadIdDocsFromStorage();
    if (!mIdentityDocs.length) {
        scroller.innerHTML =
            '<div class="p-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl mx-2 bg-white">' +
            mEscapeIdHtml(mIdT('no_id_docs_found', 'No ID / Passport documents yet. Tap Add New above.')) +
            '</div>';
        return;
    }
    var sorted = mIdentityDocs.slice().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
    sorted.forEach(function (doc) {
        var fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '—';
        var title = fullName !== '—' ? fullName : mIdTypeLabel(doc.type);
        var expWarn = mIsIdExpirySoon(doc.expiryDate);
        var theme = mBuildCardThemeClass(doc);
        var bgStyle = mBuildCardFaceStyle(doc);
        var logoHtml = doc.logo
            ? ('<img class="m-id-logo" src="' + String(doc.logo).replace(/"/g, '&quot;') + '" alt="">')
            : '';
        var cardItem = document.createElement('div');
        cardItem.className = 'm-id-outer w-full block select-none mb-3 shadow-lg rounded-[18px] overflow-hidden relative';
        cardItem.setAttribute('data-id', String(doc.id));
        cardItem.innerHTML =
            '<div class="m-id-card-shell ' + (expWarn ? 'm-id-expiring' : '') + '">' +
            '<div class="m-id-card-face ' + theme + '" style="' + bgStyle + '" onclick="mOpenIdDocDetails(\'' + doc.id + '\')">' +
            '<div class="m-id-card-top">' + logoHtml + '<span class="m-id-type-badge">' + mEscapeIdHtml(mIdTypeLabel(doc.type)) + '</span></div>' +
            '<div class="m-id-card-body">' +
            '<div class="m-id-title">' + mEscapeIdHtml(title) + '</div>' +
            '<div id="m-id-num-' + doc.id + '" class="m-id-number mono">' + mEscapeIdHtml(mMaskDocNumber(doc.docNumber)) + '</div>' +
            '</div>' +
            '<div class="m-id-card-foot">' +
            '<span>' + mEscapeIdHtml(doc.nationality || '—') + '</span>' +
            '<span class="' + (expWarn ? 'm-id-exp-warn' : '') + '">' + mEscapeIdHtml(mIdT('m_id_exp_prefix', 'EXP')) + ' ' + mEscapeIdHtml(doc.expiryDate || '—') + '</span>' +
            '</div></div>' +
            '<div class="m-id-action-bar" onclick="event.stopPropagation()">' +
            '<button type="button" title="' + mEscapeIdHtml(mIdT('edit_matrix', 'Edit')) + '" onclick="mOpenIdDocForm(\'' + doc.id + '\')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>' +
            '<button type="button" title="' + mEscapeIdHtml(mIdT('copy_number', 'Copy')) + '" onclick="mCopyIdDocNumber(\'' + doc.id + '\')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>' +
            '<button type="button" title="' + mEscapeIdHtml(mIdT('reveal', 'Reveal')) + '" onclick="mToggleRevealIdNumber(\'' + doc.id + '\')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
            '<button type="button" title="' + mEscapeIdHtml(mIdT('trash', 'Trash')) + '" onclick="mDeleteIdDoc(\'' + doc.id + '\')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
            '</div></div>';
        scroller.appendChild(cardItem);
    });
    mUpdateIdBulkBar();
}

/*function mOpenIdDocForm(id) {
    mActiveIdDocId = id || null;
    var doc = id ? mIdentityDocs.find(function (d) { return String(d.id) === String(id); }) : null;
    var title = document.getElementById('m-id-form-title');
    if (title) {
        title.textContent = doc
            ? mIdT('m_id_form_edit', 'Edit Document')
            : mIdT('m_id_form_add', 'Add Document');
    }
    function setVal(fid, v) {
        var el = document.getElementById(fid);
        if (el) el.value = v == null ? '' : v;
    }
    setVal('m-id-input-type', doc ? (doc.type || 'passport') : 'passport');
    setVal('m-id-input-number', doc ? (doc.docNumber || '') : '');
    setVal('m-id-input-first', doc ? (doc.firstName || '') : '');
    setVal('m-id-input-last', doc ? (doc.lastName || '') : '');
    setVal('m-id-input-father', doc ? (doc.fatherName || '') : '');
    setVal('m-id-input-nationality', doc ? (doc.nationality || '') : '');
    setVal('m-id-input-birth', doc ? (doc.birthDate || '') : '');
    setVal('m-id-input-issue', doc ? (doc.issueDate || '') : '');
    setVal('m-id-input-expiry', doc ? (doc.expiryDate || '') : '');
    setVal('m-id-input-place', doc ? (doc.issuePlace || '') : '');
    setVal('m-id-input-notes', doc ? (doc.notes || '') : '');
    var photoHid = document.getElementById('m-id-photo-data');
    var photoPrev = document.getElementById('m-id-photo-preview');
    if (photoHid) photoHid.value = (doc && doc.imageFront) ? doc.imageFront : '';
    if (photoPrev) {
        if (doc && doc.imageFront) {
            photoPrev.src = doc.imageFront;
            photoPrev.classList.remove('hidden');
        } else {
            photoPrev.removeAttribute('src');
            photoPrev.classList.add('hidden');
        }
    }
    var bgHid = document.getElementById('m-id-bg-data');
    var bgPrev = document.getElementById('m-id-bg-preview');
    if (bgHid) bgHid.value = (doc && doc.cardBackground) ? doc.cardBackground : '';
    if (bgPrev) {
        if (doc && doc.cardBackground) {
            bgPrev.src = doc.cardBackground;
            bgPrev.classList.remove('hidden');
        } else {
            bgPrev.removeAttribute('src');
            bgPrev.classList.add('hidden');
        }
    }
    var trashBtn = document.getElementById('m-id-btn-form-trash');
    if (trashBtn) {
        if (doc) trashBtn.classList.remove('hidden');
        else trashBtn.classList.add('hidden');
    }
    var form = document.getElementById('m-id-form-screen');
    if (form) form.classList.remove('hidden');
    mBindIdDateFields();
}*/
function mOpenIdDocForm(id) {
    if (!id && mActiveIdDocId) id = mActiveIdDocId;
    mActiveIdDocId = id || null;

    // ۱. بستن پنجره جزئیات برای نمایش فرم ویرایش
    var view = document.getElementById('m-id-view-screen');
    if (view) view.classList.add('hidden');

    var doc = id ? mIdentityDocs.find(function (d) { return String(d.id) === String(id); }) : null;
    var title = document.getElementById('m-id-form-title');
    if (title) {
        title.textContent = doc
            ? mIdT('m_id_form_edit', 'Edit Document')
            : mIdT('m_id_form_add', 'Add Document');
    }
    function setVal(fid, v) {
        var el = document.getElementById(fid);
        if (el) el.value = v == null ? '' : v;
    }
    setVal('m-id-input-type', doc ? (doc.type || 'passport') : 'passport');
    setVal('m-id-input-number', doc ? (doc.docNumber || '') : '');
    setVal('m-id-input-first', doc ? (doc.firstName || '') : '');
    setVal('m-id-input-last', doc ? (doc.lastName || '') : '');
    setVal('m-id-input-father', doc ? (doc.fatherName || '') : '');
    setVal('m-id-input-nationality', doc ? (doc.nationality || '') : '');
    setVal('m-id-input-birth', doc ? (doc.birthDate || '') : '');
    setVal('m-id-input-issue', doc ? (doc.issueDate || '') : '');
    setVal('m-id-input-expiry', doc ? (doc.expiryDate || '') : '');
    setVal('m-id-input-place', doc ? (doc.issuePlace || '') : '');
    setVal('m-id-input-notes', doc ? (doc.notes || '') : '');
    var photoHid = document.getElementById('m-id-photo-data');
    var photoPrev = document.getElementById('m-id-photo-preview');
    if (photoHid) photoHid.value = (doc && doc.imageFront) ? doc.imageFront : '';
    if (photoPrev) {
        if (doc && doc.imageFront) {
            photoPrev.src = doc.imageFront;
            photoPrev.classList.remove('hidden');
        } else {
            photoPrev.removeAttribute('src');
            photoPrev.classList.add('hidden');
        }
    }
    var bgHid = document.getElementById('m-id-bg-data');
    var bgPrev = document.getElementById('m-id-bg-preview');
    if (bgHid) bgHid.value = (doc && doc.cardBackground) ? doc.cardBackground : '';
    if (bgPrev) {
        if (doc && doc.cardBackground) {
            bgPrev.src = doc.cardBackground;
            bgPrev.classList.remove('hidden');
        } else {
            bgPrev.removeAttribute('src');
            bgPrev.classList.add('hidden');
        }
    }

    var logoHid = document.getElementById('m-id-logo-data');
    var logoPrev = document.getElementById('m-id-logo-preview');
    if (logoHid) logoHid.value = (doc && doc.logo) ? doc.logo : '';
    if (logoPrev) {
        if (doc && doc.logo) {
            logoPrev.src = doc.logo;
            logoPrev.classList.remove('hidden');
        } else {
            logoPrev.removeAttribute('src');
            logoPrev.classList.add('hidden');
        }
    }
    var modeEl = document.getElementById('m-id-input-bg-mode');
    var c1 = document.getElementById('m-id-input-bg-c1');
    var c2el = document.getElementById('m-id-input-bg-c2');
    var mode = 'theme';
    if (doc) {
        if (doc.bgMode) mode = doc.bgMode;
        else if (doc.cardBackground) mode = 'image';
    }
    if (modeEl) modeEl.value = mode;
    if (c1) c1.value = (doc && doc.bgColor1) ? doc.bgColor1 : '#1e3a5f';
    if (c2el) c2el.value = (doc && doc.bgColor2) ? doc.bgColor2 : '#0f172a';
    if (typeof mOnIdBgModeChange === 'function') mOnIdBgModeChange();

    var trashBtn = document.getElementById('m-id-btn-form-trash');
    if (trashBtn) {
        if (doc) trashBtn.classList.remove('hidden');
        else trashBtn.classList.add('hidden');
    }
    var form = document.getElementById('m-id-form-screen');
    if (form) form.classList.remove('hidden');
    mBindIdDateFields();
}

function mOpenNewIdDocForm() {
    mOpenIdDocForm(null);
}

function mCommitIdDocSave() {
    var type = ((document.getElementById('m-id-input-type') || {}).value) || 'passport';
    var docNumber = ((document.getElementById('m-id-input-number') || {}).value || '').trim();
    var firstName = ((document.getElementById('m-id-input-first') || {}).value || '').trim();
    var lastName = ((document.getElementById('m-id-input-last') || {}).value || '').trim();
    var fatherName = ((document.getElementById('m-id-input-father') || {}).value || '').trim();
    var nationality = ((document.getElementById('m-id-input-nationality') || {}).value || '').trim();
    var birthDate = mFormatIdDateInput(((document.getElementById('m-id-input-birth') || {}).value || '').trim());
    var issueDate = mFormatIdDateInput(((document.getElementById('m-id-input-issue') || {}).value || '').trim());
    var expiryDate = mFormatIdDateInput(((document.getElementById('m-id-input-expiry') || {}).value || '').trim());
    var issuePlace = ((document.getElementById('m-id-input-place') || {}).value || '').trim();
    var notes = ((document.getElementById('m-id-input-notes') || {}).value || '').trim();
    var imageFront = ((document.getElementById('m-id-photo-data') || {}).value || '') || null;
    var cardBackground = ((document.getElementById('m-id-bg-data') || {}).value || '') || null;
    var logo = ((document.getElementById('m-id-logo-data') || {}).value || '') || null;
    var bgMode = ((document.getElementById('m-id-input-bg-mode') || {}).value) || 'theme';
    var bgColor1 = ((document.getElementById('m-id-input-bg-c1') || {}).value) || '#1e3a5f';
    var bgColor2 = ((document.getElementById('m-id-input-bg-c2') || {}).value) || '#0f172a';
    if (bgMode !== 'image') cardBackground = null;
    if (!docNumber && !firstName && !lastName) {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(
                mIdT('alert_validation_title', 'Validation'),
                mIdT('id_required_fields', 'Enter at least a document number or a name.'),
                'warning'
            );
        }
        return;
    }
    var old = mActiveIdDocId ? mIdentityDocs.find(function (d) { return String(d.id) === String(mActiveIdDocId); }) : null;
    var autoLabel = [firstName, lastName].filter(Boolean).join(' ').trim();
    var payload = {
        id: mActiveIdDocId || ('idoc_' + Date.now()),
        type: type,
        label: autoLabel || mIdTypeLabel(type),
        docNumber: docNumber,
        firstName: firstName,
        lastName: lastName,
        fatherName: fatherName,
        nationality: nationality,
        birthDate: birthDate,
        issueDate: issueDate,
        expiryDate: expiryDate,
        issuePlace: issuePlace,
        notes: notes,
        imageFront: imageFront,
        logo: logo,
        cardBackground: cardBackground,
        bgMode: bgMode,
        bgColor1: (bgMode === 'solid' || bgMode === 'gradient') ? bgColor1 : '',
        bgColor2: (bgMode === 'gradient') ? bgColor2 : '',
        pinned: old ? !!old.pinned : false,
        status: old && old.status ? old.status : 'active'
    };
    if (mActiveIdDocId) {
        var idx = mIdentityDocs.findIndex(function (d) { return String(d.id) === String(mActiveIdDocId); });
        if (idx !== -1) mIdentityDocs[idx] = payload;
        else mIdentityDocs.push(payload);
    } else {
        mIdentityDocs.push(payload);
    }
    mSaveIdDocsToStorage();
    mRenderIdDocsContainer();
    mCloseIdScreens();
    if (typeof showVnsAlert === 'function') {
        showVnsAlert(mIdT('alert_success_title', 'Success'), mIdT('m_id_doc_saved', 'Document saved.'), 'success');
    }
}

function mOpenIdDocDetails(id) {
    var doc = mIdentityDocs.find(function (d) { return String(d.id) === String(id); });
    if (!doc) return;
    mActiveIdDocId = id;
    function setText(fid, v) {
        var el = document.getElementById(fid);
        if (el) el.textContent = v == null || v === '' ? '—' : v;
    }
    setText('m-id-view-type', mIdTypeLabel(doc.type));
    setText('m-id-view-number', doc.docNumber || '—');
    setText('m-id-view-name', [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '—');
    setText('m-id-view-father', doc.fatherName || '—');
    setText('m-id-view-nationality', doc.nationality || '—');
    setText('m-id-view-birth', doc.birthDate || '—');
    setText('m-id-view-issue', doc.issueDate || '—');
    setText('m-id-view-expiry', doc.expiryDate || '—');
    setText('m-id-view-place', doc.issuePlace || '—');
    setText('m-id-view-notes', doc.notes || '—');
    var photo = document.getElementById('m-id-view-photo');
    if (photo) {
        if (doc.imageFront) {
            photo.src = doc.imageFront;
            photo.classList.remove('hidden');
            photo.onclick = function () { mOpenIdPhotoLightbox(doc.imageFront); };
        } else {
            photo.removeAttribute('src');
            photo.classList.add('hidden');
        }
    }
    var view = document.getElementById('m-id-view-screen');
    if (view) view.classList.remove('hidden');
}

function mDeleteIdDoc(id) {
    if (!id) return;
    var msg = mIdT('confirm_delete_id', 'Delete this document?');
    if (!confirm(msg)) return;
    mIdentityDocs = mIdentityDocs.filter(function (d) { return String(d.id) !== String(id); });
    mSaveIdDocsToStorage();
    mRenderIdDocsContainer();
    mCloseIdScreens();
    if (typeof showVnsAlert === 'function') {
        showVnsAlert(mIdT('alert_deleted_title', 'Deleted'), mIdT('m_id_doc_removed', 'Document removed.'), 'success');
    }
}

function mTrashCurrentIdForm() {
    if (mActiveIdDocId) mDeleteIdDoc(mActiveIdDocId);
}

function mCopyIdDocNumber(id) {
    var doc = mIdentityDocs.find(function (d) { return String(d.id) === String(id); });
    if (!doc || !doc.docNumber) return;
    var text = String(doc.docNumber).replace(/\s/g, '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(mIdT('alert_copied_title', 'Copied'), mIdT('id_number_copied', 'Document number copied.'), 'success');
            }
        });
    }
}

function mToggleRevealIdNumber(id) {
    var doc = mIdentityDocs.find(function (d) { return String(d.id) === String(id); });
    var el = document.getElementById('m-id-num-' + id);
    if (!doc || !el) return;
    var isOpen = el.getAttribute('data-open') === '1';
    if (isOpen) {
        el.textContent = mMaskDocNumber(doc.docNumber);
        el.setAttribute('data-open', '0');
        if (mIdRevealTimers[id]) { clearTimeout(mIdRevealTimers[id]); delete mIdRevealTimers[id]; }
        return;
    }
    el.textContent = doc.docNumber || '—';
    el.setAttribute('data-open', '1');
    if (mIdRevealTimers[id]) clearTimeout(mIdRevealTimers[id]);
    mIdRevealTimers[id] = setTimeout(function () {
        var node = document.getElementById('m-id-num-' + id);
        if (node) {
            node.textContent = mMaskDocNumber(doc.docNumber);
            node.setAttribute('data-open', '0');
        }
        delete mIdRevealTimers[id];
    }, 12000);
}

function mPreviewIdPhoto(input, kind) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        if (typeof showVnsAlert === 'function') {
            showVnsAlert(mIdT('alert_error_title', 'Error'), mIdT('select_image_file', 'Please select an image'), 'warning');
        }
        return;
    }
    var maxEdge = 560, maxBytes = 100000, quality = 0.8;
    if (kind === 'logo') {
        maxEdge = 96;
        maxBytes = 28000;
        quality = 0.82;
    } else if (kind === 'bg') {
        maxEdge = 720;
        maxBytes = 140000;
        quality = 0.78;
    }
    mCompressImageFile(file, { maxEdge: maxEdge, maxBytes: maxBytes, quality: quality }, function (dataUrl) {
        if (!dataUrl) {
            if (typeof showVnsAlert === 'function') {
                showVnsAlert(mIdT('alert_error_title', 'Error'), mIdT('m_id_image_process_fail', 'Could not process image'), 'warning');
            }
            return;
        }
        mApplyIdImageData(dataUrl, kind);
    });
}

function mApplyIdImageData(dataUrl, kind) {
    if (kind === 'bg') {
        var hid = document.getElementById('m-id-bg-data');
        var prev = document.getElementById('m-id-bg-preview');
        if (hid) hid.value = dataUrl;
        if (prev) { prev.src = dataUrl; prev.classList.remove('hidden'); }
    } else if (kind === 'logo') {
        var hidL = document.getElementById('m-id-logo-data');
        var prevL = document.getElementById('m-id-logo-preview');
        if (hidL) hidL.value = dataUrl;
        if (prevL) { prevL.src = dataUrl; prevL.classList.remove('hidden'); }
    } else {
        var hid2 = document.getElementById('m-id-photo-data');
        var prev2 = document.getElementById('m-id-photo-preview');
        if (hid2) hid2.value = dataUrl;
        if (prev2) { prev2.src = dataUrl; prev2.classList.remove('hidden'); }
    }
}

function mClearIdPhoto() {
    var hid = document.getElementById('m-id-photo-data');
    var prev = document.getElementById('m-id-photo-preview');
    var file = document.getElementById('m-id-photo-file');
    if (hid) hid.value = '';
    if (file) file.value = '';
    if (prev) { prev.removeAttribute('src'); prev.classList.add('hidden'); }
}

function mClearIdBg() {
    var hid = document.getElementById('m-id-bg-data');
    var prev = document.getElementById('m-id-bg-preview');
    var file = document.getElementById('m-id-bg-file');
    if (hid) hid.value = '';
    if (file) file.value = '';
    if (prev) { prev.removeAttribute('src'); prev.classList.add('hidden'); }
}

function mOpenIdPhotoLightbox(src) {
    if (!src) return;
    var box = document.getElementById('m-id-photo-lightbox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'm-id-photo-lightbox';
        box.className = 'm-id-lightbox';
        box.innerHTML = '<img alt="' + mEscapeIdHtml(mIdT('id_photo_optional', 'Document')) + '"/><button type="button" class="m-id-lightbox-close">&times;</button>';
        document.body.appendChild(box);
        box.addEventListener('click', function (e) {
            if (e.target === box || e.target.classList.contains('m-id-lightbox-close')) {
                box.classList.remove('open');
            }
        });
    }
    var img = box.querySelector('img');
    if (img) img.src = src;
    box.classList.add('open');
}

window.mSetMobileIdsCategory = mSetMobileIdsCategory;
window.mExitIdsModuleMatrix = mExitIdsModuleMatrix;
window.mOpenNewIdDocForm = mOpenNewIdDocForm;
window.mOpenIdDocForm = mOpenIdDocForm;
window.mCommitIdDocSave = mCommitIdDocSave;
window.mOpenIdDocDetails = mOpenIdDocDetails;
window.mCloseIdScreens = mCloseIdScreens;
window.mDeleteIdDoc = mDeleteIdDoc;
window.mTrashCurrentIdForm = mTrashCurrentIdForm;
window.mCopyIdDocNumber = mCopyIdDocNumber;
window.mToggleRevealIdNumber = mToggleRevealIdNumber;
window.mPreviewIdPhoto = mPreviewIdPhoto;
window.mClearIdPhoto = mClearIdPhoto;
window.mClearIdBg = mClearIdBg;
window.mOpenIdPhotoLightbox = mOpenIdPhotoLightbox;
window.mRenderIdDocsContainer = mRenderIdDocsContainer;
window.mLoadIdDocsFromStorage = mLoadIdDocsFromStorage;

window.mForceCloseIdsOnLock = function () {
    try {
        mIdVnsIsExiting = false;
        if (typeof mCloseIdScreens === 'function') mCloseIdScreens();
        var root = document.getElementById('m-ids-main-container');
        if (root) {
            root.classList.add('hidden');
            root.style.setProperty('display', 'none', 'important');
            root.style.removeProperty('visibility');
            root.style.removeProperty('z-index');
            root.style.removeProperty('pointer-events');
            root.style.removeProperty('opacity');
        }
        var form = document.getElementById('m-id-form-screen');
        var view = document.getElementById('m-id-view-screen');
        if (form) {
            form.classList.add('hidden');
            form.style.removeProperty('display');
            form.style.removeProperty('pointer-events');
        }
        if (view) {
            view.classList.add('hidden');
            view.style.removeProperty('display');
            view.style.removeProperty('pointer-events');
        }
        var box = document.getElementById('m-id-photo-lightbox');
        if (box) box.classList.remove('open');
        mActiveIdDocId = null;
    } catch (e) {
        console.error('mForceCloseIdsOnLock', e);
        mIdVnsIsExiting = false;
    }
};
