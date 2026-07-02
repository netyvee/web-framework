// Test mock for next/image — essential markup only.
export default function Image(props: any) {
  const { src, alt, width, height, className } = props;
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
}
