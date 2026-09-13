# VNS Vault

**Offline password manager for Android** (F-Droid version)

VNS Vault is a fully offline password manager that stores your credentials, payment cards, identity documents, and 2FA codes securely on your device. It does not require internet permission and never sends your data anywhere.

## Features

- **Fully offline** – No internet permission
- **Strong encryption** – AES-GCM with PBKDF2 key derivation
- **Biometric unlock** – Fingerprint / Face unlock support
- **TOTP / 2FA** – Built-in authenticator
- **Payment cards** – Secure storage for credit/debit cards
- **ID & Passport** – Store identity documents
- **Android Autofill** – Fill credentials in other apps
- **Credential Provider** – Modern Android credential support
- **Multi-language** – English, Persian, Arabic, Chinese

## Privacy

- No analytics
- No tracking
- No internet access
- All data stays on your device

## License

This project is released under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

Third-party libraries and their licenses are listed in the [NOTICE](NOTICE) file.

## Build Instructions

### Requirements

- Node.js 18 or newer
- Android Studio (or Android SDK + JDK 17)
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/rezahamid49/vns-vault-fdroid.git
cd vns-vault-fdroid

# 2. Install dependencies
npm install

# 3. Sync Capacitor
npx cap sync android

# 4. Open in Android Studio (optional)
npx cap open android

# 5. Build the release APK (command line)
cd android
./gradlew assembleFdroidRelease