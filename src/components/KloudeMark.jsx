export default function KloudeMark({ size = 24, className, alt = 'Kloude' }) {
  const numericSize = typeof size === 'number' ? size : Number.parseInt(String(size), 10) || 24;
  const pixelSize = `${numericSize}px`;

  return (
    <img
      src="/LOGO.png"
      width={numericSize}
      height={numericSize}
      className={className}
      alt={alt}
      loading="eager"
      decoding="async"
      draggable={false}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
}
