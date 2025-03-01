import _ from 'lodash'
import { updateThoughts } from '../reducers'
import { treeDelete } from '../util/recentlyEditedTree'
import {
  getChildrenRankedById,
  getLexeme,
  getThoughtById,
  hasLexeme,
  rankThoughtsFirstMatch,
  rootedParentOf,
} from '../selectors'
import { ThoughtId, Context, Index, Lexeme, Parent, State } from '../@types'
import { getSessionId } from '../util/sessionManager'
import { hashThought, reducerFlow, removeContext, timestamp, unroot } from '../util'
import { getAllChildrenAsThoughts } from '../selectors/getChildren'

interface Payload {
  context: Context
  thoughtId: ThoughtId
  orphaned?: boolean
  showContexts?: boolean
}

interface ThoughtUpdates {
  contextIndex: Index<Parent | null>
  thoughtIndex: Index<Lexeme | null>
  pendingDeletes?: { context: Context; thought: Parent }[]
}

// @MIGRATION_TODO: Maybe deleteThought doesn't need to know about the orhapned logic directlty. Find a better way to handle this.
/** Removes a thought from a context. If it was the last thought in that context, removes it completely from the thoughtIndex. Does not update the cursor. Use deleteThoughtWithCursor or archiveThought for high-level functions.
 *
 * @param orphaned - In pending deletes situation, the parent is already deleted, so at such case parent doesn't need to be updated.
 */
