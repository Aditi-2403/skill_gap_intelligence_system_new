import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Layers, TrendingUp, Users } from 'lucide-react';

import { getAdminDashboard } from '../api/adminApi';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAdminDashboard();
        setData(result);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="badge badge-warning">Admin Analytics</span>
        <h1 className="page-title">Cross-Domain Overview</h1>
        <p className="page-subtitle">Performance and risk trends across all supported domains.</p>
      </motion.div>

      <div className="admin-stats-grid">
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><Users size={20} /></div>
          <div className="stat-value">{data?.total_students || 0}</div>
          <div className="stat-title">Total Students</div>
          <div className="stat-label">Registered across all domains</div>
        </div>
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><TrendingUp size={20} /></div>
          <div className="stat-value">{data?.average_readiness_score || 0}%</div>
          <div className="stat-title">Avg Readiness</div>
          <div className="stat-label">Based on latest role mapping</div>
        </div>
        <div className="glass admin-stat-card">
          <div className="stat-icon-wrap"><AlertTriangle size={20} /></div>
          <div className="stat-value">{data?.students_below_threshold || 0}</div>
          <div className="stat-title">At Risk Students</div>
          <div className="stat-label">Readiness below threshold</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="glass card">
          <h3 className="card-title"><Layers size={18} style={{ color: 'var(--primary)' }} /> Domain Distribution</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {(data?.domain_stats || []).map((row) => (
              <div key={row.domain} className="list-row">
                <span>{row.domain}</span>
                <span className="badge badge-primary">{row.students}</span>
              </div>
            ))}
            {!data?.domain_stats?.length && <p className="page-subtitle">No domain preferences submitted yet.</p>}
          </div>
        </section>

        <section className="glass card">
          <h3 className="card-title"><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Common Missing Skills</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {(data?.most_common_missing_skills || []).map((row) => (
              <div key={row.skill} className="list-row">
                <span>{row.skill}</span>
                <span className="badge badge-danger">{row.count}</span>
              </div>
            ))}
            {!data?.most_common_missing_skills?.length && <p className="page-subtitle">No missing skill trend available yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
