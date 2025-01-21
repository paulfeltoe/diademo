import { patientFields } from '../config/patientFields.js';

console.log('Script starting...'); // Debug point 1

try {
    console.log('Patient Fields loaded:', patientFields); // Debug point 3
    
    // Function to format date from YYYY-MM-DD to readable format
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Update profile information
    console.log('Updating profile information...'); // Debug point 4
    
    // Populate step 7 fields
    const step7Section = document.querySelector('[data-step="7"]');
    if (step7Section) {
        const fields = step7Section.querySelectorAll('[data-field]');
        fields.forEach(field => {
            const fieldName = field.dataset.field;
            let value = patientFields[fieldName];
            
            // Special handling for date formatting
            if (fieldName === 'dateOfBirth') {
                value = formatDate(value);
            }
            // Special handling for lists (medications and allergies)
            else if (fieldName === 'medications' || fieldName === 'allergies') {
                value = value.replace(/\n/g, ', ');
            }
            
            field.textContent = value;
        });
    }

    // ... existing profile information updates ...
    document.getElementById('profile-name').textContent = patientFields.fullName;
    document.getElementById('profile-dob').textContent = formatDate(patientFields.dateOfBirth);
    document.getElementById('profile-phone').textContent = patientFields.phone;
    document.getElementById('profile-address').textContent = patientFields.address;

    document.getElementById('profile-pharmacy').textContent = patientFields.preferredPharmacy;
    document.getElementById('profile-pharmacy-address').textContent = patientFields.pharmacyAddress;
    document.getElementById('profile-medications').textContent = patientFields.medications.replace(/\n/g, ', ');
    document.getElementById('profile-allergies').textContent = patientFields.allergies.replace(/\n/g, ', ');

    document.getElementById('profile-emergency-name').textContent = patientFields.emergencyName;
    document.getElementById('profile-relationship').textContent = patientFields.relationship;
    document.getElementById('profile-emergency-phone').textContent = patientFields.emergencyPhone;

    document.getElementById('profile-insurance-provider').textContent = patientFields.insuranceProvider;
    document.getElementById('profile-policy-number').textContent = patientFields.policyNumber;
    document.getElementById('profile-group-number').textContent = patientFields.groupNumber;
    console.log('Profile update complete'); // Debug point 5
} catch (error) {
    console.error('Error in profile script:', error); // Debug point 6
} 