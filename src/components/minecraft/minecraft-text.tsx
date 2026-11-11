import type { ReactNode } from "react";

export const MinecraftText = ({ children, className }: { children: ReactNode; className?: string }) =>
  <span className={className}>{children}</span>;
