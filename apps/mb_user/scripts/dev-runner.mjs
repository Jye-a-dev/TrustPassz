#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolveGoogleWebClientId } from './env-helpers.mjs';

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

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function cleanGradleWrapperLocks() {
  const gradleUserHome = process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle');
  const distsDir = path.join(gradleUserHome, 'wrapper', 'dists');
  if (!fs.existsSync(distsDir)) return;
  try {
    const distFolders = fs.readdirSync(distsDir, { withFileTypes: true });
    for (const dist of distFolders) {
      if (!dist.isDirectory()) continue;
      const distPath = path.join(distsDir, dist.name);
      const hashFolders = fs.readdirSync(distPath, { withFileTypes: true });
      for (const hashDir of hashFolders) {
        if (!hashDir.isDirectory()) continue;
        const targetDir = path.join(distPath, hashDir.name);
        const entries = fs.readdirSync(targetDir);
        for (const file of entries) {
          if (file.endsWith('.lck') || file.endsWith('.lock')) {
            try {
              fs.unlinkSync(path.join(targetDir, file));
            } catch {}
          }
        }
      }
    }
  } catch {}
}

function resolveAndroidTools() {
  const isWindows = process.platform === 'win32';
  const adbBinName = isWindows ? 'adb.exe' : 'adb';
  const emulatorBinName = isWindows ? 'emulator.exe' : 'emulator';

  const sdkCandidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWindows && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
    isWindows ? 'C:\\Android\\Sdk' : null,
    isWindows ? 'D:\\Android\\Sdk' : null,
    !isWindows ? path.join(process.env.HOME || '', 'Library', 'Android', 'sdk') : null,
    !isWindows ? path.join(process.env.HOME || '', 'Android', 'Sdk') : null,
  ].filter(Boolean);

  let adbPath = 'adb';
  let emulatorPath = 'emulator';

  for (const sdk of sdkCandidates) {
    if (!fs.existsSync(sdk)) continue;
    const candidateAdb = path.join(sdk, 'platform-tools', adbBinName);
    const candidateEmulator = path.join(sdk, 'emulator', emulatorBinName);

    if (fs.existsSync(candidateAdb)) {
      adbPath = candidateAdb;
      const platformToolsDir = path.dirname(candidateAdb);
      if (!process.env.PATH.includes(platformToolsDir)) {
        process.env.PATH = `${platformToolsDir}${path.delimiter}${process.env.PATH}`;
      }
    }
    if (fs.existsSync(candidateEmulator)) {
      emulatorPath = candidateEmulator;
      const emulatorDir = path.dirname(candidateEmulator);
      if (!process.env.PATH.includes(emulatorDir)) {
        process.env.PATH = `${emulatorDir}${path.delimiter}${process.env.PATH}`;
      }
    }
    if (adbPath !== 'adb' && emulatorPath !== 'emulator') break;
  }

  return { adbPath, emulatorPath };
}

function runSilent(cmd, cwd = mbUserDir) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function getLocalLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('127.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function getConnectedDevices(adbPath) {
  const out = runSilent(`"${adbPath}" devices -l`);
  if (!out) return [];
  const lines = out.split('\n').slice(1);
  const devices = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('*')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[1] === 'device') {
      const id = parts[0];
      const isEmulator = id.startsWith('emulator-');
      devices.push({ id, isEmulator, raw: trimmed });
    }
  }
  return devices;
}

console.log(`${colors.cyan}${colors.bold}[TrustPassz] Starting Mobile Fast Dev Runner...${colors.reset}`);

// Clear any orphaned Gradle locks before resolving tools
cleanGradleWrapperLocks();

const { adbPath, emulatorPath } = resolveAndroidTools();
const lanIp = getLocalLanIp();
console.log(`  Local LAN IP detected: ${colors.bold}${lanIp}${colors.reset}`);

let connectedDevices = getConnectedDevices(adbPath);

