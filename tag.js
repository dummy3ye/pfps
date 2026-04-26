const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

function tagImage() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: npm run tag <file_path> <tags>');
        console.log('Example: npm run tag library/Rin/rinn.jpeg "anime, bluelock"');
        process.exit(1);
    }

    const filePath = args[0];
    const tagsInput = args.slice(1).join(' ');
    let newTags = tagsInput.split(/[,\s]+/).map(t => t.trim()).filter(t => t.length > 0);

    if (!fs.existsSync(dataFile)) {
        console.error('Error: data.json not found. Run "npm run sync" first.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    let normalizedPath = filePath.replace(/\\/g, '/');
    
    // Ensure path starts with library/
    if (!normalizedPath.startsWith('library/')) {
        normalizedPath = 'library/' + normalizedPath;
    }

    let found = false;
    for (const category in data) {
        const imageIndex = data[category].findIndex(img => img.path === normalizedPath);
        if (imageIndex !== -1) {
            data[category][imageIndex].tags = newTags;
            found = true;
            break;
        }
    }

    if (found) {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        console.log(`Successfully updated [${normalizedPath}] with tags: ${newTags.join(', ')}`);
    } else {
        console.error(`Error: Image path "${normalizedPath}" not found in data.json.`);
        console.log('Make sure the path is correct and you have run "npm run sync".');
    }
}

tagImage();
