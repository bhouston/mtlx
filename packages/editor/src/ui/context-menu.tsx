'use client';

import { ContextMenu as Primitive } from 'radix-ui';
import type { ComponentProps } from 'react';

// shadcn/ui's Radix composition, with package-local CSS so consumers need no Tailwind setup.
export const ContextMenu = Primitive.Root;
export const ContextMenuTrigger = Primitive.Trigger;
export const ContextMenuSub = Primitive.Sub;

export function ContextMenuContent(props: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content data-slot="context-menu-content" className="mtlx-context-menu" {...props} />
    </Primitive.Portal>
  );
}
export function ContextMenuSubContent(props: ComponentProps<typeof Primitive.SubContent>) {
  return (
    <Primitive.Portal>
      <Primitive.SubContent
        data-slot="context-menu-sub-content"
        className="mtlx-context-menu"
        collisionPadding={8}
        {...props}
      />
    </Primitive.Portal>
  );
}
export function ContextMenuItem({
  variant,
  ...props
}: ComponentProps<typeof Primitive.Item> & { variant?: 'destructive' }) {
  return (
    <Primitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className="mtlx-context-menu-item"
      {...props}
    />
  );
}
export function ContextMenuSubTrigger({ children, ...props }: ComponentProps<typeof Primitive.SubTrigger>) {
  return (
    <Primitive.SubTrigger data-slot="context-menu-sub-trigger" className="mtlx-context-menu-item" {...props}>
      {children}
      <span className="mtlx-context-menu-chevron" aria-hidden="true">
        ›
      </span>
    </Primitive.SubTrigger>
  );
}
export function ContextMenuSeparator() {
  return <Primitive.Separator className="mtlx-context-menu-separator" />;
}
