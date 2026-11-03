import * as modulSanitasi from 'sanitize-html';

type Sanitasi = (html: string, opsi: Record<string, unknown>) => string;

function ambilSanitasi(): Sanitasi {
  const modul = modulSanitasi as unknown as { default?: unknown };
  const kandidat: unknown[] = [modul.default, modulSanitasi as unknown];
  const fungsi = kandidat.find((item) => typeof item === 'function');
  if (!fungsi) {
    throw new Error('Pustaka sanitize-html tidak dapat dimuat.');
  }
  return fungsi as Sanitasi;
}

const TAG_DIIZINKAN = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
  'figure',
  'figcaption',
  'span',
];

export function bersihkanHtml(html: string): string {
  const sanitasi = ambilSanitasi();
  return sanitasi(html, {
    allowedTags: TAG_DIIZINKAN,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (tagName: string, atribut: Record<string, string>) => ({
        tagName: 'a',
        attribs: { ...atribut, rel: 'noopener noreferrer', target: '_blank' },
      }),
    },
  });
}

export function ambilTeks(html: string): string {
  const sanitasi = ambilSanitasi();
  return sanitasi(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

export function buatRingkasan(teks: string, panjang = 200): string {
  if (teks.length <= panjang) {
    return teks;
  }
  return `${teks.slice(0, panjang).replace(/\s+\S*$/, '')}...`;
}

export function buatSlug(judul: string): string {
  const slug = judul
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || 'berita';
}
