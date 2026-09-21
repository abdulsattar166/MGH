const items = [
  {
    name: "Ahmed Raza",
    role: "MBBS · King Edward Medical University",
    text: "Moving from Multan to Lahore was intimidating, but Mubarak Hostel felt like home from day one. Clean rooms, great food and the warden actually cares.",
    img: "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e9ad4da2-16f3-4b8d-bf98-ad90e7d6ca75_compressed_unnamed-7.webp",
  },
  {
    name: "Bilal Hussain",
    role: "BS CS · UET Lahore",
    text: "Wi-Fi is genuinely fast, the study lounge is quiet after 10pm, and having laundry taken care of every week is a game-changer during finals.",
    img: "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/e80b966a-564a-4b35-8f12-7425b286500b_compressed_unnamed-6.webp",
  },
  {
    name: "Usman Tariq",
    role: "BBA · LUMS",
    text: "The security here is unreal — CCTV everywhere, guards 24/7, and biometric visitor entry. My parents finally stopped worrying.",
    img: "https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 md:px-8 bg-background-50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Student Voices
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3">
            Loved by 900+ students. Trusted by their families.
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div
              key={t.name}
              className="bg-background-100 border border-background-200 rounded-2xl p-7 flex flex-col"
            >
              <div className="flex gap-1 text-accent-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill"></i>
                ))}
              </div>
              <p className="text-foreground-800 leading-relaxed italic flex-1">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-background-200">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover object-top"
                />
                <div>
                  <div className="font-semibold text-foreground-950">{t.name}</div>
                  <div className="text-xs text-foreground-600">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}