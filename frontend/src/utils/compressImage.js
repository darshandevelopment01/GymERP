import imageCompression from 'browser-image-compression';

export async function compressImage(file, maxSizeMB = 1) {
  // Skip if already under limit
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }
  
  const options = {
    maxSizeMB: maxSizeMB,        // Target: < 1MB
    maxWidthOrHeight: 1920,       // Max dimension (full HD)
    useWebWorker: true,           // Non-blocking compression
    fileType: 'image/webp',       // Convert to WebP for best compression
  };
  
  try {
    const compressed = await imageCompression(file, options);
    // Create a new File object from the blob to preserve name and type for the backend
    return new File([compressed], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
      type: 'image/webp',
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original file
  }
}