if (connectedDevices.length === 0) {
  console.log('  No active device detected. Scanning for available Android AVDs...');
  const avdsOutput = runSilent(`"${emulatorPath}" -list-avds`) || runSilent(`${flutterCmd} emulators`);
  const avds = (avdsOutput || '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.includes('•') && !s.startsWith('List of'));

  if (avds.length > 0) {
    const targetAvd = avds[0];
    console.log(`  Booting dynamic AVD: ${colors.bold}${targetAvd}${colors.reset}...`);
    spawn(emulatorPath, ['-avd', targetAvd], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    console.log('  Waiting for emulator boot completion...');
    let isBooted = false;
    const startTime = Date.now();
    const bootTimeoutMs = 60000;

    while (Date.now() - startTime < bootTimeoutMs) {
      if (runSilent(`"${adbPath}" shell getprop sys.boot_completed`) === '1') {
        isBooted = true;
        break;
      }
      sleepSync(2000);
    }

    if (isBooted) {
      console.log(`${colors.green}  AVD boot verified successfully.${colors.reset}`);
      sleepSync(1000);
    } else {
      console.log(`${colors.yellow}  Boot poll timeout reached. Proceeding with launch...${colors.reset}`);
    }

    connectedDevices = getConnectedDevices(adbPath);
  } else {
    console.log(`${colors.yellow}  No local AVD found. Flutter will search for targets.${colors.reset}`);
  }
} else {
  console.log(`${colors.green}  Active device detected: ${connectedDevices.map((d) => d.id).join(', ')}${colors.reset}`);
}

// Reverse ports for seamless API communication
runSilent(`"${adbPath}" reverse tcp:3000 tcp:3000`);
runSilent(`"${adbPath}" reverse tcp:3001 tcp:3001`);
console.log('  Reverse port forwarding active (3000 -> 3000, 3001 -> 3001).');

const rawArgs = process.argv.slice(2);
const hasTargetDevice = rawArgs.some((arg) => arg === '-d' || arg.startsWith('-d=') || arg === '--device');
const hasCustomApiUrl = rawArgs.some((arg) => arg.includes('API_URL'));
const hasCustomGoogleClientId = rawArgs.some((arg) => arg.includes('GOOGLE_WEB_CLIENT_ID'));
const googleWebClientId = hasCustomGoogleClientId ? '' : resolveGoogleWebClientId(mbUserDir);

const hasEmulator = connectedDevices.some((d) => d.isEmulator);
const isPhysicalDevice = connectedDevices.length > 0 && !hasEmulator;

let defaultApiUrl;
if (isPhysicalDevice) {
  defaultApiUrl = 'http://localhost:3000';
} else {
  defaultApiUrl = 'http://10.0.2.2:3000';
}

const dynamicDefines = [
  ...(hasCustomApiUrl ? [] : [`--dart-define=API_URL=${defaultApiUrl}`]),
  ...(googleWebClientId ? [`--dart-define=GOOGLE_WEB_CLIENT_ID=${googleWebClientId}`] : []),
  `--dart-define=LAN_IP=${lanIp}`,
  `--dart-define=BACKEND_PORT=3000`,
  `--dart-define=IS_PHYSICAL_DEVICE=${isPhysicalDevice}`,
];

const targetDeviceArgs = [];
if (!hasTargetDevice) {
  if (connectedDevices.length > 0) {
    targetDeviceArgs.push('-d', connectedDevices[0].id);
  } else {
    targetDeviceArgs.push('-d', 'android');
  }
}

const launchArgs = [
  'run',
  '--android-skip-build-dependency-validation',
  ...targetDeviceArgs,
  ...dynamicDefines,
  ...rawArgs,
];

console.log(`${colors.green}${colors.bold}[TrustPassz] Hot Reload [r] & Hot Restart [R] enabled.${colors.reset}`);
console.log(`Executing: flutter ${launchArgs.join(' ')}\n`);

const child = spawn(flutterCmd, launchArgs, {
  cwd: mbUserDir,
  stdio: 'inherit',
  shell: isWin,
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
