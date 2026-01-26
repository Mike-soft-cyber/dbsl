/**
 * Curriculum Formatting Utilities
 * Handles cleaning and formatting of CBC curriculum data
 */

/**
 * Removes curriculum numbering from text
 * Examples: 
 *   "1.0: SCIENTIFIC INVESTIGATION" → "SCIENTIFIC INVESTIGATION"
 *   "1.1 Introduction to Science" → "Introduction to Science"
 *   "2.3.4: Cell Biology" → "Cell Biology"
 */
export const cleanCurriculumNumbers = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/^\d+(\.\d+)*\s*:\s*/g, '')  // Remove "1.0: " or "1.1.1: "
    .replace(/^\d+(\.\d+)*\s+/g, '')       // Remove "1.0 " or "1.1.1 "
    .trim();
};

/**
 * Clean an entire row of table data
 */
export const cleanTableRow = (row) => {
  if (!Array.isArray(row)) return row;
  return row.map(cell => cleanCurriculumNumbers(cell));
};

/**
 * Clean entire table data structure
 */
export const cleanTableData = (tableData) => {
  if (!tableData) return tableData;
  
  return {
    ...tableData,
    headers: tableData.headers?.map(h => cleanCurriculumNumbers(h)) || [],
    rows: tableData.rows?.map(row => cleanTableRow(row)) || []
  };
};

/**
 * Clean curriculum data in document headers
 */
export const cleanHeaderPairs = (headerPairs) => {
  if (!Array.isArray(headerPairs)) return headerPairs;
  
  return headerPairs.map(([key, value]) => [
    key,
    cleanCurriculumNumbers(value)
  ]);
};

// Export all functions
export default {
  cleanCurriculumNumbers,
  cleanTableRow,
  cleanTableData,
  cleanHeaderPairs
};