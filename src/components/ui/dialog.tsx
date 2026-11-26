import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Cross1Icon } from "@radix-ui/react-icons"

import { cn, modalPage } from "#/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, forwardedRef) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        // Lighter scrim so the page shows (blurred) through the glass modal.
        "fixed inset-0 z-50 bg-[#0a192a]/55 backdrop-blur-[3px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      )}
    />
    <DialogPrimitive.Content
      ref={forwardedRef}
      className={cn(
        `fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-${modalPage.state.size} -translate-x-1/2 -translate-y-1/2`,
        // Glass: translucent dark navy, heavy backdrop blur, fine light edge and top highlight.
        "rounded-3xl border border-white/15 bg-[#1a2c46]/70 backdrop-blur-2xl backdrop-saturate-150 p-6 text-white",
        "shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.10)]",
        "focus:outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        "data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className={cn(
          "absolute right-4 top-4 rounded-full p-2",
          "text-zinc-400 hover:text-zinc-200",
          "hover:bg-white/5",
          "focus:outline-none focus:ring-2 focus:ring-purple-400/50",
        )}
      >
        <Cross1Icon />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))

DialogContent.displayName = "DialogContent"
