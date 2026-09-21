type OccupancyDatum = {
  label: string;
  occupied: number;
  total: number;
};

type Props = {
  data: OccupancyDatum[];
  title: string;
};

export default function OccupancyChart({ data, title }: Props) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-base font-bold text-foreground-950">{title}</h3>
        <span className="text-xs text-foreground-500">Occupancy rate</span>
      </div>

      <div className="space-y-4">
        {data.map((d) => {
          const pct = Math.round((d.occupied / d.total) * 100);
          return (
            <div key={d.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground-700 truncate">{d.label}</span>
                <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">
                  {pct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-background-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <div className="mt-1 text-[11px] text-foreground-400">
                {d.occupied} of {d.total} beds occupied
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}