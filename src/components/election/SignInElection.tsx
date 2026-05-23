import React from 'react';
import { Shield, Users, BarChart3 } from 'lucide-react';

export default function SignInElection() {
  return (
    <main className="relative">
      <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
        <main className="w-full">
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6"></div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6Sub leading-tight text-left font-sans">
                  welcome back to festora
                </h1>
                
                <p className="text-lg md:text-xl text-zinc-300 mb-8 text-left max-w-lg">
                  sign in to continue managing your voting events, track results, and engage with your community.
                </p>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {/* Secure Access Card */}
                  <div className="rounded-3xl bg-[#6d28d9]/5 p-6 flex items-center gap-4 border border-[#6d28d9]/10">
                    <Shield className="w-8 h-8 text-purple-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">secure access</h3>
                      <p className="text-sm text-zinc-300">protected voting platform with verified accounts</p>
                    </div>
                  </div>

                  {/* Community Driven Card */}
                  <div className="rounded-3xl bg-[#f59e42]/5 p-6 flex items-center gap-4 border border-[#f59e42]/10">
                    <Users className="w-8 h-8 text-orange-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">community driven</h3>
                      <p className="text-sm text-zinc-300">join thousands of active voters and event organizers</p>
                    </div>
                  </div>

                  {/* Real-time Tracking Card */}
                  <div className="rounded-3xl bg-[#6d28d9]/5 p-6 flex items-center gap-4 border border-[#6d28d9]/10">
                    <BarChart3 className="w-8 h-8 text-purple-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">real-time tracking</h3>
                      <p className="text-sm text-zinc-300">monitor live election results and statistics instantly</p>
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
