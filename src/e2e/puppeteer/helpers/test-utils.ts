import { Page } from 'puppeteer'

/**
 * Waits for the DOM to be stable.
 *
 * This function ensures that the DOM is fully rendered and stable before
 * the test continues. It waits for the fonts to load and then checks if
 * the DOM has stabilized by checking the scroll width of the body.
 */
export const waitForStableDOM = async (page: Page) =>
  page.evaluate(async () => {
    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }

    // Wait for rendering stability
    await new Promise<void>(resolve => {
      let lastWidth = 0
      const checkStability = () => {
        const currentWidth = document.body.scrollWidth
        if (currentWidth === lastWidth) return resolve()
        lastWidth = currentWidth
        requestAnimationFrame(checkStability)
      }
      requestAnimationFrame(checkStability)
    })
  })

export const forceConsistentRendering = async (page: Page) =>
  page.addStyleTag({
    content: `
        * {
          font-family: "DejaVu Sans Mono", monospace !important;
          text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: antialiased !important;
          animation: none !important;
          caret-color: transparent !important;
        }
        :focus {
          outline: none !important;
        }
      `,
  })
