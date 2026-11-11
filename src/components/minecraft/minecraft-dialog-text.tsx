import * as React from "react";

export const DialogLayoutContext = React.createContext({ contentWidth: 214, scale: 2 });

export const MinecraftDialogText = ({ children, bold = false, item = false }: {
  children: React.ReactNode;
  bold?: boolean;
  item?: boolean;
}) => <span className="mc-dialog-text" data-mc-dialog-item={item || undefined}
  style={{ fontWeight: bold ? 700 : undefined }}>{children}</span>;
