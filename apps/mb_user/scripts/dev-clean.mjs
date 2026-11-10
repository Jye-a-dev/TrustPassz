#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mbUserDir = path.resolve(__dirname, '..');
const androidDir = path.join(mbUserDir, 'android');
const isWin = process.platform === 'win32';
const flutterCmd = isWin ? 'flutter.bat' : 'flutter';
const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bold}[${step}/6] ${message}${colors.reset}`);
}

function runSilent(cmd, cwd = mbUserDir) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removeDirWithRetry(dirPath, maxRetries = 5, retryDelay = 300) {
  if (!fs.existsSync(dirPath)) return;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`  Removed: ${path.relative(mbUserDir, dirPath)}`);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`  [Warning] Failed to delete ${dirPath}: ${err.message}`);
      } else {
        sleepSync(retryDelay);
      }
    }
  }
}

function cleanGradleWrapperLocks() {
  const gradleUserHome = process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle');
  const distsDir = path.join(gradleUserHome, 'wrapper', 'dists');
  const targetHashDir = path.join(distsDir, 'gradle-8.14-bin', '38aieal9i53h9rfe7vjup95b9');

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

        const hasOk = entries.some((f) => f.endsWith('.ok'));
        const lckFiles = entries.filter((f) => f.endsWith('.lck') || f.endsWith('.lock'));
        const partFiles = entries.filter((f) => f.endsWith('.part'));
        const zipFiles = entries.filter((f) => f.endsWith('.zip'));

        // Xóa triệt để các file khóa kẹt (.lck / .lock)
        for (const lck of lckFiles) {
          try {
            fs.unlinkSync(path.join(targetDir, lck));
            console.log(`  Cleared stuck lock: ${dist.name}/${hashDir.name}/${lck}`);
          } catch {}
        }

        // Xóa các file tải dở dang (.part)
        for (const part of partFiles) {
          try {
            fs.unlinkSync(path.join(targetDir, part));
            console.log(`  Purged partial download: ${dist.name}/${hashDir.name}/${part}`);
          } catch {}
        }

        // Nếu thư mục tải dở và không có file .ok xác nhận tính toàn vẹn
        if (!hasOk) {
          const hasOfflineZip = zipFiles.some((zipName) => {
            try {
              return fs.statSync(path.join(targetDir, zipName)).size > 50 * 1024 * 1024;
            } catch {
              return false;
            }
          });

          if (hasOfflineZip) {
            console.log(`  Offline archive detected in: ${dist.name}/${hashDir.name} (ready for Gradle extraction)`);
          } else {
            console.log(`  Purging incomplete download cache: ${dist.name}/${hashDir.name}`);
            try {
              fs.rmSync(targetDir, { recursive: true, force: true });
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.warn(`  [Notice] Gradle wrapper lock check skipped: ${err.message}`);
  }

  // Hướng dẫn cơ chế offline dự phòng (Fail-safe mechanism)
  const isInstalled = fs.existsSync(path.join(targetHashDir, 'gradle-8.14-bin.zip.ok'));
  if (!isInstalled) {
    console.log(`  ${colors.yellow}[Offline Fail-safe] If offline or network-blocked, copy gradle-8.14-bin.zip to:`);
    console.log(`  -> ${targetHashDir}${colors.reset}`);
  }
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

// -----------------------------------------------------------------------------
// [1/6] Stopping daemons & killing process locks
// -----------------------------------------------------------------------------
logStep(1, 'Stopping Gradle daemons & releasing process locks...');
const gradlewPath = path.join(androidDir, gradlewCmd);
if (fs.existsSync(gradlewPath)) {
  try {
    execSync(`${gradlewCmd} --stop`, { cwd: androidDir, stdio: 'ignore', shell: isWin });
    console.log('  Gradle daemon stopped successfully.');
  } catch {}
}

if (isWin) {
  runSilent('taskkill /F /IM java.exe /T 2>nul');
  runSilent('taskkill /F /IM adb.exe /T 2>nul');
} else {
  runSilent('pkill -9 -f "org.gradle|kotlin-compiler" 2>/dev/null || true');
}

cleanGradleWrapperLocks();
sleepSync(500);

const { adbPath, emulatorPath } = resolveAndroidTools();
const lanIp = getLocalLanIp();

// -----------------------------------------------------------------------------
// [2/6] Cleaning artifacts (Direct purge to prevent respawning daemon before delete)
// -----------------------------------------------------------------------------
logStep(2, 'Cleaning Flutter, Metro & Android build artifacts...');
const purgePaths = [
  path.join(mbUserDir, 'build'),
  path.join(mbUserDir, '.dart_tool'),
  path.join(androidDir, '.gradle'),
  path.join(androidDir, 'app', 'build'),
  path.join(androidDir, '.kotlin'),
  path.join(mbUserDir, 'node_modules', '.cache'),
];

for (const p of purgePaths) {
  removeDirWithRetry(p);
}

try {
  execSync(`${flutterCmd} clean`, { cwd: mbUserDir, stdio: 'ignore', shell: isWin });
  console.log('  Flutter clean completed.');
} catch {}

// -----------------------------------------------------------------------------
// [3/6] Detecting or booting Android Emulator (cross-checked against flutter devices)
// -----------------------------------------------------------------------------
logStep(3, 'Checking connected devices and booting dynamic AVD if needed...');
let connectedDevices = getConnectedDevices(adbPath);

if (connectedDevices.length === 0) {
  console.log('  No connected Android device found. Querying available AVDs...');
  const avdsOutput = runSilent(`"${emulatorPath}" -list-avds`) || runSilent(`${flutterCmd} emulators`);
  const avds = (avdsOutput || '')
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !name.includes('•') && !name.startsWith('List of'));

  if (avds.length === 0) {
    console.log(`${colors.yellow}  No physical device or local AVD detected. Flutter will wait for target.${colors.reset}`);
  } else {
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
  }
} else {
  console.log(`${colors.green}  Active Android device/emulator detected: ${connectedDevices.map((d) => d.id).join(', ')}${colors.reset}`);
}

// Log detected Flutter devices
const flutterDevList = runSilent(`${flutterCmd} devices`);
console.log(`  Available targets:\n${flutterDevList ? '  ' + flutterDevList.split('\n').join('\n  ') : '  None'}`);

// Reverse ports for backend communication
runSilent(`"${adbPath}" reverse tcp:3000 tcp:3000`);
runSilent(`"${adbPath}" reverse tcp:3001 tcp:3001`);
console.log('  Reverse port forwarding active (3000 -> 3000, 3001 -> 3001).');

// -----------------------------------------------------------------------------
// [4/6] Uninstalling old package (com.trustpassz.mb_user.mb_user)
// -----------------------------------------------------------------------------
logStep(4, 'Uninstalling old package (com.trustpassz.mb_user.mb_user)...');
try {
  const res = runSilent(`"${adbPath}" uninstall com.trustpassz.mb_user.mb_user`);
  if (res && res.includes('Success')) {
    console.log('  Existing package uninstalled successfully.');
  } else {
    console.log('  No prior package installation found on device.');
  }
} catch {
  console.log('  Device offline or package not installed, continuing.');
}

// -----------------------------------------------------------------------------
// [5/6] Restoring dependencies (flutter pub get)
// -----------------------------------------------------------------------------
logStep(5, 'Restoring dependencies (flutter pub get)...');
try {
  execSync(`${flutterCmd} pub get`, { cwd: mbUserDir, stdio: 'inherit', shell: isWin });
} catch (err) {
  console.error(`${colors.red}Error executing flutter pub get:${colors.reset}`, err.message);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// [6/6] Launching Flutter app with custom environment flags
// -----------------------------------------------------------------------------
logStep(6, 'Launching Flutter app with interactive Hot Reload...');
const rawArgs = process.argv.slice(2);
const hasTargetDevice = rawArgs.some((arg) => arg === '-d' || arg.startsWith('-d=') || arg === '--device');
const hasCustomApiUrl = rawArgs.some((arg) => arg.includes('API_URL'));

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
