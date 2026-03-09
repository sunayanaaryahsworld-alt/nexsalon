  "use client";
  
  import React from 'react';
  import { Search, Plus, Settings, Ban, ChevronRight, ChevronLeft } from 'lucide-react';
  import { useEffect, useState } from "react";
  
  const API_BASE =
  process.env.NEXT_PUBLIC_API_URL;
  
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
  
  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
  
  const ROLES: Role[] = [
    { name: 'Super Admin',    description: 'Full Access',         count: 2,    isActive: true },
    { name: 'Salon Admin',    description: 'Salon Management',    count: 89    },
    { name: 'Branch Manager', description: 'Branch Operations',   count: 234   },
    { name: 'Staff',          description: 'Booking & Services',  count: 1847  },
    { name: 'Receptionist',   description: 'Front Desk',          count: 562   },
  ];
  
  const USERS_PER_PAGE = 7;
  
  // --- Helper for Status Styling ---
  function getStatusClasses(status: UserStatus) {
    switch (status) {
      case 'active':  return 'bg-[#E6F9F4] text-[#059669] border-[#D1FAE5]';
      case 'blocked': return 'bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6]';
      case 'pending': return 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
      default:        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  }
  
  /* ─────────────────────────────────────────
     MOBILE USER CARD
     Shown instead of table rows on small screens
  ───────────────────────────────────────── */
  function UserCard({ user }: { user: User }) {
    return (
      <div className="px-4 py-4 border-b border-[#FAF9F6] last:border-0">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#D4A117] text-white flex items-center justify-center font-bold text-xs ring-4 ring-[#D4A117]/5 flex-shrink-0">
            {user.initials}
          </div>
  
          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#433E37] truncate">{user.name}</p>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize border flex-shrink-0 ${getStatusClasses(user.status)}`}>
                {user.status}
              </span>
            </div>
            <p className="text-xs text-[#A6A196] truncate mt-0.5">{user.email}</p>
  
            {/* Role + company + last active */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="text-xs font-semibold text-[#433E37]">{user.role}</span>
              {user.company && (
                <span className="text-xs text-[#A6A196]">{user.company}</span>
              )}
              <span className="text-xs text-[#8C877D]">· {user.lastActive}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  /* ─────────────────────────────────────────
     ROLES SIDEBAR — collapsible on mobile
  ───────────────────────────────────────── */
  function RolesSidebar() {
    const [open, setOpen] = useState(false);
  
    return (
      <aside className="bg-white rounded-3xl border border-[#F2EFE6] shadow-sm">
        {/* Header — always visible, toggle on mobile */}
        <div
          className="flex justify-between items-center p-5 sm:p-6 cursor-pointer lg:cursor-default"
          onClick={() => setOpen((o) => !o)}
        >
          <h2 className="font-bold text-lg">Roles &amp; Permissions</h2>
          <div className="flex items-center gap-3">
            <button
              className="text-[#D4A117] text-sm hidden sm:flex items-center gap-1.5 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings size={14} strokeWidth={2.5} /> Configure
            </button>
            {/* Chevron toggle — only on mobile */}
            <ChevronRight
              size={18}
              className={`text-[#D9D4C7] lg:hidden transition-transform ${open ? "rotate-90" : ""}`}
            />
          </div>
        </div>
  
        {/* Role list — always visible on lg, collapsible below */}
        <nav className={`px-5 sm:px-6 pb-5 sm:pb-6 space-y-5 sm:space-y-7 ${open ? "block" : "hidden lg:block"}`}>
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
      </aside>
    );
  }
  
  /* ─────────────────────────────────────────
     MAIN PAGE
  ───────────────────────────────────────── */
  export default function UserManagementPage() {
    const [users, setUsers]         = useState<User[]>([]);
    const [search, setSearch]       = useState("");
    const [pagination, setPagination] = useState<Pagination>({
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0,
      limit: USERS_PER_PAGE,
      hasNextPage: false,
      hasPrevPage: false,
    });
    const [isLoading, setIsLoading] = useState(false);
  
    const fetchUsers = (page: number) => {
      setIsLoading(true);
     fetch(`${API_BASE}/superdashboard/users?page=${page}&limit=${USERS_PER_PAGE}&search=${search}`)
        .then(res => res.json())
       .then((data: { users: User[]; pagination: Pagination }) => {
          setUsers(data.users);
          setPagination(data.pagination);
        })
        .catch((err: unknown) => console.error(err))
        .finally(() => setIsLoading(false));
    };
  
  useEffect(() => {
  fetchUsers(1);
}, []);
  
    useEffect(() => {
      const delay = setTimeout(() => { fetchUsers(1); }, 400);
      return () => clearTimeout(delay);
    }, [search]);
  
    const handlePageChange = (page: number) => {
      if (page < 1 || page > pagination.totalPages) return;
      fetchUsers(page);
    };
  
    const getPageNumbers = (): (number | '...')[] => {
      const { currentPage, totalPages } = pagination;
      if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
      if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
      if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };
  
    return (
      <div className="min-h-screen bg-[#FDFBF3] font-sans text-[#433E37]">
        {/* Header */}
        <header className="flex justify-between items-start mb-6 sm:mb-8 lg:mb-10">
          <div>
            <h1 className="text-[22px] sm:text-3xl font-serif font-bold text-[#2D2A26]">User Management</h1>
            <p className="text-[#8C877D] mt-1 text-sm">Manage users, roles and permissions across the platform</p>
          </div>
        </header>
  
        {/*
          Layout:
            mobile:  stack (roles on top, table below)
            lg:      side-by-side 3/9 grid
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8">
  
          {/* ── Roles Sidebar ── */}
          <div className="lg:col-span-3">
            <RolesSidebar />
          </div>
  
          {/* ── User Table ── */}
          <main className="lg:col-span-9 bg-white rounded-3xl border border-[#F2EFE6] shadow-sm overflow-hidden flex flex-col">
  
            {/* Search */}
            <div className="p-4 sm:p-5 border-b border-[#F9F8F3]">
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFB9AB] group-focus-within:text-[#D4A117] transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-[#F9F8F3] border-none rounded-2xl focus:ring-2 focus:ring-[#D4A117]/20 outline-none placeholder-[#BFB9AB] text-sm transition-all"
                />
              </div>
            </div>
  
            {/* ── DESKTOP TABLE (md and up) ── */}
            <div className="hidden md:block flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-[#B3AE9F] font-bold border-b border-[#F9F8F3]">
                    <th className="px-6 py-5">User</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF9F6]">
                  {isLoading
                    ? Array.from({ length: USERS_PER_PAGE }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#F2EFE6]" />
                              <div className="space-y-2">
                                <div className="h-3 w-28 bg-[#F2EFE6] rounded" />
                                <div className="h-2.5 w-36 bg-[#F2EFE6] rounded" />
                              </div>
                            </div>
                          </td>
                          {[...Array(3)].map((_, j) => (
                            <td key={j} className="px-6 py-5">
                              <div className="h-3 w-20 bg-[#F2EFE6] rounded" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : users.map((user) => (
                        <tr key={user.id} className="hover:bg-[#FDFBF3]/50 transition-colors">
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
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
  
            {/* ── MOBILE CARDS (below md) ── */}
            <div className="md:hidden flex-1 overflow-auto">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-4 py-4 border-b border-[#FAF9F6] animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F2EFE6] flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 bg-[#F2EFE6] rounded" />
                          <div className="h-2.5 w-40 bg-[#F2EFE6] rounded" />
                          <div className="h-2.5 w-24 bg-[#F2EFE6] rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                : users.map((user) => <UserCard key={user.id} user={user} />)
              }
            </div>
  
            {/* Pagination Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-[#F2EFE6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#A6A196] order-2 sm:order-1">
                Showing{' '}
                <span className="font-semibold text-[#433E37]">
                  {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalUsers)}–
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)}
                </span>{' '}
                of <span className="font-semibold text-[#433E37]">{pagination.totalUsers}</span> users
              </p>
  
              <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-xl text-[#B3AE9F] hover:bg-[#F9F8F3] hover:text-[#433E37] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
  
                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-[#B3AE9F] text-sm select-none">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-sm font-semibold transition-all ${
                        pagination.currentPage === page
                          ? 'bg-[#D4A117] text-white shadow-sm'
                          : 'text-[#8C877D] hover:bg-[#F9F8F3] hover:text-[#433E37]'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
  
                {/* Next */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-xl text-[#B3AE9F] hover:bg-[#F9F8F3] hover:text-[#433E37] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }