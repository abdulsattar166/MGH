type Props = {
  name: string;
  position: string;
  hostelName: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
};

export default function WardenCard({
  name,
  position,
  hostelName,
  phone,
  email,
  avatarUrl,
  size = "md",
}: Props) {
  const box = size === "sm" ? "w-14 h-14" : "w-16 h-16";
  const initial = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div
        className={`${box} rounded-2xl overflow-hidden bg-accent-500 flex items-center justify-center shrink-0`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className={`font-heading ${initial} font-bold text-foreground-950`}>
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-foreground-950">{name}</div>
        <div className="text-xs uppercase tracking-wider text-primary-600">
          {position} · {hostelName}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-600">
          {phone && (
            <span className="flex items-center gap-1.5">
              <i className="ri-phone-line text-primary-600"></i>
              {phone}
            </span>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-primary-600 cursor-pointer"
            >
              <i className="ri-mail-line text-primary-600"></i>
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}