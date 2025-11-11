const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { encryptEnvFile } = require('../secureEnv');

async function prompt(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const envPath = path.resolve('.env');
  const outPath = path.resolve('.env.enc');
  if (!fs.existsSync(envPath)) {
    console.error('No .env found at project root. Create it before encrypting.');
    process.exit(1);
  }
  const pass1 = await prompt('Enter passphrase for .env encryption: ');
  const pass2 = await prompt('Confirm passphrase: ');
  if (!pass1 || pass1 !== pass2) {
    console.error('Passphrases do not match or are empty. Aborting.');
    process.exit(1);
  }
  encryptEnvFile(envPath, outPath, pass1);
  console.log(`Encrypted .env written to ${outPath}`);
  console.log('Important: remove or ignore the plaintext .env before sharing.');
}

main().catch((e) => {
  console.error('Failed to encrypt .env:', e);
  process.exit(1);
});