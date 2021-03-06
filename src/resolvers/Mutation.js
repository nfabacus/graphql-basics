import uuidv4 from "uuid/v4";

const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some((user) => user.email === args.data.email);
    if(emailTaken) {
      throw new Error('Email taken.');
    }

    const user = {
      id: uuidv4(),
      ...args.data
    };

    db.users.push(user);

    return user;
  },
  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex(user => user.id === args.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const deletedUsers = db.users.splice(userIndex, 1);
    db.posts = db.posts.filter(post => {
      const match = post.author === args.id;
      if(match) {
        db.comments = db.comments.filter(comment => comment.post !== post.id)
      }
      return !match;
    });
    db.comments = db.comments.filter(comment => comment.author !== args.id);

    return deletedUsers[0];
  },
  updateUser(parent, args, { db }, info) {
    const { id, data } = args;
    const user = db.users.find(user => user.id === id);
    if(!user) {
      throw new Error('User not found.');
    }
    if(typeof data.email === 'string') {
      const emailTaken = db.users.some(user => user.email === data.email);

      if(emailTaken) {
        throw new Error("Email already taken");
      }
      user.email = data.email;
    }
    if(typeof data.name === 'string') {
      user.name = data.name;
    }
    if (typeof data.age !== 'undefined') {
      user.age = data.age;
    }
    return user;
  },
  createPost(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some(user => user.id === args.data.author);
    if(!userExists) {
      throw Error('User not found.');
    }
    const post = {
      id: uuidv4(),
      ...args.data
    };

    db.posts.push(post);
    // if published is set to be true, then publish the post to the post channel.
    if (args.data.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post
        }
      });
    }
    return post;
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex(post => post.id === args.id);

    if(postIndex === -1) {
      throw new Error('Post not found.');
    }
    const [deletedPost] = db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter(comment => comment.post !== args.id);
    if (deletedPost.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'DELETED',
          data: deletedPost
        }
      });
    }

    return deletedPost;
  },
  updatePost(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    const post = db.posts.find(post => post.id === id);
    const originalPost = { ...post };

    if(!post) {
      throw new Error("Post not found.");
    }
    if (typeof data.title === "string") {
      post.title = data.title;
    }
    if (typeof data.body === "string") {
      post.body = data.body;
    }
    if (typeof data.published === "boolean") {
      post.published = data.published;

      if (originalPost.published && !post.published) {
        //if the post was published before but not published anymore.  Send public message saying that it is deleted, even though it was not actually deleted in the database. It is just changed to 'unpublished'
        pubsub.publish('post', {
          post: {
            mutation: 'DELETED',
            data: originalPost
          }
        })
      } else if(!originalPost.published && post.published) {
        // if the post was not published before, but now published, send public message saying that it was created, even though the post already existed.
        pubsub.publish('post', {
          post: {
            mutation: 'CREATED',
            data: post
          }
        })
      }
    } else if (post.published) {  //case: post has not been changed and is already published.
      pubsub.publish('post', {
        post: {
          mutation: 'UPDATED',
          data: post
        }
      })
    }

    return post;
  },
  createComment(parent, args, { db, pubsub }, info) {
    const postExists = db.posts.some(post => (post.id === args.data.post) && post.published);
    const userExists = db.users.some(user => user.id === args.data.author);
    if(!postExists) {
      throw Error('Post not found or published');
    }
    if(!userExists) {
      throw Error('User not found');
    }
    const comment = {
      id: uuidv4(),
      ...args.data
    };
    db.comments.push(comment);
    // publish comment to subscription channel.
    pubsub.publish(`comment ${args.data.post}`, {
      comment: {
        mutation: 'CREATED',
        data: comment
      }
    });
    return comment;
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex(comment => comment.id === args.id);
    if(commentIndex === -1) {
      throw new Error("Comment not found");
    }
    const [deletedComment] = db.comments.splice(commentIndex, 1);
    pubsub.publish(`comment ${deletedComment.post}`, {
      comment: {
        mutation: 'DELETED',
        data: deletedComment
      }
    });
    return deletedComment;
  },
  updateComment(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    const comment = db.comments.find(comment => comment.id === id);
    if (!comment) {
      throw new Error("Comment not found.");
    }
    if(typeof data.text === "string") {
      comment.text = data.text;
    }

    pubsub.publish(`comment ${comment.post}`, {
      comment: {
        mutation: 'UPDATED',
        data: comment
      }
    });

    return comment;
  }
};

export { Mutation as default };

