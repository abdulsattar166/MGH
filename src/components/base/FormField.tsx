type Props = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "select" | "textarea";
  value?: string;
  onChange?: (value: string) => void;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  hint?: string;
};

const baseClass =
  "w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400";

export default function FormField({
  name,
  label,
  type = "text",
  value = "",
  onChange,
  options = [],
  placeholder,
  required,
  maxLength,
  rows = 4,
  hint,
}: Props) {
  const handleChange = (next: string) => {
    onChange?.(next);
  };

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-foreground-800 mb-1.5"
      >
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>

      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          required={required}
          onChange={(e) => handleChange(e.target.value)}
          className={`${baseClass} cursor-pointer`}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          required={required}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          className={`${baseClass} resize-none`}
        ></textarea>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          className={baseClass}
        />
      )}

      {hint && <div className="mt-1 text-xs text-foreground-400">{hint}</div>}
    </div>
  );
}