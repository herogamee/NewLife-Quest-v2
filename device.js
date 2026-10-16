// Viewport width and pointer type describe a window/input, not the device.
export function isMobileDevice({ userAgent = '', platform = '', maxTouchPoints = 0, userAgentData } = {}) {
  return userAgentData?.mobile === true || /Android|iPhone|iPad|iPod/i.test(userAgent) ||
    (maxTouchPoints > 1 && (platform === 'MacIntel' || /Macintosh/i.test(userAgent)));
}

export function needsLandscape(device, portrait) {
  return isMobileDevice(device) && portrait;
}
