import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/profile');
            setProfile(res.data);
        } catch (err) {
            console.error('No profile found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    const skills = profile?.skills ? profile.skills.split(',').map(s => s.trim()) : [];

    return (
        <div className="space-y-8 animate-fade">
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}!</h1>
                <p className="text-slate-400 mt-2">Here's your skill overview and industry readiness.</p>
            </div>

            <div className="grid">
                <div className="stat-card glass">
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <CheckCircle2 size={24} />
                        <span className="font-semibold">Known Skills</span>
                    </div>
                    <div className="stat-value">{skills.length}</div>
                    <div className="stat-label">Verified skills in inventory</div>
                </div>

                <div className="stat-card glass">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <TrendingUp size={24} />
                        <span className="font-semibold">Readiness Score</span>
                    </div>
                    <div className="stat-value">68%</div>
                    <div className="stat-label">Average across top roles</div>
                </div>

                <div className="stat-card glass">
                    <div className="flex items-center gap-3 text-amber-400 mb-2">
                        <AlertCircle size={24} />
                        <span className="font-semibold">Gaps Identified</span>
                    </div>
                    <div className="stat-value">12</div>
                    <div className="stat-label">Skills to acquire for goals</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2">
                <div className="glass p-6">
                    <h3 className="card-title"><Briefcase size={20} className="text-indigo-400" /> Skill Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Technical', value: skills.length },
                                        { name: 'Interests', value: 3 },
                                        { name: 'Certified', value: 2 },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#6366f1" />
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6">
                    <h3 className="card-title"><GraduationCap size={20} className="text-indigo-400" /> Recent Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {skills.length > 0 ? skills.map((skill, idx) => (
                            <span key={idx} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 py-1.5">
                                {skill}
                            </span>
                        )) : <p className="text-slate-500">No skills added yet. Update your profile!</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
