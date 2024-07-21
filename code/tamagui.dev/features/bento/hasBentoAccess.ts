import { getBentoCode, supabaseAdmin } from '~/features/auth/supabaseAdmin'

export const hasBentoAccess = async (githubId: string) => {
  const result = await supabaseAdmin.rpc(
    // @ts-expect-error
    'has_bento_access',
    {
      github_id_input: githubId,
    }
  )
  const got = result?.data as unknown as any[]
  return Boolean(got?.length)
}
