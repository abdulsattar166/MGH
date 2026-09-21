import { useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  accept?: string;
};

export default function FileDropzone({
  onFile,
  disabled,
  accept = ".xlsx,.xls,.csv",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition cursor-pointer ${
        dragging
          ? "border-primary-400 bg-primary-100/50"
          : "border-background-300 bg-background-50 hover:border-primary-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-3">
        <i className="ri-file-excel-2-line text-2xl"></i>
      </div>
      <p className="text-sm font-semibold text-foreground-900">
        {dragging ? "Drop the file here" : "Click or drag your spreadsheet here"}
      </p>
      <p className="text-xs text-foreground-500 mt-1">
        Supports .xlsx, .xls and .csv files
      </p>
    </div>
  );
}