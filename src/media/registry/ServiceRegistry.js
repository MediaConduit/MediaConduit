"use strict";
/**
 * Service Registry for Configuration-Driven Docker Services
 *
 * Simple approach:
 * 1. Clone repo from GitHub URL
 * 2. Read MediaConduit.service.yml configuration
 * 3. Return DockerService configured with that yml
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = exports.ServiceCreationError = exports.ServiceNotFoundError = void 0;
exports.getServiceRegistry = getServiceRegistry;
var DockerComposeService_1 = require("../../services/DockerComposeService");
var path = require("path");
/**
 * Error thrown when a service is not found
 */
var ServiceNotFoundError = /** @class */ (function (_super) {
    __extends(ServiceNotFoundError, _super);
    function ServiceNotFoundError(id) {
        var _this = _super.call(this, "Service '".concat(id, "' not found in registry")) || this;
        _this.name = 'ServiceNotFoundError';
        return _this;
    }
    return ServiceNotFoundError;
}(Error));
exports.ServiceNotFoundError = ServiceNotFoundError;
/**
 * Error thrown when a service cannot be created
 */
var ServiceCreationError = /** @class */ (function (_super) {
    __extends(ServiceCreationError, _super);
    function ServiceCreationError(id, reason) {
        var _this = _super.call(this, "Failed to create service '".concat(id, "': ").concat(reason)) || this;
        _this.name = 'ServiceCreationError';
        return _this;
    }
    return ServiceCreationError;
}(Error));
exports.ServiceCreationError = ServiceCreationError;
/**
 * Service Registry - Configuration-driven Docker service loading
 */
