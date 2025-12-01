import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || '12022';

export const encryptId = (id) => {
    if (!id) return '';
    return CryptoJS.AES.encrypt(id.toString(), ENCRYPTION_KEY).toString()
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

export const decryptId = (encoded) => {
    if (!encoded) return null;
    try {
        const normalized = encoded
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const bytes = CryptoJS.AES.decrypt(normalized, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        return parseInt(decrypted, 10);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}; 