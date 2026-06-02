import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router'
import { UserPlus, Award, Shield, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/auth/signup')({
  component: RouteComponent,
})

function RouteComponent() {

  const [ loading, setLoading ] = useState(false)
  const [ msg, setMsg ] = useState();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async(e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Handle signup logic here
    alert(JSON.stringify(formData));
    
    // const data:any = await authClient.signUp.email({
    //     name: formData.name,
    //     email: formData.email,
    //     phone: formData.phone,
    //     password: formData.password,
       
    // })

    const { data, error }: any = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
    });

    if (error) {
      console.error("Sign up failed:", error.message);
    } else {
      window.location.href = '/admin';
    }

  };

  const handleGoogleSignUp = async(e: any) => {
    e.preventDefault();
    
    await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
        newUserCallbackURL: "/welcome",  // Newly registered users go here instead
        // Called if the sign-in process fails
        onError: (ctx: any) => {
            setLoading(false);
            console.error("Sign in failed:", ctx.error.message);
            alert(`Login error: ${ctx.error.message}`);
        },
        // Optional: Called before the request starts
        onRequest: () => {
            setLoading(true);
            console.log("Redirecting to Google...");
        }
    } as any);
  };

  return (
    <main className="relative">
    <div className="min-h-screen bg-[#0a192a]/50 text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side: Marketing Info */}
            <div>
              <div className="flex items-center gap-3 mb-6"></div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight text-left font-sans">
                Join Heravote Today
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 mb-8 text-left max-w-lg">
                  Create your corporate account to launch secure organizational elections, manage events pipelines, and deliver fully auditable, transparent voting experiences.
              </p>

              <div className="grid grid-cols-1 gap-4 mb-8">
                {/* Easy Registration */}
                <div className="rounded-3xl bg-[#6d28d9]/8 p-6 flex items-center gap-4">
                  <UserPlus className="w-8 h-8 text-purple-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Corporate Governance</h3>
                    <p className="text-sm text-zinc-300">Register your corporate profile to streamline shareholder voting, securely nominate board members, and ensure fully auditable election results.</p>
                  </div>
                </div>

                {/* Multiple Roles */}
                <div className="rounded-3xl bg-[#f59e42]/8 p-6 flex items-center gap-4">
                  <Award className="w-8 h-8 text-orange-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Professional Associations</h3>
                    <p className="text-sm text-zinc-300">Create your organization's account to manage member voting, handle call-for-nominations seamlessly, and drive engagement in your next election.</p>
                  </div>
                </div>

                {/* Secure Platform */}
                <div className="rounded-3xl bg-[#6d28d9]/8 p-6 flex items-center gap-4">
                  <Shield className="w-8 h-8 text-purple-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Event Organizers:</h3>
                    <p className="text-sm text-zinc-300">Sign up today to power live event polling, manage award nominations, and deliver real-time, transparent voting experiences for your members.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Sign-Up Form Container */}
            <div>
              <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-white mb-2 font-sans">
                    Create Account
                  </h2>
                  <p className="text-zinc-300">Join our premium voting platform</p>
                </div>

                {/* Google Action */}
                <div className="mb-6">
                  <button 
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full px-4 py-3 bg-white text-black rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"></path>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1d1d26] text-zinc-400 rounded">or</span>
                  </div>
                </div>

                {/* Form fields */}
                <form onSubmit={(e) => handleSubmit(e)} onChange={handleInputChange} className="space-y-6">
                  {/* Full Name Field */}
                  <div className="relative group">
                    <input 
                      required 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                      placeholder="Full Name" 
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                  </div>

                  {/* Email Field */}
                  <div className="relative group">
                    <input 
                      required 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                      placeholder="Email Address" 
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                  </div>

                  {/* Phone Number Field */}
                  <div className="relative group">
                    <input 
                      required 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                      placeholder="Phone Number" 
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                  </div>

                  {/* Password Field */}
                  <div className="relative group">
                    <input 
                      required 
                      type="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                      placeholder="Password" 
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                  </div>

                  {/* Confirm Password Field */}
                  <div className="relative group">
                    <input 
                      required 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                      placeholder="Confirm Password" 
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                  </div>

                  {/* Submit Registration */}
                  <div>
                    <button 
                      type="submit" 
                      className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium shadow-lg"
                    >
                      Create Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>

                {/* Sign In Link */}
                <p className="text-center text-sm text-zinc-400 mt-6">
                  Already have an account?{' '}
                  <a className="text-purple-400 hover:text-purple-300 transition-colors font-medium" href="/auth/signin">
                    Sign in
                  </a>
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  </main>
  )
}
