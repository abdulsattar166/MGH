export const hostels = [
  {
    id: 1,
    name: "Jinnah Hostel",
    gender: "boys",
    location: "6th Road, Rawalpindi",
    image: "https://readdy.ai/api/search-image?query=Modern%20five%20storey%20student%20hostel%20building%20exterior%20with%20warm%20cream%20facade%20and%20sage%20green%20accent%20details%2C%20clean%20minimal%20residential%20architecture%2C%20manicured%20landscaped%20entrance%20with%20lush%20green%20plants%20and%20trees%2C%20warm%20golden%20hour%20sunlight%2C%20clear%20blue%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-01-jinnah&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 22,
    facilities: ["Wi-Fi", "Security", "Mess", "Laundry"],
  },
  {
    id: 2,
    name: "Sama Hostel",
    gender: "boys",
    location: "6th Road, Rawalpindi",
    image: "https://readdy.ai/api/search-image?query=Contemporary%20student%20hostel%20building%20exterior%20with%20warm%20beige%20facade%20and%20modern%20windows%2C%20four%20storey%20clean%20residential%20architecture%2C%20tidy%20landscaped%20front%20garden%20with%20green%20shrubs%20and%20pathway%2C%20soft%20warm%20morning%20light%2C%20bright%20blue%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-02-sama&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 15,
    facilities: ["Wi-Fi", "Generator", "Mess", "Study Area"],
  },
  {
    id: 3,
    name: "Abdul Qadir Hostel",
    gender: "boys",
    location: "6th Road, Rawalpindi",
    image: "https://readdy.ai/api/search-image?query=Elegant%20student%20hostel%20residence%20exterior%20with%20warm%20sandstone%20facade%20and%20balcony%20railings%2C%20modern%20clean%20architecture%20with%20large%20windows%2C%20neat%20entrance%20with%20potted%20plants%20and%20green%20landscaping%2C%20warm%20late%20afternoon%20golden%20light%2C%20clear%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-03-abdulqadir&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 8,
    facilities: ["Wi-Fi", "Security", "Parking", "Hot Water"],
  },
  {
    id: 4,
    name: "Mubarak Hostel 04 — DHA Phase 5",
    gender: "girls",
    location: "DHA Phase 5, Lahore",
    image: "https://readdy.ai/api/search-image?query=Upscale%20modern%20girls%20student%20hostel%20building%20in%20a%20gated%20community%2C%20warm%20cream%20exterior%20with%20elegant%20design%20details%2C%20landscaped%20gardens%20with%20manicured%20hedges%20and%20flowers%2C%20soft%20warm%20evening%20light%2C%20premium%20architectural%20photography%2C%20luxurious%20yet%20welcoming%20student%20residence&width=1000&height=700&seq=hostel-04-dha&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 30,
    facilities: ["Wi-Fi", "Mess", "Laundry", "Security"],
  },
  {
    id: 5,
    name: "Mubarak Hostel 05 — Wapda Town",
    gender: "girls",
    location: "Wapda Town, Lahore",
    image: "https://readdy.ai/api/search-image?query=Comfortable%20modern%20student%20hostel%20building%20with%20warm%20beige%20exterior%20and%20neat%20balconies%2C%20family%20friendly%20residential%20neighborhood%20setting%20with%20green%20trees%20and%20clean%20streets%2C%20soft%20warm%20daylight%2C%20clear%20sky%2C%20professional%20architectural%20photography%2C%20safe%20premium%20student%20accommodation&width=1000&height=700&seq=hostel-05-wapda&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 18,
    facilities: ["Wi-Fi", "Security", "Generator", "Mess"],
  },
  {
    id: 6,
    name: "Mubarak Hostel 06 — Bahria Town",
    gender: "girls",
    location: "Bahria Town, Lahore",
    image: "https://readdy.ai/api/search-image?query=Modern%20gated%20student%20hostel%20building%20in%20a%20well%20planned%20community%2C%20warm%20cream%20facade%20with%20contemporary%20architectural%20lines%2C%20wide%20clean%20roads%20and%20green%20parks%20nearby%2C%20bright%20warm%20sunlight%2C%20blue%20sky%2C%20professional%20architectural%20photography%2C%20premium%20secure%20student%20living&width=1000&height=700&seq=hostel-06-bahria&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 12,
    facilities: ["Wi-Fi", "Study Area", "Hot Water", "Parking"],
  },
];

