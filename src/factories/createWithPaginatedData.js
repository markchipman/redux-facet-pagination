import { compose, lifecycle } from 'recompose';
import actions from '../actions';
import { connect as defaultConnect } from 'react-redux';
import { defaultsDeep, pick } from 'lodash';

export default (selectors, withPagination) => (selectItems, options) => {
  const defaultedOptions = defaultsDeep(options, { connect: defaultConnect, dataPropName: 'paginatedData' });

  const createMapStateToProps = (selectItems) => {
    /* if selectItems is a selector function */
    if (typeof selectItems === 'function') {
      return (state, ownProps) => {
        const items = selectItems(state);
        return {
          [defaultedOptions.dataPropName]: selectors.selectPage(items, ownProps.currentPage, ownProps.pageSize),
        };
      };
    /* if selectItems is a prop name */
    } else if (typeof selectItems === 'string') {
      return (state, ownProps) => {
        const filterSelector = selectors.createFilterListSelector(ownProps.facetName);
        const filters = filterSelector(state);
        const filteredData = filters.reduce(filterReducer, ownProps[selectItems]);

        return {
          [defaultedOptions.dataPropName]: selectors.selectPage(ownProps[selectItems], ownProps.currentPage, ownProps.pageSize),
        };
      }
    } else {
      throw new Error('The first parameter of withFilteredData must be a selector function or a prop name');
    }
  }

  const mapStateToProps = createMapStateToProps(selectItems);

  return compose(
    withPagination(selectItems),
    defaultedOptions.connect(
      mapStateToProps,
      null,
      null,
      // pass through connect options from HOC options
      pick(defaultedOptions, [
        'pure',
        'areStatesEqual',
        'areOwnPropsEqual',
        'areStatePropsEqual',
        'areMergedPropsEqual',
        'storeKey',
      ]),
    ),
    lifecycle({
      componentDidMount() {
        this.props.setPage(this.props.currentPage, this.props.pageSize || 10);
      },
    }),
  );
};
