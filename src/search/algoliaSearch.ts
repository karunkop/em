import AlgoliaClient, { SearchIndex } from 'algoliasearch'
import { Store } from 'redux'
import { setRemoteSearch } from '../action-creators'
import { Context, Index, State } from '../@types'
import { getContextMap, getAlgoliaApiKey } from '../util'
import { DataProvider } from '../data-providers/DataProvider'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let searchIndex: SearchIndex

// @MIGRATION_TODO: Change this api to return ids instead of context.
/**
 * Get remote search function.
 */
export const getRemoteSearch = (state: State, remoteDataProvider: DataProvider) => {
  /**
   * Search by value and return context map.
   */
  const searchAndGenerateContextMap = async (value: string): Promise<Index<Context>> => {
    if (!searchIndex) throw new Error('Algolia search index has not be initiated.')
    const result = await searchIndex.search(value)
    const hits = result.hits as any as Record<'thoughtHash' | 'value', string>[]
    const lexemes = await remoteDataProvider.getThoughtsByIds(hits.map(hit => hit.thoughtHash))
    return getContextMap(state, lexemes)
  }

  return {
    searchAndGenerateContextMap,
  }
}

interface AlgoliaConfig {
  applicationId: string
  index: string
}

/**
 * Initialize algolia search client.
 */
const initAlgoliaSearch = async (userId: string, algoliaConfig: AlgoliaConfig, store: Store) => {
  const apiKey = await getAlgoliaApiKey(userId)
  const algoliaClient = AlgoliaClient(algoliaConfig.applicationId, apiKey)
  searchIndex = algoliaClient.initIndex(algoliaConfig.index)
  store.dispatch(setRemoteSearch({ value: true }))
}

export default initAlgoliaSearch
