import { useEffect, useState } from "react";
import {
  parseExcelFile,
  mapStudents,
  mapRooms,
  downloadTemplate,
} from "@/lib/excel";
import {
  fetchHostelRefs,
  fetchStructureRefs,
  validateStudents,
  validateRooms,
  bulkInsertStudents,
  bulkInsertRooms,
  type HostelRef,
  type BuildingRef,
  type BlockRef,
  type StudentValidation,
  type RoomValidation,
} from "@/lib/importDb";
import { logAudit } from "@/lib/auditLogs";
import FileDropzone from "./components/FileDropzone";
import ImportPreview, { type PreviewRow } from "./components/ImportPreview";

type Mode = "students" | "rooms";

const STUDENT_COLS = [
  "Name",
  "Father",
  "CNIC",
  "Phone",
  "Hostel",
  "Room",
  "Bed",
  "Type",
  "Fee",
  "Status",
];
const ROOM_COLS = ["Hostel", "Room", "Floor", "Type", "Capacity", "Building", "Block", "Status"];

export default function ImportPage() {
  const [mode, setMode] = useState<Mode>("students");

  const [hostels, setHostels] = useState<HostelRef[]>([]);
  const [structure, setStructure] = useState<{ buildings: BuildingRef[]; blocks: BlockRef[] }>({
    buildings: [],
    blocks: [],
  });
  const [refsLoading, setRefsLoading] = useState(true);
  const [refsError, setRefsError] = useState("");

  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [columns, setColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [studentRows, setStudentRows] = useState<StudentValidation[]>([]);
  const [roomRows, setRoomRows] = useState<RoomValidation[]>([]);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    beds?: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([fetchHostelRefs(), fetchStructureRefs()]);
        setHostels(h);
        setStructure(s);
      } catch (e) {
        setRefsError((e as Error).message);
      } finally {
        setRefsLoading(false);
      }
    })();
  }, []);

  const hostelName = (id: number) => hostels.find((h) => h.id === id)?.name ?? "—";
  const buildingName = (id: number | null) =>
    id ? structure.buildings.find((b) => b.id === id)?.name ?? "—" : "—";
  const blockName = (id: number | null) =>
    id ? structure.blocks.find((b) => b.id === id)?.name ?? "—" : "—";

  const resetPreview = () => {
    setFileName("");
    setPreviewRows([]);
    setColumns([]);
    setStudentRows([]);
    setRoomRows([]);
    setImportResult(null);
    setImportError("");
    setParseError("");
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    resetPreview();
  };

  const handleFile = async (file: File) => {
    resetPreview();
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const rows = parseExcelFile(buf);
      if (!rows.length) {
        setParseError("This file has no data rows. Check that the first row contains column headers.");
        return;
      }
      if (mode === "students") {
        const validated = await validateStudents(mapStudents(rows), hostels);
        setStudentRows(validated);
        setColumns(STUDENT_COLS);
        setPreviewRows(
          validated.map((r) => ({
            rowNumber: r.rowNumber,
            cells: [
              r.name,
              r.fatherName,
              r.cnic,
              r.phone,
              hostelName(r.hostelId),
              r.room,
              String(r.bed),
              r.roomType,
              String(r.monthlyFee),
              r.status,
            ],
            errors: r.errors,
          })),
        );
      } else {
        const validated = await validateRooms(
          mapRooms(rows),
          hostels,
          structure.buildings,
          structure.blocks,
        );
        setRoomRows(validated);
        setColumns(ROOM_COLS);
        setPreviewRows(
          validated.map((r) => ({
            rowNumber: r.rowNumber,
            cells: [
              hostelName(r.hostelId),
              r.roomNumber,
              String(r.floor),
              r.roomType,
              String(r.capacity),
              buildingName(r.buildingId),
              blockName(r.blockId),
              r.status,
            ],
            errors: r.errors,
          })),
        );
      }
    } catch (e) {
      setParseError((e as Error).message || "Could not read this file. Please upload a valid spreadsheet.");
    } finally {
      setParsing(false);
    }
  };

  const validCount = previewRows.filter((r) => r.errors.length === 0).length;

  const handleImport = async () => {
    setImportError("");
    if (mode === "students") {
      const valid = studentRows.filter((r) => r.errors.length === 0);
      if (!valid.length) return;
      setImporting(true);
      try {
        const { inserted } = await bulkInsertStudents(valid);
        setImportResult({ inserted, skipped: studentRows.length - inserted });
        void logAudit({
          action: "students.imported",
          resource: "students",
          details: `Imported ${inserted} students from ${fileName}`,
        });
      } catch (e) {
        setImportError((e as Error).message || "Import failed.");
      } finally {
        setImporting(false);
      }
    } else {
      const valid = roomRows.filter((r) => r.errors.length === 0);
      if (!valid.length) return;
      setImporting(true);
      try {
        const { inserted, bedsCreated } = await bulkInsertRooms(valid);
        setImportResult({ inserted, skipped: roomRows.length - inserted, beds: bedsCreated });
        void logAudit({
          action: "rooms.imported",
          resource: "rooms",
          details: `Imported ${inserted} rooms from ${fileName}`,
        });
      } catch (e) {
        setImportError((e as Error).message || "Import failed.");
      } finally {
        setImporting(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-500">
            Bulk-load students or rooms from your existing spreadsheets. Records are
            validated and previewed before anything is saved.
          </p>
        </div>
        <button
          onClick={() => downloadTemplate(mode)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
        >
          <i className="ri-download-2-line text-lg"></i>
          Download template
        </button>
      </div>

      {/* Segmented control */}
      <div className="inline-flex items-center gap-1 bg-background-100 rounded-full px-1 py-1">
        <button
          onClick={() => switchMode("students")}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
            mode === "students"
              ? "bg-primary-500 text-background-50"
              : "text-foreground-600 hover:text-foreground-900"
          }`}
        >
          Students
        </button>
        <button
          onClick={() => switchMode("rooms")}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
            mode === "rooms"
              ? "bg-primary-500 text-background-50"
              : "text-foreground-600 hover:text-foreground-900"
          }`}
        >
          Rooms
        </button>
      </div>

      {refsError && (
        <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
          Could not load hostels/structure: {refsError}
        </div>
      )}

      {/* No file selected */}
      {!fileName && !parsing && (
        <div className="space-y-5">
          {refsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-xl"></i>
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <>
              <FileDropzone onFile={handleFile} />

              <div className="bg-background-50 border border-background-200 rounded-lg p-5">
                <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">
                  Expected columns {mode === "students" ? "(Students)" : "(Rooms)"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(mode === "students" ? STUDENT_COLS : ROOM_COLS).map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-900 text-xs font-medium whitespace-nowrap"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-foreground-500 mt-4">
                  Column headers are matched flexibly (e.g. "Student Name", "Father's Name",
                  "Mobile Number" are all recognised). Only{" "}
                  <strong className="text-foreground-800">
                    {mode === "students" ? "Name and Hostel" : "Room Number and Hostel"}
                  </strong>{" "}
                  are required — everything else is filled with sensible defaults.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {parsing && (
        <div className="flex items-center justify-center gap-2 py-16 text-foreground-500">
          <i className="ri-loader-4-line animate-spin text-xl"></i>
          <span className="text-sm">Reading {fileName}…</span>
        </div>
      )}

      {parseError && !parsing && (
        <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
          {parseError}
        </div>
      )}

      {/* Preview + import */}
      {!parsing && previewRows.length > 0 && !importResult && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-foreground-600">
              Previewing <strong className="text-foreground-900">{fileName}</strong>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={resetPreview}
                className="px-4 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
              >
                Choose another file
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
              >
                {importing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                    Importing…
                  </>
                ) : (
                  <>
                    <i className="ri-upload-cloud-2-line text-lg"></i>
                    Import {validCount} record{validCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>

          {importError && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
              {importError}
            </div>
          )}

          <ImportPreview columns={columns} rows={previewRows} />
        </div>
      )}

      {/* Result */}
      {importResult && (
        <div className="bg-background-50 border border-background-200 rounded-lg p-8 text-center">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-secondary-100 text-secondary-700 mb-4">
            <i className="ri-checkbox-circle-line text-3xl"></i>
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground-950">
            Import complete
          </h3>
          <p className="text-sm text-foreground-600 mt-1">
            {importResult.inserted} record{importResult.inserted !== 1 ? "s" : ""} added
            {importResult.beds !== undefined && (
              <> · {importResult.beds} bed{importResult.beds !== 1 ? "s" : ""} created</>
            )}
            {importResult.skipped > 0 && (
              <> · {importResult.skipped} skipped (had errors)</>
            )}
          </p>
          <button
            onClick={resetPreview}
            className="mt-5 px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}