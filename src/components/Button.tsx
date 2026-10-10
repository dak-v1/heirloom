import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "olive" | "blue" | "mustard" | "ink";

interface Common {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** Perforated "ticket" edge for the main call to action. */
  ticket?: boolean;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

function classes({ variant = "primary", size = "md", ticket, block }: Common, extra?: string) {
  return ["btn", `btn--${variant}`, `btn--${size}`, ticket && "btn--ticket", block && "btn--block", extra].filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { variant, size, ticket, block, icon, iconRight, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={classes({ variant, size, ticket, block }, className)} {...rest}>
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span className="btn__label">{children}</span>
      {iconRight && <span className="btn__icon" aria-hidden="true">{iconRight}</span>}
    </button>
  );
});

export function ButtonLink({ variant, size, ticket, block, icon, iconRight, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={classes({ variant, size, ticket, block }, className)} {...rest}>
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span className="btn__label">{children}</span>
      {iconRight && <span className="btn__icon" aria-hidden="true">{iconRight}</span>}
    </Link>
  );
}

/** External link styled as a button; always opens in a new tab with safe rel. */
export function ButtonA({ variant, size, ticket, block, icon, iconRight, className, children, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes({ variant, size, ticket, block }, className)} target="_blank" rel="noopener noreferrer" {...rest}>
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span className="btn__label">{children}</span>
      {iconRight && <span className="btn__icon" aria-hidden="true">{iconRight}</span>}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export const IconButton = forwardRef<HTMLButtonElement, { label: string; variant?: "plain" | "paper" | "dark"; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ label, variant = "plain", className, children, type = "button", ...rest }, ref) {
    return (
      <button ref={ref} type={type} aria-label={label} title={label} className={["icon-btn", `icon-btn--${variant}`, className].filter(Boolean).join(" ")} {...rest}>
        <span aria-hidden="true">{children}</span>
      </button>
    );
  },
);
