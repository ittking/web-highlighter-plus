/**
 * Constants for web-highlighter-plus
 */

// Dataset attribute names (camelCase for dataset API, hyphen for HTML)
export const DATASET_IDENTIFIER = 'highlightId';
export const DATASET_IDENTIFIER_EXTRA = 'highlightIdExtra';
export const DATASET_SPLIT_TYPE = 'highlightSplitType';

// HTML attribute names (hyphenated for CSS selectors and setAttribute)
export const ATTR_IDENTIFIER = 'data-highlight-id';
export const ATTR_IDENTIFIER_EXTRA = 'data-highlight-id-extra';
export const ATTR_SPLIT_TYPE = 'data-highlight-split-type';

// Special index values
export const ROOT_IDX = -2;
export const UNKNOWN_IDX = -1;

// Default values
export const DEFAULT_WRAP_TAG = 'span';
export const DEFAULT_CLASS_NAME = 'highlight-wrap';

// Separator for extra IDs
export const ID_DIVISION = ';';
