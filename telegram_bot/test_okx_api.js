const crypto = require('crypto');

const OKX_SECRET_KEY = 'AEF9198224AA9058717603EF3B124133'; // Ваш секретный ключ из .env
const ts = new Date().toISOString(); // Текущая метка времени в формате ISO
const method = 'GET';
const requestPath = '/api/v5/account/balance?ccy=USDT';
const body = '';

const signature = crypto
  .createHmac('sha256', OKX_SECRET_KEY)
  .update(ts + method + requestPath + body)
  .digest('base64');

console.log('Timestamp:', ts);
console.log('Signature:', signature);
console.log('Curl command:');
console.log(`curl -X GET "https://www.okx.com/api/v5/account/balance?ccy=USDT" \\`);
console.log(`  -H "OK-ACCESS-KEY: 1382f00c-b1bf-4fcf-aeab-47cae45df970" \\`);
console.log(`  -H "OK-ACCESS-SIGN: ${signature}" \\`);
console.log(`  -H "OK-ACCESS-TIMESTAMP: ${ts}" \\`);
console.log(`  -H "OK-ACCESS-PASSPHRASE: Kostya_1790"`);