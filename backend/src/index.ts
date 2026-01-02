import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Image resize endpoint
app.post('/api/resize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const width = parseInt(req.body.width) || 640;
    const height = parseInt(req.body.height) || 480;

    // Validate dimensions
    if (width < 1 || width > 4096 || height < 1 || height > 4096) {
      return res.status(400).json({ error: 'Invalid dimensions. Must be between 1 and 4096.' });
    }

    console.log(`Resizing image to ${width}x${height}`);

    // Resize the image using sharp
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Send the resized image back
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="resized.jpg"',
    });

    res.send(resizedBuffer);
  } catch (error) {
    console.error('Error resizing image:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Ready to resize images!');
});
