
const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonNotesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Notes');
  }

  createPrompt(requestData, cbcEntry) {
    const { 
      school, 
      teacherName, 
      grade, 
      learningArea, 
      strand, 
      substrand, 
      term, 
      learningConcepts,
      lessonDuration,
      ageRange,
      weeks
    } = requestData;
    
    
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || ['Materials from the local environment'];
    const coreCompetencies = cbcEntry?.coreCompetencies || ['Communication and collaboration', 'Self-efficacy'];
    const values = cbcEntry?.values || ['Sharing', 'Cooperation'];
    const pertinentIssues = cbcEntry?.pertinentIssues || ['Education for Sustainable Development'];
    
    
    const termNumber = term?.replace('Term ', '').replace('term', '');
    const actualWeeks = weeks || 10;
    const actualLessonDuration = lessonDuration || 30;
    const actualAgeRange = ageRange || '4-5 years';
    
    
    const allConcepts = learningConcepts || [];
    const limitedConcepts = allConcepts.slice(0, 20);
    
    console.log(`[Lesson Notes] Reducing concepts from ${allConcepts.length} to ${limitedConcepts.length}`);

    return `Generate comprehensive Lesson Notes in POINT FORM ONLY, fully aligned with CBC framework.

CRITICAL FORMATTING REQUIREMENTS:
✓ ALL CONTENT MUST BE IN POINT FORM (bullet points or numbered lists)
✓ NO LONG PARAGRAPHS - Maximum 25 words per point
✓ Use concise, scannable bullet points throughout
✓ Include HONEST, ACCESSIBLE web resources with search strategies
✓ Keep all explanations brief and to the point
✓ Each section should be easy to scan and read quickly

DOCUMENT INFORMATION:
SCHOOL: ${this.escapeForPrompt(school)}
TEACHER: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
STRAND: ${this.escapeForPrompt(strand)}
SUB-STRAND: ${this.escapeForPrompt(substrand)}
TERM: ${this.escapeForPrompt(term)}
TOTAL WEEKS: ${actualWeeks}
AGE RANGE: ${actualAgeRange}
LESSON DURATION: ${actualLessonDuration} minutes per lesson

---

# LESSON NOTES: ${this.escapeForPrompt(substrand)}
## ${this.escapeForPrompt(learningArea)} - ${this.escapeForPrompt(grade)} - ${this.escapeForPrompt(term)}

---

## 📋 CURRICULUM INFORMATION
- **Strand:** ${this.escapeForPrompt(strand)}
- **Sub-strand:** ${this.escapeForPrompt(substrand)}
- **Duration:** ${actualWeeks} weeks (approximately ${actualWeeks * 5} lessons)
- **Grade:** ${this.escapeForPrompt(grade)}
- **Age Range:** ${actualAgeRange}
- **Term:** ${this.escapeForPrompt(term)}
- **Lesson Duration:** ${actualLessonDuration} minutes per lesson

---

## 📖 INTRODUCTION
Write a brief introduction in 4-5 BULLET POINTS covering:
- What ${substrand} is about (1 sentence)
- Why it's important for ${grade} learners in Kenya
- Connection to Kenyan context and Vision 2030
- Real-world applications students will encounter
- Skills students will develop

---

## 🎯 SPECIFIC LEARNING OUTCOMES
By the end of the sub-strand, the learner should be able to:
${sloList.slice(0, 5).map((slo, i) => `${String.fromCharCode(97 + i)}) ${slo}`).join('\n')}

---

## 🔑 KEY VOCABULARY
List 8-10 key terms as bullet points with brief definitions (under 15 words each):
- **Term:** Brief, clear definition
- **Term:** Brief, clear definition
(Focus on terms specific to ${substrand} that ${grade} students need to know)

---

## 📚 CONTENT BY LEARNING CONCEPT

${limitedConcepts.map((concept, index) => {
  const sloIndex = Math.floor(index / Math.ceil(limitedConcepts.length / Math.min(sloList.length, 5)));
  const actualSloIndex = Math.min(sloIndex, sloList.length - 1);
  const relevantSLO = sloList[actualSloIndex] || sloList[0];
  const letter = String.fromCharCode(97 + actualSloIndex);
  
  return `
