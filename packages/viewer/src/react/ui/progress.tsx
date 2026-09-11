import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { cn } from '../utils.js';

/** shadcn-style Radix progress primitive, styled for the material loading overlay. */
function Progress({ className, value = 0, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn('relative h-3 w-full overflow-hidden rounded-full border border-blue-100 bg-white', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full bg-blue-600 transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
export { Progress };
