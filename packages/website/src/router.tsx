import * as Sentry from '@sentry/tanstackstart-react';
import { createRouter } from '@tanstack/react-router';
import { NotFound } from './components/NotFound';
import { routeTree } from './routeTree.gen';
import { redactEditorMaterialData } from './lib/editor-link-redaction';

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
  });

  if (!router.isServer) {
    Sentry.init({
      dsn: 'https://1f1e171de194c56a5c3353fe75874729@o4508898407481344.ingest.us.sentry.io/4512069513641984',
      environment: import.meta.env.MODE,
      sendDefaultPii: true,
      beforeSend: redactEditorMaterialData,
      beforeSendTransaction: redactEditorMaterialData,
      beforeBreadcrumb: redactEditorMaterialData,
    });
  }

  return router;
}
