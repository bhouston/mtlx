import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useGoogleAnalytics } from 'tanstack-router-ga4';
import { redactEditorMaterialLink } from '@/lib/editor-link-redaction';

/** Match the site's manual page views while excluding embedded editor documents. */
export function SiteAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const analytics = useGoogleAnalytics();
  useEffect(() => {
    const pageLocation = redactEditorMaterialLink(window.location.href);
    // Set the default too: automatic GA events must not read the unsanitized URL.
    analytics.set({ page_location: pageLocation });
    const needsScript = !document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (needsScript) (window as Window & { gtag?: (command: 'js', date: Date) => void }).gtag?.('js', new Date());
    analytics.config(measurementId, { send_page_view: false, page_location: pageLocation });
    if (needsScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.append(script);
    }
    analytics.event('page_view', {
      page_path: pathname,
      page_location: pageLocation,
      page_title: document.title,
      page_referrer: redactEditorMaterialLink(document.referrer) || undefined,
    });
  }, [analytics, measurementId, pathname]);
  return null;
}
