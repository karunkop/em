import { HOME_PATH, HOME_TOKEN } from '../constants'
import { appendToPath, parentOf, head, pathToContext, once } from '../util'
import {
  nextSibling as thoughtNextSibling,
  rootedParentOf,
  firstVisibleChildWithCursorCheck,
  getThoughtById,
} from '../selectors'
import { Context, Path, SimplePath, State } from '../@types'

interface NextThoughtResult {
  nextThoughts: Path | null
}

/**
 * Adds the rank of the child thought to every thought in a context.
 */
// const contextWithThoughtRank = (state: State, contextInfo: ThoughtContext | null): SimplePath | null => {
//   return (
//     contextInfo &&
//     (contextInfo.context.map((value, index) => {
//       const lexeme = getLexeme(state, value)!

//       /** Returns the matching context. */
//       const matchedContext = () => {
//         const contextToMatch = contextInfo.context.slice(0, index + 1)
//         // const filterRoot = context => context.filter(item => item !== HOME_TOKEN)
//         return lexeme.contexts.find(thoughtContext =>
//           equalArrays([...unroot(thoughtContext.context), lexeme.value], contextToMatch),
//         )!
//       }
//       // the root thought doesn't have a rank
//       return value === HOME_TOKEN ? HOME_PATH[0] : { value, rank: matchedContext().rank }
//     }) as SimplePath)
//   )
// }

// /**
//  * Returns the next sibling of the focused context within a context view.
//  */
// const nextSiblingContext = (state: State, rank: number, context: Context) => {
//   const contextSiblings = getContextsSortedAndRanked(state, head(context))
//   const currentContextIndex = contextSiblings.findIndex(context => context.rank === rank)
//   // const currentIndex = contextSiblings.findIndex(thoughts => thoughts.find(thought => thought.value === value))
//   const nextSibling = contextSiblings[currentContextIndex + 1] ? contextSiblings[currentContextIndex + 1] : null
//   return contextWithThoughtRank(state, nextSibling)
// }

/**
 * Returns the first child of context at the given path.
 */
// const firstChildOfContextView = (state: State, path: Path) => {
//   const context = pathToContext(path)
//   const contextChildren = getContextsSortedAndRanked(state, head(context))
//   const firstChild = contextChildren[0]
//   return contextWithThoughtRank(state, firstChild)
// }

/**
 * Returns the context that is currently in focus based on the context chain head.
 */
// const getMatchedContext = (state: State, context: Child, contextChain: SimplePath[]) => {
//   const contexts = getContextsSortedAndRanked(state, context.value)
//   const currentContextTop = head(contextChain)[0].value
//   return contexts.find(c => c.context.includes(currentContextTop))
// }

/**
 * Returns the path to the current thought by stripping out any context views.
 */
// const getPathFromContextChain = (state: State, contextChain: SimplePath[]): Path => {
//   // last of second last item in context chain gives us the current context
//   const contextPath = head(contextChain.slice(0, -1))
//   const contextChild = head(contextPath)
//   const matchedContextWithRanks = contextWithThoughtRank(state, getMatchedContext(state, contextChild, contextChain)!)
//   return appendToPath(matchedContextWithRanks || ([] as unknown as Path), contextChild, ...head(contextChain).slice(1))
// }

/**
 * Returns the context of the current thought by stripping out any context views.
 */
// const getContextFromContextChain = (state: State, contextChain: SimplePath[]): Context => {
//   // last of second-to-last item in context chain gives us the current context
//   const contextPath = head(contextChain.slice(0, -1))
//   const contextChild = head(contextPath)
//   const matchedContext = getMatchedContext(state, contextChild, contextChain)!
//   return [
//     ...matchedContext.context,
//     contextChild.value,
//     ...head(contextChain)
//       .slice(1)
//       .map(context => context.value),
//   ]
// }

/**
 * Computes the value of next thoughts and context chain if:
 *
 * 1) The focused thought has context view open.
 * 2) The focus is on a context.
 *
 * Delegates control to nextInThoughtView if none of the above conditions meet.
 *
 * @param value             The value of focused thought.
 * @param rank              Rank of focused thought.
 * @param path              Path to focused thought.
 * @param rankedContext     Context with rank.
 * @param contextChain      ContextChain for the focused thought.
 * @param ignoreChildren    Used to ignore the children context if they've been traversed already.
 */
// const nextInContextView = (
//   state: State,
//   value: string,
//   rank: number,
//   path: Path,
//   rankedContext: Path,
//   contextChain: SimplePath[],
//   ignoreChildren?: boolean,
// ): NextThoughtResult | null => {
//   if (rankedContext.length === 0 || path.length === 0) return null

//   const context = pathToContext(rankedContext)
//   const firstChild = once(() => firstChildOfContextView(state, path))

//   const contextWithoutChildren =
//     isContextViewActive(state, pathToContext(path)) &&
//     getContexts(state, head(path).value).length < (ALLOW_SINGLE_CONTEXT ? 1 : 2)

//   if (contextWithoutChildren && contextChain.length === 1) {
//     return nextInThoughtView(state, value, context, rank, path, contextChain, true)
//   }

