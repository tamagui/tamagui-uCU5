import { ThemeTint } from '@tamagui/logo'
import { useLoader } from 'vxs'
import { getMDXComponent } from 'mdx-bundler/client'
import { useMemo } from 'react'
import { SubTitle, nbspLastWord } from '~/components/SubTitle'
import { DocsQuickNav } from '~/features/docs/DocsQuickNav'
import { HomeH1 } from '~/features/site/home/HomeHeaders'

import { getAllFrontmatter, getMDXBySlug } from '@tamagui/mdx'
import { components } from '~/features/mdx/MDXComponents'
import { HeadInfo } from '~/components/HeadInfo'
import { getOgUrl } from '~/features/site/getOgUrl'

export async function generateStaticParams() {
  const frontmatters = getAllFrontmatter('data/docs/core')
  const paths = frontmatters.map(({ slug }) => ({
    slug: slug.replace(/.*docs\/core\//, ''),
  }))
  return paths
}

export async function loader({ params }) {
  const { frontmatter, code } = await getMDXBySlug('data/docs/core', params.slug)
  return {
    frontmatter,
    code,
  }
}

export default function DocCorePage() {
  const { code, frontmatter } = useLoader(loader)
  const Component = useMemo(() => getMDXComponent(code), [code])

  return (
    <>
      <HeadInfo
        title={`${frontmatter.title}`}
        description={frontmatter.description}
        openGraph={{
          images: [
            {
              url: getOgUrl({
                title: frontmatter.title,
                description: frontmatter.description ?? '',
                category: 'intro',
              }),
            },
          ],
        }}
      />
      <HomeH1>{nbspLastWord(frontmatter.title)}</HomeH1>
      <SubTitle>{nbspLastWord(frontmatter.description || '')}</SubTitle>
      <ThemeTint>
        <Component components={components as any} />
      </ThemeTint>
      <DocsQuickNav />
    </>
  )
}
