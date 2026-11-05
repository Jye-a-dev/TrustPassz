#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mbUserDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const flutterCmd = isWin ? 'flutter.bat' : 'flutter';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

function runSilent(cmd) {
  try {
    return execSync(cmd, { cwd: mbUserDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function resolveEmulatorPath() {
  const candidates = [
    'emulator',
    process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'emulator', isWin ? 'emulator.exe' : 'emulator') : null,
    process.env.ANDROID_SDK_ROOT ? path.join(process.env.ANDROID_SDK_ROOT, 'emulator', isWin ? 'emulator.exe' : 'emulator') : null,
    isWin && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'emulator', 'emulator.exe') : null,
    !isWin ? path.join(process.env.HOME || '', 'Library', 'Android', 'sdk', 'emulator', 'emulator') : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === 'emulator') {
      if (runSilent('emulator -version')) return 'emulator';
    } else if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'emulator';
}

console.log(`${colors.cyan}${colors.bold}[TrustPassz] Starting Mobile Fast Dev Runner...${colors.reset}`);

const adbOut = runSilent('adb devices') || '';
const hasConnectedDevice = adbOut.split('\n').slice(1).some((l) => /\s+device$/.test(l.trim()));

if (!hasConnectedDevice) {
  const emulatorBin = resolveEmulatorPath();
  const avdsOutput = runSilent(`"${emulatorBin}" -list-avds`) || runSilent(`${flutterCmd} emulators`);
  const avds = (avdsOutput || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.includes('•') && !s.startsWith('List of'));

  if (avds.length > 0) {
    const targetAvd = avds[0];
    console.log(`[TrustPassz] Booting Android AVD: ${colors.bold}${targetAvd}${colors.reset}...`);
    spawn(emulatorBin, ['-avd', targetAvd], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    console.log('[TrustPassz] Waiting for emulator to complete boot...');
    const startTime = Date.now();
    while (Date.now() - startTime < 45000) {
      if (runSilent('adb shell getprop sys.boot_completed') === '1') {
        console.log(`${colors.green}[TrustPassz] AVD boot ready.${colors.reset}`);
        break;
      }
      sleepSync(2000);
    }
  }
}

runSilent('adb reverse tcp:3000 tcp:3000');
runSilent('adb reverse tcp:3001 tcp:3001');

const rawArgs = process.argv.slice(2);
const defaultApiDefine = '--dart-define=API_URL=http://10.0.2.2:3000';
const hasCustomApiUrl = rawArgs.some((arg) => arg.includes('API_URL'));
const hasTargetDevice = rawArgs.some((arg) => arg === '-d' || arg.startsWith('-d=') || arg === '--device');

const launchArgs = [
  'run',
  ...(hasTargetDevice ? [] : ['-d', 'android']),
  ...(hasCustomApiUrl ? [] : [defaultApiDefine]),
  ...rawArgs,
];

console.log(`${colors.green}${colors.bold}[TrustPassz] Hot Reload [r] & Hot Restart [R] enabled.${colors.reset}`);
console.log(`Executing: flutter ${launchArgs.join(' ')}\n`);

const child = spawn(flutterCmd, launchArgs, { cwd: mbUserDir, stdio: 'inherit', shell: isWin });

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

child.on('exit', (c) => process.exit(c ?? 0));
