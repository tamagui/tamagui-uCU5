- config v4 = no custom fonts just defaults for each platform
- RN transform type accepts string style props now but tamagui doesn't
- opacity `/50`
- AnimateList
  - like AnimatePresence but for >1 items
  - AnimatePresence keepMounted={} prop?
  - can handle direction + let you control mount behavior

- remove scroll not working when Dialog adapted to Sheet on mobile
  - we may want Sheet to have its own removeScroll in this case

- AnimatePresence should just work if you change the enterStyle exitStyle dynamically in the render, no need for custom we can capture the props

- popover transform origin
  - https://codesandbox.io/p/sandbox/floating-ui-react-scale-transform-origin-qv0t1c?file=%2Fsrc%2FApp.tsx%3A43%2C25
- v2 - boxShadow
- Setting default props for any style in a parent (variables dynamic / themes dynamic down the tree)

Nate:

- Popover click outside prop

---

- data-disable-theme is being passed down on web snapshots

- 2.0 = redo/remove ThemeableStack
- v3 themes: all of the focus styles in the default v3 config are kind of wack
- activeTheme props for all components
- in dev mode if no checkbox indicator, warn
  - checkbox should have a default indicator probably with a simple svg check we inline
- move from useMedia match.addListener to addEventListener
- 2.0 = TS 5 recent version support raise - no more `as const` needed
- media query height taking into account the "safe height" is important
- https://linear.app/uniswap/issue/EXT-925/tamagui-error-breaking-the-extension
- document Popover.Anchor
- Sometimes press getting stuck still on uniswap moonpay flow
- Text vertical align issue: https://github.com/Uniswap/universe/pull/6730

---

Tentpole projects:

- Marketplace
- Studio launch
- Storybook/hosted docs
- Takeout 2 / vxrn/stack

Needed features/maintenance:

- ( Pending PRs ) RSD / web alignment
  - follow what RSD is doing + dont go beyond native support eg aspect-ratio
  - deprecate accessibility props, "focusable" => tabIndex
  - simple version is good
  - lower priority - em/rem, other nice web styles that rsd/tailwind has
- RSC support
  - just simple views like View/Text/etc + no need for nesting themes
  - need to remove context
- v2 / headless

  - ( Pending PR ) deprecate some createTamagui settings that should move into settings
    - disableSSR => settings.disableSSR
  - ListItem/Button simplify APIs
  - ( Pending PR ) Image/Input deprecations for web alignment

- native tests (detox?)
- 0-runtime mode
- @tamagui/kit - includes native versions of many things
- remove RNW - Input, Image

Ongoing work:

- Takeout
- Bento
- Core

---

- Popper arrow logic is bad, needs unstyled support and not to do weird shifting of sizes

---


- No need for View + Text (just Element and we can extend it later)

  - We'd need to mimic text inhertance on native (or remove it on web)
  - https://github.com/facebook/react-strict-dom/blob/429e2fe1cb9370c59378d9ba1f4a40676bef7555/packages/react-strict-dom/src/native/modules/createStrictDOMComponent.js#L529

- <Theme name="dark"> force below root dark causing hydration issues

- Animation + shadowOffset is causing crash in iOS due to object value

  - "auto" too

- Adapt needs public API to support any adaptation

- v2-3 ListItem simplification esp for performance of Select

- Select Virtualization

- style()

- i think acceptTokens + compiler not working (see selectionColor)

- settings page in takeout SSR hydration issue due to useThemeSetting

- animatedStyle showing up in animated component snapshot on native

  - add some native snapshots in ci tests

- addTheme updateTheme regression needs a test

- type to search on Select regressed

- // TODO: pulling past the limit breaks scroll on native, need to better make ScrollView

- icons move from themed() to just styled()

- native theme change warning logs + theme change speed

- document popover hoverable + onOpenChange second arg via

- add $mouse to takeout

- bug in generated icon props

  - https://discord.com/channels/909986013848412191/1178185816426680370/1199854688233857136

- compiler - no need to setup any separate package

- 2.0 rename SizableStack to Surface and simplify a bit

- Remove the need for Text

- document the t_unmounted / SSR
- popovers work with no js

- TODO
  - process.env.TAMAGUI_TARGET === 'native' ? false : props['data-disable-theme']
  - this looks wrong? shouldnt it be the same as on native? we may be doubling them on accident
- Select `ListItemFrame` area is messy/slow due to inline styles and complex components
- propMode

- make styled() only not accept most non-style props

studio: add outlineColor and the pseudos
studio: export for takeout option

outlineWidth get smaller at smaller size

studio:

- Scale / ScaleSelect
  should be a Menu with mini visualizations of the lum/sat scales for each

- gradient style
- "var" mode where it changes types of $ to var(--)
- calc?

