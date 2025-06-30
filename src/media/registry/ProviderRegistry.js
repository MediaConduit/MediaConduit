"use strict";
/**
 * Provider Registry for Elegant Provider Management
 *
 * Implements the singleton pattern with constructor-based registration
 * for lazy instantiation and auto-configuration of providers.
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
exports.ProviderRegistry = exports.ProviderCreationError = exports.ProviderNotFoundError = void 0;
exports.getProviderRegistry = getProviderRegistry;
var provider_1 = require("../types/provider");
var ServiceRegistry_1 = require("../registry/ServiceRegistry");
var yaml = require("yaml");
var url_1 = require("url");
/**
 * Error thrown when a provider is not found
 */
var ProviderNotFoundError = /** @class */ (function (_super) {
    __extends(ProviderNotFoundError, _super);
    function ProviderNotFoundError(id) {
        var _this = _super.call(this, "Provider '".concat(id, "' not found in registry")) || this;
        _this.name = 'ProviderNotFoundError';
        return _this;
    }
    return ProviderNotFoundError;
}(Error));
exports.ProviderNotFoundError = ProviderNotFoundError;
/**
 * Error thrown when a provider cannot be created
 */
var ProviderCreationError = /** @class */ (function (_super) {
    __extends(ProviderCreationError, _super);
    function ProviderCreationError(id, reason) {
        var _this = _super.call(this, "Failed to create provider '".concat(id, "': ").concat(reason)) || this;
        _this.name = 'ProviderCreationError';
        return _this;
    }
    return ProviderCreationError;
}(Error));
exports.ProviderCreationError = ProviderCreationError;
/**
 * Provider Registry - Singleton for managing provider constructors
 *
 * Supports:
 * - Lazy instantiation via constructors
 * - Auto-configuration from environment
 * - Error handling and graceful fallbacks
 * - Type-safe provider access
 */
