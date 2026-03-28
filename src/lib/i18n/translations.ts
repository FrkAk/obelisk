/**
 * i18n translations for Obelisk.
 *
 * Contains all UI strings for supported locales.
 */

export type Locale = "en" | "tr";

const translations = {
  en: {
    "search.placeholder": "Ask Obelisk anything...",
    "search.gettingLocation": "Getting location...",
    "search.searchingArea": "Searching this area",
    "search.lookAroundHere": "Look around here",
    "search.suggestion1": "A quiet cafe near the river...",
    "search.suggestion2": "Something hidden nearby...",
    "search.suggestion3": "Where locals eat lunch...",
    "search.suggestion4": "Best view of the old town...",
    "search.suggestion5": "A place with history...",
    "search.suggestion6": "Somewhere peaceful to read...",
    "search.suggestion7": "A courtyard off the beaten path...",

    "searchResults.noResults": "No results found",
    "searchResults.tryDifferent": "Try a different search or expand your radius",

    "poi.results": "Results",
    "poi.navigate": "Navigate",
    "poi.echoes": "Echoes",
    "poi.share": "Share",
    "poi.linkCopied": "Link copied",
    "poi.report": "Report",
    "poi.comingSoon": "Coming soon",
    "poi.away": "away",
    "poi.tabRemark": "Remark",
    "poi.tabCapsules": "Capsules",
    "poi.tabDetails": "Details",

    "remark.fromLocal": "From a local",
    "remark.regenerate": "Regenerate",
    "remark.noRemark": "No remark yet for this place",

    "capsules.noCapsules": "No capsules here yet",
    "capsules.leaveFirst": "Leave the first one",
    "capsules.sharePlaceholder": "Share your experience...",
    "capsules.leaveCapsule": "Leave capsule",
    "capsules.text": "Text",
    "capsules.voice": "Voice",
    "capsules.photo": "Photo",
    "capsules.video": "Video",

    "details.goodToKnow": "Good to know",
    "details.wifiAvailable": "WiFi available",
    "details.outdoorSeating": "Outdoor seating",
    "details.noDetails": "No details available",
    "details.reported": "Reported \u2014 thanks",

    "loading.moment": "Just a moment\u2026",
    "loading.lookingInto": "Looking into this place\u2026",
    "loading.gatheringStories": "Gathering stories from the neighborhood\u2026",
    "loading.piecingTogether": "Piecing together what makes it special\u2026",
    "loading.crafting": "Crafting your remark\u2026",

    "media.streetView": "Street View",
    "media.explore": "Explore",
    "media.lock": "Lock",

    "map.zoomIn": "Zoom in",
    "map.zoomOut": "Zoom out",
    "map.locateMe": "Center on my location",

    "notification.dismiss": "Dismiss",

    "error.searchDown": "Search isn't working right now.",
    "error.cantLoadPlace": "Couldn't load this place. Try again.",
    "error.cantGenerateInsufficient": "I couldn't find enough about this place to share a story.",
    "error.remarkBreather": "Remarks are taking a breather. Try again in a moment.",
    "error.tooManyRequests": "Too many requests. Please slow down.",
    "error.cantGenerate": "Couldn't generate a remark right now.",
    "error.cantRefresh": "Couldn't refresh this remark.",

    "welcome.title": "Welcome to Obelisk",
    "welcome.earlyAccess": "Early Access",
    "welcome.body": "Obelisk is under active development. You may encounter bugs, missing features, unstable search results, and occasional AI hallucinations in generated remarks. We're working on it.",
    "welcome.okay": "Got it, let's explore",
  },

  tr: {
    "search.placeholder": "Obelisk'e her\u015Feyi sor...",
    "search.gettingLocation": "Konum al\u0131n\u0131yor...",
    "search.searchingArea": "Bu b\u00F6lgede aran\u0131yor",
    "search.lookAroundHere": "Buralara bak",
    "search.suggestion1": "Nehir kenar\u0131nda sessiz bir kafe...",
    "search.suggestion2": "Yak\u0131nlarda gizli bir yer...",
    "search.suggestion3": "Yerlilerin \u00F6\u011Fle yeme\u011Fi yedi\u011Fi yer...",
    "search.suggestion4": "Eski \u015Fehrin en g\u00FCzel manzaras\u0131...",
    "search.suggestion5": "Tarihi olan bir yer...",
    "search.suggestion6": "Kitap okumak i\u00E7in huzurlu bir k\u00F6\u015Fe...",
    "search.suggestion7": "Ana yoldan sapan bir avlu...",

    "searchResults.noResults": "Sonu\u00E7 bulunamad\u0131",
    "searchResults.tryDifferent": "Farkl\u0131 bir arama deneyin veya alan\u0131 geni\u015Fletin",

    "poi.results": "Sonu\u00E7lar",
    "poi.navigate": "Yol tarifi",
    "poi.echoes": "Yank\u0131lar",
    "poi.share": "Payla\u015F",
    "poi.linkCopied": "Ba\u011Flant\u0131 kopyaland\u0131",
    "poi.report": "Bildir",
    "poi.comingSoon": "\u00C7ok yak\u0131nda",
    "poi.away": "uzakta",
    "poi.tabRemark": "Not",
    "poi.tabCapsules": "Kaps\u00FCller",
    "poi.tabDetails": "Detaylar",

    "remark.fromLocal": "Bir yerliden",
    "remark.regenerate": "Yeniden olu\u015Ftur",
    "remark.noRemark": "Bu yer i\u00E7in hen\u00FCz bir not yok",

    "capsules.noCapsules": "Burada hen\u00FCz kaps\u00FCl yok",
    "capsules.leaveFirst": "\u0130lkini b\u0131rak",
    "capsules.sharePlaceholder": "Deneyimini payla\u015F...",
    "capsules.leaveCapsule": "Kaps\u00FCl b\u0131rak",
    "capsules.text": "Metin",
    "capsules.voice": "Ses",
    "capsules.photo": "Foto\u011Fraf",
    "capsules.video": "Video",

    "details.goodToKnow": "Bilmekte fayda var",
    "details.wifiAvailable": "WiFi mevcut",
    "details.outdoorSeating": "A\u00E7\u0131k alan oturma",
    "details.noDetails": "Detay bilgisi yok",
    "details.reported": "Bildirildi \u2014 te\u015Fekk\u00FCrler",

    "loading.moment": "Bir saniye\u2026",
    "loading.lookingInto": "Bu yere bak\u0131yoruz\u2026",
    "loading.gatheringStories": "Mahalleden hikayeler topluyoruz\u2026",
    "loading.piecingTogether": "Onu \u00F6zel k\u0131lan\u0131 bir araya getiriyoruz\u2026",
    "loading.crafting": "Notunuz haz\u0131rlan\u0131yor\u2026",

    "media.streetView": "Sokak G\u00F6r\u00FCn\u00FCm\u00FC",
    "media.explore": "Ke\u015Ffet",
    "media.lock": "Kilitle",

    "map.zoomIn": "Yak\u0131nla\u015Ft\u0131r",
    "map.zoomOut": "Uzakla\u015Ft\u0131r",
    "map.locateMe": "Konumuma git",

    "notification.dismiss": "Kapat",

    "error.searchDown": "Arama \u015Fu an \u00E7al\u0131\u015Fm\u0131yor.",
    "error.cantLoadPlace": "Bu yer y\u00FCklenemedi. Tekrar deneyin.",
    "error.cantGenerateInsufficient": "Bu yer hakk\u0131nda yeterli bilgi bulamad\u0131m.",
    "error.remarkBreather": "Notlar biraz mola veriyor. Birazdan tekrar deneyin.",
    "error.tooManyRequests": "\u00C7ok fazla istek. L\u00FCtfen yava\u015Flay\u0131n.",
    "error.cantGenerate": "\u015Eu an bir not olu\u015Fturulamad\u0131.",
    "error.cantRefresh": "Bu not yenilenemedi.",

    "welcome.title": "Obelisk'e Ho\u015F Geldiniz",
    "welcome.earlyAccess": "Erken Eri\u015Fim",
    "welcome.body": "Obelisk aktif olarak geli\u015Ftirilmektedir. Hatalar, eksik \u00F6zellikler, karars\u0131z arama sonu\u00E7lar\u0131 ve yapay zek\u00E2 notlar\u0131nda zaman zaman hal\u00FCsinasyonlarla kar\u015F\u0131la\u015Fabilirsiniz. \u00DCzerinde \u00E7al\u0131\u015F\u0131yoruz.",
    "welcome.okay": "Anlad\u0131m, ke\u015Ffedelim",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

/**
 * Retrieves a translated string for the given key and locale.
 *
 * @param key - The translation key.
 * @param locale - The target locale.
 * @returns The translated string, or the key itself if not found.
 */
export function getTranslation(key: TranslationKey, locale: Locale): string {
  return translations[locale][key] ?? key;
}

export { translations };
