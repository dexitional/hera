import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contact')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-[#0a192a]/80 text-white antialiased font-sans">
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section className="w-full pt-6 sm:pt-12 lg:pt-24 pb-10">
        <div className="text-left" style={{ opacity: 1, transform: 'none' }}>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl">
            Get in touch with our team for any inquiries or support. We're here to help you with your voting events.
          </p>
        </div>
      </section>
      <section className="w-full pb-24">
        <div className="w-full">
          <div className="space-y-6" style={{ opacity: 1, transform: 'none' }}>
            <div className="rounded-3xl bg-zinc-800/50 p-8 sm:p-10 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 relative">
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-5 h-5"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path></svg>
                      Phone Numbers
                    </h3>
                    <div className="space-y-2 ml-7">
                      <a href="tel:0558641826" className="block text-zinc-300 hover:text-white transition-colors text-lg">055 864 1826</a>
                      <a href="tel:0277675089" className="block text-zinc-300 hover:text-white transition-colors text-lg">027 767 5089</a>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 md:border-l border-zinc-600/50 border-t md:border-t-0">
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-mail w-5 h-5"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10"></path><path d="M3 7l9 6l9 -6"></path></svg>
                      Email Support
                    </h3>
                    <div className="ml-7">
                      <a href="mailto:support@Heravote.com" className="text-zinc-300 hover:text-white transition-colors text-lg">support@heravote.com</a>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 border-t border-zinc-600/50">
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-map-pin w-5 h-5"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"></path></svg>
                      Our Location
                    </h3>
                    <div className="ml-7">
                      <p className="text-zinc-300 text-lg">Cape Coast, Ghana</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 border-t md:border-l border-zinc-600/50">
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-clock w-5 h-5"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 7v5l3 3"></path></svg>
                      Business Hours
                    </h3>
                    <div className="space-y-2 ml-7">
                      <p className="text-zinc-300"><span className="font-medium">Mon - Fri:</span> 8:00 AM - 6:00 PM</p>
                      <p className="text-zinc-300"><span className="font-medium">Saturday:</span> 9:00 AM - 4:00 PM</p>
                      <p className="text-zinc-300"><span className="font-medium">Sunday:</span> Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full pb-24">
        <div className="text-left mb-12">
          <h2 className="text-3xl font-extrabold mb-4 text-white">Frequently Asked Questions</h2>
          <p className="text-lg text-zinc-300 max-w-2xl">
            Have a question? Check out our most common inquiries below.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-[#6d28d9]/20 p-8 shadow-md">
            <h3 className="text-lg font-bold text-white mb-3">How do I set up a voting event?</h3>
            <p className="text-zinc-300 text-sm">
              Setting up a voting event is simple! Just sign up for an account, create your event, add categories and nominees, and you're ready to go.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f59e42]/20 p-8 shadow-md">
            <h3 className="text-lg font-bold text-white mb-3">Is USSD voting supported?</h3>
            <p className="text-zinc-300 text-sm">
              Yes! We support USSD voting for users who prefer to vote via mobile phone without internet access.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f59e42]/20 p-8 shadow-md">
            <h3 className="text-lg font-bold text-white mb-3">How secure is the voting process?</h3>
            <p className="text-zinc-300 text-sm">
              We use enterprise-grade security with payment verification, fraud prevention, and transparent result tracking to ensure every vote counts.
            </p>
          </div>
          <div className="rounded-3xl bg-[#6d28d9]/20 p-8 shadow-md">
            <h3 className="text-lg font-bold text-white mb-3">What payment methods are accepted?</h3>
            <p className="text-zinc-300 text-sm">
              We support various payment methods including mobile money, bank transfers, and credit cards for voting fees.
            </p>
          </div>
        </div>
      </section>
    </main>
    </div>
  )
}
