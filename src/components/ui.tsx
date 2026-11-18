import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:opacity-85 border border-foreground",
  secondary:
    "bg-background text-foreground border border-border hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-muted hover:text-foreground hover:bg-surface-2 border border-transparent",
  danger: "bg-background text-danger border border-border hover:border-danger/50 hover:bg-danger/5",
};

export function buttonClass(variant: Variant = "secondary", size: "sm" | "md" = "md") {
  const sizing = size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm";
  return `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${sizing} ${variants[variant]}`;
}

export function Button({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success"; children: ReactNode }) {
  const tones = {
    neutral: "border-border bg-surface-2 text-muted",
    success: "border-success/20 bg-success-bg text-success",
  };
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 font-mono text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: "done" | "active" | "idle" }) {
  const color = { done: "bg-success", active: "bg-blue", idle: "bg-subtle" }[status];
  return <span className={`inline-block size-2 shrink-0 rounded-full ${color}`} aria-hidden />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  );
}

export function Checkbox({
  checked,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { checked: boolean }) {
  return (
    <span className={`relative inline-flex size-4 shrink-0 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        className="peer size-4 cursor-pointer appearance-none rounded-[4px] border border-border-strong bg-background transition-colors checked:border-foreground checked:bg-foreground hover:border-muted"
        {...props}
      />
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute inset-0 size-4 text-background opacity-0 peer-checked:opacity-100"
        aria-hidden
      >
        <path d="M4 8.5l2.5 2.5L12 5.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
