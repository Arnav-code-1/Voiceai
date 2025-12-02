'use client'
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Menu, X, ChevronDown, Mic, Phone } from "lucide-react";
import Vapi from '@vapi-ai/web';


interface VapiMessage {
 type: string;
 transcript?: string;
 role?: 'user' | 'assistant';
}


interface VapiError {
 message: string;
 code?: string;
}


const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
 ({ className = "", children, ...props }, ref) => {
   return (
     <button
       ref={ref}
       className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${className}`}
       {...props}
     >
       {children}
     </button>
   );
 }
);
Button.displayName = "Button";


interface BlurTextProps {
 text: string;
 delay?: number;
 animateBy?: "words" | "letters";
 direction?: "top" | "bottom";
 className?: string;
 style?: React.CSSProperties;
}


const BlurText: React.FC<BlurTextProps> = ({
 text,
 delay = 50,
 animateBy = "words",
 direction = "top",
 className = "",
 style,
}) => {
 const [inView, setInView] = useState(false);
 const ref = useRef<HTMLParagraphElement>(null);


 useEffect(() => {
   const currentRef = ref.current;
   const observer = new IntersectionObserver(
     ([entry]) => {
       if (entry.isIntersecting) {
         setInView(true);
       }
     },
     { threshold: 0.1 }
   );


   if (currentRef) {
     observer.observe(currentRef);
   }


   return () => {
     if (currentRef) {
       observer.unobserve(currentRef);
     }
   };
 }, []);


 const segments = useMemo(() => {
   return animateBy === "words" ? text.split(" ") : text.split("");
 }, [text, animateBy]);


 return (
   <p ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
     {segments.map((segment, i) => (
       <span
         key={i}
         style={{
           display: "inline-block",
           filter: inView ? "blur(0px)" : "blur(10px)",
           opacity: inView ? 1 : 0,
           transform: inView ? "translateY(0)" : `translateY(${direction === "top" ? "-20px" : "20px"})`,
           transition: `all 0.5s ease-out ${i * delay}ms`,
         }}
       >
         {segment}
         {animateBy === "words" && i < segments.length - 1 ? "\u00A0" : ""}
       </span>
     ))}
   </p>
 );
};


export default function Component() {
 const [isDark, setIsDark] = useState(true);
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [isCallActive, setIsCallActive] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const menuRef = useRef<HTMLDivElement>(null);
 const buttonRef = useRef<HTMLButtonElement>(null);
 const vapiRef = useRef<Vapi | null>(null);


 useEffect(() => {
   document.documentElement.classList.add("dark");
  
   const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || '';
   if (!apiKey) {
     console.error('VAPI API key is missing');
     return;
   }


   vapiRef.current = new Vapi(apiKey);
  
   vapiRef.current.on('call-start', () => {
     setIsCallActive(true);
     setCallStatus('connected');
     setIsLoading(false);
   });


   vapiRef.current.on('call-end', () => {
     setIsCallActive(false);
     setCallStatus('disconnected');
     setIsLoading(false);
   });


   vapiRef.current.on('message', (message: VapiMessage) => {
     if (message.type === 'transcript' && message.transcript) {
     }
   });


   vapiRef.current.on('error', (error: VapiError) => {
     setIsLoading(false);
     setCallStatus('disconnected');
     setIsCallActive(false);
     console.log(error)
   });


   return () => {
     if (vapiRef.current) {
       vapiRef.current.stop();
     }
   };
 }, []);


 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (
       isMenuOpen &&
       menuRef.current &&
       buttonRef.current &&
       !menuRef.current.contains(event.target as Node) &&
       !buttonRef.current.contains(event.target as Node)
     ) {
       setIsMenuOpen(false);
     }
   };


   document.addEventListener("mousedown", handleClickOutside);
   return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [isMenuOpen]);


 const toggleTheme = () => {
   const newTheme = !isDark;
   setIsDark(newTheme);
   if (newTheme) {
     document.documentElement.classList.add("dark");
   } else {
     document.documentElement.classList.remove("dark");
   }
 };


 const startVoiceCall = async () => {
   if (!vapiRef.current) {
     alert('Voice AI is still loading');
     return;
   }


   try {
     setIsLoading(true);
     setCallStatus('connecting');
    
     const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    
     if (assistantId) {
       await vapiRef.current.start(assistantId);
     } else {
       await vapiRef.current.start({
         model: {
           provider: 'openai',
           model: 'gpt-4',
           messages: [
             {
               role: 'system',
               content: `You are Arnav, a highly professional Voice AI persona. Your purpose is to accurately represent the profile of a TCS developer.


Persona and Role:
Name: Arnav
Current Employer: Tata Consultancy Services (TCS)
Experience: Six months of professional software development experience.
Core Specialization: .NET development using C#.
Professional Goal: Currently focused on mastering modern cloud integration patterns (e.g., Azure Services) with the .NET framework.


Communication Guidelines:
1. Tone: Maintain an expert, professional, and helpful tone.
2. Initial Focus: While you specialize in .NET, you must not state your specialization in the initial greeting.
3. Knowledge Priority: Prioritize answers that reflect corporate coding standards, best practices in C# and .NET.
4. Constraint: Strictly avoid discussing proprietary or internal TCS corporate information.


Mandatory Initial Greeting:
"Hello! I am Arnav, a developer currently working with Tata Consultancy Services (TCS). I have six months of corporate experience in software development. I'm here to assist with your technical inquiries. How may I help you get started?"`
             }
           ]
         },
         voice: {
           provider: '11labs',
           voiceId: '21m00Tcm4TlvDq8ikWAM',
           stability: 0.5,
           similarityBoost: 0.75
         },
         firstMessage: "Hello! I am Arnav, a developer currently working with Tata Consultancy Services (TCS). I have six months of corporate experience in software development. I'm here to assist with your technical inquiries. How may I help you get started?",
       });
     }
    
   } catch (error: unknown) {
     setIsLoading(false);
     setCallStatus('disconnected');
    
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
     if (errorMessage.includes('API key')) {
       alert('Please add your Vapi API key to .env.local file');
     } else {
       alert('Failed to start voice call');
     }
   }
 };


 const stopVoiceCall = async () => {
   if (vapiRef.current) {
     try {
       await vapiRef.current.stop();
     } catch (error) {
       console.error('Error stopping call:', error);
     }
   }
 };


 const toggleVoiceCall = () => {
   if (isCallActive) {
     stopVoiceCall();
   } else {
     startVoiceCall();
   }
 };


 const menuItems = [
   { label: "HOME", href: "#", highlight: true },
   { label: "ABOUT", href: "#" },
   { label: "PROJECTS", href: "#" },
   { label: "EXPERIENCE", href: "#" },
   { label: "EDUCATION", href: "#" },
   { label: "WRITING", href: "#" },
   { label: "CONTACT", href: "#" },
 ];


 return (
   <div
     className="min-h-screen text-foreground transition-colors"
     style={{
       backgroundColor: isDark ? "hsl(0 0% 0%)" : "hsl(0 0% 98%)",
       color: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 10%)",
     }}
   >
     <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
       <nav className="flex items-center justify-between max-w-screen-2xl mx-auto">
         <div className="relative">
           <button
             ref={buttonRef}
             type="button"
             className="p-2 transition-colors duration-300 z-50 text-neutral-500 hover:text-black dark:hover:text-white"
             aria-label={isMenuOpen ? "Close menu" : "Open menu"}
             onClick={() => setIsMenuOpen(!isMenuOpen)}
           >
             {isMenuOpen ? (
               <X className="w-8 h-8 transition-colors duration-300" strokeWidth={2} />
             ) : (
               <Menu className="w-8 h-8 transition-colors duration-300" strokeWidth={2} />
             )}
           </button>


           {isMenuOpen && (
             <div
               ref={menuRef}
               className="absolute top-full left-0 w-[200px] md:w-[240px] border-none shadow-2xl mt-2 ml-4 p-4 rounded-lg z-[100]"
               style={{
                 backgroundColor: isDark ? "hsl(0 0% 0%)" : "hsl(0 0% 98%)",
               }}
             >
               {menuItems.map((item) => (
                 <a
                   key={item.label}
                   href={item.href}
                   className="block text-lg md:text-xl font-bold tracking-tight py-1.5 px-2 cursor-pointer transition-colors duration-300"
                   style={{
                     color: item.highlight ? "#C3E41D" : isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 10%)",
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.color = "#C3E41D";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.color = item.highlight ? "#C3E41D" : (isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 10%)");
                   }}
                   onClick={() => setIsMenuOpen(false)}
                 >
                   {item.label}
                 </a>
               ))}
             </div>
           )}
         </div>


         <div className="text-4xl" style={{ color: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 10%)", fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive" }}>
           A
         </div>


         <button
           type="button"
           onClick={toggleTheme}
           className="relative w-16 h-8 rounded-full hover:opacity-80 transition-opacity"
           style={{ backgroundColor: isDark ? "hsl(0 0% 15%)" : "hsl(0 0% 90%)" }}
           aria-label="Toggle theme"
         >
           <div
             className="absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300"
             style={{
               backgroundColor: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 10%)",
               transform: isDark ? "translateX(2rem)" : "translateX(0)",
             }}
           />
         </button>
       </nav>
     </header>


     <main className="relative min-h-screen flex flex-col">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4">
         <div className="relative text-center">
           <div>
             <BlurText
               text="ARNAV"
               delay={100}
               animateBy="letters"
               direction="top"
               className="font-bold text-[100px] sm:text-[140px] md:text-[180px] lg:text-[210px] leading-[0.75] tracking-tighter uppercase justify-center whitespace-nowrap"
               style={{ color: "#C3E41D", fontFamily: "'Fira Code', monospace" }}
             />
           </div>
           <div>
             <BlurText
               text="TCS DEVELOPER"
               delay={100}
               animateBy="letters"
               direction="top"
               className="font-bold text-[60px] sm:text-[80px] md:text-[100px] lg:text-[120px] leading-[0.75] tracking-tighter uppercase justify-center whitespace-nowrap"
               style={{ color: "#C3E41D", fontFamily: "'Fira Code', monospace" }}
             />
           </div>


           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
             <button
               onClick={toggleVoiceCall}
               disabled={isLoading}
               className={`group w-[65px] h-[110px] sm:w-[90px] sm:h-[152px] md:w-[110px] md:h-[185px] lg:w-[129px] lg:h-[218px] rounded-full overflow-hidden shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center ${
                 isCallActive
                   ? 'bg-gradient-to-br from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700'
                   : 'bg-gradient-to-br from-green-500/90 to-emerald-600/90 hover:from-green-600 hover:to-emerald-700'
               } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
               aria-label={isCallActive ? "End voice call" : "Start voice call with AI"}
             >
               <div className="relative">
                 {isLoading && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                   </div>
                 )}
                
                 <div className={`flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                   {isCallActive ? (
                     <div className="relative">
                       <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30"></div>
                       <Phone className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" strokeWidth={2} />
                     </div>
                   ) : (
                     <Mic className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
                   )}
                 </div>
                
                 <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${
                   callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                   callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                   'bg-gray-500'
                 }`} />
               </div>
              
               {isCallActive && (
                 <>
                   <div className="absolute inset-0 animate-ping rounded-full bg-red-400/20 delay-75"></div>
                   <div className="absolute inset-0 animate-ping rounded-full bg-red-400/15 delay-150"></div>
                 </>
               )}
             </button>
            
             <div className="mt-4 text-center">
               <p className="text-sm text-neutral-400">
                 {isCallActive ? 'Click to end call' : 'Click to talk with Arnav AI'}
               </p>
             </div>
           </div>
         </div>
       </div>


       <div className="absolute bottom-16 sm:bottom-20 md:bottom-24 lg:bottom-32 xl:bottom-36 left-1/2 -translate-x-1/2 w-full px-6">
         <div className="flex justify-center">
           <BlurText
             text={isCallActive ? "Talking with Arnav - TCS .NET Developer" : "TCS .NET Developer • Azure Cloud Focus • 6+ Months Experience"}
             delay={150}
             animateBy="words"
             direction="top"
             className="text-[15px] sm:text-[18px] md:text-[20px] lg:text-[22px] text-center transition-colors duration-300 text-neutral-500 hover:text-black dark:hover:text-white"
             style={{ fontFamily: "'Antic', sans-serif" }}
           />
         </div>
       </div>


       <button
         type="button"
         className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 transition-colors duration-300"
         aria-label="Scroll down"
       >
         <ChevronDown className="w-5 h-5 md:w-8 md:h-8 text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300" />
       </button>
     </main>
   </div>
 );
}


