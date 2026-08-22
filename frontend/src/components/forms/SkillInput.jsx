import React, { useState, useRef } from 'react';
import Button from '../common/Button';

const SkillInput = ({ skills, setSkills }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef();

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setInput('');
    inputRef.current?.focus();
  };

  const removeSkill = (skill) => setSkills(skills.filter(s => s !== skill));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
    if (e.key === 'Backspace' && !input && skills.length) {
      setSkills(skills.slice(0, -1));
    }
  };

  return (
    <div>
      <div style={{
        minHeight: '56px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', padding: '10px 14px',
        display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
      }}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((skill) => (
          <span key={skill} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
            color: '#c4b5fd', fontSize: '13px', fontWeight: '500',
          }}>
            {skill}
            <button type="button" onClick={() => removeSkill(skill)}
              style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '14px' }}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : ''}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: '#f1f5f9', fontSize: '14px', flex: 1, minWidth: '140px', fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Or type skill name here..."
          style={{ display: 'none' }} // for accessibility, hidden since above handles it
        />
        <Button type="button" variant="secondary" onClick={addSkill} style={{ padding: '8px 18px', fontSize: '13px' }}>
          + Add Skill
        </Button>
        {skills.length > 0 && (
          <span style={{ color: '#64748b', alignSelf: 'center', fontSize: '13px' }}>
            {skills.length} skill{skills.length !== 1 ? 's' : ''} added
          </span>
        )}
      </div>
    </div>
  );
};

export default SkillInput;
