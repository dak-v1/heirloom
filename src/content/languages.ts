import type { LangCode } from "./types";

export interface StoryLanguage {
  code: LangCode;
  /** Name in the language itself. */
  label: string;
  /** English name for screen readers and notices. */
  english: string;
  /** BCP-47 tag used to pick a device voice and set `lang` on transcripts. */
  bcp47: string;
}

/** Singapore's four official languages, in the order shown to visitors. */
export const STORY_LANGUAGES: StoryLanguage[] = [
  { code: "en", label: "English", english: "English", bcp47: "en-SG" },
  { code: "zh", label: "中文", english: "Chinese", bcp47: "zh-CN" },
  { code: "ms", label: "Melayu", english: "Malay", bcp47: "ms-MY" },
  { code: "ta", label: "தமிழ்", english: "Tamil", bcp47: "ta-IN" },
];

export const LANGUAGE_BY_CODE = new Map(STORY_LANGUAGES.map((l) => [l.code, l]));
