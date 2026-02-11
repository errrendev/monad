// Test script for creating agent with AI model configuration
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testCreateAgentWithAI() {
  console.log('🤖 Testing Agent Creation with AI Model...\n');

  try {
    // Test 1: Create agent with all required fields
    console.log('1️⃣ Creating agent with AI model configuration:');
    const agentData = {
      name: 'AlphaAgent',
      modelName: 'Gemini_2.5_Flash',
      apiKey: 'test_api_key_12345',
      initialAmount: 1000,
      strategy: 'aggressive',
      riskProfile: 'aggressive',
      ownerAddress: '0x1234567890123456789012345678901234567890'
    };

    const response = await fetch(`${API_BASE}/agents/create-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentData)
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.success) {
      console.log('Created agent:');
      console.log('- ID:', result.data.id);
      console.log('- Name:', result.data.name);
      console.log('- Address:', result.data.address);
      console.log('- Strategy:', result.data.strategy);
      console.log('- Risk Profile:', result.data.risk_profile);
      console.log('- AI Model:', result.data.config?.ai_model);
      console.log('- Initial Amount:', result.data.config?.initial_amount);
      console.log('- Auto Play:', result.data.config?.auto_play);
    }
    console.log('');

    // Test 2: Missing required fields
    console.log('2️⃣ Testing with missing required fields:');
    const incompleteData = {
      name: 'BetaAgent',
      modelName: 'GPT-4'
      // Missing apiKey and ownerAddress
    };

    const response2 = await fetch(`${API_BASE}/agents/create-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incompleteData)
    });

    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Success:', result2.success);
    console.log('Message:', result2.message);
    console.log('');

    // Test 3: Negative initial amount
    console.log('3️⃣ Testing with negative initial amount:');
    const negativeAmountData = {
      name: 'GammaAgent',
      modelName: 'Claude-3',
      apiKey: 'test_key_67890',
      initialAmount: -500,
      ownerAddress: '0x0987654321098765432109876543210987654321'
    };

    const response3 = await fetch(`${API_BASE}/agents/create-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(negativeAmountData)
    });

    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Success:', result3.success);
    console.log('Message:', result3.message);
    console.log('');

    // Test 4: Zero initial amount (should work)
    console.log('4️⃣ Testing with zero initial amount:');
    const zeroAmountData = {
      name: 'DeltaAgent',
      modelName: 'Gemini_Pro',
      apiKey: 'test_key_11111',
      initialAmount: 0,
      ownerAddress: '0x1111222233334444555566667777888899990000'
    };

    const response4 = await fetch(`${API_BASE}/agents/create-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zeroAmountData)
    });

    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Success:', result4.success);
    console.log('Message:', result4.message);
    
    if (result4.success) {
      console.log('Created agent with zero funding:');
      console.log('- Name:', result4.data.name);
      console.log('- Initial Amount:', result4.data.config?.initial_amount);
    }
    console.log('');

    // Test 5: Different AI models
    console.log('5️⃣ Testing with different AI models:');
    const models = [
      'Gemini_2.5_Flash',
      'GPT-4',
      'Claude-3-Opus',
      'GPT-3.5-Turbo'
    ];

    for (let i = 0; i < models.length; i++) {
      const modelData = {
        name: `ModelTest_${i + 1}`,
        modelName: models[i],
        apiKey: `test_key_${i + 1}`,
        initialAmount: 500,
        ownerAddress: `0x${String(i + 1).padStart(40, '0')}`
      };

      const response = await fetch(`${API_BASE}/agents/create-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modelData)
      });

      const result = await response.json();
      console.log(`- ${models[i]}: ${result.success ? '✅' : '❌'} (${response.status})`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testCreateAgentWithAI();
