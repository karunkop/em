import React from 'react'
import { connect, useSelector } from 'react-redux'
import classNames from 'classnames'
import { store } from '../store'
import { REGEXP_PUNCTUATIONS } from '../constants'
import { setCursor } from '../action-creators'
import { decodeThoughtsUrl, getContexts, theme, rootedParentOf, getAncestorByValue } from '../selectors'
import { Connected, Context, Index, SimplePath, State, ThoughtContext, Path } from '../@types'
import {
  ellipsizeUrl,
  equalPath,
  head,
  headId,
  headValue,
  isURL,
  once,
  parentOf,
  pathToContext,
  publishMode,
} from '../util'

// components
import HomeLink from './HomeLink'
import ContextBreadcrumbs from './ContextBreadcrumbs'
import StaticSuperscript from './StaticSuperscript'
import UrlIcon from './icons/UrlIcon'
import { isInternalLink } from '../device/router'
import { getAllChildrenAsThoughts } from '../selectors/getChildren'

interface ThoughtAnnotationProps {
  dark?: boolean
  editingValue?: string | null
  env?: Index<any>
  focusOffset?: number
  homeContext?: boolean
  invalidState?: boolean
  isEditing?: boolean
  minContexts?: number
  path: Path
  showContextBreadcrumbs?: boolean
  showContexts?: boolean
  showHiddenThoughts?: boolean
  simplePath: SimplePath
  style?: React.CSSProperties
}

/** Sets the innerHTML of the ngram text. */
const getTextMarkup = (state: State, isEditing: boolean, value: string, thoughts: Context) => {
  const labelChildren = getAllChildrenAsThoughts(state, [...thoughts, '=label'])
  const { editingValue } = state
  return {
    __html: isEditing
      ? editingValue && value !== editingValue
        ? editingValue
        : value
      : labelChildren.length > 0
      ? labelChildren[0].value
      : ellipsizeUrl(value),
  }
}

/** Adds https to the url if it is missing. Ignores urls at localhost. */
const addMissingProtocol = (url: string) =>
  (!url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('localhost:') ? 'https://' : '') + url

/** A Url icon that links to the url. */
const UrlIconLink = ({ url }: { url: string }) => (
  <a
    href={addMissingProtocol(url)}
    rel='noopener noreferrer'
    target='_blank'
    className='external-link'
    onClick={e => {
      e.stopPropagation() // prevent Editable onMouseDown
      if (isInternalLink(url)) {
        const { path, contextViews } = decodeThoughtsUrl(store.getState(), {
          exists: true,
          url,
        })
        store.dispatch(setCursor({ path, replaceContextViews: contextViews }))
        e.preventDefault()
      }
    }}
  >
    <UrlIcon />
  </a>
)

// eslint-disable-next-line jsdoc/require-jsdoc
const mapStateToProps = (state: State, props: ThoughtAnnotationProps) => {
  const { cursor, invalidState, editingValue, showHiddenThoughts } = state

  const isEditing = equalPath(cursor, props.path)
  const simplePathLive = isEditing
    ? (parentOf(props.simplePath).concat(head(props.showContexts ? parentOf(cursor!) : cursor!)) as SimplePath)
    : props.simplePath

  return {
    dark: theme(state) !== 'Light',
    editingValue: isEditing ? editingValue : null,
    invalidState: isEditing ? invalidState : false,
    isEditing,
    showHiddenThoughts,
    path: simplePathLive,
    // if a thought has the same value as editValue, re-render its ThoughtAnnotation in order to get the correct number of contexts
    isThoughtValueEditing: editingValue === headValue(state, simplePathLive),
  }
}

/** A non-interactive annotation overlay that contains intrathought links (superscripts and underlining). */
const ThoughtAnnotation = ({
  simplePath,
  showContexts,
  showContextBreadcrumbs,
  homeContext,
  isEditing,
  minContexts = 2,
  dispatch,
  invalidState,
  editingValue,
  style,
  showHiddenThoughts,
}: Connected<ThoughtAnnotationProps>) => {
  // only show real time update if being edited while having meta validation error
  // do not increase numContexts when in an invalid state since the thought has not been updated in state
  const isRealTimeContextUpdate = isEditing && invalidState && editingValue !== null

  const state = store.getState()
  const value = headValue(state, showContexts ? parentOf(simplePath) : simplePath)
  const thoughts = pathToContext(state, simplePath)
  const isExpanded = !!state.expanded[headId(simplePath)]
  const childrenUrls = once(() => getAllChildrenAsThoughts(state, thoughts).filter(child => isURL(child.value)))

  /**
   * Adding dependency on thoughtIndex as the fetch for thought is async await.
   * ThoughtAnnotation wasn't waiting for all the thoughtIndex to be set before it was rendered.
   * And hence the superscript wasn't rendering properly on load.
   * So now subscribing to get context so that StaticSuperscript is not re-rendered for all thoughtIndex change.
   * It will re-render only when respective Lexeme is changed.
   * Changed as part of fix for issue 1419 (https://github.com/cybersemics/em/issues/1419).
   */

  /** Returns true if the thought is not archived. */
  const isNotArchive = (thoughtContext: ThoughtContext) =>
    // thoughtContext.context should never be undefined, but unfortunately I have personal thoughts in production with no context. I am not sure whether this was old data, or if it's still possible to encounter, so guard against undefined context for now.
    showHiddenThoughts || !getAncestorByValue(state, thoughtContext, '=archive')

  const numContexts = useSelector((state: State) => {
    // no contexts if thought is empty
    const contexts = value !== '' ? getContexts(state, isRealTimeContextUpdate ? editingValue! : value) : []
    return contexts.filter(isNotArchive).length + (isRealTimeContextUpdate ? 1 : 0)
  })

  const url = isURL(value)
    ? value
    : // if the only subthought is a url and the thought is not expanded, link the thought
    !isExpanded && childrenUrls().length === 1 && (!state.cursor || !equalPath(simplePath, parentOf(state.cursor)))
    ? childrenUrls()[0].value
    : null

  return (
    <div className='thought-annotation' style={homeContext ? { height: '1em', marginLeft: 8 } : {}}>
      {showContextBreadcrumbs && simplePath.length > 1 && (
        <ContextBreadcrumbs simplePath={rootedParentOf(state, rootedParentOf(state, simplePath))} />
      )}

      {homeContext ? (
        <HomeLink />
      ) : (
        <div
          className={classNames({
            subthought: true,
            // disable intrathought linking until add, edit, delete, and expansion can be implemented
            // 'subthought-highlight': isEditing && focusOffset != null && subthought.contexts.length > (subthought.text === value ? 1 : 0) && subthoughtUnderSelection() && subthought.text === subthoughtUnderSelection().text
          })}
        >
          <span
            className='subthought-text'
            style={style}
            dangerouslySetInnerHTML={getTextMarkup(state, !!isEditing, value, thoughts)}
          />
          {
            // do not render url icon on root thoughts in publish mode
            url && !(publishMode() && simplePath.length === 1) && <UrlIconLink url={url} />
          }
          {REGEXP_PUNCTUATIONS.test(value) ? null : minContexts === 0 || // with real time context update we increase context length by 1 // with the default minContexts of 2, do not count the whole thought
            numContexts > 1 ? (
            <StaticSuperscript n={numContexts} />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default connect(mapStateToProps)(ThoughtAnnotation)
