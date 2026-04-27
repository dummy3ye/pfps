const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

function tagImage() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage:');
        console.log('  npm run tag <name/path> "tag1, tag2"');
        console.log('  npm run tag <name/path> "tag1, tag2" - "Source Name"');
        console.log('  npm run tag <name/path> -s "Source Name"');
        process.exit(1);
    }

    const input = args[0];
    const remainingArgs = args.slice(1).join(' ');
    
    let newTags = null;
    let newSource = null;

    // Parse tags and source
    if (remainingArgs.includes(' -s ')) {
        const parts = remainingArgs.split(' -s ');
        if (parts[0].trim()) newTags = parts[0].split(',').map(t => t.trim()).filter(t => t.length > 0);
        newSource = parts[1].trim().replace(/^["']|["']$/g, '');
    } else if (remainingArgs.includes(' - ')) {
        const parts = remainingArgs.split(' - ');
        if (parts[0].trim()) newTags = parts[0].split(',').map(t => t.trim()).filter(t => t.length > 0);
        newSource = parts[1].trim().replace(/^["']|["']$/g, '');
    } else if (remainingArgs.startsWith('-s ')) {
        newSource = remainingArgs.replace('-s ', '').trim().replace(/^["']|["']$/g, '');
    } else if (remainingArgs.trim()) {
        newTags = remainingArgs.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    if (!fs.existsSync(dataFile)) {
        console.error('Error: data.json not found. Run "npm run sync" first.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    let normalizedPath = input.replace(/\\/g, '/');
    
    let found = false;
    let targetPath = '';

    for (const category in data) {
        let imageIndex = data[category].findIndex(img => img.path === normalizedPath || img.path === 'library/' + normalizedPath);
        
        if (imageIndex === -1) {
            imageIndex = data[category].findIndex(img => img.name === input);
        }

        if (imageIndex !== -1) {
            if (newTags !== null) data[category][imageIndex].tags = newTags;
            if (newSource !== null) data[category][imageIndex].source = newSource;
            targetPath = data[category][imageIndex].path;
            found = true;
            break;
        }
    }

    if (found) {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        let msg = `Successfully updated [${targetPath}]`;
        if (newTags !== null) msg += ` with tags: ${newTags.join(', ')}`;
        if (newSource !== null) msg += ` and source: ${newSource}`;
        console.log(msg);
    } else {
        console.error(`Error: Image "${input}" not found in data.json.`);
    }
}

tagImage();
