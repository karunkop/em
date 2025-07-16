import { Page } from 'puppeteer-core'

/**
 * Inject system font overrides for consistent test rendering.
 * This replaces custom web fonts with system fonts to eliminate timing issues.
 */
const useSystemFonts = async (page: Page) => {
  await page.addStyleTag({
    content: `
      /* Override all custom fonts with system fonts for test consistency */
      *, *::before, *::after {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
      }
      
      /* Override body and html to ensure global font changes */
      html, body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
      }
      
      /* Specific overrides for monospace elements */
      code, kbd, pre, textarea,
      [style*="font-family: monospace"],
      [style*="font-family: 'monospace'"],
      [style*="fontFamily: monospace"],
      [style*="fontFamily: 'monospace'"],
      .editable[style*="fontFamily: 'monospace'"] {
        font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace !important;
      }
      
      /* Override any Lora font specifically */
      [style*="font-family: 'Lora'"],
      [style*="fontFamily: 'Lora'"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
      }
    `,
  })
}

export default useSystemFonts
