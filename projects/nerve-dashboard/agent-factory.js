const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_BASE = process.env.CONFIG_PATH || path.join(__dirname, '..', '..', 'shared', 'configs');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadSecrets() {
  const secretsPath = path.join(CONFIG_BASE, 'secrets.local.json');
  if (!fs.existsSync(secretsPath)) {
    console.error(`Missing secrets file: ${secretsPath}`);
    console.error(`Copy secrets.example.json to secrets.local.json and fill in your values.`);
    process.exit(1);
  }
  return loadJSON(secretsPath);
}

function loadAgentConfig(agentId) {
  const configPath = path.join(CONFIG_BASE, 'agents', `${agentId}.json`);
  return loadJSON(configPath);
}

function resolveRef(ref, secrets) {
  if (!ref) return null;
  const value = secrets[ref];
  if (!value) {
    throw new Error(`Secret "${ref}" not found in secrets.local.json`);
  }
  return value;
}

function interpolateTemplate(template, config) {
  return template
    .replace(/\{\{TIMESTAMP\}\}/g, new Date().toISOString())
    .replace(/\{\{MODEL\}\}/g, config.ai ? config.ai.model : 'N/A')
    .replace(/\{\{NAME\}\}/g, config.name);
}

const PROVIDERS = {
  openrouter: { hostname: 'openrouter.ai', path: '/api/v1/chat/completions' },
  minimax: { hostname: 'api.minimax.chat', path: '/v1/text/chatcompletion_v2' }
};

function createAgent(agentId) {
  const config = loadAgentConfig(agentId);
  const secrets = loadSecrets();

  if (config.supervisorOnly) {
    console.log(`[${config.name}] Supervisor-only agent — no bot process to start.`);
    return null;
  }

  if (!config.ai) {
    throw new Error(`Agent "${agentId}" has no AI configuration`);
  }

  const telegramToken = resolveRef(config.telegram.tokenRef, secrets);
  const apiKey = resolveRef(config.ai.apiKeyRef, secrets);
  const provider = PROVIDERS[config.ai.provider] || PROVIDERS.openrouter;

  function askAI(message) {
    const systemPrompt = interpolateTemplate(config.ai.systemPrompt, config);
    const data = JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: config.ai.maxTokens
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: provider.hostname,
        path: provider.path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.choices?.[0]?.message?.content) {
              resolve(parsed.choices[0].message.content);
            } else {
              console.log(`[${config.name}] AI response issue:`, JSON.stringify(parsed).slice(0, 300));
              resolve(parsed.error?.message || 'No response from AI');
            }
          } catch (e) {
            console.log(`[${config.name}] Raw response:`, body.slice(0, 300));
            resolve('Error parsing response');
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  function sendMessage(chatId, text) {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${telegramToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, () => resolve());
      req.on('error', () => resolve());
      req.write(data);
      req.end();
    });
  }

  async function handleMessage(chatId, text) {
    console.log(`[${config.name}] Got: ${text}`);

    if (config.commands && config.commands[text]) {
      const cmd = config.commands[text];
      const message = interpolateTemplate(cmd.message, config);
      await sendMessage(chatId, message);
      return;
    }

    try {
      const response = await askAI(text);
      await sendMessage(chatId, response);
    } catch (e) {
      await sendMessage(chatId, `Error: ${e.message}`);
    }
  }

  function getUpdates(offset) {
    const timeout = config.polling ? config.polling.timeoutSec : 5;
    return new Promise((resolve, reject) => {
      https.get(
        `https://api.telegram.org/bot${telegramToken}/getUpdates?offset=${offset}&timeout=${timeout}`,
        (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(e); }
          });
        }
      ).on('error', reject);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function start() {
    const interval = config.polling ? config.polling.intervalMs : 1000;
    let offset = 0;

    console.log(`[${config.name}] Starting agent (${config.role})...`);
    console.log(`[${config.name}] Telegram: ${config.telegram.botUsername}`);
    console.log(`[${config.name}] AI Model: ${config.ai.model}`);

    while (true) {
      try {
        const updates = await getUpdates(offset);

        if (updates.ok && updates.result) {
          for (const update of updates.result) {
            if (update.message?.text) {
              await handleMessage(update.message.chat.id, update.message.text);
              offset = update.update_id + 1;
            }
          }
        }
      } catch (e) {
        console.log(`[${config.name}] Poll error: ${e.message}`);
      }

      await sleep(interval);
    }
  }

  return { config, start };
}

if (require.main === module) {
  const agentId = process.argv[2];
  if (!agentId) {
    console.error('Usage: node agent-factory.js <agent-id>');
    console.error('Example: node agent-factory.js hermes');
    const agentsDir = path.join(CONFIG_BASE, 'agents');
    if (fs.existsSync(agentsDir)) {
      const available = fs.readdirSync(agentsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      console.error(`Available agents: ${available.join(', ')}`);
    }
    process.exit(1);
  }

  const agent = createAgent(agentId);
  if (agent) {
    agent.start().catch(console.error);
  }
}

module.exports = { createAgent, loadAgentConfig, loadSecrets, resolveRef, CONFIG_BASE };
