/**
 * clean-kotlin-fix.js - Cross-platform Node.js Reset Script for Android/Kotlin Build Locks
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = fs.existsSync(path.join(__dirname, 'android'))
  ? __dirname
  : path.resolve(__dirname, 'apps/mb_user');

console.log(`[TrustPassz] Target directory: ${targetDir}`);

// 1. Stop Gradle Daemon
console.log('[1/4] Stopping Gradle Daemons...');
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradlewPath = path.join(targetDir, 'android', gradlewCmd);
if (fs.existsSync(gradlewPath)) {
  try {
    execSync(`${gradlewCmd} --stop`, { cwd: path.join(targetDir, 'android'), stdio: 'inherit' });
  } catch {
    // Daemon already stopped
  }
}

// 2. Kill locking background processes
console.log('[2/4] Killing locks (java, adb)...');
if (process.platform === 'win32') {
  try {
    execSync('taskkill /F /IM java.exe /IM adb.exe /T 2>nul || exit 0', { shell: 'cmd.exe', stdio: 'ignore' });
  } catch {
    // No active process
  }
} else {
  try {
    execSync('pkill -9 -f java || true; pkill -9 -f adb || true', { stdio: 'ignore' });
  } catch {
    // No active process
  }
}

// 3. Purge corrupted incremental caches and build artifacts
console.log('[3/4] Purging build directories and .tab cache locks...');
const purgeTargets = [
  path.join(targetDir, 'build'),
  path.join(targetDir, '.dart_tool'),
  path.join(targetDir, 'android', '.gradle'),
  path.join(targetDir, 'android', 'app', 'build'),
];

for (const target of purgeTargets) {
  if (fs.existsSync(target)) {
    console.log(`  Removing: ${target}`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// 4. Re-sync dependencies
console.log('[4/4] Fetching Flutter dependencies...');
try {
  const flutterCmd = process.platform === 'win32' ? 'flutter.bat' : 'flutter';
  execSync(`${flutterCmd} pub get`, { cwd: targetDir, stdio: 'inherit' });
} catch (err) {
  console.error('[TrustPassz] flutter pub get failed:', err.message);
  process.exit(1);
}

console.log('[TrustPassz] Reset completed successfully.');

