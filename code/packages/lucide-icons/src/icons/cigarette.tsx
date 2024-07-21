import React, { memo } from 'react'
import PropTypes from 'prop-types'
import type { IconProps } from '@tamagui/helpers-icon'
import {
  Svg,
  Circle as _Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Text as _Text,
  Use,
  Defs,
  Stop,
} from 'react-native-svg'
import { themed } from '@tamagui/helpers-icon'

const Icon = (props) => {
  const { color = 'black', size = 24, ...otherProps } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <Path d="M18 12H2v4h16" stroke={color} />
      <Path d="M22 12v4" stroke={color} />
      <Path d="M7 12v4" stroke={color} />
      <Path d="M18 8c0-2.5-2-2.5-2-5" stroke={color} />
      <Path d="M22 8c0-2.5-2-2.5-2-5" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'Cigarette'

export const Cigarette = memo<IconProps>(themed(Icon))
