import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { LLMPlayer } from './llm-player';
import { BattleCoordinator } from './coordinator';
import { BattleViewer } from './viewer';

async function main() {
  console.log('🎮 Pokemon Battle Simulator - LLM vs LLM\n');

  // Configure LLM players
  // You'll need to set ANTHROPIC_API_KEY environment variable

  const player1 = new LLMPlayer({
    model: anthropic('claude-haiku-4-5'),
    name: 'Claude Haiku 4.5',
  });

  const player2 = new LLMPlayer({
    model: anthropic('claude-3-7-sonnet-latest'),
    name: 'Claude 3.7 Sonnet',
  });

  // Create battle coordinator
  const coordinator = new BattleCoordinator(player1, player2);

  try {
    // Run the battle
    const result = await coordinator.runBattle('gen9randombattle');

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATTLE RESULTS');
    console.log('='.repeat(60));
    console.log(`Battle ID: ${result.battleId}`);
    console.log(`Winner: ${result.winner || 'TIE'}`);
    console.log(`Total turns: ${result.turns}`);
    console.log('\n🎬 Final Battle Log (last 30 lines):');
    console.log(result.log.slice(-30).join('\n'));

    console.log('\n' + '='.repeat(60));
    console.log(`\n💭 ${player1.getName()} Decision History:`);
    result.player1History.forEach((entry, idx) => {
      console.log(`\nTurn ${idx + 1}:`);
      console.log(entry);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n💭 ${player2.getName()} Decision History:`);
    result.player2History.forEach((entry, idx) => {
      console.log(`\nTurn ${idx + 1}:`);
      console.log(entry);
    });

    // Generate HTML visualization
    console.log('\n' + '='.repeat(60));
    console.log('🎨 Generating battle replay...');
    const html = BattleViewer.generateHTML(
      result.log,
      player1.getName(),
      player2.getName()
    );
    const filepath = BattleViewer.saveToFile(
      html,
      result.battleId,
      player1.getName(),
      player2.getName(),
      'gen9randombattle'
    );
    console.log(`✅ Battle replay saved to: ${filepath}`);
    console.log('   Open this file in your browser to view the battle!');

  } catch (error) {
    console.error('Error running battle:', error);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { main };
