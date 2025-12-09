
// Mock Data for Demo Mode

const MOCK_DELAY = 800;

const mockUsers = [
    {
        id: 1,
        username: 'admin',
        password: 'password123',
        full_name: 'System Administrator',
        role: 'admin',
        base_id: null,
        base_name: null
    },
    {
        id: 2,
        username: 'commander_alpha',
        password: 'password123',
        full_name: 'Col. John Smith',
        role: 'base_commander',
        base_id: 1,
        base_name: 'Base Alpha'
    },
    {
        id: 3,
        username: 'commander_bravo',
        password: 'password123',
        full_name: 'Col. Sarah Johnson',
        role: 'base_commander',
        base_id: 2,
        base_name: 'Base Bravo'
    },
    {
        id: 4,
        username: 'logistics_alpha',
        password: 'password123',
        full_name: 'Lt. Robert Wilson',
        role: 'logistics_officer',
        base_id: 1,
        base_name: 'Base Alpha'
    },
    {
        id: 5,
        username: 'logistics_bravo',
        password: 'password123',
        full_name: 'Lt. Jennifer Martinez',
        role: 'logistics_officer',
        base_id: 2,
        base_name: 'Base Bravo'
    }
];

export const mockAuthAPI = {
    login: (credentials) => {
        const user = mockUsers.find(u =>
            u.username === credentials.username &&
            u.password === credentials.password
        );

        if (user) {
            // Return user without password
            const { password, ...safeUser } = user;
            return mockResponse({
                access_token: `mock-jwt-token-${user.username}`,
                user: safeUser
            });
        }
        return Promise.reject({ response: { data: { error: 'Invalid credentials' } } });
    },
    getMe: () => {
        // Just return admin for simplicty in getMe since we don't track session in mock
        const { password, ...safeUser } = mockUsers[0];
        return mockResponse({ user: safeUser });
    },
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
