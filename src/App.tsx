// Import the utility functions
import { enforceOriginRestriction, detectDebugMode, enforceContainerExecution } from 'code-protection';

// Protection checks
function initProtectionChecks() {
    enforceOriginRestriction();
    detectDebugMode();
    enforceContainerExecution();
}

// Call protection checks at the beginning of the application
initProtectionChecks();

// ... rest of your App.tsx code ...