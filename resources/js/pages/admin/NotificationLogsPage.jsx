import React, { useState } from 'react';
import { Mail, Search, CheckCircle2, Clock, Calendar, ShieldCheck, UserCheck } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';

export default function NotificationLogsPage({ notifications = [], loading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = notifications.filter((n) => {
        const matchesSearch = 
            n.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.subject?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'All' || n.recipient_role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const getTypeVariant = (type) => {
        if (type === 'assigned') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (type === 'updated' || type === 'changed') return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-rose-50 text-rose-700 border-rose-200';
    };

    return (
        <div className="space-y-6">
            {/* ─── Level 1: Page Header (60-30-10 Master Hierarchy) ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span>Automated Dispatch Audit</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Gmail Schedule Notifications Log
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        Automated email notifications dispatched to registered faculty and learner Gmail accounts ({filtered.length} total logs).
                    </p>
                </div>
            </div>

            {/* ─── Level 2 & 3: Filter & Control Card ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all"
                            placeholder="Search recipient name, email or notification subject..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <select
                            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Recipients</option>
                            <option value="teacher">Teachers Only</option>
                            <option value="student">Students Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ─── Level 4: Audit Log Table Card ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 m-0">
                            Dispatched Email History
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                            Real-time audit log of timetable and advisory alerts ({filtered.length} records)
                        </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {filtered.length} dispatched
                    </span>
                </div>

                {loading ? (
                    <div className="p-12">
                        <LoadingSpinner text="Retrieving Gmail notification records..." />
                    </div>
                ) : filtered.length > 0 ? (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3.5 px-5">Recipient</th>
                                        <th className="py-3.5 px-4">Role</th>
                                        <th className="py-3.5 px-4">Type</th>
                                        <th className="py-3.5 px-4">Notification Subject</th>
                                        <th className="py-3.5 px-4">Sent Date &amp; Time</th>
                                        <th className="py-3.5 px-5 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filtered.slice((currentPage - 1) * 10, currentPage * 10).map((notif) => (
                                        <tr key={notif.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="font-extrabold text-slate-900">
                                                    {notif.recipient_name}
                                                </div>
                                                <div className="text-[11px] font-mono text-blue-600 mt-0.5">
                                                    {notif.recipient_email}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                                    notif.recipient_role === 'teacher'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {notif.recipient_role === 'teacher' ? <ShieldCheck size={11} /> : <UserCheck size={11} />}
                                                    <span className="capitalize">{notif.recipient_role}</span>
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getTypeVariant(notif.type)}`}>
                                                    {notif.type}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 max-w-sm truncate">
                                                    {notif.subject}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 max-w-sm truncate">
                                                    {notif.message_body}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                    <Clock size={13} className="text-slate-400 shrink-0" />
                                                    <span>{new Date(notif.sent_at || notif.created_at).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                                    <span>Delivered</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filtered.length}
                                pageSize={10}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-16 text-center text-slate-400">
                        <Mail size={36} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-bold text-slate-700 m-0">No notification logs found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or recipient filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
