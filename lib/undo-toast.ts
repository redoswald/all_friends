import { toast } from "sonner";
import { apiFetch, SessionExpiredError } from "@/lib/api-client";

/**
 * Success toast with a 5-second Undo window after a soft delete.
 * `restoreUrl` is the POST endpoint that clears deletedAt
 * (e.g. /api/contacts/123/restore); `onRestored` refreshes the UI.
 */
export function toastDeletedWithUndo(
  message: string,
  restoreUrl: string,
  onRestored: () => void
) {
  toast.success(message, {
    duration: 5000,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          const res = await apiFetch(restoreUrl, { method: "POST" });
          if (res.ok) {
            toast.success("Restored");
            onRestored();
          } else {
            toast.error("Failed to restore");
          }
        } catch (error) {
          if (!(error instanceof SessionExpiredError)) {
            toast.error("Failed to restore");
          }
        }
      },
    },
  });
}
