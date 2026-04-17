import { useState, useEffect, useCallback } from 'react';

/**
 * useSimulationAnimation - Generic animation controller for category-specific simulations
 * 
 * Manages animation playback state (playing, paused), speed, and time progression
 * Provides tick-based state updates for real-time visualization
 */
export const useSimulationAnimation = (categoryMetrics, enabled = true) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 0.5 = slow, 1 = normal, 2 = fast
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [duration, setDuration] = useState(0);

  // Extract timeline/slot count from category metrics
  useEffect(() => {
    if (!categoryMetrics) {
      setDuration(0);
      return;
    }

    let timeSlots = 0;

    if (categoryMetrics.peak_hours_data) {
      timeSlots = categoryMetrics.peak_hours_data.length;
    } else if (categoryMetrics.room_utilization_by_hour) {
      timeSlots = categoryMetrics.room_utilization_by_hour.length;
    } else if (categoryMetrics.peak_hours_analysis) {
      timeSlots = categoryMetrics.peak_hours_analysis.length;
    } else if (Array.isArray(categoryMetrics.scenario_comparisons)) {
      timeSlots = categoryMetrics.scenario_comparisons.length;
    } else if (categoryMetrics.scenario_comparison) {
      timeSlots = Object.keys(categoryMetrics.scenario_comparison).length;
    }

    setDuration(timeSlots);
    setCurrentTimeIndex(0);
  }, [categoryMetrics]);

  // Control animation with tick interval
  useEffect(() => {
    if (!isPlaying || !enabled || duration === 0) {
      return;
    }

    const tickInterval = Math.max(200, 1000 / animationSpeed); // Minimum 200ms
    const timer = setInterval(() => {
      setCurrentTimeIndex((prev) => {
        if (prev >= duration - 1) {
          return 0; // Loop continuously through all frames
        }
        return prev + 1;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPlaying, animationSpeed, duration, enabled]);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const reset = useCallback(() => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  }, []);

  const seek = useCallback((index) => {
    if (index >= 0 && index < duration) {
      setCurrentTimeIndex(index);
    }
  }, [duration]);

  const speedUp = useCallback(() => {
    setAnimationSpeed((prev) => Math.min(2, prev + 0.25));
  }, []);

  const slowDown = useCallback(() => {
    setAnimationSpeed((prev) => Math.max(0.25, prev - 0.25));
  }, []);

  const progress = duration > 0 ? (currentTimeIndex / (duration - 1)) * 100 : 0;

  return {
    // State
    isPlaying,
    currentTimeIndex,
    animationSpeed,
    duration,
    progress,

    // Controls
    togglePlayback,
    play,
    pause,
    reset,
    seek,
    speedUp,
    slowDown,
    setAnimationSpeed,
  };
};

export default useSimulationAnimation;
