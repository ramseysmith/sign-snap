import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Line,
  G,
  Polygon,
} from 'react-native-svg';

// Shared palette for the little "document" mockup that anchors each step.
const PAPER = '#FBFBFE';
const PAPER_SHADOW = 'rgba(0, 0, 0, 0.22)';
const LINE = '#D7D7E3';

export type IllustrationKind = 'welcome' | 'scan' | 'sign' | 'share';

interface IllustrationProps {
  size?: number;
  accent: string;
  gradient: [string, string];
  /** Unique suffix so simultaneously-mounted SVG gradients don't collide. */
  uid: string;
}

// A small sheet of paper with a colored header + a few text lines.
function Paper({ accent }: { accent: string }) {
  return (
    <G>
      <Rect x={54} y={42} width={96} height={128} rx={12} fill={PAPER_SHADOW} />
      <Rect x={50} y={36} width={96} height={128} rx={12} fill={PAPER} />
      <Rect x={62} y={50} width={48} height={9} rx={4.5} fill={accent} opacity={0.35} />
      <Rect x={62} y={70} width={72} height={5} rx={2.5} fill={LINE} />
      <Rect x={62} y={82} width={72} height={5} rx={2.5} fill={LINE} />
      <Rect x={62} y={94} width={52} height={5} rx={2.5} fill={LINE} />
    </G>
  );
}

function Grad({ id, gradient }: { id: string; gradient: [string, string] }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={gradient[0]} />
        <Stop offset="1" stopColor={gradient[1]} />
      </LinearGradient>
    </Defs>
  );
}

/** Welcome / brand: a pen mid-signature. */
export function WelcomeIllustration({ size = 200, accent, gradient, uid }: IllustrationProps) {
  const g = `wel-${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Grad id={g} gradient={gradient} />
      {/* start dot */}
      <Circle cx={32} cy={120} r={3.5} fill={accent} />
      {/* flowing signature */}
      <Path
        d="M32,120 C58,94 86,86 108,98 C130,110 120,136 146,126 C162,120 168,102 182,98"
        stroke={`url(#${g})`}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* tail flick */}
      <Path
        d="M182,98 C188,93 192,86 190,79"
        stroke={gradient[1]}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      {/* pen, angled like it's writing */}
      <G transform="translate(150, 44) rotate(-45)">
        <Rect x={-9} y={-50} width={18} height={46} rx={3} fill={`url(#${g})`} />
        <Rect x={-10} y={-8} width={20} height={5} rx={1.5} fill="#FFFFFF" opacity={0.45} />
        <Polygon points="-9,-3 9,-3 4,17 -4,17" fill={accent} opacity={0.85} />
        <Polygon points="-4,17 4,17 0,26" fill="#FFFFFF" opacity={0.9} />
      </G>
    </Svg>
  );
}

/** Step 1: capture a document with the camera / scan frame. */
export function ScanIllustration({ size = 200, accent, gradient, uid }: IllustrationProps) {
  const g = `scan-${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Grad id={g} gradient={gradient} />
      <Paper accent={accent} />
      {/* scan corner brackets */}
      <G stroke={`url(#${g})`} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M40,58 L40,40 L58,40" />
        <Path d="M138,40 L156,40 L156,58" />
        <Path d="M40,142 L40,160 L58,160" />
        <Path d="M138,160 L156,160 L156,142" />
      </G>
      {/* camera badge */}
      <G>
        <Circle cx={150} cy={150} r={21} fill={`url(#${g})`} />
        <Rect x={142} y={134} width={9} height={4} rx={2} fill="#FFFFFF" />
        <Circle cx={150} cy={150} r={8.5} fill="#FFFFFF" />
        <Circle cx={150} cy={150} r={4} fill={accent} />
      </G>
    </Svg>
  );
}

/** Step 2: sign on the dotted line. */
export function SignIllustration({ size = 200, accent, gradient, uid }: IllustrationProps) {
  const g = `sign-${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Grad id={g} gradient={gradient} />
      <Paper accent={accent} />
      {/* baseline */}
      <Line x1={62} y1={140} x2={134} y2={140} stroke={LINE} strokeWidth={2.5} strokeLinecap="round" />
      {/* the signature itself */}
      <Path
        d="M64,138 C74,116 84,114 92,130 C98,140 95,149 106,138 C114,130 118,115 132,123"
        stroke={`url(#${g})`}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* pen finishing the stroke */}
      <G transform="translate(133, 123) rotate(42)">
        <Rect x={-4} y={-30} width={8} height={24} rx={3} fill={`url(#${g})`} />
        <Rect x={-4.5} y={-8} width={9} height={3} rx={1.5} fill="#FFFFFF" opacity={0.5} />
        <Polygon points="-4,-6 4,-6 0,3" fill="#E0DDFF" />
      </G>
    </Svg>
  );
}

/** Step 3: a signed sheet, ready to export/share. */
export function ShareIllustration({ size = 200, accent, gradient, uid }: IllustrationProps) {
  const g = `share-${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Grad id={g} gradient={gradient} />
      <Paper accent={accent} />
      {/* placed signature chip */}
      <G>
        <Rect x={62} y={116} width={58} height={32} rx={8} fill={`url(#${g})`} opacity={0.14} />
        <Rect x={62} y={116} width={58} height={32} rx={8} fill="none" stroke={`url(#${g})`} strokeWidth={2} />
        <Path
          d="M70,136 C76,124 82,123 87,132 C90,137 88,142 94,136 C99,131 102,124 110,129"
          stroke={`url(#${g})`}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      {/* export badge: up arrow */}
      <G>
        <Circle cx={150} cy={150} r={21} fill={`url(#${g})`} />
        <Path
          d="M150,159 L150,142 M142,150 L150,141 L158,150"
          stroke="#FFFFFF"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

export function SlideIllustration({
  kind,
  accent,
  gradient,
  uid,
  size,
}: IllustrationProps & { kind: IllustrationKind }) {
  switch (kind) {
    case 'scan':
      return <ScanIllustration accent={accent} gradient={gradient} uid={uid} size={size} />;
    case 'sign':
      return <SignIllustration accent={accent} gradient={gradient} uid={uid} size={size} />;
    case 'share':
      return <ShareIllustration accent={accent} gradient={gradient} uid={uid} size={size} />;
    case 'welcome':
    default:
      return <WelcomeIllustration accent={accent} gradient={gradient} uid={uid} size={size} />;
  }
}
