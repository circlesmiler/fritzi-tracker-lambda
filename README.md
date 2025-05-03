# Tractive API Lambda Function

This Lambda function queries the Tractive API to get location information for a pet tracker device and determines if the pet is within a specified radius of home.

## Prerequisites

- Node.js installed
- AWS account with configured credentials
- Serverless Framework (`npm install -g serverless` or `brew install serverless`)
- Tractive account with a pet tracker device

## Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| TRACTIVE_EMAIL | Your Tractive account email |
| TRACTIVE_PASSWORD | Your Tractive account password |
| HOME_LATITUDE | Latitude of your home location |
| HOME_LONGITUDE | Longitude of your home location |
| TRACKER_ID | ID of your Tractive tracker device |

## Local Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
TRACTIVE_EMAIL=your-email@example.com
TRACTIVE_PASSWORD=your-password
HOME_LATITUDE=your-latitude
HOME_LONGITUDE=your-longitude
TRACKER_ID=your-tracker-id
```

4. Start local development server:
```bash
serverless offline
```

## Deployment

### Option 1: Using environment variables during deployment

```bash
serverless deploy \
  --param="TRACTIVE_EMAIL=your-email@example.com" \
  --param="TRACTIVE_PASSWORD=your-password" \
  --param="HOME_LATITUDE=your-latitude" \
  --param="HOME_LONGITUDE=your-longitude" \
  --param="TRACKER_ID=your-tracker-id"
```

### Option 2: Using .env file (Convenient for development)

If you have a `.env` file set up, you can easily load and use these environment variables during deployment:

```bash
export $(cat .env | xargs) && serverless deploy
```

This command will:
1. Read the `.env` file
2. Export all variables to your shell environment
3. Deploy using these environment variables

### Option 3: Using AWS Systems Manager Parameter Store (Recommended)

1. Store your variables in AWS Systems Manager Parameter Store using AWS Console or AWS CLI
2. Update the serverless.yml to reference these parameters

### Security Considerations

- Never commit the `.env` file to version control
- Consider using AWS Secrets Manager for production credentials
- The API endpoint is public by default - consider adding authentication if needed

## API Response

The API returns a JSON object with the following structure:

```json
{
  "distance": 123.45,  // Distance in meters from home
  "isHome": true,      // Whether pet is within the defined radius
  "latlong": [53.123, 11.456]  // Current coordinates
}
```

## Testing

Run the test suite with:
```bash
npm test
```

## Try it out locally

You can test the function directly using Node.js after setting up your environment variables. Make sure you have a `.env` file set up as described in the "Local Development" section above, then run:

```bash
# Load environment variables and run the function
export $(cat .env | xargs) && node -e "const { getFritziInfo } = require('./index.js'); getFritziInfo().then(console.log).catch(console.error)"
```

This will output the current location information for your pet in the following format:
```json
{
  "distance": 123.45,  // Distance in meters from home
  "isHome": true,      // Whether pet is within the defined radius
  "latlong": [53.123, 11.456]  // Current coordinates
}
```
