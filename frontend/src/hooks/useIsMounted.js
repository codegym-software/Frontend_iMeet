import { useEffect, useRef } from 'react';

/**
 * Custom hook to track if component is mounted
 * Useful for preventing state updates on unmounted components
 * 
 * @returns {React.MutableRefObject<boolean>} Ref object with current mounted state
 * 
 * @example
 * const isMounted = useIsMounted();
 * 
 * useEffect(() => {
 *   const fetchData = async () => {
 *     const data = await api.getData();
 *     if (isMounted.current) {
 *       setData(data);
 *     }
 *   };
 *   fetchData();
 * }, []);
 */
const useIsMounted = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

export default useIsMounted;
