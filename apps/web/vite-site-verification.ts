import type { PluginOption } from 'vite';

function escapeMetaContent(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

/** Injects Google/Naver Search Advisor verification meta when env vars are set at build time. */
export function phonaraSiteVerificationPlugin(): PluginOption {
  return {
    name: 'phonara-site-verification',
    transformIndexHtml(html) {
      const tags: string[] = [];
      const google = process.env['VITE_GOOGLE_SITE_VERIFICATION']?.trim();
      const naver = process.env['VITE_NAVER_SITE_VERIFICATION']?.trim();

      if (google) {
        tags.push(
          `<meta name="google-site-verification" content="${escapeMetaContent(google)}" />`,
        );
      }
      if (naver) {
        tags.push(`<meta name="naver-site-verification" content="${escapeMetaContent(naver)}" />`);
      }

      if (tags.length === 0) return html;
      return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
    },
  };
}
