import { ElementHandle } from 'puppeteer'
import { JSHandle } from 'puppeteer'
import { page } from '../setup'

/**
 * Tap and hold a thought until a long press occurs.
 */
const longPressThought = async (nodeHandle: ElementHandle<Element> | JSHandle<undefined>) => {
  // Find the specific bullet element associated with this thought
  const bulletElement = await page.evaluateHandle(editableNode => {
    if (!editableNode) throw new Error('Node handle does not contain a valid Element')

    // Find the thought container that contains this editable
    const thoughtContainer = editableNode.closest('[aria-label="thought-container"]')
    if (!thoughtContainer) throw new Error('Thought container not found')

    // Find the bullet element within this specific thought container
    const bullet = thoughtContainer.querySelector('[aria-label="bullet"]')
    if (!bullet) throw new Error('Bullet not found in thought container')

    return bullet
  }, nodeHandle)

  if (!(bulletElement instanceof ElementHandle)) throw new Error('Bullet element not found')

  // Get the bounding box of the bullet element specifically
  const bulletBoundingBox = await bulletElement.boundingBox()
  if (!bulletBoundingBox) throw new Error('Bullet bounding box not found')

  // Always use the center of the bullet for long press
  const coordinate = {
    x: bulletBoundingBox.x + bulletBoundingBox.width / 2,
    y: bulletBoundingBox.y + bulletBoundingBox.height / 2,
  }

  await page.touchscreen.touchStart(coordinate.x, coordinate.y)

  // Wait for this specific bullet to be highlighted
  await page.waitForFunction(
    (bulletEl: Element) => bulletEl.getAttribute('data-highlighted') === 'true',
    { timeout: 5000 },
    bulletElement,
  )

  await page.touchscreen.touchEnd()
}

export default longPressThought
