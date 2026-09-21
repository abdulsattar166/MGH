import { useEffect, useState, type FormEvent } from "react";
import { roomTypes } from "@/mocks/management/rooms";

export type RoomFormValues = {
  roomNumber: string;
  floor: number;
  roomType: string;
  capacity: number;
  status: string;
};

type Props = {
  open: boolean;
  initial: { number: string; floor: number; type: string; capacity: number; status: string } | null;
  onClose: () => void;
  onSave: (data: RoomFormValues) => void;
};

const inputClass =
  "w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400";

export default function RoomFormModal({ open, initial, onClose, onSave }: Props) {
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [roomType, setRoomType] = useState("3-Seater Comfort");
  const [capacity, setCapacity] = useState(3);
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setRoomNumber(initial.number);
      setFloor(initial.floor);
      setRoomType(initial.type);
      setCapacity(initial.capacity);
      setStatus(initial.status);
    } else {
      setRoomNumber("");
      setFloor(1);
      setRoomType("3-Seater Comfort");
      setCapacity(3);
      setStatus("active");
    }
    setError("");
  }, [open, initial]);

  if (!open) return null;

  const onTypeChange = (type: string) => {
    setRoomType(type);
    setCapacity(roomTypes.find((r) => r.type === type)?.capacity ?? 3);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError("Room number is required.");
      return;
    }
    onSave({ roomNumber: roomNumber.trim(), floor, roomType, capacity, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-background-50 rounded-2xl border border-background-200">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground-950">
              {initial ? "Edit Room" : "Add Room"}
            </h2>
            <p className="text-xs text-foreground-500">
              {initial ? "Update room details & capacity" : "Create a new room for this hostel"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Room Number <span className="text-accent-600">*</span>
            </label>
            <input
              className={inputClass}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. A1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Floor</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Room Type</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={roomType}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              {roomTypes.map((r) => (
                <option key={r.type} value={r.type}>
                  {r.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Capacity (beds)
            </label>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={10}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Status</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              {initial ? "Save Changes" : "Add Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}