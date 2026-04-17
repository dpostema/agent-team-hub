const fs = require('fs');
const path = require('path');

const CONFIG_BASE = process.env.CONFIG_PATH || path.join(__dirname, '..', 'configs');

const TEMPLATE = {
  id: '',
  name: '',
  version: '1.0.0',
  role: '',
  description: '',
  color: '#667eea',
  telegram: {
    botUsername: '',
    tokenRef: ''
  },
  ai: {
    provider: 'openrouter',
    model: 'qwen/qwen3.6-plus:free',
    apiKeyRef: 'OPENROUTER_API_KEY',
    maxTokens: 500,
    systemPrompt: 'You are {{NAME}}. Keep responses SHORT (under 100 words).\nWhen asked to do something, actually try to help.\nCurrent time: {{TIMESTAMP}}'
  },
  capabilities: [],
  commands: {
    '/start': {
      type: 'greeting',
      message: '*{{NAME}} Online!*\n\nI am ready to assist. Ask me anything!'
    },
    '/help': {
      type: 'help',
      message: '*Commands:*\n/start - Start\n/help - This\n/status - Check status\n\nOr just chat with me!'
    },
    '/status': {
      type: 'status',
      message: '*{{NAME}} Status*\n\nBot: Running\nAI: {{MODEL}}\nTime: {{TIMESTAMP}}'
    }
  },
  data: {
    pathRef: '',
    projectsFile: 'projects.json'
  },
  polling: {
    intervalMs: 1000,
    timeoutSec: 5
  }
};

function createAgentConfig(agentId, options = {}) {
  const config = JSON.parse(JSON.stringify(TEMPLATE));

  config.id = agentId;
  config.name = options.name || agentId.charAt(0).toUpperCase() + agentId.slice(1);
  config.role = options.role || 'Agent';
  config.description = options.description || '';
  config.color = options.color || '#667eea';

  if (options.botUsername) {
    config.telegram.botUsername = options.botUsername;
    config.telegram.tokenRef = `${agentId.toUpperCase()}_TELEGRAM_TOKEN`;
  }

  if (options.capabilities) {
    config.capabilities = options.capabilities;
  }

  if (options.maxTokens) {
    config.ai.maxTokens = options.maxTokens;
  }

  if (options.systemPrompt) {
    config.ai.systemPrompt = options.systemPrompt;
  }

  if (options.dataPathRef) {
    config.data.pathRef = options.dataPathRef;
  } else {
    config.data.pathRef = `${agentId.toUpperCase()}_DATA_PATH`;
  }

  const outputPath = path.join(CONFIG_BASE, 'agents', `${agentId}.json`);

  if (fs.existsSync(outputPath) && !options.force) {
    console.error(`Agent config already exists: ${outputPath}`);
    console.error('Use --force to overwrite.');
    process.exit(1);
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`Agent config created: ${outputPath}`);

  return config;
}

function addToCompany(companyId, agentId) {
  const companyPath = path.join(CONFIG_BASE, 'companies', `${companyId}.json`);
  if (!fs.existsSync(companyPath)) {
    console.error(`Company config not found: ${companyPath}`);
    return false;
  }

  const company = JSON.parse(fs.readFileSync(companyPath, 'utf8'));
  if (!company.agents.includes(agentId)) {
    company.agents.push(agentId);
    fs.writeFileSync(companyPath, JSON.stringify(company, null, 2) + '\n');
    console.log(`Added "${agentId}" to company "${companyId}"`);
  } else {
    console.log(`Agent "${agentId}" already in company "${companyId}"`);
  }
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node create-agent-config.js <agent-id> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --name <name>          Display name');
    console.log('  --role <role>          Agent role');
    console.log('  --bot <username>       Telegram bot username');
    console.log('  --color <hex>          Agent color (e.g. #FF6B6B)');
    console.log('  --company <id>         Add to company after creation');
    console.log('  --force                Overwrite existing config');
    console.log('');
    console.log('Example:');
    console.log('  node create-agent-config.js analyst --name "Analyst" --role "Data Analysis" --bot "@AnalystBot" --company pilot-company');
    process.exit(0);
  }

  const agentId = args[0];
  const options = { force: args.includes('--force') };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--name': options.name = args[++i]; break;
      case '--role': options.role = args[++i]; break;
      case '--bot': options.botUsername = args[++i]; break;
      case '--color': options.color = args[++i]; break;
      case '--company': options.company = args[++i]; break;
    }
  }

  createAgentConfig(agentId, options);

  if (options.company) {
    addToCompany(options.company, agentId);
  }

  console.log('\nNext steps:');
  console.log(`  1. Edit shared/configs/agents/${agentId}.json to customize`);
  console.log(`  2. Add Telegram token to shared/configs/secrets.local.json`);
  console.log(`  3. Start: node projects/nerve-dashboard/agent-factory.js ${agentId}`);
}

module.exports = { createAgentConfig, addToCompany };
