type SampleTagProps = {
  /** Use on Frost White bands, where the default pill would disappear. */
  onFrost?: boolean;
  /**
   * Short "Sample" pill for card photos, smaller below lg so it stays within
   * about a third of the photo's width in a 3-column grid at 768px.
   */
  overPhoto?: boolean;
  className?: string;
};

/** Sample pill, in the same style as the Sample tag on review cards. */
export function SampleTag({
  onFrost = false,
  overPhoto = false,
  className = "",
}: SampleTagProps) {
  const size = overPhoto
    ? "px-2 py-0.5 text-[10px] tracking-[0.15em] lg:px-3 lg:py-1 lg:text-xs lg:tracking-[0.2em]"
    : "px-3 py-1 text-xs tracking-[0.2em]";

  return (
    <span
      className={`inline-block rounded-full font-bold text-navy uppercase ${size} ${onFrost ? "bg-page" : "bg-frost"} ${className}`}
    >
      {overPhoto ? "Sample" : "Sample project"}
    </span>
  );
}
