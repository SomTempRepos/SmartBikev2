smart-cycle-server/
├── src/
│   ├── controllers/
│   │   ├── authController.js          # HTTP handlers for login, signup, user profile
│   │   ├── bikeController.js          # HTTP handlers for bike data, bike CRUD
│   │   ├── guardianController.js      # HTTP handlers for guardian profile management
│   │   ├── wardController.js          # HTTP handlers for ward management
│   │   ├── geofenceController.js      # HTTP handlers for geofence CRUD operations
│   │   └── historyController.js       # HTTP handlers for historical data retrieval
│   │
│   ├── routes/
│   │   ├── index.js                   # Main router combining all routes
│   │   ├── authRoutes.js              # Routes: /api/login, /api/signup, /api/me
│   │   ├── bikeRoutes.js              # Routes: /api/bikes/*, /api/bike/data
│   │   ├── guardianRoutes.js          # Routes: /api/guardian/*
│   │   ├── wardRoutes.js              # Routes: /api/guardian/wards/*
│   │   ├── geofenceRoutes.js          # Routes: /api/geofence/*
│   │   └── historyRoutes.js           # Routes: /api/history/*
│   │
│   ├── services/
│   │   ├── authService.js             # JWT creation, password hashing, user validation
│   │   ├── bikeService.js             # Bike data processing, file operations, real-time updates
│   │   ├── guardianService.js         # Guardian/ward business logic, data relationships
│   │   ├── geofencingService.js       # Your existing geofencing service (moved here)
│   │   └── socketService.js           # WebSocket connection management, real-time broadcasting
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT authentication middleware (authenticateJWT)
│   │   ├── cors.js                    # CORS configuration and setup
│   │   ├── errorHandler.js            # Global error handling middleware
│   │   └── requestLogger.js           # HTTP request logging middleware
│   │
│   ├── utils/
│   │   ├── fileManager.js             # JSON file read/write operations with error handling
│   │   ├── constants.js               # Application constants (file paths, default values)
│   │   ├── helpers.js                 # Common utility functions (date formatting, etc.)
│   │   └── logger.js                  # Winston logger configuration (error level)
│   │
│   ├── config/
│   │   ├── environment.js             # Environment variables handling and validation
│   │   ├── database.js                # Data file paths and JSON file configurations
│   │   └── socket.js                  # Socket.IO configuration and setup
│   │
│   └── app.js                         # Express app setup, middleware registration, route mounting
│
├── data/                              # Keep existing structure
│   ├── users.json
│   ├── bikes.json
│   ├── guardians.json
│   ├── ranks.json
│   └── daily/
│       └── (existing daily files)
│
├── tests/
│   ├── setup.js                       # Jest test configuration and global setup
│   ├── helpers/
│   │   └── testUtils.js               # Test helper functions, mock data creators
│   ├── controllers/
│   │   ├── authController.test.js     # Tests for auth endpoints
│   │   ├── bikeController.test.js     # Tests for bike endpoints
│   │   └── (other controller tests)
│   ├── services/
│   │   ├── authService.test.js        # Tests for auth business logic
│   │   ├── bikeService.test.js        # Tests for bike business logic
│   │   └── (other service tests)
│   └── integration/
│       └── api.test.js                # End-to-end API tests
│
├── docs/
│   ├── API.md                         # API documentation with examples
│   ├── MIGRATION.md                   # Documentation of migration process
│   └── SETUP.md                       # Setup and installation guide
│
├── scripts/
│   ├── setup.js                       # Initial setup script for data files
│   └── test-data.js                   # Script to generate test data
│
├── server.js                          # Entry point - imports app.js and starts server
├── package.json                       # Updated with new dependencies
├── .env                               # Your existing environment file
├── .env.example                       # Template for environment variables
├── .gitignore                         # Updated with test coverage, logs
├── jest.config.js                     # Jest configuration
└── README.md                          # Updated project documentation