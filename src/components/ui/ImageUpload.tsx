import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  value: File | null;
  previewUrl?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, previewUrl, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);

  const handleFile = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Image Proof</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 h-9 bg-white/90 rounded-lg text-sm font-medium text-gray-700 active:bg-white/70"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex-1 h-9 bg-red-500/90 rounded-lg text-sm font-medium text-white active:bg-red-500/70"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`
            w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2
            transition-colors duration-150 active:bg-gray-50
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'}
          `}
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-500 font-medium">
            Take Photo or Upload
          </span>
          <span className="text-xs text-gray-400">Tap to capture or select</span>
        </button>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
