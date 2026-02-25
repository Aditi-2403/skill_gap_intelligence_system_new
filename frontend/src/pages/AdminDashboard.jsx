import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, Award, BookOpen, Search, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const res = await axios.get('/admin/dashboard');
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Loading Analytics...</div>;

    const chartData = [
        { name: 'CS', students: 120, ready: 85 },
        { name: 'EC', students: 95, ready: 40 },
        { name: 'IT', students: 110, ready: 75 },
        { name: 'ME', students: 80, ready: 25 },
    ];

    return (
        <div className="space-y-8 animate-fade">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Administrator Console</h1>
                    <p className="text-slate-400 mt-2">Regional Academic Performance & Skill Trends</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn secondary-btn">
                        <Download size={18} />
                        Export Batch Data
                    </button>
                    <button className="btn btn-primary">
                        Generate Batch Report
                    </button>
                </div>
            </div>

            <div className="grid">
                <div className="stat-card glass border-l-4 border-indigo-500">
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <Users size={24} />
                        <span className="font-semibold">Total Students</span>
                    </div>
                    <div className="stat-value">{data?.total_students || 0}</div>
                    <div className="stat-label">Active across all branches</div>
                </div>

                <div className="stat-card glass border-l-4 border-emerald-500">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <GraduationCap size={24} />
                        <span className="font-semibold">Avg. Class CGPA</span>
                    </div>
                    <div className="stat-value">{data?.average_cgpa || 0}</div>
                    <div className="stat-label">System-wide performance index</div>
                </div>

                <div className="stat-card glass border-l-4 border-amber-500">
                    <div className="flex items-center gap-3 text-amber-400 mb-2">
                        <Award size={24} />
                        <span className="font-semibold">Placement Readiness</span>
                    </div>
                    <div className="stat-value">62%</div>
                    <div className="stat-label">Batch-wide industry alignment</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="card-title"><BookOpen size={20} className="text-indigo-400" /> Branch Readiness Comparison</h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Bar dataKey="students" fill="#334155" radius={[4, 4, 0, 0]} name="Total Enrolled" />
                                <Bar dataKey="ready" fill="#6366f1" radius={[4, 4, 0, 0]} name="Industry Ready" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 overflow-hidden">
                    <h3 className="card-title mb-6">Recent Registrations</h3>
                    <div className="space-y-4">
                        {data?.students?.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs">
                                    {s.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{s.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                                </div>
                                <div className="text-xs font-bold text-indigo-400">
                                    {s.cgpa}
                                </div>
                            </div>
                        ))}
                        {(!data?.students || data.students.length === 0) && (
                            <p className="text-center text-slate-500 py-10">No students registered yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
