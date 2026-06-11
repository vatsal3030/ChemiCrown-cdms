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
let modifiedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  content = content.replace(/className="flex items-center justify-between([^"]*)"/g, (match, rest) => {
    if (rest.includes('flex-col') || rest.includes('flex-wrap') || rest.includes('flex-1') || match.includes('min-h')) return match;
    return `className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4${rest}"`;
  });

  content = content.replace(/className="flex justify-between items-center([^"]*)"/g, (match, rest) => {
    if (rest.includes('flex-col') || rest.includes('flex-wrap') || rest.includes('flex-1') || match.includes('min-h')) return match;
    return `className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4${rest}"`;
  });

  content = content.replace(/className="p-4 border-b border-slate-[^"]* flex items-center justify-between([^"]*)"/g, (match, rest) => {
    return match.replace('flex items-center justify-between', 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4');
  });

  // Filter toolbar containers usually have 'p-4 border-b' or similar
  content = content.replace(/className="([^"]*)flex gap-(\d)([^"]*)"/g, (match, before, gap, after) => {
    if (before.includes('flex-wrap') || after.includes('flex-wrap') || before.includes('flex-col') || after.includes('flex-col')) return match;
    if (before.includes('inline-flex') || after.includes('inline-flex')) return match;
    if (before.includes('page-header')) return match;
    // apply flex-wrap safely
    return `className="${before}flex flex-wrap gap-${gap}${after}"`;
  });

  content = content.replace(/className="([^"]*)flex items-center gap-(\d)([^"]*)"/g, (match, before, gap, after) => {
    if (before.includes('flex-wrap') || after.includes('flex-wrap') || before.includes('flex-col') || after.includes('flex-col')) return match;
    if (before.includes('inline-flex') || after.includes('inline-flex')) return match;
    if (before.includes('page-header')) return match;
    // apply flex-wrap safely
    return `className="${before}flex flex-wrap items-center gap-${gap}${after}"`;
  });

  if (original !== content) {
    console.log(`Modified: ${path.basename(f)}`);
    modifiedCount++;
    fs.writeFileSync(f, content, 'utf8');
  }
});

console.log('Total files modified:', modifiedCount);
