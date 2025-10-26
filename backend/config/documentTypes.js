const DOCUMENT_TYPES = {
  LESSON_CONCEPT: 'Lesson Concept Breakdown',
  SCHEMES: 'Schemes of Work',
  LESSON_PLAN: 'Lesson Plan',
  LESSON_NOTES: 'Lesson Notes',
  EXERCISES: 'Exercises'
};

const PARSING_PATTERNS = {
  HEADER_LINE: /^([A-Z][A-Z\s/()\-]*)\s*:\s*(.*)$/,
  TABLE_ROW: /^\|.*\|$/,
  LEARNING_CONCEPT: /learning\s+concept/i,
  SCHEME_OF_WORK: /scheme.*work/i,
  LESSON_PLAN: /lesson.*plan/i,
  EXERCISES: /exercise|question|assessment/i
};

const GRADE_LEVELS = [
  'Pre-Primary 1',
  'Pre-Primary 2', 
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9'
];

const TERMS = [
  'Term 1',
  'Term 2', 
  'Term 3'
];

module.exports = {
  DOCUMENT_TYPES,
  PARSING_PATTERNS,
  GRADE_LEVELS,
  TERMS
};