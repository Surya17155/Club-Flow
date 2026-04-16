import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const PROGRAMMES = ["B.Tech (CS)", "B.Tech (IT)", "BBA", "MBA", "B.Com", "BA (Hons)", "BCA", "MCA"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    programme: "", section: "", year: "", rollNo: "", phone: "", classCoordinator: "",
  });

  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "login" || m === "signup") setMode(m);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4EFE7" }}>
        <div className="w-8 h-8 border-3 border-[#E98A3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const getRedirectPath = () => {
    const fromParam = searchParams.get("redirect");
    if (fromParam) return fromParam;
    const fromStorage = sessionStorage.getItem("pendingRedirect");
    if (fromStorage) return fromStorage;
    return "/dashboard";
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      const rp = getRedirectPath();
      sessionStorage.removeItem("pendingRedirect");
      navigate(rp, { replace: true });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(loginEmail);
      toast({ title: "Check your email", description: "Password reset link has been sent." });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.endsWith("@iilm.edu")) {
      toast({ title: "Invalid email", description: "Please use your @iilm.edu college email.", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName, programme: formData.programme,
        section: formData.section, year: formData.year,
        roll_no: formData.rollNo, phone: formData.phone,
        class_coordinator: formData.classCoordinator,
      });
      if (result?.user?.identities?.length === 0) {
        toast({ title: "Account already exists", description: 'Your account was pre-created by your club admin. Switch to Login and use "Forgot Password" to set your password.', variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Account created!", description: "Welcome to Attendly!" });
      const rp = searchParams.get("redirect");
      if (rp) sessionStorage.removeItem("pendingRedirect");
      navigate(rp || "/dashboard", { replace: true });
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("already registered")) {
        toast({ title: "Account already exists", description: 'An account with this email already exists. Use "Forgot Password" on the login side.', variant: "destructive" });
      } else {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectPath = getRedirectPath();
      if (redirectPath !== "/dashboard") sessionStorage.setItem("pendingRedirect", redirectPath);
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast({ title: "Google login failed", description: String(result.error), variant: "destructive" }); return; }
      if (result.redirected) return;
      toast({ title: "Welcome!", description: "Successfully logged in with Google." });
      const rp = getRedirectPath();
      sessionStorage.removeItem("pendingRedirect");
      navigate(rp, { replace: true });
    } catch (error: any) {
      toast({ title: "Google login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const inputStyle = "w-full bg-white border-2 border-[#111111] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#E98A3A] focus:ring-offset-1 placeholder:text-[#877366]";
  const labelStyle = "block text-xs font-black uppercase tracking-widest mb-1.5 text-[#111111]";
  const selectStyle = "w-full bg-white border-2 border-[#111111] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#E98A3A] appearance-none cursor-pointer";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ background: "#F4EFE7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .neo-brutal-shadow { box-shadow: 4px 4px 0px #111111; }
        h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <div className="w-full max-w-md md:max-w-lg relative z-10">
        {/* Back to home */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 font-['Space_Grotesk'] font-bold text-sm uppercase tracking-widest text-[#111111] hover:text-[#E98A3A] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Home
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#111111]">Club Flow</h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#544338" }}>Multi-Club Attendance System</p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-[#111111] neo-brutal-shadow overflow-hidden">
          {/* Toggle Tabs */}
          <div className="flex border-b-2 border-[#111111]">
            <button
              onClick={() => { setMode("login"); setIsForgotPassword(false); }}
              className={`flex-1 py-4 font-['Space_Grotesk'] font-black text-sm uppercase tracking-widest transition-colors ${
                mode === "login"
                  ? "bg-[#E98A3A] text-[#111111]"
                  : "bg-white text-[#111111] hover:bg-[#F6E1CF]"
              }`}
            >
              LOG IN
            </button>
            <button
              onClick={() => { setMode("signup"); setIsForgotPassword(false); }}
              className={`flex-1 py-4 font-['Space_Grotesk'] font-black text-sm uppercase tracking-widest border-l-2 border-[#111111] transition-colors ${
                mode === "signup"
                  ? "bg-[#E98A3A] text-[#111111]"
                  : "bg-white text-[#111111] hover:bg-[#F6E1CF]"
              }`}
            >
              SIGN UP
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* ===== LOGIN ===== */}
            {mode === "login" && (
              <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">
                  {isForgotPassword ? "Reset Password" : "Welcome Back"}
                </h2>
                <p className="text-sm mb-4" style={{ color: "#544338" }}>
                  {isForgotPassword ? "Enter your email to receive a reset link" : "Sign in to your account"}
                </p>

                <div>
                  <label className={labelStyle}>Email</label>
                  <input type="email" placeholder="you@iilm.edu" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className={inputStyle} />
                </div>

                {!isForgotPassword && (
                  <div>
                    <label className={labelStyle}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className={`${inputStyle} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#877366] hover:text-[#111111]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#E98A3A] text-[#111111] border-2 border-[#111111] py-4 font-['Space_Grotesk'] font-black text-sm uppercase tracking-widest neo-brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111111] transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin mx-auto" />
                  ) : isForgotPassword ? "SEND RESET LINK" : "SIGN IN"}
                </button>

                {!isForgotPassword && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t-2 border-[#111111]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 font-bold tracking-widest" style={{ color: "#544338" }}>or</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                      className="w-full bg-white text-[#111111] border-2 border-[#111111] py-4 font-['Space_Grotesk'] font-bold text-sm uppercase tracking-widest neo-brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111111] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                    >
                      {isGoogleLoading ? (
                        <div className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          CONTINUE WITH GOOGLE
                        </>
                      )}
                    </button>
                  </>
                )}

                <div className="text-center space-y-2 pt-2">
                  <button type="button" onClick={() => setIsForgotPassword(!isForgotPassword)} className="text-sm font-bold text-[#E98A3A] hover:underline uppercase tracking-wide">
                    {isForgotPassword ? "Back to login" : "Forgot password?"}
                  </button>
                </div>
              </form>
            )}

            {/* ===== SIGNUP ===== */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">Student Registration</h2>
                <p className="text-sm mb-4" style={{ color: "#544338" }}>Use your @iilm.edu email to register</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Full Name *</label>
                    <input placeholder="Enter your full name" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} required className={inputStyle} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelStyle}>College Email *</label>
                    <input type="email" placeholder="you@iilm.edu" value={formData.email} onChange={(e) => updateField("email", e.target.value)} required className={inputStyle} />
                  </div>

                  <div>
                    <label className={labelStyle}>Roll No. *</label>
                    <input placeholder="e.g., 2021CSE001" value={formData.rollNo} onChange={(e) => updateField("rollNo", e.target.value)} required className={inputStyle} />
                  </div>

                  <div>
                    <label className={labelStyle}>Phone *</label>
                    <input type="tel" placeholder="+91 XXXXXXXXXX" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} required className={inputStyle} />
                  </div>

                  <div>
                    <label className={labelStyle}>Programme *</label>
                    <select value={formData.programme} onChange={(e) => updateField("programme", e.target.value)} required className={selectStyle}>
                      <option value="">Select programme</option>
                      {PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelStyle}>Section *</label>
                    <input placeholder="e.g., A, B, C" value={formData.section} onChange={(e) => updateField("section", e.target.value)} required className={inputStyle} />
                  </div>

                  <div>
                    <label className={labelStyle}>Year *</label>
                    <select value={formData.year} onChange={(e) => updateField("year", e.target.value)} required className={selectStyle}>
                      <option value="">Select year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Class Coordinator *</label>
                    <input placeholder="Enter coordinator's name" value={formData.classCoordinator} onChange={(e) => updateField("classCoordinator", e.target.value)} required className={inputStyle} />
                  </div>

                  <div>
                    <label className={labelStyle}>Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                        className={`${inputStyle} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#877366] hover:text-[#111111]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}>Confirm Password *</label>
                    <input type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required className={inputStyle} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#E98A3A] text-[#111111] border-2 border-[#111111] py-4 font-['Space_Grotesk'] font-black text-sm uppercase tracking-widest neo-brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111111] transition-all disabled:opacity-60 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin mx-auto" />
                  ) : "CREATE ACCOUNT"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
