const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mbDir = path.resolve(__dirname, '../../..', 'apps', 'mb_user');
const userArgs = process.argv.slice(2);

if (!fs.existsSync(mbDir)) {
  console.error(`[TrustPassz] Không tìm thấy thư mục ứng dụng di động tại: ${mbDir}`);
  process.exit(1);
}

// Check if an Android device or emulator is already connected via ADB
let hasOnlineDevice = false;
try {
  const adbOutput = execSync('adb devices', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const lines = adbOutput.split('\n').filter(line => line.trim() && !line.startsWith('List of'));
  hasOnlineDevice = lines.some(line => line.includes('\tdevice'));
} catch {
  // ADB not found or errored
}

const flutterCmd = process.platform === 'win32' ? 'flutter.bat' : 'flutter';
const isInfoQuery = userArgs.some((arg) => ['--help', '-h', '--version', '-v'].includes(arg));
const subcommands = ['run', 'build', 'doctor', 'devices', 'test', 'clean', 'pub', 'emulators', 'analyze'];
const hasSubcommand = userArgs.length > 0 && subcommands.includes(userArgs[0]);

// If no target device specified and no Android device is online, launch Pixel_7_API_36
if (!hasOnlineDevice && !userArgs.includes('-d') && !isInfoQuery && !hasSubcommand) {
  try {
    const emulators = execSync(`${flutterCmd} emulators`, { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] });
    const targetEmulator = emulators.includes('Pixel_10_Pro_XL') ? 'Pixel_10_Pro_XL' : (emulators.includes('Pixel_7_API_36') ? 'Pixel_7_API_36' : null);
    if (targetEmulator) {
      console.log(`[TrustPassz] Đang khởi động Android Emulator (${targetEmulator})...`);
      spawn(flutterCmd, ['emulators', '--launch', targetEmulator], {
        detached: true,
        stdio: 'ignore',
        shell: true,
      }).unref();

      console.log('[TrustPassz] Đang chờ thiết bị sẵn sàng...');
      try {
        execSync('adb wait-for-device', { timeout: 15000, stdio: 'ignore' });
      } catch {
        // Fallthrough if adb wait timeout
      }
    }
  } catch {
    // Flutter emulators lookup failed
  }
}

// Reverse ports so emulator / real device can access backend API
try {
  execSync('adb reverse tcp:3000 tcp:3000', { stdio: 'ignore' });
  execSync('adb reverse tcp:3001 tcp:3001', { stdio: 'ignore' });
} catch {
  // Non-fatal if no adb device connected
}

const runArgs = isInfoQuery || hasSubcommand ? userArgs : ['run', ...userArgs];

console.log(`[TrustPassz] Chạy: flutter ${runArgs.join(' ')}`);
const child = spawn(flutterCmd, runArgs, {
  cwd: mbDir,
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error('[TrustPassz] Lỗi khi thực thi lệnh Flutter:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
