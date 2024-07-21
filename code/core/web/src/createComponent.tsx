import { composeRefs } from '@tamagui/compose-refs'
import { isClient, isServer, isWeb } from '@tamagui/constants'
import {
  StyleObjectIdentifier,
  StyleObjectRules,
  composeEventHandlers,
  validStyles,
} from '@tamagui/helpers'
import React, {
  Children,
  Fragment,
  createElement,
  forwardRef,
  memo,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { devConfig, getConfig, onConfiguredOnce } from './config'
import { stackDefaultStyles } from './constants/constants'
import { isDevTools } from './constants/isDevTools'
import { ComponentContext } from './contexts/ComponentContext'
import { didGetVariableValue, setDidGetVariableValue } from './createVariable'
import {
  defaultComponentState,
  defaultComponentStateMounted,
  defaultComponentStateShouldEnter,
} from './defaultComponentState'
import {
  createShallowSetState,
  mergeIfNotShallowEqual,
} from './helpers/createShallowSetState'
import { useSplitStyles } from './helpers/getSplitStyles'
import { isObj } from './helpers/isObj'
import { log } from './helpers/log'
import { mergeProps } from './helpers/mergeProps'
import { setElementProps } from './helpers/setElementProps'
import { themeable } from './helpers/themeable'
import { useDidHydrateOnce } from './hooks/useDidHydrateOnce'
import { mediaKeyMatch, setMediaShouldUpdate, useMedia } from './hooks/useMedia'
import { useThemeWithState } from './hooks/useTheme'
import type { TamaguiComponentEvents } from './interfaces/TamaguiComponentEvents'
import type { TamaguiComponentState } from './interfaces/TamaguiComponentState'
import type { WebOnlyPressEvents } from './interfaces/WebOnlyPressEvents'
import { hooks } from './setupHooks'
import type {
  ComponentContextI,
  DebugProp,
  GroupState,
  GroupStateListener,
  LayoutEvent,
  SizeTokens,
  SpaceDirection,
  SpaceValue,
  SpacerProps,
  SpacerStyleProps,
  StackNonStyleProps,
  StackProps,
  StaticConfig,
  StyleableOptions,
  TamaguiComponent,
  TamaguiComponentStateRef,
  TamaguiElement,
  TamaguiInternalConfig,
  TextProps,
  UseAnimationHook,
  UseAnimationProps,
  UseThemeWithStateProps,
} from './types'
import { Slot } from './views/Slot'
import { getThemedChildren } from './views/Theme'
import { ThemeDebug } from './views/ThemeDebug'

/**
 * All things that need one-time setup after createTamagui is called
 */
let tamaguiConfig: TamaguiInternalConfig
let time: any

let debugKeyListeners: Set<Function> | undefined
let startVisualizer: Function | undefined

type ComponentSetState = React.Dispatch<React.SetStateAction<TamaguiComponentState>>

export const componentSetStates = new Set<ComponentSetState>()

if (typeof document !== 'undefined') {
  const cancelTouches = () => {
    // clear all press downs
    componentSetStates.forEach((setState) =>
      setState((prev) => {
        if (prev.press || prev.pressIn) {
          return {
            ...prev,
            press: false,
            pressIn: false,
          }
        }
        return prev
      })
    )
    componentSetStates.clear()
  }
  addEventListener('mouseup', cancelTouches)
  addEventListener('touchend', cancelTouches)
  addEventListener('touchcancel', cancelTouches)

  // hold option to see debug visualization
  if (process.env.NODE_ENV === 'development') {
    startVisualizer = () => {
      const devVisualizerConfig = devConfig?.visualizer
      if (devVisualizerConfig) {
        debugKeyListeners = new Set()
        let tm
        let isShowing = false
        const options = {
          key: 'Alt',
          delay: 800,
          ...(typeof devVisualizerConfig === 'object' ? devVisualizerConfig : {}),
        }

        document.addEventListener('blur', () => {
          clearTimeout(tm)
        })

        document.addEventListener('keydown', ({ key, defaultPrevented }) => {
          if (defaultPrevented) return
          clearTimeout(tm) // always clear so we dont trigger on chords
          if (key === options.key) {
            tm = setTimeout(() => {
              isShowing = true
              debugKeyListeners?.forEach((l) => l(true))
            }, options.delay)
          }
        })

        document.addEventListener('keyup', ({ key, defaultPrevented }) => {
          if (defaultPrevented) return
          if (key === options.key) {
            clearTimeout(tm)
            if (isShowing) {
              debugKeyListeners?.forEach((l) => l(false))
            }
          }
        })
      }
    }
  }
}

export const useComponentState = (
  props: StackProps | TextProps | Record<string, any>,
  { animationDriver, groups }: ComponentContextI,
  staticConfig: StaticConfig,
  config: TamaguiInternalConfig
) => {
  const useAnimations = animationDriver?.useAnimations as UseAnimationHook | undefined

  const stateRef = useRef<TamaguiComponentStateRef>(
    undefined as any as TamaguiComponentStateRef
  )
  if (!stateRef.current) {
    stateRef.current = {}
  }

  // after we get states mount we need to turn off isAnimated for server side
  const hasAnimationProp = Boolean(
    'animation' in props || (props.style && hasAnimatedStyleValue(props.style))
  )

  // disable for now still ssr issues
  const supportsCSSVars = animationDriver?.supportsCSSVars
  const curStateRef = stateRef.current

  const willBeAnimatedClient = (() => {
    const next = !!(hasAnimationProp && !staticConfig.isHOC && useAnimations)
    return Boolean(next || curStateRef.hasAnimated)
  })()

  const willBeAnimated = !isServer && willBeAnimatedClient

  // once animated, always animated to preserve hooks / vdom structure
  if (willBeAnimated && !curStateRef.hasAnimated) {
    curStateRef.hasAnimated = true
  }

  // HOOK
  const presence =
    (willBeAnimated &&
      props['animatePresence'] !== false &&
      animationDriver?.usePresence?.()) ||
    null
  const presenceState = presence?.[2]
  const isExiting = presenceState?.isPresent === false
  const isEntering = presenceState?.isPresent === true && presenceState.initial !== false

  const hasEnterStyle = !!props.enterStyle
  // finish animated logic, avoid isAnimated when unmounted
  const hasRNAnimation = hasAnimationProp && animationDriver?.isReactNative

  if (process.env.NODE_ENV === 'development' && time) time`pre-use-state`

  const hasEnterState = hasEnterStyle || isEntering

  // this can be conditional because its only ever needed with animations
  const didHydrateOnce = willBeAnimated ? useDidHydrateOnce() : true
  const shouldEnter = hasEnterState || (!didHydrateOnce && hasRNAnimation)
  const shouldEnterFromUnhydrated = isWeb && !didHydrateOnce

  const initialState = shouldEnter
    ? // on the very first render we switch all spring animation drivers to css rendering
      // this is because we need to use css variables, which they don't support to do proper SSR
      // without flickers of the wrong colors.
      // but once we do that initial hydration and we are in client side rendering mode,
      // we can avoid the extra re-render on mount
      shouldEnterFromUnhydrated
      ? defaultComponentState
      : defaultComponentStateShouldEnter
    : defaultComponentStateMounted

  // will be nice to deprecate half of these:
  const disabled = isDisabled(props)

  if (disabled != null) {
    initialState.disabled = disabled
  }

  // HOOK
  const states = useState<TamaguiComponentState>(initialState)

  const state = props.forceStyle ? { ...states[0], [props.forceStyle]: true } : states[0]
  const setState = states[1]

  const isHydrated = state.unmounted === false || state.unmounted === 'should-enter'

  // only web server + initial client render run this when not hydrated:
  let isAnimated = willBeAnimated
  if (isWeb && hasRNAnimation && !staticConfig.isHOC && state.unmounted === true) {
    isAnimated = false
    curStateRef.willHydrate = true
  }

  // immediately update disabled state and reset component state
  if (disabled !== state.disabled) {
    state.disabled = disabled
    // if disabled remove all press/focus/hover states
    if (disabled) {
      Object.assign(state, defaultComponentStateMounted)
    }
    setState({ ...state })
  }

  let setStateShallow = createShallowSetState(setState, disabled, false, props.debug)

  // if (isHydrated && state.unmounted === 'should-enter') {
  //   state.unmounted = true
  // }

  // set enter/exit variants onto our new props object
  if (presenceState && isAnimated && isHydrated && staticConfig.variants) {
    if (process.env.NODE_ENV === 'development' && props.debug === 'verbose') {
      console.warn(`has presenceState ${JSON.stringify(presenceState)}`)
    }
    const { enterVariant, exitVariant, enterExitVariant, custom } = presenceState
    if (isObj(custom)) {
      Object.assign(props, custom)
    }
    const exv = exitVariant ?? enterExitVariant
    const env = enterVariant ?? enterExitVariant
    if (state.unmounted && env && staticConfig.variants[env]) {
      if (process.env.NODE_ENV === 'development' && props.debug === 'verbose') {
        console.warn(`Animating presence ENTER "${env}"`)
      }
      props[env] = true
    } else if (isExiting && exv) {
      if (process.env.NODE_ENV === 'development' && props.debug === 'verbose') {
        console.warn(`Animating presence EXIT "${exv}"`)
      }
      props[exv] = exitVariant !== enterExitVariant
    }
  }

  let shouldAvoidClasses = !isWeb

  // on server for SSR and animation compat added the && isHydrated but perhaps we want
  // disableClassName="until-hydrated" to be more straightforward
  // see issue if not, Button sets disableClassName to true <Button animation="" /> with
  // the react-native driver errors because it tries to animate var(--color) to rbga(..)
  if (isWeb) {
    const { disableClassName } = props

    const isAnimatedAndHydrated =
      isAnimated && !supportsCSSVars && didHydrateOnce && !isServer

    const isDisabledManually =
      disableClassName && !isServer && didHydrateOnce && state.unmounted === true

    if (isAnimatedAndHydrated || isDisabledManually) {
      shouldAvoidClasses = true

      // debug
      if (process.env.NODE_ENV === 'development' && props.debug) {
        console.info(
          `❌⛹️ no className`,
          {
            isAnimatedAndHydrated,
            isDisabledManually,
          },
          {
            isAnimated,
            supportsCSSVars,
            didHydrateOnce,
            disableClassName,
            isServer,
            willBeAnimated,
          }
        )
      }
    }
  }

  const groupName = props.group as any as string

  if (groupName && !curStateRef.group) {
    const listeners = new Set<GroupStateListener>()
    curStateRef.group = {
      listeners,
      emit(name, state) {
        listeners.forEach((l) => l(name, state))
      },
      subscribe(cb) {
        listeners.add(cb)
        return () => {
          listeners.delete(cb)
        }
      },
    }
  }

  if (groupName) {
    // when we set state we also set our group state and emit an event for children listening:
    const groupContextState = groups.state
    const og = setStateShallow
    setStateShallow = (state) => {
      og(state)
      curStateRef.group!.emit(groupName, {
        pseudo: state,
      })
      // and mutate the current since its concurrent safe (children throw it in useState on mount)
      const next = {
        ...groupContextState[groupName],
        ...state,
      }
      groupContextState[groupName] = next
    }
  }

  return {
    curStateRef,
    disabled,
    groupName,
    hasAnimationProp,
    hasEnterStyle,
    isAnimated,
    isExiting,
    isHydrated,
    presence,
    presenceState,
    setState,
    setStateShallow,
    shouldAvoidClasses,
    state,
    stateRef,
    supportsCSSVars,
    willBeAnimated,
    willBeAnimatedClient,
  }
}

/**
 * Only on native do we need the actual underlying View/Text
 * On the web we avoid react-native dep altogether.
 */
let BaseText: any
let BaseView: any
let hasSetupBaseViews = false

const lastInteractionWasKeyboard = { value: false }
if (isWeb && globalThis['document']) {
  document.addEventListener('keydown', () => {
    lastInteractionWasKeyboard.value = true
  })
  document.addEventListener('mousedown', () => {
    lastInteractionWasKeyboard.value = false
  })
  document.addEventListener('mousemove', () => {
    lastInteractionWasKeyboard.value = false
  })
}

export function createComponent<
  ComponentPropTypes extends Record<string, any> = {},
  Ref extends TamaguiElement = TamaguiElement,
  BaseProps = never,
  BaseStyles extends Object = never,
>(staticConfig: StaticConfig) {
  const { componentName } = staticConfig

  let config: TamaguiInternalConfig | null = null

  let defaultProps = staticConfig.defaultProps

  onConfiguredOnce((conf) => {
    config = conf

    if (componentName) {
      // TODO this should be deprecated and removed likely or at least done differently
      const defaultForComponent = conf.defaultProps?.[componentName]
      if (defaultForComponent) {
        defaultProps = { ...defaultForComponent, ...defaultProps }
      }
    }
  })

  const {
    Component,
    isText,
    isZStack,
    isHOC,
    validStyles = {},
    variants = {},
  } = staticConfig

  if (process.env.NODE_ENV === 'development' && staticConfig.defaultProps?.['debug']) {
    if (process.env.IS_STATIC !== 'is_static') {
      log(`🐛 [${componentName || 'Component'}]`, {
        staticConfig,
        defaultProps,
        defaultPropsKeyOrder: defaultProps ? Object.keys(defaultProps) : [],
      })
    }
  }

  const component = forwardRef<Ref, ComponentPropTypes>((propsIn, forwardedRef) => {
    // HOOK
    const internalID = process.env.NODE_ENV === 'development' ? useId() : ''

    if (process.env.NODE_ENV === 'development') {
      if (startVisualizer) {
        startVisualizer()
        startVisualizer = undefined
      }
    }

    if (process.env.TAMAGUI_TARGET === 'native') {
      // todo this could be moved to a cleaner location
      if (!hasSetupBaseViews) {
        hasSetupBaseViews = true
        const baseViews = hooks.getBaseViews?.()
        if (baseViews) {
          BaseText = baseViews.Text
          BaseView = baseViews.View
        }
      }
    }

    // test only
    if (process.env.NODE_ENV === 'test') {
      if (propsIn['data-test-renders']) {
        propsIn['data-test-renders']['current'] ??= 0
        propsIn['data-test-renders']['current'] += 1
      }
    }

    // HOOK
    const componentContext = useContext(ComponentContext)

    // set variants through context
    // order is after default props but before props
    let styledContextProps: Object | undefined
    let overriddenContextProps: Object | undefined
    let contextValue: Object | null | undefined
    const { context, isReactNative } = staticConfig

    if (context) {
      // HOOK 3 (-1 if production)
      contextValue = useContext(context)
      const { inverseShorthands } = getConfig()
      for (const key in context.props) {
        const propVal =
          // because its after default props but before props this annoying amount of checks
          propsIn[key] ??
          propsIn[inverseShorthands[key]] ??
          defaultProps?.[key] ??
          defaultProps?.[inverseShorthands[key]]
        // if not set, use context
        if (propVal === undefined) {
          if (contextValue) {
            const isValidValue = key in validStyles || key in variants
            if (isValidValue) {
              styledContextProps ||= {}
              styledContextProps[key] = contextValue[key]
            }
          }
        }
        // if set in props, update context
        else {
          overriddenContextProps ||= {}
          overriddenContextProps[key] = propVal
        }
      }
    }

    // context overrides defaults but not props
    const curDefaultProps = styledContextProps
      ? { ...defaultProps, ...styledContextProps }
      : defaultProps

    // React inserts default props after your props for some reason...
    // order important so we do loops, you can't just spread because JS does weird things
    let props: StackProps | TextProps = propsIn
    if (curDefaultProps) {
      props = mergeProps(curDefaultProps, propsIn)
    }

    const debugProp = props['debug'] as DebugProp
    const componentName = props.componentName || staticConfig.componentName

    if (process.env.NODE_ENV === 'development' && isClient) {
      // HOOK
      useEffect(() => {
        let overlay: HTMLSpanElement | null = null

        const debugVisualizerHandler = (show = false) => {
          const node = curStateRef.host as HTMLElement
          if (!node) return

          if (show) {
            overlay = document.createElement('span')
            overlay.style.inset = '0px'
            overlay.style.zIndex = '1000000'
            overlay.style.position = 'absolute'
            overlay.style.borderColor = 'red'
            overlay.style.borderWidth = '1px'
            overlay.style.borderStyle = 'dotted'

            const dataAt = node.getAttribute('data-at') || ''
            const dataIn = node.getAttribute('data-in') || ''

            const tooltip = document.createElement('span')
            tooltip.style.position = 'absolute'
            tooltip.style.top = '0px'
            tooltip.style.left = '0px'
            tooltip.style.padding = '3px'
            tooltip.style.background = 'rgba(0,0,0,0.75)'
            tooltip.style.color = 'rgba(255,255,255,1)'
            tooltip.style.fontSize = '12px'
            tooltip.style.lineHeight = '12px'
            tooltip.style.fontFamily = 'monospace'
            tooltip.style['webkitFontSmoothing'] = 'none'
            tooltip.innerText = `${componentName || ''} ${dataAt} ${dataIn}`.trim()

            overlay.appendChild(tooltip)
            node.appendChild(overlay)
          } else {
            if (overlay) {
              node.removeChild(overlay)
            }
          }
        }
        debugKeyListeners ||= new Set()
        debugKeyListeners.add(debugVisualizerHandler)
        return () => {
          debugKeyListeners?.delete(debugVisualizerHandler)
        }
      }, [componentName])
    }

    if (
      !process.env.TAMAGUI_IS_CORE_NODE &&
      process.env.NODE_ENV === 'development' &&
      debugProp === 'profile' &&
      !time
    ) {
      const timer = require('@tamagui/timer').timer()
      time = timer.start()
    }
    if (process.env.NODE_ENV === 'development' && time) time`start (ignore)`

    if (process.env.NODE_ENV === 'development' && time) time`did-finish-ssr`

    // conditional but if ever true stays true
    // [animated, inversed]
    // HOOK

    if (process.env.NODE_ENV === 'development' && time) time`stateref`

    /**
     * Component state for tracking animations, pseudos
     */
    const animationDriver = componentContext.animationDriver
    const useAnimations = animationDriver?.useAnimations as UseAnimationHook | undefined

    const {
      curStateRef,
      disabled,
      groupName,
      hasAnimationProp,
      hasEnterStyle,
      isAnimated,
      isExiting,
      isHydrated,
      presence,
      presenceState,
      setState,
      setStateShallow,
      shouldAvoidClasses,
      state,
      stateRef,
      supportsCSSVars,
      willBeAnimated,
      willBeAnimatedClient,
    } = useComponentState(props, componentContext, staticConfig, config!)

    const shouldForcePseudo = !!propsIn.forceStyle
    const noClassNames = shouldAvoidClasses || shouldForcePseudo

    if (process.env.NODE_ENV === 'development' && time) time`use-state`

    const hasTextAncestor = !!(isWeb && isText ? componentContext.inText : false)

    if (process.env.NODE_ENV === 'development' && time) time`use-context`

    const isTaggable = !Component || typeof Component === 'string'
    const tagProp = props.tag
    // default to tag, fallback to component (when both strings)
    const element = isWeb ? (isTaggable ? tagProp || Component : Component) : Component

    const BaseTextComponent = BaseText || element || 'span'
    const BaseViewComponent = BaseView || element || (hasTextAncestor ? 'span' : 'div')

    let elementType = isText ? BaseTextComponent : BaseViewComponent

    if (animationDriver && isAnimated) {
      elementType = animationDriver[isText ? 'Text' : 'View'] || elementType
    }

    // internal use only
    const disableThemeProp =
      process.env.TAMAGUI_TARGET === 'native' ? false : props['data-disable-theme']

    const disableTheme = disableThemeProp || isHOC

    if (process.env.NODE_ENV === 'development' && time) time`theme-props`

    if (props.themeShallow) {
      curStateRef.themeShallow = true
    }

    const themeStateProps: UseThemeWithStateProps = {
      componentName,
      disable: disableTheme,
      shallow: curStateRef.themeShallow,
      debug: debugProp,
    }

    // these two are set conditionally if existing in props because we wrap children with
    // a span if they ever set one of these, so avoid wrapping all children with span
    if ('themeInverse' in props) {
      themeStateProps.inverse = props.themeInverse
    }
    if ('theme' in props) {
      themeStateProps.name = props.theme
    }

    if (typeof curStateRef.isListeningToTheme === 'boolean') {
      themeStateProps.shouldUpdate = () => stateRef.current.isListeningToTheme
    }

    // on native we optimize theme changes if fastSchemeChange is enabled, otherwise deopt
    if (process.env.TAMAGUI_TARGET === 'native') {
      themeStateProps.deopt = willBeAnimated
    }

    if (process.env.NODE_ENV === 'development') {
      if (debugProp && debugProp !== 'profile') {
        const name = `${
          componentName ||
          Component?.displayName ||
          Component?.name ||
          '[Unnamed Component]'
        }`
        const type =
          (hasEnterStyle ? '(hasEnter)' : '') +
          (isAnimated ? '(animated)' : '') +
          (isReactNative ? '(rnw)' : '') +
          (presenceState?.isPresent === false ? '(EXIT)' : '')
        const dataIs = propsIn['data-is'] || ''
        const banner = `${internalID} ${name}${dataIs ? ` ${dataIs}` : ''} ${type}`
        console.info(
          `%c ${banner} (hydrated: ${isHydrated}) (unmounted: ${state.unmounted})`,
          'background: green; color: white;'
        )
        if (isServer) {
          log({ noClassNames, isAnimated, shouldAvoidClasses, isWeb, supportsCSSVars })
        } else {
          // if strict mode or something messes with our nesting this fixes:
          console.groupEnd()

          const pressLog = `${state.press || state.pressIn ? ' PRESS ' : ''}`
          const stateLog = `${pressLog}${state.hover ? ' HOVER ' : ''}${
            state.focus ? ' FOCUS' : ' '
          }`

          const ch = propsIn.children
          let childLog =
            typeof ch === 'string' ? (ch.length > 4 ? ch.slice(0, 4) + '...' : ch) : ''
          if (childLog.length) {
            childLog = `(children: ${childLog})`
          }

          console.groupCollapsed(`${childLog}${stateLog}Props:`)
          log('props in:', propsIn)
          log('final props:', props)
          log({ state, staticConfig, elementType, themeStateProps })
          log({ contextProps: styledContextProps, overriddenContextProps })
          log({ presence, isAnimated, isHOC, hasAnimationProp, useAnimations })
          console.groupEnd()
        }
      }
    }

    if (process.env.NODE_ENV === 'development' && time) time`pre-theme-media`

    // HOOK 10-13 (-1 if no animation, -1 if disableSSR, -1 if no context, -1 if production)
    const [themeState, theme] = useThemeWithState(themeStateProps)

    elementType = Component || elementType
    const isStringElement = typeof elementType === 'string'

    if (process.env.NODE_ENV === 'development' && time) time`theme`

    // HOOK 14 (-1 if no animation, -1 if disableSSR, -1 if no context, -1 if production)
    const mediaState = useMedia(stateRef, componentContext, debugProp)

    setDidGetVariableValue(false)

    if (process.env.NODE_ENV === 'development' && time) time`media`

    const resolveValues =
      // if HOC + mounted + has animation prop, resolve as value so it passes non-variable to child
      (isAnimated && !supportsCSSVars) ||
      (isHOC && state.unmounted == false && hasAnimationProp)
        ? 'value'
        : 'auto'

    const styleProps = {
      mediaState,
      noClassNames,
      resolveValues,
      isExiting,
      isAnimated,
      willBeAnimated,
    } as const

    // HOOK 15 (-1 if no animation, -1 if disableSSR, -1 if no context, -1 if production)
    const splitStyles = useSplitStyles(
      props,
      staticConfig,
      theme,
      themeState?.state?.name || '',
      state,
      styleProps,
      null,
      componentContext,
      elementType,
      debugProp
    )

    // hide strategy will set this opacity = 0 until measured
    if (props.group && props.untilMeasured === 'hide' && !curStateRef.hasMeasured) {
      splitStyles.style ||= {}
      splitStyles.style.opacity = 0
    }

    if (process.env.NODE_ENV === 'development' && time) time`split-styles`

    curStateRef.isListeningToTheme = splitStyles.dynamicThemeAccess

    // only listen for changes if we are using raw theme values or media space, or dynamic media (native)
    // array = space media breakpoints
    const hasRuntimeMediaKeys = splitStyles.hasMedia && splitStyles.hasMedia !== true
    const shouldListenForMedia =
      didGetVariableValue() ||
      hasRuntimeMediaKeys ||
      (noClassNames && splitStyles.hasMedia === true)

    const mediaListeningKeys = hasRuntimeMediaKeys
      ? (splitStyles.hasMedia as Record<string, boolean>)
      : null
    if (process.env.NODE_ENV === 'development' && debugProp) {
      console.info(`useMedia() createComponent`, shouldListenForMedia, mediaListeningKeys)
    }

    setMediaShouldUpdate(stateRef, {
      enabled: shouldListenForMedia,
      keys: mediaListeningKeys,
    })

    const {
      viewProps: viewPropsIn,
      pseudos,
      style: splitStylesStyle,
      classNames,
      space,
    } = splitStyles

    const propsWithAnimation = props as UseAnimationProps

    const {
      asChild,
      children,
      themeShallow,
      spaceDirection: _spaceDirection,
      onPress,
      onLongPress,
      onPressIn,
      onPressOut,
      onHoverIn,
      onHoverOut,
      onMouseUp,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      separator,
      // ignore from here on out
      forceStyle: _forceStyle,
      // @ts-ignore  for next/link compat etc
      onClick,
      theme: _themeProp,
      // @ts-ignore
      defaultVariants,

      ...nonTamaguiProps
    } = viewPropsIn

    // these can ultimately be for DOM, react-native-web views, or animated views
    // so the type is pretty loose
    let viewProps = nonTamaguiProps

    if (!isTaggable && props.forceStyle) {
      viewProps.forceStyle = props.forceStyle
    }

    if (isHOC && _themeProp) {
      viewProps.theme = _themeProp
    }

    if (elementType['acceptTagProp']) {
      viewProps.tag = tagProp
    }

    // once you set animation prop don't remove it, you can set to undefined/false
    // reason is animations are heavy - no way around it, and must be run inline here (🙅 loading as a sub-component)
    let animationStyles: any
    const shouldUseAnimation = // if it supports css vars we run it on server too to get matching initial style
      (supportsCSSVars ? willBeAnimatedClient : willBeAnimated) && useAnimations && !isHOC

    if (shouldUseAnimation) {
      // HOOK 16... (depends on driver) (-1 if no animation, -1 if disableSSR, -1 if no context, -1 if production)
      const animations = useAnimations({
        props: propsWithAnimation,
        // if hydrating, send empty style
        style: splitStylesStyle || {},
        presence,
        componentState: state,
        styleProps,
        theme: themeState.state?.theme!,
        pseudos: pseudos || null,
        staticConfig,
        stateRef,
      })

      if ((isAnimated || supportsCSSVars) && animations) {
        animationStyles = animations.style
        viewProps.style = animationStyles
      }

      if (process.env.NODE_ENV === 'development' && time) time`animations`
    }

    if (process.env.NODE_ENV === 'development' && props.untilMeasured && !props.group) {
      console.warn(
        `You set the untilMeasured prop without setting group. This doesn't work, be sure to set untilMeasured on the parent that sets group, not the children that use the $group- prop.\n\nIf you meant to do this, you can disable this warning - either change untilMeasured and group at the same time, or do group={conditional ? 'name' : undefined}`
      )
    }

    if (process.env.NODE_ENV === 'development' && time) time`destructure`

    if (groupName) {
      nonTamaguiProps.onLayout = composeEventHandlers(
        nonTamaguiProps.onLayout,
        (e: LayoutEvent) => {
          stateRef.current.group!.emit(groupName, {
            layout: e.nativeEvent.layout,
          })

          // force re-render if measure strategy is hide
          if (!stateRef.current.hasMeasured && props.untilMeasured === 'hide') {
            setState((prev) => ({ ...prev }))
          }

          stateRef.current.hasMeasured = true
        }
      )
    }

    // HOOKS (0-4 more):
    viewProps =
      hooks.usePropsTransform?.(
        elementType,
        nonTamaguiProps,
        stateRef,
        curStateRef.willHydrate
      ) || nonTamaguiProps

    // HOOK (1 more):
    if (!curStateRef.composedRef) {
      curStateRef.composedRef = composeRefs<TamaguiElement>(
        (x) => (stateRef.current.host = x as TamaguiElement),
        forwardedRef,
        setElementProps
      )
    }

    viewProps.ref = curStateRef.composedRef

    if (process.env.NODE_ENV === 'development') {
      if (!isReactNative && !isText && isWeb && !isHOC) {
        Children.toArray(props.children).forEach((item) => {
          // allow newlines because why not its annoying with mdx
          if (typeof item === 'string' && item !== '\n') {
            console.error(
              `Unexpected text node: ${item}. A text node cannot be a child of a <View>.`
            )
          }
        })
      }
    }

    if (process.env.NODE_ENV === 'development' && time) time`events-hooks`

    // combined multiple effects into one for performance so be careful with logic
    // should not be a layout effect because otherwise it wont render the initial state
    // for example css driver needs to render once with the first styles, then again with the next
    // if its a layout effect it will just skip that first <render >output
    const { pseudoGroups, mediaGroups } = splitStyles

    const unPress = () => setStateShallow({ press: false, pressIn: false })

    useEffect(() => {
      if (disabled) {
        return
      }

      if (state.unmounted === true && hasEnterStyle) {
        setStateShallow({ unmounted: 'should-enter' })
        return
      }

      if (state.unmounted) {
        setStateShallow({ unmounted: false })
        return
      }

      const dispose = subscribeToContextGroup({
        disabled,
        componentContext,
        setStateShallow,
        state,
        mediaGroups,
        pseudoGroups,
      })

      return () => {
        dispose?.()
        componentSetStates.delete(setState)
      }
    }, [
      state.unmounted,
      disabled,
      pseudoGroups ? Object.keys([...pseudoGroups]).join('') : 0,
      mediaGroups ? Object.keys([...mediaGroups]).join('') : 0,
    ])

    // if its a group its gotta listen for pseudos to emit them to children

    const runtimePressStyle = !disabled && noClassNames && pseudos?.pressStyle
    const runtimeFocusStyle = !disabled && noClassNames && pseudos?.focusStyle
    const runtimeFocusVisibleStyle =
      !disabled && noClassNames && pseudos?.focusVisibleStyle
    const attachFocus = Boolean(
      runtimePressStyle ||
        runtimeFocusStyle ||
        runtimeFocusVisibleStyle ||
        onFocus ||
        onBlur
    )
    const attachPress = Boolean(
      groupName ||
        runtimePressStyle ||
        onPress ||
        onPressOut ||
        onPressIn ||
        onMouseDown ||
        onMouseUp ||
        onLongPress ||
        onClick ||
        pseudos?.focusVisibleStyle
    )
    const runtimeHoverStyle = !disabled && noClassNames && pseudos?.hoverStyle
    const needsHoverState = Boolean(
      groupName || runtimeHoverStyle || onHoverIn || onHoverOut
    )
    const attachHover =
      isWeb && !!(groupName || needsHoverState || onMouseEnter || onMouseLeave)

    // check presence rather than value to prevent reparenting bugs
    // allows for onPress={x ? function : undefined} without re-ordering dom
    const shouldAttach =
      !disabled &&
      !props.asChild &&
      Boolean(
        attachFocus ||
          attachPress ||
          attachHover ||
          runtimePressStyle ||
          runtimeHoverStyle ||
          runtimeFocusStyle
      )

    const needsPressState = Boolean(groupName || runtimePressStyle)

    if (process.env.NODE_ENV === 'development' && time) time`events-setup`

    const events: TamaguiComponentEvents | null = shouldAttach
      ? {
          onPressOut: attachPress
            ? (e) => {
                unPress()
                onPressOut?.(e)
                onMouseUp?.(e)
              }
            : undefined,
          ...((attachHover || attachPress) && {
            onMouseEnter: (e) => {
              const next: Partial<typeof state> = {}
              if (needsHoverState) {
                next.hover = true
              }
              if (needsPressState) {
                if (state.pressIn) {
                  next.press = true
                }
              }
              setStateShallow(next)
              onHoverIn?.(e)
              onMouseEnter?.(e)
            },
            onMouseLeave: (e) => {
              const next: Partial<typeof state> = {}
              if (needsHoverState) {
                next.hover = false
              }
              if (needsPressState) {
                if (state.pressIn) {
                  next.press = false
                  next.pressIn = false
                }
              }
              setStateShallow(next)
              onHoverOut?.(e)
              onMouseLeave?.(e)
            },
          }),
          onPressIn: attachPress
            ? (e) => {
                if (runtimePressStyle || groupName) {
                  setStateShallow({
                    press: true,
                    pressIn: true,
                  })
                }
                onPressIn?.(e)
                onMouseDown?.(e)
                if (isWeb) {
                  componentSetStates.add(setState)
                }
              }
            : undefined,
          onPress: attachPress
            ? (e) => {
                unPress()
                // @ts-ignore
                isWeb && onClick?.(e)
                onPress?.(e)
                if (process.env.TAMAGUI_TARGET === 'web') {
                  onLongPress?.(e)
                }
              }
            : undefined,
          ...(process.env.TAMAGUI_TARGET === 'native' &&
            attachPress &&
            onLongPress && {
              onLongPress: (e) => {
                unPress()
                onLongPress?.(e)
              },
            }),
          ...(attachFocus && {
            onFocus: (e) => {
              if (pseudos?.focusVisibleStyle) {
                setTimeout(() => {
                  setStateShallow({
                    focus: true,
                    focusVisible: !!lastInteractionWasKeyboard.value,
                  })
                }, 0)
              } else {
                setStateShallow({
                  focus: true,
                  focusVisible: false,
                })
              }
              onFocus?.(e)
            },
            onBlur: (e) => {
              setStateShallow({
                focus: false,
                focusVisible: false,
              })
              onBlur?.(e)
            },
          }),
        }
      : null

    if (process.env.TAMAGUI_TARGET === 'native' && events && !asChild) {
      // replicating TouchableWithoutFeedback
      Object.assign(events, {
        cancelable: !viewProps.rejectResponderTermination,
        disabled: disabled,
        hitSlop: viewProps.hitSlop,
        delayLongPress: viewProps.delayLongPress,
        delayPressIn: viewProps.delayPressIn,
        delayPressOut: viewProps.delayPressOut,
        focusable: viewProps.focusable ?? true,
        minPressDuration: 0,
      })
    }

    if (process.env.TAMAGUI_TARGET === 'web' && events && !isReactNative) {
      Object.assign(viewProps, getWebEvents(events))
    }

    if (process.env.NODE_ENV === 'development' && time) time`events`

    if (process.env.NODE_ENV === 'development' && debugProp === 'verbose') {
      log(`events`, { events, attachHover, attachPress })
    }

    // EVENTS native
    hooks.useEvents?.(viewProps, events, splitStyles, setStateShallow, staticConfig)

    const direction = props.spaceDirection || 'both'

    if (process.env.NODE_ENV === 'development' && time) time`hooks`

    let content =
      !children || asChild
        ? children
        : spacedChildren({
            separator,
            children,
            space,
            direction,
            isZStack,
            debug: debugProp,
          })

    if (asChild) {
      elementType = Slot
      // on native this is already merged into viewProps in hooks.useEvents
      if (process.env.TAMAGUI_TARGET === 'web') {
        const webStyleEvents = asChild === 'web' || asChild === 'except-style-web'
        const passEvents = getWebEvents(
          {
            onPress,
            onLongPress,
            onPressIn,
            onPressOut,
            onMouseUp,
            onMouseDown,
            onMouseEnter,
            onMouseLeave,
          },
          webStyleEvents
        )
        Object.assign(viewProps, passEvents)
      } else {
        Object.assign(viewProps, { onPress, onLongPress })
      }
    }

    if (process.env.NODE_ENV === 'development' && time) time`spaced-as-child`

    let useChildrenResult: any
    if (hooks.useChildren) {
      useChildrenResult = hooks.useChildren(
        elementType,
        content,
        viewProps,
        events,
        staticConfig
      )
    }

    if (useChildrenResult) {
      content = useChildrenResult
    } else {
      content = createElement(elementType, viewProps, content)
    }

    // needs to reset the presence state for nested children
    const ResetPresence = config?.animations?.ResetPresence
    if (
      ResetPresence &&
      willBeAnimated &&
      (hasEnterStyle || presenceState) &&
      content &&
      typeof content !== 'string'
    ) {
      content = <ResetPresence>{content}</ResetPresence>
    }

    if (process.env.NODE_ENV === 'development' && time) time`create-element`

    // must override context so siblings don't clobber initial state
    const groupState = curStateRef.group
    const subGroupContext = useMemo(() => {
      if (!groupState || !groupName) return
      groupState.listeners.clear()
      // change reference so context value updates
      return {
        ...componentContext.groups,
        // change reference so as we mutate it doesn't affect siblings etc
        state: {
          ...componentContext.groups.state,
          [groupName]: {
            pseudo: defaultComponentStateMounted,
            // capture just initial width and height if they exist
            // will have top, left, width, height (not x, y)
            layout: {
              width: fromPx(splitStyles.style?.width as any),
              height: fromPx(splitStyles.style?.height as any),
            } as any,
          },
        },
        emit: groupState.emit,
        subscribe: groupState.subscribe,
      } satisfies ComponentContextI['groups']
    }, [groupName])

    if (groupName && subGroupContext) {
      content = (
        <ComponentContext.Provider {...componentContext} groups={subGroupContext}>
          {content}
        </ComponentContext.Provider>
      )
    }

    if (process.env.NODE_ENV === 'development' && time) time`group-context`

    // disable theme prop is deterministic so conditional hook ok here
    content = disableTheme
      ? content
      : getThemedChildren(themeState, content, themeStateProps, false, stateRef)

    if (process.env.NODE_ENV === 'development' && time) time`themed-children`

    if (process.env.NODE_ENV === 'development' && props['debug'] === 'visualize') {
      content = (
        <ThemeDebug themeState={themeState} themeProps={props}>
          {content}
        </ThemeDebug>
      )
    }

    if (process.env.TAMAGUI_TARGET === 'web') {
      if (isReactNative && !asChild) {
        content = (
          <span
            className="_dsp_contents"
            {...(isHydrated && events && getWebEvents(events))}
          >
            {content}
          </span>
        )
      }
    }

    // ensure we override new context with syle resolved values
    if (staticConfig.context) {
      const contextProps = staticConfig.context.props
      for (const key in contextProps) {
        if ((viewProps.style && key in viewProps.style) || key in viewProps) {
          overriddenContextProps ||= {}
          overriddenContextProps[key] = viewProps.style?.[key] ?? viewProps[key]
        }
      }
    }

    if (overriddenContextProps) {
      const Provider = staticConfig.context!.Provider!
      content = (
        <Provider {...contextValue} {...overriddenContextProps}>
          {content}
        </Provider>
      )
    }

    // add in <style> tags inline
    if (process.env.TAMAGUI_REACT_19) {
      const { rulesToInsert } = splitStyles
      const keys = Object.keys(splitStyles.rulesToInsert)
      if (keys.length) {
        content = (
          <>
            {content}
            {/* lets see if we can put a single style tag per rule for optimal de-duping */}
            {keys.map((key) => {
              const styleObject = rulesToInsert[key]
              const identifier = styleObject[StyleObjectIdentifier]
              return (
                <style
                  key={identifier}
                  // @ts-ignore
                  href={`t_${identifier}`}
                  // @ts-ignore
                  precedence="default"
                >
                  {styleObject[StyleObjectRules].join('\n')}
                </style>
              )
            })}
          </>
        )
      }
    }

    if (process.env.NODE_ENV === 'development') {
      if (debugProp && debugProp !== 'profile') {
        const element = typeof elementType === 'string' ? elementType : 'Component'
        const title = `render <${element} /> (${internalID}) with props`
        if (!isWeb) {
          log(title)
          log(`state: `, state)
          if (isDevTools) {
            log('viewProps', viewProps)
          }
          log(`final styles:`)
          for (const key in splitStylesStyle) {
            log(key, splitStylesStyle[key])
          }
        } else {
          console.groupCollapsed(title)
          try {
            log('viewProps', viewProps)
            log('children', content)
            if (typeof window !== 'undefined') {
              log('props in', propsIn, 'mapped to', props, 'in order', Object.keys(props))
              log({
                animationStyles,
                classNames,
                content,
                defaultProps,
                elementType,
                events,
                isAnimated,
                hasRuntimeMediaKeys,
                isStringElement,
                mediaListeningKeys,
                pseudos,
                shouldAttach,
                shouldAvoidClasses,
                shouldForcePseudo,
                shouldListenForMedia,
                splitStyles,
                splitStylesStyle,
                state,
                stateRef,
                staticConfig,
                styleProps,
                tamaguiConfig,
                themeState,
                viewProps,
                willBeAnimated,
              })
            }
          } catch {
            // RN can run into PayloadTooLargeError: request entity too large
          } finally {
            console.groupEnd()
          }
        }
        if (debugProp === 'break') {
          // biome-ignore lint/suspicious/noDebugger: ok
          debugger
        }
      }
    }

    if (process.env.NODE_ENV === 'development' && time) {
      time`rest`
      if (!globalThis['willPrint']) {
        globalThis['willPrint'] = true
        setTimeout(() => {
          delete globalThis['willPrint']
          time.print()
          time = null
        }, 50)
      }
    }

    return content
  })

  // let hasLogged = false

  if (staticConfig.componentName) {
    component.displayName = staticConfig.componentName
  }

  type ComponentType = TamaguiComponent<
    ComponentPropTypes,
    Ref,
    BaseProps,
    BaseStyles,
    {}
  >

  let res: ComponentType = component as any

  if (process.env.TAMAGUI_FORCE_MEMO || staticConfig.memo) {
    res = memo(res) as any
  }

  res.staticConfig = staticConfig

  function extendStyledConfig(extended?: Partial<StaticConfig>) {
    return {
      ...staticConfig,
      ...extended,
      neverFlatten: true,
      isHOC: true,
      isStyledHOC: false,
    }
  }

  function extractable(Component: any, extended?: Partial<StaticConfig>) {
    Component.staticConfig = extendStyledConfig(extended)
    Component.styleable = styleable
    return Component
  }

  function styleable(Component: any, options?: StyleableOptions) {
    const isForwardedRefAlready = Component.render?.length === 2

    let out = isForwardedRefAlready ? (Component as any) : forwardRef(Component as any)

    const extendedConfig = extendStyledConfig(options?.staticConfig)

    out = options?.disableTheme ? out : (themeable(out, extendedConfig) as any)

    if (process.env.TAMAGUI_MEMOIZE_STYLEABLE) {
      out = memo(out)
    }

    out.staticConfig = extendedConfig
    out.styleable = styleable
    return out
  }

  res.extractable = extractable
  res.styleable = styleable

  return res
}

type EventKeys = keyof (TamaguiComponentEvents & WebOnlyPressEvents)
type EventLikeObject = {
  [key in EventKeys]?: any
}

function getWebEvents<E extends EventLikeObject>(events: E, webStyle = true) {
  return {
    onMouseEnter: events.onMouseEnter,
    onMouseLeave: events.onMouseLeave,
    [webStyle ? 'onClick' : 'onPress']: events.onPress,
    onMouseDown: events.onPressIn,
    onMouseUp: events.onPressOut,
    onTouchStart: events.onPressIn,
    onTouchEnd: events.onPressOut,
    onFocus: events.onFocus,
    onBlur: events.onBlur,
  }
}

// for elements to avoid spacing
export function Unspaced(props: { children?: any }) {
  return props.children
}
Unspaced['isUnspaced'] = true

const getSpacerSize = (size: SizeTokens | number | boolean, { tokens }) => {
  size = size === true ? '$true' : size
  const sizePx = tokens.space[size as any] ?? size
  return {
    width: sizePx,
    height: sizePx,
    minWidth: sizePx,
    minHeight: sizePx,
  }
}

// dont used styled() here to avoid circular deps
// keep inline to avoid circular deps
export const Spacer = createComponent<
  SpacerProps,
  TamaguiElement,
  StackNonStyleProps,
  SpacerStyleProps
>({
  acceptsClassName: true,
  memo: true,
  componentName: 'Spacer',
  validStyles,

  defaultProps: {
    ...stackDefaultStyles,
    // avoid nesting issues
    tag: 'span',
    size: true,
    pointerEvents: 'none',
  },

  variants: {
    size: {
      '...': getSpacerSize,
    },

    flex: {
      true: {
        flexGrow: 1,
      },
    },

    direction: {
      horizontal: {
        height: 0,
        minHeight: 0,
      },
      vertical: {
        width: 0,
        minWidth: 0,
      },
      both: {},
    },
  } as const,
})

export type SpacedChildrenProps = {
  isZStack?: boolean
  children?: React.ReactNode
  space?: SpaceValue
  spaceFlex?: boolean | number
  direction?: SpaceDirection | 'unset'
  separator?: React.ReactNode
  ensureKeys?: boolean
  debug?: DebugProp
}

export function spacedChildren(props: SpacedChildrenProps) {
  const { isZStack, children, space, direction, spaceFlex, separator, ensureKeys } = props
  const hasSpace = !!(space || spaceFlex)
  const hasSeparator = !(separator === undefined || separator === null)
  const areChildrenArray = Array.isArray(children)

  if (!ensureKeys && !(hasSpace || hasSeparator || isZStack)) {
    return children
  }

  const childrenList = areChildrenArray ? (children as any[]) : Children.toArray(children)

  const len = childrenList.length
  if (len <= 1 && !isZStack && !childrenList[0]?.['type']?.['shouldForwardSpace']) {
    return children
  }

  const final: React.ReactNode[] = []
  for (let [index, child] of childrenList.entries()) {
    const isEmpty =
      child === null ||
      child === undefined ||
      (Array.isArray(child) && child.length === 0)

    // forward space
    if (!isEmpty && React.isValidElement(child) && child.type?.['shouldForwardSpace']) {
      child = React.cloneElement(child, {
        space,
        spaceFlex,
        separator,
        key: child.key,
      } as any)
    }

    // push them all, but wrap some in Fragment
    if (isEmpty || !child || (child['key'] && !isZStack)) {
      final.push(child)
    } else {
      final.push(
        <Fragment key={`${index}0t`}>
          {isZStack ? <AbsoluteFill>{child}</AbsoluteFill> : child}
        </Fragment>
      )
    }

    // first child unspaced avoid insert space
    if (isUnspaced(child) && index === 0) continue
    // no spacing on ZStack
    if (isZStack) continue

    const next = childrenList[index + 1]

    if (next && !isEmpty && !isUnspaced(next)) {
      if (separator) {
        if (hasSpace) {
          final.push(
            createSpacer({
              key: `_${index}_00t`,
              direction,
              space,
              spaceFlex,
            })
          )
        }
        final.push(<Fragment key={`${index}03t`}>{separator}</Fragment>)
        if (hasSpace) {
          final.push(
            createSpacer({
              key: `_${index}01t`,
              direction,
              space,
              spaceFlex,
            })
          )
        }
      } else {
        final.push(
          createSpacer({
            key: `_${index}02t`,
            direction,
            space,
            spaceFlex,
          })
        )
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    if (props.debug) {
      log(`  Spaced children`, final, props)
    }
  }

  return final
}

type CreateSpacerProps = SpacedChildrenProps & { key: string }

function createSpacer({ key, direction, space, spaceFlex }: CreateSpacerProps) {
  return (
    <Spacer
      key={key}
      size={space}
      direction={direction}
      {...(typeof spaceFlex !== 'undefined' && {
        flex: spaceFlex === true ? 1 : spaceFlex === false ? 0 : spaceFlex,
      })}
    />
  )
}

function isUnspaced(child: React.ReactNode) {
  const t = child?.['type']
  return t?.['isVisuallyHidden'] || t?.['isUnspaced']
}

const AbsoluteFill: any = createComponent({
  defaultProps: {
    ...stackDefaultStyles,
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
  },
})

function hasAnimatedStyleValue(style: Object) {
  return Object.keys(style).some((k) => {
    const val = style[k]
    return val && typeof val === 'object' && '_animation' in val
  })
}

function getMediaState(
  mediaGroups: Set<string>,
  layout: LayoutEvent['nativeEvent']['layout']
) {
  return Object.fromEntries(
    [...mediaGroups].map((mediaKey) => {
      return [mediaKey, mediaKeyMatch(mediaKey, layout as any)]
    })
  )
}

const fromPx = (val?: number | string) =>
  typeof val !== 'string' ? val : +val.replace('px', '')

export const isDisabled = (props: any) => {
  return (
    props.disabled ||
    props.accessibilityState?.disabled ||
    props['aria-disabled'] ||
    props.accessibilityDisabled ||
    false
  )
}

export const subscribeToContextGroup = ({
  disabled = false,
  setStateShallow,
  pseudoGroups,
  mediaGroups,
  componentContext,
  state,
}: {
  disabled?: boolean
  setStateShallow: (next?: Partial<TamaguiComponentState> | undefined) => void
  pseudoGroups?: Set<string>
  mediaGroups?: Set<string>
  componentContext: ComponentContextI
  state: TamaguiComponentState
}) => {
  // parent group pseudo listening
  if (pseudoGroups || mediaGroups) {
    const current = {
      pseudo: {},
      media: {},
    } satisfies GroupState

    if (process.env.NODE_ENV === 'development' && !componentContext.groups) {
      console.debug(`No context group found`)
    }

    return componentContext.groups?.subscribe((name, { layout, pseudo }) => {
      if (pseudo && pseudoGroups?.has(String(name))) {
        // we emit a partial so merge it + change reference so mergeIfNotShallowEqual runs
        Object.assign(current.pseudo, pseudo)
        persist()
      } else if (layout && mediaGroups) {
        const mediaState = getMediaState(mediaGroups, layout)
        const next = mergeIfNotShallowEqual(current.media, mediaState)
        if (next !== current.media) {
          Object.assign(current.media, next)
          persist()
        }
      }
      function persist() {
        // force it to be referentially different so it always updates
        const group = {
          ...state.group,
          [name]: current,
        }
        setStateShallow({
          group,
        })
      }
    })
  }
}
