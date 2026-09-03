import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

/** The Anchor mark — navy anchor with a mustard/gold horizontal crossbar. */
export const AnchorMark: React.FC<{ size?: number; color?: string; bar?: string }> = ({
  size = 64,
  color = C.navy,
  bar = C.gold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
    {/* ring */}
    <Circle cx="512" cy="212" r="92" stroke={color} strokeWidth="54" />
    {/* shank */}
    <Rect x="483" y="300" width="58" height="506" rx="29" fill={color} />
    {/* mustard crossbar */}
    <Rect x="268" y="398" width="488" height="46" rx="23" fill={bar} />
    {/* arms */}
    <Path
      d="M 268 660 C 300 780 400 812 512 812 C 624 812 724 780 756 660"
      stroke={color}
      strokeWidth="56"
      strokeLinecap="round"
      fill="none"
    />
    {/* flukes */}
    <Path d="M268 660 L200 565 L320 580 Z" fill={color} />
    <Path d="M756 660 L824 565 L704 580 Z" fill={color} />
  </Svg>
);

export const Wordmark: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <AnchorMark size={size * 0.82} />
);
