## Synopsis

This is a series of web component respecting both the web components standards and the Linked Data Platform convention.
They are aimed at enabling anyone with little development skills to create their own web application by placing these components in an HTML file.

## Code Example

An example can be seen in index.html:
```
<ldp-display data-src="http://localhost:8000/todos/" data-fields="set1, author, picture" data-widgets='{"set1": ["name", "text1"], "text1": {"value": "youpi"}, "picture" : "ldp-display-img"}' custom-styles="mystyles"></ldp-display>
<ldp-form data-src="http://localhost:8000/todos/"></ldp-form>
```
This shows the list of todos listed by the container, and a form to create a new one.

## Initialization

You first need to load the webcomponents polyfill for the browser that have not implemented them yet, and import the components you want to use in your HTML file:
```
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

**They accept the following attributes:**

 - **data-src**: The uri of the LDP resource you want them to display. If this resource is a container, ldp-display will create a child `<ldp-display>` for each resource it contains, and ldp-form will display a blank form to create a new resource.
 - **data-fields**: the ordered list of fields to be displayed, separated by a comma. By default, all the fields of the resource are displayed
 - **data-widgets**: the widgets to be used to display each field. This is a JSON object. By default, the widget used is ldp-display-div. If the value corresponding to a field is an array, it is displayed as a set, enabling to create a html hierarchy. If it is an object with a 'value' field, it will be displayed as a raw text.
 - **custom-styles**: the id of a template tag containing a style tag that will be applied to the internals of the component. A class is created for each field, based on its name. Eg: if your model has a field named "title", you can add style to it with a class `.title`.

**Example :**
```
<ldp-display 
    id="list"
    data-src="http://localhost:8000/todos/"
    data-fields="set1, author"
    set-set1="name, text"
    value-text="Hello World !"
    search-fields="name, author"
></ldp-display>

```

### ldp-router

**Accepts the following attributes:**

 - **default-route**: The `name` attribute of the default `<ldp-route>` displayed.
 - **route-prefix**: If you app is not run from the root of your domain name, for instance `www.your-domain.com/some-uri`, you should set `route-prefix` to "some-uri". 
 - **use-hash**: If you can't rewrite the URLs on your server, you might want to set this attribute to `true` to use `location.hash` instead of `location.pathname` as URLs. 


**Example :**
```
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

