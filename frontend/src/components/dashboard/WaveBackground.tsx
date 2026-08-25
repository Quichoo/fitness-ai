interface WaveBackgroundProps {
  color: string;
}

/**
 * A subtle decorative wave line behind stat cards, matching the
 * reference design's soft background flourish. Purely visual - no data,
 * absolutely positioned behind the card's real content.
 */
export function WaveBackground({ color }: WaveBackgroundProps) {
  return (
    <svg
      viewBox="0 0 300 120"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "60%",
        opacity: 0.15,
      }}
      preserveAspectRatio="none"
    >
      <path
        d="M0,80 C50,40 100,100 150,60 C200,20 250,90 300,50 L300,120 L0,120 Z"
        fill={color}
      />
    </svg>
  );
}
