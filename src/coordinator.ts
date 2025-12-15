import { PokemonBattle } from './battle';
import { LLMPlayer } from './llm-player';
import { v4 as uuidv4 } from 'uuid';

export interface BattleResult {
  battleId: string;
  winner: string | undefined;
  turns: number;
  log: string[];
  player1History: string[];
  player2History: string[];
}

export class BattleCoordinator {
  private battle: PokemonBattle;
  private player1: LLMPlayer;
  private player2: LLMPlayer;
  private maxTurns: number;
  private turnCount: number = 0;

  constructor(player1: LLMPlayer, player2: LLMPlayer, maxTurns: number = 100) {
    this.battle = new PokemonBattle();
    this.player1 = player1;
    this.player2 = player2;
    this.maxTurns = maxTurns;
  }

  async runBattle(formatId: string = 'gen9randombattle'): Promise<BattleResult> {
    const battleId = uuidv4();
    console.log(`\n🎮 Starting battle: ${this.player1.getName()} vs ${this.player2.getName()}`);
    console.log(`📝 Battle ID: ${battleId}\n`);

    await this.battle.initialize(formatId, this.player1.getName(), this.player2.getName());

    // Main battle loop
    let loopCount = 0;
    let stuckCounter = 0;
    let lastStateHash = '';

    while (this.turnCount < this.maxTurns) {
      loopCount++;
      const p1State = this.battle.getState('p1');
      const p2State = this.battle.getState('p2');

      // Detect if we're stuck in the same state
      const currentStateHash = `${this.turnCount}-${!!p1State.request}-${!!p2State.request}-${p1State.request?.wait}-${p2State.request?.wait}`;
      if (currentStateHash === lastStateHash) {
        stuckCounter++;
        if (stuckCounter > 50) {
          console.error('[DEBUG] Stuck in same state for 50 iterations:', {
            turnCount: this.turnCount,
            p1HasRequest: !!p1State.request,
            p2HasRequest: !!p2State.request,
            p1Wait: p1State.request?.wait,
            p2Wait: p2State.request?.wait,
            p1Error: p1State.lastError,
            p2Error: p2State.lastError,
          });
          break;
        }
      } else {
        stuckCounter = 0;
        lastStateHash = currentStateHash;
      }

      // Check if battle ended
      if (p1State.ended || p2State.ended) {
        console.log('\n⚔️  Battle ended!');
        break;
      }

      // Wait for requests if not available yet
      if (!p1State.request && !p2State.request) {
        // Yield to event loop to let async stream processors run
        await new Promise(resolve => setImmediate(resolve));
        continue;
      }

      // Get moves from both players if they have requests
      const moves: { player: 'p1' | 'p2'; choice: string }[] = [];

      // Only submit moves for players who have non-waiting requests
      if (p1State.request && !p1State.request.wait) {
        console.log(`\n📝 ${this.player1.getName()} is thinking...`);
        try {
          const choice = await this.player1.makeMove(p1State);
          const detailedChoice = this.getDetailedChoice(choice, p1State.request);
          console.log(`   → Chose: ${choice}${detailedChoice ? ` (${detailedChoice})` : ''}`);
          moves.push({ player: 'p1', choice });
        } catch (error) {
          console.error(`Error getting move from ${this.player1.getName()}:`, error);
          moves.push({ player: 'p1', choice: 'move 1' });
        }
      }

      if (p2State.request && !p2State.request.wait) {
        console.log(`\n📝 ${this.player2.getName()} is thinking...`);
        try {
          const choice = await this.player2.makeMove(p2State);
          const detailedChoice = this.getDetailedChoice(choice, p2State.request);
          console.log(`   → Chose: ${choice}${detailedChoice ? ` (${detailedChoice})` : ''}`);
          moves.push({ player: 'p2', choice });
        } catch (error) {
          console.error(`Error getting move from ${this.player2.getName()}:`, error);
          moves.push({ player: 'p2', choice: 'move 1' });
        }
      }

      // If no moves to submit (both waiting), yield and continue
      if (moves.length === 0) {
        await new Promise(resolve => setImmediate(resolve));
        continue;
      }

      // Submit moves
      for (const move of moves) {
        this.battle.submitChoice(move.player, move.choice);
        // Clear error after submitting - if there's an error, it will be set again
        const state = move.player === 'p1' ? p1State : p2State;
        state.lastError = undefined;
        // Clear request after submitting
        state.request = undefined;
      }

      this.turnCount++;

      // Yield to event loop to let async stream processors run
      await new Promise(resolve => setImmediate(resolve));

      // Prevent infinite loop during debugging
      if (loopCount > 1000) {
        console.error('[DEBUG] Breaking after 1000 iterations to prevent infinite loop');
        break;
      }
    }

    // Get final results
    const finalState = this.battle.getState('p1');

    const result: BattleResult = {
      battleId,
      winner: finalState.winner,
      turns: this.turnCount,
      log: finalState.log,
      player1History: this.player1.getBattleHistory(),
      player2History: this.player2.getBattleHistory(),
    };

    this.battle.destroy();

    return result;
  }

  private getDetailedChoice(choice: string, request: any): string | null {
    try {
      const parts = choice.trim().toLowerCase().split(' ');
      const action = parts[0];
      const num = parseInt(parts[1]);

      if (action === 'move' && request.active?.[0]?.moves) {
        const move = request.active[0].moves[num - 1];
        return move?.move || null;
      } else if (action === 'switch' && request.side?.pokemon) {
        const pokemon = request.side.pokemon[num - 1];
        if (pokemon?.details) {
          // Extract pokemon name from details (e.g., "Pikachu, L50, M" -> "Pikachu")
          const name = pokemon.details.split(',')[0];
          return name;
        }
      }
    } catch (error) {
      // If parsing fails, just return null
    }
    return null;
  }
}
