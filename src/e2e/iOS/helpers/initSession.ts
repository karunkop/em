import { Browser } from 'webdriverio'
import waitForElement from './waitForElement'

// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/prefer-namespace-keyword
declare module global {
  const browser: Browser
}

/** Returns a function that starts a new browserstack session and skips the tutorial. The function will reload the session after the first test. */
const initSession = (): (() => Promise<Browser>) => {
  const mobileBrowser = global.browser
  let isFirstTest = true

  return async () => {
    // For subsequent tests, just refresh the page and clear state instead of creating a new session
    // reloadSession() is very slow on BrowserStack as it creates a completely new session
    if (!isFirstTest) {
      // Clear localStorage to reset app state
      await mobileBrowser.execute(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      // Refresh the page to get a clean state
      await mobileBrowser.refresh()
    } else {
      isFirstTest = false
      // Use bs-local.com for BrowserStack Local tunnel (localhost won't work on remote device)
      await mobileBrowser.url('http://bs-local.com:3000')
    }

    const skipElement = await waitForElement(mobileBrowser, '#skip-tutorial', { timeout: 90000 })
    await mobileBrowser.waitUntil(async () => await skipElement.isClickable())
    await skipElement.click()
    await waitForElement(mobileBrowser, '[aria-label="empty-thoughtspace"]', { timeout: 90000 })
    return mobileBrowser
  }
}

export default initSession
