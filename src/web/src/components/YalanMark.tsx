type Props = { size?: number; color?: string; needle?: string };

/** Yalan Makinası logosu: kadran + ibre. Damga ekranında ve uygulama içinde kullanılır. */
export function YalanMark({ size = 76, color = '#A83A30', needle = '#1C1A17' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" stroke={color} strokeWidth="3" opacity=".8" />
      <circle cx="60" cy="60" r="42" stroke={color} strokeWidth="1.2" opacity=".35" />
      <g stroke={color} strokeWidth="3" strokeLinecap="round">
        <line x1="60" y1="8" x2="60" y2="17" />
        <line x1="60" y1="103" x2="60" y2="112" />
        <line x1="8" y1="60" x2="17" y2="60" />
        <line x1="103" y1="60" x2="112" y2="60" />
      </g>
      <g stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".45">
        <line x1="86" y1="15" x2="82" y2="22" />
        <line x1="105" y1="34" x2="98" y2="38" />
        <line x1="15" y1="86" x2="22" y2="82" />
        <line x1="34" y1="105" x2="38" y2="98" />
      </g>
      <line x1="60" y1="60" x2="88" y2="41" stroke={needle} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="6.5" fill={color} />
    </svg>
  );
}
