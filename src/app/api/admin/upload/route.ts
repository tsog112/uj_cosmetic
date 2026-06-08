import { v2 as cloudinary } from "cloudinary";
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error("[admin/upload] Missing Cloudinary credentials");
    return Response.json(
      { error: "Server configuration error: Cloudinary credentials missing" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = String(formData.get("folder") || "products")
      .replace(/[^a-zA-Z0-9/_-]/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `uj-cosmetic/${folder}` }, (error, result) => {
          if (error || !result) {
            console.error("[admin/upload] Cloudinary upload error:", error);
            reject(error ?? new Error("No result from Cloudinary"));
          } else {
            resolve(result as { secure_url: string });
          }
        })
        .end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (error: any) {
    console.error("[admin/upload] Caught error:", error?.message ?? error);
    return Response.json(
      { error: error?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
