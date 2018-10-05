import { GraphQLServer } from 'graphql-yoga'
import uuidv4 from 'uuid/v4'
// Scalar types - String, Boolean, Int, Float, ID

// Demo user data
const users = [
  {
    id: '1',
    name: 'Bob',
    email: 'bob@emailemail.com',
    age: 30
  },
  {
    id: '2',
    name: 'Mike',
    email: 'mike@emailemail.com',
    age: 43
  },
  {
    id: '3',
    name: 'Bill',
    email: 'bill@emailemail.com',
    age: 45
  },
  {
    id: '4',
    name: 'Sarah',
    email: 'sarah@emailemail.com',
    age: 27
  },
];

const posts = [
  {
    id: '001',
    title: 'My first post',
    body: 'This is my first post.',
    published: true,
    author: '4'
  },
  {
    id: '002',
    title: 'How to make a pancake',
    body: 'This is how to do it.',
    published: false,
    author: '2'
  },
  {
    id: '003',
    title: 'Javascript is great!',
    body: 'It is interesting to learn javascript...',
    published: true,
    author: '2'
  },
  {
    id: '004',
    title: 'What about C++??',
    body: 'Shall I learn C++...?',
    published: true,
    author: '1'
  },
];

const comments = [
  {
    id: '100',
    text: 'This is a great post',
    author: '4',
    post: '001'
  },
  {
    id: '200',
    text: 'This post is cool!',
    author: '2',
    post: '002'
  },
  {
    id: '300',
    text: 'Here is my comments...',
    author: '1',
    post: '004'
  },
];


// Type definition (schema)
const typeDefs = `
  type Query {
    users(query: String): [User!]!
    me: User!
    post: Post!
    posts(query: String): [Post!]!
    comments (query: String): [Comment!]!
  }
  
  type Mutation {
    createUser(name: String!, email: String!, age: Int): User!
    createPost(title: String!, body: String!, published: Boolean!, author: ID!): Post!
    createComment(text: String!, author: ID!, post: ID!): Comment!
  }
  
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!
    comments: [Comment!]!
  }
  
  type Post {
    id: ID!
    title: String!
    body: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }
  
  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users (parent, args, ctx, info) {
      if(!args.query) {
        return users;
      }
      return users.filter(user => {
        return user.name.toLowerCase().includes(args.query.toLowerCase());
      });
    },
    posts(parent, args, ctx, info) {
      if(!args.query) {
        return posts;
      }
      return posts.filter(post => {
        const titleIncludesQuery = post.title.toLowerCase().includes(args.query.toLowerCase());
        const bodyIncludesQuery = post.body.toLowerCase().includes(args.query.toLowerCase());
        return titleIncludesQuery || bodyIncludesQuery;
      });
    },
    comments(parent, args, ctx, info) {
      if(!args.query) {
        return comments;
      }
      return comments.filter(comment => comment.text.includes(args.query));
    },
    me() {
      return {
        id: '123abc',
        name: 'Mike',
        email: 'mike@myemail.com',
        age: 35
      }
    },
    post() {
      return {
        id: '092',
        title: 'GraphQL 101',
        body: 'Hello, World!!!',
        published: true
      }
    },
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      const emailTaken = users.some((user) => user.email === args.email);
      if(emailTaken) {
        throw new Error('Email taken.');
      }

      const user = {
        id: uuidv4(),
        name: args.name,
        email: args.email,
        age: args.age
      };

      users.push(user);

      return user;
    },
    createPost(parent, args, ctx, info) {

      const userExists = users.some(user => user.id === args.author);
      if(!userExists) {
        throw Error('User not found.');
      }
      const post = {
        id: uuidv4(),
        title: args.title,
        body: args.body,
        published: args.published,
        author: args.author
      };

      posts.push(post);

      return post;
    },
    createComment(parent, args, ctx, info) {
      const postExists = posts.some(post => (post.id === args.post) && post.published);
      const userExists = users.some(user => user.id === args.author);
      if(!postExists) {
        throw Error('Post not found or published');
      }
      if(!userExists) {
        throw Error('User not found');
      }
      const comment = {
        id: uuidv4(),
        text: args.text,
        author: args.author,
        post: args.post
      }
      comments.push(comment);
      return comment;
    }
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find(user => user.id === parent.author);
    },
    comments(parent, args, ctx, info) {
      return comments.filter(comment => comment.post=== parent.id);
    }
  },
  Comment: {
    author(parent, args, ctx, info) {
      return users.find(user => user.id === parent.author);
    },
    post(parent, args, ctx, info) {
      return posts.find(post => post.id === parent.post);
    }
  },
  User: {
    posts(parent, args, ctx, info) {
      return posts.filter(post => post.author === parent.id);
    },
    comments(parent, args, ctx, info) {
      return comments.filter(comment => comment.author === parent.id);
    }
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers
});

server.start(() => {
  console.log('The server is up!');
});