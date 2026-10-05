/** Official league contact details (from the MPL contact banner). */
export const LEAGUE_EMAIL = "Mtwapapremiercbo@gmail.com";
export const LEAGUE_WEBSITE_LABEL = "www.mtwapapremierleague.com";
export const LEAGUE_WEBSITE_URL = "https://www.mtwapapremierleague.com";
export const LEAGUE_HASHTAG = "#SportsNaUpendoTele";

export type LeagueOfficial = {
  name: string;
  role: string;
  /** Number as printed on the banner. */
  phoneDisplay: string;
  /** International format for tel: / WhatsApp links. */
  phoneIntl: string;
};

export const LEAGUE_OFFICIALS: LeagueOfficial[] = [
  { name: "Ali Nassir", role: "Chairman", phoneDisplay: "+254 799 669 040", phoneIntl: "+254799669040" },
  { name: "Ali Ibrahim", role: "Secretary", phoneDisplay: "+254 722 370 130", phoneIntl: "+254722370130" },
  { name: "Burhan Mahadh", role: "Treasurer", phoneDisplay: "0711 413 416", phoneIntl: "+254711413416" },
  { name: "Eugine Wamberya", role: "Organising Secretary", phoneDisplay: "0740 792 702", phoneIntl: "+254740792702" },
];
