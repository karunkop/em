/** Defines app-wide constants. */
import { emojiRegex } from './emojiRegex'
import { Index, SimplePath, ThoughtId } from './@types'

export { default as INITIAL_SETTINGS } from './initialSettings'

// maximum number of characters of children to allow expansion
export const MAX_DISTANCE_FROM_CURSOR = 3
export const MAX_DEPTH = 20
export const FADEOUT_DURATION = 400

// number of ms to wait after thought hover to expand it's children
export const EXPAND_HOVER_DELAY = 1000

// ms on startup before offline mode is enabled
// sufficient to avoid flash on login
export const OFFLINE_TIMEOUT = 8 * 1000
export const ERROR_TIMEOUT = 30 * 1000
export const RENDER_DELAY = 50
export const MAX_CURSOR_HISTORY = 50
export const MODAL_REMIND_ME_LATER_DURATION = 1000 * 60 * 60 * 2 // 2 hours
// export const MODAL_REMIND_ME_TOMORROW_DURATION = 1000 * 60 * 60 * 20 // 20 hours
export const MODAL_CLOSE_DURATION = 1000 // 1000 * 60 * 5 // 5 minutes
export const MODAL_NEWCHILD_DELAY = 1200
// export const MODAL_SUPERSCRIPT_SUGGESTOR_DELAY = 1000 * 30
// export const MODAL_SUPERSCRIPT_DELAY = 800

// divider plus px from max width of list items
export const DIVIDER_PLUS_PX = 30
export const DIVIDER_MIN_WIDTH = 85

export const LATEST_SHORTCUT_DIAGRAM_DURATION = 800

// number of latest shorrcuts to show at a time
export const LATEST_SHORTCUT_LIMIT = 3

// each tutorial step is defined as a constant for compile-time validation
// all integers must existing between TUTORIAL_STEP_START and TUTORIAL_STEP_END
// fractional values may be used for "hints" that are not included in the Next/Prev sequence

// Basics tutorial
export const TUTORIAL_STEP_START = 1
export const TUTORIAL_STEP_FIRSTTHOUGHT = 2
export const TUTORIAL_STEP_FIRSTTHOUGHT_ENTER = 3
export const TUTORIAL_STEP_SECONDTHOUGHT = 4
export const TUTORIAL_STEP_SECONDTHOUGHT_HINT = 4.1
export const TUTORIAL_STEP_SECONDTHOUGHT_ENTER = 5
export const TUTORIAL_STEP_SUBTHOUGHT = 6
export const TUTORIAL_STEP_SUBTHOUGHT_ENTER = 7
export const TUTORIAL_STEP_AUTOEXPAND = 8
export const TUTORIAL_STEP_AUTOEXPAND_EXPAND = 9
export const TUTORIAL_STEP_SUCCESS = 10

// Linked Thoughts tutorial
export const TUTORIAL2_STEP_START = 11
export const TUTORIAL2_STEP_CHOOSE = 12
export const TUTORIAL2_STEP_CONTEXT1_PARENT = 13
export const TUTORIAL2_STEP_CONTEXT1_PARENT_HINT = 13.1
export const TUTORIAL2_STEP_CONTEXT1 = 14
export const TUTORIAL2_STEP_CONTEXT1_HINT = 14.1
export const TUTORIAL2_STEP_CONTEXT1_SUBTHOUGHT = 15
export const TUTORIAL2_STEP_CONTEXT1_SUBTHOUGHT_HINT = 15.1
export const TUTORIAL2_STEP_CONTEXT2_PARENT = 16
export const TUTORIAL2_STEP_CONTEXT2_PARENT_HINT = 16.1
export const TUTORIAL2_STEP_CONTEXT2 = 17
export const TUTORIAL2_STEP_CONTEXT2_HINT = 17.1
export const TUTORIAL2_STEP_CONTEXT2_SUBTHOUGHT = 18
export const TUTORIAL2_STEP_CONTEXT2_SUBTHOUGHT_HINT = 18.1
export const TUTORIAL2_STEP_CONTEXT_VIEW_SELECT = 19
export const TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE = 20
export const TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE_HINT = 20.1
export const TUTORIAL2_STEP_CONTEXT_VIEW_OPEN = 21
export const TUTORIAL2_STEP_CONTEXT_VIEW_EXAMPLES = 22
export const TUTORIAL2_STEP_SUCCESS = 23

export const TUTORIAL_VERSION_TODO = 0
export const TUTORIAL_VERSION_JOURNAL = 1
export const TUTORIAL_VERSION_BOOK = 2

