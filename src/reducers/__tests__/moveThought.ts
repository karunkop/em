import { HOME_TOKEN } from '../../constants'
import { initialState, reducerFlow } from '../../util'
import {
  exportContext,
  getContexts,
  getLexeme,
  getAllChildren,
  getChildrenRanked,
  getRankAfter,
  isPending,
  getParent,
  rankThoughtsFirstMatch,
  childIdsToThoughts,
} from '../../selectors'
import { importText, newSubthought, newThought } from '../../reducers'
import { State } from '../../@types'
import { store as appStore } from '../../store'
import testTimer from '../../test-helpers/testTimer'
import { initialize } from '../../initialize'
import { clear, importText as importTextAction, moveThought as existingThoughtMoveAction } from '../../action-creators'
import setCursorFirstMatch, { setCursorFirstMatchActionCreator } from '../../test-helpers/setCursorFirstMatch'

import newThoughtAtFirstMatch from '../../test-helpers/newThoughtAtFirstMatch'
import moveThoughtAtFirstMatch from '../../test-helpers/moveThoughtAtFirstMatch'
import checkDataIntegrity from '../../test-helpers/checkDataIntegrity'

const timer = testTimer()

it('move within root', () => {
  const steps = [
    newThought('a'),
    newThought('b'),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['b'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - b
  - a`)

  const thoughtB = getParent(stateNew, ['b'])!

  // b should exist in the ROOT context
  expect(getContexts(stateNew, 'b')).toMatchObject([thoughtB.id])
  expect(thoughtB.parentId).toBe(HOME_TOKEN)
})

it('persist id on move', () => {
  const steps1 = [newThought('a'), newSubthought('a1'), newSubthought('a2')]

  const stateNew1 = reducerFlow(steps1)(initialState())

  const thoughtA2 = getParent(stateNew1, ['a', 'a1', 'a2'])!

  expect(getLexeme(stateNew1, 'a2')!.contexts).toEqual([thoughtA2.id])

  const steps2 = [
    moveThoughtAtFirstMatch({
      from: ['a', 'a1'],
      to: ['a1'],
      newRank: 1,
    }),
  ]

  const stateNew2 = reducerFlow(steps2)(stateNew1)

  const thoughtA2New = getParent(stateNew2, ['a1', 'a2'])!
  expect(getLexeme(stateNew2, 'a2')!.contexts).toEqual([thoughtA2New.id])

  expect(thoughtA2New.id).toEqual(thoughtA2!.id)
})

it('move within context (rank only)', () => {
  const steps = [
    newThought('a'),
    newSubthought('a1'),
    newThought('a2'),
    moveThoughtAtFirstMatch({
      from: ['a', 'a2'],
      to: ['a', 'a2'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - a2
    - a1`)

  const thoughtA = getParent(stateNew, ['a'])!
  const thoughtA2 = getParent(stateNew, ['a', 'a2'])!

  expect(thoughtA2.parentId).toBe(thoughtA.id)

  expect(getContexts(stateNew, 'a2')).toMatchObject([thoughtA2.id])
})

it('move across contexts', () => {
  const steps = [
    newThought('a'),
    newSubthought('a1'),
    newThoughtAtFirstMatch({
      value: 'b',
      at: ['a'],
    }),
    newSubthought('b1'),
    moveThoughtAtFirstMatch({
      from: ['b', 'b1'],
      to: ['a', 'b1'],
      newRank: 1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - a1
    - b1
  - b`)

  const thoughtA = getParent(stateNew, ['a'])!
  const thoughtB1 = getParent(stateNew, ['a', 'b1'])!

  // b1 should exist in context a
  expect(thoughtB1!.parentId).toBe(thoughtA.id)

  expect(getContexts(stateNew, 'b1')).toMatchObject([thoughtB1.id])
})

it('move descendants', () => {
  const steps = [
    newThought('a'),
    newSubthought('a1'),
    newSubthought('a1.1'),
    newThoughtAtFirstMatch({
      value: 'b',
      at: ['a'],
    }),
    newSubthought('b1'),
    newSubthought('b1.1'),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['b'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - b
    - b1
      - b1.1
  - a
    - a1
      - a1.1`)

  const thoughtB = getParent(stateNew, ['b'])
  const thoughtB1 = getParent(stateNew, ['b', 'b1'])
  const thoughtB11 = getParent(stateNew, ['b', 'b1', 'b1.1'])

  expect(thoughtB).not.toBeNull()
  expect(thoughtB1).not.toBeNull()
  expect(thoughtB11).not.toBeNull()

  // on desendent only the moved thought parentId may change, all its descendants will have same back link to their parents.
  expect(thoughtB1!.parentId).toBe(thoughtB!.id)
  expect(thoughtB11!.parentId).toBe(thoughtB1!.id)

  // Checking if the lexeme has correct reference to the thought after move.
  expect(getContexts(stateNew, 'b')).toMatchObject([thoughtB?.id])

  expect(getContexts(stateNew, 'b1')).toMatchObject([thoughtB1?.id])
  expect(getContexts(stateNew, 'b1.1')).toMatchObject([thoughtB11!.id])
})

it('moving cursor thought should update cursor', () => {
  const steps = [
    newThought('a'),
    newSubthought('a1'),
    newThought('a2'),
    moveThoughtAtFirstMatch({
      from: ['a', 'a2'],
      to: ['a', 'a2'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(childIdsToThoughts(stateNew, stateNew.cursor!)).toMatchObject([
    { value: 'a', rank: 0 },
    { value: 'a2', rank: -1 },
  ])
})

it('moving ancestor of cursor should update cursor', () => {
  const steps = [
    newThought('a'),
    newThought('b'),
    newSubthought('b1'),
    newSubthought('b1.1'),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['b'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  const thoughts = childIdsToThoughts(stateNew, stateNew.cursor!)

  expect(thoughts).toMatchObject([
    { value: 'b', rank: -1 },
    { value: 'b1', rank: 0 },
    { value: 'b1.1', rank: 0 },
  ])
})

it('moving unrelated thought should not update cursor', () => {
  const steps = [
    newThought('a'),
    newThought('b'),
    newSubthought('b1'),
    newSubthought('b1.1'),
    setCursorFirstMatch(['a']),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['b'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(childIdsToThoughts(stateNew, stateNew.cursor!)).toMatchObject([{ value: 'a', rank: 0 }])
})

it('move root thought into another root thought', () => {
  const text = `
  - x
  - a
    - b
     - c`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['a'],
      to: ['x', 'a'],
      newRank: -1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')
  expect(exported).toBe(`- ${HOME_TOKEN}
  - x
    - a
      - b
        - c`)

  const thoughtX = getParent(stateNew, ['x'])!
  const thoughtA = getParent(stateNew, ['x', 'a'])!
  const thoughtB = getParent(stateNew, ['x', 'a', 'b'])!
  const thoughtC = getParent(stateNew, ['x', 'a', 'b', 'c'])!

  expect(getContexts(stateNew, 'a')).toMatchObject([thoughtA.id])
  expect(getContexts(stateNew, 'b')).toMatchObject([thoughtB!.id])
  expect(getContexts(stateNew, 'c')).toMatchObject([thoughtC!.id])

  expect(thoughtX.parentId).toBe(HOME_TOKEN)
  expect(thoughtA.parentId).toBe(thoughtX.id)
  expect(thoughtB.parentId).toBe(thoughtA.id)
  expect(thoughtC.parentId).toBe(thoughtB.id)
})

// ensure that siblings of descendants are properly merged into final result
it('move descendants with siblings', () => {
  const text = `
  - a
    - b
     - c
     - d`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['a', 'b'],
      to: ['b'],
      newRank: 1,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')
  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
  - b
    - c
    - d`)

  const thoughtB = getParent(stateNew, ['b'])!
  const thoughtC = getParent(stateNew, ['b', 'c'])!
  const thoughtD = getParent(stateNew, ['b', 'd'])!

  expect(thoughtC.parentId).toBe(thoughtB.id)
  expect(thoughtD.parentId).toBe(thoughtB.id)

  expect(getContexts(stateNew, 'b')).toMatchObject([thoughtB.id])
  expect(getContexts(stateNew, 'c')).toMatchObject([thoughtC.id])
  expect(getContexts(stateNew, 'd')).toMatchObject([thoughtD.id])
})

// @MIGRATION_TODO: Merge logic has not been fixed.
it.skip('merge duplicate with new rank', () => {
  const text = `
  - a
    - m
      - x
  - m
   - y`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['m'],
      to: ['a', 'm'],
      newRank: 0,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - m
      - x
      - y`)

  // use destinate rank of duplicate thoughts
  expect(getAllChildren(stateNew, ['a'])).toMatchObject([{ value: 'm', rank: 0 }])

  // merged thought should only exist in destination context
  expect(getContexts(stateNew, 'm')).toMatchObject([
    {
      context: ['a'],
      rank: 0,
    },
  ])
})

it.skip('merge with duplicate with duplicate rank', () => {
  const text = `
  - a
    - m
      - x
  - m
    - y`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['m'],
      to: ['a', 'm'],
      newRank: 0,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - m
      - x
      - y`)

  // use destinate rank of duplicate thoughts
  expect(getAllChildren(stateNew, ['a'])).toMatchObject([{ value: 'm', rank: 0 }])

  // merged thought should only exist in destination context
  expect(getContexts(stateNew, 'm')).toMatchObject([
    {
      context: ['a'],
      rank: 0,
    },
  ])
})

it('move with duplicate descendant', () => {
  const text = `
  - a
  - b
    - x
    - y
      - x`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['a', 'b'],
      newRank: 0,
    }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')
  // contextIndex
  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - b
      - x
      - y
        - x`)

  const thoughtXUnderB = getParent(stateNew, ['a', 'b', 'x'])!
  const thoughtXUnderY = getParent(stateNew, ['a', 'b', 'y', 'x'])!

  // x should have contexts a/b and a/b/y
  expect(getContexts(stateNew, 'x')).toMatchObject([thoughtXUnderB.id, thoughtXUnderY.id])
})

it('move with hash matched descendant', () => {
  const text = `
  - a
  - b
    - =note
      - note`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['b'],
      to: ['a', 'b'],
      newRank: 0,
    }),
  ]

  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - b
      - =note
        - note`)

  const thoughtNoteFirst = getParent(stateNew, ['a', 'b', '=note'])!
  const thoughtNoteSecond = getParent(stateNew, ['a', 'b', '=note', 'note'])!

  expect(thoughtNoteSecond?.parentId).toBe(thoughtNoteFirst.id)

  expect(getContexts(stateNew, 'note')).toMatchObject([thoughtNoteFirst.id, thoughtNoteSecond.id])
})

// @MIGRATION_TODO: Duplicate merging has not been fixed yet.
it.skip('move with nested duplicate thoughts', () => {
  const text = `
  - a
    - b
  - c
    - a
      - b`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['c', 'a'],
      to: ['a'],
      newRank: 0,
    }),
  ]

  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - b
  - c`)

  // b should be in in the context of a
  expect(getContexts(stateNew, 'b')).toMatchObject([{ context: ['a'], rank: 0 }])
})

// @MIGRATION_TODO: Nested duplciate merge doesn't work rn with intermediate changes.
it.skip('move with nested duplicate thoughts and merge their children', () => {
  const text = `
  - a
    - b
     - c
      - x
  - p
    - a
      - b
        - c
          - y
        -d`

  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['p', 'a'],
      to: ['a'],
      newRank: 0,
    }),
  ]

  const stateNew = reducerFlow(steps)(initialState())
  const exported = exportContext(stateNew, [HOME_TOKEN], 'text/plain')

  expect(exported).toBe(`- ${HOME_TOKEN}
  - a
    - b
      - c
        - x
        - y
      - d
  - p`)

  // b should only be in context ['a']
  expect(getContexts(stateNew, 'b')).toMatchObject([{ context: ['a'], rank: 0 }])

  // context ['p', 'a'] should not have any garbage children
  expect(getChildrenRanked(stateNew, ['p', 'a'])).toHaveLength(0)

  // c should only be in context ['a', 'b']
  expect(getContexts(stateNew, 'c')).toMatchObject([{ context: ['a', 'b'], rank: 0 }])

  // context ['p', 'a', 'b'] should not have any garbage children
  expect(getChildrenRanked(stateNew, ['p', 'a', 'b'])).toHaveLength(0)
})

// Issue: https://github.com/cybersemics/em/issues/1096
it.only('data integrity test', () => {
  const text = `
  - k
    - a
      - b
        - c
  - m`
  const steps = [
    importText({ text }),
    moveThoughtAtFirstMatch({
      from: ['k', 'a'],
      to: ['m', 'a'],
      newRank: 0,
    }),
  ]
  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const { missingLexemeValues, missingParentIds } = checkDataIntegrity(stateNew)

  expect(missingLexemeValues).toHaveLength(0)
  expect(missingParentIds).toHaveLength(0)
})

// skip until fixed: Importing duplicate uncle missing ThoughtContext (#1407)
// @MIGRATION_TODO: Duplicate merge is not working yet.
it.skip('consistent rank between thoughtIndex and contextIndex on duplicate merge', () => {
  const text = `
  - a
    - b
  - b`

  const steps = [
    importText({ text }),
    (newState: State) =>
      moveThoughtAtFirstMatch(newState, {
        from: ['a', 'b'],
        to: ['b'],
        // Note: Here new rank will be 0.5 because it's calculated between a (0) and b (1)
        newRank: getRankAfter(newState, rankThoughtsFirstMatch(newState, ['a'])!) as number,
      }),
  ]

  // run steps through reducer flow and export as plaintext for readable test
  const stateNew = reducerFlow(steps)(initialState())
  const contextsOfB = getContexts(stateNew, 'b')

  expect(contextsOfB).toHaveLength(1)

  // const rankFromContextIndex = getChildren(stateNew, [HOME_TOKEN]).find(child => child.value === 'b')?.rank

  // expect(contextsOfB[0].rank).toBe(rankFromContextIndex)
})

// @MIGRATION_TODO
it.skip('pending destination should be merged correctly (fetch pending before move)', async () => {
  initialize()

  const text = `
  - a
    - b
      -c
        - one
        - two
  - d
    - b
      - c
        - three
        - four`

  timer.useFakeTimer()

  appStore.dispatch(importTextAction({ text }))
  await timer.runAllAsync()

  timer.useFakeTimer()
  // clear and call initialize again to reload from local db (simulating page refresh)
  appStore.dispatch(clear())
  await timer.runAllAsync()

  initialize()

  await timer.runAllAsync()

  timer.useFakeTimer()

  appStore.dispatch([setCursorFirstMatchActionCreator(['a'])])

  // wait for pullBeforeMove middleware to execute
  await timer.runAllAsync()

  const pathAB = rankThoughtsFirstMatch(appStore.getState(), ['a', 'b'])
  const pathDB = rankThoughtsFirstMatch(appStore.getState(), ['d', 'b'])
  appStore.dispatch([
    existingThoughtMoveAction({
      oldPath: pathAB!,
      newPath: pathDB!,
      newRank: 1,
    }),
  ])
  await timer.runAllAsync()

  timer.useRealTimer()

  const mergedChildren = getAllChildren(appStore.getState(), ['d', 'b', 'c'])
  expect(mergedChildren).toMatchObject([
    { value: 'three', rank: 0 },
    { value: 'four', rank: 1 },
    { value: 'one', rank: 2 },
    { value: 'two', rank: 3 },
  ])
})

// @MIGRATION_TODO: Pull needs to be enabled.
it.skip('only fetch the descendants up to the possible conflicting path', async () => {
  initialize()

  const text = `
  - a
    - b
      - c
        - 1
        - 2
  - p
    - b
      - c
        - 3
          - 3.1
          - 3.2
            - 3.2.1
        - 4
  - z`

  timer.useFakeTimer()

  appStore.dispatch(importTextAction({ text }))
  await timer.runAllAsync()

  timer.useFakeTimer()
  // clear and call initialize again to reload from local db (simulating page refresh)
  appStore.dispatch(clear())
  await timer.runAllAsync()

  initialize()

  await timer.runAllAsync()

  timer.useFakeTimer()

  expect(isPending(appStore.getState(), ['p', 'b'])).toEqual(true)
  appStore.dispatch([setCursorFirstMatchActionCreator(['a'])])

  // wait for pullBeforeMove middleware to execute
  await timer.runAllAsync()

  const pathAB = rankThoughtsFirstMatch(appStore.getState(), ['a', 'b'])
  const pathPB = rankThoughtsFirstMatch(appStore.getState(), ['p', 'b'])
  appStore.dispatch([
    existingThoughtMoveAction({
      oldPath: pathAB!,
      newPath: pathPB!,
      newRank: 1,
    }),
  ])
  await timer.runAllAsync()

  timer.useRealTimer()

  expect(isPending(appStore.getState(), ['p', 'b'])).toEqual(false)
  expect(isPending(appStore.getState(), ['p', 'b', 'c', '3'])).toEqual(true)
})
