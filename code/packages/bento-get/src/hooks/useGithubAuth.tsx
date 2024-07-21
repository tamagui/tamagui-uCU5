// @ts-nocheck
import fetch from 'node-fetch'
import querystring from 'node:querystring'
import open from 'open'
import { useCallback } from 'react'
import useSWR from 'swr'
import { GITHUB_CLIENT_ID } from '../constants.js'
import { useGithubAuthPooling } from './useGithubAuthPooling.js'

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:org',
    }),
  })
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  const result = await res.text()
  return result
}

export type GithubCode = {
  device_code: string
  expires_in: string
  interval: string
  user_code: string
  verification_uri: string
}

export const useGithubAuth = () => {
  let { data, error, isLoading } = useSWR<string>(
    'https://github.com/login/device/code',
    fetcher
  )

  // @ts-ignore
  data = querystring.parse(data || '')
  useGithubAuthPooling({ deviceCodeData: data as any as GithubCode })

  const openLoginUrl = useCallback(() => {
    if (isLoading) return
    if (error) return
    if (!data) return
    open('https://github.com/login/device')
  }, [data, error, isLoading])

  return {
    data,
    error,
    isLoading,
    openLoginUrl,
  }
}
