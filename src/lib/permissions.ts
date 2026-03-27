export async function requestHardwarePermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // Immediately stop the tracks after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error("Hardware permission denied:", err);
    return false;
  }
}

export async function checkHardwarePermissions() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some(device => device.kind === 'audioinput' && device.label !== '');
    const hasCam = devices.some(device => device.kind === 'videoinput' && device.label !== '');
    return hasMic && hasCam;
  } catch (err) {
    return false;
  }
}
