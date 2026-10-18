/**
 * BrandLogo — Notepad.do Technical Note with Amber Corner Fold & Calculation Mark
 * Used across Notepad Console (Admin Panel).
 */
export default function BrandLogo({
  accentColor = "#F59E0B",
  size = "md",
  className = "",
}) {
  const dimensions =
    size === "sm"
      ? "w-7 h-7 rounded-[9px]"
      : size === "lg"
      ? "w-12 h-12 rounded-[14px]"
      : "w-8 h-8 rounded-[10px]";

  const svgSize =
    size === "sm"
      ? "w-4 h-4"
      : size === "lg"
      ? "w-6 h-6"
      : "w-[18px] h-[18px]";

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 select-none ${dimensions} ${className}`}
      style={{
        background: `linear-gradient(145deg, #17171D 0%, #0B0B0E 100%)`,
        border: `1px solid ${accentColor}4D`,
        boxShadow: `0 4px 14px -2px ${accentColor}26, inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={svgSize}
      >
        <path
          d="M9.5 4.5H20.5L28.5 12.5V28.5C28.5 30.1569 27.1569 31.5 25.5 31.5H9.5C7.84315 31.5 6.5 30.1569 6.5 28.5V7.5C6.5 5.84315 7.84315 4.5 9.5 4.5Z"
          fill="#1B1B22"
          stroke="#EDEDED"
          strokeOpacity="0.28"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <line
          x1="11"
          y1="13"
          x2="17"
          y2="13"
          stroke="#EDEDED"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />
        <line
          x1="11"
          y1="18.5"
          x2="23.5"
          y2="18.5"
          stroke="#EDEDED"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <line
          x1="11"
          y1="24"
          x2="16"
          y2="24"
          stroke="#EDEDED"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        <line
          x1="19.5"
          y1="22.8"
          x2="24"
          y2="22.8"
          stroke={accentColor}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <line
          x1="19.5"
          y1="25.4"
          x2="24"
          y2="25.4"
          stroke={accentColor}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M20.5 4.5L28.5 12.5H23C21.6193 12.5 20.5 11.3807 20.5 10V4.5Z"
          fill={accentColor}
        />
        <path
          d="M20.5 4.5L28.5 12.5H23C21.6193 12.5 20.5 11.3807 20.5 10V4.5Z"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
