import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const PROGRAMMES = ['B.Tech (CS)', 'B.Tech (IT)', 'BBA', 'MBA', 'B.Com', 'BA (Hons)', 'BCA', 'MCA'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    programme: '',
    section: '',
    year: '',
    rollNo: '',
    rollNo: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate @iilm.edu email
    if (!formData.email.endsWith('@iilm.edu')) {
      toast({ title: 'Invalid email', description: 'Please use your @iilm.edu college email.', variant: 'destructive' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords don\'t match', description: 'Please make sure both passwords are the same.', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        programme: formData.programme,
        section: formData.section,
        year: formData.year,
        roll_no: formData.rollNo,
        phone: formData.phone,
      });
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-warm" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 -translate-x-1/4" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber/5 blur-3xl translate-y-1/2 translate-x-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10 my-8"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold shadow-gold mb-3">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Join IILM ClubSync</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your student account</p>
        </div>

        <Card className="shadow-elevated border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Student Registration</CardTitle>
            <CardDescription>Use your @iilm.edu email to register</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} required />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">College Email *</Label>
                  <Input id="email" type="email" placeholder="you@iilm.edu" value={formData.email} onChange={e => updateField('email', e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll No. / Admission No. *</Label>
                  <Input id="rollNo" placeholder="e.g., 2021CSE001" value={formData.rollNo} onChange={e => updateField('rollNo', e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="+91 XXXXXXXXXX" value={formData.phone} onChange={e => updateField('phone', e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Programme *</Label>
                  <Select value={formData.programme} onValueChange={v => updateField('programme', v)}>
                    <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
                    <SelectContent>
                      {PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Input id="section" placeholder="e.g., A, B, C" value={formData.section} onChange={e => updateField('section', e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select value={formData.year} onValueChange={v => updateField('year', v)}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Semester *</Label>
                  <Select value={formData.semester} onValueChange={v => updateField('semester', v)}>
                    <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map(s => <SelectItem key={s} value={s}>Semester {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={formData.password} onChange={e => updateField('password', e.target.value)} required className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input id="confirmPassword" type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} required />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
