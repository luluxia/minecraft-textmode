"use client";

import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import * as React from "react";

import { Button } from "./button";
import {
  minecraftClasses as cn,
  minecraftStyle,
} from "./minecraft-render";
import type { MinecraftProps } from "./minecraft-render";

import "./minecraft-collapsible.css";

interface CollapsibleScaleStyle extends React.CSSProperties {
  "--mc-scale": number;
}

const ScaleContext = React.createContext<1 | 2 | 3>(2);

type CollapsibleProps = MinecraftProps<typeof Primitive.Root> & {
  scale?: 1 | 2 | 3;
};

const Collapsible = ({
  scale = 2,
  className,
  style,
  ...props
}: CollapsibleProps) => (
  <ScaleContext.Provider value={scale}>
    <Primitive.Root
      data-slot="collapsible"
      className={cn("mc-collapsible", className)}
      style={minecraftStyle(style, (__style): CollapsibleScaleStyle => ({
        "--mc-scale": scale,
        ...__style,
      }))}
      {...props}
    />
  </ScaleContext.Provider>
);

const CollapsibleTrigger = ({
  children,
  render,
  className,
  onClick,
  ...props
}: MinecraftProps<typeof Primitive.Trigger>) => {
  const scale = React.useContext(ScaleContext);

  return (
    <Primitive.Trigger
      render={render ?? <Button scale={scale} />}
      data-slot="collapsible-trigger"
      className={cn("mc-collapsible-trigger", className)}
      onClick={(event) => {
        onClick?.(event);

        if (event.currentTarget.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
        }
      }}
      {...props}
    >
      {children}
    </Primitive.Trigger>
  );
};

type CollapsibleContentProps = MinecraftProps<typeof Primitive.Panel>;

const CollapsibleContent = ({ className, ...props }: CollapsibleContentProps) => (
  <Primitive.Panel
    data-slot="collapsible-content"
    className={cn("mc-collapsible-content", className)}
    {...props}
  />
);

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
export type { CollapsibleProps, CollapsibleContentProps };
