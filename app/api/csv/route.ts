import { NextResponse } from "next/server";

function normalizeGoogleSheetsUrl(url: string): string {
  // If URL ends with /pubhtml, convert to CSV
  if (url.endsWith("/pubhtml")) {
    return url.replace("/pubhtml", "/pub?output=csv");
  }

  // If URL contains /pub but no output param, add it
  if (url.includes("/pub") && !url.includes("output=")) {
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + "output=csv";
  }

  return url;
}

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

  if (!rawUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SHEET_CSV_URL environment variable is not set" },
      { status: 500 }
    );
  }

  const url = normalizeGoogleSheetsUrl(rawUrl);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TeamPulseDashboard/1.0)",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // If the URL with extra params fails, try the simplest form
      const baseUrl = rawUrl.split("/pub")[0] + "/pub?output=csv";
      if (baseUrl !== url) {
        const retry = await fetch(baseUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; TeamPulseDashboard/1.0)",
          },
        });
        if (retry.ok) {
          const text = await retry.text();
          return new NextResponse(text, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          });
        }
      }

      return NextResponse.json(
        { error: `Google Sheets returned ${response.status}. URL used: ${url}` },
        { status: response.status }
      );
    }

    const text = await response.text();

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch from Google Sheets: ${message}` },
      { status: 502 }
    );
  }
}
