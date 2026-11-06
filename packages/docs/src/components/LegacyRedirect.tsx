import { useEffect } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
export default function LegacyRedirect({ to, title }: { to: string; title: string }) {
  useEffect(() => {
    window.location.replace(`${to}${window.location.search}${window.location.hash}`);
  }, [to]);
  return (
    <Layout title={title}>
      <main className="container margin-vert--xl">
        <h1>{title}</h1>
        <p>This guide has moved to the documentation.</p>
        <Link to={to}>Continue to {title.toLowerCase()} →</Link>
      </main>
    </Layout>
  );
}
