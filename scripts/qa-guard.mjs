import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const fail = (message) => {
  console.error(`qa:guard FAIL: ${message}`);
  process.exitCode = 1;
};
const requiredDocs = [
  'QUALITY_GATE.md', 'TEST_PLAN.md', 'ACCEPTANCE_CHECKLIST.md',
  'ACCEPTANCE_REPORT_TEMPLATE.md', 'ACCEPTANCE_REPORT.md', 'PROGRESSIVE_DELIVERY.md', 'PLAYWRIGHT_CASES.md', 'ANIMATION_SPEC.md',
];
for (const name of requiredDocs) {
  try { readFileSync(join('docs', name), 'utf8'); } catch { fail(`缺少 docs/${name}`); }
}
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
for (const script of ['test:unit', 'test:coverage', 'test:e2e', 'qa:full']) {
  if (!packageJson.scripts[script]) fail(`缺少 ${script} 脚本`);
}
const listFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? listFiles(path) : [path];
});
const tests = listFiles('src').filter((path) => path.endsWith('.test.ts') || path.endsWith('.test.tsx'));
if (!tests.some((path) => readFileSync(path, 'utf8').includes('validateInput'))) fail('单测必须覆盖 validateInput');
const styles = listFiles('src').filter((path) => path.endsWith('.css') || path.endsWith('.module.css'));
if (styles.some((path) => /purple|#800080|#7e22ce/i.test(readFileSync(path, 'utf8')))) fail('样式中出现紫色 token');
for (const file of ['tests/e2e/acceptance.spec.ts', 'playwright.config.ts', 'public/assets/qrcode-community.png']) {
  try { readFileSync(file); } catch { fail(`缺少 ${file}`); }
}
if (process.exitCode) process.exit();
console.log('qa:guard PASS：文档、测试、无障碍资源、主题约束齐全。');
