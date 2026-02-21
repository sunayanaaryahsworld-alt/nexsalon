"use client";

import React from 'react';
import { Search, Plus, Settings, Ban, ChevronRight } from 'lucide-react';
import { useEffect, useState } from "react";

// --- Types ---
type UserStatus = 'active' | 'blocked' | 'pending';

interface Role {
  name: string;
  description: string;
  count: number;
  isActive?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  status: UserStatus;
  lastActive: string;
  initials: string;
}

// // --- Mock Data ---
// const ROLES: Role[] = [
//   { name: 'Super Admin', description: 'Full Access', count: 2, isActive: true },
//   { name: 'Salon Admin', description: 'Salon Management', count: 89 },
//   { name: 'Branch Manager', description: 'Branch Operations', count: 234 },
//   { name: 'Staff', description: 'Booking & Services', count: 1847 },
//   { name: 'Receptionist', description: 'Front Desk', count: 562 },
// ];

const USERS: User[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya@luxebeauty.com', role: 'Salon Admin', company: 'Luxe Beauty Studio', status: 'active', lastActive: '2 min ago', initials: 'PS' },
  { id: '2', name: 'Rahul Mehta', email: 'rahul@velvet.com', role: 'Salon Admin', company: 'Velvet Touch Spa', status: 'active', lastActive: '1 hr ago', initials: 'RM' },
  { id: '3', name: 'Anjali Verma', email: 'anjali@golden.com', role: 'Branch Manager', company: 'Golden Hour Salon', status: 'active', lastActive: '3 hrs ago', initials: 'AV' },
  { id: '4', name: 'Kiran Patel', email: 'kiran@p.com', role: 'Staff', company: 'Luxe Beauty Studio', status: 'active', lastActive: 'Today', initials: 'KP' },
  { id: '5', name: 'Sunita Rao', email: 'sunita@aura.com', role: 'Receptionist', company: 'Aura Wellness', status: 'blocked', lastActive: '5 days ago', initials: 'SR' },
  { id: '6', name: 'Vikram Joshi', email: 'vikram@ref.com', role: 'Salon Admin', company: 'The Refinery', status: 'active', lastActive: 'Yesterday', initials: 'VJ' },
  { id: '7', name: 'Deepa Nair', email: 'deepa@bloom.com', role: 'Staff', company: 'Bloom & Glow', status: 'pending', lastActive: 'Never', initials: 'DN' },
];

const ROLES: Role[] = [
  { name: 'Super Admin', description: 'Full Access', count: 2, isActive: true },
  { name: 'Salon Admin', description: 'Salon Management', count: 89 },
  { name: 'Branch Manager', description: 'Branch Operations', count: 234 },
  { name: 'Staff', description: 'Booking & Services', count: 1847 },
  { name: 'Receptionist', description: 'Front Desk', count: 562 },
];

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
  fetch("http://localhost:3001/api/superdashboard/users")
    .then(res => res.json())
    .then(data => {
      setUsers(data.users);
    })
    .catch(err => console.error(err));
}, []);

  return (
    <div className="min-h-screen bg-[#FDFBF3] p-10 font-sans text-[#433E37]">
      {/* Header Section */}
      <header className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2D2A26]">User Management</h1>
          <p className="text-[#8C877D] mt-1">Manage users, roles and permissions across the platform</p>
        </div>
        <button className="bg-[#D4A117] hover:bg-[#B88A12] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-sm">
          <Plus size={20} /> Add User
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Sidebar: Roles & Permissions */}
        <aside className="col-span-3 bg-white rounded-3xl p-6 border border-[#F2EFE6] shadow-sm h-fit">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-lg">Roles & Permissions</h2>
            <button className="text-[#D4A117] text-sm flex items-center gap-1.5 hover:underline">
              <Settings size={14} strokeWidth={2.5} /> Configure
            </button>
          </div>

          <nav className="space-y-7">
            {ROLES.map((role) => (
              <div key={role.name} className="flex justify-between items-center cursor-pointer group">
                <div>
                  <h3 className={`font-semibold ${role.isActive ? 'text-[#D4A117]' : 'text-[#433E37]'}`}>
                    {role.name}
                  </h3>
                  <p className="text-xs text-[#A6A196]">{role.description}</p>
                </div>
                <div className="flex items-center gap-2 text-[#433E37]">
                  <span className="font-bold text-sm">{role.count.toLocaleString()}</span>
                  <ChevronRight size={16} className="text-[#D9D4C7] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </nav>

          <button className="w-full mt-10 py-3.5 border-2 border-dashed border-[#E8E4D8] rounded-2xl text-[#B3AE9F] text-sm font-bold hover:border-[#D4A117] hover:text-[#D4A117] transition-all">
            + Create Custom Role
          </button>
        </aside>

        {/* Right Content: User Table */}
        <main className="col-span-9 bg-white rounded-3xl border border-[#F2EFE6] shadow-sm overflow-hidden">
          {/* Search Bar */}
          <div className="p-5 border-b border-[#F9F8F3]">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFB9AB] group-focus-within:text-[#D4A117] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-12 pr-4 py-3 bg-[#F9F8F3] border-none rounded-2xl focus:ring-2 focus:ring-[#D4A117]/20 outline-none placeholder-[#BFB9AB] text-sm transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-[#B3AE9F] font-bold border-b border-[#F9F8F3]">
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Active</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF9F6]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#FDFBF3]/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#D4A117] text-white flex items-center justify-center font-bold text-xs ring-4 ring-[#D4A117]/5">
                        {user.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#433E37]">{user.name}</p>
                        <p className="text-xs text-[#A6A196]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-[#433E37]">{user.role}</p>
                    <p className="text-xs text-[#A6A196]">{user.company}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold capitalize border ${getStatusClasses(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-[#8C877D]">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-[#D9D4C7] hover:text-[#E11D48] transition-colors rounded-lg hover:bg-rose-50">
                      <Ban size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}

// --- Helper for Status Styling ---
function getStatusClasses(status: UserStatus) {
  switch (status) {
    case 'active':
      return 'bg-[#E6F9F4] text-[#059669] border-[#D1FAE5]';
    case 'blocked':
      return 'bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6]';
    case 'pending':
      return 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-100';
  }
}