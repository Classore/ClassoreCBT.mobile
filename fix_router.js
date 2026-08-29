const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('router.back()')) {
    // A safe approach: split the file by 'router.back()'
    // and manually reconstruct it, checking the prefix.
    const parts = content.split('router.back()');
    let newContent = parts[0];
    
    for (let i = 1; i < parts.length; i++) {
        const prefix = parts[i-1];
        // check if prefix ends with 'router.canGoBack() ? '
        if (prefix.trimEnd().endsWith('router.canGoBack() ?')) {
            newContent += 'router.back()' + parts[i];
        } else {
            newContent += "(router.canGoBack() ? router.back() : router.replace('/'))" + parts[i];
        }
    }
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated ' + file);
      count++;
    }
  }
});
console.log('Done! Updated ' + count + ' files.');
