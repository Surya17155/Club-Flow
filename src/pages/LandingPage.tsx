import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthenticatedHomePath } from "@/lib/superAdminMode";
import heroIllustration from "@/assets/hero-illustration.png";
import heroIllustrationDesktop from "@/assets/hero-illustration-desktop.png";

type PageName = "home" | "pricing" | "about" | "contact";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<PageName>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  if (!loading && user) return <Navigate to={getAuthenticatedHomePath(user.email)} replace />;
  // While auth is still resolving but a persisted token exists, render a neutral
  // background instead of the full landing markup to avoid a flash + unmount.
  if (loading && typeof window !== 'undefined') {
    const hasToken = (() => {
      try {
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const k = window.localStorage.key(i);
          if (k?.startsWith('sb-') && k.endsWith('-auth-token')) return true;
        }
      } catch {}
      return false;
    })();
    if (hasToken) return <div style={{ minHeight: '100vh', background: '#F4EFE7' }} />;
  }


  const navLink = (page: PageName, label: string) => (
    <button
      onClick={() => setActivePage(page)}
      className={`font-['Space_Grotesk'] font-bold tracking-tighter uppercase hover:-translate-y-0.5 transition-transform duration-100 ${
        activePage === page
          ? "text-[#E98A3A] border-b-2 border-[#E98A3A] pb-1"
          : "text-[#111111] hover:text-[#E98A3A]"
      }`}
    >
      {label}
    </button>
  );

  const mobileNavLink = (page: PageName, label: string) => (
    <button
      onClick={() => { setActivePage(page); setMobileMenuOpen(false); }}
      className={`text-lg font-['Space_Grotesk'] font-bold uppercase text-left ${
        activePage === page ? "text-[#E98A3A]" : "text-[#111111] hover:text-[#E98A3A]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen scroll-smooth" style={{ background: "#F4EFE7", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#111111" }}>
      <style>{`
        .neo-brutal-shadow { box-shadow: 4px 4px 0px #111111; }
        .neo-brutal-shadow-hover:hover { box-shadow: 6px 6px 0px #111111; transform: translate(-2px, -2px); }
        .neo-shadow { box-shadow: 4px 4px 0px #111111; }
        .neo-shadow-hover:hover { box-shadow: 6px 6px 0px #111111; transform: translate(-2px, -2px); }
        .journey-line { background-image: repeating-linear-gradient(0deg, #111111, #111111 10px, transparent 10px, transparent 20px); width: 2px; }
        .animate-marquee { display: flex; width: max-content; animation: marquee 18s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (max-width: 768px) { .animate-marquee { animation-duration: 14s; } }
        h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="border-b-2 border-[#111111] w-full px-6 py-4 sticky top-0 z-50" style={{ background: "#F4EFE7" }}>
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-black text-[#111111] tracking-tighter uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Club Flow</div>
          <nav className="hidden md:flex gap-8 items-center">
            {navLink("home", "HOME")}
            {navLink("pricing", "PRICING")}
            {navLink("about", "ABOUT")}
            <button
              onClick={() => navigate('/contact')}
              className={`font-['Space_Grotesk'] font-bold tracking-tighter uppercase hover:-translate-y-0.5 transition-transform duration-100 text-[#111111] hover:text-[#E98A3A]`}
            >
              CONTACT US
            </button>
          </nav>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate("/auth?mode=login")}
              className="hidden md:block font-['Space_Grotesk'] font-bold text-sm tracking-widest uppercase py-2 px-4 hover:text-[#E98A3A] transition-colors"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="hidden md:block bg-[#E98A3A] text-[#111111] border-2 border-[#111111] font-['Space_Grotesk'] font-bold text-sm tracking-widest uppercase py-2 px-6 neo-brutal-shadow neo-brutal-shadow-hover transition-all"
            >
              GET STARTED
            </button>
            <button
              className="md:hidden text-[#111111] text-2xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`fixed right-0 top-0 w-full h-screen flex flex-col pt-20 border-l-2 border-[#111111] transition-transform duration-300 z-40 ${
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ background: "#F4EFE7" }}
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <button
                className="relative -top-6 self-start w-12 h-12 bg-white text-[#111111] border-2 border-[#111111] neo-brutal-shadow flex items-center justify-center hover:bg-[#E98A3A] hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              {mobileNavLink("home", "Home")}
              {mobileNavLink("pricing", "Pricing")}
              {mobileNavLink("about", "About")}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/contact'); }}
                className="text-lg font-['Space_Grotesk'] font-bold uppercase text-left text-[#111111] hover:text-[#E98A3A]"
              >
                Contact Us
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/auth?mode=login"); }}
                className="font-['Space_Grotesk'] font-bold text-sm tracking-widest uppercase py-3 px-6 border-2 border-[#111111] neo-brutal-shadow mt-2 text-left"
              >
                LOG IN
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/auth?mode=signup"); }}
                className="bg-[#E98A3A] text-[#111111] border-2 border-[#111111] font-['Space_Grotesk'] font-bold text-sm tracking-widest uppercase py-3 px-6 neo-brutal-shadow neo-brutal-shadow-hover transition-all"
              >
                GET STARTED
              </button>
            </div>
          </div>
        </div>
      </header>

      <main ref={mainRef}>
        {/* ===== HOME PAGE ===== */}
        {activePage === "home" && (
          <div>
            {/* Hero */}
            <section className="max-w-screen-2xl mx-auto px-6 pt-4 pb-4 md:pt-8 md:pb-12 lg:pt-12 lg:pb-16 min-h-[calc(100svh-64px)] md:min-h-auto md:h-[calc(100vh-64px)] flex flex-col justify-start md:justify-center relative overflow-hidden">
              {/* Hero illustration - mobile only */}
              <div className="flex justify-center md:hidden mb-2">
                <img src={heroIllustration} alt="Student scanning QR code for attendance" className="w-44 h-auto" />
              </div>

              {/* Desktop illustration - right aligned */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: '28%', maxWidth: '420px' }}>
                <img
                  src={heroIllustrationDesktop}
                  alt="Student scanning QR code"
                  className="w-full h-auto object-contain object-right"
                />
              </div>

              <div className="space-y-1 text-center md:text-left flex-1 md:flex-none flex flex-col md:block justify-center relative z-10 md:max-w-[55%]">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-semibold leading-[0.85] tracking-tighter uppercase text-[#111111]">
                  ATTENDANCE IN SECONDS<br /><span className="text-[#E98A3A]">NOT MINUTES</span>
                </h1>
                <p className="text-base md:text-xl text-[#2A2A2A] font-medium max-w-xl leading-relaxed mx-auto md:mx-0 pt-2">
                  Replace manual attendance with one simple scan.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="bg-[#E98A3A] text-[#111111] border-2 border-[#111111] text-sm md:text-xl font-['Space_Grotesk'] font-black tracking-widest uppercase py-3 px-4 md:py-6 md:px-10 neo-brutal-shadow neo-brutal-shadow-hover transition-all inline-flex w-full md:w-auto items-center justify-center md:justify-start gap-4 whitespace-nowrap"
                  >
                    <span>GET STARTED / JOIN THE CLUB</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </button>
                </div>
                <div className="flex items-center gap-6 pt-6 md:pt-4">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#2A2A2A]">
                    Run Your Club Like a System, Not a Spreadsheet.
                  </p>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="border-y-4 border-[#111111] py-24" style={{ background: "#F6E1CF" }}>
              <div className="max-w-screen-2xl mx-auto px-6">
                <div className="mb-16 flex flex-col items-center md:flex-row md:justify-between md:items-end gap-6">
                  <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-[0.8] text-center md:text-left">
                    <span className="text-[#934B00]">ALL IN ONE</span>
                  </h1>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { icon: "qr_code", title: "Seamless Attendance", desc: "Generate dynamic QR codes for every event. Students scan, and you're done. No paper, no errors, no excuses.", module: "01", bg: "#F6E1CF" },
                    { icon: "groups", title: "Club Management", desc: "Centralize member directories, member roles, and event calendars. Keep your entire club in sync.", module: "02", bg: "#E98A3A", lift: true },
                    { icon: "bar_chart", title: "Real-time Analytics", desc: "Track growth trends and attendance rates over time. Export data in one click.", module: "03", bg: "#F6E1CF" },
                  ].map((f) => (
                    <div key={f.module} className={`bg-white border-2 border-[#111111] p-10 rounded-xl neo-brutal-shadow neo-brutal-shadow-hover transition-all flex flex-col gap-6 ${f.lift ? "transform md:-translate-y-4" : ""}`}>
                      <div className="w-16 h-16 border-2 border-[#111111] flex items-center justify-center" style={{ background: f.bg }}>
                        <span className="material-symbols-outlined text-4xl text-[#111111]">{f.icon}</span>
                      </div>
                      <h3 className="text-3xl font-bold uppercase tracking-tight">{f.title}</h3>
                      <p className="text-[#2A2A2A] font-medium leading-relaxed">{f.desc}</p>
                      <div className="mt-auto pt-6 border-t-2 border-[#111111] flex items-center justify-between">
                        <span className="font-black text-xs uppercase tracking-widest">MODULE {f.module}</span>
                        <span className="material-symbols-outlined">add</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Marquee */}
            <section className="bg-[#111111] py-8 overflow-hidden border-b-2 border-[#111111]">
              <div className="animate-marquee flex whitespace-nowrap items-center">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-12 items-center pr-12">
                    {["FAST", "SIMPLE", "STUDENT-FIRST", "ACCURATE"].map((word) => (
                      <span key={word + i} className="contents">
                        <span className="text-[#F4EFE7] font-['Space_Grotesk'] font-black text-4xl uppercase tracking-tighter italic">{word}</span>
                        <span className="material-symbols-outlined text-4xl text-[#E98A3A]">star</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="max-w-screen-2xl mx-auto px-6 py-24 text-center">
              <div className="bg-[#E98A3A] border-4 border-[#111111] p-12 md:p-24 neo-brutal-shadow">
                <h2 className="text-4xl md:text-5xl lg:text-8xl font-black uppercase tracking-tighter text-[#111111] mb-8">START WITH<br />CLUB FLOW</h2>
                <p className="text-base md:text-3xl font-bold uppercase tracking-tight text-[#111111] mb-12 max-w-2xl mx-auto">
                  Generate a QR. Let the system handle the rest.
                </p>
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center">
                  <button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="bg-[#111111] text-[#F4EFE7] font-['Space_Grotesk'] font-black tracking-widest uppercase text-sm md:text-base py-4 px-10 md:py-6 md:px-12 w-full md:w-auto border-2 border-[#111111] hover:-translate-y-1 transition-transform whitespace-nowrap"
                  >
                    JOIN THE CLUB
                  </button>
                  <button
                    onClick={() => navigate("/contact")}
                    className="bg-white text-[#111111] font-['Space_Grotesk'] font-black tracking-widest uppercase text-sm md:text-base py-4 px-10 md:py-6 md:px-12 w-full md:w-auto border-2 border-[#111111] neo-brutal-shadow hover:-translate-y-1 transition-transform whitespace-nowrap"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t-2 border-[#111111] w-full py-12 px-6" style={{ background: "#F4EFE7" }}>
              <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="text-lg font-bold text-[#111111] uppercase tracking-tighter font-['Space_Grotesk']">Club Flow</div>
                  <p className="text-sm font-medium uppercase tracking-widest text-[#2A2A2A] text-center md:text-left">© 2026 Club Flow. BUILT FOR THE STUDENTS.</p>
                </div>
                <nav className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm font-medium uppercase tracking-widest">
                  <a className="text-[#2A2A2A] hover:text-[#E98A3A] transition-colors" href="#">Privacy Policy</a>
                  <a className="text-[#2A2A2A] hover:text-[#E98A3A] transition-colors" href="#">Terms of Service</a>
                  <a className="text-[#2A2A2A] hover:text-[#E98A3A] transition-colors" href="#">Github</a>
                  <a className="text-[#2A2A2A] hover:text-[#E98A3A] transition-colors" href="#">Documentation</a>
                </nav>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white border-2 border-[#111111] flex items-center justify-center neo-brutal-shadow cursor-pointer hover:bg-[#E98A3A] transition-colors">
                    <span className="material-symbols-outlined text-xl">share</span>
                  </div>
                  <div
                    className="w-10 h-10 bg-white border-2 border-[#111111] flex items-center justify-center neo-brutal-shadow cursor-pointer hover:bg-[#E98A3A] transition-colors"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  >
                    <span className="material-symbols-outlined text-xl">arrow_upward</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* ===== PRICING PAGE ===== */}
        {activePage === "pricing" && (
          <div>
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
              <div className="text-center mb-20 space-y-6">
                <h1 className="font-bold text-4xl md:text-7xl leading-tight tracking-tighter uppercase max-w-4xl mx-auto">CHILL OUT, THE APP IS ACTUALLY FREE</h1>
                <p className="text-xl md:text-2xl max-w-2xl mx-auto" style={{ color: "#544338" }}>It's ₹0. Forever. We're just here for you.</p>
              </div>

              {/* Free plan card */}
              <div className="max-w-2xl mx-auto mb-24">
                <div className="bg-white border-2 border-[#111111] rounded-lg neo-shadow p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#E98A3A] border-l-2 border-b-2 border-[#111111] px-4 py-2 font-['Space_Grotesk'] font-bold uppercase tracking-widest text-xs">BEST VALUE</div>
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold uppercase mb-2">THE FREE PLAN</h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter">₹0</span>
                      <span className="text-xl" style={{ color: "#544338" }}>for everyone</span>
                    </div>
                  </div>
                  <div className="space-y-6 mb-12">
                    {["Unlimited club drama", "AI Agent access", "Keep Attendance history", "No credit card required"].map((item) => (
                      <div key={item} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#E98A3A] border-2 border-[#111111] flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold">check</span>
                        </div>
                        <span className="text-lg font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="w-full bg-[#E98A3A] border-2 border-[#111111] py-5 font-['Space_Grotesk'] font-black text-2xl uppercase tracking-tighter neo-shadow neo-shadow-hover transition-all"
                  >
                    START FOR FREE
                  </button>
                  <p className="text-center mt-6 text-sm italic" style={{ color: "#544338" }}>*No Terms & Conditions apply</p>
                </div>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                <div className="border-2 border-[#111111] rounded-lg p-6 neo-shadow" style={{ background: "#f4dfcd" }}>
                  <span className="material-symbols-outlined text-4xl mb-4 block">history_edu</span>
                  <h3 className="font-bold text-xl uppercase mb-2">Manual Attendance (RIP)</h3>
                  <p className="text-sm">Generate a QR. Students scan. Nothing manual. Everything is Automated</p>
                </div>
                <div className="bg-white border-2 border-[#111111] rounded-lg p-6 neo-shadow">
                  <span className="material-symbols-outlined text-4xl mb-4 block">bolt</span>
                  <h3 className="font-bold text-xl uppercase mb-2">ishowspeed</h3>
                  <p className="text-sm">Marking attendance takes just <b>1 second</b>. Way much faster than manual, isn't it?</p>
                </div>
                <div className="bg-[#E98A3A] border-2 border-[#111111] rounded-lg p-6 neo-shadow">
                  <span className="material-symbols-outlined text-4xl mb-4 block">verified</span>
                  <h3 className="font-bold text-xl uppercase mb-2">No Guessing</h3>
                  <p className="text-sm">Every scan is recorded. No missing names, no confusion later.</p>
                </div>
              </div>

              {/* Enterprise */}
              <div className="border-4 border-[#111111] rounded-lg p-12 bg-white flex flex-col md:flex-row items-center justify-between gap-8 neo-shadow">
                <div className="max-w-xl text-center md:text-left">
                  <h2 className="font-black text-3xl uppercase mb-4 tracking-tighter">Enterprise Plan</h2>
                  <p className="text-xl italic" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>For Clubs with too much budget: Please just buy me a pizza instead.</p>
                </div>
                <button onClick={() => navigate('/contact')} className="border-2 border-[#111111] px-8 py-4 font-bold uppercase neo-shadow neo-shadow-hover transition-all">Contact US</button>
              </div>
            </div>

            {/* Pricing Footer */}
            <footer className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full gap-4 bg-[#111111] border-t-2 border-[#111111]">
              <div className="text-lg font-black text-[#E98A3A]">CLUB FLOW</div>
              <div className="flex gap-8 font-['Space_Grotesk'] uppercase text-xs tracking-widest text-[#F4EFE7]">
                <a className="hover:text-[#E98A3A] transition-colors" href="#">Privacy Policy</a>
                <a className="hover:text-[#E98A3A] transition-colors" href="#">Terms of Service</a>
                <a className="hover:text-[#E98A3A] transition-colors" href="#">Campus Ethics</a>
              </div>
              <div className="font-['Space_Grotesk'] uppercase text-xs tracking-widest text-[#F4EFE7]">© 2026  Club Flow. NO REGRETS.</div>
            </footer>
          </div>
        )}

        {/* ===== ABOUT PAGE ===== */}
        {activePage === "about" && (
          <div>
            {/* Hero */}
            <section className="mb-32 pt-16">
              <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase">
                    Managing<br /><span className="text-[#E98A3A]">CLUBS</span>
                  </h1>
                  <p className="text-xl md:text-2xl font-medium max-w-xl" style={{ color: "#544338" }}>
                    Manage attendance, members, and events without spreadsheets or manual work.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button className="bg-[#E98A3A] text-[#111111] text-lg font-bold px-8 py-4 border-2 border-[#111111] neo-brutal-shadow neo-brutal-shadow-hover font-['Space_Grotesk'] uppercase tracking-tight">
                      Features
                    </button>
                    <button className="bg-white text-[#111111] text-lg font-bold px-8 py-4 border-2 border-[#111111] neo-brutal-shadow neo-brutal-shadow-hover font-['Space_Grotesk'] uppercase tracking-tight">
                      View Documentation
                    </button>
                  </div>
                </div>
                {/* Hub Diagram */}
                <div className="relative flex justify-center items-center">
                  <div className="w-full max-w-lg aspect-square relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 md:w-32 md:h-32 bg-[#E98A3A] border-4 border-[#111111] rounded-full flex items-center justify-center neo-brutal-shadow z-10">
                      <span className="material-symbols-outlined text-4xl md:text-5xl text-white">hub</span>
                    </div>
                    {[
                      { pos: "top-0 left-1/2 -translate-x-1/2", icon: "groups", label: "Clubs" },
                      { pos: "bottom-0 left-1/2 -translate-x-1/2", icon: "bar_chart", label: "Data" },
                      { pos: "left-0 top-1/2 -translate-y-1/2", icon: "qr_code", label: "Access" },
                      { pos: "right-0 top-1/2 -translate-y-1/2", icon: "auto_awesome", label: "AI Magic" },
                    ].map((n) => (
                      <div key={n.label} className={`absolute ${n.pos} flex flex-col items-center`}>
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-2 border-[#111111] flex items-center justify-center neo-brutal-shadow">
                          <span className="material-symbols-outlined text-3xl md:text-4xl text-[#E98A3A]">{n.icon}</span>
                        </div>
                        <span className="mt-2 font-['Space_Grotesk'] font-black text-[10px] md:text-xs uppercase">{n.label}</span>
                      </div>
                    ))}
                    <svg className="hidden md:block absolute inset-0 w-full h-full -z-0 opacity-20" viewBox="0 0 400 400">
                      <line stroke="#111111" strokeDasharray="8 8" strokeWidth="4" x1="200" x2="200" y1="200" y2="50" />
                      <line stroke="#111111" strokeDasharray="8 8" strokeWidth="4" x1="200" x2="200" y1="200" y2="350" />
                      <line stroke="#111111" strokeDasharray="8 8" strokeWidth="4" x1="200" x2="50" y1="200" y2="200" />
                      <line stroke="#111111" strokeDasharray="8 8" strokeWidth="4" x1="200" x2="350" y1="200" y2="200" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile: How It Works */}
            <section className="mb-32 block md:hidden px-4 sm:px-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-4xl font-black uppercase mb-12 tracking-tighter flex items-center gap-4">
                  <span className="bg-[#111111] text-white px-4 py-1">THE FLOW</span>
                  <span>HOW IT WORKS</span>
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { num: "01", icon: "event_available", title: "Create Event", desc: "Club presidents enter key event details: Name, Category, and Target Audience. One tap and the system generates a high-definition, unique QR code instantly." },
                    { num: "02", icon: "qr_code_scanner", title: "Instant Attendance", desc: "Students scan the QR code. The system automatically fetches their student ID and metadata, recording their participation in milliseconds without manual data entry." },
                    { num: "03", icon: "file_download", title: "Manage & Export", desc: "Admins view live attendee lists in real-time. Need a report for the faculty? Export beautifully formatted CSV or Excel data with a single click." },
                  ].map((s) => (
                    <div key={s.num} className="bg-white border-2 border-[#111111] p-6 sm:p-8 neo-brutal-shadow neo-brutal-shadow-hover">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <span className="text-4xl sm:text-5xl font-black text-[#E98A3A]">{s.num}</span>
                        <div className="bg-[#F6E1CF] border-2 border-[#111111] p-3">
                          <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold uppercase mb-4">{s.title}</h3>
                      <p className="font-medium leading-relaxed text-sm sm:text-base" style={{ color: "#544338" }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Desktop: The Journey */}
            <section className="mb-32 relative hidden md:block">
              <div className="text-center mb-24">
                <h2 className="text-5xl font-black uppercase tracking-tighter inline-block border-b-8 border-[#E98A3A] pb-2">THE JOURNEY</h2>
              </div>
              <div className="max-w-4xl mx-auto space-y-24 relative">
                <div className="absolute left-1/2 top-0 bottom-0 journey-line -translate-x-1/2 hidden md:block" />
                {[
                  { num: "01", icon: "add_task", title: "Create Event", desc: "Club presidents enter event details: Name, Category, and Target Audience. Our system crafts a unique QR code in an instant.", align: "right" },
                  { num: "02", icon: "qr_code_2", title: "Instant Check-in", desc: "Students scan, and they're in. The app automatically captures student ID and participation data in milliseconds.", align: "left" },
                  { num: "03", icon: "analytics", title: "Manage & Export", desc: "Monitor live data as it happens. Generate professional attendance reports and export them as CSV/Excel with one click.", align: "right" },
                ].map((s, i) => (
                  <div key={s.num} className={`relative flex flex-col ${s.align === "left" ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 group`}>
                    <div className={`md:w-1/2 ${s.align === "left" ? "md:pl-12 text-center md:text-left" : "md:pr-12 text-center md:text-right"}`}>
                      <div className="inline-block p-6 bg-white border-2 border-[#111111] neo-brutal-shadow mb-6">
                        <span className="material-symbols-outlined text-6xl text-[#E98A3A]">{s.icon}</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase mb-4">{s.num}. {s.title}</h3>
                      <p className="text-lg font-medium leading-relaxed" style={{ color: "#544338" }}>{s.desc}</p>
                    </div>
                    <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 ${i % 2 === 0 ? "bg-[#111111]" : "bg-[#E98A3A]"} border-4 border-[#F4EFE7] rounded-full z-10`} />
                    <div className="md:w-1/2" />
                  </div>
                ))}
              </div>
            </section>

            {/* AI Agent Section */}
            <section className="mb-32">
              <div className="px-4 sm:px-6 lg:px-4 xl:px-6">
                <div className="mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-3rem)] lg:max-w-[calc(100%-5rem)] xl:max-w-[calc(100%-7rem)] border-4 border-[#111111] neo-brutal-shadow overflow-hidden" style={{ background: "#F4EFE7" }}>
                  <div className="bg-[#111111] text-white px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-4 font-['Space_Grotesk'] uppercase text-sm font-bold tracking-widest">AI Command Center V2.0</span>
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-xs bg-[#E98A3A] text-black px-2 py-0.5">ONLINE</span>
                  </div>
                  <div className="p-8 md:p-12">
                    <div className="grid lg:grid-cols-12 gap-12 min-w-0">
                      <div className="lg:col-span-7 space-y-10 min-w-0">
                        <div>
                          <h2 className="text-5xl md:text-6xl font-black uppercase leading-none mb-6">
                            Meet Your <span className="text-[#E98A3A]">AI AGENT</span>
                          </h2>
                          <p className="text-xl font-medium max-w-xl" style={{ color: "#544338" }}>
                            Our AI Agent acts as your club's personal digital strategist, managing your member base and extracting insights effortlessly.
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                          {[
                            { icon: "forum", title: "Talk to Data", desc: "Natural language queries for instant reports." },
                            { icon: "upload_file", title: "Bulk Processing", desc: "Add 1000s of members by dragging a file." },
                            { icon: "vpn_key", title: "Smart Delegation", desc: "Grant access to specific team members." },
                            { icon: "bolt", title: "Instant Fetch", desc: "No searching, just asking and receiving." },
                          ].map((f) => (
                            <div key={f.title} className="bg-white p-6 border-2 border-[#111111] neo-brutal-shadow min-w-0">
                              <span className="material-symbols-outlined text-[#E98A3A] text-3xl mb-3 block">{f.icon}</span>
                              <h4 className="font-black uppercase text-lg mb-1">{f.title}</h4>
                              <p className="text-sm opacity-70">{f.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Chat Preview */}
                      <div className="lg:col-span-5 min-w-0">
                        <div className="bg-white border-2 border-[#111111] neo-brutal-shadow h-full flex flex-col min-w-0">
                          <div className="p-4 border-b-2 border-[#111111] flex items-center gap-4" style={{ background: "#F6E1CF" }}>
                            <div className="w-10 h-10 bg-[#E98A3A] border-2 border-[#111111] flex items-center justify-center">
                              <span className="material-symbols-outlined text-white">smart_toy</span>
                            </div>
                            <div>
                              <div className="font-black font-['Space_Grotesk'] text-sm uppercase">CLUB FLOW</div>
                              <div className="text-[10px] uppercase font-bold text-[#E98A3A]">Your AI assistant</div>
                            </div>
                          </div>
                          <div className="p-6 space-y-6 flex-grow overflow-y-auto min-h-0 text-sm">
                            <div className="flex flex-col items-end min-w-0">
                              <div className="bg-[#111111] text-white p-3 border-2 border-[#111111] rounded-tl-xl rounded-tr-xl rounded-bl-xl max-w-full sm:max-w-[85%] break-words">
                                How many students attended the AI workshop in our last event?
                              </div>
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <div className="bg-white p-3 border-2 border-[#111111] rounded-tr-xl rounded-tl-xl rounded-br-xl max-w-full sm:max-w-[85%] neo-brutal-shadow break-words">
                                Scanning archives... <br />
                                <span className="font-bold text-[#E98A3A]">69 students</span> attended. Attendance was 7% higher than the previous event.
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border-t-2 border-[#111111] bg-white">
                            <div className="flex items-center gap-2 border-2 border-[#111111] rounded-full px-3 py-2 min-w-0">
                              <span className="material-symbols-outlined text-2xl text-[#111111]">attach_file</span>
                              <input type="text" placeholder="Ask Assistant" className="flex-1 min-w-0 bg-transparent outline-none border-none text-xs sm:text-sm text-center sm:text-left" readOnly />
                              <button className="bg-[#E98A3A] text-[#111111] text-sm font-bold w-10 h-10 rounded-full border-2 border-[#111111] neo-brutal-shadow uppercase flex items-center justify-center">
                                <span className="material-symbols-outlined text-base">north_east</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Ready to Change CTA */}
            <section className="mb-32">
              <div className="px-4 sm:px-6 lg:px-0">
                <div className="mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-3rem)] lg:max-w-none text-center py-10 md:py-24 bg-[#E98A3A] border-4 border-[#111111] neo-brutal-shadow">
                  <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase mb-6 md:mb-8 text-white">Ready to Change?</h2>
                  <p className="text-base sm:text-lg md:text-2xl font-bold mb-8 md:mb-12 max-w-xl md:max-w-2xl mx-auto text-[#111111]">
                    The easier way to manage your club starts here.
                  </p>
                  <button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="bg-[#111111] text-white text-base sm:text-lg md:text-3xl font-black px-6 sm:px-10 md:px-12 py-3 sm:py-4 md:py-8 border-2 border-[#111111] neo-brutal-shadow neo-brutal-shadow-hover font-['Space_Grotesk'] uppercase tracking-tight active:scale-95 transition-transform w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[24rem] mx-auto"
                  >
                    Get Started Now
                  </button>
                </div>
              </div>
            </section>

            {/* About Footer */}
            <footer className="bg-[#111111] text-[#E98A3A] font-['Space_Grotesk'] text-sm uppercase tracking-widest flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full mt-auto border-t-4 border-[#E98A3A]">
              <div className="text-2xl font-black text-white mb-8 md:mb-0">CLUB FLOW</div>
              <div className="flex flex-wrap justify-center gap-8 mb-8 md:mb-0">
                <a className="text-white hover:text-[#E98A3A] transition-colors underline decoration-2 underline-offset-4" href="#">Mission</a>
                <a className="text-white hover:text-[#E98A3A] transition-colors underline decoration-2 underline-offset-4" href="#">Security</a>
                <a className="text-white hover:text-[#E98A3A] transition-colors underline decoration-2 underline-offset-4" href="#">Privacy</a>
                <a className="text-white hover:text-[#E98A3A] transition-colors underline decoration-2 underline-offset-4" href="#">Support</a>
                <a className="text-white hover:text-[#E98A3A] transition-colors underline decoration-2 underline-offset-4 cursor-pointer" onClick={() => navigate('/contact')}>Contact Us</a>
              </div>
              <div className="text-white/50 text-[10px] text-center md:text-right">
                © 2026 Club Flow.<br />ALL RIGHTS RESERVED.
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
