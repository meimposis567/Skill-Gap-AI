import React, { useState } from 'react';

const ResumeUpload = ({ onFileSelect }) => {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const handle = (file) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelect && onFileSelect(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => document.getElementById('resume-file').click()}
      style={{
        border: `2px dashed ${dragging ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '16px', padding: '40px 20px',
        textAlign: 'center', cursor: 'pointer',
        background: dragging ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
        transition: 'all 0.3s',
      }}
    >
      <input
        id="resume-file" type="file" accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])}
      />
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
      {fileName ? (
        <>
          <p style={{ color: '#00d4aa', fontWeight: '600', margin: '0 0 4px' }}>✅ {fileName}</p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Click to change file</p>
        </>
      ) : (
        <>
          <p style={{ color: '#e2e8f0', fontWeight: '600', margin: '0 0 6px' }}>Drop your resume here</p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>PDF, DOC or DOCX • Click to browse</p>
        </>
      )}
    </div>
  );
};

export default ResumeUpload;
