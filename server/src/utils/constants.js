// src/utils/constants.js

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// User Roles
const USER_ROLES = {
  GUARDIAN: 'guardian',
  ADMIN: 'admin'
};

// Bike Status
const BIKE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
};

// Geofence Status
const GEOFENCE_STATUS = {
  NO_GEOFENCE: 'NO_GEOFENCE',
  WITHIN_BOUNDS: 'WITHIN_BOUNDS',
  OUTSIDE_BOUNDS: 'OUTSIDE_BOUNDS'
};

// Alert Types
const ALERT_TYPES = {
  FENCE_BREACH: 'fence_breach',
  LOW_BATTERY: 'low_battery',
  HIGH_SPEED: 'high_speed',
  CONNECTION_LOST: 'connection_lost'
};

// Socket Events (Enhanced with additional events for comprehensive functionality)
const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  
  // Bike tracking events (from your existing code)
  BIKE_DATA: 'bikeData',
  BIKE_UPDATE: 'bikeUpdate',
  
  // Geofencing events (from your existing + enhanced)
  GEOFENCE_ALERT: 'geofenceAlert',
  GEOFENCE_STATS: 'geofenceStats',
  
  // Additional socket events for enhanced functionality
  REQUEST_GEOFENCE_STATUS: 'requestGeofenceStatus',
  UPDATE_GEOFENCE: 'updateGeoFence',
  GEOFENCE_CONFIG_UPDATED: 'geoFenceConfigUpdated',
  INITIAL_BIKE_DATA: 'initialBikeData',
  GET_BIKES_FOR_SESSION: 'getBikesForSession',
  SESSION_BIKES: 'sessionBikes',
  
  // System events
  SYSTEM_MESSAGE: 'systemMessage',
  ERROR: 'error',
  
  // Health check events
  PING: 'ping',
  PONG: 'pong'
};

// Default Values
const DEFAULTS = {
  // JWT Token Expiry
  JWT_EXPIRY: '1h',
  
  // Pagination
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Geofence
  DEFAULT_GEOFENCE_RADIUS: 100, // meters
  MAX_GEOFENCE_RADIUS: 5000,     // 5km
  
  // Bike Data
  LOW_BATTERY_THRESHOLD: 20,      // 20%
  HIGH_SPEED_THRESHOLD: 25,       // 25 km/h
  
  // File Settings
  MAX_DAILY_LOG_SIZE: 10000,      // Maximum entries per daily log
  BACKUP_RETENTION_DAYS: 30,
  
  // Socket specific defaults
  SOCKET_TIMEOUT: 30000,          // 30 seconds
  MAX_CONNECTIONS_PER_IP: 10,
  RECONNECTION_ATTEMPTS: 3
};

// Validation Rules
const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MOBILE_REGEX: /^[0-9]{10}$/,
  BIKE_ID_REGEX: /^[A-Z0-9]{3,10}$/
};

// Error Messages (Enhanced with socket-specific errors)
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  TOKEN_EXPIRED: 'Token expired',
  
  // Validation
  REQUIRED_FIELDS: 'All required fields must be provided',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_MOBILE: 'Invalid mobile number format',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  BIKE_NOT_FOUND: 'Bike not found',
  GUARDIAN_NOT_FOUND: 'Guardian not found',
  GEOFENCE_NOT_FOUND: 'Geofence not found',
  
  // Conflicts
  EMAIL_EXISTS: 'Email already registered',
  BIKE_EXISTS: 'Bike ID already exists',
  
  // Server
  SERVER_ERROR: 'Internal server error',
  FILE_OPERATION_ERROR: 'File operation failed',
  DATABASE_ERROR: 'Database operation failed',
  
  // Socket specific errors
  SOCKET_CONNECTION_ERROR: 'Socket connection failed',
  GEO_FENCE_CONFIG_ERROR: 'Geofence configuration error',
  STATS_ERROR: 'Failed to retrieve statistics',
  SESSION_BIKES_ERROR: 'Failed to retrieve bikes for session',
  INITIAL_DATA_ERROR: 'Failed to load initial data',
  CONNECTION_TIMEOUT: 'Connection timeout'
};

// Success Messages
const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  LOGIN_SUCCESS: 'Login successful',
  DATA_UPDATED: 'Data updated successfully',
  GEOFENCE_SET: 'Geofence set successfully',
  GEOFENCE_DISABLED: 'Geofence disabled successfully',
  WARD_ADDED: 'Ward added successfully',
  
  // Socket specific success messages
  SOCKET_CONNECTED: 'Socket connected successfully',
  GEOFENCE_CONFIG_UPDATED: 'Geofence configuration updated successfully',
  REAL_TIME_DATA_ENABLED: 'Real-time data updates enabled'
};

// Error Types for Socket Events
const ERROR_TYPES = {
  GEO_FENCE_CONFIG_ERROR: 'geo_fence_config_error',
  STATS_ERROR: 'stats_error',
  SESSION_BIKES_ERROR: 'session_bikes_error',
  INITIAL_DATA_ERROR: 'initial_data_error',
  CONNECTION_ERROR: 'connection_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  VALIDATION_ERROR: 'validation_error'
};

// Message Types for System Messages
const MESSAGE_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  BIKE_STATUS,
  GEOFENCE_STATUS,
  ALERT_TYPES,
  SOCKET_EVENTS,
  DEFAULTS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_TYPES,
  MESSAGE_TYPES
};