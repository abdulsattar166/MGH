import { useRef, useState } from "react";
import { isAcceptedImage, isWithinSizeLimit } from "@/lib/image";
import { resolveImageUrl, uploadFile } from "@/lib/api";

type Props = {
  label?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  error?: string;
};

export default function ImageUpload({ label = "Image", value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const preview = resolveImageUrl(value);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setErr("Only JPG, PNG or WEBP images are allowed.");
      return;
    }
    if (!isWithinSizeLimit(file)) {
      setErr("Image must be 5 MB or smaller.");
      return;
    }
    setErr("");
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) {
        setErr("Upload failed. Please try again.");
        return;
      }
      onChange(url);
    } catch (e) {
      setErr((e as Error).message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground-800 mb-1.5">{label}</label>

      {preview ? (
        <div className="flex items-start gap-3">
          <div className="w-28 h-28 rounded-lg border border-background-200 overflow-hidden bg-background-100 shrink-0 relative">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-foreground-950/40 flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin text-background-50 text-xl"></i>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs text-foreground-500 break-all max-w-[220px] line-clamp-2">
              {preview.startsWith("data:") ? "Previous image" : value ?? "Image uploaded"}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-background-300 text-foreground-700 text-xs font-semibold hover:bg-background-100 cursor-pointer transition"
              >
                <i className="ri-upload-2-line"></i> Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setErr("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-accent-700 text-xs font-semibold hover:bg-accent-100 cursor-pointer transition"
              >
                <i className="ri-delete-bin-line"></i> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg px-4 py-8 text-center cursor-pointer transition ${
            dragOver
              ? "border-primary-400 bg-primary-50"
              : "border-background-300 bg-background-100 hover:border-primary-300 hover:bg-primary-50/40"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-2xl"></i>
              <span className="text-sm">Uploading image…</span>
            </div>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-background-200 flex items-center justify-center text-foreground-500">
                <i className="ri-image-add-line text-xl"></i>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground-700">
                Drag &amp; drop image here
              </p>
              <p className="text-xs text-foreground-400">
                or <span className="text-primary-600 font-semibold">browse from your computer</span>
              </p>
              <p className="mt-2 text-[11px] text-foreground-400">JPG, PNG or WEBP · max 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {(err || error) && (
        <p className="mt-1.5 text-xs text-accent-700">{err || error}</p>
      )}
    </div>
  );
}