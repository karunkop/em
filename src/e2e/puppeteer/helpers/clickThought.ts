import { page } from '../setup'

/**
 * Click the thought for the given thought value with robust error handling and retry logic.
 * Handles element detachment and provides incremental backoff on failures.
 */
const clickThought = async (value: string, options = { timeout: 1000, retries: 3 }) => {
  for (let attempt = 0; attempt < options.retries; attempt++) {
    try {
      // Find all editable elements and filter by text content
      const elements = await page.$$('[data-editable]')
      let targetElement = null

      // Find the element with matching text content
      for (const element of elements) {
        const textContent = await element.evaluate(node => node.textContent)
        const isConnected = await element.evaluate(node => node.isConnected)

        if (textContent === value && isConnected) {
          targetElement = element
          break
        }
        await element.dispose()
      }

      if (!targetElement) {
        // Clean up remaining elements
        for (const element of elements) {
          await element.dispose()
        }
        throw new Error(`Element with text "${value}" not found`)
      }

      // Double-check DOM connection right before click
      const isConnected = await targetElement.evaluate(node => node.isConnected)
      if (!isConnected) {
        await targetElement.dispose()
        throw new Error('Element detached before click')
      }

      // Verify element is still visible and interactable
      const boundingBox = await targetElement.boundingBox()
      if (!boundingBox) {
        await targetElement.dispose()
        throw new Error('Element not visible or has no dimensions')
      }

      await targetElement.click()
      await targetElement.dispose()
      return
    } catch (error) {
      const isLastAttempt = attempt === options.retries - 1
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (isLastAttempt) {
        throw new Error(`Failed to click thought "${value}" after ${options.retries} attempts: ${errorMessage}`)
      }

      // Incremental backoff: 50ms, 100ms, 150ms
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
    }
  }
}

export default clickThought
