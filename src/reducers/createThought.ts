import _ from 'lodash'
import { updateThoughts } from '../reducers'
import { getNextRank, getLexeme, getAllChildren, getParent, getThoughtById } from '../selectors'
import { createId, hashThought, head, timestamp } from '../util'
import { Context, Index, Lexeme, Parent, State, ThoughtId } from '../@types'
import { getSessionId } from '../util/sessionManager'

interface Payload {
  context: Context
  value: string
  rank: number
  id?: ThoughtId
  addAsContext?: boolean
}
/**
 * Creates a new thought with a known context and rank. Does not update the cursor. Use the newThought reducer for a higher level function.
 *
 * @param addAsContext Adds the given context to the new thought.
 */
const createThought = (state: State, { context, value, rank, addAsContext, id }: Payload) => {
  // create thought if non-existent
  const lexeme: Lexeme = {
    ...(getLexeme(state, value) || {
      value,
      contexts: [],
      created: timestamp(),
      lastUpdated: timestamp(),
      updatedBy: getSessionId(),
    }),
  }

  id = id || createId()

  const contextActual = addAsContext ? [value] : context

  // store children indexed by the encoded context for O(1) lookup of children
  // @MIGRATION_NOTE: getParent cannot find paths with context views.
  const parent = getParent(state, contextActual)

  if (!parent) return state

  const contextIndexUpdates: Index<Parent> = {}

  if (context.length > 0) {
    const newValue = addAsContext ? head(context) : value

    const children = getAllChildren(state, contextActual)
      .filter(child => child !== id)
      .concat(id)

    contextIndexUpdates[parent.id] = {
      ...getThoughtById(state, parent.id),
      id: parent.id,
      children,
      lastUpdated: timestamp(),
      updatedBy: getSessionId(),
    }

    contextIndexUpdates[id] = {
      id,
      parentId: parent.id,
      children: [],
      lastUpdated: timestamp(),
      rank: addAsContext ? getNextRank(state, [value]) : rank,
      value: newValue,
      updatedBy: getSessionId(),
    }
  }

  // if adding as the context of an existing thought
  let lexemeNew: Lexeme | undefined // eslint-disable-line fp/no-let
  if (addAsContext) {
    const lexemeOld = getLexeme(state, head(context))
    lexemeNew = {
      ...lexemeOld!,
      contexts: (lexemeOld?.contexts || []).concat(id),
      created: lexemeOld?.created || timestamp(),
      lastUpdated: timestamp(),
      updatedBy: getSessionId(),
    }
  } else {
    lexeme.contexts = !lexeme.contexts
      ? []
      : // floating thought (no context)
      context.length > 0
      ? [...lexeme.contexts, id]
      : lexeme.contexts
  }

  const thoughtIndexUpdates = {
    [hashThought(lexeme.value)]: lexeme,
    ...(lexemeNew
      ? {
          [hashThought(lexemeNew.value)]: lexemeNew,
        }
      : null),
  }

  return updateThoughts(state, { thoughtIndexUpdates, contextIndexUpdates })
}

export default _.curryRight(createThought)
