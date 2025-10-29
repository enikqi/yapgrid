import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Uses user agent detection for consistency with existing codebase
 * @returns boolean indicating if device is mobile
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  });

  return isMobile;
}
