import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ResizeOptions } from './components/ResizeOptions';
import { config } from './config';

interface ResizedImage {
  key: string;
  downloadUrl: string;
  width: number;
  height: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [resizedImages, setResizedImages] = useState<ResizedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResizedImage(null);
    setResizedImages([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // AWS mode: Upload to S3 via presigned URL, then poll for results
  const handleResizeAws = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResizedImage(null);
    setResizedImages([]);

    try {
      // Step 1: Get presigned upload URL
      const presignResponse = await fetch(`${config.apiEndpoint}/presign/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignResponse.json();

      // Step 2: Upload directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      // Step 3: Poll for resized images
      const maxAttempts = 30;
      const pollInterval = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(
          `${config.apiEndpoint}/status?key=${encodeURIComponent(key)}`
        );
        const data = await statusResponse.json();

        if (data.status === 'complete' && data.images.length > 0) {
          setResizedImages(data.images);
          // Set the first image as the preview
          if (data.images.length > 0) {
            setResizedImage(data.images[0].downloadUrl);
          }
          setIsProcessing(false);
          return;
        }
      }

      throw new Error('Processing timeout');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile]);

  // Local mode: Upload directly to backend
  const handleResizeLocal = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResizedImage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      const response = await fetch(`${config.apiEndpoint}/api/resize`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to resize image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResizedImage(url);
    } catch (error) {
      console.error('Error resizing image:', error);
      alert('Failed to resize image. Make sure the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, width, height]);

  const handleResize = config.useAws ? handleResizeAws : handleResizeLocal;

  const handleDownload = useCallback(async () => {
    if (!resizedImage || !selectedFile) return;

    try {
      // Fetch image as blob to handle cross-origin (CloudFront) downloads
      const response = await fetch(resizedImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
      link.download = `${originalName}_resized.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(resizedImage, '_blank');
    }
  }, [resizedImage, selectedFile]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setOriginalPreview(null);
    setResizedImage(null);
    setResizedImages([]);
    setIsProcessing(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            AWS Image Resizer
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Upload an image, choose your dimensions, and download the resized version.
            Powered by AWS for learning purposes.
          </p>
          {config.useAws && (
            <p className="text-xs text-blue-500 mt-2">
              Running in AWS mode (S3 + Lambda + CloudFront)
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {!selectedFile ? (
            <ImageUploader onImageSelect={handleImageSelect} />
          ) : (
            <>
              {!config.useAws && (
                <ResizeOptions
                  width={width}
                  height={height}
                  onWidthChange={setWidth}
                  onHeightChange={setHeight}
                  onResize={handleResize}
                  isProcessing={isProcessing}
                />
              )}

              {config.useAws && !resizedImage && !isProcessing && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    In AWS mode, images are automatically resized to multiple sizes (150, 320, 640, 1024 px)
                  </p>
                  <button
                    onClick={handleResize}
                    className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Upload & Resize
                  </button>
                </div>
              )}

              {/* Show available sizes in AWS mode */}
              {config.useAws && resizedImages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Sizes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {resizedImages.map((img) => (
                      <button
                        key={img.key}
                        onClick={() => setResizedImage(img.downloadUrl)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          resizedImage === img.downloadUrl
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {img.width} x {img.height}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ImagePreview
                originalImage={originalPreview!}
                originalName={selectedFile.name}
                resizedImage={resizedImage}
                isProcessing={isProcessing}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Built for AWS learning purposes</p>
        </div>
      </div>
    </div>
  );
}

export default App;
