import type { CSSProperties } from "react";
import type { PublicMemory } from "../../services/memories";
import { memoryOrbLayout, ORB_COLORS } from "./orb-layout";

/** A flat glass-jar illustration with individually tappable memory orbs. */
export function MemoryJar({ memories, photoFor, onSelect }: { memories: PublicMemory[]; photoFor: (memory: PublicMemory) => string | null; onSelect: (memory: PublicMemory) => void }) {
  return (
    <div className="memory-jar" role="group" aria-label={`A glass jar holding ${memories.length} shared memory ${memories.length === 1 ? "orb" : "orbs"}`}>
      <div className="memory-jar__illustration">
        <ul className="memory-jar__orbs" aria-label="Shared memories in the jar">
          {memories.map((memory, index) => {
            const position = memoryOrbLayout(index, memories.length);
            const color = ORB_COLORS[index % ORB_COLORS.length];
            const image = photoFor(memory);
            const story = memory.title || memory.text || "A shared moment";
            const label = `${story} by ${memory.displayName ?? "a visitor"}`;
            const sizeScale = memories.length > 14 ? 0.46 : memories.length > 9 ? 0.54 : memories.length > 5 ? 0.61 : 0.68;
            const style = {
              "--jar-orb-color": color,
              "--jar-orb-x": `${position.x}%`,
              "--jar-orb-y": `${position.y}%`,
              "--jar-orb-size": `${Math.round(position.size * sizeScale)}px`,
              "--jar-orb-depth": index,
            } as CSSProperties;

            return (
              <li key={memory.id} className="memory-jar__orb-position" style={style}>
                <button type="button" className="memory-jar__orb" onClick={() => onSelect(memory)} aria-label={`Open memory: ${label}`} title={label}>
                  {image ? <img src={image} alt="" loading="lazy" /> : <span className="memory-jar__orb-copy" aria-hidden="true">{story}</span>}
                  <span className="memory-jar__orb-glass" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        <img className="memory-jar__drawing" src="/assets/memories/glass-jar-2d.png" alt="" draggable={false} />
      </div>
    </div>
  );
}
