"use client";
import { type LucideIcon } from "lucide-react";
import { forwardRef } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, helperText, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-4 text-slate-500 pointer-events-none">
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder-slate-500
              focus:outline-none focus:border-cyan-500/60 focus:bg-white/6 focus:shadow-[0_0_20px_rgba(34,211,238,0.08)]
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon ? "pl-11" : ""}
              ${error ? "border-rose-500/50 focus:border-rose-500/80 focus:shadow-[0_0_20px_rgba(244,63,94,0.08)]" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs font-medium text-rose-400/90 tracking-wide mt-0.5">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 tracking-wide mt-0.5">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
