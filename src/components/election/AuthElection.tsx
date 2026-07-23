import { generateTokenCode } from '#/lib/utils';
import { useAuthStore } from '#/lib/voterStore' // Adjust this import path to match your layout
import { fetchGoogleProfileFromServer, verifyVoterFn, verifyVoterOtpFn } from '#/server/tenant-elections';
import { TokensIcon } from '@radix-ui/react-icons';
import { useGoogleLogin } from '@react-oauth/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, BookOpen, Calendar, Info, LoaderCircle, Lock, Phone, User, Users2 } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

export default function AuthElection({ data }: any) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const rightNow = new Date();
  // Blocks every sign-in method (credential, OTP, Google) the same way:
  // staged (not yet open), ended, or currently outside its voting window --
  // matching the "INACTIVE" label shown on the public /elections listing.
  const isElectionUnavailable = ['staged', 'ended'].includes(data?.status)
    || rightNow < new Date(data?.startAt)
    || rightNow > new Date(data?.endAt);
  const { otp, maskPhone } = useAuthStore.getState();
  const [ msg, setMsg ]:any = useState(null);
  const [ loading, setLoading ] = useState(false)
  
  const [formData, setFormData]:any = useState({
    username: '',
    ... data?.authMode && data?.authMode?.toLowerCase() == 'credential' && ({ password: '' }),
    ... data?.authMode && ['otp', 'aotp'].includes(data?.authMode?.toLowerCase()) && ({ phone: '' }),
    ... data?.id && ({ electionId: data?.id }),
    authMode: data?.authMode || 'credential',
    otp: ''
  });

  const loginMutation = useMutation({
    mutationFn: verifyVoterFn,
    onSuccess: async (resp) => {
      const dt = resp?.data;
      const maskPhone = resp?.maskPhone;
      const dbOtp: any = resp?.otp;
     
      if(dt){
        // Initialize Store
        const user:any = {
          id: dt?.voters?.id,
          username: dt?.voters?.username,
          name: dt?.voters?.name,
          phoneNumber: dt?.voters?.phoneNumber,
          email: dt?.voters?.email,
          electionId: dt?.voters?.electionId,
          hasVoted: dt?.voters?.hasVoted,
          electionTitle: dt?.elections?.title,
          electionStatus: dt?.elections?.status,
          electionStart: dt?.elections?.startAt,
          electionEnd: dt?.elections?.endAt,
          electionAutoStart: dt?.elections?.autoStop,
          electionImageUrl: dt?.elections?.imageUrl,
          inviteToken: dt?.voters?.inviteToken,
        }

        if(user.electionId != data.id){
          setLoading(false);
          setMsg(`You are not a permitted voter !`);
          setTimeout(() => setMsg(null),5000);
          return false;
        }

        if(user.hasVoted){
          setLoading(false);
          setMsg(`Voter securely submitted a ballot!`);
          setTimeout(() => setMsg(null),5000);
          return false;
        }
        
        // Is the current time inside the valid election bounds?
        if (rightNow < user.electionStart || rightNow > user.electionEnd) {
          setLoading(false);
          setMsg("Election is inactive !");
          setTimeout(() => setMsg(null),5000)
          return false;
        }
        
        // Stage OTP after Authentication
        if(['otp', 'aotp'].includes(data?.authMode?.toLowerCase())){
            useAuthStore.getState().loadOtp(dbOtp, maskPhone);
        } else {
          
          const token = generateTokenCode()
          // authActions.login(user,token);
          useAuthStore.getState().login(user, token);
          navigate({ to: `/vote/cast`});
          queryClient.invalidateQueries({ queryKey: ['voter-page'] });
        }
        setLoading(false);
      
      } else {
        setLoading(false);
        setMsg("Invalid credentials. try again !");
        setTimeout(() => setMsg(null), 5000)
      }
    },
    onError: (error) => {
      setLoading(false);
      setMsg(null);
      console.error(error.message)
    }
  });

  const verifyMutation = useMutation({
    mutationFn: verifyVoterOtpFn,
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
          hasVoted: dt?.voters?.hasVoted,
          electionTitle: dt?.elections?.title,
          electionStatus: dt?.elections?.status,
          electionStart: dt?.elections?.startAt,
          electionEnd: dt?.elections?.endAt,
          electionAutoStart: dt?.elections?.autoStop,
          electionImageUrl: dt?.elections?.imageUrl,
          inviteToken: dt?.voters?.inviteToken,
        }

        if(user.electionId != data.id){
          setMsg(`You are not a permitted voter !`);
          setTimeout(() => setMsg(null),5000);
          setLoading(false);
          return false;
        }

        if(user.hasVoted){
          setMsg(`Voter securely submitted a ballot!`);
          setTimeout(() => setMsg(null),5000);
          setLoading(false);
          return false;
        }
        
        // Is the current time inside the valid election bounds?
        if (rightNow < user.electionStart || rightNow > user.electionEnd) {
          setLoading(false);
          setMsg("Election is inactive !");
          setTimeout(() => setMsg(null),5000)
          return false;
        }
        
        const token = generateTokenCode()
        // authActions.login(user,token);
        useAuthStore.getState().login(user, token);
        setTimeout(() => useAuthStore.getState().clearOtp(), 3000);
        navigate({ to: `/vote/cast`});
        queryClient.invalidateQueries({ queryKey: ['voter-page'] });
      
      } else {
        setLoading(false);
        setMsg("Invalid OTP. try again !");
        setTimeout(() => setMsg(null),5000)
      }
      
    },
     onError: (error) => {
      setLoading(false);
      console.error(error.message)
     }
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
    setLoading(true);
    loginMutation.mutate({ data: formData } as any)
  };

  
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse?.access_token;
      if (!accessToken) return;
      try {
        const resp: any = await fetchGoogleProfileFromServer({ data: { accessToken, electionId: data.id } } as any);
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
            hasVoted: dt?.voters?.hasVoted,
            electionTitle: dt?.elections?.title,
            electionStatus: dt?.elections?.status,
            electionStart: dt?.elections?.startAt,
            electionEnd: dt?.elections?.endAt,
            electionAutoStart: dt?.elections?.autoStop,
            electionImageUrl: dt?.elections?.imageUrl,
            inviteToken: dt?.voters?.inviteToken,
          }

          if(user.electionId != data.id){
            setMsg(`You are not a permitted voter !`);
            setTimeout(() => setMsg(null),5000);
            setLoading(false);
            return false;
          }

          if(user.hasVoted){
            setMsg(`Voter securely submitted a ballot!`);
            setTimeout(() => setMsg(null),5000);
            setLoading(false);
            return false;
          }
           // 1. Structural evaluation block: Is the current time inside the valid election bounds?
          if (rightNow < user.electionStart || rightNow > user.electionEnd) {
            // alert("Election is inactive !");
            setMsg("Election is inactive !");
            setTimeout(() => setMsg(null),5000);
            setLoading(false);
            return false;
          }

          const token = generateTokenCode();
          // authActions.login(user,token);
          useAuthStore.getState().login(user, token);
          navigate({ to: `/vote/cast`});
          
          queryClient.invalidateQueries({ queryKey: ['voter-page'] });

        } else {
           setLoading(false);
           setMsg("Invalid credentials. try again !");
           setTimeout(() => setMsg(null),5000)
        }

      } catch (err: any) {
        setLoading(false);
        console.error(err?.message);
        setMsg(err?.message);
        setTimeout(() => setMsg(null),5000)
      }
    },
    onError: (error: any) => {
      setLoading(false);
      console.error(error?.message);
      setMsg(error?.message);
      setTimeout(() => setMsg(null),5000)
    },
  });

  return (
    <main className="relative">
      <div className="min-h-screen  text-white antialiased font-sans">
        <main className="w-full">
          <section className="w-full max-w-7xl bg-[#0a192a] rounded-xl mx-auto sm:mt-24 px-4 sm:px-10 lg:px-6 pt-6 sm:pt-6 lg:pt-6 pb-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              <div>
                  <div className="flex gap-3 mb-6">
                    <h1 className="w-full text-lg sm:text-3xl md:text-2xl items-center font-bold tracking-tight text-zinc-400 mb-6 leading-tight text-center font-sans">
                      {data?.tag?.replaceAll("-"," ")?.toUpperCase()}
                    </h1>
                  </div>
                   {/* Logo */}
                  <div className="relative sm:my-6 mx-auto py-4 h-28 w-28 sm:h-40 sm:w-40 flex items-center justify-center text-center">
                    { data?.imageUrl && (
                      <img
                        alt={data.title}
                        decoding="async"
                        className="object-contain object-center"
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
                {/* Rotating gradient-border glow (Uiverse.io by bhaveshxrawat) -- real content lives in the
                    z-10 wrapper below since the ::before/::after pseudo-elements paint above static-flow children */}
                <div className="card relative overflow-hidden bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-lg p-8 pb-12 shadow-xl before:content-[''] before:absolute before:inset-0 before:m-auto before:w-[100px] before:h-[130%] before:bg-[linear-gradient(180deg,var(--color-purple-400),var(--color-orange-400))] before:animate-[rotBGimg_6s_linear_infinite] after:content-[''] after:absolute after:bg-[#07182E] after:inset-[1px] after:rounded-lg">
                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-base sm:text-xl italic font-bold tracking-wide text-white mb-2 rel font-sans">
                      VOTER LOGIN
                    </h2>
                    <p className="text-zinc-400 font-bold text-sm"> {data?.title}</p>
                  </div>


                  {/* Google Strategy */}
                  { data?.authMode?.toLowerCase() == "google" && (
                  <>
                  <div className="mb-6">
                    <button
                      disabled={ loading || isElectionUnavailable }
                      onClick={() => {
                        setLoading(true);
                        setTimeout(() =>  handleGoogleSignIn() ,2000);
                      }}
                      type="button"
                      className="w-full px-4 py-3 bg-white text-black rounded-xl hover:bg-zinc-100 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {/* Google Custom SVG Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"></path>
                      </svg>
                      { loading  ? <span className="animate-pulse">Connecting ...</span> : <span>Login with Google Account</span> }
                    </button>
                    { msg && (<div className="mt-4 text-red-300 text-sm text-center animate-pulse font-medium tracking-wide">{msg}</div>)}
                  </div>
                  
                  </>
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

                  {/* Credential & OTP Strategy */}

                  { ["credential","otp","aotp"].includes(data?.authMode?.toLowerCase()) && (
                  <form onSubmit={handleSubmit} className="space-y-4 pb-10">
                   
                    {/* Credentials Strategy */}
                    { !otp ?
                      <>
                      {/* Username Input */}
                      <div className="group relative">
                        <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          { ["credential", "otp", "aotp"].includes(data?.authMode?.toLowerCase()) ? (data?.placeholder?.username || "Identity") : "Identity" }
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <User className="w-4 h-4 text-zinc-900" />
                          </div>
                          <input
                            type="text"
                            required
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="block w-full pl-10 p-3.5 bg-white text-zinc-900 font-medium text-sm border-2 border-zinc-900 focus:outline-none focus:ring-0 focus:border-purple-600 transition-colors duration-200 ease-in-out"
                            placeholder={["credential", "otp", "aotp"].includes(data?.authMode?.toLowerCase()) ? (data?.placeholder?.username || "Username") : "Username"}
                          />
                          <div className="absolute top-0 left-0 w-full h-full bg-zinc-200 -z-10 translate-x-1.5 translate-y-1.5 border-2 border-transparent transition-transform group-focus-within:translate-x-2.5 group-focus-within:translate-y-2.5"></div>
                        </div>
                      </div>

                      {/* Password Input */}
                      { data?.authMode?.toLowerCase() == "credential" && (
                      <div className="group relative">
                        <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          { data?.placeholder?.password || "Access Key" }
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Lock className="w-4 h-4 text-zinc-900" />
                          </div>
                          <input
                            type="password"
                            required
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="block w-full pl-10 p-3.5 bg-white text-zinc-900 font-medium text-sm border-2 border-zinc-900 focus:outline-none focus:ring-0 focus:border-purple-600 transition-colors duration-200 ease-in-out"
                            placeholder={data?.placeholder?.password || "Password"}
                          />
                          <div className="absolute top-0 left-0 w-full h-full bg-zinc-200 -z-10 translate-x-1.5 translate-y-1.5 border-2 border-transparent transition-transform group-focus-within:translate-x-2.5 group-focus-within:translate-y-2.5"></div>
                        </div>
                      </div>
                      )}

                      {/* Phone Input */}
                      { ["otp","aotp"].includes(data?.authMode?.toLowerCase()) && (
                      <div className="group relative">
                        <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Phone className="w-4 h-4 text-zinc-900" />
                          </div>
                          <input
                            type="tel"
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="block w-full pl-10 p-3.5 bg-white text-zinc-900 font-medium text-sm border-2 border-zinc-900 focus:outline-none focus:ring-0 focus:border-purple-600 transition-colors duration-200 ease-in-out"
                            placeholder="Phone Number"
                          />
                          <div className="absolute top-0 left-0 w-full h-full bg-zinc-200 -z-10 translate-x-1.5 translate-y-1.5 border-2 border-transparent transition-transform group-focus-within:translate-x-2.5 group-focus-within:translate-y-2.5"></div>
                        </div>
                      </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={ loading || isElectionUnavailable }
                        className="relative inline-block w-full group mt-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span className="absolute top-0 left-0 w-full h-full transition-all duration-200 ease-out transform translate-x-1.5 translate-y-1.5 bg-purple-600 border-2 border-zinc-900 group-hover:translate-x-0 group-hover:translate-y-0"></span>
                        <span className="relative flex items-center justify-center gap-2 w-full px-5 py-3.5 text-sm font-bold tracking-widest uppercase border-2 border-zinc-900 bg-white text-zinc-900">
                           { loading
                            ?   <>
                                  <LoaderCircle className="h-4 w-4 animate-spin"/>
                                  <span className="animate-pulse">Authenticating...</span>
                                </>
                            :
                                <>
                                   Login to Vote
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            }
                        </span>
                      </button>

                      </> :

                      <div className="flex flex-col gap-4">
                        {/* Verify OTP */}
                          <div className="group relative">
                            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                              Access Key
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <TokensIcon className="w-4 h-4 text-zinc-900" />
                              </div>
                              <input
                                type="text"
                                required
                                name="otp"
                                value={formData.otp}
                                onChange={handleInputChange}
                                className="block w-full pl-10 p-3.5 bg-white text-zinc-900 font-medium text-sm border-2 border-zinc-900 focus:outline-none focus:ring-0 focus:border-purple-600 transition-colors duration-200 ease-in-out"
                                placeholder="Enter OTP Sent to Phone"
                              />
                              <div className="absolute top-0 left-0 w-full h-full bg-zinc-200 -z-10 translate-x-1.5 translate-y-1.5 border-2 border-transparent transition-transform group-focus-within:translate-x-2.5 group-focus-within:translate-y-2.5"></div>
                            </div>
                          </div>
                          <button
                            onClick={() => verifyMutation.mutate({ data: { otp: formData.otp, electionId: formData.electionId, username: formData.username }} as any) }
                            disabled={ loading || isElectionUnavailable }
                            className="relative inline-block w-full group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="absolute top-0 left-0 w-full h-full transition-all duration-200 ease-out transform translate-x-1.5 translate-y-1.5 bg-purple-600 border-2 border-zinc-900 group-hover:translate-x-0 group-hover:translate-y-0"></span>
                            <span className="relative flex items-center justify-center gap-2 w-full px-5 py-3.5 text-sm font-bold tracking-widest uppercase border-2 border-zinc-900 bg-white text-zinc-900">
                               { loading
                                ?   <>
                                      <LoaderCircle className="h-4 w-4 animate-spin"/>
                                      <span className="animate-pulse">Verifying...</span>
                                    </>
                                :
                                    <>
                                      Verify to Vote
                                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                }
                            </span>
                          </button>
                          <p className="text-center text-sm text-zinc-400 ">
                            Can't verify voter?{' '}&nbsp;&nbsp;
                            <button
                              type='button'
                              onClick={() => useAuthStore.getState().clearOtp()}
                              className="cursor-pointer text-purple-400 hover:text-purple-300 transition-colors font-medium"
                            >
                              Go back
                            </button>
                          </p>
                          <div className="text-amber-400 text-xs text-center font-semibold animate-pulse"><div>Note: OTP has been sent to phone number</div><div className="italic tracking-widest">{maskPhone}</div></div>

                      </div>
                    }
                      
                    { msg && (<div className="text-red-300 text-sm text-center animate-pulse font-medium tracking-wide">{msg}</div>)}
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
              </div>
              
              {/* Notice */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                     <div className="rounded-xl bg-[#f59e42]/8 py-4 px-6 flex items-center gap-4">
                      <Calendar className="w-8 h-8 text-orange-400 shrink-0" />
                      <div>
                        <h3 className="text-base sm:text-lg italic font-bold text-white">Period of Voting</h3>
                        <p className="text-sm text-zinc-300">Opens: { moment(data?.startAt).format("LLL") } <br/>Closes:  { moment(data?.endAt).format("LLL") }</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#6d28d9]/8 py-4 px-6 flex items-center gap-4">
                      <Info className="w-8 h-8 text-purple-400 shrink-0" />
                      <div>
                        <h3 className="text=base sm:text-lg italic font-bold text-white">Election Status</h3>
                        <p className="text-sm text-zinc-300">{ (rightNow < data.startAt || rightNow > data.endAt) ? "INACTIVE" : data.status == 'staged' ? 'NOT STARTED': data.status == 'started'? 'LIVE & ON-GOING' : 'CLOSED'  }</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#6d28d9]/8 py-4 px-6 flex items-center gap-4">
                      <BookOpen className="w-8 h-8 text-purple-400 shrink-0" />
                      <div>
                        <h3 className="text=base sm:text-lg italic font-bold text-white">New to voting here?</h3>
                        <Link
                          to="/vote/instruction/$electionTag"
                          params={{ electionTag: data?.tag }}
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                        >
                          View step-by-step instructions
                        </Link>
                      </div>
                    </div>
                    {/* Voter lookup page only exists when the admin has show-feed enabled */}
                    { data?.showFeed && (
                    <div className="rounded-xl bg-[#6d28d9]/8 py-4 px-6 flex items-center gap-4">
                      <Users2 className="w-8 h-8 text-purple-400 shrink-0" />
                      <div>
                        <h3 className="text=base sm:text-lg italic font-bold text-white">Check Eligibility</h3>
                        <Link to="/vote/register/$electionTag" params={{ electionTag: data?.tag }} className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
                          View voters register
                        </Link>
                      </div>
                    </div>
                    )}
              </div>
             
            </div>
          </section>
        </main>
      </div>
    </main>
  );
}
