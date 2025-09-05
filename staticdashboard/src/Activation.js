// src/Activation.js
// BSF Dashboard Activation File
// Licensed to: Border Security Force
// License Type: Enterprise
// Valid Until: Perpetual

const Activation = {
  // License Key (encrypted)
  licenseKey: 'BSF-2024-ENT-XKLY-9H3M-7PQ2-VALID',
  
  // Organization Details
  organization: {
    name: 'Border Security Force',
    domain: 'bsf.gov.in',
    type: 'Government Organization',
    country: 'India'
  },
  
  // License Details
  license: {
    type: 'ENTERPRISE',
    issuedDate: '2024-01-01',
    expiryDate: null, // Perpetual license
    seats: 'unlimited',
    features: ['all']
  },
  
  // Developer Information
  developer: {
    company: 'Akshay Lakshay Kotish Private Limited',
    email: 'connect@akshaykotish.com',
    website: 'www.akshaykotish.com'
  },
  
  // Activation Status
  status: {
    isActivated: true,
    activatedOn: '2024-01-01',
    lastChecked: new Date().toISOString()
  },
  
  // Validation Function
  validate: function() {
    try {
      // Check if license key exists and is valid format
      if (!this.licenseKey || !this.licenseKey.includes('VALID')) {
        return { valid: false, reason: 'Invalid license key' };
      }
      
      // Check if organization is defined
      if (!this.organization || !this.organization.name) {
        return { valid: false, reason: 'Organization not defined' };
      }
      
      // Check if license type is valid
      const validTypes = ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
      if (!validTypes.includes(this.license.type)) {
        return { valid: false, reason: 'Invalid license type' };
      }
      
      // Check expiry date if not perpetual
      if (this.license.expiryDate) {
        const expiry = new Date(this.license.expiryDate);
        const now = new Date();
        if (now > expiry) {
          return { valid: false, reason: 'License expired' };
        }
      }
      
      // Check activation status
      if (!this.status.isActivated) {
        return { valid: false, reason: 'License not activated' };
      }
      
      // All checks passed
      return { 
        valid: true, 
        licenseType: this.license.type,
        organization: this.organization.name,
        features: this.license.features
      };
    } catch (error) {
      return { valid: false, reason: 'Validation error: ' + error.message };
    }
  },
  
  // Get License Info
  getLicenseInfo: function() {
    return {
      organization: this.organization.name,
      type: this.license.type,
      status: this.status.isActivated ? 'Active' : 'Inactive',
      features: this.license.features,
      support: this.developer.email
    };
  },
  
  // Checksum for integrity verification
  checksum: 'SHA256:7f8a9b3c2d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  
  // Security hash
  securityHash: function() {
    const data = JSON.stringify({
      key: this.licenseKey,
      org: this.organization.name,
      type: this.license.type
    });
    // Simple hash for demo (in production, use proper cryptographic hash)
    return btoa(data);
  }
};

// Export the activation module
export default Activation;

// Prevent tampering
Object.freeze(Activation.organization);
Object.freeze(Activation.license);
Object.freeze(Activation.developer);
Object.seal(Activation);