### ${concept.week}: ${concept.concept}

**SLO Focus:** (${letter}) ${relevantSLO}

**Learning Focus:**
- Main concept: ${concept.concept}
- Why this concept matters for ${grade} learners

**Main Content:**

**What it is:**
- Brief explanation in 3-4 points (max 20 words each)
- Define the concept clearly for ${actualAgeRange} learners
- Use simple, grade-appropriate language
- Include one Kenyan example

**Why it matters:**
- For Kenyan students (2 points):
  - Relevance to daily life in Kenya
  - Connection to local environment or culture
- Alignment with Kenya's Vision 2030 (1 point)
- Skills developed through this concept

**How it works:**
- Step-by-step process (4-5 numbered steps)
- Each step should be clear and actionable
- Use ${actualAgeRange} appropriate language
- Include practical examples from Kenya

**Kenyan Context:**
- Local examples (2-3 specific points)
- How this connects to student's community
- Cultural or regional relevance
- Locally available materials or resources

**Key Points to Remember:**
✓ Essential concept summary (under 15 words)
✓ Practical application students can use
✓ Kenyan connection or local example
✓ Safety consideration or value emphasized (if relevant)

**Suggested Learning Experiences (from CBC):**
${learningExperiences.slice(0, 3).map((exp, i) => `${i + 1}. ${exp}`).join('\n')}

**Procedure:**
1. **Opening (5 min):** [Brief engaging activity to introduce concept]
2. **Main Activity (${actualLessonDuration - 15} min):** [Hands-on learning experience]
3. **Practice (5 min):** [Students apply what they learned]
4. **Closing (5 min):** [Quick review and reflection]

**Materials:**
- [List 4-6 specific, locally available materials]
- All materials should be accessible in Kenyan schools
- Include alternatives if materials are not available

**Expected Outcome:**
- Students will [specific, observable outcome]
- Direct connection to SLO: [how this achieves the learning outcome]

