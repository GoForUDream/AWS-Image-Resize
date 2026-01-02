# AWS Image Resizer

A web application for uploading and resizing images, built for learning AWS services. Users can upload images, select target dimensions, and download the resized versions.

## Features

- **Drag & Drop Upload**: Intuitive drag-and-drop interface with click-to-browse fallback
- **Image Preview**: Side-by-side comparison of original and resized images
- **Flexible Resizing**: Preset sizes (Thumbnail, Small, Medium, Large) or custom dimensions
- **Instant Download**: One-click download of resized images
- **Responsive UI**: Clean, modern interface that works on desktop and mobile

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS 3 (styling)

### Backend
- Node.js with Express 5
- TypeScript
- Sharp (image processing)
- Multer (file upload handling)

## Project Structure

```
aws-image-resize/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx    # Drag & drop upload component
│   │   │   ├── ImagePreview.tsx     # Image preview with download
│   │   │   └── ResizeOptions.tsx    # Dimension selection controls
│   │   ├── App.tsx                  # Main application component
│   │   └── index.css                # Tailwind CSS imports
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js backend server
│   ├── src/
│   │   └── index.ts                 # Express server with resize API
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd aws-image-resize
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

### Running the Application

1. Start the backend server (runs on port 3001):
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend (runs on port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## API Endpoints

| Method | Endpoint       | Description                    |
|--------|----------------|--------------------------------|
| GET    | /api/health    | Health check                   |
| POST   | /api/resize    | Upload and resize an image     |

### POST /api/resize

**Request:**
- `Content-Type`: multipart/form-data
- `image`: Image file (required)
- `width`: Target width in pixels (optional, default: 640)
- `height`: Target height in pixels (optional, default: 480)

**Response:**
- `Content-Type`: image/jpeg
- Returns the resized image as binary data

## AWS Integration (Planned)

This project is designed as a learning platform for AWS services. Future enhancements will include:

- **Amazon S3**: Store original and resized images
- **AWS Lambda**: Serverless image processing
- **Amazon API Gateway**: RESTful API management
- **Amazon CloudFront**: CDN for fast image delivery
- **AWS IAM**: Secure access management

## License

MIT
