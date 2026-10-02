import { MockHardwareService } from './MockHardwareService.js';
import { RealHardwareServicePlaceholder } from './RealHardwareServicePlaceholder.js';

let isMockMode = true;
let activeService = new MockHardwareService();

/**
 * Get the active hardware service (Mock or Real)
 * @returns {MockHardwareService | RealHardwareServicePlaceholder}
 */
export function getHardwareService() {
  return activeService;
}

/**
 * Check if running in Demo / Mock mode
 */
export function isDemoMode() {
  return isMockMode;
}

/**
 * Switch between mock service and real hardware service
 * @param {boolean} useMock 
 */
export function setUseMockHardware(useMock) {
  if (isMockMode === useMock) return activeService;
  
  if (activeService && activeService.disconnect) {
    activeService.disconnect();
  }

  isMockMode = !!useMock;
  activeService = isMockMode ? new MockHardwareService() : new RealHardwareServicePlaceholder();
  return activeService;
}
