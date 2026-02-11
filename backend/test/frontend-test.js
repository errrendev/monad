// Test to verify win_rate is a number for frontend .toFixed() usage
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

async function testFrontendCompatibility() {
  console.log('🖥️ Testing Frontend Compatibility...\n');

  try {
    // Test regular leaderboard
    console.log('1️⃣ Testing regular leaderboard:');
    const response1 = await fetch(`${API_BASE}/agents/leaderboard?metric=win_rate`);
    const data1 = await response1.json();
    
    if (data1.success && data1.data.length > 0) {
      const agent = data1.data[0];
      console.log('Agent data:', {
        name: agent.name,
        win_rate: agent.win_rate,
        win_rate_type: typeof agent.win_rate
      });

      // Test frontend .toFixed(1) usage
      try {
        const formattedWinRate = agent.win_rate.toFixed(1);
        console.log('✅ .toFixed(1) works:', formattedWinRate + '%');
      } catch (error) {
        console.log('❌ .toFixed(1) failed:', error.message);
      }
    }

    console.log('');

    // Test enhanced leaderboard
    console.log('2️⃣ Testing enhanced leaderboard:');
    const response2 = await fetch(`${API_BASE}/agent-autonomous/leaderboard/enhanced?metric=win_rate`);
    const data2 = await response2.json();
    
    if (data2.success && data2.data.length > 0) {
      const agent = data2.data[0];
      console.log('Enhanced agent data:', {
        name: agent.name,
        win_rate: agent.win_rate,
        win_rate_type: typeof agent.win_rate
      });

      // Test frontend .toFixed(1) usage
      try {
        const formattedWinRate = agent.win_rate.toFixed(1);
        console.log('✅ Enhanced .toFixed(1) works:', formattedWinRate + '%');
      } catch (error) {
        console.log('❌ Enhanced .toFixed(1) failed:', error.message);
      }
    }

    console.log('');

    // Test agent with zero matches
    console.log('3️⃣ Testing agent with zero matches:');
    const response3 = await fetch(`${API_BASE}/agents/leaderboard`);
    const data3 = await response3.json();
    
    const zeroMatchAgent = data3.data.find(agent => agent.total_matches === 0);
    if (zeroMatchAgent) {
      console.log('Zero match agent:', {
        name: zeroMatchAgent.name,
        win_rate: zeroMatchAgent.win_rate,
        win_rate_type: typeof zeroMatchAgent.win_rate
      });

      try {
        const formattedWinRate = zeroMatchAgent.win_rate.toFixed(1);
        console.log('✅ Zero match .toFixed(1) works:', formattedWinRate + '%');
      } catch (error) {
        console.log('❌ Zero match .toFixed(1) failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testFrontendCompatibility();
