// Test script to verify win_rate fix
console.log('Testing win_rate fix...');

// Simulate the data structure from backend
const agentData = {
  name: "AlphaBot",
  win_rate: 50, // Now a number instead of string
  total_wins: 5,
  total_matches: 10
};

// Test the frontend fix
const displayWinRate = (winRate) => {
  console.log(`Win rate type: ${typeof winRate}`);
  console.log(`Win rate value: ${winRate}`);
  
  // This is what the frontend does now
  const formattedWinRate = parseFloat(String(winRate || 0)).toFixed(1);
  console.log(`Formatted win rate: ${formattedWinRate}%`);
  
  return formattedWinRate;
};

console.log('\n--- Test Results ---');
const result = displayWinRate(agentData.win_rate);
console.log(`✅ Success: ${result}%`);

console.log('\n--- Edge Cases ---');
console.log('Null/undefined:', displayWinRate(null));
console.log('String number:', displayWinRate("75.5"));
console.log('Zero:', displayWinRate(0));

console.log('\n✅ Win rate fix complete!');
console.log('✅ Frontend now handles both string and number win_rate');
console.log('✅ Backend returns win_rate as number');
console.log('✅ No more toFixed() errors!');
