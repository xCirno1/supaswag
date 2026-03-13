"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getPatients, Patient } from '@/lib/api';
import { ArrowUpRight } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((err) => {
        console.error("Meal API unreachable:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <p className="text-stone-400 text-sm">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="text-center p-8 border border-stone-200 bg-white rounded-sm">
        <h2 className="font-['DM_Serif_Display'] text-xl mb-2">System Offline</h2>
        <p className="text-stone-500 text-sm">Unable to connect to the facility database.</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');

        .page-rule {
          height: 1px;
          background: linear-gradient(to right, rgba(28,25,23,0.15), transparent);
        }

        .micro-label {
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          color: #d6d3d1;
        }

        .patient-row {
          display: grid;
          grid-template-columns: 2rem 14rem 1fr auto;
          align-items: center;
          gap: 2rem;
          padding: 1.4rem 0;
          border-bottom: 1px solid rgba(28,25,23,0.07);
          transition: opacity 0.15s ease;
          text-decoration: none;
          color: inherit;
        }

        .patient-row:last-child {
          border-bottom: none;
        }

        .patient-row:hover .row-index {
          color: #1c1917;
        }

        .patient-row:hover .patient-name-text {
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(28,25,23,0.2);
        }

        .patient-row:hover .arrow-link {
          opacity: 1;
          transform: translate(2px, -2px);
        }

        .row-index {
          font-family: 'DM Serif Display', serif;
          font-size: 0.85rem;
          color: #d6d3d1;
          transition: color 0.15s;
          user-select: none;
        }

        .patient-name-text {
          font-family: 'DM Serif Display', serif;
          font-size: 1.05rem;
          color: #1c1917;
          line-height: 1.2;
        }

        .meta-line {
          font-size: 0.72rem;
          color: #a8a29e;
          margin-top: 0.2rem;
          letter-spacing: 0.02em;
        }

        .med-chip {
          display: inline-block;
          font-size: 0.65rem;
          letter-spacing: 0.04em;
          color: #78716c;
          border: 1px solid rgba(28,25,23,0.12);
          border-radius: 2rem;
          padding: 0.2rem 0.55rem;
          margin-right: 0.3rem;
          margin-bottom: 0.25rem;
          background: transparent;
        }

        .arrow-link {
          opacity: 0.3;
          transition: opacity 0.15s, transform 0.15s;
          color: #1c1917;
        }

        .col-head-row {
          display: grid;
          grid-template-columns: 2rem 14rem 1fr auto;
          gap: 2rem;
          padding-bottom: 0.6rem;
        }
      `}</style>

      {/* Header */}
      <div className="mb-10">
        <p className="micro-label" style={{ marginBottom: '0.5rem' }}>EHR Directory</p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '2.4rem',
          color: '#1c1917',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          Patient Records
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#a8a29e', marginTop: '0.5rem' }}>
          {patients.length} patients · Select to view AI dietary analysis
        </p>
        <div className="page-rule" style={{ marginTop: '1.5rem' }} />
      </div>

      {/* Column headers */}
      <div className="col-head-row">
        <span className="micro-label">#</span>
        <span className="micro-label">Patient</span>
        <span className="micro-label">Medications</span>
        <span className="micro-label" style={{ textAlign: 'right' }}></span>
      </div>
      <div style={{ height: '1px', background: 'rgba(28,25,23,0.08)', marginBottom: 0 }} />

      {/* Rows */}
      {patients.map((patient, i) => (
        <Link href={`/patients/${patient.id}`} key={patient.id} className="patient-row">
          {/* Index */}
          <span className="row-index">{String(i + 1).padStart(2, '0')}</span>

          {/* Name + meta */}
          <div>
            <div className="patient-name-text">{patient.name}</div>
            <div className="meta-line">Room {patient.room} · Age {patient.age}</div>
          </div>

          {/* Medications */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center' }}>
            {patient.medications.map(m => (
              <span key={m} className="med-chip">{m}</span>
            ))}
          </div>

          {/* Arrow */}
          <ArrowUpRight className="arrow-link" style={{ width: '1rem', height: '1rem' }} />
        </Link>
      ))}
    </div>
  );
}