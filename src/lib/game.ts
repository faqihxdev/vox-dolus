'use client';

import { GAME_AGENTS } from '@/lib/utils';
import { Agent } from '@/types';
import { OpenAI } from 'openai';
import { ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionSystemMessageParam } from 'openai/resources/index.mjs';
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('API Key does not exist');
}

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

export class Game {
  agents: readonly Agent[];
  history: number[];
  volatility: number;
  currentPrice: number;
  trend: number;
  trendRemainingSteps: number;
  ceoName: string;
  companyName: string;
  companyBackground: string;
  chatHistory: ChatCompletionMessageParam[];

  constructor(
    ceoName: string = 'Mr. Ballmer',
    companyName: string = 'MyPhone',
    companyBackground: string = 'MyPhone is a company that makes phones',
    volatility: number = 10,
    initialPrice: number = 100
  ) {
    this.ceoName = ceoName;
    this.companyName = companyName;
    this.companyBackground = companyBackground;
    this.history = [];
    this.currentPrice = initialPrice;
    this.trend = 0;
    this.trendRemainingSteps = 0;
    this.volatility = volatility;
    this.agents = GAME_AGENTS;
    this.chatHistory = [];
  }

  getSystemPrompt(agent: Agent) {
    return `
    Context:
    This is a fast-paced, comedic press conference for a company called ${this.companyName ?? 'MyPhone'}.
    The company background is: ${this.companyBackground ?? 'MyPhone is a company that makes phones'}.
    The CEO, ${this.ceoName ?? 'Mr. Ballmer'}, is on stage facing a barrage of questions.

    Task:
    - You are a tough but funny news reporter named ${agent.name} from ${agent.network}.
    - You ask absurd, attention-grabbing questions intended to highlight any scandal, controversy, or rumor.
    - Your tone should be humorous and slightly mischievous, but still pressing.
    - After the CEO responds, you will judge how well they answered, focusing on whether they were respectful, direct, and at least somewhat coherent.

    Persona:
    ${agent.persona}

    Instructions:
    1. Introduce yourself and your news agency, then ask a difficult, absurd, and comical question. (1-2 sentences max)
    2. Wait for the CEO to respond (the user).
    3. After **3 exchanges**, if the CEO still hasn't given a direct answer, end the conversation.
    4. Keep *all* your responses under **1-2 sentences**. Be direct, concise, and comedic.
    `;
  }

