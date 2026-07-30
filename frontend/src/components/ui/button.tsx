import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-[12px] border border-transparent bg-clip-padding",
    "text-sm font-semibold tracking-wide whitespace-nowrap",
    "transition-[background-color,box-shadow] duration-200 ease-out select-none",
    "focus-visible:ring-[3px] focus-visible:ring-ring/20",
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-sm shadow-primary/15",
          "hover:brightness-105 hover:shadow-md hover:shadow-primary/20",
        ].join(" "),
        outline: [
          "border-border/60 bg-background/80 backdrop-blur-sm text-foreground",
          "hover:bg-muted/80",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:border-input dark:bg-input/20 dark:hover:bg-input/40",
          "shadow-sm",
        ].join(" "),
        secondary: [
          "bg-secondary/90 text-secondary-foreground shadow-sm",
          "hover:bg-secondary hover:shadow-md",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ].join(" "),
        ghost: [
          "hover:bg-muted/80 hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:hover:bg-muted/40",
        ].join(" "),
        destructive: [
          "bg-destructive/10 text-destructive shadow-sm",
          "hover:bg-destructive/20",
          "focus-visible:ring-destructive/20",
          "dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        glow: [
          "bg-primary text-primary-foreground shadow-lg shadow-primary/45",
          "hover:shadow-xl hover:shadow-primary/55 hover:brightness-105",
          "after:absolute after:inset-0 after:rounded-[12px] after:ring-2 after:ring-primary/0 after:transition-[ring-color] after:duration-200 after:ease-out hover:after:ring-primary/15",
        ].join(" "),
      },
      size: {
        default:
          "h-8 gap-2 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-5 gap-1 rounded-[12px] px-2 text-xs in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-6 gap-1.5 rounded-[12px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-10 gap-2.5 px-5 text-base rounded-[12px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-5 rounded-[12px] in-data-[slot=button-group]:rounded-[12px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-6 rounded-[12px] in-data-[slot=button-group]:rounded-[12px]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
