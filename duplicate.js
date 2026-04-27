const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const libraryDir = path.join(__dirname, 'library');
const filesMap = new Map();

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(libraryDir);

allFiles.forEach(file => {
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) return;

  try {
    const stats = fs.statSync(file);
    const dimensions = sizeOf(file);
    const key = `${stats.size}-${dimensions.width}x${dimensions.height}`;

    if (filesMap.has(key)) {
      console.log(`Duplicate found!`);
      console.log(`Original: ${filesMap.get(key)}`);
      console.log(`Duplicate: ${file}`);
      console.log('---');
    } else {
      filesMap.set(key, file);
    }
  } catch (err) {
    // Skip files that might not be images or have issues
  }
});
