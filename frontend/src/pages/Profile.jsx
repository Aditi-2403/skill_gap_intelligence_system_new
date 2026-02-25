import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Save, Upload, Plus, X } from 'lucide-react';

const Profile = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        cgpa: '',
        branch: '',
        year: '1',
        skills: '',
        certifications: '',
        projects: '',
        internships: ''
    });
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/profile');
            setFormData({
                ...res.data,
                cgpa: res.data.cgpa.toString()
            });
        } catch (err) { }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/profile', {
                ...formData,
                cgpa: parseFloat(formData.cgpa),
                year: parseInt(formData.year)
            });
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error updating profile');
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const resumeData = new FormData();
        resumeData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('/resume-upload', resumeData);
            const extracted = res.data.extracted_skills;
            const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
            const newSkills = Array.from(new Set([...currentSkills, ...extracted])).join(', ');

            setFormData(prev => ({ ...prev, skills: newSkills }));
            setMessage(`Extracted ${extracted.length} skills from resume!`);
        } catch (err) {
            setMessage('Error parsing resume');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Academic Profile</h1>
                {message && <div className="badge badge-success">{message}</div>}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="glass p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">Full Name</label>
                                <input name="full_name" value={formData.full_name} onChange={handleChange} className="input-field" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">Branch</label>
                                <input name="branch" value={formData.branch} onChange={handleChange} className="input-field" placeholder="Computer Science" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">CGPA</label>
                                <input name="cgpa" type="number" step="0.01" value={formData.cgpa} onChange={handleChange} className="input-field" placeholder="9.5" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">Year of Study</label>
                                <select name="year" value={formData.year} onChange={handleChange} className="input-field">
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Skills (comma separated)</label>
                            <textarea name="skills" value={formData.skills} onChange={handleChange} className="input-field min-h-[100px]" placeholder="Python, SQL, React..." required />
                        </div>

                        <button type="submit" className="btn btn-primary w-full">
                            <Save size={18} />
                            Save Profile Changes
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="glass p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Upload size={18} className="text-indigo-400" />
                            Smart Resume Upload
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Upload your PDF resume to automatically extract skills using our NLP engine.
                        </p>
                        <label className={`btn secondary-btn cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? 'Processing...' : 'Choose PDF File'}
                            <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                        </label>
                    </div>

                    <div className="glass p-6">
                        <h3 className="font-bold mb-2">Completion Status</h3>
                        <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Object.values(formData).filter(v => v).length * 12.5}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
