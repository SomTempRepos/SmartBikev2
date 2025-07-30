const path = require('path');
const fs = require('fs-extra');

// Get environment config
const env = require('./environment');

// Directory and file paths with fallback defaults
const DATA_DIR = env.DATA_DIR || path.join(__dirname, '../../data');
const DAILY_DIR = env.DAILY_DIR || path.join(DATA_DIR, 'daily');

const filePaths = {
  // Directories
  DATA_DIR,
  DAILY_DIR,
  
  // Data files
  USERS_FILE: env.USERS_FILE || path.join(DATA_DIR, 'users.json'),
  RANKS_FILE: env.RANKS_FILE || path.join(DATA_DIR, 'ranks.json'),
  GUARDIANS_FILE: env.GUARDIANS_FILE || path.join(DATA_DIR, 'guardians.json'),
  BIKES_FILE: env.BIKES_FILE || path.join(DATA_DIR, 'bikes.json')
};

// Ensure directories exist
const initializeDirectories = async () => {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(DAILY_DIR);
    
    console.log(`📁 Data directories initialized:`);
    console.log(`   Data: ${DATA_DIR}`);
    console.log(`   Daily: ${DAILY_DIR}`);
  } catch (error) {
    console.error('❌ Error initializing directories:', error.message);
    throw error;
  }
};

// Initialize empty data files if they don't exist
const initializeDataFiles = async () => {
  const defaultData = {
    [filePaths.USERS_FILE]: [],
    [filePaths.RANKS_FILE]: [],
    [filePaths.GUARDIANS_FILE]: [],
    [filePaths.BIKES_FILE]: []
  };

  try {
    for (const [filePath, defaultContent] of Object.entries(defaultData)) {
      if (!(await fs.pathExists(filePath))) {
        await fs.writeJson(filePath, defaultContent, { spaces: 2 });
        console.log(`📄 Initialized: ${path.basename(filePath)}`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing data files:', error.message);
    throw error;
  }
};

// Initialize both directories and files
const initializeDatabase = async () => {
  await initializeDirectories();
  await initializeDataFiles();
  console.log('✅ Database initialization complete');
};

module.exports = {
  ...filePaths,
  initializeDatabase,
  initializeDirectories,
  initializeDataFiles
};