"use strict";
/**
 * AbstractDockerProvider
 *
 * Base class for all Docker-based providers using the ServiceRegistry pattern.
 * Eliminates code duplication by providing common service management functionality.
 */
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
exports.AbstractDockerProvider = void 0;
/**
 * Abstract base class for Docker providers
 */
var AbstractDockerProvider = /** @class */ (function () {
    function AbstractDockerProvider(dockerService, id, name, type, capabilities) {
        this.dockerServiceManager = dockerService;
        this.id = id;
        this.name = name;
        this.type = type;
        this.capabilities = capabilities;
    }
    Object.defineProperty(AbstractDockerProvider.prototype, "models", {
        /**
         * Get models array for MediaProvider interface
         */
        get: function () {
            return this.getModelsForCapability(this.capabilities[0]); // Use first capability by default
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get the Docker service instance from ServiceRegistry
     */
    AbstractDockerProvider.prototype.getDockerService = function () {
        if (!this.dockerServiceManager) {
            throw new Error('Service not configured. Please call configure() first.');
        }
        return this.dockerServiceManager;
    };
    /**
     * Start the Docker service
     */
    AbstractDockerProvider.prototype.startService = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dockerService, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        dockerService = this.getDockerService();
                        if (!(dockerService && typeof dockerService.startService === 'function')) return [3 /*break*/, 2];
                        return [4 /*yield*/, dockerService.startService()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        console.error('Service not properly configured');
                        return [2 /*return*/, false];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Failed to start Docker service:', error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop the Docker service
     */
    AbstractDockerProvider.prototype.stopService = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dockerService, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        dockerService = this.getDockerService();
                        if (!(dockerService && typeof dockerService.stopService === 'function')) return [3 /*break*/, 2];
                        return [4 /*yield*/, dockerService.stopService()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        console.error('Service not properly configured');
                        return [2 /*return*/, false];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Failed to stop Docker service:', error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get service status
     */
    AbstractDockerProvider.prototype.getServiceStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dockerService, status_1, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        dockerService = this.getDockerService();
                        if (!(dockerService && typeof dockerService.getServiceStatus === 'function')) return [3 /*break*/, 2];
                        return [4 /*yield*/, dockerService.getServiceStatus()];
                    case 1:
                        status_1 = _a.sent();
                        return [2 /*return*/, {
                                running: status_1.running || false,
                                healthy: status_1.health === 'healthy',
                                error: status_1.state === 'error' ? status_1.state : undefined
                            }];
                    case 2: return [2 /*return*/, { running: false, healthy: false }];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Failed to get service status:', error_3);
                        return [2 /*return*/, { running: false, healthy: false }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if the provider is available and ready
     */
    AbstractDockerProvider.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.dockerServiceManager) {
                    return [2 /*return*/, false];
                }
                try {
                    return [2 /*return*/, this.dockerServiceManager.waitForHealthy(30000)];
                }
                catch (error) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get provider health status
     */
    AbstractDockerProvider.prototype.getHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getServiceStatus()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, {
                                status: status.healthy ? 'healthy' : 'unhealthy',
                                uptime: process.uptime(),
                                activeJobs: 0,
                                queuedJobs: 0,
                            }];
                }
            });
        });
    };
    /**
     * Configure the provider with ServiceRegistry
     */
    AbstractDockerProvider.prototype.configure = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.config = config;
                return [2 /*return*/];
            });
        });
    };
    return AbstractDockerProvider;
}());
exports.AbstractDockerProvider = AbstractDockerProvider;
