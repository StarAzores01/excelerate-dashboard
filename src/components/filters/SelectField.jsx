import { useId } from 'react';

export default function SelectField({ label, value, options, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <select id={id} className="field__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
