import { Dispatch } from 'react'
import { hashThought, keyValueBy, getUserRef } from '../util'
import { error } from '../action-creators'
import {
  Firebase,
  Index,
  Lexeme,
  Parent,
  State,
  ThoughtId,
  ThoughtIndices,
  ThoughtSubscriptionUpdates,
} from '../@types'

export enum FirebaseChangeTypes {
  Create = 'child_added',
  Update = 'child_changed',
  Delete = 'child_removed',
}

export interface FirebaseChangeHandlers {
  contextIndex?: {
    [FirebaseChangeTypes.Create]?: (updates: ThoughtSubscriptionUpdates) => void
    [FirebaseChangeTypes.Update]?: (updates: ThoughtSubscriptionUpdates) => void
    [FirebaseChangeTypes.Delete]?: (updates: ThoughtSubscriptionUpdates) => void
  }
  thoughtIndex?: {
    [FirebaseChangeTypes.Create]?: (updates: ThoughtSubscriptionUpdates) => void
    [FirebaseChangeTypes.Update]?: (updates: ThoughtSubscriptionUpdates) => void
    [FirebaseChangeTypes.Delete]?: (updates: ThoughtSubscriptionUpdates) => void
  }
}
/**
 * Get all firebase related functions as an object.
 */
const getFirebaseProvider = (state: State, dispatch: Dispatch<any>) => ({
  /** Deletes all data in the data provider. */
  clearAll: () => {
    throw new Error('NOT IMPLEMENTED')
  },

  /** Gets the Lexeme object by id. */
  async getThoughtById(id: string): Promise<Lexeme | undefined> {
    const userRef = getUserRef(state)
    const ref = userRef!.child('thoughtIndex').child<Lexeme>(id)
    return new Promise(resolve =>
      ref.once('value', (snapshot: Firebase.Snapshot<Lexeme>) => {
        resolve(snapshot.val())
      }),
    )
  },
  /** Gets multiple Lexeme objects by ids. */
  async getThoughtsByIds(ids: string[]): Promise<(Lexeme | undefined)[]> {
    const userRef = getUserRef(state)
    const snapshots = await Promise.all(ids.map(id => userRef?.child('thoughtIndex').child<Lexeme>(id).once('value')))
    return snapshots.map(snapshot => snapshot?.val())
  },

  /**
   * Gets a context by id.
   *
   * @param conte,xt
   */
  async getContextById(id: string): Promise<Parent | undefined> {
    const userRef = getUserRef(state)
    const ref = userRef!.child('contextIndex').child<Parent>(id)
    return new Promise(resolve =>
      ref.once('value', (snapshot: Firebase.Snapshot<Parent>) => {
        resolve(snapshot.val())
      }),
    )
  },
  /** Gets multiple PrentEntry objects by ids. */
  getContextsByIds: async (ids: string[]): Promise<(Parent | undefined)[]> => {
    const userRef = getUserRef(state)
    const snapshots = await Promise.all(ids.map(id => userRef?.child('contextIndex').child<Parent>(id).once('value')))
    return snapshots.map(snapshot => snapshot?.val())
  },
  /** Updates Firebase data. */
  async update(updates: Index<any>) {
    const userRef = getUserRef(state)
    return new Promise((resolve, reject) => {
      userRef!.update(updates, (err: Error | null, ...args: any[]) => {
        if (err) {
          dispatch(error({ value: err.message }))
          console.error(err, updates)
          reject(err)
        } else {
          resolve(args)
        }
      })
    })
  },
  /** Updates a context in the contextIndex. */
  async updateContext(id: string, parentEntry: Parent): Promise<unknown> {
    return this.update({
      ['contextIndex/' + id]: parentEntry,
    })
  },
  /** Updates a thought in the thoughtIndex. */
  async updateThought(id: string, lexeme: Lexeme): Promise<unknown> {
    return this.update({
      ['thoughtIndex/' + id]: lexeme,
    })
  },
  /** Updates the contextIndex. */
  async updateContextIndex(contextIndex: Index<Parent>): Promise<unknown> {
    return this.update(
      keyValueBy(Object.entries(contextIndex), ([key, value]) => ({
        ['contextIndex/' + key]: value,
      })),
    )
  },
  /** Updates the thoughtIndex. */
  async updateThoughtIndex(thoughtIndex: Index<Lexeme>): Promise<unknown> {
    return this.update(
      keyValueBy(Object.entries(thoughtIndex), ([key, value]) => ({
        ['thoughtIndex/' + key]: value,
      })),
    )
  },
})

