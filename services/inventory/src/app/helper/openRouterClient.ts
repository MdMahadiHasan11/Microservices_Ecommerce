import config from "../../config";
import axios from 'axios';

export const askOpenRouter = async (messages: any[]) => {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-3.5-turbo', // or 'anthropic/claude-3-haiku'
      messages,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
};
