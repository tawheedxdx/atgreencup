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
      <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-2 px-1 tracking-tight">
        Image Proof <span className="text-red-500">*</span>
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*, image/heic, image/heif, image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />

      {preview ? (
        <div className="relative rounded-[2rem] overflow-hidden border-2 border-transparent bg-gray-50 shadow-premium group transition-all duration-300 transform scale-100 hover:scale-[1.01]">
          <img src={preview} alt="Preview" className="w-full h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex flex-col justify-end p-4 transition-opacity duration-300">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold text-white transition-colors border border-white/20"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex-[0.5] h-11 bg-red-500/80 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition-colors backdrop-blur-md border border-red-500/50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`
            w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3
            transition-all duration-200 active:scale-[0.98]
            ${error 
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20 dark:border-red-500/50' 
              : 'border-emerald-300/50 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-dark-surface dark:border-dark-border dark:hover:bg-dark-surface/80'
            }
          `}
        >
          <div className={`p-3 rounded-2xl ${error ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-white dark:bg-dark-bg text-emerald-500 shadow-sm'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-emerald-900 dark:text-emerald-50'}`}>
              Capture or Upload Proof
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              JPEG, PNG, HEIC, WEBP
            </span>
          </div>
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-500 px-1 font-medium">{error}</p>}
    </div>
  );
};
