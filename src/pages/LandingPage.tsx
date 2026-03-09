import { useNavigate } from "react-router-dom";
import { ArrowUpRight, QrCode, Shield, Brain } from "lucide-react";
import { motion } from "framer-motion";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const features = [
  {
    icon: QrCode,
    title: "Seamless Attendance",
    desc: "QR code based tracking for effortless check-ins.",
  },
  {
    icon: Shield,
    title: "Club Identity",
    desc: "Dedicated dashboards for clubs and members to build community.",
  },
  {
    icon: Brain,
    title: "AI Insights",
    desc: "Automated feedback summaries and performance metrics.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(40,33%,96%)]">
      {/* Animated golden glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-[hsl(36,72%,48%,0.18)] blur-[100px]" />
        <div className="animate-blob animation-delay-2000 absolute top-1/4 right-0 h-[500px] w-[500px] rounded-full bg-[hsl(30,85%,55%,0.15)] blur-[100px]" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-[hsl(45,90%,60%,0.12)] blur-[100px]" />
        <div className="animate-blob absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[hsl(36,72%,48%,0.14)] blur-[80px]" />
        {/* Sparkle / light streaks */}
        <div className="absolute top-[20%] left-[15%] h-1 w-24 rotate-45 rounded-full bg-gradient-to-r from-transparent via-[hsl(36,80%,60%,0.5)] to-transparent animate-pulse" />
        <div className="absolute top-[35%] right-[20%] h-1 w-32 -rotate-12 rounded-full bg-gradient-to-r from-transparent via-[hsl(40,90%,65%,0.4)] to-transparent animate-pulse animation-delay-2000" />
        <div className="absolute bottom-[40%] left-[40%] h-1 w-20 rotate-[30deg] rounded-full bg-gradient-to-r from-transparent via-[hsl(36,80%,55%,0.45)] to-transparent animate-pulse animation-delay-4000" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(36,72%,48%)] to-[hsl(30,85%,55%)]">
            <span className="font-display text-sm font-bold text-white">CS</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">ClubSync</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="glass-card cursor-pointer rounded-2xl px-6 py-3 font-display text-sm font-semibold text-primary transition-all hover:shadow-gold"
        >
          Contact Support
        </button>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Empower Your
          <br />
          College Clubs
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          The ultimate platform for attendance tracking, event management, and member growth.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10"
        >
          <button
            onClick={() => navigate("/login")}
            className="glass-card group inline-flex items-center gap-3 rounded-2xl px-8 py-4 font-display text-lg font-semibold text-foreground shadow-gold transition-all hover:scale-105 hover:shadow-elevated"
          >
            Get Started / Sign In
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-[hsl(36,72%,48%,0.15)] to-transparent blur-2xl" />
          <img
            src={dashboardMockup}
            alt="ClubSync Dashboard Preview"
            className="w-full drop-shadow-2xl"
            loading="lazy"
          />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + i * 0.15 }}
              className="glass-card flex items-start gap-4 rounded-3xl p-6 text-left"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-light))] to-[hsl(var(--amber-light))]">
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
