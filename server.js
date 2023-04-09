const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const { buildSchema } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const dotenv = require('dotenv');

// Store sensitive information to env variables
dotenv.config();

//mongoDB Atlas Connection String
mongoose.set('strictQuery', true);
const mongodb_atlas_url = process.env.MONGODB_URL;
const port = process.env.PORT;

// Connect to DB
mongoose.connect(mongodb_atlas_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define the user schema
const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    password: String!
  }

  type Employee {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
  }

  type Query {
    getUserById(id: ID!): User
    getAllEmployees: [Employee]
    getEmployeeById(id: ID!): Employee
  }

  type Mutation {
    addUser(username: String!, password: String!): User
    login(username: String!, password: String!): User
    createEmployee(
        firstname: String!
        lastname: String!
        email: String!
        gender: String!
        city: String!
        designation: String!
        salary: Float!
    ): Employee
    updateEmployee(
        id: String!
        firstname: String
        lastname: String
        email: String
        gender: String
        city: String
        designation: String
        salary: Float
    ): Employee
    deleteEmployee(id: String!): Employee
    logout: String
  }
`);

// Define the user model
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Define the employee model
const Employee = mongoose.model('Employee', {
    id: String,
    firstname: String,
    lastname: String,
    email: String,
    gender: String,
    city: String,
    designation: String,
    salary: Number
});

// Define the resolvers
const rootValue = {
  getUserById: async ({ id }) => {
    return await User.findById(id);
  },
  addUser: async ({ username, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    return user;
  },
  login: async ({ username, password }) => {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('Invalid username or password');
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET);
    req.session.user_id = user._id;
    return token;
    // return user;
  },
  getAllEmployees: async () => {
    return await Employee.find({});
  },
  getEmployeeById: async ({ id }) => {
    return await Employee.findById(id);
  },
  createEmployee: async ({ firstName, lastName, email, phone }) => {
    const employee = new Employee({ firstName, lastName, email, phone });
    await employee.save();
    return employee;
  },
  updateEmployee: async ({ id, ...update }) => {
    return await Employee.findByIdAndUpdate(id, update, { new: true });
  },
  deleteEmployee: async ({ id }) => {
    return await Employee.findByIdAndDelete(id);
  },
  logout: async (_, { res }) => {
    res.clearCookie('user_id');
    req.session.destroy();
    return 'Logged out successfully';
  }
};

// Create an Express app and define the GraphQL route
const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
}));

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});