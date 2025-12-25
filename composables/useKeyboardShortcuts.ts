import { onMounted, onUnmounted } from 'vue'
import { useRouter } from '#imports'

export interface ShortcutHandler {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export const useKeyboardShortcuts = (shortcuts: ShortcutHandler[]) => {
  const handleKeydown = (e: KeyboardEvent) => {
    // Don't trigger when typing in input fields
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.alt ? e.altKey : !e.altKey
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return { shortcuts }
}

// Common shortcuts for product listing pages
export const useProductListShortcuts = (options: {
  onScrollUp?: () => void
  onScrollDown?: () => void
  onSearch?: () => void
  onFilter?: () => void
  onHome?: () => void
}) => {
  const router = useRouter()

  const shortcuts: ShortcutHandler[] = [
    {
      key: 'j',
      handler: options.onScrollDown || (() => window.scrollBy({ top: 300, behavior: 'smooth' })),
      description: '向下滾動'
    },
    {
      key: 'k',
      handler: options.onScrollUp || (() => window.scrollBy({ top: -300, behavior: 'smooth' })),
      description: '向上滾動'
    },
    {
      key: 'g',
      handler: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      description: '回到頂部'
    },
    {
      key: 'G',
      shift: true,
      handler: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
      description: '到底部'
    },
    {
      key: '/',
      handler: options.onSearch || (() => {}),
      description: '搜尋'
    },
    {
      key: 'f',
      handler: options.onFilter || (() => {}),
      description: '開啟篩選'
    },
    {
      key: 'h',
      handler: options.onHome || (() => router.push('/')),
      description: '回首頁'
    },
    {
      key: '?',
      shift: true,
      handler: () => {
        // Show shortcuts help - 可在此處添加 modal 顯示快捷鍵說明
      },
      description: '顯示快捷鍵說明'
    }
  ]

  return useKeyboardShortcuts(shortcuts)
}

// Shortcuts for product detail pages
export const useProductDetailShortcuts = (options: {
  onPrev?: () => void
  onNext?: () => void
  onShare?: () => void
  onBack?: () => void
}) => {
  const router = useRouter()

  const shortcuts: ShortcutHandler[] = [
    {
      key: 'ArrowLeft',
      handler: options.onPrev || (() => {}),
      description: '上一個商品'
    },
    {
      key: 'ArrowRight',
      handler: options.onNext || (() => {}),
      description: '下一個商品'
    },
    {
      key: 's',
      handler: options.onShare || (() => {}),
      description: '分享'
    },
    {
      key: 'Backspace',
      handler: options.onBack || (() => router.back()),
      description: '返回'
    },
    {
      key: 'j',
      handler: () => window.scrollBy({ top: 300, behavior: 'smooth' }),
      description: '向下滾動'
    },
    {
      key: 'k',
      handler: () => window.scrollBy({ top: -300, behavior: 'smooth' }),
      description: '向上滾動'
    },
    {
      key: 'g',
      handler: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      description: '回到頂部'
    }
  ]

  return useKeyboardShortcuts(shortcuts)
}
