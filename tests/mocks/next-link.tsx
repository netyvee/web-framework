// Test mock for next/link.
//
// FORWARDS EVERY PROP. It previously destructured exactly five (href, children,
// className, style, onClick) and discarded the rest, which meant no Shell test could
// ever observe an attribute passed through Link — the mock decided what was testable.
// SM-F2 hit this directly: `data-vf-rel` was correctly rendered by the Shell and
// silently dropped here, so the real code looked broken and a real break would have
// looked fine. A mock narrower than the thing it stands in for is a check that cannot
// fail on what it is supposed to check.
export default function Link({ href, children, ...rest }: any) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