var ProviderRegistry = /** @class */ (function () {
    function ProviderRegistry() {
        this.providers = new Map();
        this.providerCache = new Map();
    }
    /**
     * Get the singleton instance
     */
    ProviderRegistry.getInstance = function () {
        if (!ProviderRegistry.instance) {
            ProviderRegistry.instance = new ProviderRegistry();
        }
        return ProviderRegistry.instance;
    };
    /**
     * Register a provider constructor
     */
    ProviderRegistry.prototype.register = function (id, providerClass) {
        this.providers.set(id, providerClass);
    };
    /**
     * Get available provider IDs
     */
    ProviderRegistry.prototype.getAvailableProviders = function () {
        return Array.from(this.providers.keys());
    };
    /**
     * Check if a provider is registered
     */
    ProviderRegistry.prototype.hasProvider = function (id) {
        return this.providers.has(id);
    };
    /**
     * Get a provider by ID or URL with lazy instantiation
     */
    ProviderRegistry.prototype.getProvider = function (identifier) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, ProviderClass, provider;
            return __generator(this, function (_a) {
                // Handle static providers (existing behavior)
                if (this.providers.has(identifier)) {
                    cached = this.providerCache.get(identifier);
                    if (cached) {
                        return [2 /*return*/, cached];
                    }
                    ProviderClass = this.providers.get(identifier);
                    try {
                        provider = new ProviderClass();
                        // Cache for future use
                        this.providerCache.set(identifier, provider);
                        return [2 /*return*/, provider];
                    }
                    catch (error) {
                        throw new ProviderCreationError(identifier, error instanceof Error ? error.message : String(error));
                    }
                }
                // Handle dynamic providers (new behavior)
                if (this.isDynamicIdentifier(identifier)) {
                    return [2 /*return*/, this.loadDynamicProvider(identifier)];
                }
                throw new ProviderNotFoundError(identifier);
            });
        });
    };
    /**
     * Check if identifier is a dynamic provider (URL, package name, etc.)
     */
    ProviderRegistry.prototype.isDynamicIdentifier = function (identifier) {
        return identifier.startsWith('http') ||
            identifier.startsWith('@') ||
            identifier.includes('/') ||
            identifier.startsWith('npm:') ||
            identifier.startsWith('github:') ||
            identifier.startsWith('file:');
    };
    /**
     * Load a dynamic provider from URL, package, etc.
     */
    ProviderRegistry.prototype.loadDynamicProvider = function (identifier) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, parsed, provider, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cached = this.providerCache.get(identifier);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        console.log("\uD83D\uDD04 Loading dynamic provider: ".concat(identifier));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 11, , 12]);
                        parsed = this.parseIdentifier(identifier);
                        provider = void 0;
                        _a = parsed.type;
                        switch (_a) {
                            case 'npm': return [3 /*break*/, 2];
                            case 'github': return [3 /*break*/, 4];
                            case 'file': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.loadNpmProvider(parsed)];
                    case 3:
                        provider = _b.sent();
                        return [3 /*break*/, 9];
                    case 4: return [4 /*yield*/, this.loadGitHubProvider(parsed)];
                    case 5:
                        provider = _b.sent();
                        return [3 /*break*/, 9];
                    case 6: return [4 /*yield*/, this.loadFileProvider(parsed)];
                    case 7:
                        provider = _b.sent();
                        return [3 /*break*/, 9];
                    case 8: throw new Error("Unsupported provider type: ".concat(parsed.type));
                    case 9: 
                    // Validate provider implements interface
                    return [4 /*yield*/, this.validateProvider(provider)];
                    case 10:
                        // Validate provider implements interface
                        _b.sent();
                        // Cache the provider
                        this.providerCache.set(identifier, provider);
                        console.log("\u2705 Dynamic provider loaded: ".concat(identifier));
                        return [2 /*return*/, provider];
                    case 11:
                        error_1 = _b.sent();
                        console.error("\u274C Failed to load dynamic provider ".concat(identifier, ":"), error_1);
                        throw new ProviderCreationError(identifier, error_1 instanceof Error ? error_1.message : String(error_1));
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse provider identifier into type and details
     */
    ProviderRegistry.prototype.parseIdentifier = function (identifier) {
        if (identifier.startsWith('@') || identifier.startsWith('npm:')) {
            var cleanId = identifier.replace(/^npm:/, '');
            if (cleanId.startsWith('@')) {
                // Handle @scope/package@version
                var parts = cleanId.split('@');
                if (parts.length >= 3) {
                    // @scope/package@version -> ['', 'scope/package', 'version']
                    var packageName = "@".concat(parts[1]);
                    var version = parts[2];
                    return { type: 'npm', packageName: packageName, version: version };
                }
                else {
                    // @scope/package -> ['', 'scope/package']
                    var packageName = "@".concat(parts[1]);
                    return { type: 'npm', packageName: packageName, version: 'latest' };
                }
            }
            else {
                // Handle regular package@version
                var _a = cleanId.split('@'), packageName = _a[0], version = _a[1];
                return { type: 'npm', packageName: packageName, version: version || 'latest' };
            }
        }
        // GitHub: https://github.com/owner/repo or github:owner/repo@ref
        if (identifier.startsWith('https://github.com/') || identifier.startsWith('github:')) {
            var cleanId = identifier;
            if (identifier.startsWith('https://github.com/')) {
                cleanId = identifier.replace('https://github.com/', '');
            }
            else {
                cleanId = identifier.replace('github:', '');
            }
            var _b = cleanId.split('@'), ownerRepo = _b[0], ref = _b[1];
            var _c = ownerRepo.split('/'), owner = _c[0], repo = _c[1];
            return {
                type: 'github',
                owner: owner,
                repo: repo,
                ref: ref || 'main'
            };
        }
        // File: file:///path/to/provider
        if (identifier.startsWith('file:')) {
            var fileUrl = new url_1.URL(identifier);
            var filePath = fileUrl.pathname;
            // On Windows, URL.pathname can return paths with a leading slash (e.g., /C:/path)
            // We need to remove it for path.join to work correctly.
            if (process.platform === 'win32' && filePath.startsWith('/')) {
                filePath = filePath.substring(1);
            }
            return {
                type: 'file',
                path: filePath
            };
        }
        throw new Error("Cannot parse provider identifier: ".concat(identifier));
    };
    /**
     * Load provider from npm package
     */
    ProviderRegistry.prototype.loadNpmProvider = function (parsed) {
        return __awaiter(this, void 0, void 0, function () {
            var packageName, version, providerModule, ProviderClass, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        packageName = parsed.packageName, version = parsed.version;
                        if (!packageName) {
                            throw new Error('Package name is required for npm provider');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve("".concat(packageName)).then(function (s) { return require(s); })];
                    case 2:
                        providerModule = _a.sent();
                        ProviderClass = providerModule.default || providerModule[Object.keys(providerModule)[0]];
                        if (!ProviderClass) {
                            throw new Error('No default export found in provider package');
                        }
                        return [2 /*return*/, new ProviderClass()];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error("Failed to load npm provider ".concat(packageName, "@").concat(version, ": ").concat(error_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    }; /**
     * Load provider from GitHub repository
     */
    ProviderRegistry.prototype.loadGitHubProvider = function (parsed) {
        return __awaiter(this, void 0, void 0, function () {
            var owner, repo, ref, path, fs, execSync, serviceDirName, tmpDir, providerConfigPath, stats, cleanupError_1, execSync_1, repoUrl, cloneCommand, fallbackCommand, configContent, providerConfig, providerInstance, providerModulePath, providerModuleUrl, providerModule, ProviderClass, serviceRegistry, dockerService, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        owner = parsed.owner, repo = parsed.repo, ref = parsed.ref;
                        if (!owner || !repo) {
                            throw new Error('Owner and repo are required for GitHub provider');
                        }
                        console.log("\uD83D\uDCE5 Downloading GitHub provider: ".concat(owner, "/").concat(repo, "@").concat(ref));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                    case 1:
                        path = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 2:
                        fs = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('child_process'); })];
                    case 3:
                        execSync = (_a.sent()).execSync;
                        serviceDirName = "".concat(owner, "-").concat(repo);
                        tmpDir = path.join(process.cwd(), 'temp', 'providers', serviceDirName);
                        providerConfigPath = path.join(tmpDir, 'MediaConduit.provider.yml');
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 19, , 21]);
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 9, , 12]);
                        return [4 /*yield*/, fs.stat(tmpDir)];
                    case 6:
                        stats = _a.sent();
                        if (!stats.isDirectory()) return [3 /*break*/, 8];
                        console.log("\uD83E\uDDF9 Cleaning existing provider directory: ".concat(tmpDir));
                        return [4 /*yield*/, fs.rm(tmpDir, { recursive: true, force: true })];
                    case 7:
                        _a.sent();
                        console.log("\u2705 Cleanup completed");
                        _a.label = 8;
                    case 8: return [3 /*break*/, 12];
                    case 9:
                        cleanupError_1 = _a.sent();
                        if (!(cleanupError_1.code !== 'ENOENT')) return [3 /*break*/, 11];
                        console.warn("\u26A0\uFE0F Directory cleanup warning: ".concat(cleanupError_1.message));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('child_process'); })];
                    case 10:
                        execSync_1 = (_a.sent()).execSync;
                        try {
                            execSync_1("rmdir /s /q \"".concat(tmpDir, "\""), { stdio: 'pipe' });
                            console.log("\u2705 Cleanup completed using Windows rmdir");
                        }
                        catch (rmError) {
                            console.warn("\u26A0\uFE0F Windows rmdir also failed, proceeding anyway: ".concat(rmError));
                        }
                        _a.label = 11;
                    case 11: return [3 /*break*/, 12];
                    case 12: return [4 /*yield*/, fs.mkdir(tmpDir, { recursive: true })];
                    case 13:
                        _a.sent();
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
                        // Read MediaConduit.provider.yml configuration
                        console.log("\uD83D\uDCCB Reading provider configuration from MediaConduit.provider.yml");
                        return [4 /*yield*/, fs.readFile(providerConfigPath, 'utf-8')];
                    case 14:
                        configContent = _a.sent();
                        providerConfig = yaml.parse(configContent);
                        console.log("\u2705 Loaded provider config: ".concat(providerConfig.name, " (").concat(providerConfig.id, ")"));
                        providerInstance = void 0;
                        providerModulePath = path.join(tmpDir, 'src', 'index.ts');
                        providerModuleUrl = new url_1.URL("file://".concat(providerModulePath)).href;
                        return [4 /*yield*/, Promise.resolve("".concat(providerModuleUrl)).then(function (s) { return require(s); })];
                    case 15:
                        providerModule = _a.sent();
                        ProviderClass = providerModule.default || providerModule[providerConfig.id];
                        if (!ProviderClass) {
                            throw new Error("Could not find provider class for ID: ".concat(providerConfig.id, " in ").concat(providerModulePath));
                        }
                        if (!(providerConfig.type === provider_1.ProviderType.LOCAL && providerConfig.serviceUrl)) return [3 /*break*/, 17];
                        serviceRegistry = (0, ServiceRegistry_1.getServiceRegistry)();
                        return [4 /*yield*/, serviceRegistry.getService(providerConfig.serviceUrl, providerConfig.serviceConfig)];
                    case 16:
                        dockerService = _a.sent();
                        providerInstance = new ProviderClass(dockerService); // Assuming constructor takes DockerService
                        return [3 /*break*/, 18];
                    case 17:
                        // For other types of providers, instantiate directly (or with other configs)
                        providerInstance = new ProviderClass();
                        _a.label = 18;
                    case 18:
                        // Cache the provider
                        this.providerCache.set(providerConfig.id, providerInstance);
                        console.log("\u2705 Provider ready: ".concat(providerConfig.name));
                        return [2 /*return*/, providerInstance];
                    case 19:
                        error_3 = _a.sent();
                        // Cleanup on error
                        return [4 /*yield*/, fs.rm(tmpDir, { recursive: true, force: true }).catch(function () { })];
                    case 20:
                        // Cleanup on error
                        _a.sent();
                        throw error_3;
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load provider from local file
     */
    ProviderRegistry.prototype.loadFileProvider = function (parsed) {
        return __awaiter(this, void 0, void 0, function () {
            var providerPath, fs, pathModule, serviceDirectory, providerConfigPath, configContent, providerConfig, providerInstance, providerModulePath, providerModuleUrl, providerModule, ProviderClass, serviceRegistry, dockerService, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        providerPath = parsed.path;
                        if (!providerPath) {
                            throw new Error('File path is required for file provider');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 2:
                        fs = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                    case 3:
                        pathModule = _a.sent();
                        serviceDirectory = providerPath;
                        providerConfigPath = pathModule.join(serviceDirectory, 'MediaConduit.provider.yml');
                        // Read MediaConduit.provider.yml configuration
                        console.log("\uD83D\uDCCB Reading provider configuration from MediaConduit.provider.yml at ".concat(providerConfigPath));
                        return [4 /*yield*/, fs.readFile(providerConfigPath, 'utf-8')];
                    case 4:
                        configContent = _a.sent();
                        providerConfig = yaml.parse(configContent);
                        console.log("\u2705 Loaded provider config: ".concat(providerConfig.name, " (").concat(providerConfig.id, ")"));
                        providerInstance = void 0;
                        providerModulePath = pathModule.join(serviceDirectory, 'src', 'index.ts');
                        providerModuleUrl = new url_1.URL("file://".concat(providerModulePath)).href;
                        return [4 /*yield*/, Promise.resolve("".concat(providerModuleUrl)).then(function (s) { return require(s); })];
                    case 5:
                        providerModule = _a.sent();
                        ProviderClass = providerModule.default || providerModule[providerConfig.id];
                        if (!ProviderClass) {
                            throw new Error("Could not find provider class for ID: ".concat(providerConfig.id, " in ").concat(providerModulePath));
                        }
                        if (!(providerConfig.type === provider_1.ProviderType.LOCAL && providerConfig.serviceUrl)) return [3 /*break*/, 7];
                        serviceRegistry = (0, ServiceRegistry_1.getServiceRegistry)();
                        return [4 /*yield*/, serviceRegistry.getService(providerConfig.serviceUrl, providerConfig.serviceConfig)];
                    case 6:
                        dockerService = _a.sent();
                        providerInstance = new ProviderClass(dockerService); // Assuming constructor takes DockerService
                        return [3 /*break*/, 8];
                    case 7:
                        // For other types of providers, instantiate directly (or with other configs)
                        providerInstance = new ProviderClass();
                        _a.label = 8;
                    case 8:
                        // Cache the provider
                        this.providerCache.set(providerConfig.id, providerInstance);
                        console.log("\u2705 Provider ready: ".concat(providerConfig.name));
                        return [2 /*return*/, providerInstance];
                    case 9:
                        error_4 = _a.sent();
                        throw new Error("Failed to load file provider ".concat(providerPath, ": ").concat(error_4.message));
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate that a loaded provider implements the MediaProvider interface
     */
    ProviderRegistry.prototype.validateProvider = function (provider) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Basic validation: check if it has the core MediaProvider properties
                if (!('id' in provider &&
                    'name' in provider &&
                    'type' in provider &&
                    'capabilities' in provider &&
                    'models' in provider &&
                    typeof provider.configure === 'function' &&
                    typeof provider.isAvailable === 'function' &&
                    typeof provider.getModelsForCapability === 'function' &&
                    typeof provider.getModel === 'function' &&
                    typeof provider.getHealth === 'function')) {
                    throw new Error('Loaded object does not implement the MediaProvider interface');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get providers by capability with priority ordering
     */ ProviderRegistry.prototype.getProvidersByCapability = function (capability) {
        return __awaiter(this, void 0, void 0, function () {
            var providers, textToImagePriority, _i, textToImagePriority_1, priorityId, provider, error_5, _a, _b, id, provider, error_6, _c, _d, id, provider, error_7;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        providers = [];
                        textToImagePriority = [
                            'huggingface-docker', // #1 Priority - Dynamic model loading
                            'falai',
                            'together',
                            'replicate'
                        ];
                        if (!(capability === provider_1.MediaCapability.TEXT_TO_IMAGE)) return [3 /*break*/, 13];
                        _i = 0, textToImagePriority_1 = textToImagePriority;
                        _e.label = 1;
                    case 1:
                        if (!(_i < textToImagePriority_1.length)) return [3 /*break*/, 6];
                        priorityId = textToImagePriority_1[_i];
                        if (!this.providers.has(priorityId)) return [3 /*break*/, 5];
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getProvider(priorityId)];
                    case 3:
                        provider = _e.sent();
                        if (provider.capabilities && provider.capabilities.includes(capability)) {
                            providers.push(provider);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _e.sent();
                        console.warn("Failed to create priority provider ".concat(priorityId, ":"), error_5);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        _a = 0, _b = Array.from(this.providers);
                        _e.label = 7;
                    case 7:
                        if (!(_a < _b.length)) return [3 /*break*/, 12];
                        id = _b[_a][0];
                        if (!!textToImagePriority.includes(id)) return [3 /*break*/, 11];
                        _e.label = 8;
                    case 8:
                        _e.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.getProvider(id)];
                    case 9:
                        provider = _e.sent();
                        if (provider.capabilities && provider.capabilities.includes(capability)) {
                            providers.push(provider);
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        error_6 = _e.sent();
                        console.warn("Failed to create provider ".concat(id, ":"), error_6);
                        return [3 /*break*/, 11];
                    case 11:
                        _a++;
                        return [3 /*break*/, 7];
                    case 12: return [3 /*break*/, 19];
                    case 13:
                        _c = 0, _d = Array.from(this.providers);
                        _e.label = 14;
                    case 14:
                        if (!(_c < _d.length)) return [3 /*break*/, 19];
                        id = _d[_c][0];
                        _e.label = 15;
                    case 15:
                        _e.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, this.getProvider(id)];
                    case 16:
                        provider = _e.sent();
                        if (provider.capabilities && provider.capabilities.includes(capability)) {
                            providers.push(provider);
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        error_7 = _e.sent();
                        console.warn("Failed to create provider ".concat(id, ":"), error_7);
                        return [3 /*break*/, 18];
                    case 18:
                        _c++;
                        return [3 /*break*/, 14];
                    case 19: return [2 /*return*/, providers];
                }
            });
        });
    };
    /**
     * Get all providers as instances (for compatibility with old API)
     */
    ProviderRegistry.prototype.getProviders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var providers, _i, _a, id, provider, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        providers = [];
                        _i = 0, _a = Array.from(this.providers);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        id = _a[_i][0];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getProvider(id)];
                    case 3:
                        provider = _b.sent();
                        providers.push(provider);
                        return [3 /*break*/, 5];
                    case 4:
                        error_8 = _b.sent();
                        console.warn("Failed to create provider ".concat(id, ":"), error_8);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, providers];
                }
            });
        });
    };
    /**
     * Find the best provider for a capability based on availability and criteria
     */
    ProviderRegistry.prototype.findBestProvider = function (capability, criteria) {
        return __awaiter(this, void 0, void 0, function () {
            var providers, filtered, hfProvider, _a, localProvider;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getProvidersByCapability(capability)];
                    case 1:
                        providers = _b.sent();
                        if (criteria === null || criteria === void 0 ? void 0 : criteria.excludeProviders) {
                            filtered = providers.filter(function (p) { return !criteria.excludeProviders.includes(p.id); });
                            if (filtered.length > 0)
                                return [2 /*return*/, filtered[0]];
                        }
                        if (!(capability === provider_1.MediaCapability.TEXT_TO_IMAGE)) return [3 /*break*/, 4];
                        hfProvider = providers.find(function (p) { return p.id === 'huggingface-docker'; });
                        _a = hfProvider;
                        if (!_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, hfProvider.isAvailable()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        if (_a) {
                            return [2 /*return*/, hfProvider];
                        }
                        _b.label = 4;
                    case 4:
                        if (criteria === null || criteria === void 0 ? void 0 : criteria.preferLocal) {
                            localProvider = providers.find(function (p) { return p.type === 'local'; });
                            if (localProvider)
                                return [2 /*return*/, localProvider];
                        }
                        return [2 /*return*/, providers[0]]; // Return first available (already prioritized)
                }
            });
        });
    };
    /**
     * Clear the provider cache
     */
    ProviderRegistry.prototype.clearCache = function () {
        this.providerCache.clear();
    };
    /**
     * Get registry statistics
     */
    ProviderRegistry.prototype.getStats = function () {
        return {
            totalProviders: this.providers.size,
            cachedProviders: this.providerCache.size
        };
    };
    return ProviderRegistry;
}());
exports.ProviderRegistry = ProviderRegistry;
/**
 * Convenience function to get the registry instance
 */
function getProviderRegistry() {
    return ProviderRegistry.getInstance();
}
exports.default = ProviderRegistry;
