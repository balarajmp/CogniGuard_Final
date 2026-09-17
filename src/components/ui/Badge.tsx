interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning";
  pulse?: boolean;
  className?: string;
}

const variantClasses = {
  default: "bg-white/5 border-white/10 text-gray-400",
  accent: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  success: "bg-green-500/10 border-green-500/30 text-green-400",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

export default function Badge({
  children,
  variant = "default",
  pulse = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        border text-[10px] font-mono font-semibold uppercase tracking-widest
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
