const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IGNORE_PATTERNS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  '.turbo',
  '.cache',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'coverage'
]);

function buildTree(dirPath, prefix = '', isLast = true, isRoot = false) {
  const name = path.basename(dirPath);
  let lines = [];

  if (isRoot) {
    lines.push(`📂 ${name}`);
  } else {
    const connector = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${connector}📁 ${name}`);
  }

  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return lines;
  }

  // Lọc thư mục và file bỏ qua
  const filtered = entries.filter(e => !IGNORE_PATTERNS.has(e.name));

  // Tách thư mục và tệp, sắp xếp thư mục trước
  const dirs = filtered.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const files = filtered.filter(e => !e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const allItems = [...dirs, ...files];

  allItems.forEach((item, index) => {
    const itemIsLast = index === allItems.length - 1;
    const itemPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      lines.push(...buildTree(itemPath, childPrefix, itemIsLast, false));
    } else {
      const connector = itemIsLast ? '└── ' : '├── ';
      lines.push(`${childPrefix}${connector}📄 ${item.name}`);
    }
  });

  return lines;
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const treeLines = buildTree(rootDir, '', true, true);
  const markdownContent = '```text\n' + treeLines.join('\n') + '\n```\n';

  const outputFile = path.join(rootDir, 'STRUCTURE.md');
  fs.writeFileSync(outputFile, markdownContent, 'utf8');
  console.log(`[OK] Generated structure at: ${outputFile}`);

  // Copy vào clipboard (hỗ trợ Windows qua clip)
  try {
    const proc = execSync('clip', { input: markdownContent, stdio: ['pipe', 'ignore', 'ignore'] });
    console.log('[OK] Structure copied to clipboard!');
  } catch (e) {
    // Không làm gián đoạn nếu môi trường không có clip
  }
}

main();
