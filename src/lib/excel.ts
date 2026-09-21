import * as XLSX from "xlsx";

// ---------- cell helpers ----------

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function getCell(row: Record<string, unknown>, aliases: string[]): string {
  for (const key of Object.keys(row)) {
    if (aliases.includes(normalizeHeader(key))) return cellToString(row[key]);
  }
  return "";
}

function toNumber(v: string): number | null {
  const cleaned = v.trim().replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Excel serial date number
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 60000) {
      return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
    }
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

// ---------- raw parsed shapes ----------

export type StudentRaw = {
  rowNumber: number;
  name: string;
  fatherName: string;
  cnic: string;
  phone: string;
  hostelRaw: string;
  room: string;
  bed: number | null;
  roomType: string;
  university: string;
  program: string;
  guardianPhone: string;
  joinDate: string | null;
  monthlyFee: number | null;
  status: string;
};

export type RoomRaw = {
  rowNumber: number;
  hostelRaw: string;
  roomNumber: string;
  floor: number | null;
  roomType: string;
  capacity: number | null;
  buildingRaw: string;
  blockRaw: string;
  status: string;
};

// ---------- column aliases (normalized header -> field) ----------

const STUDENT_ALIASES: Record<keyof Omit<StudentRaw, "rowNumber">, string[]> = {
  name: ["name", "studentname", "fullname", "student"],
  fatherName: ["fathername", "father", "fathersname", "guardianname"],
  cnic: ["cnic", "nic", "nicnumber", "nationalid", "idcard", "idcardnumber"],
  phone: ["phone", "mobilenumber", "mobile", "contact", "phonenumber", "contactnumber", "cell"],
  hostelRaw: ["hostel", "hostelname", "hostel"],
  room: ["room", "roomnumber", "roomno"],
  bed: ["bed", "bednumber", "bedno"],
  roomType: ["roomtype", "type"],
  university: ["university", "institute", "college"],
  program: ["program", "programme", "degree", "discipline"],
  guardianPhone: ["guardianphone", "guardiancontact", "guardiannumber", "parentphone", "fatherphone"],
  joinDate: ["joindate", "admissiondate", "dateofadmission", "doa", "joiningdate"],
  monthlyFee: ["monthlyfee", "fee", "rent", "monthlyrent", "feepermonth", "amount"],
  status: ["status"],
};

const ROOM_ALIASES: Record<keyof Omit<RoomRaw, "rowNumber">, string[]> = {
  hostelRaw: ["hostel", "hostelname"],
  roomNumber: ["roomnumber", "roomno", "room", "number", "roomname"],
  floor: ["floor", "floorno", "floornumber"],
  roomType: ["roomtype", "type"],
  capacity: ["capacity", "beds", "totalbeds", "seats", "seater", "seaters", "bedsperroom"],
  buildingRaw: ["building", "buildingname"],
  blockRaw: ["block", "blockname"],
  status: ["status"],
};

// ---------- parse + map ----------

export function parseExcelFile(buf: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
}

export function mapStudents(rows: Record<string, unknown>[]): StudentRaw[] {
  return rows.map((row, i) => ({
    rowNumber: i + 2,
    name: getCell(row, STUDENT_ALIASES.name),
    fatherName: getCell(row, STUDENT_ALIASES.fatherName),
    cnic: getCell(row, STUDENT_ALIASES.cnic),
    phone: getCell(row, STUDENT_ALIASES.phone),
    hostelRaw: getCell(row, STUDENT_ALIASES.hostelRaw),
    room: getCell(row, STUDENT_ALIASES.room),
    bed: toNumber(getCell(row, STUDENT_ALIASES.bed)),
    roomType: getCell(row, STUDENT_ALIASES.roomType),
    university: getCell(row, STUDENT_ALIASES.university),
    program: getCell(row, STUDENT_ALIASES.program),
    guardianPhone: getCell(row, STUDENT_ALIASES.guardianPhone),
    joinDate: toDate(getCell(row, STUDENT_ALIASES.joinDate)),
    monthlyFee: toNumber(getCell(row, STUDENT_ALIASES.monthlyFee)),
    status: getCell(row, STUDENT_ALIASES.status),
  }));
}

export function mapRooms(rows: Record<string, unknown>[]): RoomRaw[] {
  return rows.map((row, i) => ({
    rowNumber: i + 2,
    hostelRaw: getCell(row, ROOM_ALIASES.hostelRaw),
    roomNumber: getCell(row, ROOM_ALIASES.roomNumber),
    floor: toNumber(getCell(row, ROOM_ALIASES.floor)),
    roomType: getCell(row, ROOM_ALIASES.roomType),
    capacity: toNumber(getCell(row, ROOM_ALIASES.capacity)),
    buildingRaw: getCell(row, ROOM_ALIASES.buildingRaw),
    blockRaw: getCell(row, ROOM_ALIASES.blockRaw),
    status: getCell(row, ROOM_ALIASES.status),
  }));
}

// ---------- template download ----------

const STUDENT_HEADERS = [
  "Name",
  "Father Name",
  "CNIC",
  "Phone",
  "Hostel",
  "Room",
  "Bed",
  "Room Type",
  "University",
  "Program",
  "Guardian Phone",
  "Join Date",
  "Monthly Fee",
  "Status",
];
const STUDENT_SAMPLE = [
  "Hamza Ahmed",
  "Ahmed Raza",
  "61101-2345678-1",
  "0300-1110001",
  "Jinnah Boys House",
  "A1",
  "1",
  "3-Seater Comfort",
  "Bahria University",
  "BS Computer Science",
  "0300-2220001",
  "2026-01-01",
  "22000",
  "Active",
];

const ROOM_HEADERS = [
  "Hostel",
  "Room Number",
  "Floor",
  "Room Type",
  "Capacity",
  "Building",
  "Block",
  "Status",
];
const ROOM_SAMPLE = [
  "Jinnah Boys House",
  "A1",
  "1",
  "3-Seater Comfort",
  "3",
  "Building 1",
  "Block A",
  "active",
];

export function downloadTemplate(kind: "students" | "rooms"): void {
  const headers = kind === "students" ? STUDENT_HEADERS : ROOM_HEADERS;
  const sample = kind === "students" ? STUDENT_SAMPLE : ROOM_SAMPLE;
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${kind}-import-template.xlsx`);
}