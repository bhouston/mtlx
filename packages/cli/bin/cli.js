#!/usr/bin/env node
import './instrument.js';

import * as Sentry from '@sentry/node';

import { main } from '../dist/index.js';

main().catch((error) => {
  Sentry.captureException(error);
  Sentry.flush(2000).finally(() => {
    console.error(error);
    process.exitCode = 1;
  });
});
