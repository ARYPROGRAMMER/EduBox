import { cn } from "@/lib/utils";
import { Loader as KendoLoader } from "@progress/kendo-react-indicators";

export interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "overlay" | "inline";
  text?: string;
}

export function Loader({
  className,
  size = "md",
  variant = "default",
  text,
  ...props
}: LoaderProps) {
  const LoaderIcon = (
    <KendoLoader
      size={
        size === "sm"
          ? "small"
          : size === "md"
          ? "medium"
          : size === "lg"
          ? "large"
          : "large"
      }
      className={cn("text-primary", className)}
    />
  );

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          {LoaderIcon}
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        {LoaderIcon}
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // Default variant - centered in container
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      {LoaderIcon}
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Page/Section loader component
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-1">{text}</p>
          <p className="text-sm text-muted-foreground">
            Please wait a moment...
          </p>
        </div>
      </div>
    </div>
  );
}

// Button loader component
export function ButtonLoader({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <KendoLoader
      size={size === "sm" ? "small" : "medium"}
      className={cn(className)}
    />
  );
}

// Card skeleton loader
export function CardSkeleton({
  showImage = false,
  showBadge = false,
  lines = 2,
}: {
  showImage?: boolean;
  showBadge?: boolean;
  lines?: number;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-3 animate-pulse">
      {showImage && <div className="w-full h-32 bg-muted rounded-md" />}
      <div className="space-y-2">
        <div className="h-5 bg-muted rounded w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded"
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
      {showBadge && <div className="h-6 bg-muted rounded w-20" />}
    </div>
  );
}

// List skeleton loader
export function ListSkeleton({
  items = 5,
  showAvatar = false,
}: {
  items?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 animate-pulse">
          {showAvatar && (
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table skeleton loader
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 p-4 animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-muted rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
