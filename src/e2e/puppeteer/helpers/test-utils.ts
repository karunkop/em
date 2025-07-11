import { Page } from 'puppeteer'

/**
 * Waits for the DOM to be stable.
 *
 * This function ensures that the DOM is fully rendered and stable before the test continues.
 * It waits for the fonts to load and then checks if the DOM has stabilized by checking the scroll width of the body.
 */
const waitForStableDOM = async (page: Page) =>
  page.evaluate(async () => {
    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }

    // Wait for rendering stability
    await new Promise<void>(resolve => {
      let lastWidth = 0
      /**
       * Checks if the DOM has stabilized by checking the scroll width of the body.
       * If the scroll width is the same as the last width, the DOM has stabilized and the promise is resolved.
       * Otherwise, the function is called again.
       */
      const checkStability = () => {
        const currentWidth = document.body.scrollWidth
        if (currentWidth === lastWidth) return resolve()
        lastWidth = currentWidth
        requestAnimationFrame(checkStability)
      }
      requestAnimationFrame(checkStability)
    })
  })

/**
 * Forces consistent rendering by adding a style tag to the page.
 *
 * This function adds a style tag to the page that ensures consistent rendering by disabling animations and ensuring the font is consistent.
 */
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

export default waitForStableDOM
