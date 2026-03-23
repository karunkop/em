import { page } from '../setup'
import waitUntil from './waitUntil'

/**
 * Helper to find favorite item by text value.
 * Uses XPath to find the thought-link with exact text, not in breadcrumbs, within drag-and-drop-favorite.
 */
const findFavoriteItem = async (value: string) => {
  return await page.evaluateHandle(value => {
    // XPath to find thought-link with exact text value which is not in breadcrumbs but just within drag-and-drop-favorite
    const xpath = `//*[@data-testid='drag-and-drop-favorite'][.//*[@data-thought-link and not(ancestor::*[@aria-label='context-breadcrumbs']) and normalize-space()='${value}']]`

    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue as HTMLElement
  }, value)
}

/** Performs Drag and Drop functionality on a favorite thought in the sidebar. */
const dragAndDropFavorite = async (
  sourceValue: string,
  destValue: string | null,
  {
    position = 'before',
    mouseUp = true,
  }: {
    position?: 'before' | 'after'
    mouseUp?: boolean
  } = {},
) => {
  const sourceElement = await findFavoriteItem(sourceValue)
  if (!sourceElement.boundingBox) {
    console.error({ sourceElement, sourceValue, destValue })
    throw new Error('Source element has no bounding box')
  }

  const dragStart = await sourceElement.boundingBox()
  if (!dragStart) throw new Error('Drag source element not found')

  // Click at the top-left of the element to avoid landing on child <a> elements
  // from Link/ContextBreadcrumbs, which call stopPropagation() on mousedown and
  // prevent useLongPress from firing.
  const dragPosition = {
    x: dragStart.x + 2,
    y: dragStart.y + 2,
  }

  await page.mouse.move(dragPosition.x, dragPosition.y)
  await page.mouse.down()

  // Wait for the long press timer (400ms) to confirm useLongPress
  // received the mousedown and the browser has registered the mousedown
  // position for drag detection.
  await page.locator('[data-drag-hold="true"]').wait()

  // Small movement to trigger native HTML5 dragstart. The browser
  // needs explicit mouse movement after a settled mousedown to initiate a
  // drag gesture on the ancestor div[draggable="true"].
  await page.mouse.move(dragPosition.x, dragPosition.y + 20, { steps: 5 })

  // Confirm native drag started (beginDrag fired). This ensures react-dnd
  // has an active drag session so the drop handler will process the reorder.
  await page.locator('[data-drag-in-progress="true"]').wait()

  if (destValue) {
    const destElement = await findFavoriteItem(destValue)
    if (!destElement.boundingBox) {
      console.error({ destElement, destValue })
      throw new Error('Destination element has no bounding box')
    }

    const dragEnd = await destElement.boundingBox()
    if (!dragEnd) throw new Error('Drag destination element not found')

    const dropPosition = {
      x: dragEnd.x + dragEnd.width / 2,
      y: position === 'before' ? dragEnd.y + 2 : dragEnd.y + dragEnd.height + 2,
    }

    // Phase 3: Move to the final drop position.
    await page.mouse.move(dropPosition.x, dropPosition.y, { steps: 10 })
  }

  if (mouseUp) {
    await page.mouse.up()

    await waitUntil(() => {
      const dragInProgress = document.querySelector('[data-drag-in-progress="true"]')
      const dragHold = document.querySelector('[data-drag-hold="true"]')
      return !dragInProgress && !dragHold
    })
  }
}

export default dragAndDropFavorite
