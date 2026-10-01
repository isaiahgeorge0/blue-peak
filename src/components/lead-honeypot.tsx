import { LEAD_HONEYPOT_FIELD } from "@/lib/lead-limits";

type LeadHoneypotProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

/** Visually hidden trap field; /api/leads drops submissions that fill it. */
export function LeadHoneypot({ id, value, onChange }: LeadHoneypotProps) {
  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={id}>Company</label>
      <input
        id={id}
        name={LEAD_HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
