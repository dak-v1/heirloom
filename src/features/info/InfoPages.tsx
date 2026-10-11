import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { SITES } from "../../content/sites";
import { SOURCES } from "../../content/sources";
import { IMAGE_KIND_LABEL } from "../../content/media";
import { ButtonLink } from "../../components/Button";
import "./info.css";

function InfoPage({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Heirloom`;
  }, [title]);
  return (
    <div className="page info fade-in">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <div className="info__body prose">{children}</div>
    </div>
  );
}

export function AboutPage() {
  const images = SITES.flatMap((s) => [...s.eras.map((e) => ({ site: s, img: e.image })), ...s.game.rounds.map((r) => ({ site: s, img: r.image }))]);
  const unique = images.filter((x, i) => images.findIndex((y) => y.img.id === x.img.id) === i);
  return (
    <InfoPage title="About Heirloom" kicker="Every street has a story">
      <p>
        Heirloom is a no-install heritage walk for Singapore's streets. At each place you can hold archival photographs up against today's view, listen to (or read) a short sourced story, try an optional game, and collect a stamp for your passport.
      </p>
      <p>
        It was made for the <em>Common Ground Makeathon: Design × Tech × Culture</em> as an independent community project. It is not affiliated with, or endorsed by, the National Heritage Board, the National Library Board, Leiden University Libraries, the Rijksmuseum or any of the featured places of worship.
      </p>

      <h2>How we handle history</h2>
      <ul>
        <li>Every historical view is a real photograph from a public collection. Heirloom does not generate "historical" images with AI.</li>
        <li>Dates are shown exactly as precisely as the holding archive records them ("c. 1890", "between 1930 and 1960"). The timeline only shows eras we have photographs for.</li>
        <li>Each hotspot is marked either as a <strong>sourced fact</strong> (with a link) or as <strong>what you can see</strong> (an observation about the picture).</li>
        <li>Stories are written from the sources listed below. English is the curated version. The 中文 and Bahasa Melayu versions are draft translations prepared with AI assistance and are awaiting review by fluent community reviewers. A Tamil version is not yet available.</li>
        <li>Narration is a synthetic ElevenLabs voice, not a historical recording. Soundscapes are synthesised in your browser to suggest a mood; they are not historical recordings.</li>
        <li>One game photograph (Thian Hock Keng, 1928) is identified by us, not by the archive; it is labelled as such.</li>
      </ul>

      <h2>Sources</h2>
      <ul className="info__sources">
        {Object.values(SOURCES).map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
            , {s.publisher}. Accessed {s.accessed}.
          </li>
        ))}
      </ul>

      <h2>Photographs and licences</h2>
      <p>Images are shown from Wikimedia Commons. Public-domain and CC0 images need no permission; CC BY and CC BY-SA images are credited here and in each photo's details panel. Present-day photographs are cropped and lightly tinted on banners and cards and shown blurred behind Past View; those adaptations stay under the photographs' CC BY-SA licences. Archival crops are marked below.</p>
      <ul className="info__images">
        {unique.map(({ site, img }) => (
          <li key={img.id}>
            <strong>{site.name}</strong>, {img.dateLabel} ({IMAGE_KIND_LABEL[img.kind].toLowerCase()}): “{img.credit.title}”, {img.credit.creator}. {img.credit.collection}.{" "}
            {img.credit.licenseUrl ? (
              <a href={img.credit.licenseUrl} target="_blank" rel="noopener noreferrer">
                {img.credit.license}
              </a>
            ) : (
              img.credit.license
            )}
            {" · "}
            <a href={img.credit.sourceUrl} target="_blank" rel="noopener noreferrer">
              file page
            </a>
            {img.crop && " · cropped"}
          </li>
        ))}
      </ul>
      <p>
        Stamps, badges, the passport and all other illustrations are original artwork made for Heirloom. Map data and tiles © OpenStreetMap contributors.
      </p>
      <ButtonLink to="/map" ticket>
        Start exploring
      </ButtonLink>
    </InfoPage>
  );
}

export function PrivacyPage() {
  return (
    <InfoPage title="Privacy & permissions" kicker="Plain language">
      <h2>No account needed</h2>
      <p>You can use everything without signing up. Your passport belongs to an anonymous ID created in this browser.</p>
      <h2>Your progress stays in this browser</h2>
      <p>
        Visits, stamps, badges, game scores and your profile (the name you choose, your map icon and how you arrange your badge board) are saved in this browser's local storage. They are not sent to a server, and they don't sync between devices. Clearing this site's data, or using private browsing, removes them. You can also reset them from the menu.
      </p>
      <h2>Location</h2>
      <p>
        Heirloom only asks for your location when you tap “Find places near me”. While the app is open, it compares your position with the three curated places to suggest where you are. Your coordinates stay in memory on your device: they are never stored, never sent to us, and tracking stops when you leave the page or turn location off. Heirloom cannot detect you when the browser is closed or the phone is locked.
      </p>
      <p>If you'd rather not share it, choose a place on the map or list and tap “I'm here”. Your stamp never depends on location.</p>
      <h2>Camera</h2>
      <p>The camera is used only if you open the Live Time Window preview. The video stays on your device, is never recorded or uploaded, and stops as soon as you close the preview.</p>
      <h2>Sound</h2>
      <p>Narration and soundscapes play only after you press play. Arriving at a place never starts sound.</p>
      <h2>Shared memories</h2>
      <p>
        Leaving a photo memory, note or drawing is optional and never affects your stamp. Photos and words you submit are stored on the Heirloom server with an anonymous guest ID that this browser keeps; there is no account and no email. A display name is optional and is shown with your memory if you give one.
      </p>
      <p>
        Every new memory starts as <strong>waiting for review</strong> and is not visible to anyone else. It becomes public, on that place's wall only, after a moderator approves it. Memories that are rejected or hidden are never shown publicly, and moderation reasons are never published. You can review your own submissions in your profile in this browser.
      </p>
      <p>
        Anyone can report a public memory; a memory that is reported several times is hidden until a moderator looks at it. To limit abuse, the server limits how many memories can be shared in a short time. Some memories are written by the Heirloom team as samples for the demo and are labelled “Sample”.
      </p>
      <h2>Third parties</h2>
      <p>
        Photographs load from Wikimedia Commons, and map tiles from OpenStreetMap. Those services receive normal web requests (such as your IP address) when your browser fetches images. The “Directions” button opens Google Maps in a new tab. Narration is generated in advance with ElevenLabs; your device never contacts ElevenLabs.
      </p>
      <h2>Analytics</h2>
      <p>Heirloom keeps a small, local-only log of events such as “stamp earned”, to help us test. It contains no memory text and no location, and it is not sent anywhere.</p>
    </InfoPage>
  );
}

export function TermsPage() {
  return (
    <InfoPage title="Community rules & terms" kicker="Be kind, be accurate">
      <h2>Visiting</h2>
      <p>These are living places of worship. Dress modestly, keep your voice low, follow posted visiting times and signs, and ask before photographing people.</p>
      <h2>Sharing memories</h2>
      <ul>
        <li>Share your own photos, memories, notes and drawings about the place. Ask permission before photographing people.</li>
        <li>No hate, harassment, personal information about others, advertising or anything unsafe.</li>
        <li>Every contribution is reviewed by a moderator before it appears publicly. Moderators can approve, reject or later hide any memory, and we don't publish the reasons.</li>
        <li>Anyone can report a public memory; reported memories may be hidden while we review them.</li>
        <li>Memories marked “Sample” were written by the Heirloom team to illustrate the wall. They are not real visitor accounts or historical sources.</li>
        <li>Shared memories are personal impressions, not checked historical facts.</li>
      </ul>
      <h2>About the content</h2>
      <p>
        We work hard to keep facts sourced and labelled, but Heirloom is a demonstration project. Draft translations may contain errors. If you spot one, please tell the team.
      </p>
      <h2>Demo status</h2>
      <p>
        This is a makeathon build. Features may change, and browser-local progress could be reset in future versions. The passport is a keepsake, <strong>not an official travel document</strong>.
      </p>
      <p>
        <Link to="/privacy">Read the privacy notes</Link>
      </p>
    </InfoPage>
  );
}

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Not found · Heirloom";
  }, []);
  return (
    <div className="page">
      <div className="empty">
        <img src="/assets/decor/postmark.svg" alt="" width={180} />
        <h1>This street isn't on our map</h1>
        <p>The page you were looking for doesn't exist.</p>
        <ButtonLink to="/" ticket>
          Back home
        </ButtonLink>
      </div>
    </div>
  );
}
