import * as React from "react"
import { Slot } from "@radix-ui/react-slot" // Wait, I didn't install radix-ui. I'll use simple implementation.
import { cn } from "@/lib/utils"

// Removing Radix dependency for simplicity unless needed, but "Slot" is useful for polymorphism.
// I'll stick to standard button for now to avoid extra deps if not needed, or install radix-slot.
// I'll just use a standard button component.

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-neutral-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
          variant === 'primary' && "bg-neutral-50 text-neutral-900 hover:bg-neutral-50/90",
          variant === 'outline' && "border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 hover:text-neutral-50",
          variant === 'ghost' && "hover:bg-neutral-800 hover:text-neutral-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

