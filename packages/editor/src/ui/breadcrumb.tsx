import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { ChevronRight } from 'lucide-react';

// shadcn/ui composition with package-local styles, matching the context menu.
export function Breadcrumb(props: ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}
export function BreadcrumbList(props: ComponentProps<'ol'>) {
  return <ol data-slot="breadcrumb-list" className="mtlx-breadcrumb-list" {...props} />;
}
export function BreadcrumbItem(props: ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" {...props} />;
}
export function BreadcrumbLink({ asChild, ...props }: ComponentProps<'a'> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : 'a';
  return <Component data-slot="breadcrumb-link" {...props} />;
}
export function BreadcrumbPage(props: ComponentProps<'span'>) {
  return <span data-slot="breadcrumb-page" aria-current="page" {...props} />;
}
export function BreadcrumbSeparator(props: ComponentProps<'li'>) {
  return (
    <li role="presentation" aria-hidden="true" data-slot="breadcrumb-separator" {...props}>
      <ChevronRight size={14} />
    </li>
  );
}