export const stats = [
  { value: 6, suffix: "+", label: "Hostels", icon: "ri-building-2-line" },
  { value: 300, suffix: "+", label: "Rooms", icon: "ri-door-open-line" },
  { value: 900, suffix: "+", label: "Beds", icon: "ri-hotel-bed-line" },
  { value: 24, suffix: "/7", label: "Security", icon: "ri-shield-check-line" },
  { value: 24, suffix: "/7", label: "Wi-Fi", icon: "ri-wifi-line" },
  { value: 5, suffix: "", label: "Floors / Hostel", icon: "ri-stack-line" },
];

export const facilities = [
  { icon: "ri-flashlight-line", title: "24/7 Electricity", desc: "Uninterrupted power with backup generators on every floor." },
  { icon: "ri-wifi-line", title: "High-Speed Wi-Fi", desc: "Fiber-optic internet in every room, common area and study lounge." },
  { icon: "ri-camera-lens-line", title: "CCTV Surveillance", desc: "24/7 monitored cameras covering entrances, hallways and lobbies." },
  { icon: "ri-shield-user-line", title: "Trained Security", desc: "On-duty guards and biometric visitor management around the clock." },
  { icon: "ri-restaurant-2-line", title: "Fresh Mess Food", desc: "Hygienic breakfast, lunch and dinner curated by our in-house chefs." },
  { icon: "ri-t-shirt-line", title: "Laundry & Housekeeping", desc: "Weekly laundry pickup and daily housekeeping for a spotless stay." },
  { icon: "ri-drop-line", title: "Hot & Cold Water", desc: "Filtered drinking water and instant hot water across all washrooms." },
  { icon: "ri-book-open-line", title: "Study Lounges", desc: "Quiet, well-lit study zones designed for focus and productivity." },
];

export const rooms = [
  {
    type: "2-Seater Deluxe",
    capacity: 2,
    price: 22000,
    image: "https://readdy.ai/api/search-image?query=Elegant%20premium%20student%20hostel%20room%20with%20two%20single%20wooden%20beds%2C%20crisp%20white%20linen%2C%20warm%20wooden%20study%20desk%2C%20soft%20green%20cushions%2C%20warm%20natural%20daylight%20through%20large%20window%2C%20clean%20minimalist%20cozy%20interior%20photography&width=800&height=600&seq=room-2seater-mub&orientation=landscape",
    features: ["Attached bath", "Study desks", "Wardrobes", "AC"],
  },
  {
    type: "3-Seater Comfort",
    capacity: 3,
    price: 17000,
    image: "https://readdy.ai/api/search-image?query=Bright%20clean%20three%20bed%20student%20hostel%20room%20with%20warm%20wooden%20furniture%2C%20crisp%20white%20bedding%20on%20three%20single%20beds%2C%20shared%20study%20desk%20with%20green%20lamp%2C%20soft%20natural%20light%20from%20window%2C%20cozy%20premium%20accommodation%20interior&width=800&height=600&seq=room-3seater-mub&orientation=landscape",
    features: ["Attached bath", "Individual desks", "Wardrobes", "Fan"],
  },
  {
    type: "4-Seater Standard",
    capacity: 4,
    price: 14000,
    image: "https://readdy.ai/api/search-image?query=Spacious%20four%20bed%20student%20hostel%20room%20with%20warm%20cream%20walls%2C%20four%20neatly%20made%20single%20beds%20with%20white%20linen%2C%20wooden%20study%20area%2C%20soft%20daylight%2C%20clean%20organized%20interior%2C%20professional%20accommodation%20photography&width=800&height=600&seq=room-4seater-mub&orientation=landscape",
    features: ["Shared bath", "Study area", "Wardrobes", "Fan"],
  },
  {
    type: "5-Seater Economy",
    capacity: 5,
    price: 11000,
    image: "https://readdy.ai/api/search-image?query=Well%20organized%20five%20bed%20budget%20student%20hostel%20room%20with%20warm%20beige%20walls%2C%20five%20single%20beds%20with%20crisp%20linens%2C%20small%20wooden%20lockers%2C%20natural%20daylight%2C%20clean%20cozy%20interior%20photography%20of%20affordable%20accommodation&width=800&height=600&seq=room-5seater-mub&orientation=landscape",
    features: ["Shared bath", "Lockers", "Common desk", "Fan"],
  },
];

