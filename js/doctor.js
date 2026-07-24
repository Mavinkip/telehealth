// Add a custom test
doctorManager.customTest = function() {
    console.log('🧪 Running custom test...');
    // Your test logic here
    return { passed: true, message: 'Custom test passed!' };
};

// Add to test suite
doctorManager.runAllTests = async function() {
    await this.testPrescriptionModal();
    // ... other tests
    await this.customTest();
};