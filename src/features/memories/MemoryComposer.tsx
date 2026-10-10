import { useId, useRef, useState } from "react";
import { CheckCircle2, PenLine, Brush, Send } from "lucide-react";
import type { Site } from "../../content/types";
import { Button } from "../../components/Button";
import { MemoryApiError, submitMemory } from "../../services/memories";
import { track } from "../../services/analytics";
import { progress } from "../../state/progress";
import { useMemoryDraft } from "./draft";
import { DrawingCanvas, DrawingError, type DrawingCanvasHandle } from "./DrawingCanvas";
import { NAME_MAX, NOTE_MAX, charCount, validateName, validateNote } from "./validation";
import "./memories.css";

interface Props {
  site: Site;
  /** A memory was stored (pending review). */
  onSubmitted: () => void;
  /** Leave the composer and go back to the visit. */
  onBack: () => void;
  onBusyChange?: (busy: boolean) => void;
}

/** Note or drawing for this place. Optional: skipping never affects the visit or its stamp. */
export function MemoryComposer({ site, onSubmitted, onBack, onBusyChange }: Props) {
  const { draft, update, clear } = useMemoryDraft(site.id);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const canvas = useRef<DrawingCanvasHandle>(null);
  const ids = { note: useId(), name: useId(), count: useId(), err: useId(), tabNote: useId(), tabDraw: useId() };

  const chars = charCount(draft.text.trim());
  const nameError = validateName(draft.name);

  const submit = async () => {
    if (status === "sending") return;
    setError(null);
    let body: Parameters<typeof submitMemory>[1];
    try {
      if (draft.tab === "note") {
        const problem = validateNote(draft.text, draft.name);
        if (problem) return setError(problem);
        body = { type: "note", text: draft.text.trim() };
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
    try {
      await submitMemory(site.id, { ...body, displayName: displayName || undefined });
      progress.recordMemorySubmitted(site.id);
      track("memory_submitted", { site: site.id, type: body.type });
      clear();
      setStatus("sent");
      onSubmitted();
    } catch (e) {
      setStatus("idle");
      const msg = e instanceof MemoryApiError ? (e.status === 0 ? "You appear to be offline, so it wasn't sent." : e.message) : "Something went wrong.";
      setError(`${msg} Your ${draft.tab === "note" ? "note" : "drawing"} is still here, so you can try again.`);
    } finally {
      onBusyChange?.(false);
    }
  };

  if (status === "sent") {
    return (
      <div className="composer-sent" role="status">
        <CheckCircle2 size={40} aria-hidden="true" />
        <h3>Thank you for sharing</h3>
        <p>
          Your memory is <strong>waiting for review</strong> and isn't public yet. Once a moderator approves it, it appears on the {site.name} wall for other
          visitors. You can check its status under “Your submissions”.
        </p>
        <div className="composer-sent__actions">
          <Button onClick={onBack}>Back to {site.name}</Button>
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
      <p className="composer__intro">
        Pin a note or a drawing to {site.name}. Memories appear publicly only after a moderator reviews them. No email or account needed.
      </p>

      <div className="composer__tabs" role="tablist" aria-label="Kind of memory">
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
        {sending ? "Sending…" : "Share for review"}
      </Button>
    </div>
  );
}
