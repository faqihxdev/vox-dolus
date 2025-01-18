import { OpenAI } from 'openai';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessage,
  ChatCompletionSystemMessageParam,
} from 'openai/resources/index.mjs';
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('API Key does not exist');
}
const openai = new OpenAI({
  apiKey: API_KEY,
});

interface Agent {
  name: string;
  persona: string;
  network: string;
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
}

export class Game {
  agents: Agent[];
  history: number[];
  volatility: number;
  currentPrice: number;
  trend: number;
  trendRemainingSteps: number;
  ceoName: string;
  chatHistory: (
    | ChatCompletionMessage
    | ChatCompletionAssistantMessageParam
    | ChatCompletionSystemMessageParam
  )[];

  constructor(ceoName: string, volatility: number = 0.5, initialPrice: number = 96.4) {
    this.ceoName = ceoName;
    this.history = [];
    this.currentPrice = initialPrice;
    this.trend = 0;
    this.trendRemainingSteps = 0;
    this.volatility = volatility;

    this.agents = [
      {
        name: 'Sophia Harrington',
        network: 'Global Update Network',
        persona:
          'An experienced investigative journalist known for her calm demeanor and in-depth analysis of complex international issues.',
        voice: 'alloy',
      },
      {
        name: 'James Carter',
        network: 'Continental News Service',
        persona:
          'A charismatic anchor who brings energy to breaking news stories, specializing in political and economic affairs.',
        voice: 'ash',
      },
      {
        name: 'Amara Lopez',
        network: 'WorldView Today',
        persona:
          'A passionate field reporter with a focus on humanitarian crises, often reporting directly from conflict zones.',
        voice: 'ballad',
      },
      {
        name: 'Liam Roberts',
        network: 'PrimeTime News',
        persona:
          'A reliable and composed evening news anchor, delivering stories with clarity and a touch of wit.',
        voice: 'echo',
      },
      {
        name: 'Elena Cho',
        network: '24/7 Current Affairs',
        persona:
          'A technology enthusiast who reports on the latest innovations, blending expertise with a down-to-earth approach.',
        voice: 'coral',
      },
      // {
      //     "name": "Marcus Patel",
      //     "network": "Headline Express",
      //     "persona": "An investigative journalist with a reputation for uncovering corruption and holding the powerful accountable.",
      // 	"voice": "fable"
      // },
      // {
      //     "name": "Isabella Zhang",
      //     "network": "Eagle Eye Reports",
      //     "persona": "A dedicated environmental reporter with a knack for storytelling that inspires action on climate change.",
      // 	"voice": "nova"
      // },
      // {
      //     "name": "Noah Thompson",
      //     "network": "NationScope",
      //     "persona": "A sports correspondent known for his dynamic coverage and ability to connect with athletes on a personal level.",
      // 	"voice": "onyx"
      // },
      {
        name: 'Chloe Bennett',
        network: 'Daily Spotlight',
        persona:
          'An upbeat lifestyle reporter covering trends in fashion, health, and entertainment with a relatable charm.',
        voice: 'sage',
      },
      {
        name: "Sarah O'Connor",
        network: 'Pulse News Network',
        persona:
          'A gritty crime reporter who dives into the details of high-profile cases, earning respect for her fearless approach.',
        voice: 'verse',
      },
      {
        name: 'Aria Sullivan',
        network: 'Breaking Point Broadcast',
        persona:
          'An articulate and empathetic journalist specializing in social justice issues, known for giving a voice to underrepresented communities.',
        voice: 'shimmer',
      },
    ];
    this.chatHistory = [];
  }

