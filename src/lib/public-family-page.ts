/** Exact public information routes; never a prefix or family-account bypass. */
export function isPublicFamilyPage(pathname: string) {
  return ["/privacy", "/terms", "/weekend"].includes(pathname);
}
