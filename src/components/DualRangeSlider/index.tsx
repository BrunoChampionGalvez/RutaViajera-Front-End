import React, { useRef, useCallback } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  trackColor?: string;
  emptyColor?: string;
  className?: string;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  format?: (n: number) => string;
  trackHeight?: number;
  thumbSize?: number;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  trackColor = 'red-900',
  emptyColor = '#ffffff',
  className = '',
  ariaLabelMin = 'Min value',
  ariaLabelMax = 'Max value',
  format,
  trackHeight = 8,
  thumbSize = 20,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const percentFromValue = (v: number) => ((v - min) / (max - min)) * 100;
  const valueFromClientX = (clientX: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped);
  };

  const startDrag = useCallback(
    (thumb: 'min' | 'max', e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement; // ensure stable element reference
      const pointerId = e.pointerId;
      try {
        target.setPointerCapture(pointerId);
      } catch {
        // In rare cases (implicit release / OS gesture) setPointerCapture may throw; ignore.
      }

      const handleMove = (ev: PointerEvent) => {
        // Prevent browser from interpreting horizontal drag as scroll on some devices
        if (ev.cancelable) ev.preventDefault();
        const newVal = valueFromClientX(ev.clientX);
        if (thumb === 'min') {
          const nextMin = Math.min(newVal, value[1]);
          if (nextMin !== value[0]) onChange([nextMin, value[1]]);
        } else {
          const nextMax = Math.max(newVal, value[0]);
          if (nextMax !== value[1]) onChange([value[0], nextMax]);
        }
      };
      const cleanup = () => {
        try {
          if (target.hasPointerCapture(pointerId)) {
            target.releasePointerCapture(pointerId);
          }
        } catch {
          // Ignore NotFoundError or other release anomalies.
        }
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleCancel);
      };
      const handleUp = () => cleanup();
      const handleCancel = () => cleanup();
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleCancel);
    },
    [value, onChange, min, max, step]
  );

  const handleKey = (thumb: 'min' | 'max', e: React.KeyboardEvent) => {
    const deltaMap: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
      PageDown: -step * 10,
      PageUp: step * 10,
      Home: thumb === 'min' ? min - value[0] : value[0] - value[1],
      End: thumb === 'max' ? max - value[1] : value[1] - value[0],
    };
    if (e.key in deltaMap) {
      e.preventDefault();
      const delta = deltaMap[e.key];
      if (thumb === 'min') {
        const next = clamp(Math.min(value[1], value[0] + delta));
        if (next !== value[0]) onChange([next, value[1]]);
      } else {
        const next = clamp(Math.max(value[0], value[1] + delta));
        if (next !== value[1]) onChange([value[0], next]);
      }
    }
  };

  const minPercent = percentFromValue(value[0]);
  const maxPercent = percentFromValue(value[1]);
  const halfThumb = thumbSize / 2;

  return (
    <div
      className={`select-none ${className}`}
      ref={containerRef}
      style={{ height: thumbSize, touchAction: 'none' }}
    >
      <div className="relative w-full h-full">
        {/* Base track centered */}
        <div
          className="absolute left-0 right-0 rounded-full"
          style={{
            top: `calc(50% - ${trackHeight / 2}px)`,
            height: trackHeight,
            background: emptyColor,
          }}
        />
        {/* Active range */}
        <div
          className={`absolute rounded-full ${trackColor}`}
          style={{
            top: `calc(50% - ${trackHeight / 2}px)`,
            height: trackHeight,
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        {/* Min thumb */}
        <div
          role="slider"
          aria-label={ariaLabelMin}
          aria-valuemin={min}
          aria-valuemax={value[1]}
          aria-valuenow={value[0]}
          aria-orientation="horizontal"
          tabIndex={0}
          onKeyDown={(e) => handleKey('min', e)}
          onPointerDown={(e) => startDrag('min', e)}
          className="absolute rounded-full border-2 border-gray-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
          style={{
            top: `calc(50% - ${thumbSize / 2}px)`,
            left: `calc(${minPercent}% - ${halfThumb}px)`,
            width: thumbSize,
            height: thumbSize,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            touchAction: 'none',
          }}
        />
        {/* Max thumb */}
        <div
          role="slider"
          aria-label={ariaLabelMax}
          aria-valuemin={value[0]}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-orientation="horizontal"
          tabIndex={0}
          onKeyDown={(e) => handleKey('max', e)}
          onPointerDown={(e) => startDrag('max', e)}
          className="absolute rounded-full border-2 border-gray-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
          style={{
            top: `calc(50% - ${thumbSize / 2}px)`,
            left: `calc(${maxPercent}% - ${halfThumb}px)`,
            width: thumbSize,
            height: thumbSize,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default DualRangeSlider;
