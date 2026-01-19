// frontend/src/hooks/useResponsive.js
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isSmall: dimensions.width < 768,
    isMedium: dimensions.width >= 768 && dimensions.width < 1024,
    isLarge: dimensions.width >= 1024,
  };
};
