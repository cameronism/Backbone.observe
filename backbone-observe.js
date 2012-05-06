Backbone.Collection.prototype.observe = function (options) {
	options = options || {};

	var filter = options.filter || _.identity,
		map = _.compose(options.map || _.identity, function(model) { return model.toJSON(); }),
		source = this,
		destination = options.collection || new source.constructor();

	function reset() {
		destination.reset(
			_.map(
				source.filter(filter),
				map));
	}

	function handler(evt, model) {
		if (evt == 'add' && filter(model)) {
			destination.add(map(model));
		} else if (evt == 'remove' || evt == 'change') {
			var item = destination.get(model.id);
			if (item) {
				if (evt == 'remove' || !filter(model)) {
					destination.remove(item);
				} else {
					item.set(map(model));
				}
			} else if (evt == 'change' && filter(model)) {
				destination.add(map(model));
			}
		} else if (evt == 'reset') {
			reset();
		}
	}

	source.on('all', handler);

	_.extend(destination, {
		dispose: function() {
			source.off('all', handler);
		},
		setFilter: function(newFilter, options) {
			if (options && options.reset === false) {
				source.forEach(function(model) {
					var previouslyExcluded = !filter(model);

					if (previouslyExcluded != !newFilter(model)) {
						if (previouslyExcluded) {
							destination.add(map(model));
						} else {
							destination.remove(destination.get(model.id));
						}
					}
				});
				filter = newFilter;
			} else {
				filter = newFilter;
				reset();
			}
		}
	});

	reset();
	return destination;
};
