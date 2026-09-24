import { createClient } from "npm:@supabase/supabase-js@2";

const SUPER_ADMINS = [
  {
    name: "Abdul Sattar",
    email: "abdulsattar1717asm@gmail.com",
    password: "Admin@12345",
    role: "admin",
    position: "Super Admin",
  },
  {
    name: "Mubarak Mehdi",
    email: "mubarakgroupofhostels@gmail.com",
    password: "mubarakgroupofhostels1122",
    role: "admin",
    position: "Founder & CEO",
  },
];

const SUPERINTENDENT = {
  name: "Hostel Superintendent",
  email: "superintendent@mubarakhostels.pk",
  password: "Super@12345",
  role: "superintendent",
  position: "Superintendent",
  hostelId: null as number | null,
};

const PLACEHOLDER_AVATAR = "https://readdy.ai/api/search-image?query=Professional neutral business person avatar headshot placeholder, friendly smiling adult, neutral light beige studio background, soft even lighting, clean minimal corporate portrait photography&width=400&height=400&seq=warden-placeholder-avatar&orientation=squarish";

const HOSTEL_ADMINS = [
  {
    name: "Yousaf Mehsood",
    email: "yousafmehsood2121@gmail.com",
    password: "jinnah12",
    phone: "03419715017",
    hostelId: 1,
    position: "Warden, Jinnah Boys House",
    avatarUrl: "https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/8f6a18793fdfdc4a44c7458f6edc225e.png",
  },
  {
    name: "Abdullah",
    email: "malikabdullahmalikaz@gmail.com",
    password: "sama123",
    phone: "03105948138",
    hostelId: 2,
    position: "Warden, Sama Boys House",
    avatarUrl: "https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/975047ec2596c0f071aabe1219285608.png",
  },
  {
    name: "Bilah Ahmed",
    email: "bilalsudais74@gmail.com",
    password: "qadeer1234",
    phone: "03045889984",
    hostelId: 3,
    position: "Warden, Abdul Qadeer Boys House",
    avatarUrl: "https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/ac895ff6c5b9f7bc513e57b688cb7400.jpeg",
  },
];

Deno.serve(async (_req) => {
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceRole) return json({ error: "Backend service is not configured." });

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: string[] = [];

  async function findUserIdByEmail(email: string): Promise<string | null> {
    const res = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const raw = (res as { data?: unknown }).data;
    const users = Array.isArray(raw) ? raw : ((raw as { users?: unknown[] })?.users ?? []);
    const found = (users as { id: string; email?: string }[]).find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
    );
    return found?.id ?? null;
  }

  async function ensureUser(opts: {
    email: string;
    password: string;
    name: string;
    role: string;
    position: string;
    phone?: string;
    hostelId?: number | null;
    avatarUrl?: string | null;
  }): Promise<string> {
    let id = await findUserIdByEmail(opts.email);
    if (id) {
      await admin.auth.admin.updateUserById(id, { password: opts.password, email_confirm: true });
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: opts.email,
        password: opts.password,
        email_confirm: true,
        user_metadata: { name: opts.name },
      });
      if (error) throw new Error(error.message);
      id = created?.user?.id ?? null;
      if (!id) throw new Error(`Could not create user ${opts.email}`);
    }

    const profile: Record<string, unknown> = {
      id,
      role: opts.role,
      name: opts.name,
      email: opts.email,
      position: opts.position,
      is_active: true,
      must_change_password: false,
    };
    if (opts.phone !== undefined) profile.phone = opts.phone;
    if (opts.hostelId !== undefined) profile.hostel_id = opts.hostelId;
    if (opts.avatarUrl !== undefined) profile.avatar_url = opts.avatarUrl;

    const { error: profErr } = await admin.from("profiles").upsert(profile);
    if (profErr) throw new Error(profErr.message);
    return `${opts.email} -> ${opts.role}`;
  }

  try {
    for (const admin of SUPER_ADMINS) {
      results.push("OK: " + (await ensureUser(admin)));
    }
    results.push("OK: " + (await ensureUser(SUPERINTENDENT)));
    for (const w of HOSTEL_ADMINS) {
      results.push("OK: " + (await ensureUser({ ...w, role: "warden" })));
    }

    // Re-point complaints to their hostel's hostel admin.
    const { data: wardenProfiles } = await admin
      .from("profiles")
      .select("id, hostel_id")
      .eq("role", "warden");
    for (const wp of (wardenProfiles ?? []) as { id: string; hostel_id: number | null }[]) {
      if (wp.hostel_id) {
        await admin
          .from("complaints")
          .update({ warden_id: wp.id })
          .eq("hostel_id", wp.hostel_id)
          .is("warden_id", null);
      }
    }

    return json({ ok: true, results });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message, results });
  }
});
