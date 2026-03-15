import Image from "next/image";

const images = [
  {
    src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1600&auto=format&fit=crop",
    label: "Hospital Operations",
  },
  {
    src: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=1600&auto=format&fit=crop",
    label: "Leadership & Governance",
  },
  {
    src: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1200&auto=format&fit=crop",
    label: "Clinical Excellence",
  },
];

export default function ContextImages() {
  return (
    <section className="grid md:grid-cols-3">
      {images.map(({ src, label }) => (
        <div key={src} className="relative overflow-hidden group" style={{ height: "280px" }}>
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(6,9,15,0.65) 0%, transparent 55%)" }}
          />
          <p
            className="absolute bottom-4 left-5 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#D4AF37" }}
          >
            {label}
          </p>
        </div>
      ))}
    </section>
  );
}
