# redux-facet-pagination

A plug-in pagination system for [`redux-facet`](https://github.com/Bandwidth/redux-facet) which lets you add pagination to various types of collections without repeating yourself too much.

After you've integrated `redux-facet`, you can enhance your containers and reducers to enable them to keep track of pagination state and render paginated data.

[Check out a simple example here](http://dev.bandwidth.com/redux-facet-pagination/). The source is located in [/example](https://github.com/Bandwidth/redux-facet-pagination/tree/master/example).

## Immutable.js Support

To use `redux-facet-pagination` with `immutable`, import all modules from `@bandwidth/redux-facet-pagination/immutable`. Module names and usages stay the same.

## Documentation

### Default export: `withPaginatedData(selectItems: Function|String, options: Object)`

A higher-order-component which enhances a `facet` container with:

1. Access to a paginated slice of provided data
2. Access to pagination information (current page, page size)
3. A set of action creator props which allow page navigation

The first parameter of `withPaginatedData` is required. If you provide a function, this function must be a selector function which will retrieve your items list from the Redux state. If you provide a string, this string must be a prop name. The container will assume that this prop is provided with your items list and will paginate the data accordingly.

The last parameter for `withPaginatedData()` is `options`:

```js
{
  dataPropName: String = 'filteredData',
}
```

`dataPropName` will let you change the prop name of the paginated data when it's provided to your wrapped component.

#### Using `withPaginatedData()`

Compose `withPaginatedData()` after `facet()` before passing in your component:

```javascript
// selector function version
facet('users')(
  withPaginatedData(selectUsers)( // selecting our own data list from the store
    ViewComponent
  ),
);

// prop name version
facet('users')(
  withPaginatedData('users')( // assuming that the container is provided with a `users` prop
    ViewComponent
  )
)
```

To make things more idiomatic, it's recommented to use [`recompose`](https://github.com/acdlite/recompose):

```javascript
compose(
  facet('users'),
  withPaginatedData(selectUsers),
)(ViewComponent);
```

Remember, `withPaginatedData()` must come *after* `facet()`.

#### Properties provided

A component enhanced using `withPaginatedData()` will receive the following props:

* `paginatedData | [dataPropName]`
  * The paginated dataset will be supplied to a prop name you can define yourself via `options`. By default, this prop will be `paginatedData`.
* `currentPage`
  * The page number of the currently displayed page
* `pageSize`
  * The size of a page. You can specify pageSize as a prop to your container, which will seed this value.
* `pageCount`
  * The total number of pages, based on the length of the raw data array.
* `setPage(page: Number, pageSize: Number)`
  * Action creator function which is already bound to this facet.
  * Call it to set the current page and/or change the page size.
* `nextPage()`
  * Action creator function which is already bound to this facet.
  * Call it to advance to the next page.
  * This will not advance past the last page according to `pageCount`.
* `previousPage()`
  * Action creator function which is already bound to this facet.
  * Call it to go back one page.
  * This will not go below page 0.

#### Setting the Page Size

`redux-facet-pagination` defaults to a page size of `10`. To initialize, a container enhanced with `redux-facet-pagination` will dispatch a `setPage` action on mount with the current page properties (so if the component was mounted with `currentPage=2` and `pageSize=3`, an action will be dispatched which sets those values in the store).

To set the page size, you can provide the `pageSize` prop to your container. When the container dispatches the initializing action, it will utilize your provided value. Consider using `recompose`'s `withProps` helper within your container definition if you don't need the page size to change.

You can also change the page size at any time by providing it as a second parameter to `setPage`. This can enable patterns where the user is allowed to customize the number of items they want to see on the screen.

### `withPagination(selectItems)`

A lighter-weight higher-order-component that just provides pagination data, but does not compute a paginated list. `withPagination` will provide `currentPage`, `pageSize`, `pageCount`, `setPage`, `nextPage`, and `previousPage`.

`selectItems` has the same usage as `withPaginatedData`. It's required to calculate the total page count.

This smaller container may be useful if you want to implement your pagination controls as a separate container from your data view.

### `paginationReducer`

Include this reducer within your facet reducers to track pagination state.

This reducer expects to be mounted within a facet reducer. If this is done correctly, it will therefore only listen to pagination actions related to its facet.

#### Basic usage

To mount it manually, please reference the `.key` property to mount it at the correct location in your facet reducer, or the library will not work.

```javascript
const facetReducr = facetReducer('users', combineReducers({
  foo: fooReducer,
  bar: barReducer,
  [paginationReducer.key]: paginationReducer,
}));
```

#### Automatic usage

> Note: `mount` will not work with `combineReducers`, since `combineReducers` ignores any 'extra' keys that get added to the resulting map.

You can mount the `paginationReducer` automatically into your facet reducer using its `.mount(facetReducer: Function)` function. By calling it with your facet reducer, it will return a new reducer and mount itself at the correct key. Your base reducer must return a state which is an object so that a key can be created for the alert reducer.

```javascript
const enhancedFacetReducer = paginationReducer.mount(facetReducer);
```

### `paginationActions`

The library exports a set of action creators which you can use to manage pagination within sagas or other parts of your code.

The action creators are:

* `paginationActions.setPage(page: Number, pageSize: Number)`: sets the current page, and optionally updates the page size.

#### NOTE: facet name metadata is required

`redux-facet-pagination` does not apply facet names to actions created by its action creators. It's up to you to apply them if necessary. If you use the action creators provided to your component by `withPagination`, these will be applied automatically. Likewise, if you use these action creators in a saga which is created with `facetSaga`, the facet name will be applied.

To apply a facet name to an action, use `redux-facet`'s `withFacet` helper function.

### `createPaginationSelectors(itemsSelector: Function)`

A helper factory which returns a set of facet selectors you can use to select data based on pagination.

Pass a selector function which returns an array of items. An object will be returned which contains a few selector creators you can use in your `facet` container:

* `createPageSelector(facetName)`: creates a selector which returns the current page of data from your items.
* `createPageCountSelector(facetName)`: creates a selector which returns the total number of pages based on the number of items and the page size.

#### Example Usage

```javascript
const selectors = createPaginationSelectors(selectUsers);

const FacetContainer = facet(
  'users',
  // a helper from the redux-facet library
  // which applies the facetName to all selector creators
  createStructuredFacetSelector({
    pageCount: selectors.createPageCountSelector,
    items: selectors.createPageSelector,
  }),
)(ViewComponent);
```

### `paginationSelectors`

`redux-facet-pagination` ships with a few selector creators and selectors which can be used to read pagination data from the store and construct pages from your data.

* `paginationSelectors.createPaginationSelector(facetName: String)`
  * A function which creates a selector. Takes one parmeter, `facetName`.
  * The created selector returns all pagination info from the store as a JS object.
* `paginationSelectors.createCurrentPageSelector(facetName: String)`
  * A function which creates a selector. Takes one parmeter, `facetName`.
  * The created selector returns the current page.
* `paginationSelectors.createPageSizeSelector(facetName: String)`
  * A function which creates a selector. Takes one parmeter, `facetName`.
  * The created selector returns the page size.
* `paginationSelectors.selectPage(items: Array|List, currentPage: Number, pageSize: Number)`
  * A selector computation function. The parameters should be computed by other selectors.
  * Use this as the 'combining' final parameter in `reselect`'s `createSelector`, for instance.
  * Using the provided inputs, this will return a page of your `items` collection.
  * Defaults `pageSize` to `10` if no other value is present.
* `paginationSelectors.selectPageCount(itemCount: Number, pageSize: Number)`
  * A selector computation function. The parameters should be computed by other selectors.
  * Use this as the 'combining' final parameter in `reselect`'s `createSelector`, for instance.
  * Using the provided inputs, this will return the number of pages present.
  * This may seem trivial, but why not?
