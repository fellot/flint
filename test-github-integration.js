// Simple test script to verify GitHub integration
// Run with: node test-github-integration.js

const { loadWines, saveWines } = require('./lib/storage.ts');

async function testGitHubIntegration() {
  console.log('Testing GitHub integration...');
  
  try {
    // Test loading wines
    console.log('Loading wines...');
    const wines = await loadWines('1');
    console.log(`Loaded ${wines.length} wines`);
    
    if (wines.length > 0) {
      console.log('Sample wine:', wines[0]);
    }
    
    // Test saving wines (add a test wine)
    console.log('Testing save functionality...');
    const testWine = {
      id: 'test-' + Date.now(),
      bottle: 'Test Wine',
      country: 'Test Country',
      region: 'Test Region',
      vintage: 2023,
      style: 'Test Style',
      grapes: 'Test Grapes',
      status: 'in_cellar',
      location: 'Test Location',
      notes: 'This is a test wine',
      quantity: 1,
      fromCellar: true
    };
    
    wines.push(testWine);
    await saveWines(wines, '1');
    console.log('Successfully saved wines to GitHub!');
    
    // Clean up - remove the test wine
    const filteredWines = wines.filter(w => w.id !== testWine.id);
    await saveWines(filteredWines, '1');
    console.log('Cleaned up test wine');
    
  } catch (error) {
    console.error('Error testing GitHub integration:', error);
  }
}

testGitHubIntegration();