- get takeout users studio access

- studio color scales first class:

  - adding a color/scale really adds a theme
  - but also adds $colorName1 => $colorNameX to base theme

- check usePropsAndStyle with group props

- studio: the accent color need an accent color that reverses back
- studio: make the scales "anchor" around the selected color better
  - exact color should be at the 14 position always
- studio: add outline, outlineHover, etc
- studio: add partial transparent for each color step?

- // TODO breaks next.js themes page
- alt themes don't change color1-9 so you can't do color2 and then make the alt theme make it more subtle, but they should

- disableClassName breaking css animation
- css animateOnly should always force style tag styles

- 2.0 make it just is the current state with fixes, unstyled across everything, and make various smaller breaking changes in api surfaces that need cleanup

  - recommended config with more strict settings etc
  - a few theme setups you can choose from

- Takeout theme change needs a server restart / theme builder not re-building on changing colors.ts
- Theme reset Button not changing
- ZStack is abs positioning children...

---

Web:

- createTamagui({ settings: { webMode: true } })
- No Text/Stack, just `styled.div` ?
- avoids console warning on Text
- `@tamagui/style` separate from core
- instead of validStyleProps use validNONStyleProps
  - that way for web all style props pass through automatically
  - also likely smaller bundle size (smart detect `onX`)
- have a CSS mode
- styled('div')
- avoid flat style props + plugin for styled() control
- beforeStyles + afterStyles array

---

`style`

- enables Input taking { autofillSelectedStyle: Style }, or any component accepting a style object as a prop

```tsx
import { Stack, style } from '@tamagui/core'

// make it so style props accepts either a regular style object
// or something like this (can be exported from core):

type StackStyle = {
  base: ViewStyle
  press?: ViewStyle
  hover?: ViewStyle
  focus?: ViewStyle
}

const mySubStyle: StackStyle = style(Stack, {
  backgroundColor: 'red', // optimizes on web to _bg-red

  pressStyle: {
    backgroundColor: 'blue', // optimizes on web to _press-bg-blue
  }
})

const MyComponent = (props: { accentedStyle?: StackStyle }) => {
  return (
    <Stack style={[accentedStyle]} />
  )
}


```

---

config: {
settings: {
styleStrategy: { type: 'prop', prop: 'sx', acceptFlatStyles: true }
}
}

---

HEADLESS=1

- env HEADLESS sets unstyled: true by default
- createX
- eject command

---

Smaller features:

- no-rerender psuedo styles on native when using reanimated driver (fernando PR)
- imperative methods for many things - sheet, popover, etc, close etc
- ssr safe themeInverse would be pretty nice
- styled(ExternalComponent) should always allow Partial props
  - but if you do provide the props ideally it should 'know' they are pre-filled and therefore not required anymore
  - also it should make sure to make those props required if they aren't set in styled()
- avoid css extract on server mode next.js?

---

Performance:

- TAMAGUI_OPTIMIZE_NATIVE_VIEWS on by default using proper prop mapping
- compiler can add `disableEvents` `disableTheme` to avoid hooks
- optimization of useTheme/getSplitStyles seems like it has some decent stuff
- could lazy expand styles
- get dynamicEval working automatically
- warn on styled(Pressable) and styled(TouchableOpacity)

---

Studio:

- Scales
  - All color scales should have an option/check to turn on/off their control over saturation
  - In fact split out saturation scales
  - Remove luminosity slider for base theme just keep for contrast
  - Customize scale popover lets you name a new one, change the values
- Contrast
  - needs to be able to pick the foreground color manually
  - by default it picks a nice contrast (opposite scale end) foreground
  -
- Mask themes
  - Need to be fixed in general and improved defaults
- Final Step

  - Add a final preview set where you can choose any theme for every box section, that way you can preview you main theme + contrast, but also your sub-themes on some boxes, getting very interesting combos
  - Needs to have a overview view of the themes you generated, a grid of cards showing their names, palette, scales, etc, this will be re-used on the purchase page for free/pro themes

- Post-release
  - Sharing your themes should be a thing, hit publish and it makes the final step overview screen + other users can load it into their studio = more sharing on twitter etc

---

CLI:

- `tama upgrade` - official tamagui upgrade that works across bundlers
- `tama doctor` - checks dependencies to be consistent
- `tamagui [clone|eject] Sheet ./packages/sheet`
  - clones the sheet package into your repo somewhere

---

Components:

- Native

  - Select
    - iOS Select as well as the newer SwiftUI menu style Picker
  - Sheet native android - https://github.com/intergalacticspacehighway/react-native-android-bottomsheet

- Menu
- DatePicker

---

Maintenance:

