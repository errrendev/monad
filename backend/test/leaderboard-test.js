// Test script for leaderboard functionality
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

async function testLeaderboard() {
  console.log('🧪 Testing Leaderboard Endpoints...\n');

  try {
    // Test 1: Default leaderboard (total_revenue)
    console.log('1️⃣ Testing default leaderboard (total_revenue):');
    const response1 = await fetch(`${API_BASE}/agents/leaderboard`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Success:', data1.success);
    console.log('Data count:', data1.data?.length || 0);
    console.log('Meta:', data1.meta);
    console.log('');

    // Test 2: Leaderboard by total_wins
    console.log('2️⃣ Testing leaderboard by total_wins:');
    const response2 = await fetch(`${API_BASE}/agents/leaderboard?metric=total_wins`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Success:', data2.success);
    console.log('Data count:', data2.data?.length || 0);
    console.log('Meta:', data2.meta);
    console.log('');

    // Test 3: Leaderboard by win_rate
    console.log('3️⃣ Testing leaderboard by win_rate:');
    const response3 = await fetch(`${API_BASE}/agents/leaderboard?metric=win_rate`);
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Success:', data3.success);
    console.log('Data count:', data3.data?.length || 0);
    console.log('Meta:', data3.meta);
    
    if (data3.success && data3.data?.length > 0) {
      console.log('Sample agent (win_rate):', {
        name: data3.data[0].name,
        win_rate: data3.data[0].win_rate,
        calculated_win_rate: data3.data[0].calculated_win_rate,
        total_wins: data3.data[0].total_wins,
        total_matches: data3.data[0].total_matches
      });
    }
    console.log('');

    // Test 4: Leaderboard by current_streak
    console.log('4️⃣ Testing leaderboard by current_streak:');
    const response4 = await fetch(`${API_BASE}/agents/leaderboard?metric=current_streak`);
    const data4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Success:', data4.success);
    console.log('Data count:', data4.data?.length || 0);
    console.log('Meta:', data4.meta);
    console.log('');

    // Test 5: Invalid metric (should fallback to total_revenue)
    console.log('5️⃣ Testing invalid metric (should fallback):');
    const response5 = await fetch(`${API_BASE}/agents/leaderboard?metric=invalid_metric`);
    const data5 = await response5.json();
    console.log('Status:', response5.status);
    console.log('Success:', data5.success);
    console.log('Meta metric:', data5.meta?.metric);
    console.log('');

    // Test 6: Enhanced leaderboard
    console.log('6️⃣ Testing enhanced leaderboard:');
    const response6 = await fetch(`${API_BASE}/agent-autonomous/leaderboard/enhanced?metric=win_rate`);
    const data6 = await response6.json();
    console.log('Status:', response6.status);
    console.log('Success:', data6.success);
    console.log('Data count:', data6.data?.length || 0);
    
    if (data6.success && data6.data?.length > 0) {
      console.log('Sample enhanced agent:', {
        name: data6.data[0].name,
        win_rate: data6.data[0].win_rate,
        currently_playing: data6.data[0].currently_playing,
        has_stats: !!data6.data[0].stats
      });
    }
    console.log('');

    // Test 7: Update win rates
    console.log('7️⃣ Testing win rate update:');
    const response7 = await fetch(`${API_BASE}/agents/update-win-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data7 = await response7.json();
    console.log('Status:', response7.status);
    console.log('Success:', data7.success);
    console.log('Message:', data7.message);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testLeaderboard();
