import { BattleStream, getPlayerStreams } from 'pokemon-showdown';

export interface BattleState {
  log: string[];
  request?: any;
  ended: boolean;
  winner?: string;
  lastError?: string;
}

export class PokemonBattle {
  private stream: BattleStream;
  private omniscientStream: any;
  private p1Stream: any;
  private p2Stream: any;
  private p1State: BattleState = { log: [], ended: false };
  private p2State: BattleState = { log: [], ended: false };
  private initialized = false;
  private streamProcessor: Promise<void> | null = null;
  private p1StreamProcessor: Promise<void> | null = null;
  private p2StreamProcessor: Promise<void> | null = null;

  constructor() {
    this.stream = new BattleStream();
    const streams = getPlayerStreams(this.stream);
    this.omniscientStream = streams.omniscient;
    this.p1Stream = streams.p1;
    this.p2Stream = streams.p2;
  }

  async initialize(formatId: string = 'gen9randombattle', player1Name: string = 'Player 1', player2Name: string = 'Player 2'): Promise<void> {
    // Start stream processors
    this.streamProcessor = this.processOmniscientStream();
    this.p1StreamProcessor = this.processPlayerStream('p1');
    this.p2StreamProcessor = this.processPlayerStream('p2');

    // Start the battle - omniscient stream will show exact HP without duplicates
    this.omniscientStream.write(`>start {"formatid":"${formatId}"}`);
    this.omniscientStream.write(`>player p1 {"name":"${player1Name}"}`);
    this.omniscientStream.write(`>player p2 {"name":"${player2Name}"}`);

    this.initialized = true;

    // Wait for battle to be created and configured
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async processOmniscientStream(): Promise<void> {
    try {
      for await (const chunk of this.omniscientStream) {
        this.handleOmniscientData(chunk);
      }
    } catch (error) {
      console.error('Omniscient stream processing error:', error);
    }
  }

  private async processPlayerStream(player: 'p1' | 'p2'): Promise<void> {
    const stream = player === 'p1' ? this.p1Stream : this.p2Stream;
    try {
      for await (const chunk of stream) {
        this.handlePlayerData(player, chunk);
      }
    } catch (error) {
      console.error(`Player ${player} stream processing error:`, error);
    }
  }

  private handleOmniscientData(data: string): void {
    // Omniscient stream has clean data without split markers
    const lines = data.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      // Add to both player logs
      this.p1State.log.push(line);
      this.p2State.log.push(line);

      // Check for battle end
      if (line.match(/\|win\|/) || line.match(/^\|tie$/)) {
        this.handleBattleEnd(line);
      }
    }
  }

  private handlePlayerData(player: 'p1' | 'p2', data: string): void {
    const state = player === 'p1' ? this.p1State : this.p2State;

    const lines = data.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      // Track errors so LLM can see them
      if (line.startsWith('|error|')) {
        state.lastError = line.substring(7);
      }

      // Extract move requests from player-specific streams
      if (line.startsWith('|request|')) {
        try {
          const requestJson = line.substring(9);
          if (requestJson && requestJson.trim()) {
            state.request = JSON.parse(requestJson);
            // Don't clear error here - let it persist so LLM can see it
          }
        } catch (e) {
          console.error('Error parsing request:', e);
        }
      }
    }
  }

  private handleBattleEnd(data: string): void {
    this.p1State.ended = true;
    this.p2State.ended = true;

    if (data.includes('|win|')) {
      const winner = data.split('|win|')[1]?.split('|')[0]?.trim();
      this.p1State.winner = winner;
      this.p2State.winner = winner;
    }
  }

  getState(player: 'p1' | 'p2'): BattleState {
    return player === 'p1' ? this.p1State : this.p2State;
  }

  submitChoice(player: 'p1' | 'p2', choice: string): void {
    if (!this.initialized) {
      throw new Error('Battle not initialized');
    }
    const stream = player === 'p1' ? this.p1Stream : this.p2Stream;
    stream.write(choice);
  }

  destroy(): void {
    try {
      if (!this.p1State.ended && !this.p2State.ended) {
        this.stream.destroy();
      }
      // Stream will clean itself up when the battle ends naturally
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}