export const hostelDetails = [
  {
    id: 1,
    description:
      "Our flagship residence on the bustling 6th Road in Rawalpindi, minutes from the Islamabad border. Close to Ayub National Park, Jinnah Park and the commercial heart of Saddar, it keeps students connected to both Rawalpindi and the capital while offering a calm, secure retreat indoors.",
    security:
      "24/7 CCTV coverage on every floor, biometric entry at the main gate, trained security guards stationed at the entrance, and strict visitor management with a digital register.",
    food:
      "Three freshly prepared meals a day — breakfast, lunch and dinner — cooked in our in-house kitchen. A weekly menu keeps things varied, with special Friday barbecue dinners.",
    wifi:
      "Dedicated fiber-optic line with 100 Mbps symmetrical speeds, individual access points on every floor and a backup connection to keep study time uninterrupted.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e9ad4da2-16f3-4b8d-bf98-ad90e7d6ca75_compressed_unnamed-7.webp",
      "https://readdy.ai/api/search-image?query=Clean%20bright%20student%20hostel%20bedroom%20with%20neatly%20made%20single%20beds%2C%20white%20linen%2C%20wooden%20wardrobes%20and%20study%20desk%2C%20large%20window%20with%20soft%20natural%20light%2C%20warm%20cozy%20premium%20interior&width=1000&height=700&seq=gal-1-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e80b966a-564a-4b35-8f12-7425b286500b_compressed_unnamed-6.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp",
    ],
  },
  {
    id: 2,
    description:
      "Nestled along 6th Road in Rawalpindi, this branch offers a peaceful study-first environment. A short drive from Fatima Jinnah Women University and major banks, it's a favourite among students who prefer a quieter, well-connected setting near Islamabad.",
    security:
      "Round-the-clock guarded gate, CCTV on all six floors and stairwells, and a biometric access system so only registered residents can enter the building.",
    food:
      "Home-style Pakistani meals served three times a day, with a rotating menu, hygienic kitchen and optional tuck shop for late-night snacks.",
    wifi:
      "High-speed fiber Wi-Fi available in every room, common areas and the rooftop study deck, with 24/7 technical support.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/db69d22d-f7de-46d5-bd73-201f66a529af_compressed_unnamed-3.webp",
      "https://readdy.ai/api/search-image?query=Bright%20clean%20three%20bed%20student%20hostel%20room%20with%20wooden%20bunk%20beds%2C%20white%20bedding%2C%20study%20desks%2C%20soft%20daylight%20through%20window%2C%20organized%20premium%20interior&width=1000&height=700&seq=gal-2-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/b3c6a844-4444-434f-b25a-221a79675a38_compressed_unnamed-9.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/f4fc409f-5ee7-47ba-8c6-6dfee5a58986_compressed_unnamed-4.webp",
    ],
  },
  {
    id: 3,
    description:
      "Located on 6th Road, Rawalpindi — the academic gateway to the twin cities. Minutes from Arid Agriculture University, Bahria University and top coaching centres, it's designed for busy students who want study, food and entertainment all within reach of Islamabad.",
    security:
      "24/7 CCTV monitoring, secure boundary walls, night guards on patrol and a digital visitor logbook with photo capture.",
    food:
      "Balanced daily menu with breakfast, lunch and dinner, plus a hydration station with filtered cold and hot water on every floor.",
    wifi:
      "Dual fiber connections for redundancy, mesh Wi-Fi across all six floors and gigabit-capable routers for seamless video calls and streaming.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e9ad4da2-16f3-4b8d-bf98-ad90e7d6ca75_compressed_unnamed-7.webp",
      "https://readdy.ai/api/search-image?query=Bright%20four%20bed%20student%20hostel%20room%20with%20cream%20walls%2C%20neatly%20made%20beds%2C%20wooden%20study%20tables%2C%20large%20window%20with%20natural%20light%2C%20clean%20organized%20space&width=1000&height=700&seq=gal-3-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e80b966a-564a-4b35-8f12-7425b286500b_compressed_unnamed-6.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp",
    ],
  },
  {
    id: 4,
    description:
      "Our premium branch in the upscale DHA Phase 5, offering a refined living experience with spacious rooms, landscaped surroundings and premium amenities. Ideal for students who value comfort and a touch of luxury.",
    security:
      "Gated community security plus on-site guards, 24/7 CCTV, smart-lock room access and monitored entry points at all times.",
    food:
      "Chef-prepared meals three times a day with a continental breakfast option, plus a café corner for coffee and snacks.",
    wifi:
      "Enterprise-grade fiber internet with dedicated bandwidth per floor, individual room routers and 24/7 uptime monitoring.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/db69d22d-f7de-46d5-bd73-201f66a529af_compressed_unnamed-3.webp",
      "https://readdy.ai/api/search-image?query=Premium%20two%20bed%20hostel%20suite%20with%20wooden%20furniture%2C%20warm%20lighting%2C%20study%20desk%2C%20large%20windows%2C%20elegant%20student%20room%20interior&width=1000&height=700&seq=gal-4-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/b3c6a844-4444-434f-b25a-221a79675a38_compressed_unnamed-9.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/f4fc409f-5ee7-47ba-8c6-6dfee5a58986_compressed_unnamed-4.webp",
    ],
  },
  {
    id: 5,
    description:
      "A comfortable, affordable residence in the family-friendly Wapda Town neighbourhood. Close to markets, mosques and public transport, it's a practical choice for students who want a safe, budget-conscious living arrangement.",
    security:
      "24/7 guarded entrance, CCTV on all floors, secure lockers in every room and a resident warden on-site at all hours.",
    food:
      "Nutritious daily meals — breakfast, lunch and dinner — with a weekly menu and seasonal fruit at breakfast.",
    wifi:
      "Reliable fiber internet with strong coverage across all rooms and a dedicated study corner with charging points.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e9ad4da2-16f3-4b8d-bf98-ad90e7d6ca75_compressed_unnamed-7.webp",
      "https://readdy.ai/api/search-image?query=Neat%20three%20bed%20student%20hostel%20room%20with%20wooden%20beds%2C%20white%20linen%2C%20study%20desks%20and%20lockers%2C%20soft%20natural%20light%2C%20organized%20interior&width=1000&height=700&seq=gal-5-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e80b966a-564a-4b35-8f12-7425b286500b_compressed_unnamed-6.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp",
    ],
  },
  {
    id: 6,
    description:
      "Set in the modern, well-planned community of Bahria Town, this hostel offers a secure gated environment with wide roads, parks and a vibrant neighbourhood. A great pick for students who want modern living standards.",
    security:
      "Bahria Town's gated security plus on-site CCTV, night patrols and strict access control with a resident warden.",
    food:
      "Three fresh meals daily with a monthly special menu, hygienic kitchen and a snack bar for quick bites between classes.",
    wifi:
      "High-speed fiber broadband with mesh coverage across the building and high-availability backup connectivity.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/db69d22d-f7de-46d5-bd73-201f66a529af_compressed_unnamed-3.webp",
      "https://readdy.ai/api/search-image?query=Bright%20clean%20student%20bedroom%20with%20four%20beds%2C%20white%20linens%2C%20wooden%20wardrobes%2C%20study%20area%2C%20large%20window%20with%20daylight%2C%20organized%20interior&width=1000&height=700&seq=gal-6-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/b3c6a844-4444-434f-b25a-221a79675a38_compressed_unnamed-9.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/f4fc409f-5ee7-47ba-8c6-6dfee5a58986_compressed_unnamed-4.webp",
    ],
  },
];

