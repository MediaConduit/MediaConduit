"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Generic Docker Compose Service Manager
 *
 * Handles docker-compose operations for any service in a DRY way.
 * Services can delegate their Docker management to this service.
 */
class DockerComposeService {
    constructor(config) {
        this.config = config;
    }
    /**
     * Start the service using docker-compose up and wait for it to be healthy
     */
    async startService() {
        try {
            console.log(`🐳 Starting ${this.config.serviceName} service with docker-compose...`);
            // Check if already running and healthy
            const status = await this.getServiceStatus();
            if (status.running && status.health === 'healthy') {
                console.log(`✅ ${this.config.serviceName} service is already running and healthy`);
                return true;
            }
            // Build the docker-compose command - bring up all services
            const composeCmd = this.buildComposeCommand('up', '-d');
            console.log(`🚀 Running: ${composeCmd}`);
            await this.executeCommand(composeCmd);
            // Wait for service to become healthy according to Docker
            console.log(`⏳ Waiting for ${this.config.serviceName} to become healthy...`);
            const isHealthy = await this.waitForHealthy(60000); // 60 second timeout
            if (isHealthy) {
                console.log(`✅ ${this.config.serviceName} service started and is healthy`);
                return true;
            }
            else {
                console.error(`❌ ${this.config.serviceName} service started but failed to become healthy`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ Failed to start ${this.config.serviceName} service:`, error);
            return false;
        }
    }
    /**
     * Stop the service using docker-compose stop
     */
    async stopService() {
        try {
            console.log(`🛑 Stopping ${this.config.serviceName} service with docker-compose...`);
            // Stop all services in the compose file
            const composeCmd = this.buildComposeCommand('stop');
            console.log(`🛑 Running: ${composeCmd}`);
            await this.executeCommand(composeCmd);
            console.log(`✅ ${this.config.serviceName} service stopped successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to stop ${this.config.serviceName} service:`, error);
            return false;
        }
    }
    /**
     * Remove the service using docker-compose down
     */
    async removeService() {
        try {
            console.log(`🗑️ Removing ${this.config.serviceName} service with docker-compose...`);
            const composeCmd = this.buildComposeCommand('down');
            console.log(`🗑️ Running: ${composeCmd}`);
            await this.executeCommand(composeCmd);
            console.log(`✅ ${this.config.serviceName} service removed successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to remove ${this.config.serviceName} service:`, error);
            return false;
        }
    }
    /**
     * Complete cleanup - stops containers, removes them, and cleans up directories
     */
    async cleanup() {
        try {
            console.log(`🧹 Cleaning up ${this.config.serviceName} service completely...`);
            // First, stop and remove all containers and networks
            const composeCmd = this.buildComposeCommand('down', '--volumes', '--remove-orphans');
            console.log(`🗑️ Running: ${composeCmd}`);
            await this.executeCommand(composeCmd);
            console.log(`✅ ${this.config.serviceName} containers and volumes removed`); // If this is a dynamically cloned service (temp directory), remove the directory
            if (this.config.workingDirectory && this.config.workingDirectory.includes('temp')) {
                const fs = require('fs');
                if (fs.existsSync(this.config.workingDirectory)) {
                    console.log(`🗂️ Removing cloned service directory: ${this.config.workingDirectory}`);
                    // Use Node.js built-in recursive removal (Node 14.14+)
                    await fs.promises.rm(this.config.workingDirectory, { recursive: true, force: true });
                    console.log(`✅ Service directory cleaned up`);
                }
            }
            console.log(`✅ ${this.config.serviceName} cleanup completed successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to cleanup ${this.config.serviceName} service:`, error);
            return false;
        }
    }
    /**
     * Check if the service is running
     */
    async isServiceRunning() {
        try {
            // Get status of all services, then filter for our specific container
            const composeCmd = this.buildComposeCommand('ps', '--format', 'json');
            const { stdout } = await this.executeCommand(composeCmd);
            if (!stdout.trim()) {
                return false;
            }
            try {
                // Parse JSON array of services
                const services = JSON.parse(stdout);
                const serviceArray = Array.isArray(services) ? services : [services];
                // Find our specific container
                const targetService = serviceArray.find(service => service.Name === this.config.containerName ||
                    service.Service === this.config.serviceName);
                if (!targetService) {
                    return false;
                }
                const state = targetService.State || targetService.status;
                return state === 'running';
            }
            catch (parseError) {
                // Fallback: if we can't parse JSON, assume not running
                return false;
            }
        }
        catch (error) {
            console.warn(`Failed to check ${this.config.serviceName} service status:`, error);
            return false;
        }
    }
    /**
     * Wait for the service to become healthy according to Docker health checks
     */
    async waitForHealthy(timeoutMs = 600000) {
        const startTime = Date.now();
        const checkInterval = 2000; // Check every 2 seconds
        while (Date.now() - startTime < timeoutMs) {
            try {
                const status = await this.getServiceStatus();
                console.log(`[${this.config.serviceName}] Health check: running=${status.running}, health=${status.health}`);
                if (status.running && status.health === 'healthy') {
                    return true;
                }
                if (status.running && status.health === 'unhealthy') {
                    console.error(`❌ ${this.config.serviceName} service is unhealthy`);
                    return false;
                }
                // If no health check is defined, just check if it's running
                if (status.running && !status.health) {
                    console.log(`ℹ️ ${this.config.serviceName} has no health check, assuming healthy since it's running`);
                    return true;
                }
            }
            catch (error) {
                console.warn(`Health check failed for ${this.config.serviceName}:`, error);
            }
            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        console.error(`❌ ${this.config.serviceName} failed to become healthy within ${timeoutMs}ms`);
        return false;
    }
    /**
     * Get service status information
     */
    async getServiceStatus() {
        try {
            // Get status of all services, then filter for our specific container
            const composeCmd = this.buildComposeCommand('ps', '--format', 'json');
            const { stdout } = await this.executeCommand(composeCmd);
            if (!stdout.trim()) {
                return {
                    running: false,
                    containerName: this.config.containerName
                };
            }
            try {
                // Parse JSON array of services
                const services = JSON.parse(stdout);
                const serviceArray = Array.isArray(services) ? services : [services];
                // Find our specific container
                const targetService = serviceArray.find(service => service.Name === this.config.containerName ||
                    service.Service === this.config.serviceName);
                if (!targetService) {
                    return {
                        running: false,
                        containerName: this.config.containerName,
                        state: 'not-found'
                    };
                }
                return {
                    running: targetService.State === 'running',
                    containerName: this.config.containerName,
                    state: targetService.State,
                    health: targetService.Health
                };
            }
            catch (parseError) {
                return {
                    running: false,
                    containerName: this.config.containerName,
                    state: 'parse-error'
                };
            }
        }
        catch (error) {
            console.warn(`Failed to get ${this.config.serviceName} service status:`, error);
            return {
                running: false,
                containerName: this.config.containerName,
                state: 'error'
            };
        }
    }
    /**
     * Get service logs
     */
    async getServiceLogs(lines = 50) {
        try {
            const composeCmd = this.buildComposeCommand('logs', '--tail', lines.toString(), this.config.serviceName);
            const { stdout } = await this.executeCommand(composeCmd);
            return stdout;
        }
        catch (error) {
            console.error(`Failed to get ${this.config.serviceName} service logs:`, error);
            return '';
        }
    }
    /**
     * Restart the service
     */
    async restartService() {
        console.log(`🔄 Restarting ${this.config.serviceName} service...`);
        const stopped = await this.stopService();
        if (!stopped) {
            return false;
        }
        // Wait a moment for clean shutdown
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.startService();
    }
    /**
     * Get service configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Build docker-compose command with proper file path
     */
    buildComposeCommand(...args) {
        const composeFile = path.resolve(this.config.composeFile);
        return `docker-compose -f "${composeFile}" ${args.join(' ')}`;
    }
    /**
     * Execute a command with proper working directory
     */
    async executeCommand(command) {
        const options = this.config.workingDirectory
            ? { cwd: this.config.workingDirectory }
            : {};
        return await execAsync(command, options);
    }
}
exports.DockerComposeService = DockerComposeService;
