import { graphql, print } from "graphql";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} from "graphql";
import { ApolloLink, Observable } from "@apollo/client";

const DogType = new GraphQLObjectType({
  name: "Dog",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    breed: { type: GraphQLString }
  }
});

let dogData = [
  { id: "1", name: "Buck", breed: "bulldog" },
  { id: "2", name: "Blueberry", breed: "poodle" },
  { id: "3", name: "Mozzarella", breed: "corgi" }
];

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    dogs: {
      type: GraphQLList(DogType),
      args: {
        first: { type: GraphQLInt, defaultValue: 2 },
        offset: { type: GraphQLInt, defaultValue: 0 }
      },
      resolve: (_, { first, offset }) => {
        return dogData.slice(offset, offset + first);
      }
    }
  }
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {}
});

const schema = new GraphQLSchema({ query: QueryType, mutation: MutationType });

function delay(wait) {
  return new Promise((resolve) => setTimeout(resolve, wait));
}

export const link = new ApolloLink((operation) => {
  return new Observable(async (observer) => {
    const { query, operationName, variables } = operation;
    await delay(300);
    try {
      const result = await graphql({
        schema,
        source: print(query),
        variableValues: variables,
        operationName
      });
      observer.next(result);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
});