var ServiceRegistry = /** @class */ (function () {
    function ServiceRegistry() {
        this.serviceCache = new Map();
    }
    /**
     * Get the singleton instance
     */
    ServiceRegistry.getInstance = function () {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    };
    /**
     * Get a service by URL or ID
     *
     * Simple process:
     * 1. Clone repo from GitHub URL
     * 2. Read MediaConduit.service.yml
     * 3. Return DockerService configured with that yml
     */
    ServiceRegistry.prototype.getService = function (identifier, config) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.serviceCache.get(identifier);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        console.log("\uD83D\uDD04 Loading service: ".concat(identifier));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!this.isGitHubUrl(identifier)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.loadServiceFromGitHub(identifier, config)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: throw new ServiceNotFoundError(identifier);
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error("\u274C Failed to load service ".concat(identifier, ":"), error_1);
                        throw new ServiceCreationError(identifier, error_1 instanceof Error ? error_1.message : String(error_1));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if identifier is a GitHub URL
     */
    ServiceRegistry.prototype.isGitHubUrl = function (identifier) {
        return identifier.startsWith('https://github.com/') ||
            identifier.startsWith('github:');
    };
    /**
     * Load service from GitHub repository
     * 1. Clone repo
     * 2. Read MediaConduit.service.yml
     * 3. Return configured DockerService
     */
    ServiceRegistry.prototype.loadServiceFromGitHub = function (identifier, userConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, owner, repo, ref, path, fs, serviceDirName, tmpDir, configPath, stats, cleanupError_1, execSync_1, execSync, repoUrl, cloneCommand, fallbackCommand, configContent, yaml, serviceConfig, dockerService, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.parseGitHubUrl(identifier), owner = _a.owner, repo = _a.repo, ref = _a.ref;
                        console.log("\uD83D\uDCE5 Cloning service repository: ".concat(owner, "/").concat(repo, "@").concat(ref));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                    case 1:
                        path = _b.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 2:
                        fs = _b.sent();
                        serviceDirName = "".concat(owner, "-").concat(repo);
                        tmpDir = path.join(process.cwd(), 'temp', 'services', serviceDirName);
                        configPath = path.join(tmpDir, 'MediaConduit.service.yml');
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 16, , 18]);
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 8, , 11]);
                        return [4 /*yield*/, fs.stat(tmpDir)];
                    case 5:
                        stats = _b.sent();
                        if (!stats.isDirectory()) return [3 /*break*/, 7];
                        console.log("\uD83E\uDDF9 Cleaning existing service directory: ".concat(tmpDir));
                        return [4 /*yield*/, fs.rm(tmpDir, { recursive: true, force: true })];
                    case 6:
                        _b.sent();
                        console.log("\u2705 Cleanup completed");
                        _b.label = 7;
                    case 7: return [3 /*break*/, 11];
                    case 8:
                        cleanupError_1 = _b.sent();
                        if (!(cleanupError_1.code !== 'ENOENT')) return [3 /*break*/, 10];
                        console.warn("\u26A0\uFE0F Directory cleanup warning: ".concat(cleanupError_1.message));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('child_process'); })];
                    case 9:
                        execSync_1 = (_b.sent()).execSync;
                        try {
                            execSync_1("rmdir /s /q \"".concat(tmpDir, "\""), { stdio: 'pipe' });
                            console.log("\u2705 Cleanup completed using Windows rmdir");
                        }
                        catch (rmError) {
                            console.warn("\u26A0\uFE0F Windows rmdir also failed, proceeding anyway: ".concat(rmError));
                        }
                        _b.label = 10;
                    case 10: return [3 /*break*/, 11];
                    case 11: return [4 /*yield*/, fs.mkdir(tmpDir, { recursive: true })];
                    case 12:
                        _b.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('child_process'); })];
                    case 13:
                        execSync = (_b.sent()).execSync;
                        repoUrl = "https://github.com/".concat(owner, "/").concat(repo, ".git");
                        cloneCommand = "git clone --depth 1 --branch ".concat(ref, " \"").concat(repoUrl, "\" \"").concat(tmpDir, "\"");
                        try {
                            execSync(cloneCommand, { stdio: 'pipe', timeout: 180000 });
                        }
                        catch (gitError) {
                            console.error("Git clone failed with branch ".concat(ref, ": ").concat(gitError.stderr.toString()));
                            fallbackCommand = "git clone --depth 1 \"".concat(repoUrl, "\" \"").concat(tmpDir, "\"");
                            try {
                                execSync(fallbackCommand, { stdio: 'pipe', timeout: 180000 });
                            }
                            catch (fallbackGitError) {
                                console.error("Git clone fallback failed: ".concat(fallbackGitError.stderr.toString()));
                                throw fallbackGitError; // Re-throw the error if both attempts fail
                            }
                        }
                        // Read MediaConduit.service.yml configuration
                        console.log("\uD83D\uDCCB Reading service configuration from MediaConduit.service.yml");
                        return [4 /*yield*/, fs.readFile(configPath, 'utf-8')];
                    case 14:
                        configContent = _b.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('yaml'); })];
                    case 15:
                        yaml = _b.sent();
                        serviceConfig = yaml.parse(configContent);
                        console.log('DEBUG: Parsed serviceConfig (before ConfigurableDockerService):', serviceConfig);
                        console.log("\u2705 Loaded service config: ".concat(serviceConfig.name, " v").concat(serviceConfig.version));
                        dockerService = new ConfigurableDockerService(tmpDir, serviceConfig, userConfig);
                        // Cache the service
                        this.serviceCache.set(identifier, dockerService);
                        console.log("\u2705 Service ready: ".concat(serviceConfig.name));
                        return [2 /*return*/, dockerService];
                    case 16:
                        error_2 = _b.sent();
                        // Cleanup on error
                        return [4 /*yield*/, fs.rm(tmpDir, { recursive: true, force: true }).catch(function () { })];
                    case 17:
                        // Cleanup on error
                        _b.sent();
                        throw error_2;
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse GitHub URL into components
     */
    ServiceRegistry.prototype.parseGitHubUrl = function (identifier) {
        if (identifier.startsWith('https://github.com/')) {
            var url = identifier.replace('https://github.com/', '');
            var _a = url.split('@'), ownerRepo = _a[0], ref = _a[1];
            var _b = ownerRepo.split('/'), owner = _b[0], repo = _b[1];
            return { owner: owner, repo: repo, ref: ref || 'main' };
        }
        else if (identifier.startsWith('github:')) {
            var url = identifier.replace('github:', '');
            var _c = url.split('@'), ownerRepo = _c[0], ref = _c[1];
            var _d = ownerRepo.split('/'), owner = _d[0], repo = _d[1];
            return { owner: owner, repo: repo, ref: ref || 'main' };
        }
        else {
            throw new Error("Invalid GitHub URL: ".concat(identifier));
        }
    };
    /**
     * Clear the service cache
     */
    ServiceRegistry.prototype.clearCache = function () {
        this.serviceCache.clear();
    };
    /**
     * Get registry statistics
     */
    ServiceRegistry.prototype.getStats = function () {
        return { cachedServices: this.serviceCache.size };
    };
    return ServiceRegistry;
}());
exports.ServiceRegistry = ServiceRegistry;
/**
 * ConfigurableDockerService - Generic Docker service configured from MediaConduit.service.yml
 */
