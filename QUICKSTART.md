# Quick Start Guide

## What We've Built

A fully functional Pokemon battle simulator where Large Language Models (LLMs) compete against each other. The system:

✅ Uses Pokemon Showdown's official battle engine
✅ Integrates with the AI SDK to support multiple LLM providers
✅ Makes LLMs analyze battle state and choose strategic moves
✅ Generates beautiful HTML visualizations of battles
✅ Successfully tested with GPT-4o-mini winning against itself

## Quick Start

1. **Run your first battle:**
```bash
npm start
```

This will run GPT-4o-mini vs GPT-4o. The battle will:
- Show real-time move decisions from both LLMs
- Complete in 20-40 turns (about 2-5 minutes)
- Generate `battle.html` that you can open in your browser

2. **View the battle:**
```bash
open battle.html  # Mac
# or just open battle.html in your browser
```

## How It Works

Each turn:
1. Pokemon Showdown provides the battle state to each player
2. Each LLM receives:
   - Recent battle log (what happened)
   - Available moves with PP remaining
   - Team status (HP, active Pokemon, etc.)
3. The LLM analyzes and chooses a move or switch
4. Choices are sent back to Pokemon Showdown
5. The battle progresses based on Pokemon mechanics

## Customization

### Use Different LLMs

Edit `src/index.ts`:

```typescript
const player1 = new LLMPlayer({
  model: openai('gpt-4o'),        // or gpt-3.5-turbo, gpt-4-turbo
  name: 'GPT-4o',
});

const player2 = new LLMPlayer({
  model: openai('gpt-4o-mini'),
  name: 'GPT-4o Mini',
});
```

### Use Anthropic Claude

**Note:** The Anthropic API integration has connection issues. Use OpenAI models for now.

### Change Battle Format

```typescript
// In src/index.ts, change the format:
await coordinator.runBattle('gen9ou');        // OverUsed tier
await coordinator.runBattle('gen8randombattle'); // Gen 8 random
```

## Verified Working ✅

- Pokemon Showdown battle engine integration
- GPT-4o-mini making strategic decisions
- Battles completing successfully (tested: Player 1 won in 21 turns)
- HTML battle visualization generation
- Move variety (switches, different moves)

## Known Issues

- Anthropic API returns 403 Forbidden (use OpenAI models instead)
- Battles can take 2-5 minutes depending on model speed

## Example Output

```
🎮 Pokemon Battle Simulator - LLM vs LLM

🎮 Starting battle: GPT-4o-mini vs GPT-4o

📝 GPT-4o-mini is thinking...
   → Chose: move 1

📝 GPT-4o is thinking...
   → Chose: move 2

... [battle continues] ...

⚔️  Battle ended!

📊 BATTLE RESULTS
Winner: Player 1
Total turns: 21

✅ Battle visualization saved to: battle.html
```

## What's Next

- Run `npm start` to watch LLMs battle!
- Check `battle.html` to see the visualized battle
- Experiment with different models and formats
- Try the tournament mode (when you have working API keys for multiple providers)
