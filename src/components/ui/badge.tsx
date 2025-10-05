import * as React from "react"

import { cn } from "../../lib/utils"

const badgeVariants = {
  default: "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 bg-blue-100 text-blue-800 border-blue-200",
  secondary: "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 bg-gray-100 text-gray-800 border-gray-200",
  destructive: "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 bg-red-100 text-red-800 border-red-200",
  outline: "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-gray-300 text-gray-700",
}

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: keyof typeof badgeVariants
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants[variant], className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }