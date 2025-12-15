# Pokemon Battle Simulator - LLM vs LLM

A Pokemon battle simulator where different Large Language Models (LLMs) compete against each other using the Pokemon Showdown battle engine.

🏆 TOURNAMENT RESULTS

```
🥇 1. Gemini 2.5 Pro
     Match Wins: 5 | Total Game Wins: 15
🥈 2. Gemini 2.5 Flash
     Match Wins: 4 | Total Game Wins: 14
🥉 3. Claude Haiku 4.5
     Match Wins: 2 | Total Game Wins: 10
   4. GPT-4o
     Match Wins: 2 | Total Game Wins: 10
   5. GPT-4o-mini
     Match Wins: 2 | Total Game Wins: 9
   6. Claude 3.7 Sonnet
     Match Wins: 0 | Total Game Wins: 1
```

```
📊 MATCH RESULTS:
Match 1: Claude Haiku 4.5 vs Gemini 2.5 Flash
  Score: 1-3 | Winner: Gemini 2.5 Flash
Match 2: Claude Haiku 4.5 vs GPT-4o-mini
  Score: 3-1 | Winner: Claude Haiku 4.5
Match 3: Claude Haiku 4.5 vs GPT-4o
  Score: 1-3 | Winner: GPT-4o
Match 4: Claude Haiku 4.5 vs Claude 3.7 Sonnet
  Score: 3-1 | Winner: Claude Haiku 4.5
Match 5: Claude Haiku 4.5 vs Gemini 2.5 Pro
  Score: 2-3 | Winner: Gemini 2.5 Pro
Match 6: Gemini 2.5 Flash vs GPT-4o-mini
  Score: 3-2 | Winner: Gemini 2.5 Flash
Match 7: Gemini 2.5 Flash vs GPT-4o
  Score: 3-2 | Winner: Gemini 2.5 Flash
Match 8: Gemini 2.5 Flash vs Claude 3.7 Sonnet
  Score: 3-0 | Winner: Gemini 2.5 Flash
Match 9: Gemini 2.5 Flash vs Gemini 2.5 Pro
  Score: 2-3 | Winner: Gemini 2.5 Pro
Match 10: GPT-4o-mini vs GPT-4o
  Score: 3-1 | Winner: GPT-4o-mini
Match 11: GPT-4o-mini vs Claude 3.7 Sonnet
  Score: 3-0 | Winner: GPT-4o-mini
Match 12: GPT-4o-mini vs Gemini 2.5 Pro
  Score: 0-3 | Winner: Gemini 2.5 Pro
Match 13: GPT-4o vs Claude 3.7 Sonnet
  Score: 3-0 | Winner: GPT-4o
Match 14: GPT-4o vs Gemini 2.5 Pro
  Score: 1-3 | Winner: Gemini 2.5 Pro
Match 15: Claude 3.7 Sonnet vs Gemini 2.5 Pro
  Score: 0-3 | Winner: Gemini 2.5 Pro
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create a .env file with your API keys
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
```

## Usage

### Single Battle

Run a battle between two LLMs:

```bash
npm start
```

This will:
1. Initialize a battle between Claude Haiku 4.5 and Claude 3.7 Sonnet
2. Have the LLMs make strategic decisions each turn
3. Display the battle progress in the console
4. Generate an HTML battle replay file
5. Show decision history for both players

### Tournament Mode

Run a round-robin tournament with multiple LLMs where each matchup is a best-of-5:

```bash
npm run tournament
```

This will:
- Create a unique tournament folder (e.g., `tournament-<guid>`) for all replay files
- Run best-of-5 matches between all configured LLMs (first to 3 wins)
- Track match wins (primary ranking) and total game wins (tiebreaker)
- Generate individual HTML files for each battle in the tournament folder
- Display final standings with tournament champion
- Currently includes 6 models: Claude Haiku 4.5, Claude 3.7 Sonnet, GPT-4o-mini, GPT-4o, Gemini 1.5 Flash, Gemini 1.5 Pro

## Customization

### Using Different LLMs

Edit `src/index.ts` to configure different models:

```typescript
const player1 = new LLMPlayer({
  model: anthropic('claude-3-7-sonnet-latest'),  // or other Claude models
  name: 'Claude 3.7 Sonnet',
});

const player2 = new LLMPlayer({
  model: openai('gpt-4o'),  // or 'gpt-4o-mini', 'gpt-4-turbo', etc.
  name: 'GPT-4o',
});

// Or use Google Gemini models
import { google } from '@ai-sdk/google';
const player3 = new LLMPlayer({
  model: google('gemini-1.5-flash'),  // or 'gemini-1.5-pro', 'gemini-2.0-flash-exp', etc.
  name: 'Gemini 1.5 Flash',
});
```

You can use any model supported by the [AI SDK](https://ai-sdk.dev/providers).

### Battle Format

Change the Pokemon battle format in `src/index.ts`:

```typescript
const result = await coordinator.runBattle('gen9randombattle');
// Options: 'gen9ou', 'gen9uu', 'gen8randombattle', etc.
```

### Max Turns

Limit the maximum number of turns:

```typescript
const coordinator = new BattleCoordinator(player1, player2, 100); // max 100 turns
```

## Project Structure

```
pokemon-battle/
├── src/
│   ├── battle.ts        # Pokemon Showdown battle wrapper
│   ├── llm-player.ts    # LLM player that makes battle decisions
│   ├── coordinator.ts   # Battle coordinator managing LLM vs LLM matches
│   ├── viewer.ts        # HTML battle visualization generator
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Battle Initialization**: Creates a Pokemon Showdown battle stream with random teams
2. **LLM Decision Making**: Each turn, the LLM receives:
   - Current battle state
   - Available moves and their properties
   - Team status
   - Recent battle history
3. **Strategic Thinking**: The LLM analyzes the situation and chooses the best move
4. **Move Execution**: Choices are submitted to the Pokemon Showdown simulator
5. **Dual Visualization**: Battle exported as:
   - Custom HTML visualization with beautiful styling
   - Pokemon Showdown compatible replay format

See [REPLAY-GUIDE.md](REPLAY-GUIDE.md) for details on using the Pokemon Showdown replay files.

## Example Output

```
🎮 Pokemon Battle Simulator - LLM vs LLM

🎮 Starting battle: Claude Haiku 4.5 vs Claude 3.7 Sonnet
📝 Battle ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

📝 Claude Haiku 4.5 is thinking...
   → Chose: move 2

📝 Claude 3.7 Sonnet is thinking...
   → Chose: move 1

...

⚔️  Battle ended!

============================================================
📊 BATTLE RESULTS
============================================================
Battle ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Winner: Claude 3.7 Sonnet
Total turns: 23

✅ Battle replay saved to: /path/to/battle-a1b2c3d4-e5f6-7890-abcd-ef1234567890-gen9randombattle-claudehaiku45-vs-claude37sonnet.html
   Open this file in your browser to view the battle!
```

## Technologies Used

- [Pokemon Showdown](https://github.com/smogon/pokemon-showdown) - Battle simulator
- [AI SDK](https://ai-sdk.dev/) - Unified LLM interface
- TypeScript - Type-safe development
- Node.js - Runtime environment

## License

MIT

## Contributing

Feel free to submit issues or pull requests!
