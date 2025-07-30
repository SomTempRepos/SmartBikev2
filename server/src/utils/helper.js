const moment = require('moment');
const { VALIDATION } = require('./constants');

class Helpers {
  // Date and Time utilities
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }

  static formatDate(date, format = 'YYYY-MM-DD') {
    return moment(date).format(format);
  }

  static getTodayString() {
    return moment().format('YYYY-MM-DD');
  }

  static isValidDate(dateString) {
    return moment(dateString, 'YYYY-MM-DD', true).isValid();
  }

  // Validation utilities
  static isValidEmail(email) {
    return VALIDATION.EMAIL_REGEX.test(email);
  }

  static isValidMobile(mobile) {
    return VALIDATION.MOBILE_REGEX.test(mobile);
  }

  static isValidPassword(password) {
    return password && password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
  }

  static isValidName(name) {
    return name && 
           name.length >= VALIDATION.NAME_MIN_LENGTH && 
           name.length <= VALIDATION.NAME_MAX_LENGTH;
  }

  static isValidBikeId(bikeId) {
    return VALIDATION.BIKE_ID_REGEX.test(bikeId);
  }

  // Data manipulation utilities
  static sanitizeString(str) {
    if (!str) return '';
    return str.toString().trim();
  }

  static generateId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${random}`;
  }

  static generateBikeId(sequence) {
    return `BIKE${String(sequence).padStart(3, '0')}`;
  }

  static generateWardId(sequence) {
    return `W${String(sequence).padStart(3, '0')}`;
  }

  static generateGuardianId(sequence) {
    return `G${String(sequence).padStart(3, '0')}`;
  }

  // Object utilities
  static cleanObject(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  static pickFields(obj, fields) {
    const picked = {};
    fields.forEach(field => {
      if (obj.hasOwnProperty(field)) {
        picked[field] = obj[field];
      }
    });
    return picked;
  }

  static excludeFields(obj, fields) {
    const result = { ...obj };
    fields.forEach(field => {
      delete result[field];
    });
    return result;
  }

  // Array utilities
  static removeDuplicates(array, key) {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  static sortByField(array, field, ascending = true) {
    return array.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      if (ascending) {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Location utilities
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  static isValidCoordinate(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  // Response utilities
  static createResponse(success, data = null, message = '', error = null) {
    return {
      success,
      data,
      message,
      error,
      timestamp: this.getCurrentTimestamp()
    };
  }

  static createSuccessResponse(data, message = '') {
    return this.createResponse(true, data, message);
  }

  static createErrorResponse(error, message = '') {
    return this.createResponse(false, null, message, error);
  }

  // Pagination utilities
  static paginate(array, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const paginatedData = array.slice(offset, offset + limit);
    
    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(array.length / limit),
        totalItems: array.length,
        itemsPerPage: limit,
        hasNextPage: offset + limit < array.length,
        hasPrevPage: page > 1
      }
    };
  }

  // Async utilities
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await this.sleep(delay * attempt);
      }
    }
  }
}

module.exports = Helpers;