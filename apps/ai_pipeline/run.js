/**
 * Cross-platform runner for TrustPassz AI Pipeline (FastAPI Uvicorn).
 * Auto-detects virtual environment (.venv / venv) across Windows, Linux, and macOS.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PIPELINE_DIR = path.resolve(__dirname);
const ROOT_DIR = path.resolve(PIPELINE_DIR, '..', '..');
const PORT = process.env.PORT || '3100';

function findPython() {
  const isWin = process.platform === 'win32';
  const pyRelPath = isWin ? path.join('Scripts', 'python.exe') : path.join('bin', 'python');

  // Candidate venv locations in order of priority
  const candidates = [
    path.join(PIPELINE_DIR, '.venv', pyRelPath),
    path.join(PIPELINE_DIR, 'venv', pyRelPath),
    path.join(ROOT_DIR, '.venv', pyRelPath),
    path.join(ROOT_DIR, 'venv', pyRelPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const venvDir = path.dirname(path.dirname(candidate));
      console.log(`[ai_pipeline] Using virtual environment: ${venvDir}`);
      return {
        pythonBin: candidate,
        env: {
          ...process.env,
          VIRTUAL_ENV: venvDir,
          PATH: `${path.dirname(candidate)}${path.delimiter}${process.env.PATH}`,
        },
      };
    }
  }

  // Fallback to system python
  const systemPy = isWin ? 'python' : 'python3';
  console.log(`[ai_pipeline] No local venv detected. Falling back to system '${systemPy}'`);
  return {
    pythonBin: systemPy,
    env: process.env,
  };
}

function start() {
  const { pythonBin, env } = findPython();
  const args = ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', PORT, '--reload'];

  console.log(`[ai_pipeline] Spawning: ${pythonBin} ${args.join(' ')} (PORT: ${PORT})`);

  const proc = spawn(pythonBin, args, {
    cwd: PIPELINE_DIR,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  proc.on('error', (err) => {
    console.error(`[ai_pipeline] Failed to start process:`, err);
    process.exit(1);
  });

  proc.on('close', (code) => {
    process.exit(code ?? 0);
  });

  ['SIGINT', 'SIGTERM'].forEach((sig) => {
    process.on(sig, () => {
      if (proc && !proc.killed) {
        proc.kill(sig);
      }
    });
  });
}

start();
