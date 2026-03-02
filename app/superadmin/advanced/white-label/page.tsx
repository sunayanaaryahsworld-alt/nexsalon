// "use client";

// import { Palette, Globe, Sliders } from "lucide-react";

// export default function WhiteLabelPage() {
//   return (
//     <div className="w-full">

//       {/* HEADER */}
//       <div className="mb-10">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
//           White Label & Branding
//         </h1>
//         <p className="text-sm text-[#7a6a55] mt-1">
//           Control salon branding, themes and custom domains
//         </p>
//       </div>

//       {/* STATS CARDS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

//         {/* Card 1 */}
//         <div className="flex items-center gap-5 bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
//           <div className="w-14 h-14 rounded-2xl bg-[#d4a62a] text-white flex items-center justify-center shadow-md">
//             <Palette size={22} />
//           </div>
//           <div>
//             <p className="text-sm text-[#7a6a55]">
//               White-Label Active
//             </p>
//             <h2 className="text-2xl font-bold text-[#2d241a] mt-1">
//               42
//             </h2>
//           </div>
//         </div>

//         {/* Card 2 */}
//         <div className="flex items-center gap-5 bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
//           <div className="w-14 h-14 rounded-2xl bg-[#d4a62a] text-white flex items-center justify-center shadow-md">
//             <Globe size={22} />
//           </div>
//           <div>
//             <p className="text-sm text-[#7a6a55]">
//               Custom Domains
//             </p>
//             <h2 className="text-2xl font-bold text-[#2d241a] mt-1">
//               18
//             </h2>
//           </div>
//         </div>

//         {/* Card 3 */}
//         <div className="flex items-center gap-5 bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
//           <div className="w-14 h-14 rounded-2xl bg-[#d4a62a] text-white flex items-center justify-center shadow-md">
//             <Sliders size={22} />
//           </div>
//           <div>
//             <p className="text-sm text-[#7a6a55]">
//               Theme Configs
//             </p>
//             <h2 className="text-2xl font-bold text-[#2d241a] mt-1">
//               67
//             </h2>
//           </div>
//         </div>

//       </div>

//       {/* CONFIGURATION SECTION */}
//       <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-8 sm:p-12 shadow-sm text-center">

//         <div className="flex justify-center mb-6">
//           <div className="w-16 h-16 rounded-full bg-[#f3eee6] flex items-center justify-center text-[#d4a62a]">
//             <Palette size={28} />
//           </div>
//         </div>

//         <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2d241a]">
//           White Label Configuration
//         </h2>

//         <p className="text-sm text-[#7a6a55] mt-3 max-w-md mx-auto">
//           Select a salon to configure their white-label branding,
//           custom domain and theme settings.
//         </p>

//         <button className="mt-6 bg-[#c8922a] hover:bg-[#b07d20] text-white px-8 py-3 rounded-full text-sm font-medium shadow-md transition">
//           Select Salon to Configure
//         </button>

//       </div>

//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Palette, Globe, Sliders } from "lucide-react";

interface Stats {
  whiteLabelActive: number;
  customDomains: number;
  themeConfigs: number;
}

export default function WhiteLabelPage() {
  const [stats, setStats] = useState<Stats>({
    whiteLabelActive: 0,
    customDomains: 0,
    themeConfigs: 0,
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/white-label/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-[#2d241a]">
          White Label & Branding
        </h1>
        <p className="text-sm text-[#7a6a55] mt-1">
          Control salon branding, themes and custom domains
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

        {/* Card 1 */}
        <StatCard
          icon={<Palette size={22} />}
          title="White-Label Active"
          value={stats.whiteLabelActive}
        />

        {/* Card 2 */}
        <StatCard
          icon={<Globe size={22} />}
          title="Custom Domains"
          value={stats.customDomains}
        />

        {/* Card 3 */}
        <StatCard
          icon={<Sliders size={22} />}
          title="Theme Configs"
          value={stats.themeConfigs}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-5 bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#d4a62a] text-white flex items-center justify-center shadow-md">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#7a6a55]">{title}</p>
        <h2 className="text-2xl font-bold text-[#2d241a] mt-1">
          {value}
        </h2>
      </div>
    </div>
  );
}