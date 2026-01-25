const mongoose = require('mongoose');
const path = require('path');


require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const LevelConfig = require('../models/LevelConfig');
const SubjectConfig = require('../models/SubjectConfig');


console.log('🔍 Checking environment...');
console.log('📍 Current directory:', __dirname);
console.log('📍 .env path:', path.join(__dirname, '..', '..', '.env'));
console.log('📍 MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file!');
  console.error('💡 Make sure .env file exists in project root with MONGO_URI=your_connection_string');
  process.exit(1);
}

const levelConfigs = [
  {
    level: 'PreSchool',
    lessonDuration: 30,
    grades: ['PP 1', 'PP 2'],
    ageRange: '4-5 years',
    description: '30-minute lessons for pre-primary learners'
  },
  {
    level: 'Lower Primary',
    lessonDuration: 35,
    grades: ['Grade 1', 'Grade 2', 'Grade 3'],
    ageRange: '6-8 years',
    description: '35-minute lessons for lower primary learners'
  },
  {
    level: 'Upper Primary',
    lessonDuration: 35,
    grades: ['Grade 4', 'Grade 5', 'Grade 6'],
    ageRange: '9-11 years',
    description: '35-minute lessons for upper primary learners'
  },
  {
    level: 'Junior School',
    lessonDuration: 40,
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
    ageRange: '12-14 years',
    description: '40-minute lessons for junior school learners'
  },
  {
    level: 'Senior School',
    lessonDuration: 40,
    grades: ['Grade 10', 'Grade 11', 'Grade 12'],
    ageRange: '15-17 years',
    description: '40-minute lessons for senior school learners'
  },
  {
    level: 'Special Needs - Foundation',
    lessonDuration: 40,
    grades: ['Foundation Level'],
    ageRange: 'Varies',
    description: '40-minute lessons for foundation level special needs'
  },
  {
    level: 'Special Needs - Intermediate',
    lessonDuration: 40,
    grades: ['Intermediate Level'],
    ageRange: 'Varies',
    description: '40-minute lessons for intermediate level special needs'
  },
  {
    level: 'Special Needs - Pre-vocational',
    lessonDuration: 40,
    grades: ['Pre-vocational Level'],
    ageRange: 'Varies',
    description: '40-minute lessons for pre-vocational level special needs'
  }
];

const subjectConfigs = [
  
  { subject: 'PPI', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 1 },
  { subject: 'Psychomotor and Creative Arts', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 6 },
  { subject: 'CRE', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 3 },
{ subject: 'IRE', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 3 },
{ subject: 'HRE', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 3 },
  { subject: 'Environmental Activities', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 5 },
  { subject: 'Language Activities', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 5 },
  { subject: 'Mathematical Activities', level: 'PreSchool', grades: ['PP 1', 'PP 2'], lessonsPerWeek: 5 },

  
  { subject: 'PPI', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 1 },
  { subject: 'Indigenous', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 2 },
  { subject: 'Creative Arts', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 7 },
  { subject: 'CRE', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 3 },
  { subject: 'Environmental & Hygiene', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 4 },
  { subject: 'Kiswahili', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 4 },
  { subject: 'English', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 5 },
  { subject: 'Mathematics', level: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'], lessonsPerWeek: 5 },

  
  { subject: 'PPI', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 1 },
  { subject: 'Creative Arts', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 6 },
  { subject: 'CRE', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 3 },
  { subject: 'Agriculture', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 4 },
  { subject: 'Social Studies', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 3 },
  { subject: 'Science & Technology', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 4 },
  { subject: 'Kiswahili', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 4 },
  { subject: 'English', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 5 },
  { subject: 'Mathematics', level: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'], lessonsPerWeek: 5 },

  
  { subject: 'PPI', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 1 },
  { subject: 'Pre-technical', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 4 },
  { subject: 'Creative Arts & Sports', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 5 },
  { subject: 'CRE', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 4 },
  { subject: 'Agriculture', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 4 },
  { subject: 'Social Studies', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 4 },
  { subject: 'Integrated Science', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 5 },
  { subject: 'Kiswahili', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 4 },
  { subject: 'English', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 5 },
  { subject: 'Mathematics', level: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'], lessonsPerWeek: 5 },

  
  { subject: 'Communication and Social Skills', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 4 },
  { subject: 'Activities of Daily Living Skills', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 4 },
  { subject: 'Religious Education', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 2 },
  { subject: 'Sensory Perception', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 1 },
  { subject: 'Psychomotor Activities', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 2 },
  { subject: 'Creative Activities', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 1 },
  { subject: 'Music and Movement', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 1 },
  { subject: 'Orientation and Mobility', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 2 },
  { subject: 'Pre-numeracy Activities', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 2 },
  { subject: 'PPI', level: 'Special Needs - Foundation', grades: ['Foundation Level'], lessonsPerWeek: 1 },

  
  { subject: 'Communication and Social Skills', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 5 },
  { subject: 'Daily Living Skills', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 4 },
  { subject: 'Religious Education', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 2 },
  { subject: 'Sensory Motor Integration', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 4 },
  { subject: 'Numeracy Activities', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 3 },
  { subject: 'Art & Craft', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 4 },
  { subject: 'Music', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 2 },
  { subject: 'Movement Activities', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 5 },
  { subject: 'PPI', level: 'Special Needs - Intermediate', grades: ['Intermediate Level'], lessonsPerWeek: 1 },

  
  { subject: 'Prevocational Skills', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 18 },
  { subject: 'Communication and Functional Literacy Skills', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 4 },
  { subject: 'Daily Living Skills and Nutrition', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 4 },
  { subject: 'Physical Education', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 5 },
  { subject: 'Religious Education (CRE/IRE/HRE)', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 2 },
  { subject: 'Music and Movement', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 2 },
  { subject: 'Social Studies', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 4 },
  { subject: 'PPI', level: 'Special Needs - Pre-vocational', grades: ['Pre-vocational Level'], lessonsPerWeek: 1 },
];

async function seedCurriculumData() {
  try {
    console.log('📍 Starting seeder...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    
    const deletedLevels = await LevelConfig.deleteMany({});
    const deletedSubjects = await SubjectConfig.deleteMany({});
    console.log(`🗑️  Deleted ${deletedLevels.deletedCount} level configs`);
    console.log(`🗑️  Deleted ${deletedSubjects.deletedCount} subject configs`);

    
    const insertedLevels = await LevelConfig.insertMany(levelConfigs);
    console.log(`✅ Inserted ${insertedLevels.length} level configurations`);

    
    const insertedSubjects = await SubjectConfig.insertMany(subjectConfigs);
    console.log(`✅ Inserted ${insertedSubjects.length} subject configurations`);

    console.log('🎉 Curriculum data seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Level Configs: ${insertedLevels.length}`);
    console.log(`   - Subject Configs: ${insertedSubjects.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check if .env file exists in project root');
    console.error('   2. Verify MONGO_URI is set correctly in .env');
    console.error('   3. Ensure MongoDB is running (if local)');
    console.error('   4. Check network connection (if cloud MongoDB)');
    process.exit(1);
  }
}

seedCurriculumData();