# @the-devoyage/paywall-helpers

This library is made to assist, connect, and parse data to/from the `@the-devoyage/graphql-paywall` service in order to enforce paywall limits. 

## Features

### Fetch Paywall Purchase
  
Fetch the `PaywallPurchase` associated with an account in order to check the payment status and access level (purchased product).

### Fetch Service

Fetch the `Service` details to get the limits that should be enforced within the service.

### Set Default Paywall Limits

If service details fail to fetch, fall back to default paywall limits.

### Configure Operation Limits

Each operation may uniquely enforce the limit set within the default limits/fetched service limits.

### Parse Permissions 

A helper to check between limits and the current user's status. It returns an object with the permission status for each operation within the API.

### Apollo Server Plugin

Manually use each feature above to customize your paywall, or simply use the provided Apollo Server Plugin to quickly enforce Paywall Limits.

## Install

1. Login to the github registry with your github account.

```
npm login --registry=https://npm.pkg.github.com
```

2. In the root of the target project, add the following to the `.npmrc` file:

```
@the-devoyage:registry=https://npm.pkg.github.com
```

3. Install

```
npm i @the-devoyage/paywall-helpers
```

## Usage

### Apollo Server Plugin

The `ApolloServerPluginGraphQLPaywall` plugin is the easiest way to use this library.


**For a Subgraph:**

1. Import and provide the plugin to the Apollo Server.
  - `paywallURI` - The URI of the `graphql-paywall` server.
  - `serviceName` - The name of the service, should match the name given to the `Service` document created within the `graphql-paywall` server.
  - `resolversConfig` - How each resolver handles the comparison of the current quantity of enforced criteria vs the limit allowed.
  - `defaultLimits` - An array of `Limit`s scoped to a particular paywall. If the server fails to fetch the `Service` from the `graphql-paywall` server, these limits will be enforced.

```ts
import { ApolloServerPluginGraphQLPaywall } from "@the-devoyage/paywall-helpers";
import { Helpers } from "@the-devoyage/micro-auth-helpers";

const apolloServer = new ApolloServer({
  schema: schema,
  plugins: [
    ApolloServerPluginGraphQLPaywall<Query & Mutation>({
      paywallURI: "http://localhost:5010",
      serviceName: "users",
      resolversConfig: {
        getUsers: "LTE",
        updateUser: "LTE",
        me: "LTE",
        deleteUser: "LTE",
        inviteUser: "LT",
        loginUser: "LTE",
        switchUserMembership: "LTE",
      },
      defaultLimits: [
        {
          name: "activeUsers",
          scopes: [
            {
              paywall: {
                _id: "626b0eefdcdf4efcc17164d1",
              },
              quantity: 3,
            },
          ],
        },
      ],
    }),
  ],
});
```

2. Create the required context.
  - `auth` - This required property is provided by the `micro-auth-helpers` library, but you may also provide it manually.

    ```ts
    export interface Context extends Record<string, any> {
      auth: AuthContext;
    }

    export interface AuthContext {
      payload: Payload;
      isAuth: boolean;
    }

    export interface Payload extends jwt.JwtPayload {
      account: { _id: string; email: string } | null;
      user: { _id: string; role: number; email: string } | null;
    }
    ```

  - `currentQuantity` - A record with keys that match the limit names that were previously provided with a value representing the current quantity of the associated asset.

```ts
import { ApolloServerPluginGraphQLPaywall } from "@the-devoyage/paywall-helpers";
import { Helpers } from "@the-devoyage/micro-auth-helpers";

const apolloServer = new ApolloServer({
  schema: schema,
  context: async ({ req }) => {
    // This helper provides the required auth context.
    const context = Helpers.Subgraph.GenerateContext({
      req,
    });

    context.currentQuantity = {
      activeUsers: await User.count({
        "memberships.account": context.auth.payload.account?._id,
        "memberships.status": "ACTIVE",
      }),
    };

    return context;
  },
  plugins: [
    // ...
  ],
});
```

**For a Gateway:**

1. Import and provide the plugin to the Apollo Server.
2. Set the `createPurchaseContext` variable to true. This will automatically fetch the `PaywallPurchase` and add it to the request context.


  ```ts
  import { ApolloServerPluginGraphQLPaywall } from "@the-devoyage/paywall-helpers";
  import { Helpers } from "@the-devoyage/micro-auth-helpers";

  const apolloServer = new ApolloServer({
    gateway,
    context: async ({ req }) => {
      const context = await Helpers.Gateway.GenerateContext({
        headers: ["Authorization"],
        req,
        secretOrPublicKey: process.env.JWT_ENCRYPTION_KEY,
      });
      return context;
    },
    plugins: [
      ApolloServerPluginGraphQLPaywall({
        paywallURI: "http://localhost:5010",
        config: { createPurchaseContext: true },
      }),
    ],
  });
  ```

### Using The `PaywallHelpers` Class

If you are not using the Apollo Server Plugin as described above, you may use the `PaywallHelpers` class to achieve a more custom setup.

1. Create a new instance of the `PaywallHelpers`.

```ts
const paywall = new PaywallHelpers({
  paywallURI,
  resolversConfig,
});
```

2. Access The `PaywallHelpers` methods.

```ts
const paywallPurchase = await getPaywallPurchase(account_id: string); 

const service = await getService(service_name: string);

const paywallPermissions = paywallPermissions(
  currentQuantity: Record<string, number>;
  paywallPurchase?: PaywallPurchase;
);
``` 
