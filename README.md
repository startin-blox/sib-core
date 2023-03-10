# Getting started

> Please before to start, check [our contribution guidelines](https://git.startinblox.com/documentation/doc/wikis/Contribution-guidelines):)

This documentation is for developers who would like to contribute to the core of the framework.

**If you just want to use the framework, please refer to [the general documentation](https://docs.startinblox.com).**

## Installation
To start developing in `sib-core`, you need:
```shell
# 1. Install the dependencies
npm install

# 2. Build the framework
npm run build:dev

# 3. Launch a web server
npm run serve
```

You can now see examples at [http://127.0.0.1:3000](http://127.0.0.1:3000/).

## Adding new features
To develop new features of `sib-core`, you can add an HTML example file in `/examples` and link it in `/index.html`.
Don't forget to import the framework:

```html
<script type="module" src="../dist/index.js"></script>
```
You can now write HTML using `sib-core` and test it in your browser.


## Test
You can test the API by running:
```shell
npm run test
```

# Mixin API
## How it works
Here is a simplified schema of how the API works to create a component:
![sib-api](./images-documentation/sib-api.png)

## Name

```js
  static get name() {
    return 'string';
  }
```
The static getter "name" return a string that will be used to register the component tag name or the mixin name. This getter is required.

## Install mixins
```js
  static get use() {
    return [Mixin];
  }
```

The static getter "use" return an array of mixins to install. The mixin compositor install mixin recursively.

## Declare attributes
```js
  static get attributes() {
    return {
      myProp: {
        type: String,
        default: '',
        callback(newValue, oldValue) {
          //
        },
        required: false,
      }
    }  
  }
```

To declare an attribute, you should use the static getter "attributes". It should return an object. Each property will be bind with kebab case equivalent. Example: 'myProp' is bound to 'my-prop'. Each property should be an object with :
- type
  - description: The js type of your attribute data
  - required: false
  - default: String
- default
  - description: A default value
  - required: false
  - default: undefined
- required
  - description: Is this attribute required, if true, throw an Error if not provided
  - required: false
  - default: false
- callback
  - description: A function that will be invoke when the attribute changed. It receive 2 arguments : newValue, oldValue.
  - required: false
  - default: undefined

The mixin compositor register all attribute recursively. The last declaration is keeped.

## Declare initial state
```js
  static get initialState() {
    return {
      click: 0,
    };
  }
```
The static getter initialState should return an object that contains initial state of the component. The mixin compositor merge recursively the initial state. Last declaration is keeped.
Every property in the initial state could be watched by the component in order to provide reactivity.


## Hooks
```js
  created() {
    console.log('component is created');
  }
```
Available hook:
- created
- attached
- detached

Each hook is a function. The mixin compositor *append* hooks. If a deeper mixin register a created hook, its function will be called before the current created hook.

## Declare methods
```js
  myMethod() {
    console.log('Hi!');
  }
```
In order to declare methods, you just add a method to your mixin. The mixin compositor keep the last method declared.

# Core Architecture
Here is a simplified schema of the organization and the responsibilities of the classes of the core:
![core-architecture](./images-documentation/core-architecture.png)

## List post-processing
A `solid-display` component is capable of showing a list of resources and applying different filters on this list to filter, sort, group... resources. Here is a schema of the order of these transformations:
![list-post-processing](./images-documentation/list-post-processing.png)

# Widgets API
A widget is a small component responsible for a value. The widget is composed and built on demand when the developer ask for it.
To do that, the name of the widget is splitted and analyzed to add the right mixins. Here is a schema of how it works:

![widget-api](./images-documentation/widget-api.png)

## Values
Values are given to a widget through its `value` attribute. For the widgets defined by sib-core, it can have different types:
- `string`: most common and encouraged use case
- `boolean` (checkbox): is converted to string (`'true'` or `'false'`)
- `number` (input number): is converted to string
- `container` (multiple, multiple form): is converted to `@id` and resolved by the widget

As custom widgets still use the old API, you can give them these types:
- `string`
- `resource` Proxy
- `container` Proxy

### Get the values
With the display widgets, you can get the value through its HTML attribute:
```js
const value = widgetElement.getAttribute('value');
// or thanks to the core API
const value = widgetElement.component.value;
```

In the form widgets, the value can be changed by the user. If you need to retrieve it, proceed like this:
```js
const value = widgetElement.component.getValue();
```

Under the hood, the core finds elements which have a `data-holder` attribute, and get the value from their properties, instead of their attribute (where you would have the initial value of the widget).

A widget can have:
- 1 `data-holder` element (simple inputs)
- 2 `data-holder` elements (range filter inputs)
- multiple `data-holder` elements (multiple-form)


## Not clear enough ?
Help us to improve the documentation! Feel free to ask for clarification or ask questions. This helps us to improve our documentation.

Thanks you!