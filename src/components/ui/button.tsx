import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-neutral-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === 'primary' && "bg-neutral-50 text-neutral-900 hover:bg-neutral-50/90",
          variant === 'outline' && "border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 hover:text-neutral-50",
          variant === 'ghost' && "hover:bg-neutral-800 hover:text-neutral-50",
          size === 'default' && "h-10 px-4 py-2",
          size === 'sm' && "h-9 px-3",
          size === 'lg' && "h-11 px-8",
          size === 'icon' && "h-10 w-10",
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


