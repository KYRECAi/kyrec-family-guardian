// This first package proves local installation. A mobile session/API transport
// has not been connected yet, so it must not collect credentials or use a dev user.
export const isMobilePackage = import.meta.env.VITE_GUARDIAN_MOBILE_BUILD === "true";
