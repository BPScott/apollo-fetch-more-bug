import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import { ApolloProvider } from "@apollo/client/react";
import { createGraphQLFactory } from "@shopify/graphql-testing";
import { DogWithApolloUseQuery } from "./Dog";

const mocks = {
  GetDogs: ({ variables: { first, offset } }) => {
    const allDogs = [
      { id: 4, name: "Bob", breed: "sheepdog" },
      { id: 5, name: "Cliff", breed: "wolfhound" }
    ];

    return {
      dogs: allDogs.slice(offset, offset + first)
    };
  }
};

const createGraphQL = createGraphQLFactory();

function MockProvider({ client, children }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

it("should render after fetching more dogs", async () => {
  const graphQL = createGraphQL(mocks);
  graphQL.wrap((resolve) => act(resolve));

  render(
    <MockProvider client={graphQL.client}>
      <DogWithApolloUseQuery />
    </MockProvider>
  );
  expect(await screen.getByText("Loading...")).toBeInTheDocument();

  await graphQL.resolveAll();

  expect(
    await screen.getByText('{"id":4,"name":"Bob","breed":"sheepdog"}')
  ).toBeInTheDocument();

  // Get the FetchMore button
  const button = await screen.getByText("FetchMore");
  
  // Click the button - this puts the promise for the fetchMore call onto the
  // stack. This promise will stay pending untill you run grapQL.resolveAll()
  const promise = button.click();
  // Resolve the newly added data request
  await graphQL.resolveAll();
  // Await the response of the promise
  await promise;


  // Putting awaiting an extra tick resolves shall cause the promise to update
  // Suggesting that the resolution of storing data to cache happens outside
  // the realm of the `await promise` call above.
  // await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(
    await screen.getByText('{"id":5,"name":"Cliff","breed":"wolfhound"}', {
      exact: false
    })
  ).toBeInTheDocument();
});
