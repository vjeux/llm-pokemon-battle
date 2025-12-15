import { generateText } from 'ai';
import { BattleState } from './battle';

export interface LLMConfig {
  model: any; // AI SDK model instance
  name: string;
}

export class LLMPlayer {
  private config: LLMConfig;
  private battleHistory: string[] = [];

  constructor(config: LLMConfig) {
    this.config = config;
  }

  getName(): string {
    return this.config.name;
  }

  async makeMove(state: BattleState): Promise<string> {
    const { request } = state;

    if (!request) {
      throw new Error('No move request available');
    }

    // Build context for the LLM
    const context = this.buildContext(state, request);

    try {
      const { text } = await generateText({
        model: this.config.model,
        prompt: context,
        temperature: 0.7,
      });

      // Parse the LLM's response to extract a valid move choice
      const choice = this.parseChoice(text, request);

      // Store for history
      this.battleHistory.push(`Request: ${JSON.stringify(request)}\nResponse: ${text}\nChosen: ${choice}`);

      return choice;
    } catch (error) {
      console.error('Error getting move from LLM:', error);
      // Fallback to first available move
      return this.getDefaultChoice(request);
    }
  }

  private buildContext(state: BattleState, request: any): string {
    const recentLog = state.log.slice(-20).join('\n');

    let context = `You are playing a Pokemon battle. Analyze the current situation and choose the best move.

RECENT BATTLE LOG:
${recentLog}
`;

    if (state.lastError) {
      context += `\n⚠️  YOUR LAST MOVE WAS REJECTED: ${state.lastError}
Please choose a DIFFERENT move!\n`;
    }

    context += `\nCURRENT SITUATION:
`;

    if (request.active && request.active[0]) {
      const active = request.active[0];
      context += `\nYour active Pokemon's available moves:\n`;

      if (active.moves) {
        active.moves.forEach((move: any, idx: number) => {
          context += `${idx + 1}. ${move.move}`;
          if (move.disabled) context += ` (DISABLED)`;
          if (move.pp !== undefined) context += ` (PP: ${move.pp}/${move.maxpp})`;
          context += '\n';
        });
      }

      if (active.trapped) {
        context += `\nYour Pokemon is trapped and cannot switch.\n`;
      }
    }

    if (request.side && request.side.pokemon) {
      context += `\nYour team:\n`;
      request.side.pokemon.forEach((pokemon: any, idx: number) => {
        const hp = pokemon.condition ? pokemon.condition.split('/')[0] : 'unknown';
        const active = pokemon.active ? ' (ACTIVE)' : '';
        const fainted = pokemon.condition?.includes('fnt') ? ' (FAINTED)' : '';
        context += `${idx + 1}. ${pokemon.details}${active}${fainted} - HP: ${hp}\n`;
      });
    }

    if (request.forceSwitch) {
      context += `\nYou must switch Pokemon!\n`;
    }

    context += `\nINSTRUCTIONS:
Reply with ONLY your choice in one of these formats:
- To use a move: "move <number>" (e.g., "move 1", "move 2")
- To switch Pokemon: "switch <number>" (e.g., "switch 2", "switch 3")

Choose the move number (1-4) or switch target (1-6) that you think is best.
Respond with ONLY the choice, nothing else. For example: "move 2" or "switch 3"`;

    return context;
  }

  private parseChoice(llmResponse: string, request: any): string {
    // Clean up the response
    const cleaned = llmResponse.toLowerCase().trim();

    // Look for move pattern
    const moveMatch = cleaned.match(/move\s+(\d+)/);
    if (moveMatch) {
      const moveNum = parseInt(moveMatch[1]);
      if (request.active?.[0]?.moves?.[moveNum - 1]) {
        return `move ${moveNum}`;
      }
    }

    // Look for switch pattern
    const switchMatch = cleaned.match(/switch\s+(\d+)/);
    if (switchMatch) {
      const switchNum = parseInt(switchMatch[1]);
      if (request.side?.pokemon?.[switchNum - 1]) {
        return `switch ${switchNum}`;
      }
    }

    // Look for just a number
    const numMatch = cleaned.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (request.forceSwitch) {
        return `switch ${num}`;
      } else if (request.active?.[0]?.moves?.[num - 1]) {
        return `move ${num}`;
      }
    }

    // Fallback
    return this.getDefaultChoice(request);
  }

  private getDefaultChoice(request: any): string {
    // If forced to switch, switch to first available non-active, non-fainted Pokemon
    if (request.forceSwitch) {
      const pokemon = request.side?.pokemon || [];
      for (let i = 0; i < pokemon.length; i++) {
        if (!pokemon[i].active && !pokemon[i].condition?.includes('fnt')) {
          return `switch ${i + 1}`;
        }
      }
      return 'switch 2';
    }

    // Otherwise, use first available move
    if (request.active?.[0]?.moves?.length > 0) {
      return 'move 1';
    }

    return 'move 1'; // Ultimate fallback
  }

  getBattleHistory(): string[] {
    return this.battleHistory;
  }
}
