import { useState } from "react";
import { faqs } from "@/mocks/site";

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-background-100 transition"
      >
        <span className="font-semibold text-foreground-950 text-sm md:text-base">{q}</span>
        <span className="w-7 h-7 rounded-full bg-background-100 flex items-center justify-center shrink-0">
          <i className={`${open ? "ri-subtract-line" : "ri-add-line"} text-foreground-700`}></i>
        </span>
      </button>
      {open && <div className="px-5 pb-5 text-foreground-600 text-sm leading-relaxed">{a}</div>}
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-24 px-4 md:px-8 bg-background-100">
      <div className="mx-auto max-w-3xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Frequently Asked Questions
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
            Everything you need to know
          </h2>
          <p className="mt-4 text-foreground-600">
            Can't find what you're looking for? Message us on WhatsApp and our team will help you
            right away.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <FaqItem
              key={i}
              q={f.q}
              a={f.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}