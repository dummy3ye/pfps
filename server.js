const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { scanLibrary, getFileData, formatBytes } = require('./sync');
const sizeOf = require('image-size');

const app = express();
const port = 3000;

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'General';
    const dir = path.join(__dirname, 'library', category);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const name = req.body.name || path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));
app.use(express.json());

// Serve upload.html on /upload route
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload.html'));
});

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const categoryName = req.body.category || 'General';
  const fileName = req.file.filename;
  const imagePath = path.join(req.file.destination, fileName); // Full path where image is saved
  const relativePath = path.relative(__dirname, imagePath).replace(/\\/g, '/'); // Relative path for data.json

  // Prepare metadata from request body
  const newTags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [];
  const newSource = req.body.source || '';

  // Construct a new image data object using getFileData or similar logic
  // It's more direct to create the object here and then populate it with file stats
  let imageData = {
    name: path.parse(fileName).name,
    path: relativePath,
    resolution: '', // Will be filled from sizeOf
    size: '',       // Will be filled from file stats
    dateAdded: new Date().toISOString().split('T')[0], // Current date
    tags: newTags,
    source: newSource
  };

  try {
    const stats = fs.statSync(imagePath);
    imageData.size = formatBytes(stats.size);
    imageData.dateAdded = stats.birthtime.toISOString().split('T')[0];
    const dimensions = sizeOf(imagePath);
    imageData.resolution = `${dimensions.width}x${dimensions.height}`;
  } catch (err) {
    console.error("Error getting file stats or dimensions for new upload:", err);
  }

  const dataFilePath = path.join(__dirname, 'data.json');
  let currentData = {};
  if (fs.existsSync(dataFilePath)) {
    try { currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8')); } catch (e) {
      console.error("Error reading existing data.json for upload:", e.message);
    }
  }

  // Ensure the category exists
  if (!currentData[categoryName]) {
    currentData[categoryName] = [];
  }

  // Add the new image data to the category
  currentData[categoryName].push(imageData);

  // Write updated data.json
  fs.writeFileSync(dataFilePath, JSON.stringify(currentData, null, 2));

  console.log(`New image ${fileName} uploaded and metadata saved to data.json.`);

  res.json({ success: true, path: relativePath, message: "Image uploaded and metadata saved." });
});

app.post('/api/metadata', (req, res) => {
  const { imagePath, tags, source } = req.body;

  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'Image path is required.' });
  }

  const dataFilePath = path.join(__dirname, 'data.json');
  let currentData = {};

  if (fs.existsSync(dataFilePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (e) {
      console.error("Error reading data.json for metadata update:", e.message);
      return res.status(500).json({ success: false, message: 'Failed to read data.json.' });
    }
  } else {
    return res.status(404).json({ success: false, message: 'data.json not found.' });
  }

  let imageFound = false;
  // Iterate through categories to find the image
  for (const category in currentData) {
    const images = currentData[category];
    const imageIndex = images.findIndex(img => img.path === imagePath);

    if (imageIndex !== -1) {
      // Update tags
      if (Array.isArray(tags)) {
        currentData[category][imageIndex].tags = tags.map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        currentData[category][imageIndex].tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }

      // Update source
      if (typeof source === 'string') {
        currentData[category][imageIndex].source = source;
      }
      imageFound = true;
      break; // Image found and updated, exit loop
    }
  }

  if (!imageFound) {
    return res.status(404).json({ success: false, message: `Image with path ${imagePath} not found.` });
  }

  // Write updated data.json
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(currentData, null, 2));
    res.json({ success: true, message: `Metadata for ${imagePath} updated successfully.` });
  } catch (e) {
    console.error("Error writing updated data.json:", e.message);
    res.status(500).json({ success: false, message: 'Failed to write updated data.json.' });
  }
});

app.listen(port, () => {
  console.log(`\n--- Local Dev Server Running ---`);
  console.log(`URL: http://localhost:${port}`);
  console.log(`Upload functionality enabled.\n`);
});
