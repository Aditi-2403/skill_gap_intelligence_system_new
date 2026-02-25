import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, FileDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SkillGap = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [gapData, setGapData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await axios.get('/industry-roles');
            setRoles(res.data);
        } catch (err) { }
    };

    const handleRoleSelect = async (roleName) => {
        setSelectedRole(roleName);
        setLoading(true);
        try {
            const res = await axios.get(`/skill-gap/${roleName}`);
            setGapData(res.data);
        } catch (err) {
            console.error('Error fetching gap data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade">
            <div>
                <h1 className="text-3xl font-bold">Industry Skill Gap Engine</h1>
                <p className="text-slate-400 mt-2">Select a target role to visualize your readiness and missing skills.</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Target Roles</h3>
                    {roles.map((r, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleRoleSelect(r.role)}
                            className={`w-full p-4 rounded-xl text-left glass border transition-all flex justify-between items-center ${selectedRole === r.role ? 'border-indigo-500 bg-indigo-500/10' : 'hover:bg-slate-800/40'}`}
                        >
                            <span className="font-medium">{r.role}</span>
                            <ChevronRight size={16} className={selectedRole === r.role ? 'text-indigo-400' : 'text-slate-600'} />
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {!selectedRole ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center glass p-12 text-center"
                            >
                                <Target size={64} className="text-slate-700 mb-6" />
                                <h2 className="text-xl font-bold text-slate-400">Select a career path to begin analysis</h2>
                                <p className="text-slate-500 max-w-md mt-2">Our engine will compare your profile against curated industry standards.</p>
                            </motion.div>
                        ) : loading ? (
                            <div className="h-full flex items-center justify-center p-12">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <motion.div
                                key={selectedRole}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="glass p-6">
                                        <h3 className="card-title">Readiness Score</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * gapData?.match_score / 100)} className="text-indigo-500 transition-all duration-1000" />
                                                </svg>
                                                <span className="absolute text-2xl font-bold">{gapData?.match_score}%</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm">Matching {gapData?.match_count} out of {gapData?.total_required} core skills</p>
                                                <div className={`badge mt-3 ${gapData?.match_score > 70 ? 'badge-success' : 'badge-warning'}`}>
                                                    {gapData?.match_score > 70 ? 'Industry Ready' : 'Needs Development'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass p-6 bg-indigo-500/5">
                                        <h3 className="card-title text-indigo-300">Quick Analysis</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            You are strong in <strong>{gapData?.match_count}</strong> key areas.
                                            To become a competitive candidate for {selectedRole}, prioritize learning {gapData?.missing_skills[0]} and {gapData?.missing_skills[1]}.
                                        </p>
                                        <button className="btn secondary-btn mt-6 w-full">
                                            <FileDown size={18} />
                                            Download Detailed Report
                                        </button>
                                    </div>
                                </div>

                                <div className="glass p-8">
                                    <h3 className="card-title mb-6">Missing Skills Inventory</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {gapData?.missing_skills.map((skill, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                    <AlertTriangle className="text-red-500" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold capitalize">{skill}</p>
                                                    <p className="text-xs text-slate-500">Essential for {selectedRole}</p>
                                                </div>
                                                <button className="ml-auto text-xs text-indigo-400 font-bold hover:underline">Find Courses</button>
                                            </div>
                                        ))}
                                        {gapData?.missing_skills.length === 0 && (
                                            <div className="col-span-2 text-center py-8">
                                                <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                                                <h4 className="text-lg font-bold">Perfect Match!</h4>
                                                <p className="text-slate-400">You possess all core skills required for this role.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SkillGap;
