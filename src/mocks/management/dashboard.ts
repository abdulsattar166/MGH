export type Activity = {
  id: number;
  type: "student" | "fee" | "complaint" | "visitor" | "attendance";
  text: string;
  time: string;
};

export const feeTrend = [
  { month: "Mar", collected: 720000, expected: 860000 },
  { month: "Apr", collected: 785000, expected: 860000 },
  { month: "May", collected: 802000, expected: 860000 },
  { month: "Jun", collected: 690000, expected: 860000 },
  { month: "Jul", collected: 810000, expected: 860000 },
  { month: "Aug", collected: 748000, expected: 860000 },
];

export const recentActivity: Activity[] = [
  { id: 1, type: "student", text: "Waqar Ahmed checked out of Mubarak Hostel 06 — Bahria Town", time: "2h ago" },
  { id: 2, type: "fee", text: "Fee payment of PKR 22,000 recorded for Hamza Ahmed", time: "4h ago" },
  { id: 3, type: "complaint", text: "New complaint: 'AC not cooling' in Jinnah Hostel, Room 102", time: "6h ago" },
  { id: 4, type: "visitor", text: "Visitor 'Abdul Rehman' checked in at Sama Hostel", time: "8h ago" },
  { id: 5, type: "attendance", text: "Morning check-in completed for 18 residents", time: "12h ago" },
  { id: 6, type: "student", text: "Saad Anwar moved into Mubarak Hostel 06 — Bahria Town", time: "1d ago" },
  { id: 7, type: "fee", text: "Notice sent to Shahzaib Khan for pending dues", time: "1d ago" },
  { id: 8, type: "complaint", text: "Complaint resolved: 'Leaky tap' in Abdul Qadir Hostel", time: "2d ago" },
];

export const complaintsSummary = [
  { status: "Open", count: 6, color: "accent" },
  { status: "In Progress", count: 4, color: "secondary" },
  { status: "Resolved", count: 38, color: "primary" },
];

export const attendanceToday = {
  present: 18,
  total: 20,
  onLeave: 1,
  absent: 1,
};

export const visitorsToday = {
  checkedIn: 5,
  checkedOut: 7,
  currentlyInside: 3,
};