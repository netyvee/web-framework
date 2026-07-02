// Test mock for next/link — essential markup only.
export default function Link({ href, children, className, style, onClick }: any) {
  return (
    <a href={href} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
}
