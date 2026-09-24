import mubarakPhoto from "@/assets/mubarak-mehdi.jpeg";
import usamaPhoto from "@/assets/usama-rafiq.jpeg";
import yousafPhoto from "@/assets/yousaf-mehsood.jpeg";
import abdullahPhoto from "@/assets/abdullah.jpeg";
import bilalPhoto from "@/assets/bilal-ahmed.jpeg";

export const ceo = {
  name: "Mubarak Mehdi",
  title: "Founder & CEO",
  designation:
    "Founder & CEO of Mubarak Group of Hostels and multiple ventures across Pakistan.",
  photo: mubarakPhoto,
  intro:
    "A visionary entrepreneur, educator, and leader with over a decade of experience in business, education, and community service. This project showcases the professional milestones, leadership roles, and achievements of Mubarak Mehdi — Founder & CEO of Mubarak Group of Hostels and multiple ventures across Pakistan. From educational roots to entrepreneurial excellence and social activism, this is a journey of dedication, discipline, and growth.",
  quote:
    "From educational roots to entrepreneurial excellence and social activism — this is a journey of dedication, discipline, and growth.",
  email: "mubarakgroupofhostels@gmail.com",
  phone: "0302 9272481",
};

export type TeamMember = {
  name: string;
  role: string;
  photo: string;
  email?: string;
  phone?: string;
};

export const leadership: TeamMember[] = [
  {
    name: "Usama Rafiq",
    role: "Digital Marketing Manager",
    photo: usamaPhoto,
    email: "usamarafiq276@gmail.com",
    phone: "0302 9272481",
  },
];

export type Warden = {
  name: string;
  hostelId: number;
  hostelName: string;
  phone: string;
  email: string;
  photo: string;
  role: string;
};

export const wardens: Warden[] = [
  {
    name: "Yousaf Mehsood",
    hostelId: 1,
    hostelName: "Jinnah Boys House",
    phone: "03419715017",
    email: "yousafmehsood2121@gmail.com",
    role: "Warden, Jinnah Boys House",
    photo: yousafPhoto,
  },
  {
    name: "Abdullah",
    hostelId: 2,
    hostelName: "Sama Boys House",
    phone: "03105948138",
    email: "malikabdullahmalikaz@gmail.com",
    role: "Warden, Sama Boys House",
    photo: abdullahPhoto,
  },
  {
    name: "Bilah Ahmed",
    hostelId: 3,
    hostelName: "Abdul Qadeer Boys House",
    phone: "03045889984",
    email: "bilalsudais74@gmail.com",
    role: "Warden, Abdul Qadeer Boys House",
    photo: bilalPhoto,
  },
];
