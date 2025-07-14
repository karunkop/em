import { page } from '../setup'

/**
 * Waits for two consecutive animation frames to ensure complete rendering.
 *
 * This technique guarantees:
 * 1. All pending `requestAnimationFrame` callbacks execute (first frame).
 * 2. Resulting DOM updates process through style/layout/paint (second frame).
 * 3. Browser reaches stable visual state for screenshots.
 *
 * Essential for eliminating flaky tests where:
 * - Components use rAF for state updates (e.g., Superscript calculations).
 * - CI environments have slower frame rates (20-30 FPS vs local 60 FPS).
 * - Fixed timeouts (e.g., `sleep(200)`) fail to capture final render.
 */
const waitForFrames = (numberOfFrames = 1) =>
  page.evaluate(frames => {
    return new Promise(resolve => {
      for (let i = 0; i < frames; i++) {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      }
    })
  }, numberOfFrames)

export default waitForFrames
