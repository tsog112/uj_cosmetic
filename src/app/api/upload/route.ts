import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { authorizeUserRequest } from "@/lib/auth/serverAuth";
import { enforceRateLimit } from "@/lib/rateLimit";

// Validate env vars at module load time — errors show in Vercel Function logs
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest) {
  // Нэвтрэлт шаардана — Cloudinary зардал/abuse-аас хамгаална
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  // Rate limit (хэрэглэгч бүрээр)
  const limited = await enforceRateLimit(req, { key: "upload", limit: 30, windowMs: 60_000, identifier: auth.uid });
  if (limited) return limited;

  // Guard: if env vars missing, return a clear error instead of a cryptic 500
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error("[upload] Missing Cloudinary env vars:", {
      CLOUD_NAME: !!CLOUD_NAME,
      API_KEY: !!API_KEY,
      API_SECRET: !!API_SECRET,
    });
    return Response.json(
      { error: "Server configuration error: Cloudinary credentials missing" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = String(formData.get("folder") || "misc")
      .replace(/[^a-zA-Z0-9/_-]/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json({ error: "Зураг хэт том байна (10MB-аас бага байх ёстой)" }, { status: 413 });
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Зөвхөн зураг файл оруулна уу" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `uj-cosmetic/${folder || "misc"}` }, (error, result) => {
          if (error || !result) {
            console.error("[upload] Cloudinary upload_stream error:", error);
            reject(error ?? new Error("No result from Cloudinary"));
          } else {
            resolve(result as { secure_url: string });
          }
        })
        .end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (error: any) {
    console.error("[upload] Caught error:", error?.message ?? error);
    return Response.json(
      { error: error?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
