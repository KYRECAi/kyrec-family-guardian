import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,opacity,box-shadow] duration-[var(--motion-fast,250ms)] ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-violet text-paper hover:brightness-105",
        ghost: "bg-transparent text-fg hover:bg-black/5",
        outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-black/4",
        soft: "bg-violet/12 text-violet hover:bg-violet/18",
        gold: "bg-gold text-fg hover:brightness-105",
        danger: "bg-danger/15 text-danger hover:bg-danger/25",
        subtle: "bg-panel-2 text-fg shadow-[var(--shadow-border)] hover:bg-ink-2",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-5 text-base",
        icon: "size-11 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
