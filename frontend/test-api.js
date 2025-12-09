// Test script to verify dashboard API is working
console.log('Testing dashboard API...');

// First, get the token from localStorage
const token = localStorage.getItem('token');
console.log('Token from localStorage:', token ? 'Found' : 'Not found');

if (!token) {
    console.error('No token found! Please login first.');
} else {
    // Test the dashboard API
    fetch('/api/dashboard/metrics?base_id=&equipment_type_id=&start_date=2025-11-09&end_date=2025-12-09', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Dashboard data:', data);
        })
        .catch(error => {
            console.error('Error fetching dashboard:', error);
        });
}
