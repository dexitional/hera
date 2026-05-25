import { useState } from 'react';
import { Lock, ArrowRight, Info, Calendar, User, Phone } from 'lucide-react';
import moment from 'moment';
import { verifyVoterFn } from '#/server/tenant-elections';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { authActions } from '#/lib/voterStore';
import { generateTokenCode } from '#/lib/utils';

export default function AuthElection({ data }: any) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const [formData, setFormData]:any = useState({
    username: '',
    ... data?.authMode && data?.authMode.toLowerCase() == 'credential' && ({ password: '' }),
    ... data?.authMode && data?.authMode.toLowerCase() == 'otp' && ({ phone: '' }),
    authMode: data?.authMode || 'credential'
  });

  const loginMutation = useMutation({
    mutationFn: verifyVoterFn,
    onSuccess: async (resp) => {
      const dt = resp?.data;
     
      if(dt){
        // Initialize Store
        const user:any = {
          id: dt?.voters?.id,
          username: dt?.voters?.username,
          name: dt?.voters?.name,
          phoneNumber: dt?.voters?.phoneNumber,
          email: dt?.voters?.email,
          electionId: dt?.voters?.electionId,
          hasVoted: dt?.voters?.hasVoted
        }

        const token = generateTokenCode()
        authActions.login(user,token);
        console.log("user: ", user);
        navigate({ to: `/vote/cast`});
        
        queryClient.invalidateQueries({ queryKey: ['voter-page'] });

      } else {
        alert("Invalid credentials. Try again !")
      }
      
    },
     onError: (error) => console.error(error.message)
  });

  const handleInputChange = (e:any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e:any) => {
    e.preventDefault();
    // Handle login submission logic here
    console.log('Form Submitted:', formData);
    loginMutation.mutate({ data: formData } as any)
  };

  const handleGoogleSignIn = () => {
    // Handle Google OAuth logic here
    console.log('Initiating Google Sign-In');
  };

  return (
    <main className="relative">
      <div className="min-h-screen  text-white antialiased font-sans">
        <main className="w-full">
          <section className="w-full max-w-7xl bg-blue-950/10 rounded-4xl mx-auto sm:mt-24 px-4 sm:px-10 lg:px-6 pt-6 sm:pt-6 lg:pt-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              <div>
                  <div className="flex gap-3 mb-6">
                    <h1 className="w-full text-3xl md:text-2xl items-center font-bold tracking-tight text-zinc-400 mb-6 leading-tight text-center font-sans">
                      {data?.tag?.replaceAll("-"," ")?.toUpperCase()}
                    </h1>
                  </div>
                   {/* Logo */}
                  <div className="relative my-6 mx-auto py-4 h-40 w-40 flex items-center justify-center text-center">
                    { data?.imageUrl && (
                      <img
                        alt={data.title}
                        decoding="async"
                        className="h-28 sm:h-48 w-28 sm:w-48 object-contain object-center"
                        sizes="100vw"
                        src={data?.imageUrl}
                        style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                        srcSet={data?.imageUrl}
                      />
                    )}
                  </div>
              </div>
               
              
              {/*  Login */}
              <div>
                <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl">
                  <div className="mb-6">
                    <h2 className="text-xl italic font-bold tracking-wide text-white mb-2 rel font-sans">
                      VOTER LOGIN
                    </h2>
                    <p className="text-zinc-400 font-bold text-sm"> {data?.title}</p>
                  </div>

                  {/* Google OAuth Button */}
                  { data?.authMode?.toLowerCase() == "google" && (
                  <div className="mb-6">
                    <button 
                      onClick={handleGoogleSignIn}
                      type="button"
                      className="w-full px-4 py-3 bg-white text-black rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Google Custom SVG Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"></path>
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                  )}

                  {/* Separator */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      {/* <span className="px-2 bg-[#1c1c24] text-zinc-400 rounded">or</span> */}
                    </div>
                  </div>

                  
                  { ["credential","otp"].includes(data?.authMode?.toLowerCase()) && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                   
                    {/* Credentials Strategy */}

                    {/* Username Input */}
                    <div className="relative group">
                      <input 
                        type="text" 
                        required 
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-slate-600/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="Username" 
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div>
                    
                    {/* Password Input */}
                    { data?.authMode?.toLowerCase() == "credential" && (
                    <div className="relative group">
                      <input 
                        type="password" 
                        required 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-slate-600/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="Password" 
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div>
                    )}
                   
                    {/* Phone Input */}
                    { data?.authMode?.toLowerCase() == "otp" && (
                    <div className="relative group">
                      <input 
                        type="tel" 
                        required 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-1 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="Phone Number" 
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div>
                    )}

                     {/* OTP Input */}
                     {/* <div className="relative group">
                      <input 
                        type="text" 
                        required 
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400" 
                        placeholder="OTP Pin" 
                      />
                      <TokensIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
                    </div> */}

                    {/* Submit Button */}
                    <div>
                      <button 
                        type="submit" 
                        // disabled={ data.status && ['staged','ended'].includes(data.status) }
                        disabled={ true }
                        className="w-full px-4 py-3 bg-[#E3F09B] hover:bg-purple-600 disabled:bg-zinc-400 disabled:hover:bg-zinc-400  text-black disabled:text-zinc-100 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Login to Vote
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    
                  </form>
                  )}
                
                  {/* Sign Up Redirect link */}
                  {/* <p className="text-center text-sm text-zinc-400 mt-6">
                    Can't access account?{' '}
                    <a className="text-purple-400 hover:text-purple-300 transition-colors font-medium" href="/auth/signup">
                      Verify voter
                    </a>
                  </p> */}
                </div>
              </div>
              

              {/* Notice */}
              <div>
                
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                     <div className="rounded-xl bg-[#f59e42]/8 py-4 px-6 flex items-center gap-4">
                      <Calendar className="w-8 h-8 text-orange-400 shrink-0" />
                      <div>
                        <h3 className="text-lg italic font-bold text-white">Period of Voting</h3>
                        <p className="text-sm text-zinc-300">Opens: { moment(data?.startAt).format("LLL") } <br/>Closes:  { moment(data?.endAt).format("LLL") }</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#6d28d9]/8 py-4 px-6 flex items-center gap-4">
                      <Info className="w-8 h-8 text-purple-400 shrink-0" />
                      {/* <div>
                        <h3 className="text-lg font-bold text-white">Instructions</h3>
                        <p className="text-sm text-zinc-300">Please use OTP method to login into the system or portal credentials</p>
                      </div> */}
                      <div>
                        <h3 className="text-lg italic font-bold text-white">Election Status</h3>
                        <p className="text-sm text-zinc-300">{ data.status == 'staged' ? 'NOT STARTED': data.status == 'started'? 'LIVE & ON-GOING' : 'CLOSED'  }</p>
                      </div>
                    </div>
                
                </div>
              </div>


            </div>
          </section>
        </main>
      </div>
    </main>
  );
}
