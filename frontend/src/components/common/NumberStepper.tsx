import React from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  quickDeltas?: number[];
  warningThresholds?: { min?: number; max?: number; message?: string };
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  disabled?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  quickDeltas,
  warningThresholds,
  icon: Icon,
  hint,
  disabled = false,
}) => {
  const handleDelta = (delta: number) => {
    let next = Math.round((value + delta) * 100) / 100;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange(next);
  };

  const isWarning =
    warningThresholds &&
    ((warningThresholds.min !== undefined && value < warningThresholds.min) ||
      (warningThresholds.max !== undefined && value > warningThresholds.max));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
          <span>{label}</span>
        </label>
        {unit && (
          <span className="text-[11px] font-mono text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Stepper Control Box */}
      <div
        className={`flex items-center rounded-2xl bg-slate-900 border transition-all overflow-hidden ${
          isWarning
            ? 'border-amber-500/70 ring-1 ring-amber-500/30'
            : 'border-slate-800 hover:border-slate-700 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20'
        }`}
      >
        {/* Decrement Button */}
        <button
          type="button"
          disabled={disabled || (min !== undefined && value <= min)}
          onClick={() => handleDelta(-step)}
          className="w-11 h-11 flex items-center justify-center bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input Field */}
        <div className="flex-1 px-3 relative flex items-center">
          <input
            type="number"
            value={Number.isNaN(value) ? '' : value}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!Number.isNaN(num)) {
                let clamped = num;
                if (min !== undefined && clamped < min) clamped = min;
                if (max !== undefined && clamped > max) clamped = max;
                onChange(clamped);
              } else {
                onChange(0);
              }
            }}
            disabled={disabled}
            step={step}
            className="w-full bg-transparent text-center font-mono font-bold text-white text-base focus:outline-none tabular-nums"
          />
        </div>

        {/* Increment Button */}
        <button
          type="button"
          disabled={disabled || (max !== undefined && value >= max)}
          onClick={() => handleDelta(step)}
          className="w-11 h-11 flex items-center justify-center bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Deltas (Tezkor o'zgartirish tugmalari) */}
      {quickDeltas && quickDeltas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {quickDeltas.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDelta(d)}
              className="px-2 py-0.5 text-[11px] font-mono rounded-lg bg-slate-800/70 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      )}

      {/* Warning Message if out of reasonable threshold */}
      {isWarning && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{warningThresholds?.message || "Qiymat me'yoriy chegaradan tashqarida"}</span>
        </div>
      )}

      {/* Sub-hint */}
      {hint && !isWarning && (
        <p className="text-[11px] text-slate-400 leading-tight">{hint}</p>
      )}
    </div>
  );
};
