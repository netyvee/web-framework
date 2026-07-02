'use client';
// Extracted verbatim from netyvee/care components/shell/Header.tsx — F1.2.
// One change class only: the site-owned `siteNav` import became the `nav` prop
// (identical fields), so the framework carries zero site structure. Markup unchanged.

import Link from 'next/link';
import { useState } from 'react';
import type { PageJson, SiteNav } from '../types';

// Header/logo/nav + mobile nav. Brand from the page; NAP (phone) from page.nap —
// never a literal here.
export function Header({ page, nav }: { page: PageJson; nav: SiteNav }) {
  const [open, setOpen] = useState(false);
  const brand = page.brand;
  const phone = page.nap.phone;
  return (
    <header style={{ background: brand.bg, color: brand.text }} className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium" style={{ color: brand.text }}>
          {nav.brandName}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.primary.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm opacity-85 hover:opacity-100">{l.label}</Link>
          ))}
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-sm font-medium" style={{ color: brand.secondary }}>{phone}</a>
          <a href={page.nap.enquiry_url} style={{ background: brand.cta, color: brand.bg }}
             className="rounded-lg px-4 py-2 text-sm font-medium">Enquire</a>
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden" aria-label="Menu" style={{ color: brand.text }}>☰</button>
      </div>
      {open && (
        <nav className="border-t border-white/10 px-6 py-4 md:hidden">
          {nav.primary.map((l) => (
            <Link key={l.href} href={l.href} className="block py-2 text-sm opacity-85" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <a href={page.nap.enquiry_url} style={{ background: brand.cta, color: brand.bg }}
             className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium">Enquire</a>
        </nav>
      )}
    </header>
  );
}
