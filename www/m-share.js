let vnsHtml5QrcodeScanner = null;
let pendingOpticalItem = null;
let scannedCableServerInfo = null;

// ==========================================
// تولید کیوآرکد و توابع دوربین (تغییری نکرده و سالم هستند)
// ==========================================
window.generateOfflineQRForItem = function(itemId) {
    const targetItem = mPaymentCards.find(x => String(x.id) === String(itemId));
    if (!targetItem) return;

    if (typeof activeMasterKey === 'undefined' || !activeMasterKey) {
        if (typeof showAlert === 'function') showAlert("Cryptographic key missing!");
        return;
    }
    
    const container = document.getElementById('qr-canvas-container');
    if (!container) return;

    container.innerHTML = `
        <div class="w-full text-left space-y-3">
            <p class="text-[10px] font-black text-slate-500 uppercase mb-1 border-b border-slate-100 pb-2">Select Data Matrix Elements</p>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-name" checked class="accent-[#0D9488] w-4 h-4"> Bank / Holder Name</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-user" checked class="accent-[#0D9488] w-4 h-4"> Card Number Matrix</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-pass" checked class="accent-[#0D9488] w-4 h-4"> CVV2 Protected Code</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-site" checked class="accent-[#0D9488] w-4 h-4"> Expiration Date Node</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-note" checked class="accent-[#0D9488] w-4 h-4"> Account Number Route</label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" id="chk-backup" checked class="accent-[#0D9488] w-4 h-4"> IBAN Sheba Payload</label>
            <button id="btn-render-qr" class="w-full mt-4 py-3 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md uppercase transition-all border-none cursor-pointer">Generate Secure Matrix</button>
        </div>
    `;

    document.getElementById('gen-overlay')?.classList.remove('hidden');
    document.getElementById('qr-display-modal')?.classList.remove('hidden');

    const renderBtn = document.getElementById('btn-render-qr');
    if (renderBtn) {
        renderBtn.onclick = async () => {
            const partialItem = { id: targetItem.id };
            if (document.getElementById('chk-name').checked) partialItem.name = targetItem.name || targetItem.bank;
            if (document.getElementById('chk-user').checked) partialItem.user = targetItem.number;
            if (document.getElementById('chk-pass').checked) partialItem.pass = targetItem.cvv;
            if (document.getElementById('chk-site').checked) partialItem.site = targetItem.exp;
            if (document.getElementById('chk-note').checked) partialItem.note = targetItem.account;
            if (document.getElementById('chk-backup').checked) partialItem.backup = targetItem.iban;

            try {
                const payloadString = JSON.stringify(partialItem);
                const encryptedData = await encryptData(payloadString, activeMasterKey);
                const transferObj = { vns_opt: "1.1", iv: encryptedData.iv, cipher: encryptedData.ciphertext };
                const b64TransferString = btoa(JSON.stringify(transferObj));

                container.innerHTML = '';
                new QRCode(container, { text: b64TransferString, width: 220, height: 220, colorDark : "#1e293b", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.M });
            } catch (e) {
                if (typeof showAlert === 'function') showAlert("Failed to compile crypto matrix.");
            }
        };
    }
};

window.closeCustomQRModal = function() {
    document.getElementById('qr-display-modal')?.classList.add('hidden');
    const container = document.getElementById('qr-canvas-container');
    if (container) container.innerHTML = '';
    const overlay = document.getElementById('gen-overlay');
    if (overlay) overlay.classList.add('hidden');
};

