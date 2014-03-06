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
    defaults: function() {
      return {
        'comment':'',
        'replyTo':''
      };
    },
    initialize: function() {
    },
    isValid: function() {
      return true;
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
    },
    comparator: function(model1, model2) {
      if(model1.get('created') < model2.get('created') &&
      model1.get('how')['replyTo'] == model2.get('how')['replyTo']) {
        console.log(model1, model2);
        return 1;
      }
    }
  });

  var CommentView = Backbone.View.extend({
    el: $("#comments-container"),
    tagName: 'div',
    template: _.template($("#commented-template").html()),
    edit_template: _.template($("#comment-template").html()),
    events:{
      "click .save": "save",
      "click .comment button": "reply"
    },
    initialize: function() {
      if(this.model.get('how').get('replyTo').length) {
        var item = '#' + this.model.get('how').get('replyTo');
        this.setElement($(item));
        }
      // this.listenTo(this.model.collection, "add", this.render);
      this.render();
    },
    render: function() {
      if(this.model.isNew()) {
        $(this.el).append(this.edit_template(this.model.toJSON()));
      }
      else {
        $(this.el).append(this.template(this.model.toJSON()));

      }

     },

    save: function(e) {
      /* Create a sweet and send it to the sweet store.
       Update the view to include the comment */
      e.preventDefault();

      this.model.get('how').set({'comment':this.$("textarea.form-control").val()});
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
    initialize: function() {
      this.listenTo(C.comments, "add", this.showOne);

    },
    showOne: function(model) {
      if(model.get('how').isValid === undefined) {
        model.set({'how': new How(model.get('how'))});
      }
      var view = new CommentView({model:model});

    }

  });

})(C);
