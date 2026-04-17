const fs = require('fs');
const path = require('path');

const CONFIG_BASE = process.env.CONFIG_PATH || path.join(__dirname, '..', '..', 'shared', 'configs');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

class Paperclip {
  constructor(companyId) {
    this.companyId = companyId;
    this.company = null;
    this.agentConfigs = {};
    this.secrets = null;
    this.load();
  }

  load() {
    const companyPath = path.join(CONFIG_BASE, 'companies', `${this.companyId}.json`);
    this.company = loadJSON(companyPath);

    const secretsPath = path.join(CONFIG_BASE, 'secrets.local.json');
    if (fs.existsSync(secretsPath)) {
      this.secrets = loadJSON(secretsPath);
    } else {
      console.warn(`[Paperclip] No secrets.local.json found — token resolution will fail`);
      this.secrets = {};
    }

    for (const agentId of this.company.agents) {
      const agentPath = path.join(CONFIG_BASE, 'agents', `${agentId}.json`);
      this.agentConfigs[agentId] = loadJSON(agentPath);
    }

    console.log(`[Paperclip] Loaded company "${this.company.name}" with ${this.company.agents.length} agents`);
  }

  getCompanyInfo() {
    return {
      id: this.company.id,
      name: this.company.name,
      description: this.company.description,
      namespace: this.company.namespace,
      agentCount: this.company.agents.length,
      paperclip: this.company.paperclip,
      dashboard: this.company.dashboard
    };
  }

  resolveSecret(ref) {
    if (!ref) return null;
    return this.secrets[ref] || null;
  }

  getAgentConfig(agentId) {
    return this.agentConfigs[agentId] || null;
  }

  getAgentRegistry() {
    const registry = {};
    for (const [agentId, config] of Object.entries(this.agentConfigs)) {
      const dataPath = config.data && config.data.pathRef
        ? this.resolveSecret(config.data.pathRef)
        : null;

      registry[agentId] = {
        name: config.name,
        status: config.supervisorOnly ? 'online' : 'running',
        bot: config.telegram ? config.telegram.botUsername : null,
        capabilities: config.capabilities,
        color: config.color,
        role: config.role,
        projects: this.loadAgentProjects(agentId, dataPath),
        ...(config.data && config.data.memoryFile
          ? { memory: this.loadAgentMemory(agentId, dataPath) }
          : {})
      };
    }
    return registry;
  }

  loadAgentProjects(agentId, dataPath) {
    if (!dataPath) return {};
    const config = this.agentConfigs[agentId];
    if (!config || !config.data || !config.data.projectsFile) return {};

    const filePath = path.join(dataPath, config.data.projectsFile);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`[Paperclip] Failed to load projects for ${agentId}: ${e.message}`);
      }
    }
    return {};
  }

  loadAgentMemory(agentId, dataPath) {
    if (!dataPath) return {};
    const config = this.agentConfigs[agentId];
    if (!config || !config.data || !config.data.memoryFile) return {};

    const filePath = path.join(dataPath, config.data.memoryFile);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`[Paperclip] Failed to load memory for ${agentId}: ${e.message}`);
      }
    }
    return {};
  }

  getAgentTelegramToken(agentId) {
    const config = this.agentConfigs[agentId];
    if (!config || !config.telegram || !config.telegram.tokenRef) return null;
    return this.resolveSecret(config.telegram.tokenRef);
  }

  getDashboardData() {
    return {
      company: this.getCompanyInfo(),
      agents: this.getAgentRegistry(),
      tasks: [],
      messages: []
    };
  }

  listAgentIds() {
    return Object.keys(this.agentConfigs);
  }

  listBotAgents() {
    return Object.entries(this.agentConfigs)
      .filter(([, config]) => !config.supervisorOnly)
      .map(([id]) => id);
  }
}

if (require.main === module) {
  const companyId = process.argv[2] || 'pilot-company';
  console.log(`\nValidating company: ${companyId}\n`);

  try {
    const paperclip = new Paperclip(companyId);
    const info = paperclip.getCompanyInfo();
    console.log('Company:', info.name);
    console.log('Namespace:', info.namespace);
    console.log('Agents:', paperclip.listAgentIds().join(', '));
    console.log('Bot agents:', paperclip.listBotAgents().join(', '));
    console.log('\nAgent Registry:');
    const registry = paperclip.getAgentRegistry();
    for (const [id, agent] of Object.entries(registry)) {
      console.log(`  ${id}: ${agent.name} (${agent.role}) [${agent.status}] — ${agent.capabilities.join(', ')}`);
    }
    console.log('\nValidation passed.');
  } catch (e) {
    console.error(`Validation failed: ${e.message}`);
    process.exit(1);
  }
}

module.exports = Paperclip;
