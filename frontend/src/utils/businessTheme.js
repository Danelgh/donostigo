import categoryRestauracion from "../assets/category-restauracion.jpg";
import categoryBrunch from "../assets/category-brunch.jpg";
import categoryDeporte from "../assets/category-deporte.jpg";
import categoryBienestar from "../assets/category-bienestar.jpg";
import categoryOcio from "../assets/category-ocio.jpg";
import categoryTurismo from "../assets/category-turismo.jpg";
import categoryCultura from "../assets/category-cultura.jpg";
import categoryFormacion from "../assets/category-formacion.jpg";

const categoryImages = {
  restauracion: categoryRestauracion,
  "cafeterias-y-brunch": categoryBrunch,
  deporte: categoryDeporte,
  "bienestar-y-estetica": categoryBienestar,
  ocio: categoryOcio,
  "turismo-y-visitas-guiadas": categoryTurismo,
  "cultura-y-talleres": categoryCultura,
  "formacion-y-clases": categoryFormacion
};

const brandPalettes = [
  {
    accent: "#0f766e",
    accentStrong: "#134e4a",
    soft: "rgba(15, 118, 110, 0.12)",
    surface: "rgba(236, 253, 245, 0.9)",
    surfaceStart: "rgba(238, 250, 247, 0.96)",
    surfaceEnd: "rgba(202, 247, 239, 0.82)",
    overlayStart: "rgba(16, 62, 61, 0.94)",
    overlayEnd: "rgba(15, 118, 110, 0.84)",
    shadow: "rgba(15, 118, 110, 0.18)",
    border: "rgba(15, 118, 110, 0.16)",
    tagBackground: "rgba(236, 253, 245, 0.86)"
  },
  {
    accent: "#1d4ed8",
    accentStrong: "#1e3a8a",
    soft: "rgba(29, 78, 216, 0.12)",
    surface: "rgba(239, 246, 255, 0.9)",
    surfaceStart: "rgba(242, 248, 255, 0.96)",
    surfaceEnd: "rgba(211, 227, 255, 0.82)",
    overlayStart: "rgba(21, 49, 106, 0.94)",
    overlayEnd: "rgba(29, 78, 216, 0.84)",
    shadow: "rgba(29, 78, 216, 0.18)",
    border: "rgba(29, 78, 216, 0.16)",
    tagBackground: "rgba(239, 246, 255, 0.86)"
  },
  {
    accent: "#b45309",
    accentStrong: "#92400e",
    soft: "rgba(180, 83, 9, 0.12)",
    surface: "rgba(255, 247, 237, 0.92)",
    surfaceStart: "rgba(255, 248, 240, 0.96)",
    surfaceEnd: "rgba(251, 214, 170, 0.82)",
    overlayStart: "rgba(120, 53, 15, 0.94)",
    overlayEnd: "rgba(180, 83, 9, 0.84)",
    shadow: "rgba(180, 83, 9, 0.18)",
    border: "rgba(180, 83, 9, 0.16)",
    tagBackground: "rgba(255, 247, 237, 0.86)"
  },
  {
    accent: "#7c3aed",
    accentStrong: "#5b21b6",
    soft: "rgba(124, 58, 237, 0.12)",
    surface: "rgba(245, 243, 255, 0.92)",
    surfaceStart: "rgba(247, 244, 255, 0.96)",
    surfaceEnd: "rgba(227, 214, 255, 0.82)",
    overlayStart: "rgba(80, 38, 146, 0.94)",
    overlayEnd: "rgba(124, 58, 237, 0.84)",
    shadow: "rgba(124, 58, 237, 0.18)",
    border: "rgba(124, 58, 237, 0.16)",
    tagBackground: "rgba(245, 243, 255, 0.86)"
  },
  {
    accent: "#dc2626",
    accentStrong: "#991b1b",
    soft: "rgba(220, 38, 38, 0.12)",
    surface: "rgba(254, 242, 242, 0.92)",
    surfaceStart: "rgba(255, 245, 245, 0.96)",
    surfaceEnd: "rgba(252, 210, 210, 0.82)",
    overlayStart: "rgba(120, 28, 28, 0.94)",
    overlayEnd: "rgba(220, 38, 38, 0.84)",
    shadow: "rgba(220, 38, 38, 0.18)",
    border: "rgba(220, 38, 38, 0.16)",
    tagBackground: "rgba(254, 242, 242, 0.86)"
  },
  {
    accent: "#0f766e",
    accentStrong: "#115e59",
    soft: "rgba(17, 94, 89, 0.12)",
    surface: "rgba(240, 253, 250, 0.92)",
    surfaceStart: "rgba(244, 253, 251, 0.96)",
    surfaceEnd: "rgba(193, 245, 232, 0.82)",
    overlayStart: "rgba(14, 67, 63, 0.94)",
    overlayEnd: "rgba(17, 94, 89, 0.84)",
    shadow: "rgba(17, 94, 89, 0.18)",
    border: "rgba(17, 94, 89, 0.16)",
    tagBackground: "rgba(240, 253, 250, 0.86)"
  },
  {
    accent: "#be185d",
    accentStrong: "#9d174d",
    soft: "rgba(190, 24, 93, 0.12)",
    surface: "rgba(253, 242, 248, 0.92)",
    surfaceStart: "rgba(254, 244, 249, 0.96)",
    surfaceEnd: "rgba(252, 210, 232, 0.82)",
    overlayStart: "rgba(110, 28, 67, 0.94)",
    overlayEnd: "rgba(190, 24, 93, 0.84)",
    shadow: "rgba(190, 24, 93, 0.18)",
    border: "rgba(190, 24, 93, 0.16)",
    tagBackground: "rgba(253, 242, 248, 0.86)"
  },
  {
    accent: "#155e75",
    accentStrong: "#164e63",
    soft: "rgba(21, 94, 117, 0.12)",
    surface: "rgba(236, 254, 255, 0.92)",
    surfaceStart: "rgba(242, 253, 255, 0.96)",
    surfaceEnd: "rgba(197, 241, 245, 0.82)",
    overlayStart: "rgba(19, 63, 89, 0.94)",
    overlayEnd: "rgba(21, 94, 117, 0.84)",
    shadow: "rgba(21, 94, 117, 0.18)",
    border: "rgba(21, 94, 117, 0.16)",
    tagBackground: "rgba(236, 254, 255, 0.86)"
  }
];

