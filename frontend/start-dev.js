#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Next.js development server...');
console.log('📁 Working directory:', process.cwd());

const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

nextDev.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
});

nextDev.on('close', (code) => {
  console.log(`🔚 Development server exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping development server...');
  nextDev.kill('SIGTERM');
});
