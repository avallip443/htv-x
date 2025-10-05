import * as React from "react"

import { cn } from "../../lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white shadow hover:bg-blue-700",
    destructive: "bg-red-600 text-white shadow hover:bg-red-700",
    outline: "border border-gray-300 bg-white shadow hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 shadow hover:bg-gray-200",
    ghost: "hover:bg-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline",
  },
  size: {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  },
}

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }