import crypto from 'crypto';

/**
 * Encryption utilities for securing agent private keys
 * Uses AES-256-CBC encryption
 */

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.AGENT_KEY_ENCRYPTION_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('AGENT_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)');
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypt a private key for secure storage
 * @param privateKey - The private key to encrypt (with or without 0x prefix)
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encryptPrivateKey(privateKey) {
    try {
        // Remove 0x prefix if present
        const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

        // Generate random initialization vector
        const iv = crypto.randomBytes(16);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

        // Encrypt the private key
        let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Return IV and encrypted data separated by colon
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt private key');
    }
}

/**
 * Decrypt a private key from storage
 * @param encryptedKey - Encrypted string in format: iv:encryptedData
 * @returns Decrypted private key with 0x prefix
 */
export function decryptPrivateKey(encryptedKey) {
    try {
        // Split IV and encrypted data
        const parts = encryptedKey.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted key format');
        }

        const [ivHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);

        // Decrypt
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Return with 0x prefix
        return `0x${decrypted}`;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt private key');
    }
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once and store the result in your .env file
 */
export function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that encryption/decryption works correctly
 */
export function testEncryption() {
    const testKey = '0x' + crypto.randomBytes(32).toString('hex');
    const encrypted = encryptPrivateKey(testKey);
    const decrypted = decryptPrivateKey(encrypted);

    if (testKey !== decrypted) {
        throw new Error('Encryption test failed!');
    }

    console.log('✅ Encryption test passed');
    return true;
}
