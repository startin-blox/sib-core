import type { Resource } from '../mixins/interfaces.ts';
import {
  compare,
  doesResourceContainPredicate,
  findClosingBracketMatchIndex,
  parseFieldsString,
  uniqID,
} from './helpers.ts';
import type { Query, SearchQuery } from './interfaces.ts';

/**
 * Check if the field is a set
 * @param field - field to test
 * @param fields - list of fields
 * @returns true if the field is a set, false otherwise
 */
const isSet = (field: string, fields: string): boolean => {
  if (!fields) return false;
  const foundSets = fields.match(getSetRegexp(field));
  return foundSets ? foundSets.length > 0 : false;
};
/**
 * Get the list of fields in the set
 * @param field - set name to get
 * @param fields - list of fields
 * @returns a list of fields in the set
 */
const getSet = (field: string, fields: string): string[] => {
  const setString = fields.match(getSetRegexp(field));
  if (!setString) return [];
  const firstSetBracket =
    fields.indexOf(setString[0]) + setString[0].length - 1;
  const lastSetBracket = findClosingBracketMatchIndex(fields, firstSetBracket);
  const set = fields.substring(firstSetBracket + 1, lastSetBracket);
  return parseFieldsString(set);
};
const getSetRegexp = (field: string) => {
  return new RegExp(`(^|\\,|\\(|\\s)\\s*${field}\\s*\\(`, 'g');
};
/**
 * Check if the field is a special search field
 * @param field - field to test
 * @param searchForm - current search form
 * @returns true if the field is a special search field
 */
const isSearchField = (field: string, searchForm: Element) => {
  return searchForm.hasAttribute(`search-${field}`);
};
/**
 * Get the fields targetted by a search field
 * @param field - search field to get
 * @param searchForm - current search form
 * @returns a list of fields targetted by the current search field
 */
const getSearchField = (field: string, searchForm: Element): string[] => {
  return parseFieldsString(searchForm.getAttribute(`search-${field}`) || '');
};

/**
 * Throw or simply return value
 * @param throwOn - should throw on True or False
 * @param ret - value to return
 * @returns
 */
const orThrow = (throwOn: boolean | undefined, ret: boolean) => {
  if (throwOn === true && ret) throw true;
  if (throwOn === false && !ret) throw false;
  return ret;
};

/**
 * Compare a value to the query
 * @param val - value to compare
 * @param query - object to know how and what value to compare
 * @param throwOn - should function throw error on True or False
 * @returns true if value matches, throw error otherwise
 */
const matchValue = async (
  val: any,
  query: Query,
  throwOn?: boolean,
): Promise<boolean> => {
  const subject = await val;
  if (subject == null && query.value === '') return orThrow(throwOn, true); // filter not set and subject not existing -> ignore filter
  if (subject == null) return orThrow(throwOn, false); // return false; // property does not exist on resource
  if (query.list) {
    // Filter on a container
    if (query.value.length === 0) return orThrow(throwOn, true);
    for (const v of query.value) {
      if (
        await matchValue(subject, { type: query.type, value: v, list: false })
      ) {
        // do not throw here, we need the result
        return orThrow(throwOn, true);
      }
    }
    return orThrow(throwOn, false);
  }
  if (subject.isContainer?.()) {
    let ret: boolean | Promise<boolean> = Promise.resolve(query.value === ''); // if no query, return a match
    for (const value of subject['predicate']) {
      ret = (await ret) || (await matchValue(value, query)); // do not throw here, we need the result
      if (ret) return orThrow(throwOn, true);
    }
    return orThrow(throwOn, await ret);
  }
  if (Array.isArray(subject)) {
    let ret: boolean | Promise<boolean> = Promise.resolve(query.value === ''); // if no query, return a match
    for (const value of subject) {
      ret = (await ret) || (await matchValue(value, query)); // do not throw here, we need the result
      if (ret) {
        return true;
      }
    }
    return orThrow(throwOn, await ret);
  }

  if (query.type === 'string' && typeof subject !== 'string')
    return orThrow(throwOn, compare.string(subject['@id'], query.value));
  return orThrow(throwOn, compare[query.type](subject, query.value));
};

/**
 * Cache properties of a filter to avoid repeated parsing
 * @param cacheKey - uniq key
 * @param filter - filter to check
 * @param fields - fields attribute of the element
 * @param searchForm - current search form
 */
const cacheFieldsProps = (
  cacheKey: string,
  filter: string,
  fields: string,
  searchForm: any,
) => {
  if (!window.cachePropsSearchFilter[cacheKey]) {
    window.cachePropsSearchFilter[cacheKey] = {
      setFields: isSet(filter, fields) ? getSet(filter, fields) : null,
      setSearchFields: isSearchField(filter, searchForm)
        ? getSearchField(filter, searchForm)
        : null,
    };
  }
};

/**
 * Allow to traverse a multi-depth path to filter on resources of a given type
 * @param resource The actual resource to filter on
 * @param path The complete path to traverse
 * @param targetedType The type of resources we are looking for
 * @returns The list of all resources ids found of given type
 */
