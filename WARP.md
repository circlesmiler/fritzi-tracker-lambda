# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Test function locally with environment variables
export $(cat .env | xargs) && node -e "const { getFritziInfo } = require('./index.js'); getFritziInfo().then(console.log).catch(console.error)"
```

### Serverless Framework
```bash
# Start local development server
serverless offline

# Deploy to AWS (using .env file)
export $(cat .env | xargs) && serverless deploy

# Deploy with explicit parameters
serverless deploy \
  --param="TRACTIVE_EMAIL=your-email@example.com" \
  --param="TRACTIVE_PASSWORD=your-password" \
  --param="HOME_LATITUDE=your-latitude" \
  --param="HOME_LONGITUDE=your-longitude" \
  --param="TRACKER_ID=your-tracker-id"

# Remove deployment
serverless remove
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npx jest __tests__/index.test.js
npx jest __tests__/tractive.test.js

# Run tests in watch mode
npx jest --watch
```

## Architecture

### Core Components
- **index.js**: Main Lambda handler that processes HTTP API Gateway requests and returns pet location status
- **tractive.js**: Tractive API client module handling authentication and tracker data retrieval
- **serverless.yml**: Serverless Framework configuration for AWS Lambda deployment

### Data Flow
1. HTTP API Gateway triggers Lambda function
2. Lambda authenticates with Tractive API using email/password credentials
3. Retrieves tracker location data for specified TRACKER_ID
4. Calculates distance from home coordinates using haversine formula
5. Returns JSON response with distance, home status (within 30m radius), and coordinates

### Key Constants
- **RADIUS**: 30 meters (hardcoded in index.js) - defines "home" perimeter
- **TRACTIVE_CLIENT**: "6536c228870a3c8857d452e8" - API client identifier
- **TRAC_API_BASE**: "https://graph.tractive.com/4" - Base API URL

### Environment Variables
Required for all operations:
- `TRACTIVE_EMAIL`: Tractive account email
- `TRACTIVE_PASSWORD`: Tractive account password  
- `HOME_LATITUDE`: Home latitude coordinate
- `HOME_LONGITUDE`: Home longitude coordinate
- `TRACKER_ID`: Specific tracker device ID

### API Response Format
```json
{
  "distance": 123.45,
  "isHome": true,
  "latlong": [53.123, 11.456]
}
```

### Tractive API Integration
The tractive.js module provides:
- `connect(email, password)`: Authenticates and stores access token
- `getAllTrackers()`: Returns array of available trackers for account
- `getTrackerLocation(trackerID)`: Gets current position with address lookup
- `getTrackerHistory(trackerID, from, to)`: Historical position data
- `getTrackerHardware(trackerID)`: Hardware status (battery, etc.)

### Security Considerations
- Never commit .env files - use .env.example as template
- Consider AWS Secrets Manager or Parameter Store for production credentials
- API endpoint is public by default - add authentication if needed

### Testing Strategy
- Unit tests mock the tractive module to avoid real API calls
- Tests cover authentication failures, invalid location data, and distance calculations
- Babel/Jest configuration supports ES6+ syntax transformation
