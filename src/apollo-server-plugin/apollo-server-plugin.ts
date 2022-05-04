import { PluginDefinition } from "apollo-server-core";
import { FieldNode, OperationDefinitionNode } from "graphql";
import { Limit, PaywallHelpers } from "../paywall-helpers";

export const ApolloServerPluginGraphQLPaywall = <T>(options: {
  paywallURI: string;
  resolversConfig?: Record<keyof Omit<T, "__typename">, "LT" | "LTE">;
  serviceName?: string;
  defaultLimits?: Limit[];
  currentQuantity?: Record<string, number>;
  config?: {
    createPurchaseContext: boolean;
  };
}): PluginDefinition => {
  const { resolversConfig, paywallURI, serviceName, defaultLimits, config } =
    options;

  const paywall = new PaywallHelpers({
    resolversConfig,
    paywallURI,
    defaultLimits,
  });

  return {
    async serverWillStart() {
      if (serviceName) {
        await paywall.getService(serviceName);
      }
    },
    async requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          if (
            config?.createPurchaseContext &&
            requestContext.context?.auth?.payload?.account?._id
          ) {
            const { paywallPurchase } = await paywall.getPaywallPurchase(
              requestContext.context.auth.payload.account._id
            );
            requestContext.context.paywallPurchase = paywallPurchase ?? null;
          }

          if (serviceName) {
            const operationDefinitions =
              requestContext.document.definitions.filter(
                (d) => d.kind === "OperationDefinition"
              ) as OperationDefinitionNode[];

            const fieldNodes = operationDefinitions
              .map((s) =>
                s.selectionSet.selections.filter((sel) => sel.kind === "Field")
              )
              .flat() as FieldNode[];

            const resolverNames: Array<keyof Omit<T, "__typename">> =
              fieldNodes.map(
                (node) =>
                  node.name.value as unknown as keyof Omit<T, "__typename">
              );

            // Clear for introspection from gateway
            if (resolverNames.length === 1 && resolverNames[0] === "_service") {
              return;
            }

            if (!requestContext.context.currentQuantity) {
              throw new Error(
                "Paywall Enforcement Failed: Provide property `currentQuantity` to context."
              );
            }

            const paywallPermissions = paywall.paywallPermissions({
              currentQuantity: requestContext.context.currentQuantity,
              paywallPurchase: requestContext.context.paywallPurchase,
            });

            for (const resolver of resolverNames) {
              if (!paywallPermissions[resolver as string]) {
                throw new Error(
                  `Permission Denied: Paywall Exceeded at "${resolver}".`
                );
              }
            }
          }
        },
      };
    },
  };
};
