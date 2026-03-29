import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Download, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getAdminDashboard } from '../api/adminApi';

const useCounter = (target, duration = 1000) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const normalizedTarget = Number(target) || 0;
    if (normalizedTarget <= 0) {
      setValue(0);
      return;
    }

    const step = Math.ceil((normalizedTarget * 10) / (duration / 16)) / 10;
    let current = 0;
    const timer = window.setInterval(() => {
      current = Math.min(Number.parseFloat((current + step).toFixed(2)), normalizedTarget);
      setValue(current);
      if (current >= normalizedTarget) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [target, duration]);

  return value;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="glass" style={{ padding: '12px 16px', fontSize: '0.8rem', minWidth: 130 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.fill, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, suffix = '', isDecimal = false, delay = 0 }) => {
  const count = useCounter(isDecimal ? Number(value) : Number.parseInt(value, 10) || 0, 900);

  return (
    <motion.div className="stat-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} style={{ borderLeft: `3px solid ${color}` }}>
      <div className="stat-icon-wrap" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="stat-value">{isDecimal ? count.toFixed(2) : count}{suffix}</div>
      <div className="stat-title">{label}</div>
      <div className="stat-label" style={{ marginTop: 4 }}>{sub}</div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const result = await getAdminDashboard();
        setData(result);
      } catch {
        // Keep UI fallback state.
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const chartData = useMemo(() => {
    if (!data?.branch_stats?.length) {
      return [];
    }

    return data.branch_stats.map((row) => ({
      name: row.branch,
      total: row.total,
      avgCgpaScaled: Math.round((row.avg_cgpa / 10) * row.total),
    }));
  }, [data?.branch_stats]);

  const readinessPct = Math.round((data?.average_cgpa || 0) * 10);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="page-subtitle">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge badge-warning">Admin Console</span>
          </div>
          <h1 className="page-title">Academic Overview</h1>
          <p className="page-subtitle">Batch performance and branch-level readiness insights.</p>
        </div>
        <button className="btn secondary-btn" type="button">
          <Download size={16} />
          Export CSV
        </button>
      </motion.div>

      <div className="grid-auto">
        <StatCard icon={<Users size={22} />} label="Total Students" value={data?.total_students || 0} sub="Registered student accounts" color="#0ea5e9" delay={0} />
        <StatCard icon={<GraduationCap size={22} />} label="Average CGPA" value={data?.average_cgpa || 0} sub="Across completed profiles" color="#16a34a" isDecimal delay={0.08} />
        <StatCard icon={<Award size={22} />} label="Readiness Index" value={readinessPct} suffix="%" sub="Derived from average CGPA" color="#f59e0b" delay={0.16} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <motion.div className="glass card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <h3 className="card-title">
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            Branch Comparison
          </h3>

          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="transparent" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.04)' }} />
                <Bar dataKey="total" name="Total Students" fill="#d1d5db" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgCgpaScaled" name="Readiness Weight" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="#0ea5e9" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }} style={{ maxHeight: 400, overflowY: 'auto' }}>
          <h3 className="card-title" style={{ justifyContent: 'space-between' }}>
            Recent Registrations
            <span className="badge badge-primary">{data?.students?.length || 0}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data?.students || []).map((student, index) => (
              <motion.div key={student.email} className="student-row" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + index * 0.04 }}>
                <div className="student-avatar">
                  {(student.name || 'N')[0]}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="student-name">{student.name || 'N/A'}</p>
                  <p className="student-email">{student.email}</p>
                </div>
                <span className="badge badge-primary" style={{ flexShrink: 0, fontSize: '0.7rem' }}>{student.cgpa}</span>
              </motion.div>
            ))}

            {!data?.students?.length && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
                <p style={{ fontSize: '0.875rem' }}>No students registered yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
