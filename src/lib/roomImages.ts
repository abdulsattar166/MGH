// ---------------------------------------------------------------------------
// Room images — a shared, per-room image store for the demo.
//
// Every room has its own unique key (e.g. "1-A1", "2-B3", "3-101"). The image
// for a room is either:
//   1. a custom image uploaded from the Admin/Warden panel, or
//   2. a deterministic dummy placeholder (so nothing is ever broken).
//
// Architecture note: images are kept in localStorage for the frontend demo and
// behind small functions so the storage can later be swapped for a real backend
// (REST API + secure file storage) without changing any UI component.
// ---------------------------------------------------------------------------

const IMAGES_KEY = "mubarak_room_images_v1";
const CHANGE_EVENT = "mubarak-room-images-changed";

// A pool of distinct placeholder room photos. Each room maps deterministically
// to one of these until a real photo is uploaded for that specific room.
const DUMMY_POOL: string[] = [
  "https://readdy.ai/api/search-image?query=Bright%20premium%20two%20bed%20student%20hostel%20room%20with%20warm%20oak%20wooden%20beds%2C%20crisp%20white%20linen%2C%20sage%20green%20accent%20cushions%2C%20study%20desk%20near%20large%20window%2C%20soft%20natural%20daylight%2C%20clean%20minimalist%20cozy%20interior&width=800&height=600&seq=room-dummy-01&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Cozy%20three%20bed%20student%20hostel%20room%20with%20cream%20walls%2C%20terracotta%20throw%20pillows%2C%20wooden%20study%20tables%2C%20warm%20bedside%20lamps%2C%20natural%20window%20light%2C%20tidy%20organized%20premium%20accommodation&width=800&height=600&seq=room-dummy-02&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Spacious%20four%20bed%20student%20hostel%20room%20with%20warm%20beige%20walls%2C%20four%20single%20beds%20with%20white%20bedding%2C%20wooden%20lockers%20and%20shared%20study%20desk%2C%20soft%20daylight%2C%20clean%20organized%20budget%20accommodation&width=800&height=600&seq=room-dummy-03&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Minimalist%20two%20bed%20hostel%20room%20with%20white%20walls%2C%20grey%20linen%2C%20light%20wood%20furniture%2C%20framed%20wall%20art%2C%20potted%20plant%2C%20bright%20airy%20natural%20light%2C%20modern%20clean%20student%20interior&width=800&height=600&seq=room-dummy-04&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Warm%20three%20bed%20hostel%20room%20with%20mustard%20yellow%20accent%20pillows%2C%20dark%20walnut%20beds%2C%20bedside%20reading%20lights%2C%20wooden%20wardrobe%2C%20cozy%20warm%20ambient%20lighting%2C%20homely%20student%20accommodation&width=800&height=600&seq=room-dummy-05&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Bright%20four%20bed%20hostel%20room%20with%20olive%20green%20bed%20runners%2C%20white%20walls%2C%20four%20wooden%20single%20beds%2C%20individual%20study%20desks%2C%20large%20windows%2C%20fresh%20natural%20light%2C%20tidy%20student%20living%20space&width=800&height=600&seq=room-dummy-06&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Elegant%20two%20bed%20deluxe%20hostel%20room%20with%20oak%20furniture%2C%20forest%20green%20cushions%2C%20writing%20desk%2C%20framed%20wall%20art%2C%20sheer%20curtains%2C%20soft%20morning%20light%2C%20refined%20premium%20student%20suite&width=800&height=600&seq=room-dummy-07&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Comfortable%20three%20bed%20hostel%20room%20with%20light%20oak%20bunk%20beds%2C%20warm%20cream%20linen%2C%20small%20study%20corner%2C%20wall%20shelves%2C%20natural%20daylight%20through%20window%2C%20neat%20cozy%20student%20interior&width=800&height=600&seq=room-dummy-08&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Four%20bed%20student%20dorm%20room%20with%20warm%20wood%20panel%20wall%2C%20beige%20bedding%2C%20communal%20study%20table%20with%20green%20lamp%2C%20soft%20window%20light%2C%20organized%20and%20clean%20shared%20accommodation&width=800&height=600&seq=room-dummy-09&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Bright%20two%20bed%20hostel%20room%20with%20white%20and%20sage%20green%20bedding%2C%20wooden%20headboards%2C%20small%20desk%2C%20hanging%20plant%2C%20airy%20natural%20daylight%2C%20modern%20fresh%20student%20bedroom&width=800&height=600&seq=room-dummy-10&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Three%20bed%20hostel%20room%20with%20warm%20neutral%20tones%2C%20rattan%20pendant%20light%2C%20wooden%20beds%2C%20folded%20towels%2C%20study%20desk%20by%20window%2C%20calm%20soft%20daylight%2C%20tidy%20premium%20student%20room&width=800&height=600&seq=room-dummy-11&orientation=landscape",
  "https://readdy.ai/api/search-image?query=Cozy%20four%20bed%20hostel%20room%20with%20wooden%20bunk%20beds%2C%20warm%20bedside%20lights%2C%20cream%20walls%2C%20individual%20lockers%2C%20soft%20evening%20lamp%20glow%2C%20inviting%20homely%20student%20dormitory&width=800&height=600&seq=room-dummy-12&orientation=landscape",
];

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function defaultRoomImage(key: string): string {
  return DUMMY_POOL[hashKey(key) % DUMMY_POOL.length];
}

type Overrides = Record<string, string>;

function readOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(IMAGES_KEY) || "") as Overrides;
  } catch {
    return {};
  }
}

function writeOverrides(value: Overrides): void {
  try {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(value));
  } catch {
    // localStorage full — silently no-op for the demo
  }
}

export function getRoomImage(key: string): string {
  const overrides = readOverrides();
  return overrides[key] || defaultRoomImage(key);
}

export function setRoomImage(key: string, dataUrl: string): void {
  const overrides = readOverrides();
  overrides[key] = dataUrl;
  writeOverrides(overrides);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeRoomImages(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}