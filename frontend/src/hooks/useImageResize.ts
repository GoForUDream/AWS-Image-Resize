import { useState, useCallback } from 'react';
import { config } from '../config';

interface ResizedImage {
  key: string;
  downloadUrl: string;
  width: number;
  height: number;
  size: number;
}

interface UseImageResizeReturn {
  isUploading: boolean;
  isProcessing: boolean;
  resizedImages: ResizedImage[];
  error: string | null;
  uploadAndResize: (file: File, width?: number, height?: number) => Promise<void>;
  reset: () => void;
}

export function useImageResize(): UseImageResizeReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizedImages, setResizedImages] = useState<ResizedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, setUploadKey] = useState<string | null>(null);

  const pollForResults = useCallback(async (key: string) => {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `${config.apiEndpoint}/status/${encodeURIComponent(key)}`
        );
        const data = await response.json();

        if (data.status === 'complete' && data.images.length > 0) {
          setResizedImages(data.images);
          setIsProcessing(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (err) {
        console.error('Polling error:', err);
      }
    }

    setError('Processing timeout. Please try again.');
    setIsProcessing(false);
  }, []);

  const uploadToAws = useCallback(
    async (file: File) => {
      // Get presigned URL for upload
      const presignResponse = await fetch(`${config.apiEndpoint}/presign/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignResponse.json();
      setUploadKey(key);

      // Upload directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      return key;
    },
    []
  );

  const uploadToLocal = useCallback(async (file: File, width: number, height: number) => {
    const formData = new FormData();
    formData.append('image', file);
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

    return [
      {
        key: 'local',
        downloadUrl: url,
        width,
        height,
        size: blob.size,
      },
    ];
  }, []);

  const uploadAndResize = useCallback(
    async (file: File, width = 640, height = 480) => {
      setIsUploading(true);
      setError(null);
      setResizedImages([]);

      try {
        if (config.useAws) {
          // AWS mode: upload to S3 and poll for results
          const key = await uploadToAws(file);
          setIsUploading(false);
          setIsProcessing(true);
          await pollForResults(key);
        } else {
          // Local mode: direct upload to backend
          const images = await uploadToLocal(file, width, height);
          setResizedImages(images);
          setIsUploading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsUploading(false);
        setIsProcessing(false);
      }
    },
    [uploadToAws, uploadToLocal, pollForResults]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setIsProcessing(false);
    setResizedImages([]);
    setError(null);
    setUploadKey(null);
  }, []);

  return {
    isUploading,
    isProcessing,
    resizedImages,
    error,
    uploadAndResize,
    reset,
  };
}
