import { NextRequest } from "next/server";
import { getGrantById } from "@/lib/matcher";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ success: false, error: "missing 'id' query param" }, { status: 400 });
  }
  const grant = await getGrantById(id);
  if (!grant) {
    return Response.json({ success: false, error: "not found" }, { status: 404 });
  }
  return Response.json({ success: true, grant });
}
