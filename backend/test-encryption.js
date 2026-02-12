import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.AGENT_KEY_ENCRYPTION_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    console.error('❌ Error: AGENT_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)');
    console.error(`Current value length: ${ENCRYPTION_KEY ? ENCRYPTION_KEY.length : 0}`);
    process.exit(1);
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

function encryptPrivateKey(privateKey) {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
    let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decryptPrivateKey(encryptedKey) {
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted key format');
    }
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return `0x${decrypted}`;
}

// Test encryption
console.log('🔐 Testing encryption...');
const testKey = '0x' + crypto.randomBytes(32).toString('hex');
console.log(`Test key: ${testKey.substring(0, 20)}...`);

const encrypted = encryptPrivateKey(testKey);
console.log(`Encrypted: ${encrypted.substring(0, 40)}...`);

const decrypted = decryptPrivateKey(encrypted);
console.log(`Decrypted: ${decrypted.substring(0, 20)}...`);

if (testKey === decrypted) {
    console.log('✅ Encryption test passed!');
    console.log('✅ Agent wallet encryption is working correctly');
    process.exit(0);
} else {
    console.error('❌ Encryption test failed!');
    console.error('Original and decrypted keys do not match');
    process.exit(1);
}
