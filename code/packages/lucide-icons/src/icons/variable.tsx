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
      <Path d="M8 21s-4-3-4-9 4-9 4-9" stroke={color} />
      <Path d="M16 3s4 3 4 9-4 9-4 9" stroke={color} />
      <Line x1="15" x2="9" y1="9" y2="15" stroke={color} />
      <Line x1="9" x2="15" y1="9" y2="15" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'Variable'

export const Variable = memo<IconProps>(themed(Icon))
