interface ImagePreviewProps {
  originalImage: string;
  originalName: string;
  resizedImage: string | null;
  isProcessing: boolean;
  onDownload: () => void;
  onReset: () => void;
}

export function ImagePreview({
  originalImage,
  originalName,
  resizedImage,
  isProcessing,
  onDownload,
  onReset,
}: ImagePreviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Original</h3>
            <p className="text-xs text-gray-500 truncate">{originalName}</p>
          </div>
          <div className="p-4">
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-48 object-contain bg-gray-100 rounded-lg"
            />
          </div>
        </div>

        {/* Resized Image */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Resized</h3>
            <p className="text-xs text-gray-500">
              {isProcessing ? 'Processing...' : resizedImage ? 'Ready to download' : 'Waiting...'}
            </p>
          </div>
          <div className="p-4">
            {isProcessing ? (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Resizing image...</p>
                </div>
              </div>
            ) : resizedImage ? (
              <img
                src={resizedImage}
                alt="Resized"
                className="w-full h-48 object-contain bg-gray-100 rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-sm text-gray-400">Awaiting processing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onDownload}
          disabled={!resizedImage || isProcessing}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200
            flex items-center justify-center gap-2
            ${resizedImage && !isProcessing
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Resized Image
        </button>

        <button
          onClick={onReset}
          className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          Upload Another Image
        </button>
      </div>
    </div>
  );
}
