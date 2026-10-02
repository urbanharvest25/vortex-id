import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { ProductImage } from '../types/index.js';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const displayImages =
    images && images.length > 0
      ? images
      : [
          {
            id: 'default',
            product_id: '',
            url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
            sort_order: 0,
            is_primary: true,
          },
        ];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, displayImages.length]);

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* Main Image Slider View */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
        <img
          src={currentImage.url}
          alt={`${productName} - Slide ${selectedIndex + 1}`}
          className="w-full h-full object-contain sm:object-cover cursor-zoom-in transition-transform duration-300"
          onClick={() => setIsFullscreen(true)}
        />

        {/* Slide Counter Badge */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-slate-700/60 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {selectedIndex + 1} / {displayImages.length}
          </span>
        </div>

        {/* Fullscreen Expand Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-slate-700/60 text-white hover:text-cyan-400 transition cursor-pointer"
          title="Fullscreen Foto Akun"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Left / Right Nav Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-slate-700/60 text-white hover:text-cyan-400 transition opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-slate-700/60 text-white hover:text-cyan-400 transition opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row (Up to 10 images) */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedIndex === idx
                  ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-105'
                  : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute bottom-0 inset-x-0 bg-cyan-600 text-[8px] font-black uppercase text-slate-950 text-center py-0.5">
                  Utama
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Header */}
          <div className="w-full max-w-6xl flex items-center justify-between text-white pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-cyan-400">{productName}</h4>
              <p className="text-xs text-slate-400">
                Foto {selectedIndex + 1} dari {displayImages.length}
              </p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Display in Lightbox */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.url}
              alt={`${productName} fullscreen`}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-white transition cursor-pointer shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-white transition cursor-pointer shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {displayImages.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-2xl py-2 px-4 bg-slate-900/80 rounded-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {displayImages.map((img, idx) => (
                <button
                  key={`lb-${img.id || idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border transition cursor-pointer ${
                    selectedIndex === idx ? 'border-cyan-400 ring-2 ring-cyan-500/40' : 'border-slate-800 opacity-50'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
