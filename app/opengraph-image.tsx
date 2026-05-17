import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/config";

export const runtime = "edge";
export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #eef2ff 0%, #ffffff 45%, #ecfdf5 100%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              color: "white",
              fontSize: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔑
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#18181b" }}>
            {BRAND.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#18181b",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Find the grants that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4f46e5, #059669)",
                backgroundClip: "text",
                color: "transparent",
                marginLeft: 16,
              }}
            >
              unlock your first home.
            </span>
          </div>
          <div style={{ fontSize: 30, color: "#52525b", maxWidth: 950 }}>
            82 federal, state, county and city programs · all 50 states · free for buyers · powered by IBM watsonx
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: "#10b981",
              }}
            />
            Built by {BRAND.realtor.name} · Licensed Michigan Realtor
          </div>
          <div>{BRAND.realtor.market}</div>
        </div>
      </div>
    ),
    size
  );
}
