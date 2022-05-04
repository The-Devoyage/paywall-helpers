import axios from "axios";

export interface Limit {
  name: string;
  scopes: ScopeLimit[];
}

interface ScopeLimit {
  paywall: Paywall;
  quantity: number;
}

export type Paywall = {
  _id: string;
  createdAt?: Date;
  created_by?: string;
  description?: string;
  product_id?: string;
  status?: string;
  updatedAt?: Date;
};

export type Service = {
  __typename?: "Service";
  _id: string;
  createdAt: Date;
  created_by: string;
  limits: Array<Limit>;
  name: string;
  updatedAt: Date;
  webhook?: string;
};

export type PaywallPurchase = {
  _id?: string;
  account?: string;
  createdAt?: Date;
  created_by?: string;
  paywall: Paywall;
  status: string;
  updatedAt?: Date;
};

export class PaywallHelpers<T> {
  paywallURI: string;
  defaultLimits: Limit[] | null;
  service: Service | null;
  resolverConfig?: Record<keyof Omit<T, "__typename">, "LT" | "LTE">;

  constructor(params: {
    paywallURI: string;
    defaultLimits?: Limit[];
    resolversConfig?: Record<keyof Omit<T, "__typename">, "LT" | "LTE">;
  }) {
    this.paywallURI = params.paywallURI;
    this.defaultLimits = params.defaultLimits ?? null;
    this.service = null;
    this.resolverConfig = params.resolversConfig;
  }

  async getPaywallPurchase(accountId: string) {
    try {
      const resp = await axios.get(
        `${this.paywallURI}/getPaywallPurchase/${accountId}`
      );
      return resp.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getService(serviceName: string) {
    try {
      const resp = await axios.get(
        `${this.paywallURI}/getService/${serviceName}`
      );
      this.service = resp.data;
      return resp.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  paywallPermissions(config: {
    currentQuantity: Record<string, number>;
    paywallPurchase?: PaywallPurchase;
  }) {
    const paywallPermissions: Record<string, boolean> = {};

    for (const resolver in this.resolverConfig) {
      for (const limit of this.service?.limits ?? this.defaultLimits ?? []) {
        if (paywallPermissions[resolver] !== false) {
          switch (this.resolverConfig[resolver]) {
            case "LT": {
              if (
                config.currentQuantity[limit.name] <
                (limit.scopes.find(
                  (s) => s.paywall._id === config.paywallPurchase?.paywall?._id
                )?.quantity ?? 0)
              ) {
                paywallPermissions[resolver] = true;
              } else {
                paywallPermissions[resolver] = false;
              }
              break;
            }
            case "LTE": {
              if (
                config.currentQuantity[limit.name] <=
                (limit.scopes.find(
                  (s) => s.paywall._id === config.paywallPurchase?.paywall?._id
                )?.quantity ?? 0)
              ) {
                paywallPermissions[resolver] = true;
              } else {
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
