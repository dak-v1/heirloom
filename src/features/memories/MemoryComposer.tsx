import { useId, useRef, useState } from "react";
import { PenLine, Brush, Send, ImagePlus, X } from "lucide-react";
import type { Site } from "../../content/types";
import { Button } from "../../components/Button";
import { MemoryApiError, submitMemory } from "../../services/memories";
import { track } from "../../services/analytics";
import { progress } from "../../state/progress";
import { useMemoryDraft } from "./draft";
import { DrawingCanvas, DrawingError, type DrawingCanvasHandle } from "./DrawingCanvas";
import { NAME_MAX, NOTE_MAX, PHOTO_MAX_BYTES, TITLE_MAX, charCount, dataUrlBytes, validateName, validateNote, validateTitle } from "./validation";
import { MemoryAbsorption } from "./MemoryAbsorption";
import "./memories.css";

interface Props {
  site: Site;
  /** A memory was stored (pending review). */
  onSubmitted: () => void;
  /** Leave the composer and go back to the visit. */
  onBack: () => void;
  onBusyChange?: (busy: boolean) => void;
  onViewSaved?: () => void;
}

/** Note or drawing for this place. Optional: skipping never affects the visit or its stamp. */
export function MemoryComposer({ site, onSubmitted, onBack, onBusyChange, onViewSaved }: Props) {
  const { draft, update, clear } = useMemoryDraft(site.id);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const canvas = useRef<DrawingCanvasHandle>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const ids = { note: useId(), title: useId(), name: useId(), count: useId(), err: useId(), tabNote: useId(), tabDraw: useId(), tabPhoto: useId() };

  const chars = charCount(draft.text.trim());
  const nameError = validateName(draft.name);
  const titleError = validateTitle(draft.title);

  const attachPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose a photo image to preserve.");
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1280 / bitmap.width, 1280 / bitmap.height);
      const target = document.createElement("canvas");
      target.width = Math.max(1, Math.round(bitmap.width * scale));
      target.height = Math.max(1, Math.round(bitmap.height * scale));
      target.getContext("2d")?.drawImage(bitmap, 0, 0, target.width, target.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) => target.toBlob(resolve, "image/jpeg", 0.82));
      if (!blob) throw new Error("This photo couldn't be compressed.");
      if (blob.size > PHOTO_MAX_BYTES) throw new Error("That photo is still too large after compression. Choose a smaller image.");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("This photo couldn't be read."));
        reader.onerror = () => reject(new Error("This photo couldn't be read."));
        reader.readAsDataURL(blob);
      });
      update({ photo: dataUrl });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "This photo couldn't be prepared.");
    }
  };

  const submit = async () => {
    if (status === "sending") return;
    setError(null);
    let body: Parameters<typeof submitMemory>[1];
    try {
      if (draft.tab === "note") {
        const problem = validateNote(draft.text, draft.name) ?? titleError;
        if (problem) return setError(problem);
        body = { type: "note", text: draft.text.trim(), title: draft.title.trim() || undefined };
      } else if (draft.tab === "photo") {
        const problem = validateNote(draft.text, draft.name) ?? titleError;
        if (problem) return setError(problem);
        if (!draft.photo) return setError("Add a photo to make your memory orb.");
        if (dataUrlBytes(draft.photo) > PHOTO_MAX_BYTES) return setError("That photo is too large. Choose it again to compress it.");
        body = { type: "note", text: draft.text.trim(), title: draft.title.trim() || undefined, photo: draft.photo };
      } else {
        if (nameError) return setError(nameError);
        body = { type: "drawing", drawing: canvas.current?.exportPng() };
      }
    } catch (e) {
      return setError(e instanceof DrawingError ? e.message : "That drawing couldn't be prepared.");
    }
    const displayName = draft.name.trim();
    setStatus("sending");
    onBusyChange?.(true);
    setAnimating(true);
    const animation = new Promise<void>((resolve) => window.setTimeout(resolve, 5400));
    try {
      await Promise.all([submitMemory(site.id, { ...body, displayName: displayName || undefined }), animation]);
      progress.recordMemorySubmitted(site.id);
      track("memory_submitted", { site: site.id, type: body.type });
      clear();
      setStatus("sent");
      setAnimating(false);
      onSubmitted();
    } catch (e) {
      await animation;
      setAnimating(false);
      setStatus("idle");
      const msg = e instanceof MemoryApiError ? (e.status === 0 ? "You appear to be offline, so it wasn't sent." : e.message) : "Something went wrong.";
      setError(`${msg} Your ${draft.tab === "photo" ? "photo memory" : draft.tab === "note" ? "note" : "drawing"} is still here, so you can try again.`);
    } finally {
      onBusyChange?.(false);
    }
  };

  if (status === "sent") {
    return (
      <div className="composer-sent" role="status">
        <h3>Your memory is now part of our shared story.</h3>
        <div className="composer-sent__actions">
          <Button onClick={onViewSaved ?? onBack}>View saved memory</Button>
          <Button variant="secondary" onClick={onBack}>Return to {site.name}</Button>
          <Button variant="ghost" onClick={() => setStatus("idle")}>
            Share another
          </Button>
        </div>
      </div>
    );
  }

  const sending = status === "sending";
  return (
    <div className="composer">
      <div className="composer__tabs" role="tablist" aria-label="Kind of memory">
        <button
          type="button"
          role="tab"
          id={ids.tabPhoto}
          aria-selected={draft.tab === "photo"}
          aria-controls={`${ids.tabPhoto}-panel`}
          className="composer__tab"
          onClick={() => update({ tab: "photo" })}
        >
          <ImagePlus size={18} aria-hidden="true" /> Add a photo
        </button>
        <button
          type="button"
          role="tab"
          id={ids.tabNote}
          aria-selected={draft.tab === "note"}
          aria-controls={`${ids.tabNote}-panel`}
          className="composer__tab"
          onClick={() => update({ tab: "note" })}
        >
          <PenLine size={18} aria-hidden="true" /> Write a note
        </button>
        <button
          type="button"
          role="tab"
          id={ids.tabDraw}
          aria-selected={draft.tab === "draw"}
          aria-controls={`${ids.tabDraw}-panel`}
          className="composer__tab"
          onClick={() => update({ tab: "draw" })}
        >
          <Brush size={18} aria-hidden="true" /> Draw a memory
        </button>
      </div>

      {draft.tab === "note" ? (
        <div role="tabpanel" id={`${ids.tabNote}-panel`} aria-labelledby={ids.tabNote} className="composer__panel">
          <label htmlFor={ids.title} className="composer__label">Title <span className="muted">(optional)</span></label>
          <input id={ids.title} className="composer__input" value={draft.title} maxLength={TITLE_MAX} disabled={sending} placeholder="Give this memory a title" onChange={(e) => update({ title: e.target.value })} />
          <label htmlFor={ids.note} className="composer__label">
            Your note
          </label>
          <textarea
            id={ids.note}
            className="composer__textarea"
            rows={5}
            value={draft.text}
            disabled={sending}
            aria-describedby={`${ids.count}${error ? ` ${ids.err}` : ""}`}
            aria-invalid={chars > NOTE_MAX || undefined}
            placeholder="What do you remember, notice or feel here?"
            onChange={(e) => update({ text: e.target.value })}
          />
          <p id={ids.count} className={`composer__count${chars > NOTE_MAX ? " is-over" : ""}`}>
            {chars} / {NOTE_MAX}
          </p>
        </div>
      ) : draft.tab === "photo" ? (
        <div role="tabpanel" id={`${ids.tabPhoto}-panel`} aria-labelledby={ids.tabPhoto} className="composer__panel">
          {!draft.photo ? (
            <label className="composer__photo-pick"><ImagePlus size={22} aria-hidden="true" /><strong>Take a selfie or choose a photo</strong><small>JPEG · compressed on this device · up to 400 KB</small><input ref={photoInput} type="file" accept="image/*" capture="user" disabled={sending} onChange={(e) => void attachPhoto(e.currentTarget.files?.[0])} /></label>
          ) : (
            <>
              <img className="composer__photo-preview" src={draft.photo} alt="Preview of your memory photo" />
              <Button className="composer__photo-remove" type="button" variant="ghost" size="sm" icon={<X size={16} />} disabled={sending} onClick={() => { update({ photo: "" }); if (photoInput.current) photoInput.current.value = ""; }}>Remove photo</Button>
            </>
          )}
          <label htmlFor={ids.title} className="composer__label">Title <span className="muted">(optional)</span></label>
          <input id={ids.title} className="composer__input" value={draft.title} maxLength={TITLE_MAX} disabled={sending} placeholder="Give this memory a title" onChange={(e) => update({ title: e.target.value })} />
          <label htmlFor={ids.note} className="composer__label">Memory caption</label>
          <textarea id={ids.note} className="composer__textarea" rows={4} value={draft.text} disabled={sending} aria-describedby={`${ids.count}${error ? ` ${ids.err}` : ""}`} aria-invalid={chars > NOTE_MAX || undefined} placeholder="Write a sentence about this moment…" onChange={(e) => update({ text: e.target.value })} />
          <p id={ids.count} className={`composer__count${chars > NOTE_MAX ? " is-over" : ""}`}>{chars} / {NOTE_MAX}</p>
        </div>
      ) : (
        <div role="tabpanel" id={`${ids.tabDraw}-panel`} aria-labelledby={ids.tabDraw} className="composer__panel">
          <DrawingCanvas ref={canvas} strokes={draft.strokes} onChange={(strokes) => update({ strokes })} disabled={sending} />
        </div>
      )}

      <label htmlFor={ids.name} className="composer__label">
        Display name <span className="muted">(optional)</span>
      </label>
      <input
        id={ids.name}
        className="composer__input"
        value={draft.name}
        maxLength={NAME_MAX * 2}
        disabled={sending}
        autoComplete="nickname"
        placeholder="Shown with your memory, or leave blank"
        aria-invalid={!!nameError || undefined}
        onChange={(e) => update({ name: e.target.value })}
      />
      {nameError && <p className="composer__error">{nameError}</p>}

      {error && (
        <p id={ids.err} className="notice notice--warn composer__failure" role="alert">
          {error}
        </p>
      )}

      <Button block ticket icon={<Send size={18} />} onClick={submit} disabled={sending}>
        {sending ? "Preserving…" : draft.tab === "photo" ? "Preserve My Memory" : "Share for review"}
      </Button>
      {animating && <MemoryAbsorption photo={draft.photo || site.eras.find((era) => era.isToday)!.image.src} title={draft.title} text={draft.text} />}
    </div>
  );
}
