#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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
} else {
  runSilent('pkill -9 -f "org.gradle|kotlin-compiler" 2>/dev/null || true');
}
sleepSync(500); // Buffer for Windows NTFS handle release

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
logStep(3, 'Checking connected devices (flutter & adb devices)...');

function isDeviceOnline() {
  const adbOut = runSilent('adb devices');
  if (!adbOut) return false;
  return adbOut.split('\n').slice(1).some((line) => /\s+device$/.test(line.trim()));
}

if (!isDeviceOnline()) {
  const emulatorBin = resolveEmulatorPath();
  const avdsOutput = runSilent(`"${emulatorBin}" -list-avds`) || runSilent(`${flutterCmd} emulators`);
  const avds = (avdsOutput || '')
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !name.includes('•') && !name.startsWith('List of'));

  if (avds.length === 0) {
    console.log(`${colors.yellow}  No physical device or local AVD detected. Flutter will wait for target.${colors.reset}`);
  } else {
    const targetAvd = avds[0];
    console.log(`  Booting dynamic AVD: ${colors.bold}${targetAvd}${colors.reset}...`);
    spawn(emulatorBin, ['-avd', targetAvd], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    console.log('  Waiting for emulator boot completion...');
    let isBooted = false;
    const startTime = Date.now();
    const bootTimeoutMs = 60000;

    while (Date.now() - startTime < bootTimeoutMs) {
      if (runSilent('adb shell getprop sys.boot_completed') === '1') {
        isBooted = true;
        break;
      }
      sleepSync(2000);
    }

    if (isBooted) {
      console.log(`${colors.green}  AVD boot verified successfully.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}  Boot poll timeout reached. Proceeding with launch...${colors.reset}`);
    }
  }
} else {
  console.log(`${colors.green}  Active Android device/emulator detected.${colors.reset}`);
}

// Log detected Flutter devices
const flutterDevList = runSilent(`${flutterCmd} devices`);
console.log(`  Available targets:\n${flutterDevList ? '  ' + flutterDevList.split('\n').join('\n  ') : '  None'}`);

// Reverse ports for backend communication
runSilent('adb reverse tcp:3000 tcp:3000');
runSilent('adb reverse tcp:3001 tcp:3001');

// -----------------------------------------------------------------------------
// [4/6] Uninstalling old package (com.trustpassz.mobile)
// -----------------------------------------------------------------------------
logStep(4, 'Uninstalling old package (com.trustpassz.mobile)...');
try {
  const res = runSilent('adb uninstall com.trustpassz.mobile');
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
