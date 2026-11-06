const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mbDir = path.resolve(__dirname, '../../..', 'apps', 'mb_user');
const userArgs = process.argv.slice(2);

if (!fs.existsSync(mbDir)) {
  console.error(`[TrustPassz] Không tìm thấy thư mục ứng dụng di động tại: ${mbDir}`);
  process.exit(1);
}

const isInfoQuery = userArgs.some((arg) => ['--help', '-h', '--version', '-v'].includes(arg));
const subcommands = ['build', 'doctor', 'devices', 'test', 'clean', 'pub', 'emulators', 'analyze'];
const isSubcommandOnly = userArgs.length > 0 && subcommands.includes(userArgs[0]);

// If running dev runner or no subcommand specified, delegate to dynamic dev-runner.mjs
if (!isInfoQuery && !isSubcommandOnly) {
  const runnerScript = path.join(mbDir, 'scripts', 'dev-runner.mjs');
  const runnerArgs = userArgs[0] === 'run' ? userArgs.slice(1) : userArgs;

  const child = spawn(process.execPath, [runnerScript, ...runnerArgs], {
    cwd: mbDir,
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error('[TrustPassz] Lỗi khi thực thi dev-runner:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else {
  // Direct Flutter passthrough for CLI utilities (test, analyze, doctor, etc.)
  const isWin = process.platform === 'win32';
  const flutterCmd = isWin ? 'flutter.bat' : 'flutter';

  console.log(`[TrustPassz] Chạy: flutter ${userArgs.join(' ')}`);
  const child = spawn(flutterCmd, userArgs, {
    cwd: mbDir,
    stdio: 'inherit',
    shell: isWin,
  });

  child.on('error', (err) => {
    console.error('[TrustPassz] Lỗi khi thực thi lệnh Flutter:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
