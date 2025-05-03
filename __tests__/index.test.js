const tractive = require('../tractive');
const { getFritziInfo } = require('../index');

// Mock the tractive module
jest.mock('../tractive');

describe('getFritziInfo', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock environment variables
    process.env.TRACTIVE_EMAIL = 'test@example.com';
    process.env.TRACTIVE_PASSWORD = 'password';
    process.env.TRACKER_ID = 'ZLHQOVQA';
    process.env.HOME_LATITUDE = '53.839425';
    process.env.HOME_LONGITUDE = '11.993049';
  });

  afterEach(() => {
    // Clear environment variables
    delete process.env.TRACTIVE_EMAIL;
    delete process.env.TRACTIVE_PASSWORD;
    delete process.env.TRACKER_ID;
    delete process.env.HOME_LATITUDE;
    delete process.env.HOME_LONGITUDE;
  });

  test('should return correct data when cat is at home', async () => {
    // Mock the tractive functions
    tractive.connect.mockResolvedValue(true);
    tractive.isAuthenticated.mockReturnValue(true);
    tractive.getTrackerLocation.mockResolvedValue({
      latlong: [53.839425, 11.993049] // Home coordinates
    });

    const result = await getFritziInfo();

    expect(result).toEqual({
      distance: 0,
      isHome: true,
      latlong: [53.839425, 11.993049]
    });

    // Verify tractive functions were called with correct credentials
    expect(tractive.connect).toHaveBeenCalledWith('test@example.com', 'password');
    expect(tractive.isAuthenticated).toHaveBeenCalled();
    expect(tractive.getTrackerLocation).toHaveBeenCalledWith('ZLHQOVQA');
  });

  test('should return correct data when cat is away from home', async () => {
    // Mock the tractive functions
    tractive.connect.mockResolvedValue(true);
    tractive.isAuthenticated.mockReturnValue(true);
    tractive.getTrackerLocation.mockResolvedValue({
      latlong: [53.840425, 11.994049] // ~100m away from home
    });

    const result = await getFritziInfo();

    expect(result.isHome).toBe(false);
    expect(result.distance).toBeGreaterThan(30); // Should be greater than RADIUS
    expect(result.latlong).toEqual([53.840425, 11.994049]);
  });

  test('should throw error when authentication fails', async () => {
    tractive.connect.mockRejectedValue(new Error('Authentication failed'));
    tractive.isAuthenticated.mockReturnValue(false);

    await expect(getFritziInfo()).rejects.toThrow('Authentication failed');
  });

  test('should throw error when tracker location is invalid', async () => {
    tractive.connect.mockResolvedValue(true);
    tractive.isAuthenticated.mockReturnValue(true);
    tractive.getTrackerLocation.mockResolvedValue({
      latlong: [] // Invalid location data
    });

    await expect(getFritziInfo()).rejects.toThrow('Invalid or empty location response');
  });
});