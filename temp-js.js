/**
 * Created by hwx336970 on 2017.01.18
 * 
 * @memberOf UCD
 * @class Sliding
 * @augments UCD.Widget 
 */
UCD.registerWidget('Sliding', function(SUPER) {
	var $ = UCD.require('jquery');
	return {
		options: {
			autoPlay: false,
			loop: false,
			initIndex:0,
			duration: 500,
			interval: 3000,
			onChanged: $.noop,
			//should with style "white-space:nowrap;overflow:hidden"
			slideSelector: '.sliding-content',
			prevSelector: '.prev',
			nextSelector: '.next'
		},

		_create: function() {
			SUPER._create.call(this);
			this.timer = null;
			this.current = 0;
		},

		_init: function() {
			var
				opts = this.options,
				ele = this.element;

			this.$box = opts.slideSelector !== '' ? ele.find(opts.slideSelector) : this.element;
			this._on(this.$prev = ele.find(opts.prevSelector), {
				'click': 'prev'
			});
			this._on(this.$next = ele.find(opts.nextSelector), {
				'click': 'next'
			});

			this.element.on('click', [opts.prevSelector, opts.nextSelector].join(','), $.proxy(this.pause, this));
			this.go(opts.initIndex);
			if(opts.autoPlay) this.play();
		},

		getCurrent: function() {
			//in order to respond to the window,recount the cuttent index every time
			return this.current = this.$box.scrollLeft() === 0 ? 0 : Math.ceil(this.$box.scrollLeft()/this.$box.width());
		},

		prev: function() {
			this.getCurrent();
			this.go(--this.current);
			return this;
		},

		next: function() {
			this.getCurrent();
			this.go(++this.current);
			return this;
		},

		go: function(index) {
			var
				_this = this,
				loop = this.options.loop,
				childen = this.$box.children(),
				//need the items equal width
				max_i = Math.floor(childen.length * childen.outerWidth(true) / this.$box.width());

			this.current = index = index < 0 ? (loop ? max_i : 0) : index > max_i ? (loop ? 0 : max_i) : index;
			if(!loop){
				this.$prev.toggleClass('disabled',this.current === 0);
				this.$next.toggleClass('disabled',this.current === max_i);
			}
			
			this.$box.stop().animate({
				'scrollLeft': this.element.width() * index
			}, this.options.duration, 'swing', function() {
				//call chenged
				_this.options.onChanged.call(_this, index);
				if(_this.options.autoPlay && !_this.timer) _this.play();
			});
			return this;
		},

		play: function() {
			this.timer = window.setInterval($.proxy(this.next, this), this.options.interval);
			return this;
		},

		pause: function() {
			window.clearInterval(this.timer);
			this.timer = null;
			return this;
		}
	};
});
