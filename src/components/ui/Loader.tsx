interface LoaderProps {
  /** Full-page overlay or inline spinner */
  fullPage?: boolean;
  label?: string;
  className?: string;
}

export default function Loader({
  fullPage = false,
  label = "Loading",
  className = "",
}: LoaderProps) {
  const spinner = (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Pulse ring */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border border-cyan-500/10" />
        <div className="absolute inset-2 rounded-full border border-transparent border-t-cyan-300/60 animate-spin [animation-duration:1.5s]" />
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 animate-pulse" />
      </div>
      {label && (
        <p className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
