// Extracted verbatim from netyvee/staffing components/sections/Prose.tsx — F1.2.
// Text-only prose block for migrated/restored source body content. No image slot.
//
// netyvee/app#344 (F2 Step 5c prerequisite) — `fields.body` renders as exactly one
// flat paragraph, which cannot represent a real multi-heading document (legal/
// policy pages: headings, lists, inline links/emphasis) without collapsing and
// losing that structure. `fields.blocks` is an ADDITIVE, optional alternative:
// when present it renders structured content instead of the single paragraph;
// when absent, behaviour is byte-identical to before (proven in
// tests/prose-rich-content.test.tsx against every current Care/Staffing/Main
// `prose` section). Blocks are plain data (ProseBlock/ProseInline), never raw
// HTML/dangerouslySetInnerHTML — there is no executable-markup surface here.
import * as React from 'react';
import type { PageJson, ProseBlock, ProseInline } from '../types';

function renderInline(node: ProseInline, key: number) {
  const text = typeof node === 'string' ? node : node.text;
  if (typeof node === 'string' || (!node.bold && !node.italic && !node.href)) {
    return <React.Fragment key={key}>{text}</React.Fragment>;
  }
  let el: React.ReactNode = text;
  if (node.href) el = <a href={node.href}>{el}</a>;
  if (node.italic) el = <em>{el}</em>;
  if (node.bold) el = <strong>{el}</strong>;
  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderBlock(block: ProseBlock, key: number) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 3 ? 'h3' : 'h2';
      return (
        <Tag key={key} className={block.level === 3 ? 'mb-3 mt-6 text-xl font-medium' : 'mb-4 mt-8 text-2xl font-medium'}>
          {block.text}
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={key} className="mb-4 leading-relaxed opacity-80">
          {block.content.map((n, i) => renderInline(n, i))}
        </p>
      );
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={key} className="mb-4 list-inside list-disc space-y-1 opacity-80">
          {block.items.map((item, i) => (
            <li key={i}>{item.map((n, j) => renderInline(n, j))}</li>
          ))}
        </ListTag>
      );
    }
    default:
      // Parity guard, matching the section-registry's own unknown-type handling:
      // an unrecognised block is a content/schema drift signal, not silently
      // swallowed structure. Fails loudly outside production, no-ops in it.
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Unknown prose block type: ${(block as { type?: string }).type}`);
      }
      return null;
  }
}

export function Prose({ fields, page }: { fields: any; page: PageJson }) {
  const blocks: ProseBlock[] | undefined = fields?.blocks;
  if (!fields?.body && !(blocks && blocks.length > 0)) return null;
  return (
    <section style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {fields.heading && <h2 className="mb-4 text-2xl font-medium">{fields.heading}</h2>}
        {blocks && blocks.length > 0
          ? blocks.map((b, i) => renderBlock(b, i))
          : fields.body && <p className="leading-relaxed opacity-80">{fields.body}</p>}
      </div>
    </section>
  );
}
