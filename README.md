## Synopsis

This is a series of web component respecting both the web components standards and the Linked Data Platform convention.
They are aimed at enabling anyone with little development skills to create their own web application by placing these components in an HTML file.

## Code Example

All the examples can be found in `/examples/`

## Initialization

You first need to load the webcomponents polyfill for the browsers that have not implemented them yet, and import the components you want to use in your HTML file:

```html
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.20/webcomponents-loader.js"></script>
<script type="module" src="https://unpkg.com/@startinblox/core"></script>
<script type="module" src="https://unpkg.com/@startinblox/router"></script>
```

Then you can use the new tags in your markup, for instance : `<sib-display>`. More details on each component in the following section.

## Components documentation

### `sib-display`

Receives the URL of a resource or of a container of resources via its `data-src` attribute, and displays it.
Each field of the displayed resources can be rendered by a specific widget, either custom or chosen from the default ones.
Filters and searching capabilities can be easily added to interact with the list of data being displayed.

```html
<sib-display
  id="list"
  data-src="http://localhost:8000/todos/"
  set-info="task, date"
  value-created="Created by:"
  set-author="created, name"
  set-status="state"
  data-fields="image, status, author, deadline"
  widget-image="sib-display-img"
  search-fields="name, author"
  next="detail"
></sib-display>
```

**Attributes:**

