// Test mock for next/image — essential markup only.
// `fetchPriority` is forwarded ONLY when a component passes it explicitly (v1.25.1: Hero), so a test can assert the prop is
// passed; real Next rendering of the attribute is proven against site builds, not here.
export default function Image(props: any) {
  const { src, alt, width, height, className, fetchPriority } = props;
  return <img src={src} alt={alt} width={width} height={height} className={className} {...(fetchPriority ? { fetchPriority } : {})} />;
}
