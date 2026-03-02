import click from '../helpers/click'
import clickThought from '../helpers/clickThought'
import dragAndDropFavorite from '../helpers/dragAndDropFavorite'
import paste from '../helpers/paste'
import press from '../helpers/press'
import { page } from '../setup'

vi.setConfig({ testTimeout: 60000, hookTimeout: 20000 })

/** Get the order of favorites as displayed in the sidebar. */
const selectFavoritesText = async () => {
  const result = await page.evaluate(() => {
    // XPath to find all thought-links that are NOT in breadcrumbs, within drag-and-drop-favorite
    const xpath = `//*[@data-testid='drag-and-drop-favorite']//*[@data-thought-link and not(ancestor::*[@aria-label='context-breadcrumbs'])]`

    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

    const links = Array.from({ length: result.snapshotLength }, (_, i) => {
      const link = result.snapshotItem(i) as HTMLElement
      return link.textContent?.trim() || ''
    }).filter(text => text !== '')

    return links
  })

  return result
}

describe('favorites drag and drop', () => {
  it('should reorder favorites by dragging and dropping', async () => {
    await paste(`
      - a
      - b
      - c
      - d
      - e
    `)

    // Add thoughts to favorites
    await clickThought('a')
    await click('[aria-label="Add to Favorites"]')

    await clickThought('b')
    await click('[aria-label="Add to Favorites"]')

    await clickThought('c')
    await click('[aria-label="Add to Favorites"]')

    await clickThought('d')
    await click('[aria-label="Add to Favorites"]')

    // Open favorites in sidebar
    await click('[aria-label="menu"]')
    await page.locator('[data-testid="sidebar"]').wait()

    console.info('Now asserting initial order')

    // Verify initial order
    expect(await selectFavoritesText()).toEqual(['a', 'b', 'c', 'd'])

    console.info('Now dragging d to b')

    await dragAndDropFavorite('d', 'b', { position: 'before' })

    console.info('Now asserting new order')

    // Verify new order - d should now be before b
    expect(await selectFavoritesText()).toEqual(['a', 'd', 'b', 'c'])

    console.info('Done')
  })

  it('should reorder favorites by dragging to the end or top of the list', async () => {
    await paste(`
      - a
- b
- c
- d
  - e
    `)

    // Add thoughts to favorites
    await clickThought('a')
    await click('[aria-label="Add to Favorites"]')

    await clickThought('b')
    await click('[aria-label="Add to Favorites"]')

    await clickThought('c')
    await click('[aria-label="Add to Favorites"]')

    await press('ArrowDown')
    await clickThought('e')
    await click('[aria-label="Add to Favorites"]')

    // Open favorites in sidebar
    await click('[aria-label="menu"]')
    await page.locator('[data-testid="sidebar"]').wait()
    console.info('Now asserting initial order')

    // Verify initial order
    expect(await selectFavoritesText()).toEqual(['a', 'b', 'c', 'e'])

    console.info('Now dragging a to c')

    // Drag "a" after "c"
    await dragAndDropFavorite('a', 'c', { position: 'after' })

    console.info('Now asserting new order after dragging a to c')

    // Verify new order - a should now be after c
    expect(await selectFavoritesText()).toEqual(['b', 'c', 'a', 'e'])

    console.info('Now dragging e to b')

    // Drag "e" before "b" (to the top)
    await dragAndDropFavorite('e', 'b', { position: 'before' })

    console.info('Now asserting new order after dragging e to b')

    // Verify new order - c should now be before b
    expect(await selectFavoritesText()).toEqual(['e', 'b', 'c', 'a'])
  })
})
