import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
  children: ReactNode;
  /** "sheet" slides from the bottom; "full" covers the screen on phones. */
  size?: "auto" | "tall" | "full";
  footer?: ReactNode;
  /** Prevent closing via backdrop/Escape (e.g. while saving). */
  locked?: boolean;
  className?: string;
  /** Element to focus first (defaults to the close button). */
  initialFocus?: React.RefObject<HTMLElement | null>;
  closeLabel?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let openCount = 0;

/**
 * Accessible modal bottom sheet: focus moves in and is trapped, Escape and the
 * backdrop close it, and focus returns to whatever opened it.
 */
export function Sheet({ open, onClose, title, hideTitle, children, size = "auto", footer, locked, className, initialFocus, closeLabel = "Close" }: SheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;
    openCount++;
    document.body.classList.add("has-sheet");
    const t = window.setTimeout(() => (initialFocus?.current ?? closeBtn.current ?? panel.current)?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      openCount = Math.max(0, openCount - 1);
      if (!openCount) document.body.classList.remove("has-sheet");
      const el = restore.current;
      if (el && document.contains(el)) window.setTimeout(() => el.focus({ preventScroll: true }), 0);
    };
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!panel.current) return;
      const topmost = Array.from(document.querySelectorAll<HTMLElement>(".sheet__panel")).pop();
      if (topmost !== panel.current) return;
      if (e.key === "Escape" && !locked) {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab") {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, locked]);

  if (!open) return null;
  return createPortal(
    <div className={["sheet", `sheet--${size}`, className].filter(Boolean).join(" ")}>
      <div className="sheet__backdrop" onClick={() => !locked && onClose()} aria-hidden="true" />
      <div ref={panel} className="sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <h2 id={titleId} className={hideTitle ? "visually-hidden" : "sheet__title"}>
            {title}
          </h2>
          <IconButton ref={closeBtn} label={closeLabel} onClick={onClose} disabled={locked} className="sheet__close">
            <X size={22} />
          </IconButton>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
