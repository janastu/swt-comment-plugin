(function(C) {

  C.init = function() {
    /* Create a empty model and view */
    C.comment = new Comment({'how': new How()});
    C.comments = new Sweets();
    /* Create the app, the app sets up event handler for the Comments collection */
    var App = new AppView;

    C.comments.add(C.comment); //Add the empty model to the collection.

  };
  var How = Backbone.Model.extend({
    defaults: {
        'comment':'',
        'replyTo':''
    },
    initialize: function() {
    }
  });
  var Comment = Backbone.Model.extend({
    /* A model representing a comment. */
    url: function() {
        return C.url + C.sweet;
      },
    defaults: function() {
      return {
        'who':'',
        'what':C.what,
        'where': window.location.href,
        'how': ''
      };
    },

    initialize: function() {
    },
    toJSON: function() {
      return JSON.parse(JSON.stringify(this.attributes));
    }
  });

  var Sweets = Backbone.Collection.extend({
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

  // var Sweets = Backbone.Collection.extend({
  //   model: Comment,
  //   url: C.url + C.get + '?what=' + C.what,
  //   initialize: function() {
  //     this.sync('read', this, {
  //       url: this.url
  //     });
  //   }
  // });
  var CommentView = Backbone.View.extend({
    tagName: 'div',
    template: _.template($("#commented-template").html()),
    edit_template: _.template($("#comment-template").html()),
    events:{
      "click .save": "save",
      "click .comment button": "reply"
    },
    intialize: function() {
      this.listenTo(this.model, "save", this.render);

    },
    render: function() {
      if(this.model.get('how').get('comment').length) {
        if(this.model.get('how').get('replyTo').length) {
          var item = '#' + this.model.get('how')['replyTo'];
          var el = $(item).parent();
          $(el).append(this.template(this.model.toJSON()));
        }
        else{
          console.log(this.model.toJSON());
          $(this.el).append(this.template(this.model.toJSON()));
        }
      }
      else {
        $(this.el).append(this.edit_template(this.model.toJSON()));
      }
      return this;

    },

    save: function(e) {
      /* Create a sweet and send it to the sweet store.
       Update the view to include the comment */
      e.preventDefault();
      this.model.set({'how': new How({'comment':this.$("textarea.form-control").val()})});
      this.model.set({created: new Date().toUTCString().substr(0, 25)});
      new LoginView({model:this.model});

    },
    reply: function(e) {
      e.stopPropagation();
      e.preventDefault();
      var rep = new Comment({'how': new How({'replyTo':$(e.currentTarget).attr('for')})});
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
        url: C.url + C.auth,
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

  var AppView = Backbone.View.extend({
    el: $("#comments"),
    initialize: function() {
      this.listenTo(C.comments, "add", this.showOne);

    },
    showOne: function(model) {
      model.set({'how': new How(model.get('how'))});
      var view = new CommentView({model:model});
      $(this.el).append(view.render().el);
    }

  });

})(C);
