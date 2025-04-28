import React from 'react';

const MultiSelectDropdown = ({
  open,
  setOpen,
  options,
  selected,
  setSelected,
  buttonLabel,
  dropdownRef
}) => (
  <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
    <button
      onClick={() => setOpen(!open)}
      className="category-dropdown-btn"
    >
      {buttonLabel}
      <span style={{ marginLeft: 8 }}>▼</span>
    </button>
    {open && (
      <div className="category-dropdown-menu">
        <label style={{ fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={selected.length === 0}
            onChange={() => setSelected([])}
          />
          Kõik
        </label>
        {options.map(opt => (
          <label key={opt.value}>
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => {
                if (selected.includes(opt.value)) {
                  setSelected(selected.filter(v => v !== opt.value));
                } else {
                  setSelected([...selected, opt.value]);
                }
              }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    )}
  </div>
);

export default MultiSelectDropdown; 