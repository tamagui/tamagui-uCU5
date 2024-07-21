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
      <_Circle cx="12" cy="13" r="8" stroke={color} />
      <Path d="M12 9v4l2 2" stroke={color} />
      <Path d="M5 3 2 6" stroke={color} />
      <Path d="m22 6-3-3" stroke={color} />
      <Path d="M6.38 18.7 4 21" stroke={color} />
      <Path d="M17.64 18.67 20 21" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'AlarmClock'

export const AlarmClock = memo<IconProps>(themed(Icon))