- **data-src**: The uri of the LDP resource you want to display. If this resource is a container, `<sib-display>` will create a child `<sib-display>` for each resource it contains, and `<sib-form>` will display a blank form with appropriate fields to create a new resource.
- **value-xyz**: To display a string not contained within the data.
- **set-xyz**: To group fields within a `<div>` tag that will have the `name` attribute set up to `xyz`. By default, all displayed fields are direct children of `<sib-display>`. Make sure you don't give your set the same name as a field as it would result in an infinite loop.
- **data-fields**: the ordered list of fields to be displayed, separated by commas. By default, all the fields of the resource are displayed. To not show any fields, put an empty data-fields (eg. `<sib-display data-fields />)`
- **widget-xyz**: the widgets to be used to display the `xyz` field. By default, the widget used is `<sib-display-div>`. Cf the **Widgets** section below for more info.
- **search-fields**: It is possible to search/filter your list by choosing the fields you want to filter it with. To be able to filter my users by `name` for instance, I can set `search-fields="name"`. This will display a form with the appropriate inputs to filter the list.
- **search-value-xyz**
- **search-widget-xyz**
- **search-range-xyz**
- **paginate-by**: The list can also be split in pages, for example set `paginate-by="5"` to display pages of 5 elements, the prev/next buttons and the counter will be added automatically
- **next**: `name` attribute of the `<sib-route>` that should be accessed when a `<sib-display>` element is clicked. See the documentation of `<sib-router>` for more details.
- **action-xyz**:
- **label-xyz**: set the label for the `xyz` field
- **counter-template**:
- **extra-context**
- **loader-id**: id of the loader element you want to display during the loading time
- **class-xyz**
- **id-suffix**




### `sib-form`

Receives the URL of a ressource via its `data-src` attribute, and displays a form to edit the resource.
If given the URL of a container of ressources, and displays a creation form to add a resource to the container.


```html
<sib-form data-src="http://localhost:8000/todos/"></sib-form>
```

**Attributes:**

- **label-xyz**: When displaying a form, the default labels are the fields names of the model. If you want something fancier, you can set this attribute, for instance : `label-username="Your name"`.

- **naked**

- **range-xyz**



### `sib-ac-checker`

Hides an element from the page if the current user doesn't have the required permissions on it.
```html
  <sib-ac-checker permission="acl:Write" bind-resources>
    <sib-route name="member-edit">
      <div>Edit</div>
    </sib-route>
  </sib-ac-checker>
```

**Attributes :**
- **permission**: Can take the following values :
  - [acl:Read](https://github.com/solid/web-access-control-spec#aclread)
  - [acl:Write](https://github.com/solid/web-access-control-spec#aclwrite)
  - [acl:Append](https://github.com/solid/web-access-control-spec#aclappend)
  - [acl:Control](https://github.com/solid/web-access-control-spec#aclcontrol)



### `sib-calendar`



### `sib-map`



### `sib-widget`






## Widgets

The following widgets are available:

### Display
- **sib-display-value** (default): Displays the value.
- **sib-display-div**: Displays the `value` inside a `<div>` HTML tag.
- **sib-display-labelled-div**: Displays the `value` inside a `<div>` HTML tag, after the `label` contained in a `<label>`  HTML tag
- **sib-display-labelled-boolean**: Displays the `label` inside a `<label>` HTML tag if the `value` is true
- **sib-display-img**: Inserts the `value` as the src attribute value of an `<img>` HTML tag.
- **sib-display-mailto**: Displays a link inside a `<a>` HTML tag with a `mailto:value` as path
- **sib-display-tel**: Displays a link inside a `<a>` HTML tag with a `tel:value` as path
- **sib-display-link**: Displays a link inside a `<a>` HTML tag with the value as path, and the label as text content

### Form
- **sib-form-label-text**: Inserts an `<input/>` HTML tag of type "text", in a `<label>` HTML tag.
- **sib-form-checkbox**: Inserts an `<input/>` HTML tag of type "checkbox", in a `<label>` HTML tag.
- **sib-form-date**: Inserts an `<input/>` HTML tag of type "date", in a `<label>` HTML tag.
- **sib-form-range-date**:
- **sib-form-json**: Inserts an `<input/>` HTML tag of type "text", in a `<label>` HTML tag, and with its `value` converted from JSON to string
- **sib-form-placeholder-text**: Inserts an `<input/>` HTML tag of type "text", with the `label` as placeholder
- **sib-form-textarea**: Inserts an `<textarea>` HTML tag in a `<label>` HTML tag.
- **sib-form-dropdown**: Inserts a `<select>` HTML tag to select a unique value from a list. The list is provided via the `range-xyz`, which expects a container's URL. **xyz** is the name of the field using the `sib-form-dropdown` widget.
- **sib-form-placeholder-dropdown**: Inserts a `<select>` HTML tag to select a unique value from a list. It has no label but a default disabled value as a label
- **sib-form-auto-completion**: Inserts a `<input />` HTML tag and load an autocomplete plugin. The list is provided via the `range-xyz`, which expects a container's URL. **xyz** is the name of the field using the `sib-form-auto-completion` widget.
- **sib-form-number**: Inserts an `<input/>` HTML tag of type "number", in a `<label>` HTML tag.
- **sib-form-range-number**:
- **sib-form-hidden**: Inserts an `<input/>` HTML tag of type "hidden", in a `<label>` HTML tag.

### Actions
- **sib-action**: Displays a link inside a `<sib-link>` tag with `src` for the `data-src` attribute, `value` for the `next` attribute and `label` as text content

## Helpers fonctions

| Function             | Parameters            | Description                                                  |
| -------------------- | --------------------- | ------------------------------------------------------------ |
| `uniqID`             |                       | create an uniq ID, used for example to associate input with label |
| `stringToDom`        | `html`                | parse html string and return DOM fragment                    |
| `evalTemplateString` | `str, variables = {}` | eval a string as an es6 template string. example: `evalTemplateString('name: ${first}  ${last}', {first: 'John', last: 'Doe'})` |
| `importCSS`          | `[...stylesheets]`    | add style in document if not present                         |



## Events

| Event name       | Fired by                                             | Fired when                                                   |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `resourceSelect` | `sib-display`, `sib-calendar`, `sib-map`             | the user clicks an child in the list, with the resource as a detail of the event. |
| `populate`       | `sib-display`, `sib-form`, `sib-calendar`, `sib-map` | the component got and displayed all its datas.               |
| `save`           | `sib-form`                                           | the user validates the form.                                 |



## License

Licence MIT


