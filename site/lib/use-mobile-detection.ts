import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Uses user agent detection for consistency with existing codebase
 * Properly handles SSR hydration by syncing state after mount
 * @returns boolean indicating if device is mobile
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Update mobile detection after mount to ensure client-side accuracy
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);
  }, []);

  return isMobile;
}
