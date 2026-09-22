const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(ent.name)) files.push(p);
  }
  return files;
}

const paddingPatterns = [
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*40\s*:\s*12/g, 'paddingTop: 12'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*42\s*:\s*12/g, 'paddingTop: 12'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*36\s*:\s*10/g, 'paddingTop: 12'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*40\s*:\s*20/g, 'paddingTop: 16'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*40\s*:\s*16/g, 'paddingTop: 16'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*24\s*:\s*0/g, 'paddingTop: 0'],
  [/paddingTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*12\s*:\s*8/g, 'paddingTop: 12'],
  [/marginTop:\s*Platform\.OS\s*===\s*'android'\s*\?\s*12\s*:\s*4/g, 'marginTop: 8'],
];

function stripSafeAreaFromRnImport(src) {
  return src.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]react-native['"]\s*;/,
    (match, inner) => {
      if (!/\bSafeAreaView\b/.test(inner)) return match;

      const isMultiline = inner.includes('\n');
      const parts = inner
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((p) => p !== 'SafeAreaView');

      if (parts.length === 0) return '';

      if (isMultiline) {
        return `import {\n  ${parts.join(',\n  ')},\n} from 'react-native';`;
      }
      return `import { ${parts.join(', ')} } from 'react-native';`;
    }
  );
}

function ensureAppSafeAreaImport(src) {
  if (src.includes("@/components/AppSafeArea")) return src;
  const importMatch = src.match(/^import .+;$/m);
  if (!importMatch) {
    return `import { AppSafeArea } from '@/components/AppSafeArea';\n${src}`;
  }
  const idx = src.indexOf(importMatch[0]) + importMatch[0].length;
  return (
    src.slice(0, idx) +
    `\nimport { AppSafeArea } from '@/components/AppSafeArea';` +
    src.slice(idx)
  );
}

const files = walk(path.join('src', 'app'));
let changed = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;
  const usesRnSafeArea =
    /import\s*\{[\s\S]*?\bSafeAreaView\b[\s\S]*?\}\s*from\s*['"]react-native['"]/.test(src);

  if (usesRnSafeArea) {
    src = stripSafeAreaFromRnImport(src);
    src = ensureAppSafeAreaImport(src);
    src = src.replace(/<SafeAreaView\b/g, '<AppSafeArea');
    src = src.replace(/<\/SafeAreaView>/g, '</AppSafeArea>');
  }

  for (const [re, rep] of paddingPatterns) {
    src = src.replace(re, rep);
  }

  if (src !== original) {
    fs.writeFileSync(file, src);
    changed += 1;
    console.log('updated:', file);
  }
}

console.log('files changed:', changed);
