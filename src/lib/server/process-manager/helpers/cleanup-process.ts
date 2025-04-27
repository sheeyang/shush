import activeProcesses from '../../processes';

export async function cleanupProcess(processId: string) {
  const processInfo = activeProcesses.get(processId);

  if (!processInfo) return;

  try {
    // Remove event listeners
    if (processInfo.eventListeners) {
      const { onStdout, onStderr, onClose, onError } =
        processInfo.eventListeners;

      processInfo.process?.stdout?.off('data', onStdout);
      processInfo.process?.stderr?.off('data', onStderr);
      processInfo.process?.off('close', onClose);
      processInfo.process?.off('error', onError);
    }

    // Delete from active processes map
    activeProcesses.delete(processId);
  } catch (error) {
    console.error(`Error cleaning up process ${processId}:`, error);
  }
}
