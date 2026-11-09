import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export const buttonVariants = cva(
  "ui-control inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress disabled:aria-busy:opacity-100 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-accent-hover",
        secondary: "bg-elevated text-ink ring-1 ring-inset ring-line-strong hover:bg-hover",
        ghost: "text-muted hover:bg-hover hover:text-ink",
        outline: "text-ink ring-1 ring-inset ring-line-strong hover:bg-hover",
        danger: "bg-danger text-white hover:opacity-90",
        "danger-ghost": "text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]",
        link: "h-auto px-0 text-accent-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-2.5 text-[13px]",
        md: "h-9 px-3.5",
        lg: "h-11 px-5 text-[15px]",
        /** Große Knöpfe im App-Stil (Anmeldung, Willkommen): 52 px, Daumenzone. */
        xl: "h-[52px] rounded-[14px] px-6 text-[16px] font-semibold [&_svg]:size-5",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Lädt (Speichern, Senden): Knopf gesperrt, gleiche Breite und Farbe, Text unsichtbar, Kreisel mittig darüber.
     * Kein Text-, Breiten- oder Deckkraftwechsel – das ließ Knöpfe auf dem iPhone flackern (alter und neuer Zustand
     * kurz übereinander). Nicht mit asChild.
     */
    loading?: boolean;
  };

export function Button({ className, variant, size, asChild, type, loading, disabled, children, ...props }: ButtonProps) {
  if (asChild)
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), loading && "relative", className)}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
          <Loader2 aria-hidden className="absolute animate-spin" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
