"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import * as React from "react";

import { minecraftClasses as cn, minecraftStyle } from "./minecraft-render";
import type { MinecraftProps } from "./minecraft-render";
import { playMinecraftClick } from "./minecraft-sound";

import "./minecraft-button.css";
import "./minecraft-switch.css";

interface SwitchScaleStyle extends React.CSSProperties {
  "--mc-scale": number;
}

type SwitchProps = MinecraftProps<typeof SwitchPrimitive.Root> & {
  scale?: 1 | 2 | 3;
  size?: "default";
};

const Switch = ({
  className,
  scale = 2,
  size = "default",
  style,
  children,
  render,
  disabled,
  onClick,
  onCheckedChange,
  onPointerDown,
  ...props
}: SwitchProps) => {
  if (size !== "default") {
    throw new Error(
      "Minecraft on/off buttons support the default visual size only"
    );
  }

  const artwork = (
    <>
      <span className="mc-button-surface" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} />
        ))}
      </span>
      <span className="mc-button-label" aria-hidden="true">
        <span className="mc-switch-on">
          开启
        </span>
        <span className="mc-switch-off">
          关闭
        </span>
      </span>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="mc-switch-thumb"
        aria-hidden="true"
      />
    </>
  );

  return (
    <SwitchPrimitive.Root
      render={render}
      data-slot="switch"
      data-size={size}
      disabled={disabled}
      className={cn(`mc-button mc-switch`, className)}
      style={minecraftStyle(style, (__style): SwitchScaleStyle => ({
        "--mc-scale": scale,
        ...__style,
      }))}
      {...props}
      aria-disabled={(disabled ?? false) ? true : props["aria-disabled"]}
      onPointerDown={(event) => {
        if (disabled ?? false) {
          event.preventDefault();

          return;
        }

        onPointerDown?.(event);
      }}
      onClick={(event) => {
        if (
          (disabled ?? false) ||
          Object.hasOwn(event.currentTarget.dataset, "disabled") ||
          event.currentTarget.getAttribute("aria-disabled") === "true"
        ) {
          event.preventDefault();

          return;
        }

        onClick?.(event);
      }}
      onCheckedChange={(checked, details) => {
        onCheckedChange?.(checked, details);

        if (!details.isCanceled) {
          playMinecraftClick();
        }
      }}
    >
      <>
        {children}
        {artwork}
      </>
    </SwitchPrimitive.Root>
  );
};

export { Switch };

export type { SwitchProps };
