export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/logo.png"
        alt="Majestic Coast Plaza"
        className={`${sizes[size] || sizes.md} w-auto object-contain`}
      />
    </div>
  );
}
