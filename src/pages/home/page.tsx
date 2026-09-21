import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import VideoReels from "./components/VideoReels";
import About from "./components/About";
import TeamSection from "@/components/feature/TeamSection";
import Facilities from "./components/Facilities";
import Hostels from "./components/Hostels";
import Rooms from "./components/Rooms";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";

export default function Home() {
  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <Hero />
      <Stats />
      <VideoReels />
      <About />
      <TeamSection />
      <Facilities />
      <Hostels />
      <Rooms />
      <Testimonials />
      <Contact />
      <Footer />
      <WhatsAppFab />
    </div>
  );
}