/** Creates a subscription handler that converts a Parent snapshot to a ThoughtUpdate and invokes a callback.
 *
 * @param value The Parent value to set in the update. Defaults to the snapshot Parent. Useful for setting to null.
 */
const parentSubscriptionHandler =
  (onUpdate: (updates: ThoughtSubscriptionUpdates) => void, { value }: { value?: Parent | null } = {}) =>
  (snapshot: Firebase.Snapshot<Parent>) => {
    // only contains fields that have changed
    const parentPartial = snapshot.val()
    if (!parentPartial) return null
    const updates = {
      contextIndex: {
        [parentPartial.id]: {
          // snapshot contains updatedBy of deleted thought
          updatedBy: parentPartial.updatedBy,
          value:
            value !== undefined
              ? value
              : {
                  // pass id from snapshot since snapshot only contains changed fields
                  ...parentPartial,
                  id: snapshot.key as ThoughtId,
                },
        },
      },
      thoughtIndex: {},
    }
    onUpdate(updates)
  }

/** Creates a subscription handler that converts a Lexeme snapshot to a ThoughtUpdate and invokes a callback.
 *
 * @param value The Lexeme value to set in the update. Defaults to the snapshot Lexeme. Useful for setting to null.
 */
const lexemeSubscriptionHandler =
  (onUpdate: (updates: ThoughtSubscriptionUpdates) => void, { value }: { value?: Lexeme | null } = {}) =>
  (snapshot: Firebase.Snapshot<Lexeme>) => {
    const lexemePartial = snapshot.val()
    if (!lexemePartial) return null
    const updates = {
      contextIndex: {},
      thoughtIndex: {
        [hashThought(lexemePartial.value)]: {
          // snapshot contains updatedBy of deleted thought
          updatedBy: lexemePartial.updatedBy,
          value:
            value !== undefined
              ? value
              : {
                  // pass id from snapshot since snapshot only contains changed fields
                  id: snapshot.key,
                  ...lexemePartial,
                },
        },
      },
    }
    onUpdate(updates)
  }

/** Subscribe to firebase. */
export const subscribe = (userId: string, onUpdate: (updates: ThoughtSubscriptionUpdates) => void) => {
  const thoughtsRef: Firebase.Ref<ThoughtIndices> = window.firebase?.database().ref(`users/${userId}`)
  const contextIndexRef: Firebase.Ref<Parent> = thoughtsRef.child('contextIndex')
  const thoughtIndexRef: Firebase.Ref<Lexeme> = thoughtsRef.child('thoughtIndex')

  // contextIndex subscriptions
  contextIndexRef
    .orderByChild('lastUpdated')
    .startAt(new Date().toISOString())
    .on('child_added', parentSubscriptionHandler(onUpdate))
  contextIndexRef.on('child_changed', parentSubscriptionHandler(onUpdate))
  contextIndexRef.on('child_removed', parentSubscriptionHandler(onUpdate, { value: null }))

  // thoughtIndex subscriptions
  thoughtIndexRef
    .orderByChild('lastUpdated')
    .startAt(new Date().toISOString())
    .on('child_added', lexemeSubscriptionHandler(onUpdate))
  thoughtIndexRef.on('child_changed', lexemeSubscriptionHandler(onUpdate))
  thoughtIndexRef.on('child_removed', lexemeSubscriptionHandler(onUpdate, { value: null }))
}

export default getFirebaseProvider
