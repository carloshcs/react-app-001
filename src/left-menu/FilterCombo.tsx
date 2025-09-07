import * as React from "react";

export type FilterComboOption = { id: string; label: string };

type FilterComboProps = {
  label: string;
  placeholder: string;
  query: string;
  setQuery: (v: string) => void;
  options: FilterComboOption[];
  selected: FilterComboOption[];
  onAdd: (item: FilterComboOption) => void;
  onRemove: (idx: number) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  chipsRowStyle: React.CSSProperties;
};

export const FilterCombo: React.FC<FilterComboProps> = ({
  label,
  placeholder,
  query,
  setQuery,
  options,
  selected,
  onAdd,
  onRemove,
  stop,
  inputStyle,
  dropdownStyle,
  dropdownItem,
  chipStyle,
  chipsRowStyle,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ width: (inputStyle.width as number) || undefined }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={chipsRowStyle}>
          {selected.map((s, i) => (
            <span key={s.id} style={chipStyle}>
              {s.label}
              <button
                aria-label="Remove"
                onMouseDown={stop}
                onClick={() => onRemove(i)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && options.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {options.map((opt) => (
                <div
                  key={opt.id}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onAdd(opt)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type CategoryComboProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onAdd: (item: string) => void;
  onRemove: (idx: number) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  chipsRowStyle: React.CSSProperties;
};

export const CategoryCombo: React.FC<CategoryComboProps> = ({
  label,
  placeholder,
  options,
  selected,
  onAdd,
  onRemove,
  stop,
  inputStyle,
  dropdownStyle,
  dropdownItem,
  chipStyle,
  chipsRowStyle,
}) => {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const filtered = options.filter(o => o.toLowerCase().startsWith(q.toLowerCase()));
  return (
    <div style={{ width: (inputStyle.width as number) || undefined }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={chipsRowStyle}>
          {selected.map((s, i) => (
            <span key={`${s}-${i}`} style={chipStyle}>
              {s}
              <button
                aria-label="Remove"
                onMouseDown={stop}
                onClick={() => onRemove(i)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && filtered.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {filtered.map((opt) => (
                <div
                  key={opt}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onAdd(opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type SingleComboProps = {
  label: string;
  placeholder: string;
  query: string;
  setQuery: (v: string) => void;
  options: FilterComboOption[];
  selected: FilterComboOption | null;
  onSelect: (v: FilterComboOption | null) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  width: number;
};

export const SingleCombo: React.FC<SingleComboProps> = ({
  label,
  placeholder,
  query,
  setQuery,
  options,
  selected,
  onSelect,
  stop,
  inputStyle,
  dropdownStyle,
  dropdownItem,
  chipStyle,
  width,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ width }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {selected && (
          <span style={chipStyle}>
            {selected.label}
            <button
              aria-label="Remove"
              onMouseDown={stop}
              onClick={() => onSelect(null)}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
            >
              ×
            </button>
          </span>
        )}
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && options.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {options.map((opt) => (
                <div
                  key={opt.id}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onSelect(opt)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
