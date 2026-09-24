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
    name: "Abdul Qadeer Hostel",
    gender: "boys",
    location: "6th Road, Rawalpindi",
    image: "https://readdy.ai/api/search-image?query=Elegant%20student%20hostel%20residence%20exterior%20with%20warm%20sandstone%20facade%20and%20balcony%20railings%2C%20modern%20clean%20architecture%20with%20large%20windows%2C%20neat%20entrance%20with%20potted%20plants%20and%20green%20landscaping%2C%20warm%20late%20afternoon%20golden%20light%2C%20clear%20sky%2C%20professional%20architectural%20photography&width=1000&height=700&seq=hostel-03-abdulqadir&orientation=landscape",
    rooms: 50,
    floors: 5,
    beds: 150,
    available: 8,
    facilities: ["Wi-Fi", "Security", "Parking", "Hot Water"],
  },
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
      "Round-the-clock guarded gate, CCTV on all floors and stairwells, and a biometric access system so only registered residents can enter the building.",
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
      "Dual fiber connections for redundancy, mesh Wi-Fi across all floors and gigabit-capable routers for seamless video calls and streaming.",
    gallery: [
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e9ad4da2-16f3-4b8d-bf98-ad90e7d6ca75_compressed_unnamed-7.webp",
      "https://readdy.ai/api/search-image?query=Bright%20four%20bed%20student%20hostel%20room%20with%20cream%20walls%2C%20neatly%20made%20beds%2C%20wooden%20study%20tables%2C%20large%20window%20with%20natural%20light%2C%20clean%20organized%20space&width=1000&height=700&seq=gal-3-b&orientation=landscape",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e80b966a-564a-4b35-8f12-7425b286500b_compressed_unnamed-6.webp",
      "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp",
    ],
  },
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
    email: "abdulqadeer@mubarakhostels.pk",
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
];
