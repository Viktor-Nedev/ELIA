#!/usr/bin/env node

/**
 * Quiz Upload Utility
 * 
 * Uploads quiz data from a JSON file to Firebase Firestore.
 * Uses Firebase Admin SDK to bypass security rules.
 * 
 * Usage: node scripts/upload-quizzes.js [path-to-json-file]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your service account key from Firebase Console:');
  console.error('1. Go to Project Settings > Service Accounts');
  console.error('2. Click "Generate New Private Key"');
  console.error('3. Save as serviceAccountKey.json in the project root');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Validate quiz data structure
 */
function validateQuiz(quiz, index) {
  const errors = [];

  if (!quiz.question || typeof quiz.question !== 'string') {
    errors.push(`Quiz ${index}: Missing or invalid 'question' field`);
  }

  if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
    errors.push(`Quiz ${index}: 'options' must be an array with at least 2 items`);
  }

  if (typeof quiz.correctAnswerIndex !== 'number' ||
    quiz.correctAnswerIndex < 0 ||
    quiz.correctAnswerIndex >= (quiz.options?.length || 0)) {
    errors.push(`Quiz ${index}: Invalid 'correctAnswerIndex'`);
  }

  if (!['easy', 'medium', 'hard'].includes(quiz.difficulty)) {
    errors.push(`Quiz ${index}: 'difficulty' must be 'easy', 'medium', or 'hard'`);
  }

  if (!quiz.explanation || typeof quiz.explanation !== 'string') {
    errors.push(`Quiz ${index}: Missing or invalid 'explanation' field`);
  }

  if (!quiz.category || typeof quiz.category !== 'string') {
    errors.push(`Quiz ${index}: Missing or invalid 'category' field`);
  }

  return errors;
}

/**
 * Upload quizzes to Firestore
 */
async function uploadQuizzes(quizzes) {
  console.log(`\n📤 Uploading ${quizzes.length} quizzes to Firestore...\n`);

  const batch = db.batch();
  let uploadCount = 0;

  for (const quiz of quizzes) {
    const quizRef = db.collection('quizzes').doc();
    batch.set(quizRef, {
      question: quiz.question,
      options: quiz.options,
      correctAnswerIndex: quiz.correctAnswerIndex,
      difficulty: quiz.difficulty,
      explanation: quiz.explanation,
      category: quiz.category
    });
    uploadCount++;
    console.log(`✓ Prepared quiz ${uploadCount}: "${quiz.question.substring(0, 50)}..."`);
  }

  await batch.commit();
  console.log(`\n✅ Successfully uploaded ${uploadCount} quizzes!\n`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: No JSON file specified');
    console.error('\nUsage: node scripts/upload-quizzes.js <path-to-json-file>');
    console.error('Example: node scripts/upload-quizzes.js scripts/quizzes-sample.json\n');
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  // Check if file exists
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: File not found: ${jsonFilePath}\n`);
    process.exit(1);
  }

  // Read and parse JSON
  let quizData;
  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    quizData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error parsing JSON file: ${error.message}\n`);
    process.exit(1);
  }

  // Ensure data is an array
  const quizzes = Array.isArray(quizData) ? quizData : [quizData];

  if (quizzes.length === 0) {
    console.error('❌ Error: No quizzes found in JSON file\n');
    process.exit(1);
  }

  console.log(`\n📋 Found ${quizzes.length} quiz(zes) in file`);

  // Validate all quizzes
  const allErrors = [];
  quizzes.forEach((quiz, index) => {
    const errors = validateQuiz(quiz, index + 1);
    allErrors.push(...errors);
  });

  if (allErrors.length > 0) {
    console.error('\n❌ Validation errors found:\n');
    allErrors.forEach(error => console.error(`  • ${error}`));
    console.error('');
    process.exit(1);
  }

  console.log('✓ All quizzes validated successfully');

  // Upload to Firestore
  try {
    await uploadQuizzes(quizzes);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error uploading quizzes: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`\n❌ Unexpected error: ${error.message}\n`);
  process.exit(1);
});
