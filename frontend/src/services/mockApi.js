
// Mock Data for Demo Mode

const MOCK_DELAY = 800;

export const mockUser = {
    id: 1,
    username: 'admin',
    full_name: 'System Administrator',
    role: 'admin',
    base_id: null,
    base_name: null
};

export const mockBases = [
    { id: 1, name: 'Base Alpha', location: 'Northern Region', commander_name: 'Col. Smith' },
    { id: 2, name: 'Base Bravo', location: 'Eastern Region', commander_name: 'Col. Johnson' }
];

export const mockDashboard = {
    total_assets: 15420,
    total_value: 25000000,
    critical_alerts: 2,
    pending_transfers: 5
};

// Helper to simulate async API call
const mockResponse = (data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ data });
        }, MOCK_DELAY);
    });
};

export const mockAuthAPI = {
    login: (credentials) => {
        if (credentials.username === 'admin' && credentials.password === 'password123') {
            return mockResponse({
                access_token: 'mock-jwt-token-xyz',
                user: mockUser
            });
        }
        return Promise.reject({ response: { data: { error: 'Invalid credentials' } } });
    },
    getMe: () => mockResponse({ user: mockUser }),
    changePassword: () => mockResponse({ message: 'Password changed' })
};

export const mockDashboardAPI = {
    getMetrics: () => mockResponse(mockDashboard),
    getMovementDetails: () => mockResponse([]),
    getInventorySummary: () => mockResponse([])
};

export const mockCommonAPI = {
    getBases: () => mockResponse({ bases: mockBases }),
    getEquipmentTypes: () => mockResponse({ equipment_types: [] }),
    getUsers: () => mockResponse({ users: [mockUser] }),
    getAuditLogs: () => mockResponse({ logs: [] })
};

// Fallback for other APIs
export const mockGenericAPI = {
    getAll: () => mockResponse([]),
    create: () => mockResponse({ success: true }),
    update: () => mockResponse({ success: true }),
    delete: () => mockResponse({ success: true })
};