  async agentTurn(agentIdx: number) {
    // grab relevant persona
    const agent = this.agents[agentIdx];

    const systemPrompt = `
    You are a news reporter that will ask the CEO tough questions and grill the CEO. Afterwards, you need to evaluate the CEO on their response. Please elaborate more about the situation before you ask the questions.

		# Current Character
		- Name: ${agent.name}
		- Persona: ${agent.persona}
		`;

    const instruction = `Roleplaying as ${agent.name}, introduce yourself and which news agency you are from. Ask a difficult, absurd and hysterical question to the CEO. It can be about anything that negatively affects a company image, such as controversial actions taken by the company, scandals, financials, data breaches, rumours or others.`;

    // generate persona question for user
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
          content: [{ type: 'text', text: systemPrompt }],
        },
        ...(this.chatHistory as ChatCompletionMessage[]),
        {
          role: 'system',
          content: [{ type: 'text', text: instruction }],
        },
      ],
    });

    // add to chat history
    const reply = response.choices[0];
    this.chatHistory.push({
      role: 'assistant',
      content: [{ type: 'text', text: `${agent.name}: ${reply?.message?.audio?.transcript}` }],
    });
    return reply;
  }

  async userTurn(agentIdx: number, audio: string) {
    // grab relevant persona
    const agent = this.agents[agentIdx];
    const toolSystemPrompt = `You are an agent that simulates the stock market response to a CEO's press conference. You will receive the current context on what has happened thus far, including the CEO's recent audio reply, and evaluate the market response as a floating point score between -1 to 1, where -1 indicates a significant dip in the stock, 1 indicates a significant increase in the stock price, 0 represents no change, and values in between represent differing magnitudes in the change in the stock price.`;

    const toolInstruction = `Assuming the audio input is the CEO's response, generate the market evaluation as a function call. If you feel that there are no follow up questions by the reporter, pass true as the response to the 'end_of_conversation' field`;

    // call to determine market response
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
          content: [{ type: 'text', text: toolSystemPrompt }],
        },
        ...(this.chatHistory as ChatCompletionMessage[]),
        {
          role: 'user',
          content: [
            { type: 'text', text: toolInstruction },
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
              required: ['response', 'score', 'end_of_conversation'],
              properties: {
                response: {
                  type: 'string',
                  description: 'The text response to evaluate',
                },
                score: {
                  type: 'number',
                  description:
                    'Score between -1 to 1 depending on the professionalism, clarity and completeness of the response',
                },
                end_of_conversation: {
                  type: 'boolean',
                  description:
                    'Indication if conversation should continue. A conversation should end after 3 exchanges max.',
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    });

    const toolCall = toolResponse.choices[0]!.message!.tool_calls![0];
    // send user response to API
    const toolArgs = JSON.parse(toolCall.function.arguments);

    // TODO: process and return
    this.applyTrend(toolArgs.score);

    if (toolArgs.end_of_conversation) {
      return null;
    }

    const systemPrompt = `
    You are a news reporter that will ask the CEO tough questions and grill the CEO. Afterwards, you need to evaluate the CEO on their response. Please elaborate more about the situation before you ask the questions.

		# Current Character
		- Name: ${agent.name}
		- Persona: ${agent.persona}
    `;
    const instruction = `Roleplaying as ${agent.name}, give a reply to the CEO.`;

    // process model response
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
          content: [{ type: 'text', text: systemPrompt }],
        },
        ...(this.chatHistory as ChatCompletionMessage[]),
        {
          role: 'user',
          content: [
            { type: 'text', text: instruction },
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
    });

    // add to chat history
    const reply = response.choices[0];
    this.chatHistory.push({
      role: 'assistant',
      content: `${agent.name}: ${reply.message.audio?.transcript}`,
    });
    return reply;
  }

  getNextPrice() {
    const randomChange = this.volatility * (Math.random() - 0.5);
    if (this.trendRemainingSteps <= 0) {
      this.trend = 0;
    }
    const trendInfluence = this.volatility * 0.5 * this.trend;
    this.currentPrice += randomChange + trendInfluence;
    this.trendRemainingSteps = Math.max(0, this.trendRemainingSteps - 1);
    console.log(this.currentPrice);
    this.history.push(this.currentPrice);
    return this.currentPrice;
  }

  applyTrend(trend: number) {
    // randint between 10 and 100
    this.trendRemainingSteps = Math.random() * 90 + 10;
    this.trend = trend;
  }
}
