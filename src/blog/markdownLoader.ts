// @vigil/web-framework — shared markdown blog loader (F2-07 item A, netyvee/app#344).
//
// Lifted from netyvee/vigil-cleaning/lib/blog/markdownPosts.ts and
// netyvee/security/lib/blog/markdownPosts.ts, which were the same loader with
// the site identity swapped (division/host/name/enquiryUrl/phone/ctaLabel) plus
// two genuine field differences: Cleaning's index-grid summary carried
// readTime/tags that Security's didn't; Security's carried an image field
// (defaulting to the sentinel from F2-06 item A) that Cleaning's didn't.
//
// Both differences are resolved as additive-optional fields on the shared
// MarkdownBlogSummary type (readTime?, tags?, image?) — the loader computes
// ALL THREE unconditionally (cheap to derive; a consumer that doesn't read a
// field is unaffected by its presence), rather than picking one site's shape
// and breaking the other.
//
// This module RENDERS; it does not author. It runs only at build time / on the
// server (Node fs) — never import it into a Client Component.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { SENTINEL_IMAGE_PATH } from '../types';
import type { PageJson } from '../types';
import { buildJsonLd } from '../seo/schema';

// ── Public contract ──────────────────────────────────────────────────────────

/** Site-scoped identity. This loader is per-repo and renders only THIS site's
 *  posts, so it references only this site's NAP — never another division's
 *  phone (a foreign number here would hard-block the SEO NAP gate). */
export type MarkdownBlogIdentity = {
  division: string;
  host: string;
  name: string;
  enquiryUrl: string;
  phone: string;
  ctaLabel: string;
};

export type MarkdownBlogImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
};

/** Index-grid summary. readTime/tags (Cleaning's fields) and image (Security's
 *  field) are all computed unconditionally; each consumer reads only what its
 *  own rendering uses. */
export interface MarkdownBlogSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime?: string;
  tags?: string[];
  image?: string;
}

export interface MarkdownBlogPostData {
  seo: { title: string; description: string; canonical: string; focusKeyword: string };
  h1: string;
  published: string;
  updated?: string;
  author: string;
  readTime: number;
  intro: string;
  body: string;
  conclusion: string;
  faqs?: { question: string; answer: string }[];
  relatedPosts: { title: string; href: string; date: string }[];
  cta: { primaryLabel: string; primaryUrl: string; phone: string; phoneLabel?: string };
  images: { header: MarkdownBlogImage; og: MarkdownBlogImage };
  tags: string[];
}

/** A loaded post plus the division needed by BlogPost / schema generation. */
export interface MarkdownBlogLoaderResult {
  data: MarkdownBlogPostData;
  division: string;
}

export interface MarkdownBlogLoader {
  getMarkdownSlugs(): string[];
  getMarkdownPost(slug: string): MarkdownBlogLoaderResult | null;
  getMarkdownPostSummaries(): MarkdownBlogSummary[];
}

// ── Internal helpers (identity-blank; no division/site literal anywhere here) ─

/** Strip HTML tags and decode the handful of entities that affect plain-text
 *  derivations (description, word count). */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First <p>…</p> block of an HTML body, or null. */
function firstParagraph(html: string): string | null {
  const m = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/i);
  return m ? m[0] : null;
}

