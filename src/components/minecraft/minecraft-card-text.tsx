import * as React from "react";

export const CardScaleContext = React.createContext(2);

/** Keep text selectable and let the application's Fusion Pixel font wrap it. */
export const MinecraftCardText = ({ children, bold = false }: {
  children: React.ReactNode;
  bold?: boolean;
}) => <span className="mc-card-text" style={{ fontWeight: bold ? 700 : undefined }}>{children}</span>;
