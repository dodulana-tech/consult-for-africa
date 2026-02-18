export default function Partners() {
  return (
    <section className="section surface-muted text-center">
      <div className="container">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mb-8">
          Partners & Collaborators
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-70">
          {[1,2,3,4,5].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 rounded grayscale hover:grayscale-0 hover:scale-105 transition duration-300"
            />
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Healthcare operators • Investors • Development partners • Technology providers
        </p>
      </div>
    </section>
  );
}
