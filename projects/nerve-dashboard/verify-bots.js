const https = require('https');
const path = require('path');
const fs = require('fs');

const CONFIG_BASE = process.env.CONFIG_PATH || path.join(__dirname, '..', '..', 'shared', 'configs');

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function checkBot(name, token) {
  return new Promise((resolve) => {
    if (!token || token.startsWith('your-')) {
      resolve({ name, ok: false, error: 'Token not set (still placeholder)' });
      return;
    }
    https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.ok) {
            resolve({ name, ok: true, username: '@' + data.result.username, botName: data.result.first_name });
          } else {
            resolve({ name, ok: false, error: data.description || 'Invalid token' });
          }
        } catch (e) {
          resolve({ name, ok: false, error: 'Bad response from Telegram' });
        }
      });
    }).on('error', (e) => {
      resolve({ name, ok: false, error: e.message });
    });
  });
}

async function main() {
  const secretsPath = path.join(CONFIG_BASE, 'secrets.local.json');
  if (!fs.existsSync(secretsPath)) {
    console.error('Missing: ' + secretsPath);
    console.error('Copy secrets.example.json to secrets.local.json and fill in your tokens.');
    process.exit(1);
  }

  const secrets = loadJSON(secretsPath);
  const agentsDir = path.join(CONFIG_BASE, 'agents');
  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.json'));

  console.log('=== Bot Token Verification ===\n');

  const checks = [];
  for (const file of agentFiles) {
    const config = loadJSON(path.join(agentsDir, file));
    const tokenRef = config.telegram && config.telegram.tokenRef;
    if (!tokenRef) continue;
    const token = secrets[tokenRef];
    checks.push(checkBot(config.name + ' (' + tokenRef + ')', token));
  }

  // Also check OpenRouter
  const apiKey = secrets['OPENROUTER_API_KEY'];
  if (!apiKey || apiKey.startsWith('your-')) {
    checks.push(Promise.resolve({ name: 'OpenRouter API Key', ok: false, error: 'Not set (still placeholder)' }));
  } else {
    checks.push(new Promise((resolve) => {
      const data = JSON.stringify({ model: 'qwen/qwen3.6-plus:free', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 });
      const req = https.request({
        hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const r = JSON.parse(body);
            if (r.choices) resolve({ name: 'OpenRouter API Key', ok: true, username: 'connected', botName: r.model || 'ok' });
            else resolve({ name: 'OpenRouter API Key', ok: false, error: r.error?.message || 'Auth failed' });
          } catch (e) { resolve({ name: 'OpenRouter API Key', ok: false, error: 'Bad response' }); }
        });
      });
      req.on('error', (e) => resolve({ name: 'OpenRouter API Key', ok: false, error: e.message }));
      req.write(data);
      req.end();
    }));
  }

  const results = await Promise.all(checks);

  let allGood = true;
  for (const r of results) {
    if (r.ok) {
      console.log('  OK  ' + r.name + ' -> ' + r.botName + ' ' + (r.username || ''));
    } else {
      console.log('  FAIL  ' + r.name + ' -> ' + r.error);
      allGood = false;
    }
  }

  console.log('');
  if (allGood) {
    console.log('All checks passed! All bots and API key are valid.');
  } else {
    console.log('Some checks failed. Fix the issues above in secrets.local.json');
  }
}

main();
