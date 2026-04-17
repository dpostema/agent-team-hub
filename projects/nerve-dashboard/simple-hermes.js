// Hermes Bot - Backward-compatible wrapper
// Now powered by the config-driven agent factory
const { createAgent } = require('./agent-factory');

const agent = createAgent('hermes');
if (agent) {
  agent.start().catch(console.error);
}
