## Synopsis

This is a series of web component respecting both the web components standards and the Linked Data Platform convention.
They are aimed at enabling anyone with little development skills to create their own web application by placing these components in an HTML file.

## Code Example

An full app example can be found in index.html:

## Initialization

You first need to load the webcomponents polyfill for the browsers that have not implemented them yet, and import the components you want to use in your HTML file:
```html
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.20/webcomponents-loader.js"></script>
<link rel="import" href="https://cdn.happy-dev.fr/ldp-display/ldp-display.html" />
<link rel="import" href="https://cdn.happy-dev.fr/ldp-display/ldp-form.html" />
<link rel="import" href="https://cdn.happy-dev.fr/ldp-display/ldp-router.html" />
<link rel="import" href="https://cdn.happy-dev.fr/ldp-display/ldp-calendar.html" />
<link rel="import" href="https://cdn.happy-dev.fr/ldp-display/ldp-map.html" />
```

Then you can use the new tags in your markup, for instance : `<ldp-display>`. More details on each component in the following section. 

## Components documentation

### ldp-display &nbsp;&&nbsp; ldp-form

**These components accept the following attributes:**

 - **data-src**: The uri of the LDP resource you want to display. If this resource is a container, `<ldp-display>` will create a child `<ldp-display>` for each resource it contains, and `<ldp-form>` will display a blank form with appropriate fields to create a new resource.
 - **value-xyz**: To display a string not contained within the data.
 - **set-xyz**: To group fields within a `<div>` tag that will have the `name` attribute set up to `xyz`. By default, all displayed fields are direct children of `<ldp-display>`. Make sure you don't give your set the same name as a field as it would result in an infinite loop.
 - **data-fields**: the ordered list of fields to be displayed, separated by commas. By default, all the fields of the resource are displayed.
 - **widget-xyz**: the widgets to be used to display the `xyz` field. By default, the widget used is `<ldp-display-div>`. Cf the **Widgets** section below for more info.

**`<ldp-display>` also has the following attributes:**
 - **search-fields**: It is possible to search/filter your list by choosing the fields you want to filter it with. To be able to filter my users by `name` for instance, I can set `search-fields="name"`. This will display a form with the appropriate inputs to filter the list.
 - **next**: `name` attribute of the `<ldp-route>` that should be accessed when a `<ldp-display>` element is clicked. See the documentation of `<ldp-router>` for more details.

**Example :**
```html
<ldp-display 
    id="list"
    data-src="http://localhost:8000/todos/"
    set-info="task, date"
    value-created="Created by :"
    set-author="created, name"
    set-status="state"
    data-fields="image, status, author, deadline"
    widget-image="ldp-display-img"
    search-fields="name, author"
    next="detail"
></ldp-display>
```

**`<ldp-form>` also has the following attributes:**
 - **label-xyz**: When displaying a form, the default labels are the fields names of the model. If you want something fancier, you can set this attribute, for instance : `label-username="Your name"`.
```html
<ldp-form 
    data-src="http://localhost:8000/todos/"
></ldp-form>
```
This shows the list of todos listed by the container, and a form to create a new one.

### ldp-router  &nbsp;&&nbsp;  ldp-route
**`<ldp-router>` accepts the following attributes:**

 - **default-route**: The `name` attribute of the default `<ldp-route>` displayed.
 - **route-prefix**: If you app is not run from the root of your domain name, for instance `www.your-domain.com/some-uri`, you should set `route-prefix` to "some-uri". 
 - **use-hash**: If you can't rewrite the URLs on your server, you might want to set this attribute to `true` to use `location.hash` instead of `location.pathname` as URLs. 
 
**`<ldp-route>` accepts the following attributes:**

 - **id-prefix**: TO BE WRITTEN
 - **active**: This attribute is present on route being displayed by `<ldp-router>`. It is automatically added/removed by `<ldp-router>` and should not be tinkered manually.    


**Example :**
```html
<ldp-router 
    default-route="list"
    route-prefix="my-app"
    use-hash="true"
>
    <ldp-route name="list">List</ldp-route>
    <ldp-route name="form">Form</ldp-route>
    <ldp-route name="detail">Details</ldp-route>
</ldp-router>


```

## Widgets

The following widgets are available : 

 - **ldp-display-div** (default) : Displays the value inside a `<div>` HTML tag. 
 - **ldp-display-img** : Inserts the value as the src attribute value of an `<img>` HTML tag. 
 - **ldp-form-text** : Inserts an `<input/>` HTML tag of type "text". 

## Events

The componend ldp-display fires a "select" event when the user clicks an child in the list, with the resource as a detail of the event.

The componend ldp-form fires a "save" event when the user validates the form.


## License

No licence yet. Please wait...  