- biome checks for react hooks early returns
- deprecate rnw-lite when we can after making sure all tests / animation drivers pass on rnw
- TODO this could definitely be done better by at the very minimum
  - this entire proxy could be removed in favor of the proxy we make on initial theme creation, and just having a way to subscribeThemeGet(theme, (key, val) => any) at the useThemeWithState callsite

---

V2:

- breaking:
  - shorthands
    - col => c
    - remove bg/bc confusion
  - remove suppressHighlighting / margin 0 default from Text
  - compiler can accumulate them and emit a file?
- basic plugins system
- no separate UI package necessary for optimization
- if dynamic eval flattens every usage, remove the definition
- headless
- zero runtime

---

# Backlog

- move simple-web to themeBuilder

- Popover.Close inside Sheet

- merge font-size and get-font-sized packages

- cli needs a start update command just runs diff against your `~/.tamagui/tamagui`

- sheet native iOS snapPoints

  - pre release 2.0 version of library
  - https://github.com/dominicstop/react-native-ios-modal/blob/wip/example/src/examples/Test09.tsx

- CI not failing on type errors in code/tamagui.dev
  a package.json etc etc + zip file

- @alt Sheet inside Popover breaks css animation:

  - https://tamagui.dev/docs/components/popover

- Studio: drag and drop a font and you can configure the subset

  - automatically converts to the right output formats
  - auto generates CSS
  - bundles it into

- <Sheet native />
  - https://github.com/dominicstop/react-native-ios-modal
  - we'd want expo module + snap points

- <ActionSheet />
- plus `native` prop https://reactnative.dev/docs/actionsheetios

- add test that builds site for prod + checks for header text / no errors

- Switch unstyled - make it so it doesn't do any theme stuff

- font-family is being output to DOM on text element
- font weights in css are generating extra variables with "undefined" value if not filled in
- add defaultSize and defaultFontFamily to createTamagui

  - all instances of $true can become getConfig().defaultSize
  - all instances of $body can become getConfig().defaultFontFamily
  - remove the validation in createTamagui that enforces the keys

- relative sizing first class (and relative color)

  - add `defaultSize`, and `defaultColor`
  - add `relative()` helpers

- bug: inputs rendering twice due to focusableInputHOC, if you remove that it doesn't, this is due to styled() + how it determines ComponentIn and grabs the component

- document `unstyled` prop for components

- docs for `@tamagui/font` and `@tamagui/theme`

- https://github.com/tamagui/tamagui/pull/765

- getVariableValue(props.fontFamily) doesn't look right

support new RN props:
https://reactnative.dev/blog/2023/01/12/version-071#web-inspired-props-for-accessibility-styles-and-events

Ali:

- [ ] document keyboard avoiding view in `Sheet.mdx`
- [ ] input bug
- [ ] @tamagui/change-animation-driver document
- [ ] Disable warning ENV + configuration.md docs
  - [ ] (nate) make focusStyle border darker
- [ ] bezier on css animations
  - [ ] disablePassBorderRadius feels like a weird thing to need by default
    - change Group's disablePassBorderRadius to something else - perhaps the negation, passBorderRadius? i'm not sure. what do you think about this @natew
      alternatively we could have disablePassBorderRadius default to true only on Tabs.List. but then overriding it would feel awkward (having to pass disablePassBorderRadius={false})
  - [ ] and document on styled() page
- native component modes
  - [ ] `RadioGroup`, `Select` native (web)
  - [ ] `Switch` native (mobile)

---

1.X

- web forms events bubble
- vertical slider native can be janky
- accessibility keyboard navigation (Menu component potentially)
- test: useMedia, reanimated, re-renders (mount, on hover, etc), render time ms
- CD on github
- home page sponsors with sizing and better logos
  - https://github.com/JamesIves/github-sponsors-readme-action
- keyboard search select bug
- createThemes accepts array not object
- site \_app has t_unmounted helper, move that into tamagui proper

---

2.0

- remove from web (can keep in core or make pluggable):
  - themeable
  - space
  - can have an env setting to exclude all the theme generation stuff if you are using the pre-build: `getThemeCSSRules`
- replace all RN stuff left in tamagui: Image, Input, Spinner, etc
- Accessibility + RTL
- tag="a" should get the typed props of a link

---

- react native pressable in pressable

- tama sync
  - make it easy to have a template repo that people sync to
  - includes the git sync stuff from cli now
  - copies/diffs/merges every file there just based on heuristics
  - somehow choose "merge/overwrite/diff"
  - smart defaults
    - package.json etc
    - binary assets overwrite (if not changed, else prompt)
- setup script can power `tama sync` to sync the repo to its parent repo

- site web fonts (can also be a feature of font bundles)

  - https://www.lydiahallie.io/blog/optimizing-webfonts-in-nextjs-13
  - https://simonhearne.com/2021/layout-shifts-webfonts/#reduce-layout-shift-with-f-mods

