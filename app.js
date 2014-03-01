(function(C){

  C.init = function(){
    // C.CommentView = CommentView; //Expose the API to window.
    // C.Comment = Comment;
    /* Create a empty model and view */
    var cv = new CommentView({model: new Comment()});
  };
  var Comment = Backbone.Model.extend({
    /* A model representing a comment. */
    defaults:{
      what:C.config.what,
      where: window.location.href
    },
    url: "http://127.0.0.1:5001/sweets",
    initialize: function(){

    }
  });

  var CommentView = Backbone.View.extend({
    el: $("#comments"),
    template: _.template($("#comment-template").html()),
    events:{
      "click .save": "save"
    },
    initialize: function(){
      // _.bindAll.apply(_, [this].concat(_.functions(this)));
      // _.bind(this.render, this);
//      this.listenTo(this.model, "change", this.render);
      this.render();
    },

    render: function(el){
      $(this.el).append(this.template());
    },

    save: function(){
      /* Create a sweet and send it to the sweet store.
       Update the view to include the comment */
      this.model.set({"how":{"comment":$("textarea.form-control").val()}});
      this.model.set({created: new Date().toUTCString().substr(0, 25)});
      this.model.save(null,{success:function(model){
        new PostedCommentView({model:new
                               Comment(_.clone(model.attributes)[0])});
        $("textarea.form-control").val(""); //Reset the view to have no content.
      }});

    }
  });

  var PostedCommentView = Backbone.View.extend({
    el: "#commented",
    template: _.template($("#commented-template").html()),
    initialize: function(){
      this.render();
    },
    render: function(el){
      content = this.model.toJSON()["how"]["comment"];
      $(this.el).append(this.template({content:content}));
    }

  });
})(C);
