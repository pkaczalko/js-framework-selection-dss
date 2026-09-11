<script lang="ts">
  import { navigate, isActive, isActivePrefix } from '@/lib/router.svelte'

  interface Props {
    href: string
    class?: string
    active?: boolean
    children?: import('svelte').Snippet
  }

  let { href, class: className = '', active, children }: Props = $props()

  const computedActive = $derived(
    active ?? (href === '/' ? isActive('/') : isActivePrefix(href)),
  )

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    navigate(href)
  }
</script>

<a {href} class="{className}{computedActive ? ' active' : ''}" onclick={handleClick}>
  {@render children?.()}
</a>