- drag on switch
- prebuild option
  - de-dupes css
  - fixes next.js next load css
  - simplifies initial setup and need for plugins
- site snack + demo embed on all pages floating that scales up on hover on large screengrid or augment
- lighthouse score ci
- pass Size down context (see Group) is this just Themes but for individual props (css variable direct support <Theme set={{ size: '$4' }}> ?)?
- kitchen sink snack on site
- what works for compilation / examples
- @tamagui/sx
- @tamagui/tailwind
- pass Size down context (see Group) but really this is just Themes but for individual props (css variable direct support <Theme set={{ size: '$4' }}> ?)
- native props on more components
- space => gap
- <ActionSheet />
- check deps are matching in compiler startup
- can optimize useMedia / many hooks:
  - https://twitter.com/sebmarkbage/status/1576603375814070273
- dual direction scrollview shouldn't need two nested see CodeDemoPreParsed
- container queries
- `variantsOnly: true` on styled(), removes types for anything but variants (and className/theme etc)
- way to use tamagui with custom design system tokens
  - basically map any tokens you choose to internal tamagui ones
- input like button
- allow string values alongside numbers (nativebase port)
- media `$light` and `$dark` for overrides
- built in jsx => css converter
- `tag` => `as` (keep fallback around as deprecated)
  - `as={['a', { ...props }]}`
- breaking change notifier cli
- VSCode => "turn JSX into styled()"
- pass in SharedValue to any prop for animations
- try using react-native-web $css object support for classnames
- animation accept useAnimatedStyle
- Switch gesture
- loadFont, loadAnimations
- <Debug><...><Debug/> turns on debugging for all in tree and shows them nested
- <Icon />
  - use theme values and size values
  - can swap for other icon packs (use createTamagui({ icons }))
- <Autocomplete />
- <Select.SearchInput />
- <Text fontSize="parent" />
- <UL /> <LI /> <OL />
- hoverStyle={{ [XStack]: {} }}
- <List.Section /> see (https://developer.apple.com/documentation/swiftui/list Section)
- <GradientText /> can work native with
  - https://github.com/react-native-masked-view/masked-view
- react-native-skia / svg image support
- beforeStyle, afterStyle could work ...
  - only if we can do with pseudos:
    - focusStyle={{ after: { fullscreen: true, border... } }}
    - allows for proper focused borders that don't require super hacks
    - see Switch
  - radio may be List.Radio just combines List, Label, Drawer
    - can use Switch or check or custom
- focusWithinStyle
- accessibility upgrades (focus rings etc)
- skeleton just using Theme / variables

---

<Menu />

- https://www.radix-ui.com/docs/primitives/components/dropdown-menu
- basically a popover + mouse helpers + built in item element
- don't need sub-menu for first iteration but... could if it's easier to at once
- floating-ui has helpers for this too
- `native` prop to do ContextMenu in iOS
  - ios:
    - Zeego uses react-native-ios-context-menu
    - https://github.com/nandorojo/zeego/blob/master/packages/zeego/src/menu/create-ios-menu/index.ios.tsx
  - android:
    - Zeego uses
    - @react-native-menu/menu
    - https://github.com/nandorojo/zeego/blob/master/packages/zeego/src/menu/create-android-menu/index.android.tsx

---

<Skeleton />

<Skeleton />
  <Skeleton.Gradient />
</Skeleton>

```tsx
const Skeleton = styled(Stack, {
  animation: {
    name: 'quick',
    loop: true
  },
  enterStyle: {
    x: '100%',
  },
  exitStyle: {
    x: '-100%',
  },
  background: `linear-gradient(to left, $background, $color, $background)`,
})
```

-

# Themes

Component themes could force set the actual properties even if they aren't set by the component themselves....

```tsx
themes.dark_Button = {
  borderWidth: 1,
  borderColor: 'red',

  // is this doable?
  beforeStyle: [{}],
}
```

=

# Winamp Re-skinability

Themes can completely transform the look and feel, a button could have multiple shadows/reflections in one theme, but be totally flat in another.

- 3.0 - single forward pass generates the css alongside the style object

  - in general we need a better system for controlling if we apply active theme or not, or letting consumers control the active styling in general on things
    - perhaps we do active theme by default (unless unstyled: true)
    - <ToggleGroup activeItemProps={{ active: true }}>
    - <ToggleGroup.Item /> then would recieve active={true}?
    - defaults to theme: 'active'

- `import { _ } from '@tamagui/core'`
  - `<_.view />` `<_.text />`
  - put it on globalThis and override type for super quick authoring
  - can extend with your own
    - `<_.p />` `<_.a />` `<.img />` etc
  - can proxy to itself allowing for naming?
    - `<_.view.my-thing />`
