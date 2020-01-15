## Synopsis

This is a series of web component respecting both the web components standards and the Linked Data Platform convention.
They are aimed at enabling anyone with little development skills to create their own web application by placing these components in an HTML file.

## Code Example

All the examples can be found in `/examples/`

## Initialization

You first need to load the webcomponents polyfill for the browsers that have not implemented them yet, and import the components you want to use in your HTML file:

```html
<script
  type="text/javascript"
  src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.20/webcomponents-loader.js"
></script>
<script type="module" src="https://unpkg.com/@startinblox/core"></script>
<script type="module" src="https://unpkg.com/@startinblox/router"></script>
```

Then you can use the new tags in your markup, for instance : `<solid-display>`. More details on each component in the following section.

## Components documentation

### `solid-display`

Receives the URL of a resource or of a container of resources via its `data-src` attribute, and displays it.
Each field of the displayed resources can be rendered by a specific widget, either custom or chosen from the default ones.
Filters and searching capabilities can be easily added to interact with the list of data being displayed.

```html
<solid-display
  id="list"
  data-src="http://localhost:8000/todos/"
  value-created="Created by:"
  fields="image, status(state), author(created, name), info(task, date), deadline"
  widget-image="solid-display-img"
  search-fields="name, author"
  next="detail"
></solid-display>
```

**Attributes:**

- **`data-src`**: The uri of the LDP resource you want to display.
  If this resource is a container, `<solid-display>` will create a child `<solid-display>` for each resource it contains, and `<solid-form>` will display a blank form with appropriate fields to create a new resource.
