// @vigil/web-framework — public surface (v0.1.0).
export * from './types';
export { getPageSlugs, getPage, paramsToFile, imgSrc, imgAlt } from './loader';
export { buildPageMetadata } from './metadata';
export { RenderSections, SECTION_TYPES } from './sections/registry';
export { Hero } from './sections/Hero';
export { ServiceGrid } from './sections/ServiceGrid';
export { TextImage } from './sections/TextImage';
export { Prose } from './sections/Prose';
export { Cta } from './sections/Cta';
export { Faq } from './sections/Faq';
export { Testimonial } from './sections/Testimonial';
export { ContactForm } from './sections/ContactForm';
export { BoroughBlock } from './sections/BoroughBlock';
export { Header } from './shell/Header';
export { Footer } from './shell/Footer';
export { MobileCta } from './shell/MobileCta';
