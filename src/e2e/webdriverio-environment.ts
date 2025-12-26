import { type Environment, builtinEnvironments, populateGlobal } from 'vitest/environments'
import chalk from 'chalk'
import portUsed from 'tcp-port-used'
import { remote } from 'webdriverio'
import { nanoid } from 'nanoid'
import appiumConfig from './config/appium.config'
import browserStackConfig, { type BrowserStackConfig } from './config/browserstack.config'
import BrowserStackManager from './browserstack'

enum Target {
  APPIUM = 'appium',
  BROWSERSTACK = 'browserstack'
}

/** Returns the config for the specified target. */
function getTargetConfig(target: string, localIdentifier: string) {
  switch (target) {
    case Target.APPIUM:
      return appiumConfig()

    case Target.BROWSERSTACK:
      return browserStackConfig(localIdentifier)

    default:
      throw new Error('Environment Option "target" must be specified and valid.')
  }
}

/** Creates and starts BrowserStack Local. */
async function initializeBrowserStackLocal(config: BrowserStackConfig) {
  const manager = BrowserStackManager()
  await manager.start(config.key, config.localIdentifier)

  return manager
}

export default <Environment>{
  // eslint-disable-next-line prettier/prettier
  name: 'ios',
  viteEnvironment: 'client',
  async setup(global, options) {
    builtinEnvironments['happy-dom'].setup(global, options)

    const { target } = options

    // In CI, the GitHub Action starts BrowserStack Local with BROWSERSTACK_LOCAL_IDENTIFIER
    // Locally, we start our own BrowserStack Local with a random identifier
    const isCI = process.env.CI === 'true'
    const localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER || 'local-' + nanoid()

    const targetConfig = getTargetConfig(target, localIdentifier)

    // Skip starting BrowserStack Local in CI since the GitHub Action handles it
    let browserStack = null
    if (target === Target.BROWSERSTACK && !isCI) {
      console.info(chalk.yellow('Starting BrowserStack Local tunnel...'))
      browserStack = await initializeBrowserStackLocal(targetConfig as BrowserStackConfig)
    } else if (target === Target.BROWSERSTACK && isCI) {
      console.info(chalk.yellow('Using existing BrowserStack Local tunnel from CI environment'))
    }

    // custom setup
    console.info(chalk.yellow('Setup Test Environment for webdriverio.'))

    if (await portUsed.check(3000, 'localhost')) {
      console.info(chalk.yellow('Using the currently running app on http://localhost:3000'))
    } else {
      throw new Error('No running application found on port 3000')
    }

    const browser = await remote(targetConfig)

    const { Window, GlobalWindow } = await import('happy-dom')
    const win = new (GlobalWindow || Window)()

    const { keys, originals } = populateGlobal(global, {
      ...win,
      browser,
    })

    return {
      async teardown() {
        console.info(chalk.yellow('Teardown Test Environment for webdriverio.'))

        keys.forEach(key => delete global[key])
        originals.forEach((v, k) => (global[k] = v))

        if (browser) {
          await browser.deleteSession()
        } else {
          console.warn('globalBrowser is undefined in teardown')
        }

        if (browserStack) {
          await browserStack.stop()
        }
      }
    }
  }
}
