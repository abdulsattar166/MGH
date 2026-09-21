import type { FeeTrendPoint } from "@/hooks/useFeeTrend";

type Props = {
  data: FeeTrendPoint[];
};

export default function FeeTrendChart({ data }: Props) {
  const max = Math.max(...data.map((f) => f.expected), 1);

  return (
    <div className="bg-background-50 border border-background-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-base font-bold text-foreground-950">Fee Collection</h3>
        <span className="text-xs text-foreground-500">Last 6 months (PKR)</span>
      </div>

      {data.length === 0 ? (
        <div className="py-16 text-center text-foreground-500">
          <i className="ri-money-rupee-circle-line text-4xl block mb-3"></i>
          No fee data yet.
        </div>
      ) : (
        <div className="flex items-end gap-3 h-48">
          {data.map((f) => {
            const collectedH = Math.round((f.collected / max) * 100);
            const expectedH = Math.round((f.expected / max) * 100);
            return (
              <div key={f.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col justify-end h-40 gap-1">
                  <div
                    className="w-full rounded-t bg-background-300"
                    style={{ height: `${expectedH}%` }}
                    title={`Expected: ${f.expected}`}
                  ></div>
                  <div
                    className="w-full rounded-t bg-primary-500"
                    style={{ height: `${collectedH}%` }}
                    title={`Collected: ${f.collected}`}
                  ></div>
                </div>
                <span className="text-xs text-foreground-500">{f.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 text-xs text-foreground-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-primary-500"></span> Collected
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-background-300"></span> Expected
        </span>
      </div>
    </div>
  );
}