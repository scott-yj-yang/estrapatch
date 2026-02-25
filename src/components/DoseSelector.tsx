"use client";

const DOSE_OPTIONS = [
  { value: 0.025, label: "0.025 mg/day" },
  { value: 0.0375, label: "0.0375 mg/day" },
  { value: 0.05, label: "0.05 mg/day" },
  { value: 0.075, label: "0.075 mg/day" },
  { value: 0.1, label: "0.1 mg/day" },
];

interface DoseSelectorProps {
  value: number;
  onChange: (dose: number) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export default function DoseSelector({ value, onChange, className, id, "aria-label": ariaLabel }: DoseSelectorProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      className={`px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30 bg-white ${className ?? ""}`}
    >
      {DOSE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export { DOSE_OPTIONS };
