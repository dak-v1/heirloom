import { useCallback, useEffect, useMemo, useState } from "react";
import type { LangCode, Site } from "../../content/types";
import { LANGUAGE_BY_CODE } from "../../content/languages";
import { preparedAudioFor } from "../../services/audio/narration";
import { track } from "../../services/analytics";
import { progress } from "../../state/progress";
import { getPreferences, setPreferences } from "../../state/preferences";
import { useAudio } from "./audio-context";

/**
 * Story state for one site: which language versions exist, the chosen language,
 * and the loaded narration track. Stops this site's audio when the visitor leaves.
 */
export function useSiteStory(site: Site) {
  const { player, manifest, stopAmbient } = useAudio();
  const available = useMemo(() => (Object.keys(site.story.versions) as LangCode[]).filter((l) => site.story.versions[l]), [site]);
  const preferred = getPreferences().storyLang;
  const [lang, setLangState] = useState<LangCode>(available.includes(preferred) ? preferred : "en");
  const version = site.story.versions[lang] ?? site.story.versions.en!;

  useEffect(() => {
    const bcp47 = LANGUAGE_BY_CODE.get(lang)?.bcp47 ?? "en-SG";
    void player.load({
      key: `${site.id}:${lang}:v${site.story.version}`,
      siteId: site.id,
      lang,
      bcp47,
      paragraphs: [version.title + ".", ...version.paragraphs],
      audio: preparedAudioFor(manifest, site.id, lang, site.story.version),
    });
  }, [player, site, lang, version, manifest]);

  // Leaving the site (or switching to another site) stops its narration and soundscape.
  useEffect(() => {
    return () => {
      player.stop();
      stopAmbient();
    };
  }, [site.id, player, stopAmbient]);

  const setLang = useCallback(
    (l: LangCode) => {
      if (!site.story.versions[l]) return;
      player.stop();
      setLangState(l);
      setPreferences({ storyLang: l });
      progress.recordLanguageUsed(site.id, l);
    },
    [player, site],
  );

  const play = useCallback(() => {
    progress.recordLanguageUsed(site.id, lang);
    track("audio_started", { site: site.id, lang });
    player.play();
  }, [player, site.id, lang]);

  return { available, lang, setLang, version, play };
}
