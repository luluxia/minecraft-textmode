"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { minecraftInputAssets } from "./minecraft-input-assets";
import { minecraftClasses as cn, minecraftStyle } from "./minecraft-render";

import "./minecraft-input.css";

interface InputStyle extends React.CSSProperties {
  "--mc-scale": number;
  "--mc-input-normal": string;
  "--mc-input-highlighted": string;
}

const Input = ({
  className,
  type = "text",
  scale = 2,
  style,
  ref,
  ...props
}: React.ComponentProps<"input"> & {
  scale?: 1 | 2 | 3;
}) => {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      spellCheck={false}
      autoCorrect="off"
      className={cn("mc-input", className)}
      style={minecraftStyle(style, (__style): InputStyle => ({
        "--mc-scale": scale,
        "--mc-input-normal": `url(${minecraftInputAssets.normal})`,
        "--mc-input-highlighted": `url(${minecraftInputAssets.highlighted})`,
        ...__style,
      }))}
      {...props}
    />
  );
};

export { Input };
