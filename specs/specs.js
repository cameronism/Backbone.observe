describe('Backbone-observe', function() {
	var DocumentModel = Backbone.Model.extend({}),
		Documents = Backbone.Collection.extend({ model: DocumentModel }),
		documents;

	function nameAtLeast4Characters(model) {
		return model.get('name').length > 3;
	}

	beforeEach(function () {
		documents = new Documents();
	});

	describe('collection additions', function() {
		it('should forward new items', function() {
			var addCount = 0;
			var moreDocs = documents.observe();

			moreDocs.bind('add', function() {
				addCount++;
			});

			expect(moreDocs.length).toEqual(0);
			documents.add({ id: 10, name: 'hi' });

			expect(moreDocs.length).toEqual(1);
			expect(addCount).toEqual(1);
		});

		it('should map items', function() {
			var moreDocs = documents.observe({
				map: function(attributes) {
					attributes.greeting = attributes.name + ' yo';
					return attributes;
				}
			});

			var addedModel;
			moreDocs.bind('add', function(model) {
				addedModel = model;
			});

			documents.add({ id: 10, name: 'hi' });

			expect(addedModel.attributes.name).toEqual('hi');
			expect(addedModel.attributes.greeting).toEqual('hi yo');
		});

		it('should forward existing items', function() {
			documents.add({ id: 10, name: 'hi' });
			expect(documents.observe().length).toEqual(1);
		});

		it('should be disposable', function() {
			var addCount = 0;
			var moreDocs = documents.observe();

			moreDocs.bind('add', function() {
				addCount++;
			});

			moreDocs.dispose();
			documents.add({ id: 10, name: 'hi' });

			expect(moreDocs.length).toEqual(0);
			expect(addCount).toEqual(0);
		});
	});

	describe('collection deletions', function() {
		it('should forward removals', function() {
			var doc = new DocumentModel({ id: 10, name: 'hi' });
			documents.add(doc);
			var moreDocs = documents.observe();

			expect(moreDocs.length).toEqual(1);
			documents.remove(doc);
			expect(moreDocs.length).toEqual(0);
		});
	});

	describe('changes', function() {
		it('should forward changes', function() {
			var doc = new DocumentModel({ id: 10, name: 'hi' });
			documents.add(doc);
			var moreDocs = documents.observe();

			doc.set({ name: 'bye' });
			expect(moreDocs.get(10).get('name')).toEqual('bye');
		});

		it('should honor map when forwarding changes', function() {
			var doc = new DocumentModel({ id: 10, name: 'hi' });
			documents.add(doc);
			var moreDocs = documents.observe({
				map: function(attr) {
					attr.name = attr.name + '?';
					return attr;
				}
			});

			doc.set({ name: 'bye' });
			expect(moreDocs.get(10).get('name')).toEqual('bye?');
		});
	});

	describe('filters', function() {
		it('should include only matching existing items', function() {
			documents.add([
				{ id: 10, name: 'hi' },
				{ id: 1, name: 'hola' }]);

			var moreDocs = documents.observe({
				filter: nameAtLeast4Characters
			});

			expect(moreDocs.length).toEqual(1);
		});

		it('should include only matching new items', function() {
			var moreDocs = documents.observe({
				filter: nameAtLeast4Characters
			});

			documents.add([
				{ id: 10, name: 'hi' },
				{ id: 1, name: 'hola' }]);

			expect(moreDocs.length).toEqual(1);
		});

		it('should remove items that no longer match', function() {
			documents.add([
				{ id: 10, name: 'hi' },
				{ id: 1, name: 'hola' }]);

			var moreDocs = documents.observe({
				filter: nameAtLeast4Characters
			});

			documents.get(1).set('name', 'cya');

			expect(moreDocs.length).toEqual(0);
		});

		it('should add items that newly match', function() {
			documents.add([
				{ id: 10, name: 'hi' },
				{ id: 1, name: 'hola' }]);

			var moreDocs = documents.observe({
				filter: nameAtLeast4Characters
			});

			documents.get(10).set('name', 'welcome');

			expect(moreDocs.length).toEqual(2);
		});
	});

	describe('resets', function() {
		it('should forward resets', function() {
			var moreDocs = documents.observe();
			documents.reset([{ id: 10, name: 'hi' }]);

			expect(moreDocs.length).toEqual(1);
		});

		it('should still use filters in resets', function() {
			var moreDocs = documents.observe({
				filter: nameAtLeast4Characters
			});
			documents.reset([{ id: 10, name: 'hi' }]);

			expect(moreDocs.length).toEqual(0);
		});
	});

	describe('collection option', function() {
		it('should use an existing collection if provided', function() {
			documents.add({ id: 10, name: 'hi' });
			var moreDocs = new Documents();
			documents.observe({ collection: moreDocs });

			expect(moreDocs.length).toEqual(1);
		});
	});

	describe('changing filter after creation -- setFilter(...)', function() {
		it('should remove items that no longer match the filter', function() {
			documents.add({ id: 10, name: 'hi' });
			var moreDocs = documents.observe();
			var resetCount = 0;
			moreDocs.on('reset', function() { resetCount++; });
			moreDocs.setFilter(nameAtLeast4Characters);
			expect(moreDocs.length).toEqual(0);
			expect(resetCount).toEqual(1);
		});

		describe('nice filter changes -- setFilter(..., { reset: false })', function(){
			it('should remove items that no longer match the filter', function() {
				documents.add({ id: 10, name: 'hi' });
				var moreDocs = documents.observe();
				var resetCount = 0;
				moreDocs.on('reset', function() { resetCount++; });
				moreDocs.setFilter(nameAtLeast4Characters, { reset: false });
				expect(moreDocs.length).toEqual(0);
				expect(resetCount).toEqual(0);
			});

			it('should add items that newly match the filter', function() {
				documents.add({ id: 10, name: 'hola' });
				var moreDocs = documents.observe({
					filter: function() { return false; }
				});
				var resetCount = 0;
				moreDocs.on('reset', function() { resetCount++; });
				moreDocs.setFilter(nameAtLeast4Characters, { reset: false });
				expect(moreDocs.length).toEqual(1);
				expect(resetCount).toEqual(0);
			});

			it('should honor equivalent truthy / falsey values', function() {
				documents.add({ id: 10, name: 'hola' });
				var moreDocs = documents.observe({
					filter: function() { return 1; }
				});
				moreDocs.setFilter(function() { return 2; }, { reset: false });
				expect(moreDocs.length).toEqual(1);
			});

			it('should not throw when removing items that are already gone', function() {
				documents.add({ id: 10, name: 'hi' });
				var moreDocs = documents.observe();
				moreDocs.reset(); // empty
				moreDocs.setFilter(nameAtLeast4Characters, { reset: false });
				expect(moreDocs.length).toEqual(0);
			});
		});
	});

	describe('new items', function() {
		it('should follow models by cid', function() {
			var doc = new DocumentModel({ name: 'hi' });
			documents.add(doc);
			var moreDocs = documents.observe();

			expect(moreDocs.length).toEqual(1);
			doc.set('id', 42);
			expect(moreDocs.length).toEqual(1);
		});
	});
});
