# Store Query Integration Examples

This document explains how the updated `store.queryIndex` method works and how to use it in your applications.

## 🎯 Overview

The `store.queryIndex` method has been updated to return complete resource objects that can be directly used as `ldp:contains` entries, making it compatible with the `filterMixin` and other components that expect container data.

## 🔧 Key Changes

### Before (Old Behavior)
```typescript
// store.queryIndex returned simple objects
const results = await store.queryIndex(options);
// results = [{ '@id': '...', '@type': '...' }]
// filterMixin couldn't use this directly for ldp:contains
```

### After (New Behavior)
```typescript
// store.queryIndex now returns complete resource objects
const results = await store.queryIndex(options);
// results = [completeResourceObject1, completeResourceObject2, ...]
// filterMixin can directly assign to ldp:contains!
```

## 📁 Example Files

### 1. `solid-search-prompt-integration.html`
**Purpose**: Demonstrates natural language search with both methods
**Key Features**:
- Shows both original NL search and direct store query
- Compares results from both approaches
- Tests castle, fortress, palace patterns

**Usage**:
```typescript
// Method 1: Original natural language search
const results1 = await nlSearch.search(prompt);

// Method 2: Direct store query (new!)
const results2 = await nlSearch.searchWithStore(prompt);
```

### 2. `direct-store-query-example.html`
**Purpose**: Shows how to use `store.queryIndex` directly like `filterMixin`
**Key Features**:
- Creates local container for results
- Calls `store.queryIndex` directly
- Updates `ldp:contains` with results
- Shows container data structure

**Usage**:
```typescript
// Create query options
const queryOptions = {
  dataSrcIndex: 'http://localhost:5173/examples/data/ai/3DObjects-title-index.jsonld',
  dataRdfType: 'tc:3DObject',
  filterValues: {
    'tc:title': { value: 'cas' } // for castle
  }
};

// Call store.queryIndex - returns ready-to-use resources!
const results = await store.queryIndex(queryOptions);

// Direct assignment to ldp:contains (like filterMixin does)
this.container['ldp:contains'] = results;
```

## 🔄 How It Works

### 1. Query Process
```typescript
// 1. Extract entities from natural language
const searchParams = await naturalLanguageSearch.extractSearchParams(prompt);

// 2. Convert to store query options
const queryOptions = naturalLanguageSearch.convertToQueryOptions(searchParams, fieldMappings);

// 3. Call store.queryIndex
const results = await store.queryIndex(queryOptions);
```

### 2. Resource Fetching
The `store.queryIndex` method now:
1. **Queries the index** to get result IDs
2. **Fetches complete resources** for each ID using `store.getData()`
3. **Returns ready-to-use objects** for `ldp:contains`

### 3. Container Integration
```typescript
// filterMixin can now do this directly:
const results = await store.queryIndex(queryOptions);
this.localResources['ldp:contains'] = results; // ✅ Works!
store.setLocalData(this.localResources, this.dataSrc, true);
```

## 🧪 Testing Patterns

The examples include test patterns for the updated title index:

| Pattern | Matches | Example Titles |
|---------|---------|----------------|
| `cas` | Castle | Bran Castle, Ljubljana Castle, etc. |
| `for` | Fortress | Belgrade Fortress, Kotor Fortress Walls |
| `pal` | Palace | Bucharest Palace of Parliament |
| `cat` | Cathedral | Zagreb Cathedral, Vilnius Cathedral |
| `bra` | Bran | Bran Castle |

## 🎨 UI Features

### Example Prompts
Click to test different search patterns:
- "Show me a castle model" → tests `cas.*` pattern
- "Find a fortress model" → tests `for.*` pattern
- "Show me a palace model" → tests `pal.*` pattern

### Result Display
Shows complete resource information:
- ID and Type
- Title and Description
- Country and Format
- All other resource properties

### Container Data View
Click "Show Container Data" to see the complete container structure with `ldp:contains` entries.

## 🔗 Integration with filterMixin

The updated `store.queryIndex` method is now fully compatible with `filterMixin`:

```typescript
// In filterMixin.triggerIndexSearch
async triggerIndexSearch(filterValues: Record<string, any>) {
  const queryOptions: IndexQueryOptions = {
    dataSrcProfile: this.dataSrcProfile,
    dataSrcIndex: this.dataSrcIndex,
    dataRdfType: this.dataRdfType,
    filterValues,
  };

  try {
    // Now returns complete resources ready for ldp:contains!
    const results = await store.queryIndex(queryOptions);
    
    // Direct assignment works perfectly
    this.localResources['ldp:contains'] = results;
    store.setLocalData(this.localResources, this.dataSrc, true);
    this.populate();
  } catch (error) {
    console.error('Error querying index:', error);
  }
}
```

## 🚀 Benefits

1. **Simplified Integration**: No need to manually fetch resources after querying
2. **Consistent Data Format**: Results are always complete resource objects
3. **Direct Assignment**: Can be directly assigned to `ldp:contains`
4. **Better Performance**: Single method call instead of multiple fetches
5. **Compatible**: Works seamlessly with existing `filterMixin` code

## 📝 Usage Tips

1. **Always use the `{ value: pattern }` format** for filter values
2. **Handle empty results gracefully** - the method returns an empty array if no matches
3. **Check resource properties** - returned objects have all the original resource data
4. **Use for debugging** - the method includes extensive logging for troubleshooting

This integration makes the natural language search system much more robust and easier to use! 🎉 