/** Derive a 50–160 char meta description from plain body text. */
function deriveDescription(text: string): string {
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 50 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/** Humanise a slug-like token, e.g. "office-cleaning" → "Office cleaning". */
function humanise(token: string): string {
  const s = token.replace(/[-_]+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Builds a per-site markdown blog loader. `blogDir` defaults to
 * `content/blog` under `process.cwd()`, matching both consumers' existing
 * layout; override only for tests.
 */
export function createMarkdownBlogLoader(
  identity: MarkdownBlogIdentity,
  opts: { blogDir?: string } = {}
): MarkdownBlogLoader {
  const BLOG_DIR = opts.blogDir ?? path.join(process.cwd(), 'content/blog');

  function readMarkdownFiles(): string[] {
    if (!fs.existsSync(BLOG_DIR)) return [];
    return fs.readdirSync(BLOG_DIR).filter((f) => f.toLowerCase().endsWith('.md'));
  }

  function getMarkdownSlugs(): string[] {
    return readMarkdownFiles().map((f) => f.replace(/\.md$/i, ''));
  }

  function buildSummary(slug: string): MarkdownBlogSummary | null {
    const file = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return null;
    const { data: fm, content } = matter(fs.readFileSync(file, 'utf8'));

    const title = String(fm.title ?? humanise(slug));
    const plain = stripTags(content);
    const wordCount = plain ? plain.split(/\s+/).length : 0;
    const category =
      (fm.service_type && humanise(String(fm.service_type))) ||
      (fm.borough && humanise(String(fm.borough))) ||
      'Insights';
    const tags = [fm.service_type, fm.borough]
      .map((t) => (t == null ? '' : String(t).trim()))
      .filter(Boolean);

    return {
      slug,
      title,
      excerpt: deriveDescription(plain || title),
      date: String(fm.date ?? ''),
      category,
      readTime: `${Math.max(1, Math.ceil(wordCount / 200))} min read`,
      tags,
      image: fm.image ? String(fm.image) : SENTINEL_IMAGE_PATH,
    };
  }

  function getMarkdownPostSummaries(): MarkdownBlogSummary[] {
    return getMarkdownSlugs()
      .map(buildSummary)
      .filter((s): s is MarkdownBlogSummary => s !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function getMarkdownPost(slug: string): MarkdownBlogLoaderResult | null {
    const file = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return null;

    const raw = fs.readFileSync(file, 'utf8');
    const { data: fm, content } = matter(raw);

    const title = String(fm.title ?? humanise(slug));

    const bodyHtml = content.trim();
    const intro = firstParagraph(bodyHtml);
    // If the first paragraph becomes the intro box, drop it from the body so
    // it does not render twice.
    const body = intro ? bodyHtml.replace(intro, '').trim() : bodyHtml;
    const plain = stripTags(bodyHtml);
    const wordCount = plain ? plain.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const introHtml = intro ?? (plain ? `<p>${deriveDescription(plain)}</p>` : '<p></p>');
    const description = deriveDescription(plain || title);

    const tags = [fm.service_type, fm.borough]
      .map((t) => (t == null ? '' : String(t).trim()))
      .filter(Boolean);

    // Related: other markdown posts in this repo (single division — never
    // cross-divisional), newest first, up to 3.
    const relatedPosts = getMarkdownPostSummaries()
      .filter((s) => s.slug !== slug)
      .slice(0, 3)
      .map((s) => ({ title: s.title, href: `/blog/${s.slug}/`, date: s.date }));

    const imageSrc = fm.image ? String(fm.image) : SENTINEL_IMAGE_PATH;
    const imageAlt = fm.image_alt ? String(fm.image_alt) : `${title} — ${identity.name}`;

    const data: MarkdownBlogPostData = {
      seo: {
        title: `${title} | ${identity.name}`,
        description,
        canonical: `${identity.host}/blog/${slug}`,
        focusKeyword: fm.focus_keyword ? String(fm.focus_keyword) : '',
      },
      h1: title,
      published: String(fm.date ?? ''),
      author: fm.author ? String(fm.author) : `${identity.name} team`,
      readTime,
      intro: introHtml,
      body,
      conclusion: '',
      relatedPosts,
      cta: {
        primaryLabel: identity.ctaLabel,
        primaryUrl: identity.enquiryUrl,
        phone: identity.phone,
        phoneLabel: `Call ${identity.phone}`,
      },
      images: {
        header: { src: imageSrc, alt: imageAlt, width: 1200, height: 628, priority: true },
        og: { src: imageSrc, alt: imageAlt, width: 1200, height: 628 },
      },
      tags,
    };

    return { data, division: identity.division };
  }

  return { getMarkdownSlugs, getMarkdownPost, getMarkdownPostSummaries };
}

// ── BlogPosting JSON-LD (F2-07 item A) ───────────────────────────────────────
//
// Markdown blog posts have no PageJson of their own (they render through the
// bespoke BlogPostData/BlogPost path, not the Shell/sections registry), so
// this builds a minimal synthetic PageJson from a loaded post + its site
// identity and hands it to the framework's own buildJsonLd() — reusing its
// Organization/WebSite/BlogPosting/FAQPage/BreadcrumbList logic rather than a
// second JSON-LD implementation (replacing each site's bespoke
// lib/schema/blog-post-schema.ts, which only ever emitted 'Article').
//
// This is a disclosed, intentional output change versus the retired bespoke
// generator: Organization/WebSite nodes are now present (every other
// PageJson-driven page already carries them), and '@type' is 'BlogPosting'
// rather than 'Article'. The blog POST CONTENT itself (outside this JSON-LD
// script tag) is unaffected.
export function buildMarkdownBlogJsonLd(
  post: MarkdownBlogPostData,
  identity: MarkdownBlogIdentity,
  opts: { slug: string }
): Record<string, any> {
  const origin = identity.host.replace(/\/$/, '');
  const page: PageJson = {
    schema_version: 1,
    site: identity.division,
    slug: `/blog/${opts.slug}`,
    page_type: 'blog_post',
    seo: {
      title: post.seo.title,
      description: post.seo.description,
      canonical: post.seo.canonical,
      schema_type: 'BlogPosting',
      date_published: post.published,
      date_modified: post.updated ?? post.published,
      og_image: post.images.og?.src,
    },
    brand: { bg: '#000000', text: '#ffffff', cta: '#000000', secondary: '#000000' },
    nap: {
      phone: identity.phone,
      trading_name: identity.name,
      enquiry_url: identity.enquiryUrl,
    },
    sections: [
      {
        type: 'hero',
        fields: {
          breadcrumbs: [
            { label: identity.name, href: '/' },
            { label: 'Blog', href: '/blog/' },
            { label: post.h1, href: post.seo.canonical },
          ],
        },
      },
      ...(post.faqs && post.faqs.length > 0
        ? [{ type: 'faq', fields: { items: post.faqs.map((f) => ({ q: f.question, a: f.answer })) } }]
        : []),
    ],
  };
  return buildJsonLd(page, { origin });
}
