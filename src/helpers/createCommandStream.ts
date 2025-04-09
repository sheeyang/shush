import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';

// Store active processes with their IDs
const activeProcesses = new Map<string, ChildProcess>();

// Helper function to create a stream from a command
export function createCommandStream(command: string, args: string[]) {
    // Generate a unique process ID
    const processId = crypto.randomUUID();

    const stream = new ReadableStream({
        start(controller) {
            const process = spawn(command, args);

            // Store the process with its ID
            activeProcesses.set(processId, process);

            process.stdout.on('data', (data) => {
                controller.enqueue(data.toString());
            });

            process.stderr.on('data', (data) => {
                controller.enqueue(`Error: ${data.toString()}`);
            });

            process.on('close', (code) => {
                controller.enqueue(`\nProcess exited with code ${code}`);
                activeProcesses.delete(processId);
                controller.close();
            });

            process.on('error', (err) => {
                controller.enqueue(`\nProcess error: ${err.message}`);
                activeProcesses.delete(processId);
                controller.close();
            });
        }
    });

    // Return both the stream and the processId
    return { stream, processId };
}

// Function to kill a process by its ID
export function killProcess(processId: string): boolean {
    const process = activeProcesses.get(processId);
    if (process) {
        process.kill();
        activeProcesses.delete(processId);
        return true;
    }
    return false;
}
