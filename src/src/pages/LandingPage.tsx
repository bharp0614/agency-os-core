const PHONE = '(317) 555-0100';
const PHONE_HREF = 'tel:+13175550100';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Emergency Towing Indianapolis',
            telephone: PHONE,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Indianapolis',
              addressRegion: 'IN',
              addressCountry: 'US',
            },
            url: 'https://emergencytowingindianapolis.com',
            openingHours: 'Mo-Su 00:00-23:59',
            priceRange: '$$',
          }),
        }}
      />

      {/* Header */}
      <header className="bg-yellow-400 py-4 px-6 flex items-center justify-between">
        <div className="font-black text-xl text-gray-900 uppercase tracking-tight">
          Emergency Towing Indianapolis
        </div>
        <a
          href={PHONE_HREF}
          className="bg-gray-900 text-yellow-400 font-bold px-5 py-2 rounded-full text-sm hover:bg-gray-800 transition-colors"
        >
          Call Now
        </a>
      </header>

      {/* Hero */}
      <section className="bg-gray-900 text-white px-6 py-20 text-center">
        <p className="text-yellow-400 font-semibold text-sm uppercase tracking-widest mb-3">
          24/7 Indianapolis Towing
        </p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          Stuck on the Road?<br />
          <span className="text-yellow-400">We're On Our Way.</span>
        </h1>
        <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
          Fast, affordable emergency towing anywhere in Indianapolis and surrounding areas. One call gets you help in minutes.
        </p>
        <a
          href={PHONE_HREF}
          className="inline-block bg-yellow-400 text-gray-900 font-black text-2xl px-10 py-5 rounded-2xl hover:bg-yellow-300 transition-colors shadow-lg"
        >
          📞 {PHONE}
        </a>
        <p className="text-gray-500 text-sm mt-4">Available 24 hours · 7 days a week</p>
      </section>

      {/* Services */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10">Our Towing Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { icon: '🚗', title: 'Emergency Towing', desc: 'Broke down on the highway or side street — we get there fast.' },
            { icon: '🔋', title: 'Jump Starts', desc: 'Dead battery? We\'ll get you running again without a tow.' },
            { icon: '🔑', title: 'Lockout Service', desc: 'Locked your keys inside? We\'ll get you back in quickly.' },
            { icon: '⛽', title: 'Fuel Delivery', desc: 'Ran out of gas? We\'ll bring enough to get you to the nearest station.' },
            { icon: '🚙', title: 'Flatbed Towing', desc: 'Safe transport for luxury, lowered, or all-wheel drive vehicles.' },
            { icon: '🛞', title: 'Tire Changes', desc: 'Flat tire on the road? We\'ll swap it out on the spot.' },
          ].map((s) => (
            <div key={s.title} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-lg mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-10">Why Indianapolis Trusts Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { stat: '< 30 min', label: 'Average response time' },
              { stat: '24/7', label: 'Always available' },
              { stat: 'Flat Rate', label: 'No surprise charges' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-4xl font-black text-yellow-500 mb-2">{item.stat}</div>
                <div className="text-gray-600 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="px-6 py-16 max-w-xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-3">Request a Tow</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          For emergencies, call directly. For non-urgent requests, fill out the form below.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = PHONE_HREF;
          }}
          className="flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="Your name"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <input
            type="tel"
            placeholder="Your phone number"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <input
            type="text"
            placeholder="Your location / cross streets"
            required
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <textarea
            placeholder="What do you need help with?"
            rows={3}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          />
          <button
            type="submit"
            className="bg-yellow-400 text-gray-900 font-black py-4 rounded-xl hover:bg-yellow-300 transition-colors text-lg"
          >
            Send Request
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center px-6 py-8 text-sm">
        <p className="text-white font-bold mb-1">Emergency Towing Indianapolis</p>
        <p>Serving Indianapolis, IN and surrounding areas · 24/7</p>
        <a href={PHONE_HREF} className="text-yellow-400 font-semibold mt-2 inline-block hover:text-yellow-300">
          {PHONE}
        </a>
      </footer>
    </div>
  );
}
