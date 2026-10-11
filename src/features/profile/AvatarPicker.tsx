import { Check } from "lucide-react";
import { AVATARS, findAvatar } from "../../content/avatars";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { displayName } from "../../services/profile";
import { profile, useProfile } from "../../state/profile";
import { MapMe } from "./MapMe";

/** "Choose your map icon": pick a portrait and preview it on a little map. Saves as you choose. */
export function AvatarPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useProfile();
  const current = findAvatar(me.avatar);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Choose your map icon"
      size="tall"
      className="picker"
      footer={
        <Button block onClick={onClose}>
          Done
        </Button>
      }
    >
      <p className="picker__lede">This is how you appear on the map.</p>
      <fieldset className="avatar-grid">
        <legend className="visually-hidden">Map icon</legend>
        {AVATARS.map((a) => {
          const on = a.id === current.id;
          return (
            <label key={a.id} className={`avatar-option${on ? " is-selected" : ""}`}>
              <input className="visually-hidden" type="radio" name="avatar" value={a.id} checked={on} onChange={() => profile.setAvatar(a.id)} />
              <span className="avatar-option__img">
                <img src={a.art} alt="" draggable={false} />
                {on && (
                  <span className="avatar-option__tick" aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="avatar-option__name">{a.name}</span>
            </label>
          );
        })}
      </fieldset>
      <figure className="map-preview">
        <div className="map-preview__map">
          <img src="/assets/decor/mini-map.svg" alt="" draggable={false} />
          <div className="map-preview__me">
            <MapMe art={current.art} live />
            <span className="map-preview__label">
              <small>You on the map</small>
              <strong>{displayName(me)}</strong>
            </span>
          </div>
        </div>
        <figcaption>
          <strong>{current.name}.</strong> {current.note}
        </figcaption>
      </figure>
      <p className="picker__note">Your icon only appears on your own map, in this browser. Nobody else can see it.</p>
    </Sheet>
  );
}
