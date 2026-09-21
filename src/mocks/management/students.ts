export type Student = {
  id: number;
  name: string;
  fatherName: string;
  cnic: string;
  phone: string;
  hostelId: number;
  room: string;
  bed: number;
  roomType: string;
  university: string;
  program: string;
  guardianPhone: string;
  joinDate: string;
  monthlyFee: number;
  status: "Active" | "Notice" | "Left";
};