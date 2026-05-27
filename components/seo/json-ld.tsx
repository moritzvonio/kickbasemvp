/**
 * Rendert ein JSON-LD-<script> für strukturierte Daten (SEO/GEO).
 * Mehrere Schemas via Array übergeben.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      // schema.org JSON-LD – statisch generiert, kein User-Input
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
