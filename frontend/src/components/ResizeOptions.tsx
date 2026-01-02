interface ResizeOptionsProps {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onResize: () => void;
  isProcessing: boolean;
}

const presetSizes = [
  { label: 'Thumbnail', width: 150, height: 150 },
  { label: 'Small', width: 320, height: 240 },
  { label: 'Medium', width: 640, height: 480 },
  { label: 'Large', width: 1024, height: 768 },
];

export function ResizeOptions({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onResize,
  isProcessing,
}: ResizeOptionsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Resize Options</h3>

      {/* Preset Sizes */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Quick presets:</p>
        <div className="flex flex-wrap gap-2">
          {presetSizes.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onWidthChange(preset.width);
                onHeightChange(preset.height);
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {preset.label} ({preset.width}x{preset.height})
            </button>
          ))}
        </div>
      </div>

      {/* Custom Size Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width (px)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => onWidthChange(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="4096"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (px)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => onHeightChange(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="4096"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Resize Button */}
      <button
        onClick={onResize}
        disabled={isProcessing}
        className={`
          w-full py-3 rounded-lg font-medium transition-all duration-200
          flex items-center justify-center gap-2
          ${isProcessing
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
          }
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Resize Image
          </>
        )}
      </button>
    </div>
  );
}
