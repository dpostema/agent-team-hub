// Test AI API
const https = require('https');

const data = JSON.stringify({
  model: 'qwen/qwen-2.5-72b-instruct',
  messages: [{role: 'user', content: 'Say hi in one sentence'}],
  max_tokens: 50
});

console.log('Testing Claude Haiku model...');

const req = https.request({
  hostname: 'openrouter.ai',
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Response:', body.substring(0, 800));
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
console.log('Request sent');
