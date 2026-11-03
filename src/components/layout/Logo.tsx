export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display text-2xl font-semibold tracking-tight ${className}`}>
      Word<span className="text-brand">Wise</span>
      <span className="ml-0.5 inline-block size-1.5 rounded-full bg-accent align-super" />
    </span>
  );
}