export const roomAvailability = [
  { id: 1, rooms: [3, 4, 5, 6] },
  { id: 2, rooms: [2, 3, 4, 5] },
  { id: 3, rooms: [1, 2, 3, 2] },
  { id: 4, rooms: [5, 6, 7, 8] },
  { id: 5, rooms: [2, 3, 4, 5] },
  { id: 6, rooms: [1, 2, 3, 3] },
];

export const hostelLocations = [
  {
    id: 1,
    address: "6th Road, Rawalpindi, Punjab",
    phone: "+92 300 111 0001",
    whatsapp: "923001110001",
    email: "jinnah@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=6th%20Road%20Rawalpindi&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "Fatima Jinnah Women University",
      "Arid Agriculture University Rawalpindi",
      "Bahria University Islamabad",
    ],
    nearbyLandmarks: ["Ayub National Park", "Jinnah Park", "Saddar Bazaar"],
    warden: "Yousaf Mehsood",
  },
  {
    id: 2,
    address: "6th Road, Rawalpindi, Punjab",
    phone: "+92 300 111 0002",
    whatsapp: "923001110002",
    email: "sama@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=6th%20Road%20Rawalpindi&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "Arid Agriculture University Rawalpindi",
      "Bahria University Islamabad",
      "National University of Sciences & Technology (NUST)",
    ],
    nearbyLandmarks: ["Committee Chowk", "Rawalpindi Cricket Stadium", "Murree Road"],
    warden: "Abdullah",
  },
  {
    id: 3,
    address: "6th Road, Rawalpindi, Punjab",
    phone: "+92 300 111 0003",
    whatsapp: "923001110003",
    email: "abdulqadir@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=6th%20Road%20Rawalpindi&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "Bahria University Islamabad",
      "International Islamic University Islamabad",
      "COMSATS University Islamabad",
    ],
    nearbyLandmarks: ["Ayub National Park", "Raja Bazaar", "Centaurus Mall Islamabad"],
    warden: "Bilah Ahmed",
  },
  {
    id: 4,
    address: "Sector C, DHA Phase 5, Lahore",
    phone: "+92 300 111 0004",
    whatsapp: "923001110004",
    email: "dha@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=DHA%20Phase%205%20Lahore&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "LUMS",
      "Beaconhouse National University",
      "Lahore School of Economics",
    ],
    nearbyLandmarks: ["Defence Raya Golf", "Packages Mall", "DHA Shopping Mall"],
    warden: "To be assigned",
  },
  {
    id: 5,
    address: "Main Boulevard, Wapda Town, Lahore",
    phone: "+92 300 111 0005",
    whatsapp: "923001110005",
    email: "wapdatown@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=Wapda%20Town%20Lahore&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "Virtual University of Pakistan",
      "Allama Iqbal Open University",
      "University of the Punjab",
    ],
    nearbyLandmarks: ["Wapda Town Market", "Wapda House", "Canal Road"],
    warden: "To be assigned",
  },
  {
    id: 6,
    address: "Sector B, Bahria Town, Lahore",
    phone: "+92 300 111 0006",
    whatsapp: "923001110006",
    email: "bahriatown@mubarakhostels.pk",
    mapEmbed:
      "https://maps.google.com/maps?q=Bahria%20Town%20Lahore&t=&z=14&ie=UTF8&iwloc=&output=embed",
    nearbyUniversities: [
      "University of Lahore",
      "Bahria University",
      "University of Central Punjab",
    ],
    nearbyLandmarks: ["Eiffel Tower Replica", "Grand Jamia Mosque", "Bahria Town Mall"],
    warden: "To be assigned",
  },
];