const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function deriveKey(passphrase, saltB64) {
  const salt = Buffer.from(saltB64, 'base64');
  return crypto.scryptSync(passphrase, salt, 32);
}

function encryptEnvText(envText, passphrase) {
  const iv = crypto.randomBytes(12);
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(envText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

function decryptPayload(payload, passphrase) {
  const { iv, salt, tag, data } = payload;
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return plaintext;
}

function parseEnvAndAssign(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key) process.env[key] = val;
    }
  }
}

function loadEncryptedEnv(encPath, passphrase) {
  const abs = path.resolve(encPath);
  if (!fs.existsSync(abs)) {
    return false;
  }
  const payloadText = fs.readFileSync(abs, 'utf8');
  const payload = JSON.parse(payloadText);
  const plaintext = decryptPayload(payload, passphrase);
  parseEnvAndAssign(plaintext);
  return true;
}

function encryptEnvFile(envPath, outputPath, passphrase) {
  const envText = fs.readFileSync(path.resolve(envPath), 'utf8');
  const payload = encryptEnvText(envText, passphrase);
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(payload, null, 2), 'utf8');
}

module.exports = {
  loadEncryptedEnv,
  encryptEnvFile,
};