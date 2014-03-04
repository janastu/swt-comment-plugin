(function(C) {

  C.init = function() {
    // C.CommentView = CommentView; //Expose the API to window.
    // C.Comment = Comment;
    /* Create a empty model and view */
    C.comment = new Comment();
    C.comments = new Comments();
    C.cv = new CommentView({collection: C.comments});
    C.comments.add(C.comment);
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
    template: _.template($("#commented-template").html()),
    edit_template: _.template($("#comment-template").html()),
    events:{
      "click .save": "save",
      "click .comment button": "reply"
    },
    initialize: function() {
      this.listenTo(this.collection, "add", this.render);
    },

    render: function(model) {
    console.log(model);
      if(model.get('how')['comment'].length) {
        $(this.el).append(this.template(model.toJSON()));
      }
      else {
        $(this.el).append(this.edit_template(model.toJSON()));
      }


    },

    save: function(e) {
      /* Create a sweet and send it to the sweet store.
       Update the view to include the comment */
      e.preventDefault();
      this.model.set({'how':{'comment':this.$("textarea.form-control").val(),
                             'replyTo':this.model.get('how')['replyTo']}});
      this.model.set({created: new Date().toUTCString().substr(0, 25)});
      new LoginView({model:this.model});

    },
    reply: function(e) {
      e.preventDefault();
      var rep = new Comment();
      rep.set({'how':{'replyTo':$(e.currentTarget).attr('for'),
                     'comment':''}});
      C.comments.add(rep);
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
