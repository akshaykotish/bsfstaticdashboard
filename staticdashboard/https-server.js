const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Create self-signed certificate if not exists
const crypto = require('crypto');
const forge = require('node-forge');

function generateCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);
  
  const attrs = [{
    name: 'commonName',
    value: 'dashboard.bsf'
  }, {
    name: 'organizationName',
    value: 'BSF'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);
  
  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert)
  };
}

// Check if cert files exist, if not create them
let key, cert;
if (!fs.existsSync('server.key') || !fs.existsSync('server.cert')) {
  console.log('Generating SSL certificate...');
  const generated = generateCert();
  fs.writeFileSync('server.key', generated.key);
  fs.writeFileSync('server.cert', generated.cert);
  key = generated.key;
  cert = generated.cert;
} else {
  key = fs.readFileSync('server.key');
  cert = fs.readFileSync('server.cert');
}

const app = express();
app.use(express.static('build'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = https.createServer({ key, cert }, app);

server.listen(443, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('   BSF DASHBOARD - HTTPS RUNNING');
  console.log('========================================');
  console.log('\nAccess at: https://dashboard.bsf');
  console.log('\nNote: Browser will show security warning.');
  console.log('Click "Advanced" and "Proceed to dashboard.bsf"');
  console.log('\n========================================\n');
});
