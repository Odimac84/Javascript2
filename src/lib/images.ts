import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export function normalizeImageUrl(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return PLACEHOLDER_IMAGE;

  if (u.startsWith("https://placehold.co/") && !u.includes("/png")) {
    return u.endsWith("/") ? `${u}png` : `${u}/png`;
  }

  return u;
}