**Real-World Kenyan Examples:**
- **Agricultural:** How farmers in Kenya use this concept
- **Economic/Industrial:** Local business application
- **Community & Daily Life:** Example from everyday Kenyan life
`;
}).join('\n---\n')}

---

## 📚 FINDING RESOURCES FOR ${substrand}

### 🎯 STEP 1: CHECK OFFICIAL KENYAN SOURCES

**Kenya Institute of Curriculum Development (KICD)**
- **Website:** https://kicd.ac.ke/
- **What's there:** Official CBC curriculum designs, SLOs, assessment frameworks
- **How to use it:**
  - Look for downloadable curriculum design PDFs
  - Search for "${learningArea}" or "${grade}"
  - Download PDF and use Ctrl+F to find "${substrand}"
  - Extract official learning outcomes and suggested activities
- **Why it's reliable:** Government-approved, curriculum-aligned content

**Kenya Education Cloud (KEC)**
- **Website:** https://kec.ac.ke/
- **What's there:** E-books, educational videos, digital worksheets
- **How to search:**
  - Try: "${grade} ${learningArea}"
  - Try: "${substrand} activities"
  - Browse subject categories for ${learningArea}
- **Note:** Content availability varies by topic

**Elimika TSC Digital Platform**
- **Website:** https://elimika.tsc.go.ke/
- **What's there:** Lesson plans, teaching videos, interactive activities
- **Requirements:** Free teacher registration
- **How to search:**
  - Register with your TSC number (if you have one)
  - Search: "${substrand}" or "${learningArea} ${grade}"
  - Filter by grade level and subject
- **Note:** Content is continuously being added

---

### 🔍 STEP 2: SEARCH FOR VIDEO DEMONSTRATIONS

**YouTube Search Strategy:**

Try these search terms (copy and paste into YouTube):
1. "${substrand} activities for young children"
2. "teaching ${substrand} to ${actualAgeRange} learners"
3. "${substrand} demonstration step by step"
4. "CBC ${grade} ${learningArea} lesson"
5. "${substrand} ideas for preschool" (if ${grade} is PP1/PP2)

**Channels to check:**
- KICD Official (Kenya's curriculum authority)
- Khan Academy Kids (quality educational content)
- Crash Course Kids (clear explanations)
- Art for Kids Hub (if art-related)
- PBS Kids (trusted educational content)

**Filtering tips:**
- Filter by: Upload date (prefer recent videos)
- Check: Video length (10-20 min ideal for lessons)
- Look for: Clear demonstrations and age-appropriate content
- Verify: Content aligns with CBC learning outcomes

---

### 💡 STEP 3: FIND ACTIVITY IDEAS & WORKSHEETS

**Pinterest (Visual Inspiration)**
- **Website:** https://www.pinterest.com/
- **Search terms:**
  - "${substrand} activities for ${actualAgeRange}"
  - "${substrand} preschool ideas"
  - "${learningArea} activities early childhood"
- **Best for:** Visual activity ideas, DIY projects, classroom setups
- **Note:** Requires free account; adapt ideas to Kenyan context

**Teachers Pay Teachers (Lesson Materials)**
- **Website:** https://www.teacherspayteachers.com/
- **Search:** "${substrand} activities" or "${substrand} worksheets"
- **Filter:** By grade, by price (many free resources available)
- **Best for:** Printable worksheets, activity templates, lesson plans
- **Note:** International content - adapt to Kenyan context and CBC framework

**Education.com**
- **Website:** https://www.education.com/
- **Search:** "${substrand} activities age ${actualAgeRange.split('-')[0]}"
- **Best for:** Age-appropriate worksheets and learning games
- **Note:** Some free, some require membership

**Twinkl Educational Resources**
- **Website:** https://www.twinkl.com/
- **Search:** "${substrand} early years" or "${substrand} ${grade}"
- **Best for:** High-quality printable materials
- **Note:** Free account gives limited access; premium content available

---

### 📖 STEP 4: KENYAN EDUCATIONAL PUBLISHERS

**Longhorn Publishers Kenya**
- **Website:** https://longhornpublishers.com/
- **What to look for:**
  - Teacher guides for ${grade} ${learningArea}
  - Pupil's books with ${substrand} activities
  - Free downloadable resources section
- **Contact:** Check their website for book catalogs

**Jomo Kenyatta Foundation (JKF)**
- **Website:** https://www.jkf.co.ke/
- **What to look for:**
  - CBC-aligned textbooks and teacher guides
  - Assessment materials
  - Digital learning resources

**Kenya Literature Bureau (KLB)**
- **Website:** https://www.klb.co.ke/
- **What to look for:**
  - Official government-approved textbooks
  - Teacher support materials
  - Curriculum-aligned content

**Oxford University Press Kenya**
- **Website:** https://global.oup.com/
- **What to look for:**
  - International quality resources adapted for Kenya
  - Teacher guides and pupil books
  - Digital resources for modern classrooms

---

### 🌍 STEP 5: INTERNATIONAL TEACHING RESOURCES

**For Teaching Strategies:**
- **Edutopia:** https://www.edutopia.org/ - Research-based teaching methods
- **TeachThought:** https://www.teachthought.com/ - Innovative pedagogy
- **Early Childhood News:** https://www.earlychildhoodnews.com/ - Age-appropriate methods

**For Visual Materials:**
- **Canva for Education:** https://www.canva.com/education/ - Free design tools
- **Unsplash:** https://unsplash.com/ - Free high-quality images
- **Pixabay:** https://pixabay.com/ - Free educational images and videos

**For Interactive Content:**
- **Kahoot!:** https://kahoot.com/ - Create interactive quizzes
- **Quizizz:** https://quizizz.com/ - Gamified assessments
- **Wordwall:** https://wordwall.net/ - Interactive activities and games

---

### 🔎 STEP 6: EFFECTIVE GOOGLE SEARCHING

**Search Terms That Work:**
1. "${substrand} lesson plan ${grade} PDF"
2. "${substrand} teaching guide Kenya"
3. "${substrand} activities ${actualAgeRange} free printable"
4. "site:kicd.ac.ke ${substrand}" (searches only KICD website)
5. "${learningArea} ${substrand} CBC Kenya"

**Advanced Search Tips:**
- Add "PDF" to find downloadable documents
- Add "free" to find no-cost resources
- Add "Kenya" or "CBC" to find locally relevant content
- Use quotes for exact phrases: "${substrand} activities"

---

### 💭 STEP 7: CREATE YOUR OWN RESOURCES

**When official resources are limited:**

✓ **Use CBC SLOs as your guide** - they tell you exactly what to teach
✓ **Adapt local materials** - use what's available in your environment
✓ **Collaborate with colleagues** - share ideas and resources
✓ **Document successful activities** - build your own resource bank
✓ **Join teacher groups** - Facebook groups, WhatsApp groups for Kenyan teachers

**Kenyan Teacher Communities:**
- Search Facebook: "CBC Teachers Kenya"
- Search Facebook: "${grade} teachers Kenya"
- WhatsApp groups (ask your school or TSC office)
- KNUT teacher forums and meetings

---

### ⚠️ IMPORTANT RESOURCE NOTES

**Website Accessibility:**
- Government sites (KICD, KEC) work best from Kenya
- International sites may load slowly - download when possible
- Save PDFs and videos for offline use
- Mobile data consideration - download on WiFi when available

**Content Verification:**
- Always check resources align with CBC framework
- Verify activities match your specific SLOs for ${substrand}
- Ensure content is age-appropriate for ${actualAgeRange}
- Adapt international resources to Kenyan context

**Cultural Adaptation:**
- Replace foreign examples with Kenyan equivalents
- Use locally available materials instead of imported ones
- Consider cultural sensitivity in all content
- Connect learning to Kenyan community and environment

**Copyright & Usage:**
- Respect copyright on paid resources
- Free resources may still have usage terms
- When in doubt, create your own or use official KICD materials
- Give credit when adapting others' ideas

---

## 🌍 KENYAN CONTEXT & APPLICATIONS

**Agriculture**
- [2-3 specific points about how ${substrand} relates to Kenyan agriculture]
- Examples from farming practices students may see in their communities
- Connection to Kenya's agricultural economy

**Industry**
- [2-3 points about industrial/business applications in Kenya]
- Local examples from Kenyan industries or small businesses
- Economic importance and job opportunities

**Community**
- [2-3 points about community practices and daily life]
- How families use these concepts in everyday life
- Cultural connections and traditional practices

**Careers**
- [3-4 career pathways where these skills are valuable]
- Specific jobs in Kenya that require this knowledge
- How learning this helps future opportunities

---

## 🎨 LEARNING ACTIVITIES

**Activity 1: Hands-On Exploration**
- **Learning Objective:** Students will [specific measurable objective linked to SLO]
- **Duration:** ${actualLessonDuration} minutes
- **Group Size:** Groups of 4-5 students
- **Materials Required:**
  - [Specific material 1]
  - [Specific material 2]
  - [Specific material 3]
  - All materials locally available in Kenyan schools

**Procedure:**
1. **Introduction (5 min):** Explain activity objectives and demonstrate
2. **Group Work (${actualLessonDuration - 15} min):** Students work in groups
3. **Sharing (5 min):** Groups present findings or creations
4. **Reflection (5 min):** Class discusses what they learned

**Expected Outcome:**
- Students successfully [observable achievement]
- Evidence of understanding [how you'll know they learned]

**Assessment:**
- Observe group collaboration and participation
- Check understanding through questioning
- Evaluate final product or demonstration

---

## ❓ KEY INQUIRY QUESTIONS
${keyInquiryQuestions.slice(0, 5).map(q => `- ${q}`).join('\n')}

---

## 📊 ASSESSMENT STRATEGIES

**Formative Assessment:**
- **Observation:** Watch students during activities, note participation and understanding
- **Questioning:** Ask targeted questions to check comprehension (see Key Inquiry Questions)
- **Group Discussion:** Listen to peer explanations and collaborative problem-solving
- **Quick Checks:** Short verbal or written responses during lessons

**Summative Assessment:**
- **End-of-Unit Project:** Students create [specific project related to ${substrand}]
- **Practical Demonstration:** Students show mastery by [observable skill]
- **Assessment Criteria:**
  - Understanding of key concepts (40%)
  - Practical application skills (30%)
  - Creativity and effort (20%)
  - Collaboration and values (10%)

---

## 📚 RESOURCES AND MATERIALS

**Suggested Learning Resources (From CBC):**
${resources.slice(0, 5).map(r => `- ${r}`).join('\n')}

**Additional Resources:**
- Materials available in local environment
- Recycled or reused household items
- Community resources (with permission)
- School library books on ${learningArea}

---

## 🎓 CBC FRAMEWORK INTEGRATION

**Core Competencies Developed:**
${coreCompetencies.slice(0, 3).map(comp => `- **${comp}:** Developed through collaborative activities and hands-on learning`).join('\n')}

**Values Emphasized:**
${values.slice(0, 3).map(val => `- **${val}:** Practiced throughout lessons and group activities`).join('\n')}

**PCIs (Pertinent & Contemporary Issues):**
${pertinentIssues.slice(0, 3).map(pci => `- **${pci}:** Integrated through use of local materials and sustainable practices`).join('\n')}

---

## 📝 SUMMARY
Write 4-5 CONCISE BULLET POINTS summarizing:
- Main concepts students learned
- Key skills developed
- Practical applications in Kenyan context
- Connection to CBC competencies
- How this prepares students for future learning

---

*These lesson notes align with the Kenyan Competency Based Curriculum (CBC) Framework*
*Based on KICD Curriculum Designs - ${grade}*
*Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
*Sub-strand Duration: ${actualWeeks} weeks | ${actualLessonDuration} minutes per lesson*

---

**Remember:** The best teaching comes from combining official CBC guidelines with your creativity and local resources. Use these references as starting points, not rigid instructions.`;
  }

  getSystemMessage() {
    return `You are an expert Kenyan CBC curriculum specialist creating Lesson Notes for teachers.

CRITICAL REQUIREMENTS:
1. WRITE ONLY IN POINT FORM - NO paragraphs
2. Each point must be under 25 words
3. Provide HONEST, ACCESSIBLE web resources with clear search strategies
4. Use REAL URLs that definitely exist, with honest guidance about what's there
5. All duration and age range info must be ACCURATE from curriculum config
6. Focus on SEARCH STRATEGIES rather than fake navigation paths

WEB RESOURCES - HONEST APPROACH:
1. Official Kenyan sources first (KICD, KEC, Elimika) - real URLs only
2. YouTube search terms that will actually return relevant videos
3. International platforms (Pinterest, TPT, Education.com) with search strategies
4. Kenyan publishers with real catalog information
5. Practical Google search terms teachers can copy-paste
6. Teacher community suggestions (Facebook groups, WhatsApp)

NEVER invent detailed navigation paths or claim specific pages exist. Instead:
✓ Provide base URLs that are verified
✓ Suggest effective search terms
✓ Give filtering/browsing strategies
✓ Be honest about what requires searching
✓ Include notes about registration, costs, accessibility

FORMATTING RULES:
- Use bullet points (-, •, ✓) for lists
- Use numbered lists (1, 2, 3) for procedures
- Keep sentences short and direct
- Provide URL + "What's there" + "How to search"
- Include practical tips for finding content

CONTENT QUALITY:
- Age-appropriate language for the specified grade
- Culturally relevant Kenyan examples
- Practical, immediately usable by teachers
- Aligned with CBC framework
- Honest about resource limitations

Generate professional, comprehensive lesson notes with ACCURATE curriculum information and HONEST, practical resource finding strategies.`;
  }
  
  
  async generate(requestData, cbcEntry) {
    
    const originalConcepts = requestData.learningConcepts || [];
    if (originalConcepts.length > 20) {
      console.log(`[Lesson Notes] Limiting concepts from ${originalConcepts.length} to 20`);
      requestData.learningConcepts = originalConcepts.slice(0, 20);
    }
    
    return await super.generate(requestData, cbcEntry);
  }
}

module.exports = LessonNotesGenerator;