window.initializeMobileScanner = async function() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.BarcodeScanner) {
        if (typeof showAlert === 'function') showAlert("Hardware camera scanner module not detected.");
        return;
    }
    try {
        const status = await Capacitor.Plugins.BarcodeScanner.checkPermission({ force: true });
        if (!status.granted) {
            if (typeof showAlert === 'function') showAlert("Camera permission rejected.");
            return;
        }

        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.style.display = 'none';

        const scannerUI = document.createElement('div');
        scannerUI.id = 'custom-scanner-ui';
        scannerUI.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent;`;
        scannerUI.innerHTML = `
            <div style="margin-bottom: 30px; color: white; font-weight: 900; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,1); z-index: 2;">Align QR Code Within Frame</div>
            <div style="width: 260px; height: 260px; border: 4px solid #0D9488; border-radius: 24px; box-shadow: 0 0 0 100vw rgba(0, 0, 0, 0.85); position: relative; z-index: 1;"><div style="width: 100%; height: 2px; background: #0D9488; position: absolute; top: 50%;"></div></div>
            <button id="native-qr-close-btn" style="margin-top: 50px; background: #ef4444; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; border: none; z-index: 2;">Cancel</button>
        `;
        document.body.appendChild(scannerUI);
        document.body.style.background = "transparent";
        document.documentElement.style.background = "transparent";

        document.getElementById('native-qr-close-btn').onclick = window.stopAndCloseQRScanner;

        await Capacitor.Plugins.BarcodeScanner.hideBackground();
        const result = await Capacitor.Plugins.BarcodeScanner.startScan();

        if (result.hasContent) {
            await window.stopAndCloseQRScanner();
            window.onScanSuccess(result.content);
        }
    } catch (err) {
        await window.stopAndCloseQRScanner();
        if (typeof showAlert === 'function') showAlert("Camera execution fault.");
    }
};

window.stopAndCloseQRScanner = async function() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        await Capacitor.Plugins.BarcodeScanner.showBackground();
        await Capacitor.Plugins.BarcodeScanner.stopScan();
    }
    const scannerUI = document.getElementById('custom-scanner-ui');
    if (scannerUI) scannerUI.remove();

    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.setProperty('display', '', 'important');

    document.body.style.background = "";
    document.documentElement.style.background = "";
};

window.onScanSuccess = async function (decodedText) {
    try {
        // 1) WiFi / USB cable server QR
        let parsedJson = null;
        try { parsedJson = JSON.parse(decodedText); } catch (e) {}

        if (parsedJson && parsedJson.ip && parsedJson.port && parsedJson.token) {
            scannedCableServerInfo = parsedJson;

            const scannerModal = document.getElementById('qr-scanner-modal');
            if (scannerModal) scannerModal.classList.add('hidden');

            const syncModal = document.getElementById('cable-sync-actions-modal');
            if (syncModal) {
                syncModal.classList.remove('hidden');

                const pullBtn = document.getElementById('btn-smart-pull');
                if (pullBtn) {
                    pullBtn.style.setProperty(
                        'display',
                        parsedJson.action === 'push_only' ? 'none' : 'flex',
                        'important'
                    );
                }
                const pushBtn = document.getElementById('btn-smart-push');
                if (pushBtn) {
                    pushBtn.style.setProperty(
                        'display',
                        parsedJson.action === 'pull_only' ? 'none' : 'flex',
                        'important'
                    );
                }
            }
            return;
        }

        // 2) Optical transfer (base64 JSON)
        const safeText = String(decodedText || '').replace(/[^A-Za-z0-9+/=]/g, '');
        let parsedB64;
        try {
            parsedB64 = atob(safeText);
        } catch (e) {
            return;
        }

        let opticalObj;
        try {
            opticalObj = JSON.parse(parsedB64);
        } catch (e) {
            return;
        }

        function norm(s) {
            return String(s || '').trim().toLowerCase();
        }

        // ---------- 1.1 Payment card ----------
        if (opticalObj.vns_opt === '1.1' && opticalObj.cipher) {
                        if (!window.VNS_FEATURES || !VNS_FEATURES.cards) {
                return;
            }
            let decryptedPayload = null;
            try {
                decryptedPayload = await decryptData(
                    { iv: opticalObj.iv, ciphertext: opticalObj.cipher },
                    activeMasterKey
                );
            } catch (e) {
                return;
            }
            if (!decryptedPayload) return;

            let injectedItem;
            try {
                injectedItem = JSON.parse(decryptedPayload);
            } catch (e) {
                return;
            }

            const incomingCard = {
                id: injectedItem.id != null ? String(injectedItem.id) : String(Date.now()),
                bank: injectedItem.name || injectedItem.bank || 'Imported Card',
                number: injectedItem.user || injectedItem.number || '',
                cvv: injectedItem.pass || injectedItem.cvv || '',
                exp: injectedItem.site || injectedItem.exp || '',
                account: injectedItem.note || injectedItem.account || '',
                iban: injectedItem.backup || injectedItem.iban || '',
                pinned: !!injectedItem.pinned,
                status: injectedItem.status || 'active'
            };

            if (typeof mPaymentCards === 'undefined' || !Array.isArray(mPaymentCards)) {
                window.mPaymentCards = [];
            }

            const existingCard = mPaymentCards.find(function (c) {
                if (!c || c.status === 'deleted') return false;
                if (String(c.id) === String(incomingCard.id)) return true;
                if (norm(c.bank) === norm(incomingCard.bank) &&
                    norm(c.number) && norm(c.number) === norm(incomingCard.number)) {
                    return true;
                }
                return false;
            });

            if (existingCard) {
                const idx = mPaymentCards.findIndex(function (c) {
                    return String(c.id) === String(existingCard.id);
                });
                if (idx !== -1) {
                    mPaymentCards[idx] = Object.assign({}, mPaymentCards[idx], incomingCard, {
                        id: existingCard.id
                    });
                }
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert('Updated', 'Card updated (no duplicate).', 'success');
                }
            } else {
                incomingCard.id = String(Date.now());
                mPaymentCards.push(incomingCard);
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert('Success', 'Card synchronized from Windows client.', 'success');
                }
            }

            if (typeof mSaveDataToLocalStorage === 'function') mSaveDataToLocalStorage();
            if (typeof mRenderCardsContainer === 'function') mRenderCardsContainer();
            return;
        }

        // ---------- 1.2 Credential item (Facebook etc.) ----------
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
                if (typeof showAlert === 'function') showAlert('Decrypt failed');
                return;
            }
            if (!decryptedPayload) {
                if (typeof showAlert === 'function') showAlert('Empty payload');
                return;
            }

            let injectedItem;
            try {
                injectedItem = JSON.parse(decryptedPayload);
            } catch (e) {
                if (typeof showAlert === 'function') showAlert('Invalid item JSON');
                return;
            }

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

            const list = (typeof items !== 'undefined' && Array.isArray(items)) ? items : [];
            const existing = list.find(function (x) {
                if (!x || x.status === 'deleted') return false;
                if (String(x.id) === String(incoming.id)) return true;
                if (norm(x.name) && norm(x.name) === norm(incoming.name) &&
                    norm(x.user) === norm(incoming.user)) {
                    return true;
                }
                return false;
            });

            if (existing) {
                const index = list.findIndex(function (x) {
                    return String(x.id) === String(existing.id);
                });
                if (index !== -1) {
                    list[index] = Object.assign({}, list[index], incoming, { id: existing.id });
                }
                if (typeof items !== 'undefined') items = list;
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert('Updated', 'Item updated (no duplicate).', 'success');
                } else if (typeof showAlert === 'function') {
                    showAlert('Item updated (no duplicate).');
                }
            } else {
                incoming.id = Date.now();
                list.push(incoming);
                if (typeof items !== 'undefined') items = list;
                if (typeof showAlert === 'function') showAlert('Item added.');
            }

            if (typeof saveItemsToStorage === 'function') await saveItemsToStorage();
            if (typeof renderList === 'function') renderList();

            const scannerModal = document.getElementById('qr-scanner-modal');
            if (scannerModal) scannerModal.classList.add('hidden');
            const overlay = document.getElementById('gen-overlay');
            if (overlay) overlay.classList.add('hidden');
            return;
        }
    } catch (e) {
        console.error(e);
    }
};
window.closeCableSyncModal = function() {
    const cableModal = document.getElementById('cable-sync-actions-modal');
    if (cableModal) cableModal.classList.add('hidden');
    scannedCableServerInfo = null;
};

// ==========================================
// 🚀 موتور هوشمند ارسال دیتا (بدون تداخل با app.js)
// ==========================================
window.vnsSmartPushData = async function() {
    if (!scannedCableServerInfo) return;
    
    // خواندن مستقیم دیتا از حافظه موبایل (این کد کپی دقیق نسخه سالم شماست)
    const masterUser = JSON.parse(localStorage.getItem('vns_master_user') || '{}');
    const encryptedData = JSON.parse(localStorage.getItem('vns_vault_encrypted_db') || '{}');
    let cardsData = [];
    let idDocsData = [];
    try { cardsData = JSON.parse(localStorage.getItem('vns_cards') || '[]'); } catch (e) {}
    try { idDocsData = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) {}
    if (typeof mPaymentCards !== 'undefined' && Array.isArray(mPaymentCards)) cardsData = mPaymentCards;
    if (typeof mIdentityDocs !== 'undefined' && Array.isArray(mIdentityDocs)) idDocsData = mIdentityDocs;
    const payloadStr = JSON.stringify({ masterUser, encryptedData, cardsData, idDocsData });
        if (!window.VNS_FEATURES || !VNS_FEATURES.cards) {
        cardsData = [];
    }

    try {
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
            if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t("success_vault_sent_to_pc") : "Success. Data sent to PC.");
            window.closeCableSyncModal();
        } else {
            if (typeof showAlert === 'function') showAlert("PC rejected push.");
        }
    } catch (e) {
        if (typeof showAlert === 'function') showAlert("Connection failed.");
    }
};


// ==========================================
// 🚀 موتور هوشمند دریافت دیتا (بدون تداخل با app.js)
// ==========================================
window.vnsSmartPullData = async function () {
    if (!scannedCableServerInfo) {
        if (typeof showAlert === 'function') showAlert("Server info missing. Please scan QR again.");
        return;
    }

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
            if (typeof rData === 'string') {
                try { rData = JSON.parse(rData); } catch (e) {}
            }
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

        if (!isOk || !payloadData) {
            if (typeof showAlert === 'function') showAlert("PC rejected status.");
            return;
        }

        // ???? payload
        let payloadObj = payloadData;
        if (typeof payloadData === 'string') {
            try { payloadObj = JSON.parse(payloadData); } catch (e1) {
                try { payloadObj = JSON.parse(JSON.parse(payloadData)); } catch (e2) {
                    if (typeof showAlert === 'function') showAlert("Invalid PC payload.");
                    return;
                }
            }
        }
        // ??? ?? ?? ?? ???
        if (payloadObj && payloadObj.payload && !payloadObj.encryptedData) {
            try {
                payloadObj = typeof payloadObj.payload === 'string'
                    ? JSON.parse(payloadObj.payload)
                    : payloadObj.payload;
            } catch (e) {}
        }

        if (!payloadObj || !payloadObj.masterUser || Object.keys(payloadObj.masterUser).length === 0) {
            if (typeof showAlert === 'function') {
                showAlert(typeof t === 'function' ? t("err_pc_vault_empty") : "PC Vault is empty.");
            }
            return;
        }

        const appContainer = document.getElementById('app-container');
        const isLoggedIntoDashboard = appContainer && !appContainer.classList.contains('hidden');

        // ---------- ??????? (???? deleted) ----------
        if (payloadObj.cardsData && Array.isArray(payloadObj.cardsData) && window.VNS_FEATURES && VNS_FEATURES.cards) {
            
            let localCards = [];
            try { localCards = JSON.parse(localStorage.getItem('vns_cards') || '[]'); } catch (e) {}
            if (typeof mPaymentCards !== 'undefined' && Array.isArray(mPaymentCards)) {
                localCards = mPaymentCards;
            }

            const map = new Map();
            // ??? ???????? ???? ????
            localCards
                .filter(c => c && c.status !== 'deleted')
                .forEach(c => map.set(String(c.id), c));

            // ??? ???????? ????? ???? ?? PC
            payloadObj.cardsData
                .filter(c => c && c.status !== 'deleted')
                .forEach(c => map.set(String(c.id), c));

            const merged = Array.from(map.values());
            localStorage.setItem('vns_cards', JSON.stringify(merged));
            if (typeof mPaymentCards !== 'undefined') mPaymentCards = merged;
            if (typeof mRenderCardsContainer === 'function') mRenderCardsContainer();
        }

        // ---------- ID & Passport ----------
        if (payloadObj.idDocsData && Array.isArray(payloadObj.idDocsData)) {
            let localIds = [];
            try { localIds = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) {}
            if (typeof mIdentityDocs !== 'undefined' && Array.isArray(mIdentityDocs)) {
                localIds = mIdentityDocs;
            }

            const map = new Map();
            localIds
                .filter(d => d && d.status !== 'deleted')
                .forEach(d => map.set(String(d.id), d));

            payloadObj.idDocsData
                .filter(d => d && d.status !== 'deleted')
                .forEach(d => map.set(String(d.id), d));

            const merged = Array.from(map.values());
            localStorage.setItem('vns_id_docs', JSON.stringify(merged));
            if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = merged;
            if (typeof mLoadIdDocsFromStorage === 'function') mLoadIdDocsFromStorage();
            if (typeof mRenderIdDocsContainer === 'function') mRenderIdDocsContainer();
        }

        // ---------- Vault (?????) ----------
        if (isLoggedIntoDashboard && payloadObj.encryptedData && payloadObj.masterUser) {
            let decIncoming = null;
            const encBlob = payloadObj.encryptedData;

            // ??? ?? ???? ???? ?????? (??? ???? ????? ????)
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

            // ??? ???? ??? ?????? ?? ????
            if (!decIncoming) {
                const promptMsg = typeof t === 'function'
                    ? t("prompt_pc_password_merge")
                    : "Enter Windows App Master Password to unlock and merge incoming data:";
                const pcPassword = (typeof askSecurePrompt === 'function')
                    ? await askSecurePrompt(promptMsg)
                    : prompt(promptMsg);

                if (pcPassword && payloadObj.masterUser.salt) {
                    const pcSalt = new Uint8Array(base64ToBuf(payloadObj.masterUser.salt));
                    const pcKey = await deriveKeyFromPassword(pcPassword, pcSalt);

                    if (payloadObj.masterUser.verificationBlock) {
                        const check = await decryptData(payloadObj.masterUser.verificationBlock, pcKey);
                        if (check !== 'VNS_VERIFIED') {
                            if (typeof showVnsAlert === 'function') {
                                showVnsAlert("Wrong Password", "Enter the Windows master password.", "error");
                            }
                        } else {
                            decIncoming = await decryptData(encBlob, pcKey);
                        }
                    } else {
                        decIncoming = await decryptData(encBlob, pcKey);
                    }
                }
            }

            if (decIncoming) {
                try {
                    const parsedIncoming = typeof decIncoming === 'string' ? JSON.parse(decIncoming) : decIncoming;
                    const incomingItems = parsedIncoming.data || parsedIncoming.items || [];
                    const incomingFolders = parsedIncoming.folders || [];

                    const mergedItemsMap = new Map();
                    (typeof items !== 'undefined' && Array.isArray(items) ? items : [])
                        .forEach(item => mergedItemsMap.set(String(item.id), item));
                    incomingItems.forEach(item => mergedItemsMap.set(String(item.id), item));
                    items = Array.from(mergedItemsMap.values());

                    const folderSet = new Set(typeof folders !== 'undefined' && Array.isArray(folders) ? folders : []);
                    incomingFolders.forEach(f => folderSet.add(f));
                    folders = Array.from(folderSet);

                    if (typeof saveItemsToStorage === 'function') await saveItemsToStorage();
                    if (typeof renderList === 'function') renderList();
                    if (typeof renderFolders === 'function') renderFolders();
                } catch (e) {
                    console.error("Vault merge error:", e);
                }
            }
        } else if (!isLoggedIntoDashboard) {
            // ???? ????: mount ???? ?????
            const initTextarea = document.getElementById('init-import-string');
            if (initTextarea) {
                initTextarea.value = typeof payloadData === 'string' ? payloadData : JSON.stringify(payloadObj);
                if (typeof processInitImportPayload === 'function') processInitImportPayload();
            }
        }

        if (typeof closeCableSyncModal === 'function') closeCableSyncModal();
        if (typeof closeWifiServerModal === 'function') closeWifiServerModal();

        if (typeof showVnsAlert === 'function') {
            showVnsAlert("Success", "Data synced from PC (cards, IDs, vault).", "success");
        } else if (typeof showAlert === 'function') {
            showAlert("Data synced from PC.");
        }
    } catch (e) {
        console.error("vnsSmartPullData error:", e);
        if (typeof showAlert === 'function') showAlert("Connection failed.");
    }
};

/*---------------کدهای که برای دریافت اطلاعات از کامپیوتر ثبت شده اند ------------------*/
// ==========================================
// 🔗 اتصال دهنده اضطراری و مستقل دکمه PULL
// ==========================================
(function vnsBridgeFinalBuster() {
    // ایجاد یک لوپ برای چک کردن رندر شدن دکمه در منو
    const anchorTimer = setInterval(() => {
        // پیدا کردن مودال و دکمه بر اساس متن ثابت آن
        const syncModal = document.getElementById('cable-sync-actions-modal');
        if (!syncModal) return; // اگر هنوز مودال ساخته نشده، صبر کن

        const buttons = syncModal.querySelectorAll('button');
        let targetPullBtn = null;

        buttons.forEach(btn => {
            if (btn.textContent.includes('Get Data From PC')) {
                targetPullBtn = btn;
            }
        });

        if (targetPullBtn) {
            clearInterval(anchorTimer); // دکمه پیدا شد، توقف لوپ جستجو
            console.log("[VNS] Pull Button intercepted in memory.");

            // تزریق استایل برای اطمینان از کلیک‌پذیری صد در صد
            targetPullBtn.style.setProperty('pointer-events', 'auto', 'important');
            targetPullBtn.style.setProperty('cursor', 'pointer', 'important');

            // پاک کردن رویداد قبلی HTML و پیوند زدن مستقیم به موتور فچ دیتای ویندوز
            targetPullBtn.removeAttribute('onclick');
            
            targetPullBtn.onclick = async function(event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                // اجرای مستقیم منطق فچ کردن اطلاعات از لپ‌تاپ
                console.log("[VNS] Executing isolated Pull network request...");
                
                if (!scannedCableServerInfo) {
                    if (typeof showAlert === 'function') showAlert("Connection parameters missing. Scan QR again.");
                    return;
                }

                try {
                    const url = `http://${scannedCableServerInfo.ip}:${scannedCableServerInfo.port}/sync-pull`;
                    const reqData = { token: scannedCableServerInfo.token };

                    let isOk = false;
                    let payloadData = null;

                    // برقراری ارتباط با کابل از طریق لایه شبکه موبایل
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
                        // تزریق مستقیم به هر دو فیلد برای خنثی کردن تغییر آیدی‌ها در ورژن جدید
                        const initTextarea = document.getElementById('init-import-string');
                        const dashboardTextarea = document.getElementById('import-string-textarea');

                        if (initTextarea) initTextarea.value = payloadData;
                        if (dashboardTextarea) dashboardTextarea.value = payloadData;

                        // بررسی اینکه کدام ماژول واولت بیدار است؟ (داشبرد یا صفحه ورود)
                        const appContainer = document.getElementById('app-container');
                        const isLoggedIntoDashboard = appContainer && !appContainer.classList.contains('hidden');

                        if (isLoggedIntoDashboard && typeof submitImportString === 'function') {
                            submitImportString();
                        } else if (typeof processInitImportPayload === 'function') {
                            processInitImportPayload();
                        }

                        // بستن مودال همگام‌سازی
                        if (typeof closeCableSyncModal === 'function') closeCableSyncModal();
                    } else {
                        if (typeof showAlert === 'function') showAlert("PC rejected data transmission.");
                    }
                } catch (e) {
                    if (typeof showAlert === 'function') showAlert("Network transfer timeout.");
                    console.error(e);
                }
            };
        }
    }, 400); // هر نیم ثانیه منو را چک می‌کند تا به محض باز شدن، دکمه را تسخیر کند
})();
// ==========================================
// 🕵️‍♂️ ردیاب و شنودکننده اجباری کلیک روی دکمه دریافت
// ==========================================
(function vnsForceClickInception() {
    const bindInterval = setInterval(() => {
        // پیدا کردن دکمه بر اساس متن یا ساختار اتصالی آن در HTML شما
        const pullBtn = document.querySelector('button[onclick*="pullDatabaseFromPC"]') || 
                        document.getElementById('btn-pull-data');
        
        if (pullBtn) {
            clearInterval(bindInterval); // دکمه پیدا شد، توقف جستجو
            console.log("[VNS] Target Pull Button Hooked Successfully!");

            // تزریق مستقیم رویداد کلیک استاندارد در لایه جاوااسکریپت
            pullBtn.onclick = function(event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                // اجرای مستقیم خطایاب
                vnsExecuteDiagnosticPull();
            };
        }
    }, 500); // هر نیم ثانیه محیط را چک می‌کند تا دکمه رندر شود
})();