const traversePath = async (
  resource: object,
  path: string[],
  targetedType: string,
): Promise<object[]> => {
  let result: object[] = [];
  let currentRes: any;
  let remainingPath: string[] = path;
  if (path.length === 0) return [];

  // Split and get first item
  try {
    currentRes = await resource[path[0]];
    const lastPath1El = path.shift();

    if (lastPath1El) remainingPath = path;

    if (currentRes && remainingPath.length > 1) {
      result = await traversePath(currentRes, remainingPath, targetedType); // Await the result of traversePath
    } else if (currentRes && Array.isArray(currentRes)) {
      for (const res of currentRes) {
        if (remainingPath.length > 1) {
          result = await traversePath(res, remainingPath, targetedType);
        } else {
          let targetsRes = await res[remainingPath[0]];
          if (!targetsRes) return [];
          if (targetsRes.isContainer?.()) {
            targetsRes = targetsRes['predicate'];
          }
          if (!Array.isArray(targetsRes)) targetsRes = [targetsRes];

          for (const targetRes of targetsRes) {
            if (!result.some(item => item['@id'] === targetRes['@id'])) {
              result.push({ '@id': targetRes['@id'] });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
    return [];
  }
  // console.log(`TraversePath result for ${resource['@id']} : `, await result);
  return result;
};

/**
 * Check if one resource match one filter
 * @param resource - resource to test
 * @param filter - name of the property tested
 * @param query - query object to know how to compare values
 * @param fieldsAttr - fields attribute of the element
 * @param searchForm - searchForm component
 * @param filterId - uniqId used to fill the cache
 * @param throwOn - should function throw error on True or False
 * @returns return true if the resource matches the filter, throw error otherwise
 */
const matchFilter = async (
  resource: object,
  filter: string,
  query: Query,
  fieldsAttr: string,
  searchForm: any,
  filterId: string,
  throwOn: boolean,
) => {
  let fields: string[] | null = null;

  const cacheKey = `${filter}_${filterId}`;
  cacheFieldsProps(cacheKey, filter, fieldsAttr, searchForm);

  if (window.cachePropsSearchFilter[cacheKey].setFields !== null) {
    fields = window.cachePropsSearchFilter[cacheKey].setFields;
  } else if (window.cachePropsSearchFilter[cacheKey].setSearchFields !== null) {
    fields = window.cachePropsSearchFilter[cacheKey].setSearchFields;
  } else {
    // search on 1 field
    //FIXME: Better assumption that just using ldp:contains does the job ?
    if (
      !(await resource[filter]) &&
      doesResourceContainPredicate(filter, {
        ...(resource as Resource).clientContext,
        ...(resource as Resource).serverContext,
      })
    ) {
      // nested field
      // console.log(`No ${filter} found for ${resource['@id']} and ${filter} is a nested field. Trying to traverse path.`);
      const path1: string[] = filter.split('.');
      const targetedType = path1[path1.length - 1];

      let targetIds: object[] = [];

      targetIds = await traversePath(resource, path1, targetedType);
      // console.log(`TargetIds : ${targetIds} found for ${await resource['name']} : ${resource['@id']}`);

      if (
        !Array.isArray(targetIds) ||
        (targetIds.length === 0 && query.value !== '')
      ) {
        // console.log(`No targetIds found for ${resource['@id']} returning false`);
        throw !throwOn;
      }

      // console.log(`Do we have a match for ${resource['@id']} ?`, match);
      return await matchValue(targetIds, query, throwOn);
    }
    return matchValue(resource[filter], query, throwOn);
  }

  // search on multiple fields
  try {
    await Promise.all(
      (fields || []).map(field =>
        matchFilter(
          resource,
          field,
          query,
          fieldsAttr,
          searchForm,
          filterId,
          true, // stop searching when 1 filter is true (= OR)
        ),
      ),
    );
  } catch {
    return true;
  }
  throw false;
};

/**
 * Check if one resource match all the filters
 * @param resource - resource to test
 * @param filters - current filters
 * @param filterNames - names of the filters
 * @param fields - fields attribute of the element
 * @param searchForm - searchForm component
 * @param filterId - uniqId used to fill the cache
 * @returns true if resource match, false otherwise
 */
const matchFilters = async (
  resource: object,
  filters: SearchQuery,
  filterNames: string[],
  fields: string,
  searchForm: any,
  filterId: string,
): Promise<boolean> => {
  // return true if all filters values are contained in the corresponding field of the resource
  try {
    await Promise.all(
      filterNames.map(async filter => {
        const match = await matchFilter(
          resource,
          filter,
          filters[filter],
          fields,
          searchForm,
          filterId,
          false, // stop searching when 1 filter is false (= AND)
        );
        return match;
      }),
    );
  } catch (_e) {
    return false;
  }
  return true;
};

/**
 * Check which resources match the filters
 * @param resources - list of resources to filter
 * @param filters - current filters
 * @param fields - fields attribute of the element
 * @param searchForm - searchForm component
 * @returns resources filtered
 */
const searchInResources = (
  resources: object[],
  filters: SearchQuery,
  fields: string,
  searchForm: any,
) => {
  // Optim: use cache to do these things only once
  const filterNames = Object.keys(filters);
  const filterId = uniqID();
  window.cachePropsSearchFilter = {};
  return Promise.all(
    resources.map(async resource => {
      const match = await matchFilters(
        resource,
        filters,
        filterNames,
        fields,
        searchForm,
        filterId,
      );
      return match;
    }),
  );
};

export { searchInResources };
