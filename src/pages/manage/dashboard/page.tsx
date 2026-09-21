import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useFeeTrend } from "@/hooks/useFeeTrend";
import { useComplaints } from "@/hooks/useComplaints";
import { useHostels } from "@/hooks/useHostels";
import { useOccupancy } from "@/hooks/useOccupancy";
import StatCard from "./components/StatCard";
import OccupancyChart from "./components/OccupancyChart";
import FeeTrendChart from "./components/FeeTrendChart";
import ComplaintsWidget from "./components/ComplaintsWidget";
import ActivityFeed from "./components/ActivityFeed";
import RecentStudents from "./components/RecentStudents";
import BookingRequests from "./components/BookingRequests";
import DataState from "@/pages/manage/components/DataState";

export default function Dashboard() {
  const { user } = useAuth();
  const { students, loading, error, reload } = useStudents();
  const { complaints } = useComplaints();
  const { hostels } = useHostels();

  const isHostelAdmin = user?.role === "warden";
  const scopedHostels = isHostelAdmin
    ? hostels.filter((h) => h.id === user.hostelId)
    : hostels;

  const hostelIds = scopedHostels.map((h) => h.id);
  const { data: occupancy } = useOccupancy(hostelIds);

  const scopedStudents = isHostelAdmin
    ? students.filter((s) => s.hostelId === user.hostelId)
    : students;

  const activeCount = scopedStudents.filter((s) => s.status !== "Left").length;
  const activeStudents = scopedStudents.filter((s) => s.status !== "Left");
  const expectedPerMonth = activeStudents.reduce((s, st) => s + st.monthlyFee, 0);

  const {
    trend,
    currentCollected,
    currentExpected,
    loading: feeLoading,
    error: feeError,
    reload: reloadFees,
  } = useFeeTrend(expectedPerMonth);

  const totalBeds = scopedHostels.reduce(
    (s, h) => s + (occupancy[h.id]?.totalBeds ?? 0),
    0
  );
  const occupiedBeds = scopedHostels.reduce(
    (s, h) => s + (occupancy[h.id]?.occupiedBeds ?? 0),
    0
  );
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const occupancyData = scopedHostels.map((h) => ({
    label: h.name,
    occupied: occupancy[h.id]?.occupiedBeds ?? 0,
    total: occupancy[h.id]?.totalBeds ?? 0,
  }));

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "short" });

  const openComplaints = complaints.filter(
    (c) => c.status === "Pending" || c.status === "Under Review" || c.status === "Assigned"
  ).length;
  const inProgressComplaints = complaints.filter((c) => c.status === "In Progress").length;

  const loadingAll = loading || feeLoading;
  const loadError = error || feeError;
  const retry = () => {
    reload();
    reloadFees();
  };

  return (
    <DataState loading={loadingAll} error={loadError} onRetry={retry}>
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label={isHostelAdmin ? "My Students" : "Total Students"}
            value={String(activeCount)}
            icon="ri-group-line"
            tone="primary"
            sub={isHostelAdmin ? "in your hostel" : "across all hostels"}
          />
          <StatCard
            label={isHostelAdmin ? "My Hostel Occupancy" : "Avg Occupancy"}
            value={`${occupancyPct}%`}
            icon="ri-door-open-line"
            tone="secondary"
            sub={`${occupiedBeds} of ${totalBeds} beds filled`}
          />
          <StatCard
            label={`Collected (${monthLabel})`}
            value={`PKR ${(currentCollected / 1000).toFixed(0)}K`}
            icon="ri-money-rupee-circle-line"
            tone="accent"
            sub={`of PKR ${(currentExpected / 1000).toFixed(0)}K expected`}
          />
          <StatCard
            label="Open Complaints"
            value={String(openComplaints)}
            icon="ri-tools-line"
            tone="accent"
            sub={`${inProgressComplaints} currently in progress`}
          />
        </div>

        {/* New booking requests */}
        <BookingRequests />

        {/* Occupancy + complaints */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OccupancyChart
              title={isHostelAdmin ? "My Hostel Occupancy" : "Occupancy by Hostel"}
              data={occupancyData}
            />
          </div>
          <ComplaintsWidget />
        </div>

        {/* Fee trend + activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FeeTrendChart data={trend} />
          </div>
          <ActivityFeed />
        </div>

        {/* Recent students */}
        <RecentStudents students={scopedStudents} />
      </div>
    </DataState>
  );
}