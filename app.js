(function(C) {

  C.init = function() {
    // C.CommentView = CommentView; //Expose the API to window.
    // C.Comment = Comment;
    /* Create a empty model and view */
    C.comments = new Comments();
    C.cv = new PostedCommentView({collection: C.comments});
    new CommentView({model: new Comment()});
  };
  var Comment = Backbone.Model.extend({
    /* A model representing a comment. */
    defaults: function() {
      return {
        'who':'',
        'what': C.what,
        'where': window.location.href,
        'how':{
          'comment':'',
          'replyTo':''
        }
      };
    },
    url: "http://127.0.0.1:5001/sweets",
    initialize: function() {
      this.set({"what": C.what});
    }
  });

  var Comments = Backbone.Collection.extend({
    model: Comment,
    url: C.url + C.sweet,
    initialize: function() {
      this.getAll({
        "what":C.what,
        "success": function(data) {
          C.comments.add(data);

        }
      });
    },
    getAll: function(options) {
      /* Get the previous comments */
      if(!options.what) {
        throw Error('"what" option must be passed to get sweets of a URI');
        return false;
      }
      // setting up params
      var what = options.what,
          who = options.who || null;
      url = C.url + C.get + '?what=' + what;
      if(who) {
        url += '&who=' + who;
      }
      // get them!
      this.sync('read', this, {
        url: url,
        success: function() {
          if(typeof options.success === 'function') {
            options.success.apply(this, arguments);
          }
        },
        error: function() {
          if(typeof options.error === 'function') {
            options.error.apply(this, arguments);
          }
        }
      });
    }

  });

  var CommentView = Backbone.View.extend({
    el: $("#comments"),
    template: _.template($("#comment-template").html()),
    events:{
      "click .save": "save"
    },
    initialize: function() {
      this.render();
    },

    render: function(el) {
      $(this.el).append(this.template(this.model.toJSON()));
    },

    save: function(e) {
      /* Create a sweet and send it to the sweet store.
       Update the view to include the comment */
      e.preventDefault();
      this.model.set({'how':{'comment':this.$("textarea.form-control").val(),
                             'replyTo':this.model.get('how')['replyTo']}});
      this.model.set({created: new Date().toUTCString().substr(0, 25)});
      new LoginView({model:this.model});

    }
  });

  var PostedCommentView = Backbone.View.extend({
    el: "#commented",
    events: {
      "click button": "reply"
    },
    template: _.template($("#commented-template").html()),
    initialize: function() {
      this.listenTo(this.collection, "add", this.render);
      this.render();
    },
    render: function(el) {
      _.each(this.collection.models, function(comment) {
        console.log(comment);
        $(this.el).append(this.template(comment.toJSON()));
      }, this);

    },
    reply: function(e) {
      var rep = new Comment({'how':{'replyTo':$(e.currentTarget).attr('for')}});
      $(e.currentTarget).parent().after("<div class='comment-reply'></div>");
      var el = $("#commented .comment-reply");
      new CommentView({model: rep, el:el });
    }

  });
  var LoginView = Backbone.View.extend({
    el: ".modal",
    events:{
      "click #saveButton": "login"
    },
    initialize: function() {
      this.render();
    },
    render: function() {
      $(this.el).modal();
    },
    login: function(model) {
      var username = $("#username").val();
      var password = $("#password").val();

      $.ajax({
        url: "http://127.0.0.1:5001/authenticate",
        type: 'POST',
        data: {user: username, hash: password},
        context: this.model,
        success: function(data) {
          this.set({"who":username});
          $(".modal").modal('toggle');
          this.save(null,{success:function(model) {
            C.comments.add(model);
            $("textarea.form-control").val(""); //Reset the view to have no content.
          }
        });
      }});
    }
  });

})(C);
