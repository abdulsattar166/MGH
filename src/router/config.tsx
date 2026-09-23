import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/home/page";
import About from "@/pages/about/page";
import Hostels from "@/pages/hostels/page";
import Gallery from "@/pages/gallery/page";
import Contact from "@/pages/contact/page";
import Booking from "@/pages/booking/page";
import HostelLayout from "@/pages/hostel/HostelLayout";
import HostelHome from "@/pages/hostel/home/page";
import HostelRooms from "@/pages/hostel/rooms/page";
import HostelGallery from "@/pages/hostel/gallery/page";
import HostelContact from "@/pages/hostel/contact/page";
import HostelNotices from "@/pages/hostel/notices/page";
import WardenLogin from "@/pages/hostel/warden-login/page";
import ManageLogin from "@/pages/manage/login/page";
import ResetPassword from "@/pages/manage/reset-password/page";
import ManagementLayout from "@/pages/manage/ManagementLayout";
import Dashboard from "@/pages/manage/dashboard/page";
import Students from "@/pages/manage/students/page";
import StudentDetail from "@/pages/manage/students/detail/page";
import Rooms from "@/pages/manage/rooms/page";
import Bookings from "@/pages/manage/bookings/page";
import Attendance from "@/pages/manage/attendance/page";
import Fees from "@/pages/manage/fees/page";
import Visitors from "@/pages/manage/visitors/page";
import Settings from "@/pages/manage/settings/page";
import Complaints from "@/pages/manage/complaints/page";
import Improvements from "@/pages/manage/improvements/page";
import Notices from "@/pages/manage/notices/page";
import Reports from "@/pages/manage/reports/page";
import ManageHostels from "@/pages/manage/hostels/page";
import Wardens from "@/pages/manage/wardens/page";
import AuditLogs from "@/pages/manage/audit-logs/page";
import BuildingsPage from "@/pages/manage/buildings/page";
import BlocksPage from "@/pages/manage/blocks/page";
import ImportPage from "@/pages/manage/import/page";
import ComplaintPage from "@/pages/complaint/page";
import MyComplaints from "@/pages/my-complaints/page";
import TrackBooking from "@/pages/track-booking/page";
import Suggest from "@/pages/suggest/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/complaint",
    element: <ComplaintPage />,
  },
  {
    path: "/suggest",
    element: <Suggest />,
  },
  {
    path: "/my-complaints",
    element: <MyComplaints />,
  },
  {
    path: "/track-booking",
    element: <TrackBooking />,
  },
  {
    path: "/hostel/:id",
    element: <HostelLayout />,
    children: [
      { index: true, element: <HostelHome /> },
      { path: "rooms", element: <HostelRooms /> },
      { path: "gallery", element: <HostelGallery /> },
      { path: "notices", element: <HostelNotices /> },
      { path: "contact", element: <HostelContact /> },
      { path: "warden-login", element: <WardenLogin /> },
    ],
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/hostels",
    element: <Hostels />,
  },
  {
    path: "/gallery",
    element: <Gallery />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/booking",
    element: <Booking />,
  },
  {
    path: "/manage/login",
    element: <ManageLogin />,
  },
  {
    path: "/manage/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/manage",
    element: <ManagementLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "students", element: <Students /> },
      { path: "students/:id", element: <StudentDetail /> },
      { path: "rooms", element: <Rooms /> },
      { path: "bookings", element: <Bookings /> },
      { path: "fees", element: <Fees /> },
      { path: "attendance", element: <Attendance /> },
      { path: "visitors", element: <Visitors /> },
      { path: "complaints", element: <Complaints /> },
      { path: "improvements", element: <Improvements /> },
      { path: "notices", element: <Notices /> },
      { path: "reports", element: <Reports /> },
      { path: "hostels", element: <ManageHostels /> },
      { path: "buildings", element: <BuildingsPage /> },
      { path: "blocks", element: <BlocksPage /> },
      { path: "import", element: <ImportPage /> },
      { path: "wardens", element: <Wardens /> },
      { path: "audit-logs", element: <AuditLogs /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;