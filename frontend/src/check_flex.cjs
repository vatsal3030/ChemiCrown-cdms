const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('e:/Internship_Project/ChemiCrown-cdms/frontend/src/pages');

console.log('Flex containers missing flex-wrap / flex-col:');
let total = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/className=["'][^"']*flex[^"']*gap-\d[^"']*["']/g);
  if (matches) {
    matches.forEach(m => {
      if (!m.includes('flex-wrap') && !m.includes('flex-col') && m.includes('items-center') && !m.includes('flex-1') && !m.includes('page-header')) {
        console.log(`- [ ] ${path.basename(f)}: ${m}`);
        total++;
      }
    });
  }
});
console.log('Total:', total);
