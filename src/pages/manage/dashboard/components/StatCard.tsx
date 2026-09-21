type Props = {
  label: string;
  value: string;
  icon: string;
  tone?: "primary" | "accent" | "secondary";
  sub?: string;
};

const toneBg: Record<string, string> = {
  primary: "bg-primary-100 text-primary-700",
  accent: "bg-accent-100 text-accent-700",
  secondary: "bg-secondary-100 text-secondary-700",
};

export default function StatCard({ label, value, icon, tone = "primary", sub }: Props) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-4 md:p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-foreground-500 font-medium">{label}</div>
        <div className="mt-2 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-foreground-500">{sub}</div>}
      </div>
      <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${toneBg[tone]}`}>
        <i className={`${icon} text-xl`}></i>
      </div>
    </div>
  );
}