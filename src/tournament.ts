import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { LLMPlayer } from './llm-player';
import { BattleCoordinator } from './coordinator';
import { BattleViewer } from './viewer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface MatchResult {
  player1: string;
  player2: string;
  player1Wins: number;
  player2Wins: number;
  battles: Array<{
    battleId: string;
    winner: string | undefined;
    turns: number;
  }>;
}

interface PlayerStats {
  matchWins: number;  // Number of best-of-5 matches won
  gameWins: number;   // Total individual game wins across all matches
}

/**
 * Tournament with best-of-5 matches between all LLMs
 */
async function runTournament() {
  const tournamentId = uuidv4();
  const tournamentFolder = path.join(process.cwd(), `tournament-${tournamentId}`);

  // Create tournament folder
  fs.mkdirSync(tournamentFolder, { recursive: true });

  console.log('🏆 Pokemon Battle Tournament - Best of 5 Round Robin\n');
  console.log(`📁 Tournament ID: ${tournamentId}`);
  console.log(`📁 Replays will be saved to: ${tournamentFolder}\n`);

  // Configure different LLM players
  const players = [
    new LLMPlayer({
      model: anthropic('claude-haiku-4-5'),
      name: 'Claude Haiku 4.5',
    }),
    new LLMPlayer({
      model: google('gemini-2.5-flash'),
      name: 'Gemini 2.5 Flash',
    }),
    new LLMPlayer({
      model: openai('gpt-4o-mini'),
      name: 'GPT-4o-mini',
    }),
    new LLMPlayer({
      model: openai('gpt-4o'),
      name: 'GPT-4o',
    }),
    new LLMPlayer({
      model: anthropic('claude-3-7-sonnet-latest'),
      name: 'Claude 3.7 Sonnet',
    }),
    new LLMPlayer({
      model: google('gemini-2.5-pro'),
      name: 'Gemini 2.5 Pro',
    }),
  ];

  const matchResults: MatchResult[] = [];
  const playerStats: { [key: string]: PlayerStats } = {};

  // Initialize stats
  players.forEach(p => {
    playerStats[p.getName()] = { matchWins: 0, gameWins: 0 };
  });

  // Run round-robin tournament with best-of-5 matches
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];

      console.log(`\n${'='.repeat(70)}`);
      console.log(`MATCH ${matchResults.length + 1}: ${player1.getName()} vs ${player2.getName()}`);
      console.log(`Best of 5 - First to 3 wins`);
      console.log('='.repeat(70));

      const matchResult: MatchResult = {
        player1: player1.getName(),
        player2: player2.getName(),
        player1Wins: 0,
        player2Wins: 0,
        battles: [],
      };

      let battleNum = 0;

      // Best of 5: play until one player gets 3 wins
      while (matchResult.player1Wins < 3 && matchResult.player2Wins < 3) {
        battleNum++;
        console.log(`\n--- Battle ${battleNum} ---`);

        const coordinator = new BattleCoordinator(player1, player2, 100);

        try {
          const result = await coordinator.runBattle('gen9randombattle');

          matchResult.battles.push({
            battleId: result.battleId,
            winner: result.winner,
            turns: result.turns,
          });

          // Update match score
          if (result.winner === player1.getName()) {
            matchResult.player1Wins++;
            playerStats[player1.getName()].gameWins++;
            console.log(`✅ ${player1.getName()} wins! Score: ${matchResult.player1Wins}-${matchResult.player2Wins}`);
          } else if (result.winner === player2.getName()) {
            matchResult.player2Wins++;
            playerStats[player2.getName()].gameWins++;
            console.log(`✅ ${player2.getName()} wins! Score: ${matchResult.player1Wins}-${matchResult.player2Wins}`);
          } else {
            console.log(`⚖️  Tie! Score: ${matchResult.player1Wins}-${matchResult.player2Wins}`);
          }

          // Save individual battle
          const html = BattleViewer.generateHTML(
            result.log,
            player1.getName(),
            player2.getName()
          );
          const filename = `match${matchResults.length + 1}_battle${battleNum}_${result.battleId}.html`;
          const filepath = path.join(tournamentFolder, filename);
          fs.writeFileSync(filepath, html);

        } catch (error) {
          console.error('Error in battle:', error);
        }

        // Wait a bit between battles to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Determine match winner
      const matchWinner = matchResult.player1Wins > matchResult.player2Wins
        ? player1.getName()
        : player2.getName();
      const matchLoser = matchResult.player1Wins > matchResult.player2Wins
        ? player2.getName()
        : player1.getName();
      const winnerScore = Math.max(matchResult.player1Wins, matchResult.player2Wins);
      const loserScore = Math.min(matchResult.player1Wins, matchResult.player2Wins);

      playerStats[matchWinner].matchWins++;

      console.log(`\n🏆 MATCH WINNER: ${matchWinner} defeats ${matchLoser} (${winnerScore}-${loserScore})`);

      matchResults.push(matchResult);
    }
  }

  // Display tournament results
  console.log('\n' + '='.repeat(70));
  console.log('🏆 TOURNAMENT RESULTS');
  console.log('='.repeat(70));

  // Display all match results
  console.log('\n📊 MATCH RESULTS:');
  matchResults.forEach((match, idx) => {
    const winner = match.player1Wins > match.player2Wins ? match.player1 : match.player2;
    console.log(`Match ${idx + 1}: ${match.player1} vs ${match.player2}`);
    console.log(`  Score: ${match.player1Wins}-${match.player2Wins} | Winner: ${winner}`);
  });

  // Sort players by match wins (primary) and game wins (tiebreaker)
  const sortedPlayers = Object.entries(playerStats)
    .sort(([, a], [, b]) => {
      if (b.matchWins !== a.matchWins) {
        return b.matchWins - a.matchWins; // Primary: match wins
      }
      return b.gameWins - a.gameWins; // Tiebreaker: game wins
    });

  console.log('\n' + '='.repeat(70));
  console.log('🏅 FINAL STANDINGS');
  console.log('='.repeat(70));

  sortedPlayers.forEach(([player, stats], idx) => {
    const rank = idx + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    console.log(`${medal} ${rank}. ${player}`);
    console.log(`     Match Wins: ${stats.matchWins} | Total Game Wins: ${stats.gameWins}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 TOURNAMENT CHAMPION: ${sortedPlayers[0][0]}`);
  console.log('='.repeat(70));

  console.log(`\n📁 All replay files saved to: ${tournamentFolder}`);
  console.log(`   Total battles: ${matchResults.reduce((sum, m) => sum + m.battles.length, 0)}`);
}

/**
 * Example showing how to add custom LLM providers
 */
async function customProviderExample() {
  // You can add other providers like:

  // import { groq } from '@ai-sdk/groq';
  // const groqPlayer = new LLMPlayer({
  //   model: groq('mixtral-8x7b-32768'),
  //   name: 'Mixtral',
  // });

  // import { google } from '@ai-sdk/google';
  // const geminiPlayer = new LLMPlayer({
  //   model: google('gemini-1.5-flash'),
  //   name: 'Gemini 1.5 Flash',
  // });

  // const geminiProPlayer = new LLMPlayer({
  //   model: google('gemini-1.5-pro'),
  //   name: 'Gemini 1.5 Pro',
  // });

  // import { cohere } from '@ai-sdk/cohere';
  // const coherePlayer = new LLMPlayer({
  //   model: cohere('command-r-plus'),
  //   name: 'Command R+',
  // });

  console.log('See the code for examples of adding other LLM providers!');
}

// Run tournament if this is the main module
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--tournament')) {
    runTournament().catch(console.error);
  } else {
    console.log('Run with --tournament flag to start a tournament');
    console.log('Example: npm start -- --tournament');
  }
}

export { runTournament, customProviderExample };
