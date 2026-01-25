import React from 'react';

const TableView = ({ data, strand, substrand, cbcEntry }) => {
   if (!data || !data.headers || !data.rows || data.rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No table data available
      </div>
    );
  }

  let fixedData = { ...data };
  
  const isSchemesOfWork = data.headers.some(h => 
    h.toUpperCase().includes('SPECIFIC LEARNING OUTCOMES') ||
    h.toUpperCase().includes('KEY INQUIRY QUESTION') ||
    h.toUpperCase().includes('LEARNING EXPERIENCES')
  );
  
  if (isSchemesOfWork) {
    console.warn('[TableView] ⚠️ Schemes of Work detected with', data.headers.length, 'columns');
    
    const correctHeaders = [
      'WEEK', 'LESSON', 'STRAND', 'SUB-STRAND',
      'SPECIFIC LEARNING OUTCOMES (SLO)', 'LEARNING EXPERIENCES',
      'KEY INQUIRY QUESTION (KIQ)', 'LEARNING RESOURCES',
      'ASSESSMENT', 'REFLECTION'
    ];
    
    let sloList = cbcEntry?.slo || [];
    
    if (sloList.length === 1 && sloList[0].includes('b)')) {
      console.log('[TableView] ⚠️ Detected combined SLOs, splitting...');
      const combined = sloList[0];
      // Split by lowercase letter followed by closing parenthesis
      sloList = combined
        .split(/(?=[a-z]\))/)
        .map(slo => slo.replace(/^[a-z]\)\s*/, '').trim())
        .filter(slo => slo.length > 5);
      
      console.log(`[TableView] ✅ Split into ${sloList.length} separate SLOs:`, sloList.map(s => s.substring(0, 40)));
    }
    
    console.log('[TableView] Available SLOs:', sloList.length);
    
    let learningExperiences = cbcEntry?.learningExperiences || [];
    
    if (learningExperiences.length === 1 && learningExperiences[0].includes('•')) {
      console.log('[TableView] ⚠️ Detected bullet-separated Learning Experiences, splitting...');
      learningExperiences = learningExperiences[0]
        .split('•')
        .map(exp => exp.trim())
        .filter(exp => exp.length > 5);
      console.log(`[TableView] ✅ Split into ${learningExperiences.length} separate experiences`);
    } else if (learningExperiences.length === 1 && /\d+\.\s/.test(learningExperiences[0])) {
      console.log('[TableView] ⚠️ Detected numbered Learning Experiences, splitting...');
      learningExperiences = learningExperiences[0]
        .split(/\d+\.\s/)
        .map(exp => exp.trim())
        .filter(exp => exp.length > 5);
      console.log(`[TableView] ✅ Split into ${learningExperiences.length} separate experiences`);
    }
    
    let keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    
    if (keyInquiryQuestions.length === 1 && /\d+\.\s/.test(keyInquiryQuestions[0])) {
      console.log('[TableView] ⚠️ Detected numbered Key Inquiry Questions, splitting...');
      keyInquiryQuestions = keyInquiryQuestions[0]
        .split(/\d+\.\s/)
        .map(q => q.trim())
        .filter(q => q.length > 5);
      console.log(`[TableView] ✅ Split into ${keyInquiryQuestions.length} separate questions`);
    } else if (keyInquiryQuestions.length === 1 && keyInquiryQuestions[0].includes('?') && keyInquiryQuestions[0].split('?').length > 2) {
      console.log('[TableView] ⚠️ Detected question-separated KIQs, splitting...');
      keyInquiryQuestions = keyInquiryQuestions[0]
        .split('?')
        .map(q => q.trim() + (q.trim() ? '?' : ''))
        .filter(q => q.length > 5 && q !== '?');
      console.log(`[TableView] ✅ Split into ${keyInquiryQuestions.length} separate questions`);
    }
    
    const dataMap = new Map();
    data.headers.forEach((h, i) => {
      const normalized = h.toUpperCase();
      if (normalized.includes('LEARNING EXPERIENCES')) dataMap.set('LEARNING_EXP', i);
      else if (normalized.includes('KEY INQUIRY') || normalized.includes('KIQ')) dataMap.set('KIQ', i);
      else if (normalized.includes('LEARNING RESOURCES') || (normalized.includes('RESOURCES') && !normalized.includes('LEARNING'))) dataMap.set('RESOURCES', i);
      else if (normalized.includes('ASSESSMENT')) dataMap.set('ASSESSMENT', i);
      else if (normalized.includes('SPECIFIC LEARNING OUTCOMES') || normalized.includes('SLO)')) dataMap.set('SLO', i);
      else if (normalized.includes('STRAND') && !normalized.includes('SUB')) dataMap.set('STRAND', i);
      else if (normalized.includes('SUB-STRAND')) dataMap.set('SUBSTRAND', i);
      else if (normalized.includes('WEEK')) dataMap.set('WEEK', i);
      else if (normalized.includes('LESSON')) dataMap.set('LESSON', i);
      else if (normalized.includes('REFLECTION')) dataMap.set('REFLECTION', i);
    });
    
    let defaultStrand = strand || 'NATURAL ENVIRONMENT';
    let defaultSubstrand = substrand || 'Soil';
    
    if (!strand && dataMap.has('STRAND')) {
      for (let i = 0; i < Math.min(5, data.rows.length); i++) {
        const row = data.rows[i];
        const value = row[dataMap.get('STRAND')];
        if (value && value.length > 3 && !value.includes('What') && !value.includes('Learners')) {
          defaultStrand = value;
          break;
        }
      }
    }
    
    if (!substrand && dataMap.has('SUBSTRAND')) {
      for (let i = 0; i < Math.min(5, data.rows.length); i++) {
        const row = data.rows[i];
        const value = row[dataMap.get('SUBSTRAND')];
        if (value && value.length > 2 && !value.includes('What') && !value.includes('Learners')) {
          defaultSubstrand = value;
          break;
        }
      }
    }
    
    console.log('[TableView] Using - Strand:', defaultStrand, 'Substrand:', defaultSubstrand);
    
    const getSLOForLesson = (lessonIndex) => {
      if (sloList.length === 0) {
        return '(a) Learners will achieve the learning outcomes for this lesson';
      }
      
      const lessonsPerSLO = Math.ceil(data.rows.length / sloList.length);
      const sloIndex = Math.floor(lessonIndex / lessonsPerSLO);
      const actualIndex = Math.min(sloIndex, sloList.length - 1);
      const letter = String.fromCharCode(97 + actualIndex);
      
      return `(${letter}) ${sloList[actualIndex]}`;
    };
    
    //get appropriate learning experience
    const getLearningExperience = (lessonIndex) => {
      if (learningExperiences.length === 0) {
        return 'Learners engage in learning activities';
      }
      
      const rotationIndex = Math.floor(lessonIndex / 2); // Change every 2 lessons
      return learningExperiences[rotationIndex % learningExperiences.length];
    };
    
    const getKeyInquiryQuestion = (lessonIndex) => {
      if (keyInquiryQuestions.length === 0) {
        return 'What did we learn?';
      }

      const rotationIndex = Math.floor(lessonIndex / 3);
      return keyInquiryQuestions[rotationIndex % keyInquiryQuestions.length];
    };
    
    const getAssessment = (lessonIndex) => {
      const assessmentMethods = [
        'Observation',
        'Oral questions',
        'Practical task',
        'Portfolio assessment',
        'Group discussion'
      ];
      return assessmentMethods[lessonIndex % assessmentMethods.length];
    };
    
    const getReflection = (lessonIndex, sloText) => {
      const reflectionTemplates = [
        'Were learners able to meet objectives?',
        'Did learners participate actively?',
        'Could learners demonstrate understanding?',
        'Were learners engaged throughout?',
        'Did learners achieve the learning goals?'
      ];
      return reflectionTemplates[lessonIndex % reflectionTemplates.length];
    };
    
    // Reconstruct rows with all 10 columns in correct order
    fixedData.headers = correctHeaders;
    fixedData.rows = data.rows.map((row, rowIndex) => {
      const weekNum = Math.floor(rowIndex / 5) + 1; // Adjust based on lessons per week
      const lessonNum = rowIndex + 1;
      
      const sloText = getSLOForLesson(rowIndex);
      
      const newRow = [
        `Week ${weekNum}`,                                          
        `Lesson ${lessonNum}`,                                       
        defaultStrand,                                               
        defaultSubstrand,                                            
        sloText,                                                     
        getLearningExperience(rowIndex),                             
        getKeyInquiryQuestion(rowIndex),                             
        row[dataMap.get('RESOURCES')] || 'Realia, charts',         
        getAssessment(rowIndex),                                     
        getReflection(rowIndex, sloText)                             
      ];
      
      return newRow;
    });
    
    console.log('[TableView] ✅ Reconstructed Schemes of Work with all 10 columns');
    console.log('[TableView] Sample SLO:', fixedData.rows[0][4]);
  }

  else {

    if (data.headers.some(h => h.toLowerCase().includes('learning concept'))) {
    console.log('[TableView] ✅ Lesson Concept Breakdown detected');
    console.log('[TableView] Current headers:', data.headers);
    console.log('[TableView] Current columns:', data.headers.length);
    
    const standardHeaders = ['TERM', 'WEEK', 'STRAND', 'SUB-STRAND', 'LEARNING CONCEPT'];
    
    // Only fix if headers don't match
    if (data.headers.length !== 5 || !arraysEqual(data.headers.map(h => h.toUpperCase()), standardHeaders)) {
      console.log('[TableView] ⚠️ Fixing columns for Lesson Concept Breakdown');
      
      fixedData.headers = standardHeaders;
      
      fixedData.rows = data.rows.map(row => {
        const newRow = [...row];
        
        // If row has fewer than 5 columns, pad with empty strings
        while (newRow.length < 5) {
          newRow.push('');
        }
        
        // If first column is not a term, add default term
        if (newRow[0] && !newRow[0].toLowerCase().includes('term')) {
          newRow.unshift('Term 1'); // Add term at beginning
        }
        
        // Ensure exactly 5 columns
        if (newRow.length > 5) {
          newRow.length = 5;
        }
        
        return newRow;
      });
      
      console.log('[TableView] ✅ Fixed to 5 columns:', fixedData.headers);
      console.log('[TableView] Sample row:', fixedData.rows[0]);
    }
  }
  }

  function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

  console.log('[TableView] Final headers:', fixedData.headers.length, fixedData.headers);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full border-collapse border border-gray-300 bg-white page-break-avoid">
          <thead className="bg-blue-600 text-white">
            <tr>
              {fixedData.headers.map((header, index) => (
                <th 
                  key={index}
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-white bg-blue-600"
                  style={{
                    minWidth: getColumnWidth(header, index),
                    maxWidth: getMaxColumnWidth(header, index),
                    wordWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {fixedData.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} page-break-avoid`}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="border border-gray-300 px-4 py-3 text-base text-gray-900 align-top"
                    style={{
                      minWidth: getColumnWidth(fixedData.headers[cellIndex], cellIndex),
                      maxWidth: getMaxColumnWidth(fixedData.headers[cellIndex], cellIndex),
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.5'
                    }}
                  >
                    {formatCellContent(cell, fixedData.headers[cellIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table summary */}
      <div className="mt-4 text-sm text-gray-600 no-print">
        <p>
          Showing {fixedData.rows.length} {fixedData.rows.length === 1 ? 'entry' : 'entries'} 
          across {fixedData.headers.length} columns
        </p>
      </div>
    </div>
  );
};

const getColumnWidth = (header, index) => {
  if (!header) return '100px';
  
  const headerLower = header.toLowerCase();
  
  if (headerLower.includes('term') && !headerLower.includes('determine')) {
    return '80px'; // Term column width
  } else if (headerLower.includes('week')) {
    return '70px';
  }
  
  if (headerLower.includes('week')) {
    return '70px';
  } else if (headerLower.includes('lesson') && !headerLower.includes('learning')) {
    return '70px';
  } else if (headerLower === 'strand' || headerLower.includes('strand') && !headerLower.includes('sub')) {
    return '120px';
  } else if (headerLower.includes('sub-strand')) {
    return '140px';
  } else if (headerLower.includes('specific learning outcomes') || headerLower.includes('slo')) {
    return '250px';
  } else if (headerLower.includes('learning experiences')) {
    return '200px';
  } else if (headerLower.includes('key inquiry') || headerLower.includes('kiq')) {
    return '180px';
  } else if (headerLower.includes('learning resources') || headerLower.includes('resources')) {
    return '150px';
  } else if (headerLower.includes('assessment')) {
    return '150px';
  } else if (headerLower.includes('reflection')) {
    return '180px';
  } else if (headerLower.includes('term')) {
    return '80px';
  } else if (headerLower.includes('learning concept')) {
    return '300px';
  }
  
  return Math.max(100, Math.min(250, header.length * 8)) + 'px';
};

const getMaxColumnWidth = (header, index) => {
  if (!header) return '400px';
  
  const headerLower = header.toLowerCase();
  
  if (headerLower.includes('specific learning outcomes') || headerLower.includes('slo')) {
    return '350px';
  } else if (headerLower.includes('learning experiences')) {
    return '300px';
  } else if (headerLower.includes('learning concept')) {
    return '400px';
  } else if (headerLower.includes('reflection')) {
    return '250px';
  } else if (headerLower.includes('key inquiry') || headerLower.includes('kiq')) {
    return '250px';
  }
  
  return '350px';
};

const formatCellContent = (content, header) => {
  if (!content || content === '') return '-';
  
  const text = String(content).trim();
  
  if (text.length > 100 && (
    header?.toLowerCase().includes('learning concept') ||
    header?.toLowerCase().includes('specific learning outcomes') ||
    header?.toLowerCase().includes('learning experiences') ||
    header?.toLowerCase().includes('reflection')
  )) {
    return text
      .replace(/\. ([A-Z])/g, '. $1')
      .replace(/; ([A-Z])/g, '; $1');
  }
  
  return text;
};

export default TableView;