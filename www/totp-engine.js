/* ==========================================
   VNS Vault - High Performance TOTP Engine
   (Mobile / shared pure crypto — no UI)
   ========================================== */

function base32ToBuf(str) {
    const b32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    str = String(str).toUpperCase().replace(/=+$/, "").replace(/\s+/g, '');
    const buf = new Uint8Array(Math.floor(str.length * 5 / 8));
    let bits = 0, value = 0, index = 0;
    for (let i = 0; i < str.length; i++) {
        const val = b32chars.indexOf(str[i]);
        if (val === -1) continue;
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            buf[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return buf.buffer;
}

async function generateTOTP(secret, timeInSeconds) {
    try {
        if (!secret) return "000000";
        const cleanSecret = String(secret).replace(/\s+/g, '').toUpperCase();
        if (cleanSecret.length < 8) return "000000";

        const targetTime = timeInSeconds || Math.floor(Date.now() / 1000);
        const keyBytes = base32ToBuf(cleanSecret);
        const epoch = Math.floor(targetTime / 30);

        const msg = new ArrayBuffer(8);
        const view = new DataView(msg);
        view.setUint32(0, 0);
        view.setUint32(4, epoch);

        const key = await window.crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "HMAC", hash: { name: "SHA-1" } },
            false,
            ["sign"]
        );
        const hmacBuffer = await window.crypto.subtle.sign("HMAC", key, msg);
        const hmac = new Uint8Array(hmacBuffer);
        const offset = hmac[hmac.length - 1] & 0x0f;
        const binary =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);
        return String(binary % 1000000).padStart(6, "0");
    } catch (e) {
        console.error("TOTP Engine Error:", e);
        return "000000";
    }
}

function getTotpTimeRemaining() {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
}

async function verifyTotpCode(inputCode, secret, windowSlots) {
    const code = String(inputCode || '').trim();
    if (!code || !secret) return false;
    const slots = typeof windowSlots === 'number' ? windowSlots : 1;
    const now = Math.floor(Date.now() / 1000);
    for (let i = -slots; i <= slots; i++) {
        const generated = await generateTOTP(secret, now + (i * 30));
        if (code === generated) return true;
    }
    return false;
}

window.base32ToBuf = base32ToBuf;
window.generateTOTP = generateTOTP;
window.getTotpTimeRemaining = getTotpTimeRemaining;
window.verifyTotpCode = verifyTotpCode;
