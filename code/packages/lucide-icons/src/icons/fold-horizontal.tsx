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
      <Path d="M2 12h6" stroke={color} />
      <Path d="M22 12h-6" stroke={color} />
      <Path d="M12 2v2" stroke={color} />
      <Path d="M12 8v2" stroke={color} />
      <Path d="M12 14v2" stroke={color} />
      <Path d="M12 20v2" stroke={color} />
      <Path d="m19 9-3 3 3 3" stroke={color} />
      <Path d="m5 15 3-3-3-3" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'FoldHorizontal'

export const FoldHorizontal = memo<IconProps>(themed(Icon))