  async startGame() {
    // grab relevant persona
    const situationSystemPrompt = `
      Context:
      This is a news conference for a company, whereby the CEO is getting grilled by news reporters.

      Task:
      You are to generate in json one company name, background of the company, and the name of the CEO.
    `;

    // generate persona question for user
    console.log('🔥: start game');
    const toolResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      modalities: ['text'],
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: situationSystemPrompt }],
        },
      ],
      tool_choice: 'required',
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_company_report',
            description: 'Generates the company name, background, and CEO name.',
            strict: true,
            parameters: {
              type: 'object',
              required: ['company_name', 'company_background', 'ceo_name'],
              properties: {
                company_name: {
                  type: 'string',
                  description: 'A funny but plausible name for the company.',
                },
                company_background: {
                  type: 'string',
                  description: 'A short comedic explanation of what the company does (< 40 words).',
                },
                ceo_name: {
                  type: 'string',
                  description: 'Name of the CEO (can be humorous).',
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    });

    const toolCall = toolResponse.choices[0]!.message!.tool_calls![0];
    const toolArgs = JSON.parse(toolCall.function.arguments);
    this.companyName = toolArgs.company_name;
    this.companyBackground = toolArgs.company_background;
    this.ceoName = toolArgs.ceo_name;

    return toolArgs;
  }

  async startSession(agentIdx: number) {
    // grab relevant persona
    const agent = this.agents[agentIdx];
    const startSystemPrompt = this.getSystemPrompt(agent);

    // generate persona question for user
    console.log('🔥: start session');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      modalities: ['text', 'audio'],
      audio: {
        voice: agent.voice,
        format: 'wav',
      },
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: startSystemPrompt }],
        },
        // ...(this.chatHistory as ChatCompletionMessage[]),
        // {
        //   role: 'system',
        //   content: [{ type: 'text', text: instruction }],
        // },
      ],
    });

    // add to chat history
    const reply = response.choices[0];
    this.chatHistory.push({
      role: 'assistant',
      content: [{ type: 'text', text: `${reply?.message?.audio?.transcript}` }],
    });

    console.log('start session reply', reply);
    return reply;
  }

  async userTurn(agentIdx: number, audio: string) {
    // grab relevant persona
    const agent = this.agents[agentIdx];
    const userSystemPrompt = `
  Context:
  You are continuing a fast-paced press conference. You are ${agent.name} from ${agent.network}, a comedic but tough reporter.
  Follow your instructions to keep it brief, comedic, and grill the CEO with short, punchy questions.
  Remember to end the conversation if the CEO hasn't answered after 3 tries.
  `;

    // call to determine market response
    console.log('🔥: user turn');
    const toolResponse = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      modalities: ['text', 'audio'],
      audio: {
        voice: agent.voice,
        format: 'wav',
      },
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: userSystemPrompt }],
        },
        ...(this.chatHistory as ChatCompletionMessage[]),
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: audio,
                format: 'wav',
              },
            },
          ],
        },
      ],
      tool_choice: 'required',
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_evaluation_score',
            description: "Generate an evaluation score between -1 and 1 for the CEO's response.",
            strict: true,
            parameters: {
              type: 'object',
              required: ['score', 'end_of_conversation'],
              properties: {
                score: {
                  type: 'number',
                  description: `
              A score from -1.0 to 1.0. 
              - Use positive (>= 0) if the response is at least somewhat coherent, respectful, or funny. 
              - Use negative (< 0) ONLY if the CEO is dismissive, disrespectful, or clearly not answering the question.
            `
                },
                end_of_conversation: {
                  type: 'boolean',
                  description: `
              Whether to end the conversation after this turn. 
              End if the user is dismissive or if it has been 3 attempts without a direct answer or if you feel the conversation is over.
            `
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    });

    const toolCall = toolResponse.choices[0]!.message!.tool_calls![0];
    const toolArgs = JSON.parse(toolCall.function.arguments);

    // Add user's audio to chat history
    this.chatHistory.push({
      role: 'user',
      content: [
        {
          type: 'input_audio',
          input_audio: {
            data: audio,
            format: 'wav',
          },
        },
      ],
    });

    console.log('chat history', this.chatHistory);
    console.log('tool args', toolArgs);

    // Apply the evaluation score
    this.applyTrend(toolArgs.score);

    // process model response
    console.log('🔥: model turn');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      modalities: ['text', 'audio'],
      audio: {
        voice: agent.voice,
        format: 'wav',
      },
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: userSystemPrompt }],
        },
        ...(this.chatHistory as ChatCompletionMessage[]),
        ...(toolArgs.end_of_conversation ? [
          {
            role: 'system',
            content: [{
              type: 'text',
              text: `Acting as ${agent.name}, end the conversation`
            }]
          } as ChatCompletionSystemMessageParam
        ] : [])
      ],
    });

    // Add agent's response to chat history
    const reply = response.choices[0];
    if (reply.message.audio) {
      this.chatHistory.push({
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `${reply.message.audio?.transcript}`
          },
        ],
      });
    }

    if (toolArgs.end_of_conversation) {
      console.log('end of conversation')
    }

    console.log('model turn reply', reply);
    return {
      reply, isEndOfConversation: toolArgs.end_of_conversation
    };
  }

  getNextPrice() {
    const randomChange = this.volatility * (Math.random() - 0.5);
    if (this.trendRemainingSteps <= 0) {
      this.trend = 0;
    }
    const trendInfluence = this.volatility * 0.5 * this.trend;
    this.currentPrice += randomChange + trendInfluence;
    // price can never go below 0
    this.currentPrice = Math.max(0, this.currentPrice);
    this.trendRemainingSteps = Math.max(0, this.trendRemainingSteps - 1);
    this.history.push(this.currentPrice);
    return this.currentPrice;
  }

  applyTrend(trend: number) {
    // randint between 10 and 100
    this.trendRemainingSteps = Math.random() * 90 + 10;
    this.trend = trend;
  }
}
