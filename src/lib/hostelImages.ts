// ---------------------------------------------------------------------------
// Hostel cover images.
//
// A hostel can have its own photo uploaded by the admin (stored in
// `hostels.image_url`). When no photo has been set yet we fall back to a
// deterministic default so the public pages always show a picture —
// seed hostels (ids 1–3) use their original images, any newly added
// hostel uses a generic building photo.
// ---------------------------------------------------------------------------

import { hostels } from "@/mocks/hostels";

const GENERIC_IMAGE =
  "https://readdy.ai/api/search-image?query=Modern%20five%20storey%20student%20hostel%20building%20exterior%20with%20warm%20cream%20facade%20and%20sage%20green%20accent%20details%2C%20clean%20minimal%20residential%20architecture%2C%20manicured%20landscaped%20entrance%20with%20lush%20green%20plants%20and%20trees%2C%20warm%20golden%20hour%20sunlight%2C%20clear%20blue%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&orientation=landscape";

const defaults = new Map<number, string>(hostels.map((h) => [h.id, h.image]));

/**
 * Returns the hostel's own image when one has been set, otherwise a
 * deterministic default (per-id for the original six hostels, generic for
 * any others).
 */
export function getHostelImage(id: number, imageUrl: string | null | undefined): string {
  if (imageUrl) return imageUrl;
  return defaults.get(id) ?? GENERIC_IMAGE;
}