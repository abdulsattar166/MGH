import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useHostels } from "@/hooks/useHostels";
import StudentFormModal from "@/pages/manage/students/components/StudentFormModal";
import ConfirmDialog from "@/pages/manage/students/components/ConfirmDialog";
import DataState from "@/pages/manage/components/DataState";

const statusTone: Record<string, string> = {
  Active: "bg-primary-100 text-primary-800",
  Notice: "bg-accent-100 text-accent-800",
  Left: "bg-background-200 text-foreground-500",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-foreground-400 uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground-900">
        {value || "—"}
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hostels } = useHostels();
  const {
    students,
    loading,
    error,
    reload,
    updateStudent,
    deleteStudent,
  } = useStudents();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const student = students.find((s) => s.id === Number(id));

  const isWarden = user?.role === "warden";
  const allowed = !isWarden || student?.hostelId === user?.hostelId;
  const current = student && allowed ? student : null;

  if (loading || error) {
    return <DataState loading={loading} error={error} onRetry={reload} />;
  }

  if (!current) {
    return (
      <div className="py-20 text-center">
        <i className="ri-user-search-line text-4xl text-foreground-300"></i>
        <p className="mt-3 text-sm text-foreground-500">Student not found.</p>
        <Link
          to="/manage/students"
          className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
        >
          ← Back to students
        </Link>
      </div>
    );
  }

  const hostel = hostels.find((h) => h.id === current.hostelId);

  const handleDelete = async () => {
    const result = await deleteStudent(current.id);
    if (result.error) {
      setActionError(result.error);
      setDeleteOpen(false);
      return;
    }
    navigate("/manage/students");
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/manage/students"
        className="inline-flex items-center gap-2 text-sm text-foreground-600 hover:text-primary-600 cursor-pointer"
      >
        <i className="ri-arrow-left-line"></i>
        Back to students
      </Link>

      {actionError && (
        <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
          {actionError}
        </div>
      )}

      {/* Profile header */}
      <div className="bg-background-50 border border-background-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-2xl font-bold shrink-0">
          {current.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-foreground-950">
              {current.name}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone[current.status]}`}
            >
              {current.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground-600">
            {current.program} · {current.university}
          </p>
          <p className="text-xs text-foreground-400 mt-0.5">{hostel?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
          >
            <i className="ri-pencil-line"></i>
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent-600 hover:bg-accent-700 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-delete-bin-line"></i>
            Delete
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-background-50 border border-background-200 rounded-2xl p-6">
          <h4 className="font-heading font-bold text-foreground-950 mb-4">Personal Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Father's Name" value={current.fatherName} />
            <InfoRow label="CNIC" value={current.cnic} />
            <InfoRow label="Phone" value={current.phone} />
            <InfoRow label="Guardian Phone" value={current.guardianPhone} />
            <InfoRow label="Join Date" value={current.joinDate} />
          </div>
        </div>

        <div className="bg-background-50 border border-background-200 rounded-2xl p-6">
          <h4 className="font-heading font-bold text-foreground-950 mb-4">Room & Fees</h4>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Room" value={current.room} />
            <InfoRow label="Bed" value={String(current.bed)} />
            <InfoRow label="Room Type" value={current.roomType} />
            <InfoRow label="Monthly Fee" value={`PKR ${current.monthlyFee.toLocaleString()}`} />
          </div>
        </div>
      </div>

      {/* Academics */}
      <div className="bg-background-50 border border-background-200 rounded-2xl p-6">
        <h4 className="font-heading font-bold text-foreground-950 mb-4">Academics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="University" value={current.university} />
          <InfoRow label="Program" value={current.program} />
        </div>
      </div>

      <StudentFormModal
        open={editOpen}
        initial={current}
        lockedHostelId={isWarden ? current.hostelId : null}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          const result = await updateStudent(current.id, data);
          if (result.error) {
            setActionError(result.error);
          }
          setEditOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete student?"
        message={`This will permanently remove ${current.name} from the records.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}