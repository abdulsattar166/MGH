import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useHostels } from "@/hooks/useHostels";
import type { Student } from "@/mocks/management/students";
import StudentTable from "./components/StudentTable";
import StudentFormModal from "./components/StudentFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import DataState from "@/pages/manage/components/DataState";

export default function Students() {
  const { user } = useAuth();
  const { hostels } = useHostels();
  const {
    students,
    loading,
    error,
    reload,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [actionError, setActionError] = useState("");

  const isWarden = user?.role === "warden";
  const scopedHostelId = isWarden ? (user?.hostelId ?? null) : null;

  const visible = useMemo(() => {
    return students.filter((s) => {
      if (scopedHostelId !== null && s.hostelId !== scopedHostelId) return false;
      if (hostelFilter !== "All" && String(s.hostelId) !== hostelFilter) return false;
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay =
          `${s.name} ${s.fatherName} ${s.cnic} ${s.phone} ${s.university} ${s.program} ${s.room}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, query, statusFilter, hostelFilter, scopedHostelId]);

  const openAdd = () => {
    setEditing(null);
    setActionError("");
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setActionError("");
    setModalOpen(true);
  };

  const handleSave = async (data: Omit<Student, "id">) => {
    const result = editing
      ? await updateStudent(editing.id, data)
      : await addStudent(data);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const result = await deleteStudent(deleting.id);
    if (result.error) {
      setActionError(result.error);
    }
    setDeleting(null);
  };

  const activeCount = visible.filter((s) => s.status !== "Left").length;

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-500">
              {visible.length} record{visible.length !== 1 ? "s" : ""} · {activeCount} active
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-add-line text-lg"></i>
            Add Student
          </button>
        </div>

        {actionError && (
          <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, CNIC, phone, university…"
              className="w-full pl-9 pr-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Notice">Notice</option>
            <option value="Left">Left</option>
          </select>
          {!isWarden && (
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
            >
              <option value="All">All Hostels</option>
              {hostels.map((h) => (
                <option key={h.id} value={String(h.id)}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <StudentTable
          students={visible}
          onView={(s) => navigate(`/manage/students/${s.id}`)}
          onEdit={openEdit}
          onDelete={(s) => setDeleting(s)}
        />

        <StudentFormModal
          open={modalOpen}
          initial={editing}
          lockedHostelId={scopedHostelId}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete student?"
          message={`This will permanently remove ${deleting?.name ?? "this student"} from the records.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      </div>
    </DataState>
  );
}