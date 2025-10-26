// Professional content formatting functions for educational documents
export const extractHeaderAndBody = (text) => {
  if (!text) return { headerPairs: [], body: text };
  
  const lines = text.split(/\r?\n/);
  const headerPairs = [];
  let bodyStartIdx = 0;
  let foundHeaderSection = false;

  const headerLineRegex = /^([A-Z][A-Z\s/()\-]*)\s*:\s*(.*)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line && !foundHeaderSection) continue;
    
    const headerMatch = line.match(headerLineRegex);
    if (headerMatch && headerMatch[2].trim()) {
      headerPairs.push([headerMatch[1].trim(), headerMatch[2].trim()]);
      foundHeaderSection = true;
      continue;
    }
    
    if (foundHeaderSection && (!headerMatch || !headerMatch[2].trim())) {
      bodyStartIdx = i;
      break;
    }
    
    if (!foundHeaderSection && line) {
      bodyStartIdx = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIdx).join('\n').trim();
  return { headerPairs, body };
};

export const formatLessonPlan = (text) => {
  return text
    // Main lesson plan title - clean, professional
    .replace(/^([^#\n]*?(?:Lesson Plan|LESSON PLAN)[^\n]*)\n/im, '# $1\n\n')
    
    // Strand and Sub-strand - professional formatting
    .replace(/^(STRAND|Strand):\s*([^\n]*)\s*(SUB-STRAND|Sub-strand):\s*([^\n]*)/gmi, 
      '## Learning Focus\n\n**Strand:** $2  \n**Sub-strand:** $4\n\n')
    .replace(/^(STRAND|Strand):\s*([^\n]*)/gmi, '**Strand:** $2  \n')
    .replace(/^(SUB-STRAND|Sub-strand):\s*([^\n]*)/gmi, '**Sub-strand:** $2  \n')
    
    // Learning Outcomes - clear and structured
    .replace(/^(SPECIFIC LEARNING OUTCOMES?|Specific Learning Outcomes?):\s*([^\n]*)/gmi, 
      '## Learning Objectives\n\n**By the end of this lesson, learners should be able to:**\n')
    
    // Key Inquiry Questions
    .replace(/^(KEY INQUIRY QUESTIONS?|Key Inquiry Questions?):\s*$/gmi, '## Key Questions\n\n')
    .replace(/^(\d+)\.\s*([^\n]*\?)/gm, '**Q$1:** $2  \n')
    
    // Learning Resources
    .replace(/^(LEARNING RESOURCES?|Learning Resources?):\s*$/gmi, '## Resources & Materials\n\n')
    .replace(/^(LEARNING RESOURCES?|Learning Resources?):\s*([^\n]*)/gmi, '## Resources & Materials\n\n$2\n\n')
    
    // Organization of Learning
    .replace(/^(ORGANIZATION OF LEARNING|Organization of Learning):\s*$/gmi, '## Learning Organization\n\n')
    .replace(/^(ORGANIZATION OF LEARNING|Organization of Learning):\s*([^\n]*)/gmi, '## Learning Organization\n\n$2\n\n')
    
    // Lesson sections with professional timing
    .replace(/^(INTRODUCTION|Introduction):\s*$/gmi, '## Introduction *(5 minutes)*\n\n')
    .replace(/^(INTRODUCTION|Introduction):\s*([^\n]*)/gmi, '## Introduction *(5 minutes)*\n\n$2\n\n')
    
    // Lesson Development
    .replace(/^(LESSON DEVELOPMENT|Lesson Development):\s*$/gmi, '## Lesson Development\n\n')
    
    // Step-by-step activities
    .replace(/^(STEP \d+):\s*$/gmi, '### $1\n\n')
    .replace(/^(STEP \d+):\s*([^\n]*)/gmi, '### $1\n\n$2\n\n')
    
    // Facilitator and Learner actions - clean, professional
    .replace(/^(\s*)(Facilitator|FACILITATOR):\s*([^\n]*)/gmi, '**Teacher:** $3  \n')
    .replace(/^(\s*)(Learners?|LEARNERS?):\s*([^\n]*)/gmi, '**Students:** $3  \n')
    
    // Extended Activities
    .replace(/^(EXTENDED ACTIVITIES?|Extended Activities?):\s*$/gmi, '## Extended Activities\n\n')
    .replace(/^(EXTENDED ACTIVITIES?|Extended Activities?):\s*([^\n]*)/gmi, '## Extended Activities\n\n$2\n\n')
    
    // Conclusion
    .replace(/^(CONCLUSION|Conclusion):\s*$/gmi, '## Conclusion *(5 minutes)*\n\n')
    .replace(/^(CONCLUSION|Conclusion):\s*([^\n]*)/gmi, '## Conclusion *(5 minutes)*\n\n$2\n\n')
    
    // Professional sections
    .replace(/^(REFLECTION|Reflection):\s*$/gmi, '## Teacher Reflection\n\n')
    .replace(/^(REFLECTION|Reflection):\s*([^\n]*)/gmi, '## Teacher Reflection\n\n$2\n\n')
    
    .replace(/^(ASSESSMENT|Assessment):\s*$/gmi, '## Assessment\n\n')
    .replace(/^(ASSESSMENT|Assessment):\s*([^\n]*)/gmi, '## Assessment\n\n$2\n\n')
    
    // Duration formatting
    .replace(/^(Duration|TIME|Time):\s*([^\n]*)/gmi, '**Duration:** $2\n\n')
    
    // Clean spacing
    .replace(/\n(##)/g, '\n\n$1')
    .replace(/(##[^\n]*)\n(?!\n)/g, '$1\n\n')
    .replace(/\n(###)/g, '\n\n$1')
    .replace(/(###[^\n]*)\n(?!\n)/g, '$1\n\n')
    
    // Professional separators
    .replace(/(## Lesson Development\n\n)/g, '$1---\n\n')
    .replace(/(## Extended Activities\n\n)/g, '\n---\n\n$1')
    .replace(/(## Conclusion)/g, '\n---\n\n$1')
    
    // Clean bullet points
    .replace(/^\s*[-•]\s+/gm, '- ')
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
    
    // Emphasize key instructional terms
    .replace(/\b(demonstrate|explain|guide|introduce|practice|discuss|observe|evaluate)\b/gi, '**$1**');
};

export const formatLessonNotes = (text) => {
  return text
    .replace(/^(?!(?:SCHOOL|FACILITATOR|GRADE|SUBJECT|STRAND|SUB-STRAND|TERM):)([^#\n][^\n]*?(?:Study Notes|Lesson|Topic|Notes|Understanding|Unit \d+|Chapter \d+)[^\n]*)\n/im, '# $1\n\n')
    .replace(/^(Introduction|Getting Started|Overview):\s*$/gmi, '## $1\n\n')
    .replace(/^(What is|What are|Definition|Meaning)([^\n]*):\s*$/gmi, '## Definition$2\n\n')
    .replace(/^(Types?|Forms?|Categories|Classifications?)([^\n]*):\s*$/gmi, '## $1$2\n\n')
    .replace(/^(Examples?|Illustrations?)([^\n]*):\s*$/gmi, '## $1$2\n\n')
    .replace(/^(Methods?|Processes?|Steps?|Procedures?)([^\n]*):\s*$/gmi, '## $1$2\n\n')
    .replace(/^(Key [Ii]nquiry [Qq]uestions?|Questions?):\s*$/gmi, '## Key Questions\n\n')
    .replace(/^(Key [Vv]ocabulary|Important [Tt]erms?|Vocabulary):\s*$/gmi, '## Key Vocabulary\n\n')
    .replace(/^(Learning [Oo]bjectives?|Objectives?):\s*$/gmi, '## Learning Objectives\n\n')
    .replace(/^(Main [Cc]ontent|[Cc]ore [Cc]oncepts?|Content):\s*$/gmi, '## Main Content\n\n')
    .replace(/^(Activities?|[Pp]ractical [Ww]ork|Exercises?):\s*$/gmi, '## Activities\n\n')
    .replace(/^(Assessment|[Ee]valuation|Review):\s*$/gmi, '## Assessment\n\n')
    .replace(/^(Homework|[Ee]xtended [Aa]ctivities?|Assignment):\s*$/gmi, '## Homework\n\n')
    .replace(/^(Reflection|[Ss]ummary|Conclusion):\s*$/gmi, '## Summary\n\n')
    .replace(/^(Safety|[Pp]recautions?|Important [Nn]otes?):\s*$/gmi, '## Important Notes\n\n')
    .replace(/^(Materials?|[Rr]esources?|[Ee]equipment|Tools?):\s*$/gmi, '## Materials & Resources\n\n')
    .replace(/^(Applications?|Uses?)([^\n]*):\s*$/gmi, '## Applications\n\n')
    .replace(/^(Properties|Characteristics)([^\n]*):\s*$/gmi, '## Properties\n\n')
    .replace(/^(History|Background|Origin)([^\n]*):\s*$/gmi, '## Background\n\n')
    .replace(/^(Importance|Significance|Why [Ii]t [Mm]atters?)([^\n]*):\s*$/gmi, '## Importance\n\n')
    .replace(/^(Step \d+|Activity \d+|Task \d+|Part \d+)[\.:]\s*([^\n]*)/gm, '### $1: $2\n\n')
    .replace(/^(Duration|Time [Nn]eeded):\s*([^\n]*)/gmi, '**Duration:** $2\n\n')
    .replace(/^(Materials|Resources|Equipment [Nn]eeded):\s*([^\n]*)/gmi, '**Materials:** $2\n\n')
    .replace(/^(?!(?:SCHOOL|FACILITATOR|GRADE|SUBJECT|STRAND|SUB-STRAND|TERM):)([A-Z][a-zA-Z\s]+):\s*([^\n]*)/gm, (match, term, definition) => {
      if (definition.length > 10 && !definition.match(/^\d+\s*minutes?$/i)) {
        return `**${term}:** ${definition}\n`;
      }
      return match;
    })
    .replace(/^\s*[-•]\s+/gm, '- ')
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
    .replace(/^(Remember|Note|Important|Warning|Tip|Key [Pp]oint):\s*([^\n]*)/gmi, '> **$1:** $2\n')
    .replace(/^([^?\n]*\?)$/gm, '**Q:** $1\n')
    .replace(/\b(analyze|analyse|evaluate|compare|contrast|explain|describe|identify|classify|demonstrate)\b/gi, '**$1**')
    .replace(/\n(##)/g, '\n\n$1')
    .replace(/(##[^\n]*)\n(?!\n)/g, '$1\n\n')
    .replace(/\n(###)/g, '\n\n$1')
    .replace(/(###[^\n]*)\n(?!\n)/g, '$1\n\n');
};

export const formatExercises = (text) => {
return text
    // Main exercise title - clean, professional
    .replace(/^([^#\n]*?(?:Exercise|Question|Problem|Assessment|EXERCISES)[^\n]*)\n/i, '# $1\n\n')
    
    // Section headers with proper styling
    .replace(/^(SECTION [A-Z]|Part \d+)[\.:]\s*([^\n]*)/gm, '## $1: $2\n\n')
    
    // Instructions with proper formatting
    .replace(/^(Instructions?|Directions?|Note|Choose the correct answer[^\n]*)\s*[:.]?\s*([^\n]*)/gmi, '> **Instructions:** $1 $2\n\n')
    
    // Multiple choice questions with better formatting
    .replace(/^\s*(\d+)[\.)]\s*([^\n]*)/gm, '### **$1.** $2\n\n')
    
    // Multiple choice options with consistent formatting
    .replace(/^\s*([a-d])\)\s*([^\n]*)/gm, '   **$1)** $2\n')
    .replace(/^\s*([A-D])\.\s*([^\n]*)/gm, '   **$1.** $2\n')
    
    // Mark allocations with consistent styling
    .replace(/\((\d+)\s*marks?\)/gi, '**($1 marks)**')
    .replace(/\[(\d+)\s*marks?\]/gi, '**[$1 marks]**')
    
    // Structured question parts with better hierarchy
    .replace(/^\s*([a-z])\)\s*([^\n]*)/gm, '   **$1)** $2\n')
    .replace(/^\s*([i-v]+)\)\s*([^\n]*)/gm, '      **$1)** $2\n')
    
    // Answer sections
    .replace(/^(Answers?|Solutions?|Answer Key):\s*$/gmi, '## $1\n\n')
    
    // Time and marks information
    .replace(/^(Total marks?|Time allowed?|Duration):\s*([^\n]*)/gmi, '**$1:** $2\n\n')
    
    // Question action words with emphasis
    .replace(/^(Calculate|Solve|Find|Determine|Compute):\s*([^\n]*)/gmi, '**$1:** $2\n')
    .replace(/^(Explain|Describe|Define|State|Identify):\s*([^\n]*)/gmi, '**$1:** $2\n')
    .replace(/^(Draw|Sketch|Illustrate|Plot|Graph):\s*([^\n]*)/gmi, '**$1:** $2\n')
    .replace(/^(Compare|Contrast|Differentiate|Distinguish):\s*([^\n]*)/gmi, '**$1:** $2\n')
    
    // Instructions for learners section
    .replace(/^(INSTRUCTIONS FOR LEARNERS?|Instructions for learners?):\s*$/gmi, '## Instructions for Learners\n\n')
    
    // Clean up spacing around sections
    .replace(/\n(##)/g, '\n\n$1')
    .replace(/(##[^\n]*)\n(?!\n)/g, '$1\n\n')
    .replace(/\n(###)/g, '\n\n$1')
    .replace(/(###[^\n]*)\n(?!\n)/g, '$1\n\n')
    
    // Add proper spacing after question numbers
    .replace(/(### \*\*Question \d+:\*\*[^\n]*)\n(?!\n)/g, '$1\n\n')
    
    // Clean bullet points and ensure consistent formatting
    .replace(/^\s*[-•]\s*/gm, '• ')
    
    // Add section separators for better visual organization
    .replace(/(## SECTION [AB]:[^\n]*\n\n)/g, '$1---\n\n')
    .replace(/(## Instructions for Learners\n\n)/g, '\n---\n\n$1');
};

export const formatSchemesOfWork = (text) => {
  return text
    .replace(/^([^#\n]*?Scheme[^\n]*)\n/i, '# $1\n\n')
    .replace(/^(Week \d+|Lesson \d+)[\.:]\s*([^\n]*)/gm, '## $1: $2\n\n')
    .replace(/^(Strand|Sub-strand|SLO|Learning Experiences|Assessment|Resources):\s*([^\n]*)/gmi, '**$1:** $2  \n');
};

export const enhanceContentWithMarkdown = (text, documentType) => {
  if (!text) return "";
  
  let enhanced = text;

  switch (documentType) {
    case "Lesson Plan":
      enhanced = formatLessonPlan(enhanced);
      break;
    case "Lesson Notes":
      enhanced = formatLessonNotes(enhanced);
      break;
    case "Schemes of Work":
      enhanced = formatSchemesOfWork(enhanced);
      break;
    case "Exercises":
      enhanced = formatExercises(enhanced);
      break;
    default:
      enhanced = text
        .replace(/^([A-Z][A-Z\s]{3,})\n/gm, '## $1\n\n')
        .replace(/^([^:\n]{3,}):\s*$/gm, '**$1:**\n\n')
        .replace(/^\s*(\d+)\.\s*([^\n]*)/gm, '$1. **$2**\n')
        .replace(/^\s*[-•]\s*/gm, '- ');
  }

  return enhanced;
};

export const expandSLOs = (sloString, sloArray) => {
  if (!sloArray?.length) return sloString;

  return sloString.replace(/SLO:\s*([0-9,\s]+)/gi, (match, numbers) => {
    const expanded = numbers
      .split(",")
      .map((num) => {
        const index = parseInt(num.trim(), 10) - 1;
        return sloArray[index] || `SLO ${num.trim()}`;
      })
      .join("; ");
    return "SLO: " + expanded;
  });
};