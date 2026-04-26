const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

function listImages() {
    if (!fs.existsSync(dataFile)) {
        console.error('Error: data.json not found. Run "npm run sync" first.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // Simple argument parsing for --catagory_name
    const args = process.argv.slice(2);
    const catArg = args.find(arg => arg.startsWith('--catagory='));
    const targetCategory = catArg ? catArg.split('=')[1] : null;

    if (targetCategory) {
        if (data[targetCategory]) {
            console.log(`\nListing images in [${targetCategory}]:`);
            console.table(data[targetCategory].map(img => ({ Name: img.name, Path: img.path })));
        } else {
            console.error(`Error: Category "${targetCategory}" not found.`);
            console.log('Available categories:', Object.keys(data).join(', '));
        }
    } else {
        console.log('\nListing all categories and image counts:');
        const summary = Object.keys(data).map(cat => ({
            Category: cat,
            Count: data[cat].length
        }));
        console.table(summary);
        console.log('\nUse --catagory_name=<name> to list specific images.');
    }
}

listImages();
