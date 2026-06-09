const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\pages', (filePath) => {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        // Expand modals/containers to be much larger and more landscape
        content = content.replace(/max-w-sm/g, 'max-w-xl');
        content = content.replace(/max-w-md/g, 'max-w-2xl');
        content = content.replace(/max-w-lg/g, 'max-w-4xl');
        content = content.replace(/max-w-xl/g, 'max-w-4xl');
        content = content.replace(/max-w-2xl/g, 'max-w-5xl');
        content = content.replace(/max-w-3xl/g, 'max-w-6xl');
        // Except don't do this for the Home page or standard prose containers
        if (!filePath.endsWith('Home.jsx') && !filePath.endsWith('NotFound.jsx')) {
            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Expanded ' + filePath);
            }
        }
    }
});
