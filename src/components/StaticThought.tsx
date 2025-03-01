import React from 'react'
import { isTouch } from '../browser'
import { store } from '../store'
import { getThoughtByPath, rootedParentOf } from '../selectors'
import { expandContextThought } from '../action-creators'
import { isDivider, isDocumentEditable } from '../util'

// components
import BulletCursorOverlay from './BulletCursorOverlay'
import ContextBreadcrumbs from './ContextBreadcrumbs'
import Divider from './Divider'
import Editable from './Editable'
import HomeLink from './HomeLink'
import Superscript from './Superscript'
import { ConnectedThoughtProps } from './Thought'

/** A static thought element with overlay bullet, context breadcrumbs, editable, and superscript. */
const StaticThought = ({
  cursorOffset,
  env,
  hideBullet,
  homeContext,
  isDragging,
  isEditing,
  isLeaf,
  isVisible,
  path,
  publish,
  rank,
  showContextBreadcrumbs,
  showContexts,
  style,
  simplePath,
  toggleTopControlsAndBreadcrumbs,
  editing,
}: ConnectedThoughtProps) => {
  const isRoot = simplePath.length === 1
  const isRootChildLeaf = simplePath.length === 2 && isLeaf

  const state = store.getState()

  const { value } = getThoughtByPath(state, simplePath)

  return (
    <div className='thought'>
      {!(publish && (isRoot || isRootChildLeaf)) && !hideBullet && (
        <BulletCursorOverlay simplePath={simplePath} isDragging={isDragging} />
      )}

      {showContextBreadcrumbs && !isRoot ? (
        <ContextBreadcrumbs
          simplePath={rootedParentOf(state, rootedParentOf(state, simplePath))}
          homeContext={homeContext}
        />
      ) : showContexts && simplePath.length > 2 ? (
        <span className='ellipsis'>
          <a
            tabIndex={-1}
            /* TODO: Add setting to enable tabIndex for accessibility */ onClick={() => {
              store.dispatch(expandContextThought(path))
            }}
          >
            ...{' '}
          </a>
        </span>
      ) : null}

      {homeContext ? (
        <HomeLink />
      ) : isDivider(value) ? (
        <Divider path={simplePath} />
      ) : (
        // cannot use simplePathLive here else Editable gets re-rendered during editing
        <Editable
          path={path}
          cursorOffset={cursorOffset}
          editing={editing}
          disabled={!isDocumentEditable()}
          isEditing={isEditing}
          isVisible={isVisible}
          rank={rank}
          showContexts={showContexts}
          style={style}
          simplePath={simplePath}
          onKeyDownAction={isTouch ? undefined : toggleTopControlsAndBreadcrumbs}
        />
      )}

      <Superscript simplePath={simplePath} showContexts={showContexts} superscript={false} />
    </div>
  )
}

export default StaticThought
