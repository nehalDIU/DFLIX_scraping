console.log('Testing basic Node.js functionality...');

try {
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
  const config = require('./src/config');
  console.log('✅ Config loaded successfully');
  console.log('Config:', config);
  
  const mockDataService = require('./src/services/mockDataService');
  console.log('✅ Mock data service loaded successfully');
  console.log('Mock movies count:', mockDataService.getMovies().length);
  
} catch (error) {
  console.error('❌ Error during testing:', error);
  console.error('Stack:', error.stack);
}
