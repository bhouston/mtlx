// vitest-command-line@0.9 only augments vitest 1-4 (`Assertion<T>`); vitest 5 uses `<R, T>`.
// Drop this file once vitest-command-line supports vitest 5.
import 'vitest';

type PathLikeMatcherExpected = string | { path: string };

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toSucceed(): R;
    toFail(): R;
    toExitWith(expectedExitCode: number | null): R;
    toHaveStdout(expected: string | RegExp): R;
    toHaveStderr(expected: string | RegExp): R;
    toHaveOutput(expected: string | RegExp): R;
    toHaveTimedOut(): R;
    toHaveJsonStdout(expected: unknown): R;
    toCompleteWithin(maxDurationMs: number): R;
    toExist(): R;
    toHaveFileContents(): R;
    toMatchFileContents(expected: PathLikeMatcherExpected): R;
  }
}
