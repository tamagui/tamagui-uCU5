import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import { installGlobals } from '@remix-run/node'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tamaguiPlugin, tamaguiExtractPlugin } from '@tamagui/vite-plugin'
import commonjs from 'vite-plugin-commonjs'
import { analyzer } from 'vite-bundle-analyzer'

installGlobals()

export default defineConfig({
  clearScreen: false,
  plugins: [
    tamaguiPlugin() as any,
    tamaguiExtractPlugin({
      logTimings: true,
    }),
    remix(),
    tsconfigPaths(),
    commonjs({
      filter(id) {
        if (id.includes('node_modules/@react-native/normalize-color')) {
          return true
        }
      },
    }),
    analyzer({
      analyzerMode: 'static',
      fileName: 'report',
    }),
  ],
})
