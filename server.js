const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { scanLibrary, getFileData, formatBytes } = require('./sync');
const sizeOf = require('image-size');

const app = express();
const port = 3000;

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

app.get('/api/categories', (req, res) => {
  const categories = new Set();
  
  // 1. Get from data.json
  const dataFilePath = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataFilePath)) {
    try {
      const currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      Object.keys(currentData).forEach(cat => categories.add(cat));
    } catch (e) {}
  }

  // 2. Get from physical library folder
  const libraryDir = path.join(__dirname, 'library');
  if (fs.existsSync(libraryDir)) {
    try {
      const items = fs.readdirSync(libraryDir);
      items.forEach(item => {
        if (fs.statSync(path.join(libraryDir, item)).isDirectory()) {
          categories.add(item);
        }
      });
    } catch (e) {}
  }

  res.json(Array.from(categories).sort());
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload.html'));
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const categoryName = req.body.category || 'General';
  const fileName = req.file.filename;
  const imagePath = path.join(req.file.destination, fileName);
  const relativePath = path.relative(__dirname, imagePath).replace(/\\/g, '/');

  const newTags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [];
  const newSource = req.body.source || '';

  let imageData = {
    name: path.parse(fileName).name,
    path: relativePath,
    resolution: '',
    size: '',
    dateAdded: new Date().toISOString().split('T')[0],
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
    console.error("error getting file stats:", err);
  }

  const dataFilePath = path.join(__dirname, 'data.json');
  let currentData = {};
  if (fs.existsSync(dataFilePath)) {
    try { currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8')); } catch (e) {
      console.error("error reading data.json:", e.message);
    }
  }

  if (!currentData[categoryName]) currentData[categoryName] = [];
  currentData[categoryName].push(imageData);

  fs.writeFileSync(dataFilePath, JSON.stringify(currentData, null, 2));
  console.log(`uploaded: ${fileName}`);

  res.json({ success: true, path: relativePath, message: "Image uploaded and metadata saved." });
});

app.post('/api/metadata', (req, res) => {
  const { imagePath, tags, source } = req.body;
  if (!imagePath) return res.status(400).json({ success: false, message: 'Image path is required.' });

  const dataFilePath = path.join(__dirname, 'data.json');
  let currentData = {};

  if (fs.existsSync(dataFilePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to read data.json.' });
    }
  } else {
    return res.status(404).json({ success: false, message: 'data.json not found.' });
  }

  let imageFound = false;
  for (const category in currentData) {
    const images = currentData[category];
    const imageIndex = images.findIndex(img => img.path === imagePath);

    if (imageIndex !== -1) {
      if (Array.isArray(tags)) {
        currentData[category][imageIndex].tags = tags.map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        currentData[category][imageIndex].tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }

      if (typeof source === 'string') currentData[category][imageIndex].source = source;
      imageFound = true;
      break;
    }
  }

  if (!imageFound) return res.status(404).json({ success: false, message: `Image not found.` });

  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(currentData, null, 2));
    res.json({ success: true, message: `Updated successfully.` });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to write updated data.json.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`\n--- Local Dev Server Running ---`);
  console.log(`Local: http://localhost:${port}`);
  console.log(`Network: http://192.168.x.x:${port} (check your local IP)\n`);
});
