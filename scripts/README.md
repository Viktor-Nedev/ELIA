# Quiz Upload Utility

This directory contains scripts for managing quiz data in Firebase Firestore.

## Upload Quizzes Script

The `upload-quizzes.js` script allows you to bulk upload quiz questions from a JSON file to your Firebase Firestore database.

### Prerequisites

1. **Firebase Admin SDK Setup**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Project Settings** > **Service Accounts**
   - Click **Generate New Private Key**
   - Save the downloaded file as `serviceAccountKey.json` in your project root (`f:\ELIA\elia\`)

2. **Install Dependencies**
   ```bash
   npm install firebase-admin
   ```

### Usage

```bash
node scripts/upload-quizzes.js <path-to-json-file>
```

**Example:**
```bash
node scripts/upload-quizzes.js scripts/quizzes-sample.json
```

Or use the npm script:
```bash
npm run upload-quizzes scripts/quizzes-sample.json
```

### Quiz JSON Format

Your JSON file should contain an array of quiz objects with the following structure:

```json
[
  {
    "question": "Your question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 2,
    "difficulty": "medium",
    "explanation": "Explanation of the correct answer",
    "category": "Category Name"
  }
]
```

**Required Fields:**
- `question` (string): The quiz question
- `options` (array): Array of answer options (minimum 2)
- `correctAnswerIndex` (number): Index of the correct answer (0-based)
- `difficulty` (string): Must be "easy", "medium", or "hard"
- `explanation` (string): Explanation shown after answering
- `category` (string): Category for the question (e.g., "Water", "Climate", "Energy")

### Example Quiz Data

See `quizzes-sample.json` for a complete example with 5 sample quizzes.

### Validation

The script automatically validates:
- All required fields are present
- Options array has at least 2 items
- correctAnswerIndex is valid for the options array
- Difficulty is one of: easy, medium, hard
- All string fields are non-empty

If validation fails, the script will show detailed error messages and exit without uploading.

### Troubleshooting

**Error: serviceAccountKey.json not found**
- Download your service account key from Firebase Console as described in Prerequisites

**Error: File not found**
- Check that the path to your JSON file is correct
- Use relative or absolute paths

**Validation errors**
- Review the error messages to see which fields are missing or invalid
- Compare your JSON structure with the example in `quizzes-sample.json`

**Permission errors**
- Ensure your service account has Firestore write permissions
- Check that you're using the correct Firebase project

### Security Note

⚠️ **Never commit `serviceAccountKey.json` to version control!**

The `.gitignore` file should include:
```
serviceAccountKey.json
```
