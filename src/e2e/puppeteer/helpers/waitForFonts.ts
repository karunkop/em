import { page } from '../setup'

/**
 * Waits for all web fonts to finish loading to prevent font-related flakiness in visual tests.
 * This addresses the FOUT (Flash of Unstyled Text) issue where screenshots can be taken.
 * Before web fonts have fully loaded, causing inconsistent rendering between test runs.
 */
const waitForFonts = async (timeoutMs: number = 5000): Promise<void> => {
  try {
    // Wait for document.fonts.ready promise to resolve
    await page.evaluate(() => document.fonts.ready)

    // Additional check to ensure fonts are ready and any layout has stabilized
    await page.waitForFunction(
      () => {
        // Verify document.fonts.status indicates all fonts are loaded
        return document.fonts.status === 'loaded'
      },
      { timeout: timeoutMs },
    )

    // Small additional delay to ensure any final layout calculations are complete
    // This accounts for potential DOM updates after font loading
    await new Promise(resolve => setTimeout(resolve, 50))
  } catch (error) {
    // If font loading times out, log a warning but continue
    // This prevents tests from failing due to font loading issues in CI environments
    console.warn('Font loading timeout - proceeding with test. This may cause visual differences.')
  }
}

export default waitForFonts
