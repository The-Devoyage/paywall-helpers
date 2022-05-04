"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloServerPluginGraphQLPaywall = void 0;
const tslib_1 = require("tslib");
const paywall_helpers_1 = require("../paywall-helpers");
const ApolloServerPluginGraphQLPaywall = (options) => {
    const { resolversConfig, paywallURI, serviceName, defaultLimits, config } = options;
    const paywall = new paywall_helpers_1.PaywallHelpers({
        resolversConfig,
        paywallURI,
        defaultLimits,
    });
    return {
        serverWillStart() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (serviceName) {
                    yield paywall.getService(serviceName);
                }
            });
        },
        requestDidStart() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                return {
                    didResolveOperation(requestContext) {
                        var _a, _b, _c, _d;
                        return tslib_1.__awaiter(this, void 0, void 0, function* () {
                            if ((config === null || config === void 0 ? void 0 : config.createPurchaseContext) &&
                                ((_d = (_c = (_b = (_a = requestContext.context) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.payload) === null || _c === void 0 ? void 0 : _c.account) === null || _d === void 0 ? void 0 : _d._id)) {
                                const { paywallPurchase } = yield paywall.getPaywallPurchase(requestContext.context.auth.payload.account._id);
                                requestContext.context.paywallPurchase = paywallPurchase !== null && paywallPurchase !== void 0 ? paywallPurchase : null;
                            }
                            if (serviceName) {
                                const operationDefinitions = requestContext.document.definitions.filter((d) => d.kind === "OperationDefinition");
                                const fieldNodes = operationDefinitions
                                    .map((s) => s.selectionSet.selections.filter((sel) => sel.kind === "Field"))
                                    .flat();
                                const resolverNames = fieldNodes.map((node) => node.name.value);
                                // Clear for introspection from gateway
                                if (resolverNames.length === 1 && resolverNames[0] === "_service") {
                                    return;
                                }
                                if (!requestContext.context.currentQuantity) {
                                    throw new Error("Paywall Enforcement Failed: Provide property `currentQuantity` to context.");
                                }
                                const paywallPermissions = paywall.paywallPermissions({
                                    currentQuantity: requestContext.context.currentQuantity,
                                    paywallPurchase: requestContext.context.paywallPurchase,
                                });
                                for (const resolver of resolverNames) {
                                    if (!paywallPermissions[resolver]) {
                                        throw new Error(`Permission Denied: Paywall Exceeded at "${resolver}".`);
                                    }
                                }
                            }
                        });
                    },
                };
            });
        },
    };
};
exports.ApolloServerPluginGraphQLPaywall = ApolloServerPluginGraphQLPaywall;
