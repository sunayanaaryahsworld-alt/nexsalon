// "use client";

// import {
//   AlertCircle,
//   Clock,
//   CheckCircle,
//   MessageSquare,
// } from "lucide-react";

// const STATS = [
//   {
//     title: "Open Tickets",
//     value: "24",
//     color: "text-red-500",
//     icon: AlertCircle,
//     iconColor: "text-red-500",
//   },
//   {
//     title: "In Progress",
//     value: "11",
//     color: "text-orange-500",
//     icon: Clock,
//     iconColor: "text-orange-500",
//   },
//   {
//     title: "Resolved Today",
//     value: "18",
//     color: "text-green-600",
//     icon: CheckCircle,
//     iconColor: "text-green-600",
//   },
//   {
//     title: "Avg Response",
//     value: "2.4h",
//     color: "text-yellow-600",
//     icon: MessageSquare,
//     iconColor: "text-yellow-600",
//   },
// ];

// const TICKETS = [
//   {
//     id: "TKT-001",
//     title: "Payment gateway not working",
//     salon: "Velvet Touch Spa",
//     priority: "High",
//     status: "open",
//     assigned: "Arjun Dev",
//     created: "2 hrs ago",
//   },
//   {
//     id: "TKT-002",
//     title: "Staff access permissions issue",
//     salon: "Golden Hour Salon",
//     priority: "Medium",
//     status: "in progress",
//     assigned: "Priya QA",
//     created: "5 hrs ago",
//   },
//   {
//     id: "TKT-003",
//     title: "Cannot add new service category",
//     salon: "Bloom & Glow",
//     priority: "Low",
//     status: "resolved",
//     assigned: "Ravi S",
//     created: "1 day ago",
//   },
//   {
//     id: "TKT-004",
//     title: "WhatsApp notifications not sending",
//     salon: "Urban Style Studio",
//     priority: "High",
//     status: "open",
//     assigned: "Unassigned",
//     created: "3 hrs ago",
//   },
//   {
//     id: "TKT-005",
//     title: "Report export broken",
//     salon: "The Refinery",
//     priority: "Medium",
//     status: "in progress",
//     assigned: "Arjun Dev",
//     created: "Yesterday",
//   },
// ];

// export default function SupportPage() {
//   return (
//     <div className="min-h-screen bg-[#f5f1ea] px-6 py-6 w-full text-[#2d241a]">

//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-serif font-bold">
//             Support & Tickets
//           </h1>
//           <p className="text-sm text-[#7a6a55] mt-1">
//             Manage salon support tickets and internal assignments
//           </p>
//         </div>

//         <button className="bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm transition">
//           + New Ticket
//         </button>
//       </div>

//       {/* STATS CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//   {STATS.map((stat) => {
//     const Icon = stat.icon;

//     return (
//       <div
//         key={stat.title}
//         className="relative bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm"
//       >
//         {/* ICON */}
//         <div className={`absolute top-5 right-5 ${stat.iconColor}`}>
//           <Icon size={20} strokeWidth={2} />
//         </div>

//         <p className="text-sm text-[#8a7a66]">{stat.title}</p>

//         <h2 className={`text-3xl font-bold mt-2 ${stat.color}`}>
//           {stat.value}
//         </h2>
//       </div>
//     );
//   })}
// </div>

//       {/* RECENT TICKETS TABLE */}
//       <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl shadow-sm overflow-hidden">

//         {/* TABLE HEADER */}
//         <div className="px-6 py-5 border-b border-[#eee7dc]">
//           <h2 className="text-xl font-serif font-bold">
//             Recent Tickets
//           </h2>
//         </div>

//         {/* TABLE */}
//         <div className="w-full overflow-x-auto">
//           <table className="w-full text-sm">

//             <thead className="bg-[#f3eee6] text-[#8a7a66] uppercase text-xs tracking-wider">
//               <tr>
//                 <th className="text-left px-6 py-4">Ticket</th>
//                 <th className="text-left px-6 py-4">Priority</th>
//                 <th className="text-left px-6 py-4">Status</th>
//                 <th className="text-left px-6 py-4">Assigned</th>
//                 <th className="text-left px-6 py-4">Created</th>
//                 <th className="text-left px-6 py-4">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {TICKETS.map((ticket, index) => (
//                 <tr
//                   key={ticket.id}
//                   className={`border-t border-[#eee7dc] ${
//                     index % 2 === 0 ? "bg-white" : "bg-[#fcfaf7]"
//                   }`}
//                 >
//                   {/* Ticket */}
//                   <td className="px-6 py-5">
//                     <p className="text-xs text-[#8a7a66]">{ticket.id}</p>
//                     <p className="font-medium mt-1">
//                       {ticket.title}
//                     </p>
//                     <p className="text-xs text-[#8a7a66] mt-1">
//                       {ticket.salon}
//                     </p>
//                   </td>

//                   {/* Priority */}
//                   <td className="px-6 py-5">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-medium ${
//                         ticket.priority === "High"
//                           ? "bg-red-100 text-red-600"
//                           : ticket.priority === "Medium"
//                           ? "bg-yellow-100 text-yellow-600"
//                           : "bg-green-100 text-green-600"
//                       }`}
//                     >
//                       {ticket.priority}
//                     </span>
//                   </td>

