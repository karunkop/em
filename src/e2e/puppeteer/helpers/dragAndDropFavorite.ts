import { page } from '../setup'
import hide from './hide'
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

    // Move directly to the destination with sufficient steps to reliably
    // trigger native HTML5 dragstart on the draggable ancestor.
    await page.mouse.move(dropPosition.x, dropPosition.y, { steps: 10 })
  }

  // Wait for the drag-and-drop alert to appear. The alert is dispatched by either
  // DragHold (400ms long press timer) or DragInProgress (native dragstart),
  // whichever fires first. This dual-path approach matches dragAndDropThought
  // and avoids relying solely on native drag detection.
  await page.locator('[data-testid="alert-content"]').wait()

  if (mouseUp) {
    await page.mouse.up()

    await waitUntil(() => {
      const dragInProgress = document.querySelector('[data-drag-in-progress="true"]')
      const dragHold = document.querySelector('[data-drag-hold="true"]')
      return !dragInProgress && !dragHold
    })
  }

  await hide('[data-testid="alert"]')
}

export default dragAndDropFavorite
