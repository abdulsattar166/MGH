export const ceo = {
  name: "Mubarak Khan",
  title: "Founder & CEO",
  photo:
    "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20distinguished%20Pakistani%20businessman%20in%20his%20early%20fifties%20wearing%20a%20tailored%20dark%20suit%20and%20tie%20with%20a%20warm%20confident%20smile%2C%20clean%20neutral%20grey%20studio%20background%2C%20soft%20professional%20lighting%2C%20high%20detail%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=ceo-mubarak-khan&orientation=portrait",
  intro:
    "Mubarak Khan founded Mubarak Group of Hostels in 2012 with a single belief — that every student deserves safe, dignified and caring accommodation. Under his leadership, the group has grown into six hostels serving over 900 students across Rawalpindi and Lahore.",
  quote:
    "A student's room should feel like a second home, not a dormitory. That promise shapes every decision we make.",
  email: "ceo@mubarakhostels.pk",
  phone: "+92 300 000 0000",
};

export type TeamMember = {
  name: string;
  role: string;
  photo: string;
};

export const leadership: TeamMember[] = [
  {
    name: "Sara Ahmed",
    role: "Operations Manager",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20confident%20Pakistani%20woman%20in%20her%20mid%20thirties%20wearing%20a%20smart%20charcoal%20blazer%20over%20a%20light%20blouse%2C%20warm%20friendly%20smile%2C%20clean%20neutral%20grey%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-sara-ahmed&orientation=portrait",
  },
  {
    name: "Faisal Mehmood",
    role: "Mess & Hospitality Head",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20friendly%20Pakistani%20man%20in%20his%20forties%20wearing%20a%20crisp%20white%20chef%20jacket%20with%20a%20warm%20welcoming%20smile%2C%20clean%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-faisal-mehmood&orientation=portrait",
  },
  {
    name: "Col. (R) Rashid Mahmood",
    role: "Head of Security",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20distinguished%20Pakistani%20man%20in%20his%20fifties%20wearing%20a%20formal%20dark%20suit%20and%20tie%20with%20a%20composed%20confident%20expression%2C%20clean%20neutral%20grey%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-rashid-mahmood&orientation=portrait",
  },
  {
    name: "Ayesha Malik",
    role: "Admissions Manager",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20friendly%20Pakistani%20woman%20in%20her%20early%20thirties%20wearing%20a%20smart%20navy%20blazer%20with%20a%20warm%20approachable%20smile%2C%20clean%20bright%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-ayesha-malik&orientation=portrait",
  },
  {
    name: "Kamran Siddiqui",
    role: "Maintenance Supervisor",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20dependable%20Pakistani%20man%20in%20his%20forties%20wearing%20a%20smart%20casual%20light%20blue%20shirt%20with%20a%20confident%20smile%2C%20clean%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-kamran-siddiqui&orientation=portrait",
  },
  {
    name: "Nadia Khan",
    role: "Finance & Accounts Manager",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20studio%20portrait%20of%20a%20composed%20Pakistani%20woman%20in%20her%20early%20thirties%20wearing%20an%20elegant%20beige%20blazer%20with%20a%20calm%20confident%20smile%2C%20clean%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20headshot%20photography&width=600&height=750&seq=team-nadia-khan&orientation=portrait",
  },
];

export type Warden = {
  name: string;
  hostelId: number;
  hostelName: string;
  phone: string;
  photo: string;
  role: string;
};

export const wardens: Warden[] = [
  {
    name: "Muhammad Ali",
    hostelId: 1,
    hostelName: "Jinnah Hostel",
    phone: "+92 300 111 0001",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20friendly%20Pakistani%20man%20in%20his%20mid%20forties%20wearing%20a%20smart%20casual%20blue%20shirt%20with%20a%20warm%20approachable%20smile%2C%20clean%20light%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-muhammad-ali&orientation=portrait",
  },
  {
    name: "Ahmed Raza",
    hostelId: 2,
    hostelName: "Sama Hostel",
    phone: "+92 300 111 0002",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20welcoming%20Pakistani%20man%20in%20his%20late%20thirties%20wearing%20a%20light%20grey%20shirt%20with%20a%20kind%20smile%2C%20clean%20soft%20neutral%20studio%20background%2C%20warm%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-ahmed-raza&orientation=portrait",
  },
  {
    name: "Imran Khan",
    hostelId: 3,
    hostelName: "Abdul Qadir Hostel",
    phone: "+92 300 111 0003",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20confident%20Pakistani%20man%20in%20his%20early%20forties%20wearing%20a%20dark%20green%20shirt%20with%20a%20calm%20assured%20smile%2C%20clean%20neutral%20grey%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-imran-khan&orientation=portrait",
  },
  {
    name: "Bilal Ahmed",
    hostelId: 4,
    hostelName: "Mubarak Hostel 04 — DHA Phase 5",
    phone: "+92 300 111 0004",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20friendly%20Pakistani%20man%20in%20his%20late%20thirties%20wearing%20a%20white%20shirt%20with%20a%20warm%20welcoming%20smile%2C%20clean%20bright%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-bilal-ahmed&orientation=portrait",
  },
  {
    name: "Usman Ghani",
    hostelId: 5,
    hostelName: "Mubarak Hostel 05 — Wapda Town",
    phone: "+92 300 111 0005",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20composed%20Pakistani%20man%20in%20his%20forties%20wearing%20a%20navy%20blue%20shirt%20with%20a%20friendly%20smile%2C%20clean%20soft%20neutral%20studio%20background%2C%20warm%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-usman-ghani&orientation=portrait",
  },
  {
    name: "Hamza Tariq",
    hostelId: 6,
    hostelName: "Mubarak Hostel 06 — Bahria Town",
    phone: "+92 300 111 0006",
    role: "Resident Warden",
    photo:
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20cheerful%20Pakistani%20man%20in%20his%20early%20forties%20wearing%20a%20charcoal%20shirt%20with%20a%20genuine%20smile%2C%20clean%20neutral%20studio%20background%2C%20soft%20professional%20lighting%2C%20editorial%20corporate%20photography&width=600&height=750&seq=warden-hamza-tariq&orientation=portrait",
  },
];