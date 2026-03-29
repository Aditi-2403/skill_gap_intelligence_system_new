import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Save, Upload, X } from 'lucide-react';

import { getProfile, uploadResume, upsertProfile } from '../api/profileApi';

const CompletionRing = ({ pct }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={radius} stroke="rgba(17, 24, 39, 0.08)" strokeWidth="6" fill="none" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke={pct >= 80 ? '#16a34a' : pct >= 50 ? '#0ea5e9' : '#f59e0b'}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <span className="completion-pct">{pct}%</span>
    </div>
  );
};

const YEAR_OPTIONS = [
  { label: '1st Year', value: '1' },
  { label: '2nd Year', value: '2' },
  { label: '3rd Year', value: '3' },
  { label: '4th Year', value: '4' },
];

const Profile = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    cgpa: '',
    branch: '',
    year: '1',
    skills: '',
    certifications: '',
    projects: '',
    internships: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setFormData({ ...profile, cgpa: String(profile.cgpa || '') });
      } catch {
        // Ignore first-time profile setup errors.
      }
    };

    loadProfile();
  }, []);

  const skills = formData.skills
    ? formData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await upsertProfile({
        ...formData,
        cgpa: Number.parseFloat(formData.cgpa) || 0,
        year: Number.parseInt(formData.year, 10) || 1,
      });
      showToast('success', 'Profile saved successfully.');
    } catch {
      showToast('error', 'Unable to save profile. Please try again.');
    }
  };

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (!nextSkill || skills.includes(nextSkill)) {
      setSkillInput('');
      return;
    }

    setFormData((current) => ({ ...current, skills: [...skills, nextSkill].join(', ') }));
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    setFormData((current) => ({
      ...current,
      skills: skills.filter((skill) => skill !== skillToRemove).join(', '),
    }));
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill();
    }
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'Please upload a valid PDF file.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    setUploading(true);
    try {
      const result = await uploadResume(formDataToSend);
      const extractedSkills = result.extracted_skills || [];
      const mergedSkills = Array.from(new Set([...skills, ...extractedSkills])).join(', ');
      setFormData((current) => ({ ...current, skills: mergedSkills }));
      showToast('success', `Extracted ${extractedSkills.length} skills from resume.`);
    } catch {
      showToast('error', 'Resume parsing failed. Please try another PDF.');
    } finally {
      setUploading(false);
    }
  };

  const completionCount = Object.values(formData).filter((value) => value && value !== '1').length;
  const completionPct = Math.round((completionCount / 8) * 100);

  return (
    <div className="profile-page">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'}`}
            style={{ position: 'fixed', top: 20, right: 24, zIndex: 999, minWidth: 280, boxShadow: 'var(--shadow-soft)' }}
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 className="page-title">My Academic Profile</h1>
        <p className="page-subtitle">Keep your details updated for accurate and personalized skill-gap analysis.</p>
      </motion.div>

      <div className="profile-layout">
        <motion.form onSubmit={handleSubmit} className="glass card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="full_name" value={formData.full_name} onChange={handleChange} className="input-field" placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label className="form-label">Branch / Department</label>
              <input name="branch" value={formData.branch} onChange={handleChange} className="input-field" placeholder="Computer Science" required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input name="cgpa" type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={handleChange} className="input-field" placeholder="8.50" required />
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select name="year" value={formData.year} onChange={handleChange} className="input-field">
                {YEAR_OPTIONS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <div className="skill-input-surface" onClick={() => document.getElementById('skill-input')?.focus()}>
              {skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                  <button type="button" className="remove-btn" onClick={(event) => {
                    event.stopPropagation();
                    removeSkill(skill);
                  }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                id="skill-input"
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={addSkill}
                className="skill-input"
                placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more skills...'}
                aria-label="Add skill"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Certifications</label>
            <input name="certifications" value={formData.certifications} onChange={handleChange} className="input-field" placeholder="AWS, Coursera, Udemy..." />
          </div>
          <div className="form-group">
            <label className="form-label">Projects</label>
            <input name="projects" value={formData.projects} onChange={handleChange} className="input-field" placeholder="Portfolio website, AI chatbot..." />
          </div>
          <div className="form-group">
            <label className="form-label">Internships</label>
            <input name="internships" value={formData.internships} onChange={handleChange} className="input-field" placeholder="Company name and role" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Save size={16} />
            Save Profile
          </button>
        </motion.form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.section className="glass card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Profile Completion</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <CompletionRing pct={completionPct} />
              <div>
                <p className="status-copy">
                  {completionPct < 50 ? 'Getting started' : completionPct < 80 ? 'Good progress' : 'Profile looks complete'}
                </p>
                <p className="status-subcopy">{completionCount} of 8 fields filled</p>
              </div>
            </div>
          </motion.section>

          <motion.section className="glass card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>
              <Upload size={16} style={{ color: 'var(--primary)' }} />
              Resume Skill Extractor
            </h3>
            <p className="page-subtitle" style={{ fontSize: '0.8rem', marginBottom: 14 }}>
              Upload a PDF resume to auto-fill recognized skills.
            </p>

            <div
              className={`upload-zone ${dragging ? 'drag-over' : ''}`}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFiles(event.dataTransfer.files);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(event) => handleFiles(event.target.files)} />
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div className="spinner" />
                  <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Parsing resume...</p>
                </div>
              ) : (
                <>
                  <Upload size={28} style={{ color: 'var(--primary)', margin: '0 auto 10px', display: 'block', opacity: 0.8 }} />
                  <p className="page-subtitle" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    Drag and drop your PDF, or click to browse
                  </p>
                  <p className="status-subcopy">PDF only, max 5 MB</p>
                </>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
