import React from "react";
import { gql, useQuery as useQueryApollo } from "@apollo/client";
import { useQuery as useQueryShopify } from "@shopify/react-graphql";

// Make sure that both the query and the component are exported
export const GET_DOGS_QUERY = gql`
  query GetDogs($first: Int, $offset: Int) {
    dogs(first: $first, offset: $offset) {
      id
      name
      breed
    }
  }
`;

function Dog({useQuery}) {
  const perPage = 1;

  const { loading, error, data, fetchMore } = useQuery(GET_DOGS_QUERY, {
    variables: { first: perPage, offset: 0 }
  });
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  const handleFetchMoreClick = async () => {
    if (!data) {
      return;
    }

    const offset = data.dogs.length;
    // console.log("triggerhandle");

    await fetchMore({
      variables: { first: perPage, offset },
      updateQuery(oldResult, { fetchMoreResult }) {
        // console.log("inupdatequery");
        return {
          ...fetchMoreResult,
          dogs: [...oldResult.dogs, ...fetchMoreResult.dogs]
        };
      }
    });

    return "berp";
  };

  return (
    <>
      <pre>{data.dogs.map((dog) => JSON.stringify(dog)).join("\n")}</pre>
      <button onClick={handleFetchMoreClick}>FetchMore</button>
    </>
  );
}

export function DogWithApolloUseQuery({children}) {
    return <Dog useQuery={useQueryApollo}>{children}</Dog>
}

export function DogWithShopifyUseQuery() {
    return <Dog useQuery={useQueryShopify}>{children}</Dog>
}
