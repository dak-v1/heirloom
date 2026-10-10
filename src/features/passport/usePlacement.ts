import { useCallback, useRef, useState } from "react";
import { PASSPORT_PAGES, STAMPABLE_PAGE_IDS } from "../../content/passport";
import { findSite } from "../../content/sites";
import { useToast } from "../../components/Toast";
import { track } from "../../services/analytics";
import { PlacementError, type StampPlacement } from "../../services/progress";
import { progress } from "../../state/progress";
import { fit, freeSpot, undoPlacement, type Spot } from "./placement";

export interface Draft extends Spot {
  earnedStampId: string;
  pageId: string;
  /** The saved placement being moved, or null for a first placement. */
  prev: StampPlacement | null;
  /** False until the visitor has positioned it (drives the "Tap anywhere" hint). */
  touched: boolean;
}

export interface Pressing {
  earnedStampId: string;
  placement: StampPlacement;
}

const pageNumber = (pageId: string) => (PASSPORT_PAGES.find((p) => p.id === pageId)?.index ?? 0) + 1;

/**
 * Placement state for the passport book: pick a stamp → position it → "Stamp here".
 * Saving happens before (and independently of) the stamp-press animation, exactly once.
 */
export function usePlacement({ reducedMotion }: { reducedMotion: boolean }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pressing, setPressing] = useState<Pressing | null>(null);
  const busy = useRef(false);

  const siteName = (earnedStampId: string) => {
    const s = progress.getEarnedStamps().find((e) => e.id === earnedStampId);
    return findSite(s?.siteId)?.name ?? "Stamp";
  };
  const stampArt = (earnedStampId: string) => findSite(progress.getEarnedStamps().find((e) => e.id === earnedStampId)?.siteId)?.stamp.art;

  /** Choose a stamp to place (or an already-placed one to move). `at` = dropped on a page. */
  const pick = useCallback((earnedStampId: string, at?: { pageId: string; x: number; y: number }) => {
    if (busy.current) return;
    const state = progress.getVisitorProgress();
    if (!state.earnedStamps.some((s) => s.id === earnedStampId)) return;
    const saved = state.placements.find((p) => p.earnedStampId === earnedStampId) ?? null;
    const current = state.passport.currentPageId ?? "";
    const pageId = at?.pageId ?? saved?.pageId ?? (STAMPABLE_PAGE_IDS.includes(current) ? current : STAMPABLE_PAGE_IDS[0]);
    const others = state.placements.filter((p) => p.pageId === pageId && p.earnedStampId !== earnedStampId);
    const base: Spot = saved ? { x: saved.x, y: saved.y, widthRatio: saved.widthRatio, rotationDeg: saved.rotationDeg } : freeSpot(others);
    const spot = fit(at ? { ...base, x: at.x, y: at.y } : base);
    setDraft({ ...spot, earnedStampId, pageId, prev: saved ? { ...saved } : null, touched: !!at || !!saved });
    progress.setCurrentPassportPage(pageId);
  }, []);

  const update = useCallback((fn: (s: Spot) => Spot) => {
    setDraft((d) => (d ? { ...d, ...fit(fn(d)), touched: true } : d));
  }, []);

  const moveToPage = useCallback((pageId: string, x?: number, y?: number) => {
    if (!STAMPABLE_PAGE_IDS.includes(pageId)) return;
    setDraft((d) => (d ? { ...d, ...fit({ ...d, x: x ?? d.x, y: y ?? d.y }), pageId, touched: d.touched || x !== undefined } : d));
    progress.setCurrentPassportPage(pageId);
  }, []);

  const cancel = useCallback(() => {
    if (busy.current) return;
    setDraft(null);
  }, []);

  const undoToast = (title: string, body: string, earnedStampId: string, prev: StampPlacement | null) =>
    toast({
      title,
      body,
      image: stampArt(earnedStampId),
      tone: "success",
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          try {
            undoPlacement(progress, earnedStampId, prev);
            toast({ title: prev ? "Stamp put back where it was" : "Stamp returned to your tray", duration: 3000 });
          } catch {
            toast({ title: "Couldn't undo", body: "Your passport is unchanged.", tone: "warning" });
          }
        },
      },
    });

  /** "Stamp here": save once, then (unless reduced motion) play the press. */
  const confirm = useCallback(() => {
    const d = draft;
    if (!d || busy.current) return;
    busy.current = true;
    let saved: StampPlacement;
    try {
      saved = progress.saveStampPlacement(d.earnedStampId, { pageId: d.pageId, x: d.x, y: d.y, widthRatio: d.widthRatio, rotationDeg: d.rotationDeg });
    } catch (e) {
      busy.current = false;
      toast({
        title: "That stamp couldn't be saved",
        body: e instanceof PlacementError ? e.message : "Your chosen spot is kept. Try again.",
        tone: "warning",
      });
      return;
    }
    const site = progress.getEarnedStamps().find((s) => s.id === d.earnedStampId)?.siteId ?? "";
    track("stamp_placed", { site, page: d.pageId, moved: !!d.prev });
    undoToast(d.prev ? "Stamp moved" : "Stamped!", `${siteName(d.earnedStampId)} · page ${pageNumber(d.pageId)}`, d.earnedStampId, d.prev);
    setDraft(null);
    if (reducedMotion) {
      busy.current = false;
      return;
    }
    setPressing({ earnedStampId: d.earnedStampId, placement: saved });
  }, [draft, reducedMotion]);

  const finishPress = useCallback(() => {
    setPressing(null);
    busy.current = false;
  }, []);

  /** Delete: take a placed stamp off the page. The earned stamp itself is never removed. */
  const remove = useCallback(() => {
    const d = draft;
    if (!d?.prev || busy.current) return;
    progress.removeStampPlacement(d.earnedStampId);
    setDraft(null);
    undoToast("Stamp back in your tray", `${siteName(d.earnedStampId)} was taken off page ${pageNumber(d.prev.pageId)}.`, d.earnedStampId, d.prev);
  }, [draft]);

  return { draft, pressing, pick, update, moveToPage, cancel, confirm, finishPress, remove };
}

export type PlacementApi = ReturnType<typeof usePlacement>;
