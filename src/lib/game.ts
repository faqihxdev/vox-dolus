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
    This is a news conference for a company called ${this.companyName ?? 'MyPhone'}.
    The company background is ${this.companyBackground ?? 'MyPhone is a company that makes phones'}.
    The CEO, ${this.ceoName ?? 'Mr. Ballmer'} is getting grilled by news reporters.

    Task:
    You are a news reporter named ${agent.name}, from ${agent.network} that will ask the CEO tough questions and grill the CEO.
    Afterwards, you need to evaluate the CEO on their response.
    Please elaborate more about the situation before you ask the questions.

    Persona:
    ${agent.persona}

    Instructions:
    1. Introduce yourself and which news agency you are from. Ask a difficult, absurd and hysterical question to the CEO. It can be about anything that negatively affects a company image, such as controversial actions taken by the company, scandals, financials, data breaches, rumours or others.
    2. Wait for the CEO response.
    3. After 3 exchanges, if the CEO has not answered the question, end the conversation.
    4. Keep all your responses under 1-2 sentences maximum. Be direct and concise.
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
            description:
              'Generates the company name, background of the company, and situation report for the CEO.',
            strict: true,
            parameters: {
              type: 'object',
              required: ['company_name', 'company_background', 'ceo_name'],
              properties: {
                company_name: {
                  type: 'string',
                  description:
                    'Name of the company. This name can be funny, but still describe what the company does.',
                },
                company_background: {
                  type: 'string',
                  description:
                    'Explanation and background of what the company does. This description can be funny and related to the company name. Must be less than 40 words.',
                },
                ceo_name: {
                  type: 'string',
                  description: 'Name of the CEO',
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
      content: [{ type: 'text', text: `${agent.name}: ${reply?.message?.audio?.transcript}` }],
    });

    console.log('start session reply', reply);
    return reply;
  }

  async userTurn(agentIdx: number, audio: string) {
    // grab relevant persona
    const agent = this.agents[agentIdx];
    // const toolSystemPrompt = `You are an agent that simulates the stock market response to a CEO's press conference. You will receive the current context on what has happened thus far, including the CEO's recent audio reply, and evaluate the market response as a floating point score between -1 to 1, where -1 indicates a significant dip in the stock, 1 indicates a significant increase in the stock price, 0 represents no change, and values in between represent differing magnitudes in the change in the stock price.`;

    // const toolInstruction = `Assuming the audio input is the CEO's response, generate the market evaluation as a function call. If you feel that there are no follow up questions by the reporter, pass true as the response to the 'end_of_conversation' field`;
    const userSystemPrompt = this.getSystemPrompt(agent);

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
            // { type: 'text', text: systemPrompt },
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
            description: 'Generate an evaluation score between -1 to 1 given a response',
            strict: true,
            parameters: {
              type: 'object',
              required: ['score', 'end_of_conversation'],
              properties: {
                score: {
                  type: 'number',
                  description:
                    'Score between -1 to 1 depending on the professionalism, clarity and completeness of the response',
                },
                end_of_conversation: {
                  type: 'boolean',
                  description:
                    'Indication if conversation should continue. End conversation if user is dismissive or have answered the question. A conversation should end after 3 exchanges max.',
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
            text: `${agent.name}: ${reply.message.audio?.transcript}`
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
