export const AVATARS = [
  { id: "violet", label: "Violet", color: "#7b3fff" },
  { id: "blue", label: "Blue", color: "#3d6bff" },
  { id: "gold", label: "Gold", color: "#e2a21a" },
  { id: "green", label: "Green", color: "#14944a" },
  { id: "pink", label: "Pink", color: "#e45aa8" },
  { id: "navy", label: "Navy", color: "#24184a" },
] as const;

export function avatarSrc(id: string) {
  const color = AVATARS.find((a) => a.id === id)?.color ?? "#7b3fff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="${color}"/><circle cx="40" cy="32" r="12" fill="#fff"/><ellipse cx="40" cy="64" rx="18" ry="12" fill="#fff"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resizePhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that photo."));
        return;
      }
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a photo."));
    };
    img.src = url;
  });
}