//                   {/* Status */}
//                   <td className="px-6 py-5">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-medium ${
//                         ticket.status === "open"
//                           ? "bg-yellow-100 text-yellow-600"
//                           : ticket.status === "in progress"
//                           ? "bg-orange-100 text-orange-600"
//                           : "bg-green-100 text-green-600"
//                       }`}
//                     >
//                       {ticket.status}
//                     </span>
//                   </td>

//                   {/* Assigned */}
//                   <td className="px-6 py-5">
//                     {ticket.assigned}
//                   </td>

//                   {/* Created */}
//                   <td className="px-6 py-5 text-[#7a6a55]">
//                     {ticket.created}
//                   </td>

//                   {/* Action */}
//                   <td className="px-6 py-5">
//                     <button className="flex items-center gap-2 text-[#c8922a] hover:text-[#b07d20] text-sm font-medium transition">
//   <MessageSquare size={16} strokeWidth={2} />
//   Reply
// </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>

//           </table>
//         </div>
//       </div>

//     </div>
//   );
// }

"use client";

import {
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

const STATS = [
  {
    title: "Open Tickets",
    value: "24",
    color: "text-red-500",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  {
    title: "In Progress",
    value: "11",
    color: "text-orange-500",
    icon: Clock,
    iconColor: "text-orange-500",
  },
  {
    title: "Resolved Today",
    value: "18",
    color: "text-green-600",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  {
    title: "Avg Response",
    value: "2.4h",
    color: "text-yellow-600",
    icon: MessageSquare,
    iconColor: "text-yellow-600",
  },
];

const TICKETS = [
  {
    id: "TKT-001",
    title: "Payment gateway not working",
    salon: "Velvet Touch Spa",
    priority: "High",
    status: "open",
    assigned: "Arjun Dev",
    created: "2 hrs ago",
  },
  {
    id: "TKT-002",
    title: "Staff access permissions issue",
    salon: "Golden Hour Salon",
    priority: "Medium",
    status: "in progress",
    assigned: "Priya QA",
    created: "5 hrs ago",
  },
  {
    id: "TKT-003",
    title: "Cannot add new service category",
    salon: "Bloom & Glow",
    priority: "Low",
    status: "resolved",
    assigned: "Ravi S",
    created: "1 day ago",
  },
  {
    id: "TKT-004",
    title: "WhatsApp notifications not sending",
    salon: "Urban Style Studio",
    priority: "High",
    status: "open",
    assigned: "Unassigned",
    created: "3 hrs ago",
  },
  {
    id: "TKT-005",
    title: "Report export broken",
    salon: "The Refinery",
    priority: "Medium",
    status: "in progress",
    assigned: "Arjun Dev",
    created: "Yesterday",
  },
];

export default function SupportPage() {
  return (
    <div className="w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold">
              Support & Tickets
            </h1>
            <p className="text-sm text-[#7a6a55] mt-1">
              Manage salon support tickets and internal assignments
            </p>
          </div>

          <button className="w-full sm:w-auto bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm transition">
            + New Ticket
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {STATS.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="relative bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm"
              >
                <div className={`absolute top-5 right-5 ${stat.iconColor}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>

                <p className="text-sm text-[#8a7a66]">{stat.title}</p>

                <h2 className={`text-3xl font-bold mt-2 ${stat.color}`}>
                  {stat.value}
                </h2>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eee7dc]">
            <h2 className="text-xl font-serif font-bold">
              Recent Tickets
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f3eee6] text-[#8a7a66] uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-6 py-4">Ticket</th>
                  <th className="text-left px-6 py-4">Priority</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Assigned</th>
                  <th className="text-left px-6 py-4">Created</th>
                  <th className="text-left px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {TICKETS.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className={`border-t border-[#eee7dc] ${
                      index % 2 === 0 ? "bg-white" : "bg-[#fcfaf7]"
                    }`}
                  >
                    <td className="px-6 py-5">
                      <p className="text-xs text-[#8a7a66]">{ticket.id}</p>
                      <p className="font-medium mt-1">{ticket.title}</p>
                      <p className="text-xs text-[#8a7a66] mt-1">
                        {ticket.salon}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : ticket.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "open"
                            ? "bg-yellow-100 text-yellow-600"
                            : ticket.status === "in progress"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">{ticket.assigned}</td>

                    <td className="px-6 py-5 text-[#7a6a55]">
                      {ticket.created}
                    </td>

                    <td className="px-6 py-5">
                      <button className="flex items-center gap-2 text-[#c8922a] hover:text-[#b07d20] text-sm font-medium transition">
                        <MessageSquare size={16} />
                        Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-5 mt-6">
          {TICKETS.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#8a7a66]">{ticket.id}</p>
                  <p className="font-medium mt-1">{ticket.title}</p>
                  <p className="text-xs text-[#8a7a66] mt-1">
                    {ticket.salon}
                  </p>
                </div>

                <button className="flex items-center gap-1 text-[#c8922a] text-sm font-medium">
                  <MessageSquare size={15} />
                  Reply
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 text-xs">
                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600">
                  {ticket.priority}
                </span>

                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600">
                  {ticket.status}
                </span>

                <span className="text-[#7a6a55]">
                  {ticket.assigned}
                </span>

                <span className="text-[#7a6a55]">
                  {ticket.created}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}