export const TUTORIAL_CONTEXT = {
  [TUTORIAL_VERSION_TODO]: 'To Do',
  [TUTORIAL_VERSION_JOURNAL]: 'Relationships',
  [TUTORIAL_VERSION_BOOK]: 'Psychology',
}

export const TUTORIAL_CONTEXT1_PARENT = {
  [TUTORIAL_VERSION_TODO]: 'Home',
  [TUTORIAL_VERSION_JOURNAL]: 'Journal',
  [TUTORIAL_VERSION_BOOK]: 'Podcasts',
}

export const TUTORIAL_CONTEXT2_PARENT = {
  [TUTORIAL_VERSION_TODO]: 'Work',
  [TUTORIAL_VERSION_JOURNAL]: 'Therapy',
  [TUTORIAL_VERSION_BOOK]: 'Books',
}

// constants for different thoughtIndex schema versions
// export const SCHEMA_INITIAL = 0 // DEPRECATED
// export const SCHEMA_CONTEXTCHILDREN = 1 // DEPRECATED
export const SCHEMA_ROOT = 2 // change root → __ROOT__
export const SCHEMA_HASHKEYS = 3 // hash thoughtIndex keys
export const SCHEMA_META_SETTINGS = 4 // load settings from hidden thoughts via metaprogramming
export const SCHEMA_LATEST = SCHEMA_META_SETTINGS

// store the empty string as a non-empty token in firebase since firebase does not allow empty child records
// See: https://stackoverflow.com/questions/15911165/create-an-empty-child-record-in-firebase
export const EMPTY_TOKEN = '__EMPTY__'

// store the root string as a token that is not likely to be written by the user (bad things will happen)
export const HOME_TOKEN = '__ROOT__' as ThoughtId

export const ROOT_PARENT_ID = '__ROOT_PARENT_ID__' as ThoughtId

// token for hidden system context
export const EM_TOKEN = '__EM__' as ThoughtId

export const ABSOLUTE_TOKEN = '__ABSOLUTE__'

export const ROOT_CONTEXTS = [HOME_TOKEN, ABSOLUTE_TOKEN]

export const HOME_PATH = [HOME_TOKEN] as SimplePath
export const ABSOLUTE_PATH = [ABSOLUTE_TOKEN] as SimplePath

export const ALLOW_SINGLE_CONTEXT = false

export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY as string,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL as string,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID as string,
}

export const FIREBASE_REDIRECT_URL = process.env.REACT_APP_FIREBASE_REDIRECT_URL

// if (!FIREBASE_CONFIG.apiKey) {
//   console.warn('Environment variable not set: REACT_APP_FIREBASE_API_KEY')
// }

export const ALGOLIA_CONFIG = {
  applicationId: process.env.REACT_APP_ALGOLIA_APPPLICATION_ID as string,
  index: process.env.REACT_APP_ALGOLIA_INDEX as string,
  searchKeyEndpoint: process.env.REACT_APP_ALGOLIA_SEARCH_KEY_ENDPOINT as string,
}

// if (!ALGOLIA_CONFIG.applicationId) {
//   console.warn('Environment variable not set: REACT_APP_ALGOLIA_APPPLICATION_ID')
// }

export const FEEDBACK_URL = process.env.REACT_APP_FEEDBACK_URL as string

// if (!FEEDBACK_URL) {
//   console.warn('Environment variable not set: REACT_APP_FEEDBACK_URL')
// }

/** An identify function that returns the value passed to it. */
export const ID = <T = any>(x: T): T => x

/** A void function that does nothing. NOOP means "no operation". */
export const NOOP = () => {} // eslint-disable-line @typescript-eslint/no-empty-function

// prose view will automatically be enabled if there enough characters in at least one of the thoughts within a context
export const AUTO_PROSE_VIEW_MIN_CHARS = 200

// the base font of the browser used to calculate the scaling ratio
export const BASE_FONT_SIZE = 16

export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 40
export const FONT_SCALE_INCREMENT = 1

// to detect if field has multiline
export const MIN_LINE_HEIGHT = 26

// the maximum number of characters of a thought to display before ellipsizing in links and tutorial
export const THOUGHT_ELLIPSIZED_CHARS = 16

// time before gesture hint appears
export const GESTURE_SEGMENT_HINT_TIMEOUT = 300

// time before shortcut hint overlay appears
export const SHORTCUT_HINT_OVERLAY_TIMEOUT = 500

// time before scroll prioritization is disabled
export const SCROLL_PRIORITIZATION_TIMEOUT = 500

