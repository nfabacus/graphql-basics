const Subscription = {
  // count: {
  //   subscribe(parent, args, { pubsub }, info) {
  //     let count = 0;
  //     setInterval(() => {
  //       count++;
  //       pubsub.publish('count', {
  //         count
  //       })
  //     }, 1000);
  //     return pubsub.asyncIterator('count');
  //   }
  // },
  post: {
    subscribe(parent, args, { db, pubsub }, info) {
      return pubsub.asyncIterator('post');
    }
  },
  comment: {
    subscribe(parent, { postId }, { db, pubsub }, info) {
      // Just checking first if the post exists.
      const post = db.posts.find(post => post.id === postId && post.published);
      if (!post) {
        throw new Error('Post not found.');
      }
      // if the postId exists, then create a channel called 'comment <postId>' and subscribe to it.
      // Then, in mutation, we can publish the change to this channel.
      return pubsub.asyncIterator(`comment ${postId}`);
    }
  }
};

export { Subscription as default };