var ConfigurableDockerService = /** @class */ (function () {
    function ConfigurableDockerService(serviceDirectory, serviceConfig, userConfig) {
        var _a;
        this.serviceDirectory = serviceDirectory;
        this.serviceConfig = serviceConfig;
        // Create DockerComposeService with the configuration
        var composeFilePath = path.resolve(serviceDirectory, this.serviceConfig.docker.composeFile);
        this.dockerComposeService = new DockerComposeService_1.DockerComposeService({
            composeFile: composeFilePath,
            serviceName: this.serviceConfig.docker.serviceName,
            containerName: "".concat(this.serviceConfig.name, "-").concat(this.serviceConfig.docker.serviceName),
            healthCheckUrl: ((_a = this.serviceConfig.docker.healthCheck) === null || _a === void 0 ? void 0 : _a.url) || "http://localhost:".concat(this.serviceConfig.docker.ports[0], "/health"),
            workingDirectory: serviceDirectory
        });
    }
    ConfigurableDockerService.prototype.startService = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dockerComposeService.startService()];
            });
        });
    };
    ConfigurableDockerService.prototype.stopService = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dockerComposeService.stopService()];
            });
        });
    };
    ConfigurableDockerService.prototype.restartService = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dockerComposeService.restartService()];
            });
        });
    };
    ConfigurableDockerService.prototype.getServiceStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dockerComposeService.getServiceStatus()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, {
                                running: status.running,
                                health: status.health || 'none',
                                state: status.state || 'unknown',
                                containerId: status.containerName
                            }];
                }
            });
        });
    };
    ConfigurableDockerService.prototype.isServiceHealthy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getServiceStatus()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, status.running && status.health === 'healthy'];
                }
            });
        });
    };
    ConfigurableDockerService.prototype.isServiceRunning = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getServiceStatus()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, status.running];
                }
            });
        });
    };
    ConfigurableDockerService.prototype.waitForHealthy = function () {
        return __awaiter(this, arguments, void 0, function (timeoutMs) {
            if (timeoutMs === void 0) { timeoutMs = 120000; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dockerComposeService.waitForHealthy(timeoutMs)];
            });
        });
    };
    ConfigurableDockerService.prototype.getDockerComposeService = function () {
        return this.dockerComposeService;
    };
    ConfigurableDockerService.prototype.getServiceInfo = function () {
        var _a;
        return {
            containerName: "".concat(this.serviceConfig.name, "-").concat(this.serviceConfig.docker.serviceName),
            dockerImage: this.serviceConfig.docker.image || 'unknown',
            ports: this.serviceConfig.docker.ports,
            composeService: this.serviceConfig.docker.serviceName,
            composeFile: this.serviceConfig.docker.composeFile,
            healthCheckUrl: ((_a = this.serviceConfig.docker.healthCheck) === null || _a === void 0 ? void 0 : _a.url) || "http://localhost:".concat(this.serviceConfig.docker.ports[0], "/health"),
            network: "".concat(this.serviceConfig.name, "-network"),
            serviceDirectory: this.serviceDirectory
        };
    };
    ConfigurableDockerService.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dockerComposeService.cleanup()];
            });
        });
    };
    return ConfigurableDockerService;
}());
/**
 * Convenience function to get the registry instance
 */
function getServiceRegistry() {
    return ServiceRegistry.getInstance();
}
exports.default = ServiceRegistry;
