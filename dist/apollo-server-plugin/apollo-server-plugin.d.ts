import { PluginDefinition } from "apollo-server-core";
import { Limit } from "../paywall-helpers";
export declare const ApolloServerPluginGraphQLPaywall: <T>(options: {
    paywallURI: string;
    resolversConfig?: Record<Exclude<keyof T, "__typename">, "LT" | "LTE"> | undefined;
    serviceName?: string | undefined;
    defaultLimits?: Limit[] | undefined;
    currentQuantity?: Record<string, number> | undefined;
    config?: {
        createPurchaseContext: boolean;
    } | undefined;
}) => PluginDefinition;
