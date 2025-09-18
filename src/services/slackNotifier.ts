import axios from 'axios';

export interface SlackConfig {
  token: string;
  channel: string;
}

export async function sendSlackNotification(config: SlackConfig, message: string) {
  const url = 'https://slack.com/api/chat.postMessage';
  try {
    const response = await axios.post(url, {
      channel: config.channel,
      text: message,
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      }
    });
    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }
    return response.data;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
}
