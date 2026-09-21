export type PreviewRow = { rowNumber: number; cells: string[]; errors: string[] };

type Props = {
  columns: string[];
  rows: PreviewRow[];
};

export default function ImportPreview({ columns, rows }: Props) {
  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-foreground-700">
          <strong className="text-foreground-950">{rows.length}</strong> rows parsed
        </span>
        <span className="flex items-center gap-1.5 text-secondary-700">
          <i className="ri-checkbox-circle-line"></i> {validCount} ready
        </span>
        <span className="flex items-center gap-1.5 text-accent-700">
          <i className="ri-error-warning-line"></i> {errorCount} with errors
        </span>
      </div>

      <div className="border border-background-200 rounded-lg overflow-hidden">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-foreground-500 whitespace-nowrap">
                  #
                </th>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left text-xs font-semibold text-foreground-500 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs font-semibold text-foreground-500 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.rowNumber}
                  className={`border-t border-background-100 ${
                    r.errors.length ? "bg-accent-100/40" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-foreground-400 whitespace-nowrap">
                    {r.rowNumber}
                  </td>
                  {r.cells.map((c, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 text-foreground-700 whitespace-nowrap max-w-[200px] truncate"
                    >
                      {c || "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.errors.length ? (
                      <span className="inline-flex items-center gap-1 text-accent-700 text-xs font-semibold">
                        <i className="ri-error-warning-line"></i> {r.errors.length} error
                        {r.errors.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-secondary-700 text-xs font-semibold">
                        <i className="ri-checkbox-circle-line"></i> Ready
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="border border-accent-200 bg-accent-100/40 rounded-lg p-4">
          <h4 className="font-heading text-sm font-bold text-foreground-950 mb-2 flex items-center gap-2">
            <i className="ri-error-warning-line text-accent-700"></i> Validation errors
          </h4>
          <ul className="space-y-1.5 max-h-48 overflow-auto text-sm">
            {rows
              .filter((r) => r.errors.length)
              .map((r) => (
                <li key={r.rowNumber} className="text-foreground-700">
                  <span className="font-semibold text-foreground-900">Row {r.rowNumber}:</span>{" "}
                  {r.errors.join("; ")}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}