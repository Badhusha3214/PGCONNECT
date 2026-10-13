import { ImageResponse } from "next/og";

// Default social-share image for pages without their own photo.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0F3B33",
          color: "#F5F3EE",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 18, height: 26, borderRadius: 5, background: "#FFC447", boxShadow: "0 0 18px #FFC447" }} />
          PGCON
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Verified PGs &amp; Hostels in Kerala
        </div>
        <div style={{ fontSize: 34, marginTop: 28, color: "#FFD27A" }}>
          Live bed availability · Transparent rent · Book online
        </div>
        <div style={{ marginTop: 48, height: 7, width: 240, borderTop: "3px solid #C99A2E", borderBottom: "1.5px solid #C99A2E" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
