import axios from 'axios';
import dotenv from 'dotenv';
import { handleSlackFAQ } from './services/slackAgent.js';
dotenv.config();

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

if (!SLACK_TOKEN || !SLACK_CHANNEL) {
  console.error('Missing SLACK_TOKEN or SLACK_CHANNEL in .env');
  process.exit(1);
}

// Keep track of processed messages to avoid duplicates
const processedMessages = new Set<string>();

// Poll Slack for new messages in the channel (simple polling for demo)
async function pollSlack() {
  console.log('🔍 Checking for new messages...');
  const url = `https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL}&limit=5`;
  const res = await axios.get(url, {
    headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }
  });
  if (!res.data.ok) {
    console.error('Slack API error:', res.data.error);
    return;
  }
  
  for (const msg of res.data.messages) {
    // Skip if already processed or if it's a bot message
    if (msg.text && !msg.bot_id && !processedMessages.has(msg.ts)) {
      processedMessages.add(msg.ts);
      console.log(`📩 New message: "${msg.text.substring(0, 50)}..."`);
      if (!SLACK_TOKEN || !SLACK_CHANNEL) {
        console.error('SLACK_TOKEN or SLACK_CHANNEL is not defined in environment variables.');
        continue;
      }
      await handleSlackFAQ({ token: SLACK_TOKEN, channel: SLACK_CHANNEL }, { text: msg.text, user: msg.user, ts: msg.ts });
    }
  }
}

// Continuous polling function
async function startPolling() {
  console.log('🤖 Slack agent started! Polling for messages every 5 seconds...');
  console.log(`📺 Monitoring channel: ${SLACK_CHANNEL}`);
  
  while (true) {
    try {
      await pollSlack();
    } catch (error) {
      console.error('Error during polling:', error);
    }
    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

(async () => {
  await startPolling();
})();