const deleteThought = (state: State, { context, thoughtId, orphaned }: Payload) => {
  const deletedThought = getThoughtById(state, thoughtId)

  if (!deletedThought) {
    console.error(`deleteThought: Thought not found for id ${thoughtId}`)
    return state
  }

  const { value, rank } = deletedThought

  if (!hasLexeme(state, value)) {
    console.error(`Lexeme not found for thought value: ${value}`)
    return state
  }

  const thoughts = unroot(context.concat(value))
  context = rootedParentOf(state, thoughts)
  const key = hashThought(value)
  const lexeme = getLexeme(state, value)

  const parent = orphaned ? null : getThoughtById(state, deletedThought.parentId)

  // Note: When a thought is deleted and there are pending deletes, then on flushing the deletes, the parent won't be available in the tree. So for orphaned thoughts deletion we use special orphaned param
  if (!orphaned && !parent) {
    console.error('Parent not found!')
    return state
  }

  // guard against missing lexeme
  // while this should never happen, there are some concurrency issues that can cause it to happen, so we should print an error and just delete the Parent
  if (!lexeme) {
    console.warn(
      `Missing Lexeme: "${value}". This indicates that there is a data integrity issue upstream. Deleting Parent anyway.`,
      value,
    )
    return state
  }

  const thoughtIndexNew = { ...state.thoughts.thoughtIndex }
  const oldRankedThoughts = rankThoughtsFirstMatch(state, thoughts as string[])

  const isValidThought = lexeme && lexeme.contexts.find(thoughtId => thoughtId === deletedThought.id)

  // if thought is not valid then just stop further execution
  if (!isValidThought) {
    console.error(`Thought ${value} with rank ${rank} is not in ${JSON.stringify(context)}`)
    return state
  }

  // Uncaught TypeError: Cannot perform 'IsArray' on a proxy that has been revoked at Function.isArray (#417)
  let recentlyEdited = state.recentlyEdited // eslint-disable-line fp/no-let
  try {
    recentlyEdited = treeDelete(state, state.recentlyEdited, oldRankedThoughts)
  } catch (e) {
    console.error('deleteThought: treeDelete immer error')
    console.error(e)
  }

  // the old thought less the context
  const newOldThought =
    lexeme.contexts && lexeme.contexts.length > 1 ? removeContext(state, lexeme, deletedThought.id) : null

  // update state so that we do not have to wait for firebase
  if (newOldThought) {
    thoughtIndexNew[key] = newOldThought
  } else {
    delete thoughtIndexNew[key] // eslint-disable-line fp/no-delete
  }

  // remove thought from contextViews
  const contextViewsNew = { ...state.contextViews }
  if (parent) delete contextViewsNew[parent.id] // eslint-disable-line fp/no-delete

  const subthoughts = getAllChildrenAsThoughts(state, context).filter(child => child.id !== deletedThought.id)

  /** Generates a firebase update object that can be used to delete/update all descendants and delete/update contextIndex. */
  const recursiveDeletes = (thought: Parent, accumRecursive = {} as ThoughtUpdates): ThoughtUpdates => {
    // modify the state to use the thoughtIndex with newOldLexeme
    // this ensures that contexts are calculated correctly for descendants with duplicate values
    const stateNew: State = {
      ...state,
      thoughts: {
        ...state.thoughts,
        thoughtIndex: thoughtIndexNew,
      },
    }

    return getChildrenRankedById(stateNew, thought.id).reduce(
      (accum, child) => {
        const hashedKey = hashThought(child.value)
        const lexeme = getLexeme(stateNew, child.value)
        const childNew =
          lexeme && lexeme.contexts && lexeme.contexts.length > 1
            ? // update child with deleted context removed
              removeContext(state, lexeme, child.id)
            : // if this was the only context of the child, delete the child
              null

        // update local thoughtIndex so that we do not have to wait for firebase
        if (childNew) {
          thoughtIndexNew[hashedKey] = childNew
        } else {
          delete thoughtIndexNew[hashedKey] // eslint-disable-line fp/no-delete
        }

        // if pending, append to a special pendingDeletes field so all descendants can be loaded and deleted asynchronously
        if (child.pending) {
          const thoughtUpdate: ThoughtUpdates = {
            ...accum,
            // do not delete the pending thought yet since the second call to deleteThought needs a starting point
            pendingDeletes: [
              ...(accumRecursive.pendingDeletes || []),
              {
                context: thoughts,
                thought: child,
              },
            ],
          }

          return thoughtUpdate
        }

        // RECURSION
        const recursiveResults = recursiveDeletes(child, accum)

        return {
          ...accum,
          pendingDeletes: [
            ...(accum.pendingDeletes || []),
            ...(accumRecursive.pendingDeletes || []),
            ...(recursiveResults.pendingDeletes || []),
          ],
          thoughtIndex: {
            ...accum.thoughtIndex,
            ...recursiveResults.thoughtIndex,
            [hashedKey]: childNew,
          },
          contextIndex: {
            ...accum.contextIndex,
            ...recursiveResults.contextIndex,
          },
        }
      },
      {
        thoughtIndex: accumRecursive.thoughtIndex,
        contextIndex: {
          ...accumRecursive.contextIndex,
          [thought.id]: null,
        },
      } as ThoughtUpdates,
    )
  }

  // do not delete descendants when the thought has a duplicate sibling
  const hasDuplicateSiblings = subthoughts.some(child => hashThought(child.value || '') === key)
  const descendantUpdatesResult = !hasDuplicateSiblings
    ? recursiveDeletes(deletedThought)
    : ({
        thoughtIndex: {},
        contextIndex: {},
      } as ThoughtUpdates)

  const thoughtIndexUpdates = {
    [key]: newOldThought,
    ...descendantUpdatesResult.thoughtIndex,
    // emptyContextDelete
  }

  const contextIndexUpdates = {
    // Deleted thought's parent
    // Note: Thoughts in pending deletes won't have it's parent in the state. So orphaned thoughts doesn't need to care about its parent update.
    ...(parent && {
      [parent.id]: {
        ...parent,
        children: subthoughts.map(({ id }) => id),
        lastUpdated: timestamp(),
        updatedBy: getSessionId(),
      } as Parent,
    }),
    [deletedThought.id]: null,
    // descendants
    ...descendantUpdatesResult.contextIndex,
  }

  return reducerFlow([
    state => ({
      ...state,
      contextViews: contextViewsNew,
    }),
    updateThoughts({
      contextIndexUpdates,
      thoughtIndexUpdates,
      recentlyEdited,
      pendingDeletes: descendantUpdatesResult.pendingDeletes,
    }),
  ])(state)
}

export default _.curryRight(deleteThought)
