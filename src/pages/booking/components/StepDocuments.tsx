import { useRef, useState } from "react";
import FormField from "@/components/base/FormField";
import { type Applicant } from "@/lib/booking";
import { fileToResizedDataUrl, isAcceptedImage, isWithinSizeLimit } from "@/lib/image";

type Props = {
  form: Applicant;
  onChange: (field: keyof Applicant, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

function UploadBox({
  label,
  required,
  value,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      onChange("");
      return;
    }
    if (!isWithinSizeLimit(file)) {
      onChange("");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      onChange(dataUrl);
    } catch {
      onChange("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground-800 mb-1.5">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>

      {value ? (
        <div className="relative rounded-md overflow-hidden border border-background-200 bg-background-100">
          <img src={value} alt={label} className="w-full h-44 object-contain bg-background-100" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground-950/70 text-background-50 flex items-center justify-center cursor-pointer hover:bg-foreground-950/90 transition"
            aria-label="Remove"
          >
            <i className="ri-close-line"></i>
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-md bg-background-50/90 text-foreground-800 text-xs font-semibold cursor-pointer hover:bg-background-50 transition"
          >
            <i className="ri-image-edit-line mr-1"></i>
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full h-44 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
            error
              ? "border-accent-400 text-accent-600"
              : "border-background-300 text-foreground-500 hover:border-primary-400 hover:text-primary-600"
          }`}
        >
          {busy ? (
            <>
              <i className="ri-loader-4-line animate-spin text-2xl"></i>
              <span className="text-xs">Processing…</span>
            </>
          ) : (
            <>
              <i className="ri-camera-line text-2xl"></i>
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs">JPG, PNG or WEBP · up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && <div className="mt-1 text-xs text-accent-600">{error}</div>}
    </div>
  );
}

export default function StepDocuments({
  form,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  const validate = (): boolean => {
    const next: { front?: string; back?: string } = {};
    if (!form.cnicFront) next.front = "Please upload the front side of your CNIC/ID.";
    if (!form.cnicBack) next.back = "Please upload the back side of your CNIC/ID.";
    setErrors(next);
    return !next.front && !next.back;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Identity &amp; documents
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        Upload both sides of your CNIC / National ID so our team can verify your identity.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <FormField
            name="cnic"
            label="CNIC / National ID Number"
            required
            value={form.cnic}
            onChange={(v) => onChange("cnic", v)}
            placeholder="e.g. 35202-1234567-1"
          />
        </div>

        <UploadBox
          label="CNIC / ID — Front Side"
          required
          value={form.cnicFront}
          error={errors.front}
          onChange={(dataUrl) => onChange("cnicFront", dataUrl)}
        />
        <UploadBox
          label="CNIC / ID — Back Side"
          required
          value={form.cnicBack}
          error={errors.back}
          onChange={(dataUrl) => onChange("cnicBack", dataUrl)}
        />

        <div className="sm:col-span-2 text-xs text-foreground-400 bg-background-100 border border-background-200 rounded-md px-4 py-3">
          <i className="ri-information-line mr-1"></i>
          Your CNIC images are securely stored and reviewed by the hostel team during approval.
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
          onClick={handleNext}
          className="px-7 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          Review Booking
          <i className="ri-arrow-right-line ml-1.5"></i>
        </button>
      </div>
    </div>
  );
}