"use client";

import { motion } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.25)]",
  secondary:
    "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white",
  outline:
    "bg-transparent border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/60",
  ghost:
    "bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-5 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-7 py-3.5 text-base gap-2.5 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      children,
      className = "",
      disabled,
      type = "button",
      onClick,
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
        disabled={disabled || loading}
        onClick={onClick}
        className={`
          relative inline-flex items-center justify-center font-semibold tracking-wide
          border transition-all duration-300 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        ) : null}
        {children}
        {IconRight && !loading && (
          <IconRight className="w-4 h-4" strokeWidth={1.5} />
        )}
        {/* Shimmer effect on hover */}
        {variant === "primary" && (
          <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-cyan-500/0 via-cyan-500/15 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
