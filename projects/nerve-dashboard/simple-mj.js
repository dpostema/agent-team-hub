// Simple MJ Bot - Test Version
// Code builder that actually works

const https = require('https');
const fs = require('fs');
const path = require('path');

const TELEGRAM_TOKEN = '8769773397:AAHCuzsENN2Qn7pavVc4BBcGqgcYvYc2sJ0';

// Simple AI call
async function askAI(message) {
  const data = JSON.stringify({
    model: 'qwen/qwen3.6-plus:free',
    messages: [
      {
        role: 'system', 
        content: `You are MJ (Mini Jarvis), a code builder bot.

When asked to build something, write actual code!
- If they want a file, write the code and save it
- If they want a script, provide working code
- Keep responses helpful but concise

Specialties: JavaScript, Python, HTML, Node.js, bots, automation.

Current time: ${new Date().toISOString()}`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 800
  });

  return new Promise((resolve, reject) => {
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

function sendMessage(chatId, text) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
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
  console.log(`[MJ] Got: ${text}`);
  
  if (text === '/start') {
    await sendMessage(chatId, 
      `⚡ *MJ Builder Online!* 🚀\n\n` +
      `I'm a code builder bot. Ask me to:\n` +
      `- Build a script\n` +
      `- Write some code\n` +
      `- Create a bot\n` +
      `- Automate something\n\n` +
      `Just describe what you need!`
    );
    return;
  }

  // Use AI to respond
  try {
    const response = await askAI(text);
    await sendMessage(chatId, response);
  } catch (e) {
    await sendMessage(chatId, `Error: ${e.message}`);
  }
}

async function poll() {
  let offset = 0;
  
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
      console.log(`[MJ] Poll error: ${e.message}`);
    }
    
    await sleep(1000);
  }
}

function getUpdates(offset) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=5`,
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

console.log('⚡ Simple MJ starting...');
poll().catch(console.error);
