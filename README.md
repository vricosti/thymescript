# ThymeleafJS 

ThymeleafJs is a powerful and flexible JavaScript library for client-side HTML template rendering, inspired by Thymeleaf. 
This library is perfect for those who are looking for a simple (8kB) yet powerful way to manipulate and render HTML templates using JavaScript.  
<ins>**ThymeleafJs was generated with the help of ChatGPT (OpenAI), and its servitor to guide it.**<ins>

## Features

- Client-side rendering support
- Easy-to-use syntax inspired by Thymeleaf
- Conditional rendering and iteration support
- Customizable attribute expressions and processing
- Seamless integration with popular JavaScript frameworks

## Installation

For the moment there is no npm package, you have to build the library and copy it inside your project:  

```
npm install
npm run build:prod
```

## Usage  

### 1. Include ThymeleafJs in your HTML file

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ThymeleafJs Example</title>
    <script src="dist/thymeleaf.min.js"></script>
    <script id="template">...SEE BELOW...</script>
</head>
<body>
  <div id="app">
    <!-- !! The ThymeleafJs output will be inserted here !! -->
  </div>
</body>
</html>
```

### 2. Create an HTML template with ThymeleafJs attributes

``` html
<script id="template">
    document.addEventListener('DOMContentLoaded', () => {
      
      const template = `
        <div th:object="{user}">
          <h1>Welcome, <span th:text="*{name}"></span>!</h1>
          <p>Your email address is: <span th:text="*{email}"></span></p>
          <p>Your friends:</p>
          <ul>
              <li th:each="friend : *{friends}">
                  <span th:text="{friend.name}">Friend's Name</span>
              </li>
          </ul>
        </div>
        `;

      const context = {
          user: {
              name: 'John Doe',
              email: 'john.doe@example.com',
              friends: [
                  { name: 'Alice' },
                  { name: 'Bob' }
              ]
          }
      };
      
      const output = ThymeleafJs.render(template, context);
      document.getElementById('app').innerHTML = output;
    });
  </script>
```

This will render the following HTML:  

``` html
<div>
    <h1>Welcome, John Doe!</h1>
    <p>Your email address is: john.doe@example.com</p>
    <p>Your friends:</p>
    <ul>
        <li>Alice</li>
        <li>Bob</li>
    </ul>
</div>
```

## Differences with server-side Thymeleaf (Java)  

Since we are inside the browser and to be able to use Template string we use the `th:{varName}` instead of `th:${varName}`.

Following attributes are not implemented (yet):  

- th:block is not yet implemented 
- th:var
- th:remove, th:include, th:replace, th:insert, th:fragment
- th:switch, th:case

Currently because of the way a DOM parser works it cannot render part of html that is not valid  
from a DOM parser point of view (for instance a `<tr>` not inside a `<table>`)

``` html
<tr th:data-request-id="{requestId}" th:data-status-id="{status}">
  <td th:text="{creation}"></td>
  <td th:text="{name}"></td>
</tr>
```
You will have to trick the parser by using a custom element (ex: `<my-tr>`, `<my-td>`):  

``` html
  <my-tr th:data-request-id="{requestId}" th:data-status-id="{status}">
    <my-td th:text="{creation}"></my-td>
    <my-td th:text="{name}"></my-td>
  </my-tr>
```

Then render and replace:  

``` javascript
const context = {
  requestId:1367,
  creation:"2022-11-23 11:01:35",
  name:"getLoanSimulation:957",
  status:"finished_error"
};

// render the 'invalid' (from DOM parser point of view) html
const rendered = ThymeleafJs.render(template, context);
const updatedTemplate = rendered
  .replace(/<my-tr/g, '<tr').replace(/<\/my-tr>/g, '</tr>')
  .replace(/<my-td/g, '<td').replace(/<\/my-td>/g, '</td>');

```

I might address this point later on but for performance reason it's always better to render valid html.
Possible workarounds:

- Provide a render_invalid_html function where internally it will transform nodes into custom elements,  
renders then replace elements
- Use a light html parser instead of browser dom parser  

## Debug && run demo  

To starts the tests: `npm run serve`
To launch the demo: `npm run test:node`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License  

hymeleafJs is released under the MIT License. See the LICENSE file for more information.




