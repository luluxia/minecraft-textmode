"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  isMinecraftRefCallback,
  isMinecraftRefCleanup,
  minecraftClasses as cn,
  minecraftStyle,
} from "./minecraft-render";
import type { MinecraftProps } from "./minecraft-render";
import { playMinecraftClick } from "./minecraft-sound";
import { minecraftTabsAssets as assets } from "./minecraft-tabs-assets";

import "./minecraft-tabs.css";

interface TabsTextureStyle extends React.CSSProperties {
  "--mc-tabs-image": string;
}

interface TabsHeaderStyle extends React.CSSProperties {
  "--mc-tab-header": string;
}

interface TabsScaleStyle extends React.CSSProperties {
  "--mc-scale": number;
}

const ScaleContext = React.createContext(2);

const useLocalRef = function useLocalRef<T extends HTMLElement>(
  forwarded: React.Ref<T> | undefined
) {
  const local = React.useRef<T>(null);
  const [element, setElement] = React.useState<T | null>(null);

  const callback = React.useCallback(
    (node: T | null): (() => void) | undefined => {
      local.current = node;
      setElement(node);

      if (isMinecraftRefCallback(forwarded)) {
        const cleanup = forwarded(node);

        if (isMinecraftRefCleanup(cleanup)) {
          return () => {
            local.current = null;
            setElement(null);
            cleanup();
          };
        }
      } else if (forwarded) {
        // oxlint-disable-next-line react/immutability -- React commit forwards this mutable object ref outside render; preserve the existing callback and cleanup order.
        forwarded.current = node;
      }

      return undefined;
    },
    [forwarded]
  );

  return [local, callback, element] as const;
};

type TabsProps = Omit<
  MinecraftProps<typeof TabsPrimitive.Root>,
  "orientation"
> & {
  orientation?: "horizontal";
  scale?: 1 | 2 | 3;
};