export function getCategoryKey(category) {
  return (category || "general")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export function getBusinessInitials(name) {
  if (!name) {
    return "DG";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getCategoryImage(category) {
  return categoryImages[getCategoryKey(category)] ?? categoryTurismo;
}

function getBusinessThemeSeed(business) {
  if (typeof business === "string") {
    return business;
  }

  return [business?.name, business?.category, business?.serviceMode].filter(Boolean).join("|");
}

function hashSeed(seed) {
  return Array.from(seed).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % brandPalettes.length;
  }, 0);
}

export function getBusinessBrandTheme(business) {
  const seed = getBusinessThemeSeed(business);
  const paletteIndex = hashSeed(seed || "donostigo-default");

  return brandPalettes[paletteIndex];
}

export function getBusinessThemeStyle(business) {
  const theme = getBusinessBrandTheme(business);

  return {
    "--business-accent": theme.accent,
    "--business-accent-strong": theme.accentStrong,
    "--business-accent-soft": theme.soft,
    "--business-accent-surface": theme.surface,
    "--business-surface-start": theme.surfaceStart,
    "--business-surface-end": theme.surfaceEnd,
    "--business-overlay-start": theme.overlayStart,
    "--business-overlay-end": theme.overlayEnd,
    "--business-shadow": theme.shadow,
    "--business-border": theme.border,
    "--business-tag-background": theme.tagBackground
  };
}

export function getBusinessCoverImage(business) {
  if (business?.imageUrl) {
    return business.imageUrl;
  }

  return getCategoryImage(business?.category);
}
