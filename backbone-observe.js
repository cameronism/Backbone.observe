Backbone.Collection.prototype.observe = function (options) {
	options = options || {};

	var source = this,
		destination = options.collection || new source.constructor(),
		filter = options.filter || _.identity,
		map;

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
			var item = destination.getByCid(model.cid);
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
							destination.remove(destination.getByCid(model.cid));
						}
					}
				});
				filter = newFilter;
			} else {
				filter = newFilter;
				reset();
			}
		},
		setMap: function(newMap) {
			newMap = newMap || _.identity;

			map = function (model) {
				var cid = model.cid;
				model = new destination.model(newMap(model.toJSON(), model));
				model.cid = cid;
				return model;
			};

			reset();
		}
	});

	destination.setMap(options.map);
	return destination;
};