const Tabs = ({
  className,
  scale = 2,
  orientation = "horizontal",
  style,
  ref,
  onValueChange,
  ...props
}: TabsProps) => {
  if (orientation !== "horizontal") {
    throw new Error("Minecraft menu tabs support horizontal orientation only");
  }

  const [, forwarded, element] = useLocalRef(ref);

  const requested = React.useRef<unknown>(undefined);
  const expiry = React.useRef(0);

  React.useLayoutEffect((): (() => void) | undefined => {
    const root = element;

    if (!root) {
      return undefined;
    }

    const current = () =>
      [
        ...root.querySelectorAll<HTMLElement>(
          '[data-slot="tabs-trigger"][data-active]'
        ),
      ].find((tab) => tab.closest(".mc-tabs") === root)?.dataset.mcTabValue;

    let previous = current();

    const observer = new MutationObserver(() => {
      const next = current();

      if (next !== previous) {
        if (next !== undefined && requested.current === next) {
          playMinecraftClick();
        }

        requested.current = undefined;
        previous = next;
      }
    });

    observer.observe(root, {
      attributeFilter: ["data-active"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(expiry.current);
    };
  }, [element]);

  return (
    <ScaleContext.Provider value={scale}>
      <TabsPrimitive.Root
        ref={forwarded}
        data-slot="tabs"
        orientation={orientation}
        className={cn(`mc-tabs`, className)}
        style={minecraftStyle(style, (__style): TabsScaleStyle => ({
          "--mc-scale": scale,
          ...__style,
        }))}
        onValueChange={(next, details) => {
          requested.current = details.reason === "none" ? next : undefined;
          cancelAnimationFrame(expiry.current);
          expiry.current = requestAnimationFrame(() => {
            requested.current = undefined;
          });
          onValueChange?.(next, details);
        }}
        {...props}
      />
    </ScaleContext.Provider>
  );
};

const tabsListVariants = cva("mc-tabs-list", {
  defaultVariants: { variant: "default" },
  variants: { variant: { default: "" } },
});

type TabsListProps = MinecraftProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>;

const TabsList = ({
  className,
  variant = "default",
  style,
  ref,
  children,
  render,
  ...props
}: TabsListProps) => {
  if (variant && variant !== "default") {
    throw new Error("Minecraft menu tabs support the default variant only");
  }

  const scale = React.useContext(ScaleContext);
  const [, forwarded, element] = useLocalRef(ref);

  React.useLayoutEffect((): (() => void) | undefined => {
    if (!element) {
      return undefined;
    }

    const measure = () => {
      // oxlint-disable-next-line react/immutability -- This layout-effect painter owns committed DOM measurement/readiness/style updates, not React state or props.
      const width = Math.floor(element.clientWidth / scale);

      const count = Math.max(
        1,
        element.querySelectorAll(':scope > [data-slot="tabs-trigger"]').length
      );

      const available = Math.max(0, Math.min(400, width) - 28);
      const tabWidth = Math.ceil(Math.floor(available / count) / 2) * 2;
      const left = Math.ceil(Math.floor((width - available) / 2) / 2) * 2;
      element.style.setProperty("--mc-tab-width", `${tabWidth * scale}px`);
      element.style.setProperty("--mc-tabs-left", `${left * scale}px`);
      element.style.setProperty(
        "--mc-tabs-end",
        `${(left + tabWidth * count) * scale}px`
      );
      element.dataset.mcTabsReady = "true";
    };

    measure();

    const resize = new ResizeObserver(measure);
    const childrenObserver = new MutationObserver(measure);

    resize.observe(element);
    childrenObserver.observe(element, { childList: true });

    return () => {
      resize.disconnect();
      childrenObserver.disconnect();
    };
  }, [scale, element]);
  const content = children;

  return (
    <TabsPrimitive.List
      render={render}
      ref={forwarded}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(`${tabsListVariants({ variant })} `, className)}
      style={minecraftStyle(style, (__style): TabsHeaderStyle => ({
        "--mc-tab-header": assets.textures.header_separator,
        ...__style,
      }))}
      {...props}
    >
      {content}
    </TabsPrimitive.List>
  );
};

const TabSurface = ({ name }: { name: keyof typeof assets.sprites }) => (
  <span className="mc-tab-surface" data-sprite={name} aria-hidden="true">
    {assets.sprites[name].pieces.map((image, index) => (
      <i
        key={index}
        style={
          // SAFETY: The owned texture value is a string checked by TabsTextureStyle; the assertion supplies React’s CSSProperties view of its required custom property.
          {
            "--mc-tabs-image": image,
          } satisfies TabsTextureStyle as TabsTextureStyle
        }
      />
    ))}
  </span>
);

type TabsTriggerProps = Omit<
  MinecraftProps<typeof TabsPrimitive.Tab>,
  "value"
> & {
  value: unknown;
};

const TabsTrigger = ({
  className,
  style,
  ref,
  children,
  render,
  value,
  ...props
}: TabsTriggerProps) => {
  // Use DOM text so the application font and accessibility tree agree.
  const label = children;

  const artwork = (
    <>
      <TabSurface name="tab" />
      <TabSurface name="tab_highlighted" />
      <TabSurface name="tab_selected" />
      <TabSurface name="tab_selected_highlighted" />
      <span
        className="mc-tab-menu"
        aria-hidden="true"
        style={
          // SAFETY: The owned texture value is a string checked by TabsTextureStyle; the assertion supplies React’s CSSProperties view of its required custom property.
          {
            "--mc-tabs-image": assets.textures.menu_background,
          } satisfies TabsTextureStyle as TabsTextureStyle
        }
      />
      <span className="mc-tab-underline" aria-hidden="true" />
      <span className="mc-tab-label-window">
        <span className="mc-tab-label">{label}</span>
      </span>
    </>
  );

  return (
    <TabsPrimitive.Tab
      render={render}
      ref={ref}
      value={value}
      data-slot="tabs-trigger"
      data-mc-tab-value={value}
      className={cn(`mc-tabs-trigger`, className)}
      style={style}
      {...props}
    >
      {artwork}
    </TabsPrimitive.Tab>
  );
};

const TabsContent = ({
  className,
  style,
  ...props
}: MinecraftProps<typeof TabsPrimitive.Panel>) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn(`mc-tabs-content`, className)}
    style={minecraftStyle(style, (__style): TabsTextureStyle => ({
      "--mc-tabs-image": assets.textures.menu_background,
      ...__style,
    }))}
    {...props}
  />
);

// oxlint-disable-next-line react-doctor/only-export-components -- Preserve the upstream shadcn component-and-variant export API used by consumer styling composition.
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };

export type { TabsProps, TabsListProps, TabsTriggerProps };
