import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ResizeOptions } from './components/ResizeOptions';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResizedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleResize = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResizedImage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      const response = await fetch('http://localhost:3001/api/resize', {
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

  const handleDownload = useCallback(() => {
    if (!resizedImage || !selectedFile) return;

    const link = document.createElement('a');
    link.href = resizedImage;
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${originalName}_${width}x${height}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resizedImage, selectedFile, width, height]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setOriginalPreview(null);
    setResizedImage(null);
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
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {!selectedFile ? (
            <ImageUploader onImageSelect={handleImageSelect} />
          ) : (
            <>
              <ResizeOptions
                width={width}
                height={height}
                onWidthChange={setWidth}
                onHeightChange={setHeight}
                onResize={handleResize}
                isProcessing={isProcessing}
              />

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
