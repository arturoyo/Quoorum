/**
 * Layout Components Index
 *
 * IMPORTANT: All header/footer imports should come from this file.
 * This centralizes layout component usage and ensures consistency.
 *
 * Component Usage Hierarchy:
 * 1. AppShell (RECOMMENDED for most pages)
 *    - Wraps: header + content + footer with proper spacing
 *    - Use this in page layouts to avoid duplicating header/footer logic
 *
 * 2. Individual Components (for advanced/custom layouts)
 *    - AppHeader - Global app header (fixed, z-50)
 *    - AppFooter - Global app footer (fixed, z-40)
 *    - LandingFooter - Landing page footer variant
 *
 * 3. Utilities
 *    - AnimatedBackground - Reusable animated gradient background
 */

export { AppShell } from './app-shell'
export { AppHeader } from './app-header'
export { AppFooter } from './app-footer'
export { LandingFooter } from './landing-footer'
export { AnimatedBackground } from './animated-background'
