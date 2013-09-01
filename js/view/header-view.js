define(['jquery', 'underscore', 'backbone', 'resthub', 'hbs!template/header', 'view/userbar-view', 'view/base-view', 'model/sidebar', 'collection/my-subreddits', 'event/channel', 'cookie'],
	function($, _, Backbone, Resthub, HeaderTmpl, UserbarView, BaseView, SidebarModel, MySubredditsCollection, channel, Cookie) {

		var HeaderView = BaseView.extend({
			el: $("#theHeader"),
			events: {
				'click .tabmenu-right li': 'changeGridOption',
				'click .drop-down-header-toggle': 'toggleDropdown',
				'click .drop-down-header a': 'toggleDropdown' //will close the menu after the user makes a selection
			},

			initialize: function(data) {
				_.bindAll(this);
				this.template = HeaderTmpl;
				this.mySubreddits = new MySubredditsCollection()
				//this.model = new SidebarModel()
				console.log("I should only render the header once")
				this.render();
				this.userbar = new UserbarView({
					root: "#header-bottom-right"
				})

				channel.on("header:update", this.updateHeader, this);
				channel.on("login", this.updateSubreddits, this); //so we update the users subreddits after they login
				channel.on("header:updateSortOrder", this.updateSortOrder, this);

				//load the subreddits on the top bar
				//we want to always display the default subreddits at first because they take a long time to get back from the api
				this.mySubreddits.loadDefaultSubreddits()
				this.displayMySubreddits()
				this.changeActiveGrid($.cookie('gridOption'))
				//this.changeActiveGrid($.cookie('gridOption')) //so we are highlighting the correct grid option on page load

				if (this.checkIfLoggedIn() == true) {
					this.updateSubreddits()

				}

				// this.$() is a shortcut for this.$el.find().

			},
			toggleDropdown: function() {
				this.$('.drop-down-header').toggle()
			},

			updateHeader: function(model) {
				this.model = model
				//this.userbar.render()
				this.$("#pagename-a").prop("href", model.get('rname'))
				this.$("#pagename-a").text(model.get('display_name'))

				this.$("#header-img").attr("src", model.get('header_img'));

				this.$(".hot").prop("href", model.get('rname'))
				this.$(".new").prop("href", model.get('rname') + "/new")
				this.$(".rising").prop("href", model.get('rname') + "/rising")
				this.$(".controversial").prop("href", model.get('rname') + "/controversial")
				this.$(".top").prop("href", model.get('rname') + "/top")

			},
			updateSortOrder: function(sortOrder) {
				if (typeof sortOrder === 'undefined') {
					sortOrder = 'hot'
				}
				this.$('.hot').parent().removeClass('selected');
				this.$('.new').parent().removeClass('selected');
				this.$('.rising').parent().removeClass('selected');
				this.$('.controversial').parent().removeClass('selected');
				this.$('.top').parent().removeClass('selected');
				this.$('.' + sortOrder).parent().addClass('selected');
			},
			updateSubreddits: function() {
				this.mySubreddits.reset()
				//query the api for /me.json
				this.mySubreddits.fetch({
					success: this.displayMySubreddits
				});

			},

			changeGridOption: function(e) {
				e.preventDefault()
				e.stopPropagation();
				var id = this.$(e.currentTarget).attr('id')
				channel.trigger("subreddit:changeGridOption", {
					gridOption: id
				});
				this.changeActiveGrid(id) //so we are highlighting the correct grid option on page load
				$.cookie('gridOption', id, {
					path: '/'
				});
			},
			changeActiveGrid: function(id) {
				if (typeof id === 'undefined' || id == null || id == "") {
					id = 'normal'
				}

				this.$('#normal').removeClass('selected');
				this.$('#small').removeClass('selected');
				this.$('#large').removeClass('selected');
				this.$('#' + id).addClass('selected');
			},

			displayMySubreddits: function(response, subreddits) {

				this.$('#sr-bar').html(" ") //clear the div
				//    Normal Format: 
				//			<li><a href="/r/pics/">pics</a></li>
				//   Every Subreddit after the first one has a seperator:  
				//			<li><span class="separator">-</span><a href= "/r/funny/">funny</a></li>

				var seperator = '';
				var count = 0;
				this.mySubreddits.each(function(model) {
					if (count != 0) {
						seperator = '<span class="separator">-</span>';
					}
					if (model.get('display_name') != "announcements" && model.get('display_name') != "blog") {
						this.$('#sr-bar').append('<li>' + seperator + '<a href="/r/' + model.get('display_name') + '/">' + model.get('display_name') + '</a></li>')
						count++;
					}
				})

				this.displayDropChoices()
			},
			displayDropChoices: function() {
				this.$('.drop-down-header').html(" ") //clear the div

				//format:  <a class="choice" href="/r/AdviceAnimals/">AdviceAnimals</a>

				this.mySubreddits.each(function(model) {
					//this.$('.drop-choices').append('<li>' + seperator + '<a href="/r/' + model.get('display_name') + '/">' + model.get('display_name') + '</a></li>')
					this.$('.drop-down-header').append('<a class="choice" href="/r/' + model.get('display_name') + '/">' + model.get('display_name') + '</a>')
				})

				//add the edit subscriptions button
				this.$('.drop-down-header').append('<a class="choice bottom-option" href="/subreddits/">edit subscriptions</a>')

			},

		});
		//return new HeaderView();
		//return header;
		return HeaderView;
	});