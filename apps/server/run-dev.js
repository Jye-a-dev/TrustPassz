const { spawn } = require('child_process');
const path = require('path');

const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --experimental-require-module`.trim(),
};

const nestBin = path.resolve(__dirname, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const child = spawn(process.execPath, [nestBin, 'start', '--watch', ...process.argv.slice(2)], {
  cwd: __dirname,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));

