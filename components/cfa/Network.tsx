export default function Network() {
  const items = [
    "Hospital Operations Leaders",
    "Clinical Governance & Quality",
    "Finance & Revenue Specialists",
    "Digital & Data Experts",
    "Public Health & Systems",
    "Global African Diaspora Experts",
  ];

  return (
    <section id="network" className="section">
      <div className="container">
        <h2 className="heading-md text-center mb-12">
          Enjoy Quality Delivery From Our Multidisciplinary Network
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-700">
          {items.map((i) => (
            <div
              key={i}
              className="card card-hover p-6 text-center"
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
