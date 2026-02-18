export default function ContextImages() {
  const imgs = [
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1200&auto=format&fit=crop",
  ];

  return (
    <section className="grid md:grid-cols-3">
      {imgs.map((src) => (
        <img
          key={src}
          src={src}
          className="h-64 w-full object-cover transition duration-700 hover:scale-105"
        />
      ))}
    </section>
  );
}
