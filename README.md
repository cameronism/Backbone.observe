# Backbone.observe


Extends Backbone.Collection with an observe method which creates new collection that is 
automatically synced, optionally filtered and optionally transformed from the original collection.

The `observe` method accepts the following options (all optional):

- [filter](#filter)
- [map](#map)
- [collection](#collection)

## observe method options

### filter

The `filter` function is given the original model from the source collection.

```javascript
var specialDocs = docs.observe({
  filter: function(doc){
    return doc.attributes.special;
  }
});

docs.reset([ { title: 'lorem', special: true }, { title: 'ipsum' } ]);

console.log(docs.length); 
// 2

console.log(specialDocs.length); 
// 1
```

### map

The `map` function is given a copy of the attributes created with model.toJSON().  
The attributes are safe to modify and return.

```javascript
var importantDocs = docs.observe({
  map: function(attributes){
    attributes.title += '!!!';
    return attributes;
  }
});

docs.reset([ { title: 'lorem', id: 1 } ]);

console.log(importantDocs.get(1).get('title')); 
// lorem!!!

docs.get(1).set('title', 'Lorem Ipsum');

console.log(importantDocs.get(1).get('title')); 
// Lorem Ipsum!!!
```

### collection

The `collection` option can be used to provide an existing collection to observe the source collection.  If the 
`collection` is not used a new collection will be created automatically.

## observing collection methods

### dispose

A `dispose` method is added to the observing collection which should be used to unbind the observing collection 
from the source collection.


```javascript
var observingCollection = sourceCollection.observe();

// ...

// Call dispose to disconnect observingCollection from sourceCollection
observingCollection.dispose();
```


## License

MIT license