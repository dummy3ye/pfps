const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const libraryDir = path.join(__dirname, 'library');
const outputFile = path.join(__dirname, 'data.json');


const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileData(filePath, fileName, category, existingImageData = {}) {
  const stats = fs.statSync(filePath);
  let dimensions = { width: 0, height: 0 };
  
  try { dimensions = sizeOf(filePath); } catch (err) {}

  const relativePath = category ? `library/${category}/${fileName}` : `library/${fileName}`;
  
  // Use existing tags and source from data.json if available
  const tags = existingImageData.tags || [];
  const source = existingImageData.source || '';

  return {
    name: path.parse(fileName).name,
    path: relativePath,
    resolution: `${dimensions.width}x${dimensions.height}`,
    size: formatBytes(stats.size),
    dateAdded: stats.birthtime.toISOString().split('T')[0],
    tags: tags,
    source: source
  };
}

function scanLibrary() {
  const categories = {};
  let existingData = {}; // To hold existing data.json content to preserve tags/source

  if (fs.existsSync(outputFile)) {
    try { 
      const currentData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      // Flatten existingData for easy lookup by path
      for (const cat in currentData) {
        currentData[cat].forEach(img => {
          existingData[img.path] = img;
        });
      }
    } catch (e) {
      console.error("Error reading existing data.json:", e.message);
    }
  }

  if (!fs.existsSync(libraryDir)) fs.mkdirSync(libraryDir);

  const items = fs.readdirSync(libraryDir);
  items.forEach(item => {
    const itemPath = path.join(libraryDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const images = fs.readdirSync(itemPath)
        .filter(file => supportedExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => {
          const relativePath = `library/${item}/${file}`;
          return getFileData(path.join(itemPath, file), file, item, existingData[relativePath]);
        });
      if (images.length > 0) categories[item] = images;
    }
  });

  const rootImages = items
    .filter(item => fs.statSync(path.join(libraryDir, item)).isFile() && supportedExtensions.includes(path.extname(item).toLowerCase()))
    .map(file => {
      const relativePath = `library/${file}`;
      return getFileData(path.join(libraryDir, file), file, null, existingData[relativePath]);
    });

  if (rootImages.length > 0) categories['General'] = rootImages;

  fs.writeFileSync(outputFile, JSON.stringify(categories, null, 2));
  console.log(`Successfully generated data.json.`);
}

if (require.main === module) {
  scanLibrary();
}
module.exports = { scanLibrary, getFileData, formatBytes };