// ==========================================
// ????? ?????? ???? ?? ?????? ?? ?????? ???? ??? ????
// ==========================================
window.pullDatabaseFromPC = async function() {
    if (!scannedCableServerInfo) {
        if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t("err_scan_again") : "??????? ???? ????? ????? ????? ?????? ???? ????.");
        return;
    }

    try {
        const url = `http://${scannedCableServerInfo.ip}:${scannedCableServerInfo.port}/sync-pull`;
        const reqData = { token: scannedCableServerInfo.token };

        let isOk = false;
        let payloadData = null;
        
        // ????? ??????? ?? ??????
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

        // ??? ??????? ?? ?????? ?????? ??
        if (isOk && payloadData) {
            
            // ????? ???? ???? ??????? ??????
            let isVaultEmpty = false;
            try {
                const testObj = JSON.parse(payloadData);
                if (!testObj.masterUser || Object.keys(testObj.masterUser).length === 0) {
                    isVaultEmpty = true;
                }
            } catch(e) {}

            if (isVaultEmpty) {
                if (typeof showAlert === 'function') showAlert(typeof t === 'function' ? t("err_pc_vault_empty") : "??????? ?????? ???? ???.");
                return;
            }

            // ????? ????? ????? ???? ??????? ??? ?? ?? ???? ?????
            const appContainer = document.getElementById('app-container');
            const isLoggedIntoDashboard = appContainer && !appContainer.classList.contains('hidden');

            if (isLoggedIntoDashboard) {
                // ?. ????? ?????? ????? ???? ?? ????? ???? (???? ???? ?? ?? ????/??? ???? ???? ??????)
                try {
                    const payloadObj = JSON.parse(payloadData);
                    if (payloadObj.masterUser && payloadObj.encryptedData) {
                        localStorage.setItem('vns_master_user', JSON.stringify(payloadObj.masterUser));
                        localStorage.setItem('vns_vault_encrypted_db', JSON.stringify(payloadObj.encryptedData));
                    }
                    if (payloadObj.cardsData && Array.isArray(payloadObj.cardsData) && window.VNS_FEATURES && VNS_FEATURES.cards) {
                        let localCards = [];
                        try { localCards = JSON.parse(localStorage.getItem('vns_cards') || '[]'); } catch (e) {}
                        const map = new Map();
                        localCards.forEach(c => map.set(String(c.id), c));
                        payloadObj.cardsData.forEach(c => map.set(String(c.id), c));
                        const merged = Array.from(map.values());
                        localStorage.setItem('vns_cards', JSON.stringify(merged));
                        if (typeof mPaymentCards !== 'undefined') mPaymentCards = merged;
                        if (typeof mRenderCardsContainer === 'function') mRenderCardsContainer();
                    }
                    if (payloadObj.idDocsData && Array.isArray(payloadObj.idDocsData)) {
                        let localIds = [];
                        try { localIds = JSON.parse(localStorage.getItem('vns_id_docs') || '[]'); } catch (e) {}
                        const map = new Map();
                        localIds.forEach(d => map.set(String(d.id), d));
                        payloadObj.idDocsData.forEach(d => map.set(String(d.id), d));
                        const merged = Array.from(map.values());
                        localStorage.setItem('vns_id_docs', JSON.stringify(merged));
                        if (typeof mIdentityDocs !== 'undefined') mIdentityDocs = merged;
                        if (typeof mLoadIdDocsFromStorage === 'function') mLoadIdDocsFromStorage();
                        if (typeof mRenderIdDocsContainer === 'function') mRenderIdDocsContainer();
                    }
                } catch(e) {}

                // ?. ?? ???? ??? ????! ?????? ???? ?? ???? ?? ?? ? ??????? ???? ??
                if (typeof loadEncryptedDatabase === 'function') {
                    await loadEncryptedDatabase(); // ??? ???? ?? ???? ?????? renderList ?? ?? ??? ??????
                } else if (typeof renderList === 'function') {
                    renderList();
                }

                // ?. ????? ???? ??????????? ???? ??????
                if (typeof showVnsAlert === 'function') {
                    showVnsAlert("Success", "??????? ?? ?????? ?? ???????? ?????????? ??.", "success");
                } else if (typeof showAlert === 'function') {
                    showAlert("??????? ?? ?????? ?????????? ??.");
                }
            } else {
                // ??? ????? ?? ???? ???? (?????) ???
                const initTextarea = document.getElementById('init-import-string');
                if (initTextarea) {
                    initTextarea.value = payloadData;
                    if (typeof processInitImportPayload === 'function') processInitImportPayload();
                }
            }

            // ???? ????? ????? ??? ????
            if (typeof closeCableSyncModal === 'function') closeCableSyncModal();
            if (typeof closeWifiServerModal === 'function') closeWifiServerModal();
            
        } else {
            if (typeof showAlert === 'function') showAlert("?????? ?????? ???? ?? ?? ???.");
        }
    } catch (e) {
        if (typeof showAlert === 'function') showAlert("??? ?? ?????? ?? ????????.");
        console.error("Sync Pull Error: ", e);
    }
};
