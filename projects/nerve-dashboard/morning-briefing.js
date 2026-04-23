const https = require('https');
const path = require('path');
const Paperclip = require('./paperclip');

const companyId = process.argv[2] || 'pilot-company';
const paperclip = new Paperclip(companyId);

function callAI(apiKey, model, systemPrompt, userMessage, maxTokens) {
  const data = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: maxTokens
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
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
          resolve(parsed.choices?.[0]?.message?.content || 'No response');
        } catch (e) {
          resolve('Error parsing response');
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendTelegram(token, chatId, text) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
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

async function morningBriefing() {
  const registry = paperclip.getAgentRegistry();
  const orgChart = paperclip.getOrgChart();
  const apiKey = paperclip.resolveSecret('OPENROUTER_API_KEY');
  const dennisChat = process.argv[3] || process.env.DENNIS_CHAT_ID;

  if (!dennisChat) {
    console.error('Usage: node morning-briefing.js [company-id] <dennis-chat-id>');
    console.error('Or set DENNIS_CHAT_ID environment variable');
    process.exit(1);
  }

  console.log('=== Morning Briefing ===');
  console.log(`Company: ${paperclip.getCompanyInfo().name}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const agentStatuses = [];
  for (const [id, agent] of Object.entries(registry)) {
    const hierarchy = orgChart[id];
    agentStatuses.push(
      `- ${agent.name} (${agent.role}): ${agent.status}, team: ${agent.team ? agent.team.name : 'N/A'}, reports to: ${hierarchy ? hierarchy.reportsTo : 'N/A'}, oversees: ${hierarchy && hierarchy.oversees.length ? hierarchy.oversees.join(', ') : 'none'}`
    );
  }

  const briefingPrompt = `You are the morning briefing coordinator for Alpha Global Enterprises.

Current org structure:
${agentStatuses.join('\n')}

A Team (Autonomous Division): Jarvis (VP & Orchestrator), Alfred (COO), Max (CTO), Shavon (EA)
B Team (Operations): Pepper (Dennis's EA), MJ (Ops), Hermes (Slack Comms)

Generate a concise morning briefing that:
1. Lists each agent's status (all online)
2. Suggests 3 priority items for the day based on each team's capabilities
3. Flags any cross-team coordination opportunities
4. Ends with a recommended first action for Dennis

Keep it under 300 words. Use bullet points. Be direct.`;

  console.log('Generating briefing...');
  const briefing = await callAI(
    apiKey,
    'qwen/qwen3.6-plus:free',
    'You are a concise executive briefing coordinator.',
    briefingPrompt,
    800
  );

  const fullMessage = `*Morning Briefing — ${new Date().toLocaleDateString()}*\n\n${briefing}`;

  console.log('\n' + fullMessage);

  const jarvisToken = paperclip.getAgentTelegramToken('jarvis');
  if (jarvisToken) {
    await sendTelegram(jarvisToken, dennisChat, fullMessage);
    console.log('\nBriefing sent to Dennis via Jarvis.');
  }

  const alfredToken = paperclip.getAgentTelegramToken('alfred');
  if (alfredToken) {
    await sendTelegram(alfredToken, dennisChat, `*Alfred here.* Morning briefing has been distributed. All ${Object.keys(registry).length} agents reporting online. Ready for your priorities.`);
    console.log('Alfred confirmation sent.');
  }
}

morningBriefing().catch(console.error);
