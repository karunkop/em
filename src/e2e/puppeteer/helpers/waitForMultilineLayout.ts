import { page } from '../setup'
import waitForEditable from './waitForEditable'
import waitForFrames from './waitForFrames'

/**
 * Waits for multiline URL layout to be completely stable.
 *
 * This helper ensures that:
 * 1. The element exists with the correct content.
 * 2. Fonts are loaded and layout is stable.
 * 3. The element has proper multiline layout.
 * 4. All rendering is complete.
 *
 * Essential for stable screenshot tests of long URLs.
 */
const waitForMultilineLayout = async (value: string, timeout: number = 10000) => {
  // First ensure the element exists
  await waitForEditable(value)

  // Then wait for complete layout stabilization
  await page.waitForFunction(
    (value: string) => {
      // Wait for fonts to load
      if (document.fonts && !document.fonts.ready) {
        return false
      }

      // Find all URL thoughts
      const urlThoughts = Array.from(document.querySelectorAll('[data-editable]')).filter(el =>
        el.textContent?.includes('https://'),
      )

      // Find the specific thought we're waiting for
      const targetThought = urlThoughts.find(el => el.textContent?.includes(value))

      if (!targetThought) return false

      // Check that fonts are loaded and layout is stable
      const computedStyle = window.getComputedStyle(targetThought)
      const rect = targetThought.getBoundingClientRect()

      // Verify the thought has proper multiline layout
      const fontSize = parseFloat(computedStyle.fontSize)
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2
      const hasMultipleLines = rect.height > lineHeight * 1.5

      // Verify width has stabilized (not zero or unreasonably small)
      const hasStableWidth = rect.width > 100

      // Verify the element is visible and positioned
      const isVisible = rect.width > 0 && rect.height > 0

      // Check that the computed style has settled
      const hasStableStyle =
        computedStyle.fontSize !== '0px' && computedStyle.fontSize !== '' && computedStyle.display !== 'none'

      return hasMultipleLines && hasStableWidth && isVisible && hasStableStyle
    },
    { timeout },
    value,
  )

  // Wait for rendering to complete
  await waitForFrames()

  // Additional check for DOM stability
  await page.evaluate(async () => {
    // Wait for any pending layout recalculations
    await new Promise<void>(resolve => {
      let lastHeight = 0
      let stableCount = 0

      /**
       * Checks if the DOM has stabilized by checking the scroll height of the body.
       * If the scroll height is the same as the last height, the DOM has stabilized and the promise is resolved.
       * Otherwise, the function is called again.
       */
      const checkStability = () => {
        const currentHeight = document.body.scrollHeight
        if (currentHeight === lastHeight) {
          stableCount++
          if (stableCount >= 3) {
            // Wait for 3 consecutive stable measurements
            return resolve()
          }
        } else {
          stableCount = 0
        }
        lastHeight = currentHeight
        requestAnimationFrame(checkStability)
      }
      requestAnimationFrame(checkStability)
    })
  })
}

export default waitForMultilineLayout
