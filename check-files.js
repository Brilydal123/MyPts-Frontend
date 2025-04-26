const fs = require('fs');
const path = require('path');

// List of critical files to check
const filesToCheck = [
  'src/lib/api/mypts-api.ts',
  'src/components/ui/card.tsx',
  'src/components/ui/button.tsx',
  'src/lib/utils.ts',
  'src/app/globals.css',
  'tailwind.config.js',
  'postcss.config.mjs',
  'next.config.ts'
];

// Check if files exist
console.log('Checking for required files...');
let allFilesExist = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ All required files exist!');
} else {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}
