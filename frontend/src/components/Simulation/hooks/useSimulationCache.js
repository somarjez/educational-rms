import { useEffect, useState } from 'react';

const readCachedSimulation = (cacheKey) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Failed to load cached simulation:', err);
  }
  return null;
};

const useSimulationCache = (simulationType) => {
  const cacheKey = `sim-result-${simulationType}`;
  const [simData, setSimData] = useState(() => readCachedSimulation(cacheKey));

  useEffect(() => {
    setSimData(readCachedSimulation(cacheKey));
  }, [cacheKey]);

  useEffect(() => {
    if (!simData) {
      return;
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify(simData));
    } catch (err) {
      console.warn('Failed to save simulation cache:', err);
    }
  }, [cacheKey, simData]);

  return {
    simData,
    setSimData,
  };
};

export default useSimulationCache;
