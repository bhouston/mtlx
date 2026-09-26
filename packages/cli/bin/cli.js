#!/usr/bin/env node
import './instrument.js';

import * as Sentry from '@sentry/node';

import { main } from '../dist/index.js';
import { formatError } from '../dist/cloud/lib/errors.js';

main().catch((error) => {
  Sentry.captureException(error);
  Sentry.flush(2000).finally(() => {
    console.error(formatError(error));
    process.exitCode = 1;
  });
});
