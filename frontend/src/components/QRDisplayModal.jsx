// frontend/src/components/QRDisplayModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import attendanceApi from '../services/attendanceApi';

const QRDisplayModal = ({ onClose }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await attendanceApi.getGymQr();
        setToken(res.token);
      } catch (err) {
        console.error('Failed to fetch QR:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, []);

  const downloadQR = () => {
    const svg = document.getElementById('gym-qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'gym-entrance-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div className="modal-content" style={{
        background: 'white', padding: '2.5rem', borderRadius: '24px', width: '90%', maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', position: 'relative'
      }}>
        <div style={{ position: 'absolute', right: '1.25rem', top: '1.25rem' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <X size={24} />
          </button>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#111827' }}>Gym Check-in QR</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Every member scans this same QR to mark their attendance</p>

        <div style={{
          background: '#f8fafc', padding: '2rem', borderRadius: '16px', display: 'inline-block',
          border: '1px solid #e2e8f0', marginBottom: '2rem'
        }}>
          {loading ? (
            <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading QR...
            </div>
          ) : (
            <QRCodeSVG 
              id="gym-qr-svg"
              value={token} 
              size={200}
              level="H"
              includeMargin={true}
            />
          )}
        </div>

        <div style={{
          backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem',
          borderRadius: '12px', display: 'flex', gap: '0.75rem', textAlign: 'left', marginBottom: '2rem'
        }}>
          <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.813rem', color: '#1e40af', lineHeight: '1.4' }}>
            Display this QR at your gym entrance. Members use their MuscleTime app to scan and mark attendance for today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }} className="no-print">
          <button onClick={downloadQR} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Download size={18} /> Download
          </button>
          <button onClick={handlePrint} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .modal-overlay { background: white !important; position: static !important; }
          .modal-content { box-shadow: none !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default QRDisplayModal;
