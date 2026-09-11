import process from 'node:process';

import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  dsn: 'https://1f1e171de194c56a5c3353fe75874729@o4508898407481344.ingest.us.sentry.io/4512069513641984',
  environment: process.env.NODE_ENV ?? 'development',
  sendDefaultPii: true,
});