//   // if the focus is on a thought with context view open, move it into context view - jump in
//   if (!contextWithoutChildren && !ignoreChildren && isContextViewActive(state, pathToContext(path)) && firstChild()) {
//     const currentThought = head(path)
//     // jump out if there are no context children
//     return {
//       nextThoughts: [...(firstChild() || []), currentThought] as SimplePath,
//       contextChain,
//     }
//   }
//   // if the focus is on or within a context
//   else if (isContextViewActive(state, pathToContext(rankedContext))) {
//     const firstChild = once(() =>
//       firstVisibleChildWithCursorCheck(state, path, getContextFromContextChain(state, contextChain) || [HOME_TOKEN]),
//     )

//     const nextSibling = nextSiblingContext(state, rank, context)
//     const rankedContextHead = head(rankedContext)

//     return !ignoreChildren && firstChild()
//       ? {
//           nextThoughts: appendToPath(path, firstChild()),
//           contextChain: [],
//         }
//       : nextSibling
//       ? {
//           nextThoughts: appendToPath(nextSibling, rankedContextHead),
//           contextChain: contextChain.slice(0, -1),
//         }
//       : nextInThoughtView(
//           state,
//           rankedContextHead.value,
//           parentOf(context),
//           rankedContextHead.rank,
//           parentOf(path),
//           contextChain.slice(0, -1),
//           true,
//         )
//   }

//   return null
// }

/**
 * Computes the value of next thoughts  and context chain if:
 *
 * 1) The focused thought is not within a context view.
 * 2) The focused thought is at level 2 or further down in a context tree.
 *
 * Delegates control to nextInContextView if none of the above conditions meet.
 *
 * @param value          The value of focused thought.
 * @param context        Context of focused thought.
 * @param rank           Rank of focused thought.
 * @param path           Path to focsued thought.
 * @param rankedContext  Context with rank.
 * @param contextChain   ContextChain for the focused thought.
 * @param ignoreChildren Used to ignore the subthoughts if they've been traversed already.
 */
const nextInThoughtView = (
  state: State,
  value: string,
  context: Context,
  rank: number,
  path: Path,
  ignoreChildren?: boolean,
): NextThoughtResult | null => {
  const firstChild =
    !ignoreChildren &&
    firstVisibleChildWithCursorCheck(state, path as SimplePath, pathToContext(state, path) || [HOME_TOKEN])

  const thoughtViewPath = path
  // pathToContext is expensive than duplicate condition check hence using the former
  const thoughtViewContext = context

  /** Returns the next uncle in the thought view. */
  const nextUncleInThoughtView = () => {
    const parentThought = getThoughtById(state, head(parentOf(thoughtViewPath)))

    /** Gets the next uncle.
     * Only calculate uncle if not at root.
     */
    const nextUncle = () => {
      const parentContext = context.length === 1 ? [HOME_TOKEN] : parentOf(thoughtViewContext)
      const parentPath = parentOf(thoughtViewPath)
      return nextInThoughtView(state, parentThought.value, parentContext, parentThought.rank, parentPath, true)
    }

    return parentThought
      ? nextUncle()
      : // reached root thought
        {
          nextThoughts: null,
        }
  }

  // /** Gets the next uncle in the Context View. */
  // const nextUncleInContextView = () => {
  //   const pathToFirstThoughtInContext = parentOf(
  //     contextChain.length > 1 ? (contextChain.flat() as Path) : thoughtViewPath(),
  //   )
  //   // restricts from working with multilevel context chains
  //   const rankedContextOfCurrentContext = contextChain[contextChain.length - 2]
  //   const contextChainTillFirstChildOfContext = [...contextChain.slice(0, -1), [head(contextChain)[0]] as SimplePath]
  //   const firstThoughtInContext = head(contextChain)[0]

  //   return nextInContextView(
  //     state,
  //     firstThoughtInContext.value,
  //     firstThoughtInContext.rank,
  //     pathToFirstThoughtInContext,
  //     rankedContextOfCurrentContext,
  //     contextChainTillFirstChildOfContext,
  //     true,
  //   )
  // }

  const nextSibling = once(() => thoughtNextSibling(state, value, thoughtViewContext, rank))
  return firstChild
    ? {
        nextThoughts: appendToPath(path, firstChild.id),
      }
    : nextSibling()
    ? {
        nextThoughts: appendToPath(parentOf(thoughtViewPath), nextSibling().id),
      }
    : nextUncleInThoughtView()
}

/** Gets the next thought whether it is a child, sibling, or uncle, and its respective contextChain. */
export const nextThought = (state: State, path: Path = HOME_PATH) => {
  const thought = getThoughtById(state, head(path))
  const { value, rank } = thought
  const parentPath = rootedParentOf(state, path)
  const context = pathToContext(state, parentPath)

  // @MIGRATION_TODO: Context view related logic is disabled
  // return isContextViewActive(state, pathToContext(parentPath)) || isContextViewActive(state, pathToContext(path))
  // ? nextInContextView(state, value, rank, path, parentPath, contextChain)!
  return nextInThoughtView(state, value, context, rank, path)!
}
