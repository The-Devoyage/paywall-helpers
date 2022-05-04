export interface Limit {
    name: string;
    scopes: ScopeLimit[];
}
interface ScopeLimit {
    paywall: Paywall;
    quantity: number;
}
export declare type Paywall = {
    _id: string;
    createdAt?: Date;
    created_by?: string;
    description?: string;
    product_id?: string;
    status?: string;
    updatedAt?: Date;
};
export declare type Service = {
    __typename?: "Service";
    _id: string;
    createdAt: Date;
    created_by: string;
    limits: Array<Limit>;
    name: string;
    updatedAt: Date;
    webhook?: string;
};
export declare type PaywallPurchase = {
    _id?: string;
    account?: string;
    createdAt?: Date;
    created_by?: string;
    paywall: Paywall;
    status: string;
    updatedAt?: Date;
};
export declare class PaywallHelpers<T> {
    paywallURI: string;
    defaultLimits: Limit[] | null;
    service: Service | null;
    resolverConfig?: Record<keyof Omit<T, "__typename">, "LT" | "LTE">;
    constructor(params: {
        paywallURI: string;
        defaultLimits?: Limit[];
        resolversConfig?: Record<keyof Omit<T, "__typename">, "LT" | "LTE">;
    });
    getPaywallPurchase(accountId: string): Promise<any>;
    getService(serviceName: string): Promise<any>;
    paywallPermissions(config: {
        currentQuantity: Record<string, number>;
        paywallPurchase?: PaywallPurchase;
    }): Record<string, boolean>;
}
export {};
