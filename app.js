const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}));

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
