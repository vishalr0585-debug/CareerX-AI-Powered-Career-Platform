import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_16px_hsl(var(--primary)/0.4)] hover:brightness-110 active:scale-[0.97]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.97]",
        outline: "border border-border/60 bg-background/60 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30 active:scale-[0.97]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.97]",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(238,70%,65%)] to-[hsl(var(--chart-4))] text-white shadow-[0_2px_12px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_24px_hsl(var(--primary)/0.5)] hover:brightness-110 active:scale-[0.97] animate-gradient-flow",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        xl: "h-12 rounded-2xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
