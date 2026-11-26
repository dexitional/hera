import { useState, type ReactNode } from 'react'
import { cn } from '#/lib/utils'

/** tel: link for a USSD string. "#" must be escaped or the browser drops everything after it. */
export function ussdTelHref(dial: string): string {
  return `tel:${dial.replace(/#/g, '%23')}`
}

/** Touch-first device (phone/tablet), where tel: opens the dialer. */
function isPhoneLike(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}

/**
 * A USSD code that opens the phone's dialer with the code filled in when
 * tapped on a phone. On a desktop, where tel: would launch FaceTime/Skype,
 * clicking copies the code instead.
 */
export default function DialLink({ dial, className, children }: { dial: string; className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  return (
    <a
      href={ussdTelHref(dial)}
      onClick={(e) => {
        e.stopPropagation()
        if (isPhoneLike()) return
        e.preventDefault()
        navigator.clipboard?.writeText(dial).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }).catch(() => {})
      }}
      aria-label={`Dial ${dial}`}
      title="Tap to dial on your phone"
      className={cn('underline decoration-dotted underline-offset-4 hover:decoration-solid', className)}
    >
      {copied ? 'Copied!' : children ?? dial}
    </a>
  )
}
