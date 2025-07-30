const fs = require('fs-extra');
const path = require('path');
const { logger } = require('./logger');

class FileManager {
  // Read JSON file with error handling
  static async readJson(filePath) {
    try {
      if (!(await fs.pathExists(filePath))) {
        logger.warn(`File not found: ${filePath}. Returning empty array.`);
        return [];
      }
      
      const data = await fs.readJson(filePath);
      logger.debug(`Successfully read file: ${path.basename(filePath)}`);
      return data;
    } catch (error) {
      logger.error(`Error reading JSON file ${filePath}: ${error.message}`);
      throw new Error(`Failed to read file: ${path.basename(filePath)}`);
    }
  }

  // Write JSON file with error handling
  static async writeJson(filePath, data, options = { spaces: 2 }) {
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      await fs.writeJson(filePath, data, options);
      logger.debug(`Successfully wrote file: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      logger.error(`Error writing JSON file ${filePath}: ${error.message}`);
      throw new Error(`Failed to write file: ${path.basename(filePath)}`);
    }
  }

  // Check if file exists
  static async exists(filePath) {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      logger.error(`Error checking file existence ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Read directory contents
  static async readDir(dirPath) {
    try {
      if (!(await fs.pathExists(dirPath))) {
        logger.warn(`Directory not found: ${dirPath}. Returning empty array.`);
        return [];
      }
      
      const files = await fs.readdir(dirPath);
      logger.debug(`Successfully read directory: ${dirPath} (${files.length} files)`);
      return files;
    } catch (error) {
      logger.error(`Error reading directory ${dirPath}: ${error.message}`);
      throw new Error(`Failed to read directory: ${dirPath}`);
    }
  }

  // Append to daily log file (specific for bike data)
  static async appendToDailyLog(date, data) {
    try {
      const { DAILY_DIR } = require('../config/database');
      const dailyFile = path.join(DAILY_DIR, `${date}.json`);
      
      let dailyData = [];
      if (await this.exists(dailyFile)) {
        dailyData = await this.readJson(dailyFile);
      }
      
      dailyData.push(data);
      await this.writeJson(dailyFile, dailyData);
      
      logger.info(`Appended data to daily log: ${date}`);
      return true;
    } catch (error) {
      logger.error(`Error appending to daily log: ${error.message}`);
      throw error;
    }
  }

  // Get daily log for specific date
  static async getDailyLog(date) {
    try {
      const { DAILY_DIR } = require('../config/database');
      const dailyFile = path.join(DAILY_DIR, `${date}.json`);
      
      if (!(await this.exists(dailyFile))) {
        return null;
      }
      
      return await this.readJson(dailyFile);
    } catch (error) {
      logger.error(`Error reading daily log for ${date}: ${error.message}`);
      throw error;
    }
  }

  // Get available daily log dates
  static async getAvailableDates() {
    try {
      const { DAILY_DIR } = require('../config/database');
      const files = await this.readDir(DAILY_DIR);
      
      const dates = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .sort();
      
      return dates;
    } catch (error) {
      logger.error(`Error getting available dates: ${error.message}`);
      throw error;
    }
  }

  // Backup file (create .backup copy)
  static async backup(filePath) {
    try {
      if (!(await this.exists(filePath))) {
        logger.warn(`Cannot backup non-existent file: ${filePath}`);
        return false;
      }
      
      const backupPath = `${filePath}.backup`;
      await fs.copy(filePath, backupPath);
      
      logger.info(`Created backup: ${path.basename(backupPath)}`);
      return true;
    } catch (error) {
      logger.error(`Error creating backup for ${filePath}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FileManager;