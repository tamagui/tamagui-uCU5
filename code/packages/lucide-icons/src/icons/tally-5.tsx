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
      <Path d="M4 4v16" stroke={color} />
      <Path d="M9 4v16" stroke={color} />
      <Path d="M14 4v16" stroke={color} />
      <Path d="M19 4v16" stroke={color} />
      <Path d="M22 6 2 18" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'Tally5'

export const Tally5 = memo<IconProps>(themed(Icon))
