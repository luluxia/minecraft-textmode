"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
// Primitive composition: shadcn-ui/ui apps/v4/registry/bases/base/ui/button.tsx (MIT).
import * as React from "react";

import {
  minecraftClasses as cn,
  minecraftStyle,
} from "./minecraft-render";
import type { MinecraftProps } from "./minecraft-render";

import "./minecraft-button.css";
import { playMinecraftClick } from "./minecraft-sound";

interface ButtonStyle extends React.CSSProperties {
  "--mc-scale": number;
}

const buttonVariants = cva(
  "mc-button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "",
      },
      variant: {
        default: "",
      },
    },
  }
);

const skin = (content: React.ReactNode, overlay: React.ReactNode) => (
  <>
    <span className="mc-button-surface" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} />
      ))}
    </span>
    {overlay}
    <span className="mc-button-label">{content}</span>
  </>
);

const Button = ({
  className,
  variant = "default",
  size = "default",
  render,
  scale = 2,
  style,
  children,
  overlay,
  onClick,
  ...props
}: MinecraftProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants> & {
    scale?: 1 | 2 | 3;
    overlay?: React.ReactNode;
  }) => {
  const Comp = ButtonPrimitive;

  const content = skin(children, overlay);

  return (
    <Comp
      render={render}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(cn(buttonVariants({ size, variant }), className))}
      style={minecraftStyle(style, (__style): ButtonStyle => ({
        "--mc-scale": scale,
        ...__style,
      }))}
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (
          !event.defaultPrevented &&
          !(props.disabled ?? false) &&
          !Object.hasOwn(event.currentTarget.dataset, "disabled")
        ) {
          playMinecraftClick();
        }
      }}
    >
      {content}
    </Comp>
  );
};

// oxlint-disable-next-line react-doctor/only-export-components -- Preserve the upstream shadcn component-and-variant export API used by consumer styling composition.
export { Button, buttonVariants };
