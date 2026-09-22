// ---------------------------------------------------------------------------
// Per-hostel page content.
//
// The original six hostels have hand-written descriptions, security/food/wifi
// copy, galleries and location blocks in the mock data. Any hostel added from
// the dashboard only has the DB fields, so these helpers merge the mock
// content when it exists and fall back to sensible defaults otherwise. That
// keeps every hostel page rendering for both seed and newly added hostels.
// ---------------------------------------------------------------------------

import { hostelDetails, hostelLocations } from "@/mocks/hostels";
import { getRoomImage } from "@/lib/roomImages";
import { getHostelImage } from "@/lib/hostelImages";
import type { Hostel } from "@/lib/hostelsDb";

export type DetailContent = {
  id: number;
  description: string;
  security: string;
  food: string;
  wifi: string;
  gallery: string[];
};

export type LocationContent = {
  id: number;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapEmbed: string;
  nearbyUniversities: string[];
  nearbyLandmarks: string[];
  warden: string;
};

export function getHostelDetail(id: number, hostel?: Hostel): DetailContent {
  const mock = hostelDetails.find((d) => d.id === id);
  if (mock) {
    return {
      id: mock.id,
      description: mock.description,
      security: mock.security,
      food: mock.food,
      wifi: mock.wifi,
      gallery: mock.gallery,
    };
  }
  const lead = getHostelImage(id, hostel?.image ?? null);
  return {
    id,
    description:
      hostel?.description ||
      "A comfortable, secure and study-friendly residence managed by Mubarak Group of Hostels.",
    security:
      "24/7 CCTV coverage, a secure entrance, trained guards and a digital visitor register.",
    food: "Three freshly prepared meals a day from our in-house kitchen with a rotating weekly menu.",
    wifi: "High-speed Wi-Fi available in every room and the common areas.",
    gallery: [lead, getRoomImage(`${id}-A1`), getRoomImage(`${id}-B1`), getRoomImage(`${id}-C1`)],
  };
}

export function getHostelLocation(id: number, hostel?: Hostel): LocationContent {
  const mock = hostelLocations.find((l) => l.id === id);
  if (mock) {
    return {
      id: mock.id,
      address: mock.address,
      phone: mock.phone,
      whatsapp: mock.whatsapp,
      email: mock.email,
      mapEmbed: mock.mapEmbed,
      nearbyUniversities: mock.nearbyUniversities,
      nearbyLandmarks: mock.nearbyLandmarks,
      warden: mock.warden,
    };
  }
  const place = encodeURIComponent(hostel?.location || "Lahore, Pakistan");
  const rawPhone = hostel?.phone || "";
  return {
    id,
    address: hostel?.address || hostel?.location || "Lahore, Pakistan",
    phone: rawPhone,
    whatsapp: rawPhone.replace(/[^0-9]/g, ""),
    email: hostel?.email || "",
    mapEmbed: `https://maps.google.com/maps?q=${place}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
    nearbyUniversities: [],
    nearbyLandmarks: [],
    warden: "",
  };
}