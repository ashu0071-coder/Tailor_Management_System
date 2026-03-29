import { useState, useEffect } from 'react';


/**
 * Custom hook to enforce a minimum loading time
 * This ensures loading animations are visible long enough for users to see them
 * @param {boolean} isLoading - The actual loading state
 * @param {number} minTime - Minimum time in milliseconds (default: 2000ms)
 * @returns {boolean} - The modified loading state
 */
export const useMinLoadingTime = (isLoading, minTime = 2000) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState(null);


  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setStartTime(Date.now());
    } else if (startTime) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);
     
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minTime]);


  return showLoading;
};



