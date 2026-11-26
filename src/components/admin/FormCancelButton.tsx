import { useRouter } from '@tanstack/react-router'

/**
 * "Cancel" for admin forms: goes straight back to where the admin came from,
 * no confirmation. When the form was opened directly (no in-app history),
 * it goes to `fallback` instead.
 */
export function FormCancelButton({ fallback, disabled, className, label = 'Cancel' }: {
  fallback: string
  disabled?: boolean
  className?: string
  label?: string
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (router.history.canGoBack()) router.history.back()
        else void router.navigate({ to: fallback as any })
      }}
      className={className ?? 'px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-md border border-transparent hover:border-zinc-700 transition-colors disabled:opacity-40'}
    >
      {label}
    </button>
  )
}
