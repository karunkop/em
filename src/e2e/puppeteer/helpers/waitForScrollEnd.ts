import { page } from '../setup'

/**
 * Waits for the scroll position to stabilize after a scroll event.
 *
 * This is useful for ensuring that the scroll position is at the expected value after a scroll event.
 *
 * @returns A promise that resolves when the scroll position has stabilized.
 */
const waitForScrollEnd = () =>
  page.evaluate(() => {
    return new Promise(resolve => {
      let lastY = window.scrollY
      /** Function to be called on each frame. */
      const check = () => {
        requestAnimationFrame(() => {
          if (window.scrollY === lastY) {
            resolve(undefined)
          } else {
            lastY = window.scrollY
            setTimeout(check, 50)
          }
        })
      }
      check()
    })
  })

export default waitForScrollEnd
