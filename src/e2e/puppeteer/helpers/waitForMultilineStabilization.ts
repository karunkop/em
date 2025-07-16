import { page } from '../setup'

/**
 * Waits for multiline URL layout to fully stabilize after cursor changes.
 *
 * This addresses the complex timing issues in multiline URL expansion:
 * - Height measurements and calculations.
 * - CSS transitions and layout effects.
 * - Padding/margin adjustments.
 * - Multiple requestAnimationFrame cycles.
 * - Layout reflow from cursor changes.
 */
const waitForMultilineStabilization = async (timeoutMs: number = 3000): Promise<void> => {
  try {
    // Wait for initial layout effects to complete
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        // Wait for 6 animation frames to ensure all layout effects have processed
        let count = 0
        /**
         * This function is used to wait for 6 animation frames to ensure all layout effects have processed.
         * It is used to wait for the initial layout effects to complete.
         * It is used to wait for the height calculations to stabilize.
         * It is used to wait for the CSS transitions to complete.
         */
        const frame = () => {
          count++
          if (count >= 6) {
            resolve()
          } else {
            requestAnimationFrame(frame)
          }
        }
        requestAnimationFrame(frame)
      })
    })

    // Wait for height calculations to stabilize
    await page.waitForFunction(
      () => {
        // Check if any elements are currently measuring heights
        const editables = document.querySelectorAll('[data-editable]')

        // Ensure all multiline calculations have completed
        for (const editable of Array.from(editables)) {
          const rect = editable.getBoundingClientRect()

          // Check if height is stable (no zero heights which indicate incomplete layout)
          if (rect.height === 0) {
            return false
          }

          // Check for any CSS transitions still running
          const computedStyle = window.getComputedStyle(editable)
          if (computedStyle.transitionProperty !== 'none' && computedStyle.transitionDuration !== '0s') {
            return false
          }
        }

        // Check ThoughtAnnotation elements for stability
        const annotations = document.querySelectorAll('[aria-label="thought-annotation"]')
        for (const annotation of Array.from(annotations)) {
          const rect = annotation.getBoundingClientRect()
          if (rect.height === 0) {
            return false
          }
        }

        return true
      },
      { timeout: timeoutMs, polling: 100 },
    )

    // Additional wait to ensure no further layout changes
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        // Double-check stability with one more frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
      })
    })

    // Small final delay to ensure complete stabilization
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    // If layout stabilization times out, log a warning but continue
    console.warn('Multiline layout stabilization timeout - proceeding with test. This may cause visual differences.')
  }
}

export default waitForMultilineStabilization
