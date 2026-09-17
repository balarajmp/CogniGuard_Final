"use client";
import { motion } from "framer-motion";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Switch({ checked, onChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-300 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? "bg-cyan-500/80" : "bg-white/10"}
        ${className}
      `}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
