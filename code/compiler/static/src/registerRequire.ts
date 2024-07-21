import { register } from 'esbuild-register/dist/node'

import { requireTamaguiCore } from './helpers/requireTamaguiCore'
import type { TamaguiPlatform } from './types'
import { esbuildIgnoreFilesRegex } from './extractor/bundle'

const nameToPaths = {}

export const getNameToPaths = () => nameToPaths

const Module = require('node:module')
const packageJson = require('react-native-web/package.json')
const proxyWorm = require('@tamagui/proxy-worm')
const rnw = require('react-native-web')

let isRegistered = false
let og: any

const whitelisted = {
  react: true,
}

const compiled = {}
export function setRequireResult(name: string, result: any) {
  compiled[name] = result
}

export function registerRequire(
  platform: TamaguiPlatform,
  { proxyWormImports } = {
    proxyWormImports: false,
  }
) {
  // already registered
  if (isRegistered) {
    return {
      tamaguiRequire: require,
      unregister: () => {},
    }
  }

  const { unregister } = register({
    hookIgnoreNodeModules: false,
  })

  if (!og) {
    og = Module.prototype.require // capture esbuild require
  }

  isRegistered = true

  Module.prototype.require = tamaguiRequire

  function tamaguiRequire(this: any, path: string) {
    if (path === 'tamagui' && platform === 'native') {
      return og.apply(this, ['tamagui/native'])
    }

    if (path === '@tamagui/core' || path === '@tamagui/web') {
      return requireTamaguiCore(platform, (path) => {
        return og.apply(this, [path])
      })
    }

    if (path in compiled) {
      return compiled[path]
    }

    if (esbuildIgnoreFilesRegex.test(path)) {
      return {}
    }

    if (
      path === '@gorhom/bottom-sheet' ||
      path.startsWith('react-native-reanimated') ||
      path === 'expo-linear-gradient' ||
      path === '@expo/vector-icons' ||
      path === 'tamagui/linear-gradient' ||
      path === 'react-native-svg'
    ) {
      return proxyWorm
    }
    if (path === 'react-native/package.json') {
      return packageJson
    }

    if (path === 'react-native-web-lite' || path.startsWith('react-native')) {
      return rnw
    }

    if (path in knownIgnorableModules) {
      return proxyWorm
    }

    if (!whitelisted[path]) {
      if (proxyWormImports && !path.includes('.tamagui-dynamic-eval')) {
        if (path === 'tamagui') {
          return og.apply(this, [path])
        }
        return proxyWorm
      }
    }

    try {
      const out = og.apply(this, arguments)
      // only for studio disable for now
      // if (!nameToPaths[path]) {
      //   if (out && typeof out === 'object') {
      //     for (const key in out) {
      //       try {
      //         const conf = out[key]?.staticConfig as StaticConfig
      //         if (conf) {
      //           if (conf.componentName) {
      //             nameToPaths[conf.componentName] ??= new Set()
      //             const fullName = path.startsWith('.')
      //               ? join(`${this.path.replace(/dist(\/cjs)?/, 'src')}`, path)
      //               : path
      //             nameToPaths[conf.componentName].add(fullName)
      //           } else {
      //             // console.log('no name component', path)
      //           }
      //         }
      //       } catch {
      //         // ok
      //       }
      //     }
      //   }
      // }
      return out
    } catch (err: any) {
      if (
        !process.env.TAMAGUI_ENABLE_WARN_DYNAMIC_LOAD &&
        path.includes('tamagui-dynamic-eval')
      ) {
        // ok, dynamic eval fails
        return
      }
      if (allowedIgnores[path] || IGNORES === 'true') {
        // ignore
      } else if (!process.env.TAMAGUI_SHOW_FULL_BUNDLE_ERRORS && !process.env.DEBUG) {
        if (hasWarnedForModules.has(path)) {
          // ignore
        } else {
          hasWarnedForModules.add(path)
          console.info(
            `  tamagui: skipping ${path} tamagui.dev/docs/intro/errors#warning-001`
          )
        }
      } else {
        /**
         * Allow errors to happen, we're just reading config and components but sometimes external modules cause problems
         * We can't fix every problem, so just swap them out with proxyWorm which is a sort of generic object that can be read.
         */

        console.error(
          `Tamagui failed loading "${path}"
  
  ${err.message}
  ${err.stack}

  `
        )
      }

      return proxyWorm
    }
  }

  return {
    tamaguiRequire,
    unregister: () => {
      unregister()
      isRegistered = false
      Module.prototype.require = og
    },
  }
}

const IGNORES = process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS
const extraIgnores =
  IGNORES === 'true' ? [] : process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS?.split(',')
const knownIgnorableModules = {
  'expo-modules': true,
  solito: true,
  ...Object.fromEntries(extraIgnores?.map((k) => [k, true]) || []),
}

const hasWarnedForModules = new Set<string>()

const allowedIgnores = {
  'expo-constants': true,
  './ExpoHaptics': true,
  './js/MaskedView': true,
}
