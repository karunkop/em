import { Firebase, State } from '../@types'

/**
 * Get the user ref from an authenticated user's details stored in the state.
 */
export const getUserRef = (state: State): Firebase.Ref<Firebase.User> | null =>
  state.user?.uid ? window.firebase?.database().ref('users/' + state.user.uid) : null
