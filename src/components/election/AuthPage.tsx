import { useState } from 'react';
import { Shield, Users, ThumbsUp, Mail, Lock, ArrowRight, LoaderCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { authClient } from '#/lib/auth-client';

export default function AuthPage({ error }: any) {

  const navigate = useNavigate();
  const [ loading, setLoading ] = useState(false)
  const [ msg, setMsg ] = useState(error);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (e:any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true)

    try {
        const { data, error }:any = await authClient.signIn.email({
            email: formData.email,
            password: formData.password,
            rememberMe: formData.rememberMe
        });
    
        console.log(data)
    
        if (error) {
          setMsg(error?.message);
          console.error("Authentication failed:", error.message);
        } else {
          navigate({ to: '/admin' })
        }
    } catch (error: any) {
        console.error("Authentication failed:", error?.message);
    } finally {
        setLoading(false);
    }
    
  }
  

  const handleGoogleSignIn = (e: any) => {
    e.preventDefault();
    setLoading(true);
    setTimeout( async() => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/admin",
            errorCallbackURL: "/auth/error",
            //newUserCallbackURL: "/welcome",  // Newly registered users go here instead
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
    },2000)
  };

  

  return (
    <main className="relative">
      <div className="min-h-screen bg-[#0a192a]/50 text-white antialiased font-sans">
        <main className="w-full">
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side: Marketing/Promo Panel */}
              <div>
                <div className="flex items-center gap-3 mb-6"></div>
                <h1 className="text-4xl md:text-4xl font-extrabold tracking-tight text-white mb-6 leading-tight text-left font-sans">
                  Welcome Back to Heravote
                </h1>
                <p className="text-lg md:text-xl text-zinc-300 mb-8 text-left max-w-lg">
                  Sign in to continue managing your corporate elections, public awards, or judged competitions.
                </p>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {/* Secure Access */}
                  <div className="rounded-3xl bg-[#6d28d9]/8 p-6 flex items-center gap-4">
                    <Shield className="w-8 h-8 text-purple-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Power Secure Voting Events Instantly</h3>
                      <p className="text-sm text-zinc-300">Launch transparent digital elections for awards or competitions and watch verified results roll in live.</p>
                    </div>
                  </div>

                  {/* Community Driven */}
                  <div className="rounded-3xl bg-[#f59e42]/8 p-6 flex items-center gap-4">
                    <Users className="w-8 h-8 text-orange-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Transparent Corporate Voting & Institutional Elections</h3>
                      <p className="text-sm text-zinc-300">Build auditable award ceremonies, board elections, and competitions featuring secure voter verification and real-time analytics.</p>
                    </div>
                  </div>

                  {/* Trusted Platform */}
                  <div className="rounded-3xl bg-[#6d28d9]/8 p-6 flex items-center gap-4">
                    <ThumbsUp className="w-8 h-8 text-purple-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Real-Time Audits</h3>
                      <p className="text-sm text-zinc-300">Track voter turnout live with cryptographic verification that ensures end-to-end transparency.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Sign-In Form */}
              <div>
                <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-white mb-2 rel font-sans">
                      Sign In
                    </h2>
                    <p className="text-zinc-300">Access your account to get started</p>
                  </div>

                  {/* Google OAuth Button */}
                  <div className="mb-6">
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      type="button"
                      className="w-full px-4 py-3 bg-white text-black rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Google Custom SVG Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"></path>
                      </svg>
                      { loading  ? <span className="animate-pulse">Connecting ...</span> : <span>Continue with Google</span> }
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      {/* <span className="px-2 bg-[#1c1c24] text-zinc-400 rounded">or</span> */}
                    </div>
                  </div>

                  {/* Credentials Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div className="relative group">
                      <input 
                        type="email" 
                        required 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="Email Address" 
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                      <input 
                        type="password" 
                        required 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="Password" 
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div>

                    <div className="text-red-500 text-sm " style={{ opacity: 1, transform: "none" }}>{msg}</div>

                    {/* Actions Panel */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                          className="w-4 h-4 bg-slate-600/10 border-slate-600/20 rounded focus:ring-purple-500 accent-purple-500" 
                        />
                        <label className="ml-2 text-zinc-400 select-none">Remember me</label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-2 group text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        { loading 
                        ?   <>
                              <LoaderCircle className="h-4 animate-spin"/>
                               <span className="animate-pulse">Loading ...</span>
                            </>
                        : 
                            <>
                               Sign In
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        }
                        </button>
                    </div>
                  </form>

                  {/* Sign Up Redirect link */}
                  <p className="text-center text-sm text-zinc-400 mt-6">
                    Don't have an account?{' '}
                    <a className="text-purple-400 hover:text-purple-300 transition-colors font-medium" href="/auth/signup">
                      Sign up
                    </a>
                  </p>
                </div>
              </div>

            </div>
          </section>
        </main>
      </div>
    </main>
  );
}
