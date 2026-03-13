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
