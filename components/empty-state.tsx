import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div className="mb-4 text-[var(--ds-gray-300)]">
        <Icon className="size-16" strokeWidth={1.25} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--ds-gray-700)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--ds-gray-500)] max-w-[400px] mb-6">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