- **`value-xyz`**: To display a string not contained within the data.
- **`fields`**: The ordered list of fields to be displayed, separated by commas.

  By default, all the fields of the resource are displayed.

  To not show any fields, put an empty fields (eg. `<solid-display fields />)`

  To group fields within a `<div>` tag that will have the `name` attribute set up to `xyz`, enclose some fields in parenthesis. For example: `fields="xyz(first_name, last_name), email"`. You can customize the group widget, see the **[sets widgets](#set-widgets)** section below for more info.

  By default, all displayed fields are direct children of `<solid-display>`. Make sure you don't give your set the same name as a field as it would result in an infinite loop.
- **`widget-xyz`**: The widget to be used to display the `xyz` field. By default, the widget used is `<solid-display-div>`. Cf the **[Display widgets](#display-widgets)** section below for more info.
- **`default-widget`**: The widget to use for all the fields, except if a specific one is defined for a field.
- **`multiple-xyz`**: Show field `xyz` as multiple field containing one widget for each child. Multiple widget can be specified, example: `multiple-skills="my-custom-multiple-widget"`. If argument is used without value, default multiple widget is used. Cf the **[Multiple widgets](#multiple-widgets)** section below for more info.
  - **`each-label-xyz`**: Used with `multiple-xyz`, label of each child of multiple widget
  - **`each-class-xyz`**: Used with `multiple-xyz`, class of each child of multiple widget
  - **`each-range-xyz`**: Used with `multiple-xyz`, range value of each child of multiple widget
  - **`multiple-xyz-add-label`**: Used with `multiple-xyz`, text of the "+" button
  - **`multiple-xyz-remove-label`**: Used with `multiple-xyz`, text of the "×" button
- **`search-fields`**: It is possible to search/filter your list by choosing the fields you want to filter it with.
  To be able to filter my users by `name` for instance, I can set `search-fields="name"`. This will display a form with the appropriate inputs to filter the list.

  - **`search-value-xyz`**: The default value of the search field `xyz`
  - **`search-label-xyz`**: Set the label for the search field `xyz`
  - **`search-widget-xyz`**: The form widget of the search field `xyz`
  - **`search-range-xyz`**: The range of values of the search field `xyz`
- **`paginate-by`**: The list can also be split in pages, for example set `paginate-by="5"` to display pages of 5 elements, the prev/next buttons and the counter will be added automatically
- **`order-by`**: The name of the field you want to use to order the list. For example, `order-by="username"` will order the users list alphabetically based on the username.
- **`highlight-xyz`**: The resources to put at the top of the list. For example, `highlight-date="2019-05-20"` will display first all the resources which have a field date equal to "2019-05-20".
- **`group by`**: The resources will be grouped by the field you give as a parameter. For example, `group-by="date"` will render one `<div>` by date, and put the corresponding resources inside.
- **`next`**: `name` attribute of the `<solid-route>` that should be accessed when a `<solid-display>` element is clicked. See the documentation of `<solid-router>` for more details.
- **`action-xyz`**: name of the route to reach when the widget for the field `xyz` is clicked. By default, a `solid-link` widget is used.
- **`label-xyz`**: Set the label for the field `xyz`
- **`placeholder-xyz`**: Set the placeholder for the field `xyz`
- **`editable-xyz`**: Add an "edit" button next to the `xyz` field to let the user edit it. The changes are saved as soon as the field loses focus.
  The editable attribute works with the following widgets: `solid-display-div`, `solid-display-labelled-div`, `solid-display-mailto` and `solid-display-tel`
- **`counter-template`**: To display the number of resources fetched by the `solid-display`.
  It takes a string in which you can use HTML tags, and the `counter` variable to add the number.
  i.e. `"<strong>${counter} results</strong>"`
- **`extra-context`**: The id of the `<script>` tag which contains the context you want to add for this component. An extra context looks like this:
  ```html
  <script id="custom-context" type="application/ld+json">
    { "user": "https://api.test-paris.happy-dev.fr/users/" }
  </script>
  ```
  If your `<script>` tag has the attribute `data-default-context`, this extra context will be applied on all the components which doesn't have an `extra-context` attribute.
- **`loader-id`**: Id of the loader element you want to display during the loading time.
- **`class-xyz`**: Class attribute added to the fields `xyz`.
- **`child-xyz`**: add attribute `xyz` to all children.
- **`nested-field`**: Name of the field of the requested resource to display.
  Useful when the source url is auto-generated (for instance, with the attribute `bind-resources`) but you need to display another field of this source.

- **`default-xyz`**: Value displayed for field `xyz` when it's empty or not defined
- **`empty-widget`**: Widget to display when there is no element in the container
- **`empty-value`**: To display a value in the empty widget. It can be accessed in the widget like this: `${value}`

**API:**
In Javascript, you have access to different variables and methods on a `solid-display` element:
- `sibDisplay.resource`: returns the Proxy of the current resource
  - `sibDisplay.resource.clearCache()` (async): clears the cache of the store for this resource
- `sibDisplay.resourceId`: returns the id of the current resource


### `solid-form`

Receives the URL of a ressource via its `data-src` attribute, and displays a form to edit the resource.
If given the URL of a container of ressources, and displays a creation form to add a resource to the container.

```html
<solid-form data-src="http://localhost:8000/todos/"></solid-form>
```

**Attributes:**

- **`label-xyz`**: When displaying a form, the default labels are the fields names of the model. If you want something fancier, you can set this attribute.
  i.e. `label-username="Your name"`
- **`naked`**: When the attribute is set, the submit button will be removed.
  It's particularly useful to prevent the nested forms to display their own submit button.
- **`upload-url-xyz`**: URL to upload file for field `xyz`, it automatically set `widget-xyz` to `solid-form-file` if net defined. 
  It's particularly useful with a dropdown field.
- **`submit-button`**: Text of the submit button of the form.
- **`range-xyz`**: URL of a container which list the accepted values for the field `xyz`.
  It's particularly useful with a dropdown field.
- **`partial`**: Add this attribute when the form does not include all the fields of the resource to update.

### `solid-ac-checker`

Hides an element from the page if the current user doesn't have the required permissions on it.

```html
<solid-ac-checker permission="acl:Write" bind-resources>
  <solid-route name="member-edit">
    <div>Edit</div>
  </solid-route>
</solid-ac-checker>
```

**Attributes :**

- **`permission`**: Displays the element if the user has the specified right
- **`no-permission`**: Displays the element if the user has not the specified right

Possible values:
- [acl:Read](https://github.com/solid/web-access-control-spec#aclread)
- [acl:Write](https://github.com/solid/web-access-control-spec#aclwrite)
- [acl:Append](https://github.com/solid/web-access-control-spec#aclappend)
- [acl:Control](https://github.com/solid/web-access-control-spec#aclcontrol)

### `solid-calendar`

Receives the URL of a resource or of a container of resources via its `data-src` attribute, and displays it in a **calendar**. Here is the list of fields needed to display the resources properly:

- `name`: name of the event displayed on the calendar
- `date`: date on which the resource will be displayed

Like for solid-display, filters and searching capabilities can be easily added to interact with the list of data being displayed.

### `solid-map`

Receives the URL of a resource or of a container of resources via its `data-src` attribute, and displays it on a **map**. Here is the list of fields needed to display the resources properly:

- `name`: name of the event displayed on the calendar
- `lat`: latitude on which the resource will be displayed
- `lng`: longitude on which the resource will be displayed

Like for solid-display, filters and searching capabilities can be easily added to interact with the list of data being displayed.

### `solid-widget`

Take a `name` as an attribute and a HTML template, and create an HTML custom element you can use as a widget. i.e.

```html
<!-- Your custom widget to display a customer... -->
<solid-widget name="my-custom-widget">
  <template>
    <h2>Customer name: ${value.name}</h2>
  </template>
</solid-widget>

<!-- ... used in a solid-display -->
<solid-display
  data-src="http://server/projects/"
  fields="name, customer"
  widget-customer="my-custom-widget"
></solid-display>
```

In a `solid-widget`, you have access to these values:

- **`id`**: id of the displayed resource
- **`value`**: all the values of the current resources
- **`name`**: name of the current field
- **`label`**: if defined, label of the current field
- **`range`**: if defined, range of the current field

> NB: Do not forget to define your custom template in a `<template>` tag. Otherwise, your widget will not be declared properly.

### `solid-delete`

Receives the URL of a resource or of a container of resources via its `data-src` attribute, and displays a button to delete it when clicked.

```html
<solid-delete data-src="http://localhost:8000/conversations/9/"></solid-delete>
```

**Attributes:**

- **`data-src`**: The uri of the LDP resource you want to delete.
- **`data-label`**: The text to display on the delete button.

**Events:**

- **`resourceDeleted`**: triggered when the resource is successfully deleted.


## Widgets

The following widgets are available:

### Display widgets

- **`solid-display-value`** (default): Displays the value.
- **`solid-display-div`**: Displays the `value` inside a `<div>` HTML tag.
- **`solid-display-labelled-div`**: Displays the `value` inside a `<div>` HTML tag, after the `label` contained in a `<label>` HTML tag
- **`solid-display-multiline`**:Displays the `value` inside a `<div>`, `\n` are replaced by `<br>`.
- **`solid-display-labelled-boolean`**: Displays the `label` inside a `<label>` HTML tag if the `value` is true
- **`solid-display-img`**: Inserts the `value` as the src attribute value of an `<img>` HTML tag.
- **`solid-display-mailto`**: Displays a link inside a `<a>` HTML tag with a `mailto:value` as path. If a label is defined for this field, it's displayed as the content of the link.
- **`solid-display-tel`**: Displays a link inside a `<a>` HTML tag with a `tel:value` as path
- **`solid-display-link`**: Displays a link inside a `<a>` HTML tag with the value as path, and the label as text content
- **`solid-display-date`**: Displays a date in the browser's default locale format
- **`solid-display-date-time`**: Displays a date and a time in the browser's default locale format

### Form widgets

- **`solid-form-label-text`**: Inserts an `<input/>` HTML tag of type "text", in a `<label>` HTML tag.
- **`solid-form-checkbox`**: Inserts an `<input/>` HTML tag of type "checkbox", in a `<label>` HTML tag.
- **`solid-form-date`**: Inserts an `<input/>` HTML tag of type "date", in a `<label>` HTML tag.
- **`solid-form-range-date`**:
- **`solid-form-json`**: Inserts an `<input/>` HTML tag of type "text", in a `<label>` HTML tag, and with its `value` converted from JSON to string
- **`solid-form-placeholder-text`**: Inserts an `<input/>` HTML tag of type "text", with the `label` as placeholder.
- **`solid-form-textarea`**: Inserts an `<textarea>` HTML tag in a `<label>` HTML tag.
- **`solid-form-dropdown`**: Inserts a `<select>` HTML tag to select a unique value from a list. The list is provided via the `range-xyz`, which expects a container's URL. **xyz** is the name of the field using the `solid-form-dropdown` widget.
- **`solid-form-placeholder-dropdown`**: Inserts a `<select>` HTML tag to select a unique value from a list. It has no label but a default disabled value as a label
- **`solid-form-auto-completion`**: Inserts a `<input />` HTML tag and load an autocomplete plugin. The list is provided via the `range-xyz`, which expects a container's URL. **xyz** is the name of the field using the `solid-form-auto-completion` widget.
- **`solid-form-number`**: Inserts an `<input/>` HTML tag of type "number", in a `<label>` HTML tag.
- **`solid-form-range-number`**:
- **`solid-form-file`**: Inserts an `<input/>` and an `<input type="file"/>`. when a file is selected it's uploaded, URL of file is returned by request and set as the `<input/>` value. The upload URL is provided via the `upload-url` attribute.
- **`solid-form-hidden`**: Inserts an `<input/>` HTML tag of type "hidden", in a `<label>` HTML tag.

### Multiple widgets

- **`solid-multiple`** (default for display): Inserts all the widgets in a `<solid-multiple>` tag.
- **`solid-multiple-form`** (default for forms): Inserts all the widgets in a `<solid-multiple-form>` tag, with a "remove" button for each widget, and an "add" button.
- **`solid-multiple-select`**: Inserts all the values as `<option>` in a `<select>` tag with a `multiple` attribute.

### Set widgets
- **`solid-set-default`** (default): Inserts content directly in the set tag.
- **`solid-set-div`**: Inserts content in a `<div/>` HTML tag
- **`solid-set-ul`**: Inserts content in a `<ul/>` HTML tag
- **`solid-set-fieldset`**: Inserts content in a `<fieldset/>` HTML tag

### Actions widgets

- **`solid-action`**: Displays a link inside a `<solid-link>` tag with `src` for the `data-src` attribute, `value` for the `next` attribute and `label` as text content

## Helpers fonctions

| Function             | Parameters            | Description                                                                                                                    |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `uniqID`             |                       | create an uniq ID, used for example to associate input with label                                                              |
| `stringToDom`        | `html`                | parse html string and return DOM fragment                                                                                      |
| `evalTemplateString` | `str, variables = {}` | eval a string as an es6 template string. example: `evalTemplateString('name: ${first} ${last}', {first: 'John', last: 'Doe'})` |
| `importCSS`          | `[...stylesheets]`    | add style in document if not present                                                                                           |

## Events

| Event name       | Fired by                                             | Fired when                                                                        |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `resourceSelect` | `solid-display`, `solid-calendar`, `solid-map`             | the user clicks an child in the list, with the resource as a detail of the event. |
| `populate`       | `solid-display`, `solid-form`, `solid-calendar`, `solid-map` | the component got and displayed all its datas.                                    |
| `save`           | `solid-form`                                           | the user validates the form.                                                      |

## Contribute

If you want to contribute to `sib-core`, you may be interested by the [developers documentation](doc/README-developers.md).

## License

Licence MIT

