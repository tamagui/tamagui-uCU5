import { useContext } from 'react'
import useSWR from 'swr'
import { AppContext } from '../commands/index.js'
import { GITHUB_CLIENT_ID } from '../constants.js'
import type { GithubCode } from './useGithubAuth.js'

export const useGithubAuthPooling = ({
  deviceCodeData,
}: { deviceCodeData: GithubCode }) => {
  const appContext = useContext(AppContext)

  const fetchAccessToken = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        // client_id: deviceCodeData.client_id,
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCodeData.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch access token')
    }
    const result = await response.json()

    if (result.error) {
      throw new Error(result.error)
    }
    if (result.access_token) {
      // Handle success - save access token, navigate user away from auth screen, etc.
      appContext.tokenStore.set('token', result)
      result.access_token
    } else {
      // Handle waiting for user to authorize, or showing an error message
      // console.log("Waiting for for user authorization...");
    }
    return result
  }

  const { data, error, isLoading } = useSWR<string>(
    appContext.install?.enterToOpenBrowser && deviceCodeData
      ? 'https://github.com/login/oauth/access_token'
      : null,
    fetchAccessToken,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // // Never retry on 404.
        // if (error.status === 404) return;

        // // Never retry for a specific key.
        // if (key === "/api/user") return;

        // // Only retry up to 10 times.
        // if (retryCount >= 10) return;

        // Retry after 5 seconds.
        setTimeout(() => revalidate({ retryCount }), 5000)
      },
    }
  )
  return { data, error, isLoadingPooling: isLoading }
}
