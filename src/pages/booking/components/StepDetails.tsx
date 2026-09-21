import type { ReactNode } from "react";
import FormField from "@/components/base/FormField";
import {
  type Applicant,
  DURATION_OPTIONS,
  GENDER_OPTIONS,
  PROVINCE_OPTIONS,
  RELATION_OPTIONS,
} from "@/lib/booking";

type Props = {
  form: Applicant;
  onChange: (field: keyof Applicant, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="sm:col-span-2 font-heading text-base font-bold text-foreground-950 border-b border-background-200 pb-2">
      {children}
    </h3>
  );
}

export default function StepDetails({ form, onChange, onNext, onBack }: Props) {
  return (
    <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Personal &amp; booking information
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        Fields marked with <span className="text-accent-600">*</span> are required.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-5">
        <SectionTitle>Personal Details</SectionTitle>
        <FormField
          name="fullName"
          label="Full Name"
          required
          value={form.fullName}
          onChange={(v) => onChange("fullName", v)}
          placeholder="e.g. Muhammad Ahmed Khan"
        />
        <FormField
          name="fatherName"
          label="Father / Guardian Name"
          value={form.fatherName}
          onChange={(v) => onChange("fatherName", v)}
          placeholder="Guardian's full name"
        />
        <FormField
          name="gender"
          label="Gender"
          type="select"
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={(v) => onChange("gender", v)}
        />
        <FormField
          name="dob"
          label="Date of Birth"
          type="date"
          value={form.dob}
          onChange={(v) => onChange("dob", v)}
        />
        <FormField
          name="mobile"
          label="Mobile Number"
          type="tel"
          required
          value={form.mobile}
          onChange={(v) => onChange("mobile", v)}
          placeholder="+92 3xx xxxxxxx"
        />
        <FormField
          name="whatsapp"
          label="WhatsApp Number"
          type="tel"
          required
          value={form.whatsapp}
          onChange={(v) => onChange("whatsapp", v)}
          placeholder="+92 3xx xxxxxxx"
        />
        <FormField
          name="email"
          label="Email Address"
          type="email"
          required
          value={form.email}
          onChange={(v) => onChange("email", v)}
          placeholder="you@example.com"
        />
        <FormField
          name="occupation"
          label="Occupation"
          value={form.occupation}
          onChange={(v) => onChange("occupation", v)}
          placeholder="e.g. Student, Professional"
        />

        <SectionTitle>Address Information</SectionTitle>
        <FormField
          name="district"
          label="District"
          required
          value={form.district}
          onChange={(v) => onChange("district", v)}
          placeholder="e.g. Lahore"
        />
        <FormField
          name="city"
          label="City"
          value={form.city}
          onChange={(v) => onChange("city", v)}
          placeholder="e.g. Lahore"
        />
        <FormField
          name="tehsil"
          label="Tehsil"
          value={form.tehsil}
          onChange={(v) => onChange("tehsil", v)}
          placeholder="e.g. Model Town"
        />
        <FormField
          name="province"
          label="Province / State"
          type="select"
          options={PROVINCE_OPTIONS}
          value={form.province}
          onChange={(v) => onChange("province", v)}
        />
        <FormField
          name="country"
          label="Country"
          value={form.country}
          onChange={(v) => onChange("country", v)}
          placeholder="Pakistan"
        />
        <FormField
          name="area"
          label="Current Location / Area"
          value={form.area}
          onChange={(v) => onChange("area", v)}
          placeholder="e.g. DHA Phase 5"
        />
        <div className="sm:col-span-2">
          <FormField
            name="address"
            label="Complete Address"
            type="textarea"
            required
            rows={3}
            maxLength={500}
            value={form.address}
            onChange={(v) => onChange("address", v)}
            placeholder="House number, street, block, sector…"
          />
        </div>

        <SectionTitle>Booking Information</SectionTitle>
        <FormField
          name="joiningDate"
          label="Preferred Joining Date"
          type="date"
          required
          value={form.joiningDate}
          onChange={(v) => onChange("joiningDate", v)}
        />
        <FormField
          name="duration"
          label="Expected Duration of Stay"
          type="select"
          options={DURATION_OPTIONS}
          value={form.duration}
          onChange={(v) => onChange("duration", v)}
        />

        <SectionTitle>Emergency Contact (Optional)</SectionTitle>
        <FormField
          name="emergencyName"
          label="Emergency Contact Name"
          value={form.emergencyName}
          onChange={(v) => onChange("emergencyName", v)}
          placeholder="Contact person's name"
        />
        <FormField
          name="emergencyPhone"
          label="Emergency Contact Number"
          type="tel"
          value={form.emergencyPhone}
          onChange={(v) => onChange("emergencyPhone", v)}
          placeholder="+92 3xx xxxxxxx"
        />
        <FormField
          name="emergencyRelation"
          label="Relationship with Emergency Contact"
          type="select"
          options={RELATION_OPTIONS}
          value={form.emergencyRelation}
          onChange={(v) => onChange("emergencyRelation", v)}
        />

        <div className="sm:col-span-2">
          <FormField
            name="message"
            label="Additional Message / Notes"
            type="textarea"
            rows={3}
            maxLength={500}
            value={form.message}
            onChange={(v) => onChange("message", v)}
            placeholder="Any special request or note for the hostel team…"
            hint="Maximum 500 characters."
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
        >
          <i className="ri-arrow-left-line mr-1.5"></i>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          Continue to Documents
          <i className="ri-arrow-right-line ml-1.5"></i>
        </button>
      </div>
    </div>
  );
}