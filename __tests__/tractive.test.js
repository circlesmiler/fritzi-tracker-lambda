const axios = require('axios');
const tractive = require('../tractive');

jest.mock('axios');

describe('tractive module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Reset the axios mock
    axios.post.mockReset();
    axios.get.mockReset();
  });

  describe('connect', () => {
    test('should authenticate successfully with valid credentials', async () => {
      axios.post.mockImplementation(() =>
        Promise.resolve({
          data: {
            access_token: 'test_token',
            user_id: 'test_user_id'
          }
        })
      );

      await tractive.connect('test@example.com', 'password');

      expect(axios.post).toHaveBeenCalledWith(
        'https://graph.tractive.com/4/auth/token?grant_type=tractive&platform_email=test%40example.com&platform_token=password',
        null,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Tractive-Client': '6536c228870a3c8857d452e8'
          }
        }
      );
      expect(tractive.isAuthenticated()).toBe(true);
    });

    test('should throw error on authentication failure', async () => {
      const error = new Error('Authentication failed');
      error.response = { data: 'Authentication failed' };
      axios.post.mockImplementation(() => Promise.reject(error));

      await expect(tractive.connect('test@example.com', 'wrong_password'))
        .rejects.toThrow('Authentication failed');

      expect(tractive.isAuthenticated()).toBe(false);
    });
  });

  describe('getTrackerLocation', () => {
    beforeEach(async () => {
      // Mock successful authentication
      axios.post.mockImplementation(() =>
        Promise.resolve({
          data: {
            access_token: 'mock-token',
            user_id: 'user123'
          }
        })
      );
      await tractive.connect('test@example.com', 'password');
      // Reset the mock after authentication
      axios.post.mockReset();
    });

    test('should return tracker location with address', async () => {
      // First call for position data
      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            latlong: [53.839425, 11.993049],
            time: 1620000000
          }
        })
      );
      // Second call for address data
      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            city: 'Berlin',
            country: 'Germany'
          }
        })
      );

      const result = await tractive.getTrackerLocation('TRACKER123');

      expect(result).toEqual({
        latlong: [53.839425, 11.993049],
        time: 1620000000,
        address: {
          city: 'Berlin',
          country: 'Germany'
        }
      });
    });

    test('should throw error when tracker location is unavailable', async () => {
      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          data: { latlong: [] }
        })
      );

      await expect(tractive.getTrackerLocation('TRACKER123'))
        .rejects.toThrow('Tracker location unavailable or incomplete');
    });
  });

  describe('getTrackerHistory', () => {
    beforeEach(async () => {
      // Mock successful authentication
      axios.post.mockImplementation(() =>
        Promise.resolve({
          data: {
            access_token: 'mock-token',
            user_id: 'user123'
          }
        })
      );
      await tractive.connect('test@example.com', 'password');
      // Reset the mock after authentication
      axios.post.mockReset();
    });

    test('should return tracker history for given time range', async () => {
      const mockHistoryData = [{
        positions: [
          { latlong: [53.839425, 11.993049], time: 1620000000 },
          { latlong: [53.839426, 11.993050], time: 1620000060 }
        ]
      }];

      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          data: mockHistoryData
        })
      );

      const from = new Date('2023-01-01');
      const to = new Date('2023-01-02');
      const result = await tractive.getTrackerHistory('TRACKER123', from, to);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tracker/TRACKER123/positions'),
        expect.objectContaining({
          params: {
            time_from: Math.floor(from.getTime() / 1000),
            time_to: Math.floor(to.getTime() / 1000),
            format: 'json_segments'
          }
        })
      );
      expect(result).toEqual(mockHistoryData[0]);
    });
  });

  describe('getTrackerHardware', () => {
    beforeEach(async () => {
      // Mock successful authentication
      axios.post.mockImplementation(() =>
        Promise.resolve({
          data: {
            access_token: 'mock-token',
            user_id: 'user123'
          }
        })
      );
      await tractive.connect('test@example.com', 'password');
      // Reset the mock after authentication
      axios.post.mockReset();
    });

    test('should return tracker hardware information', async () => {
      const mockHardwareData = {
        battery_level: 85,
        power_saving_zone_id: null,
        hardware_version: "V1",
        software_version: "1.0"
      };

      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          data: mockHardwareData
        })
      );

      const result = await tractive.getTrackerHardware('TRACKER123');

      expect(axios.get).toHaveBeenCalledWith(
        'https://graph.tractive.com/4/device_hw_report/TRACKER123',
        expect.any(Object)
      );
      expect(result).toEqual(mockHardwareData);
    });
  });
});