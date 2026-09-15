export default function FlintMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 40 48" fill="none" aria-hidden="true" className={className}>
    <path d="M20 2 5 21l7 21 8 4 8-4 7-21L20 2Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="m20 2-5 22 5 22 5-22-5-22ZM5 21l10 3 10 0 10-3M12 42l3-18m13 18-3-18" stroke="currentColor" strokeWidth="1.1" />
  </svg>;
}
