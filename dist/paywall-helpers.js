"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaywallHelpers = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
class PaywallHelpers {
    constructor(params) {
        var _a;
        this.paywallURI = params.paywallURI;
        this.defaultLimits = (_a = params.defaultLimits) !== null && _a !== void 0 ? _a : null;
        this.service = null;
        this.resolverConfig = params.resolversConfig;
    }
    getPaywallPurchase(accountId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield axios_1.default.get(`${this.paywallURI}/getPaywallPurchase/${accountId}`);
                return resp.data;
            }
            catch (error) {
                console.log(error);
                return error;
            }
        });
    }
    getService(serviceName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield axios_1.default.get(`${this.paywallURI}/getService/${serviceName}`);
                this.service = resp.data;
                return resp.data;
            }
            catch (error) {
                console.log(error);
                return error;
            }
        });
    }
    paywallPermissions(config) {
        var _a, _b, _c, _d, _e, _f, _g;
        const paywallPermissions = {};
        for (const resolver in this.resolverConfig) {
            for (const limit of (_c = (_b = (_a = this.service) === null || _a === void 0 ? void 0 : _a.limits) !== null && _b !== void 0 ? _b : this.defaultLimits) !== null && _c !== void 0 ? _c : []) {
                if (paywallPermissions[resolver] !== false) {
                    switch (this.resolverConfig[resolver]) {
                        case "LT": {
                            if (config.currentQuantity[limit.name] <
                                ((_e = (_d = limit.scopes.find((s) => { var _a, _b; return s.paywall._id === ((_b = (_a = config.paywallPurchase) === null || _a === void 0 ? void 0 : _a.paywall) === null || _b === void 0 ? void 0 : _b._id); })) === null || _d === void 0 ? void 0 : _d.quantity) !== null && _e !== void 0 ? _e : 0)) {
                                paywallPermissions[resolver] = true;
                            }
                            else {
                                paywallPermissions[resolver] = false;
                            }
                            break;
                        }
                        case "LTE": {
                            if (config.currentQuantity[limit.name] <=
                                ((_g = (_f = limit.scopes.find((s) => { var _a, _b; return s.paywall._id === ((_b = (_a = config.paywallPurchase) === null || _a === void 0 ? void 0 : _a.paywall) === null || _b === void 0 ? void 0 : _b._id); })) === null || _f === void 0 ? void 0 : _f.quantity) !== null && _g !== void 0 ? _g : 0)) {
                                paywallPermissions[resolver] = true;
                            }
                            else {
                                paywallPermissions[resolver] = false;
                            }
                            break;
                        }
                        default: {
                            paywallPermissions[resolver] = false;
                        }
                    }
                }
            }
        }
        return paywallPermissions;
    }
}
exports.PaywallHelpers = PaywallHelpers;
