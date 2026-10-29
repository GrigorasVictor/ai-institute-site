'use client';

import { useState } from 'react';

/**
 * SmartMediaImage
 * 
 * Solves the portrait cropping issue in landscape containers:
 * - Landscape images: Render full-bleed object-cover with optional focalPoint alignment.
 * - Portrait images: Render 100% in view (object-contain) centered over an ambient,
 *   frosted-glass backdrop blur sampled from the image itself.
 *   This prevents awkward top-crops (e.g. only forehead/hair visible) and ensures
 *   every piece of media displays with pride.
 */
export default function SmartMediaImage({
  src,
  alt = '',
  aspectRatio = 'aspect-video',
  className = '',
  imageClassName = '',
  focalPoint = null,
  priority = false,
  loading = 'lazy',
  children,
  ...props
}) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);

  if (!src) return null;

  const handleLoad = (event) => {
    const img = event.currentTarget;
    if (img?.naturalWidth && img?.naturalHeight) {
      setIsPortrait(img.naturalHeight > img.naturalWidth);
      setIsMeasured(true);
    }
  };

  const showAmbientBackdrop = isMeasured && isPortrait;

  const focalStyle = focalPoint?.x != null && focalPoint?.y != null
    ? { objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }
    : undefined;

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-900 ${aspectRatio} ${className}`.trim()}
    >
      {showAmbientBackdrop && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover blur-2xl opacity-50 dark:opacity-40 scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/10 dark:bg-black/35 backdrop-blur-[1px]" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        style={!showAmbientBackdrop ? focalStyle : undefined}
        className={`relative z-10 w-full h-full transition-all duration-300 ${
          showAmbientBackdrop
            ? 'object-contain p-2 drop-shadow-md'
            : 'object-cover'
        } ${imageClassName}`.trim()}
        {...props}
      />

      {children && (
        <div className="relative z-20">
          {children}
        </div>
      )}
    </div>
  );
}
