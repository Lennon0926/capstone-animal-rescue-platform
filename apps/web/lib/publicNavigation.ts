export type PublicNavigationLink = {
  href: string;
  label: string;
  requiresAdoptCatalog?: boolean;
};

// const showAdoptCatalog = process.env.NEXT_PUBLIC_SHOW_ADOPT_PAGE !== "false";
const showAdoptCatalog = false;

const publicNavigationLinks: PublicNavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/recommendations", label: "Recomendaciones" },
  { href: "/adopt", label: "Adoptar", requiresAdoptCatalog: true },
  { href: "/about", label: "Acerca de" },
  { href: "/blog", label: "Blog" },
];

const quickLinks: PublicNavigationLink[] = [
  { href: "/about", label: "Sobre Nosotros" },
  { href: "/recommendations", label: "Recomendaciones" },
  {
    href: "/adopt",
    label: "Animales Disponibles",
    requiresAdoptCatalog: true,
  },
  {
    href: "/#adoption_process",
    label: "Proceso de Adopción",
    requiresAdoptCatalog: true,
  },
];

function filterVisibleLinks(links: PublicNavigationLink[]) {
  return links.filter((link) => showAdoptCatalog || !link.requiresAdoptCatalog);
}

export function getPublicNavigationLinks() {
  return filterVisibleLinks(publicNavigationLinks);
}

export function getFooterQuickLinks() {
  return filterVisibleLinks(quickLinks);
}

export function isAdoptCatalogVisible() {
  return showAdoptCatalog;
}
