"use client";

// Catches errors thrown by the root layout itself. Must render its own
// <html>/<body> and cannot rely on app styles or components.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7280", maxWidth: 400, marginBottom: "1.5rem" }}>
          An unexpected error occurred. Your data is safe — try again.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#D14545",
            color: "white",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
