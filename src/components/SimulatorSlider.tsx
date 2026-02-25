"use client";

interface SimulatorSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export default function SimulatorSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: SimulatorSliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-sm font-bold text-kawaii-pink-dark">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-kawaii-rose accent-kawaii-pink-dark"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