// number of recently edited thoughts to store
export const RECENTLY_EDITED_THOUGHTS_LIMIT = 100

// maximum number of chars to show in url before ellipsizing
export const URL_MAX_CHARS = 40

// to expand thought ends with ':'
export const EXPAND_THOUGHT_CHAR = ':'
export const MAX_EXPAND_DEPTH = 5

// shortcut ids of default buttons that appear in the toolbar
// otherwise read from Settings thought
export const TOOLBAR_DEFAULT_SHORTCUTS = [
  'undo',
  'redo',
  // 'search',
  'outdent',
  'indent',
  'toggleTableView',
  'toggleSort',
  'pinOpen',
  'pinSubthoughts',
  'note',
  'archive',
  // @MIGRATION_NOTE: context view is disable for the migration.
  // 'toggleContextView',
  'proseView',
  // 'toggleSplitView',
  'splitSentences',
  'subcategorizeOne',
  'subcategorizeAll',
  'toggleHiddenThoughts',
  'exportContext',
]

// Throttle editThought when user is typing.
// See: thoughtChangeHandler in Editable.tsx.
export const EDIT_THROTTLE = 500

export const REGEXP_PUNCTUATIONS = /^[…✓✗\-:.?! ]+$/i

export const REGEXP_URL =
  /^(?:http(s)?:\/\/)?(www\.)?[a-zA-Z@:%_\\+~#=]+[-\w@:%_\\+~#=.]*[\w@:%_\\+~#=]+[.:][\w()]{2,6}((\/[\w-()@:%_\\+~#?&=.]*)*)$/i

export const REGEXP_HTML = /<\/?[a-z][\s\S]*>/i

export const REGEXP_TAGS = /(<([^>]+)>)/gi

export const IPFS_GATEWAY = 'ipfs.infura.io'

export const TIMEOUT_BEFORE_DRAG = 200

export const MODIFIER_KEYS = {
  Alt: 1,
  Ctrl: 1,
  Meta: 1,
  Shift: 1,
}

// actions representing any cursor movements.
// These need to be differentiated from the other actions because
// any two or more such consecutive actions are merged together
export const NAVIGATION_ACTIONS: Index<string> = {
  cursorBack: 'cursorBack',
  cursorBeforeSearch: 'cursorBeforeSearch',
  cursorDown: 'cursorDown',
  cursorForward: 'cursorForward',
  cursorHistory: 'cursorHistory',
  cursorUp: 'cursorUp',
  setCursor: 'setCursor',
}

// a list of all undoable/reversible actions (stored as object for indexing)
export const UNDOABLE_ACTIONS: Index<string> = {
  archiveThought: 'archiveThought',
  bumpThoughtDown: 'bumpThoughtDown',
  cursorBack: 'cursorBack',
  cursorBeforeSearch: 'cursorBeforeSearch',
  cursorDown: 'cursorDown',
  cursorForward: 'cursorForward',
  cursorHistory: 'cursorHistory',
  cursorUp: 'cursorUp',
  deleteAttribute: 'deleteAttribute',
  deleteData: 'deleteData',
  deleteEmptyThought: 'deleteEmptyThought',
  deleteThoughtWithCursor: 'deleteThoughtWithCursor',
  editThought: 'editThought',
  deleteThought: 'deleteThought',
  moveThought: 'moveThought',
  expandContextThought: 'expandContextThought',
  indent: 'indent',
  moveThoughtDown: 'moveThoughtDown',
  moveThoughtUp: 'moveThoughtUp',
  newThought: 'newThought',
  createThought: 'createThought',
  outdent: 'outdent',
  searchLimit: 'searchLimit',
  setAttribute: 'setAttribute',
  setCursor: 'setCursor',
  setFirstSubthought: 'setFirstSubthought',
  settings: 'settings',
  splitThought: 'splitThought',
  splitSentences: 'splitSentences',
  subCategorizeAll: 'subCategorizeAll',
  subCategorizeOne: 'subCategorizeOne',
  toggleAttribute: 'toggleAttribute',
  toggleCodeView: 'toggleCodeView',
  toggleContextView: 'toggleContextView',
  toggleHiddenThoughts: 'toggleHiddenThoughts',
  toggleSplitView: 'toggleSplitView',
  toolbarOverlay: 'toolbarOverlay',
}

// modal states
export const MODALS: Index<string> = {
  welcome: 'welcome',
  help: 'help',
  home: 'home',
  export: 'export',
  feedback: 'feedback',
  auth: 'auth',
  invites: 'invites',
  signup: 'signup',
}

export const BETA_HASH = '8e767ca4e40aff7e22b14e5bf51743d8'

export enum DROP_TARGET {
  EmptyDrop = 'EmptyDrop',
  ThoughtDrop = 'ThoughtDrop',
}

export const EMOJI_REGEX = emojiRegex
/*
  Note: Use string.match instead of regex.test when using regex with global modifier. Regex with global modifier  keeps state of it's previous match causing unwanted results.
        Explaination: https://stackoverflow.com/a/30887581/10168748
 */
export const EMOJI_REGEX_GLOBAL = new RegExp(EMOJI_REGEX.source, 'g')

export const ALLOWED_FORMATTING_TAGS = ['b', 'i', 'u', 'em', 'strong', 'span']

export const ALLOWED_TAGS = ['ul', 'li', 'br', ...ALLOWED_FORMATTING_TAGS]

export const ALLOWED_ATTRIBUTES = {
  span: ['class', 'style'],
}

export const EMPTY_SPACE = '  '

export const META_PROGRAMMING_HELP = [
  {
    code: 'bullets',
    description: 'Options: Bullets, None\nHide the bullets of a context. For a less bullety look.',
  },
  {
    code: 'drop',
    description:
      'Options: top, bottom\nControls where in a context an item is placed after drag-and-drop. Default: bottom.',
  },
  {
    code: 'focus',
    description:
      'Options: Normal, Zoom\nWhen the cursor is on this thought, hide its parent and siblings for additional focus. Excellent for study time or when you have had too much coffee.',
  },
  {
    code: 'hidden',
    description: 'Hide the thought.',
  },
  {
    code: 'immovable',
    description: 'The thought cannot be moved. Not very useful.',
  },
  {
    code: 'label',
    description: 'Display a note in smaller text underneath the thought. How pretty.',
  },
  {
    code: 'options',
    description: 'A list of allowed subthoughts. We all have times when we need to be strict.',
  },
  {
    code: 'pin',
    description: 'Keep a thought expanded, forever. Or at least until you unpin it.',
  },
  {
    code: 'pinChildren',
    description: "Options: true, false\nKeep all of a thought's subthoughts expanded. A lot of pins.",
  },
  {
    code: 'publish',
    description: 'Specify meta data for publishing the context as an article.',
    hasChildren: true,
    children: [
      {
        code: 'Byline',
        description: 'A small byline of one or more lines to be displayed under the title.',
      },
      {
        code: 'Email',
        description:
          'A gravatar email to display as a small avatar next to the Byline. Something professional, or perhaps something sexy?',
      },
      {
        code: 'Title',
        description: 'Override the title of the article when exported.',
      },
    ],
  },
  {
    code: 'readonly',
    description: 'The thought cannot be edited, moved, or extended. Excellent for frustrating oneself.',
  },
  {
    code: 'src',
    description: 'Import thoughts from a given URL. Accepts plaintext, markdown, and HTML. Very buggy, trust me.',
  },
  {
    code: 'style',
    description:
      'Set CSS styles on the thought. You might also consider =styleContainer, =children/=style, =grandchildren/=style.',
  },
  {
    code: 'uneditable',
    description: 'The thought cannot be edited. How depressing.',
  },
  {
    code: 'unextendable',
    description: 'New subthoughts may not be added to the thought.',
  },
  {
    code: 'view',
    description:
      'Options: Article, List, Table, Prose\n Controls how the thought and its subthoughts are displayed. Use "Table" to create two columns, and "Prose" forlongform writing. Default: List.',
  },
]

export const GLOBAL_STYLE_ENV = {
  '=heading1': {
    style: {
      fontSize: '2em',
      fontWeight: 700,
      marginTop: '0.5em',
    },
    bullet: 'None',
  },
  '=heading2': {
    style: {
      fontSize: '1.75em',
      fontWeight: 700,
      marginTop: '0.5em',
    },
    bullet: 'None',
  },
  '=heading3': {
    style: {
      fontSize: '1.5em',
      fontWeight: 700,
      marginTop: '0.5em',
    },
    bullet: 'None',
  },
  '=heading4': {
    style: {
      fontSize: '1.25em',
      fontWeight: 600,
      marginTop: '0.5em',
    },
    bullet: 'None',
  },
  '=heading5': {
    style: {
      fontSize: '1.1em',
      fontWeight: 600,
      marginTop: '0.5em',
    },
    bullet: 'None',
  },
}

export enum VIEW_MODE {
  Table = 'Table',
  Prose = 'Prose',
}

export const INITIAL_SETTING_KEY = 'EM_INITIAL_SETTING'
