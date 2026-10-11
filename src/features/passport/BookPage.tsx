import type { ReactNode } from "react";
import { PAGE_ASPECT, type PassportPage } from "../../content/passport";

export interface IdentityInfo {
  /** The name chosen on the profile page. */
  holder?: string;
  /** The map icon chosen on the profile page, shown as the passport photo. */
  avatar?: string;
  /** When this browser's passport was created (ISO). */
  issuedAt: string;
  /** Opaque guest ID; only a short, meaningless excerpt is shown. */
  guestId: string;
  stampsEarned: number;
}

export function formatIssued(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
}

/** A short, meaningless excerpt of the guest ID, shown as the passport number. */
export const passportNumber = (guestId: string) => `HL-${guestId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;

/**
 * One logical passport page at the fixed 88 × 125 aspect. The page box is the
 * coordinate space for stamp placements: `overlay` is laid over it edge to edge.
 */
export function BookPage({ page, side, identity, overlay }: { page: PassportPage; side: "left" | "right"; identity: IdentityInfo; overlay?: ReactNode }) {
  return (
    <section
      className={`book-page book-page--${page.kind} book-page--${side} tpl--${page.template}`}
      data-page-id={page.id}
      aria-label={page.title ?? (page.kind === "cover" ? "Passport cover" : "Identity page")}
      style={{ aspectRatio: String(PAGE_ASPECT) }}
    >
      {page.kind === "cover" ? (
        <img className="book-page__cover" src="/assets/3d/passport-cover.png" alt="The Heirloom Heritage Passport cover: leather with a gold emblem of a temple roof, a gopuram and a dome." draggable={false} />
      ) : (
        <>
          <div className="book-page__decor" aria-hidden="true" />
          {page.kind === "identity" ? <IdentityContent identity={identity} /> : <h3 className="book-page__title">{page.title}</h3>}
          <span className="book-page__num" aria-hidden="true">
            {page.index + 1}
          </span>
        </>
      )}
      {overlay && <div className="book-page__overlay">{overlay}</div>}
    </section>
  );
}

function IdentityContent({ identity }: { identity: IdentityInfo }) {
  return (
    <div className="identity">
      {identity.avatar ? (
        <img className="identity__photo" src={identity.avatar} alt="" width={64} height={64} />
      ) : (
        <img className="identity__mark" src="/assets/brand/mark.svg" alt="" width={44} height={44} />
      )}
      <p className="identity__kicker">Heirloom</p>
      <h3 className="identity__title">Heritage Passport</h3>
      <dl className="identity__fields">
        <div>
          <dt>Holder</dt>
          <dd>{identity.holder ?? "Guest explorer"}</dd>
        </div>
        <div>
          <dt>Passport no.</dt>
          <dd>{passportNumber(identity.guestId)}</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{formatIssued(identity.issuedAt)}</dd>
        </div>
        <div>
          <dt>Stamps</dt>
          <dd>{identity.stampsEarned}</dd>
        </div>
      </dl>
      <img className="identity__postmark" src="/assets/decor/postmark.svg" alt="" />
      <p className="identity__note">A keepsake of your walk, saved in this browser. Not an official travel document.</p>
    </div>
  );
}
