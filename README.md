# ThymeleafJS 

ThymeleafJs is a powerful and flexible JavaScript library for client-side HTML template rendering, inspired by Thymeleaf. 
It can be used both in the browser and in Node.js.
This library is perfect for those who are looking for a simple (8kB) yet powerful way to manipulate and render HTML templates using JavaScript.  
ThymeleafJs was generated with the help of ChatGPT, an AI language model by OpenAI (and its servitor to guide it).

## Features

- Client-side rendering support
- Easy-to-use syntax inspired by Thymeleaf
- Conditional rendering and iteration support
- Customizable attribute expressions and processing
- Seamless integration with popular JavaScript frameworks

## Differences with server-side Thymeleaf (Java)  

- Since we are inside the browser we use the `th:{varName}` instead of `th:${varName}`.

Following attributes are not implemented (yet):  

- th:block is not yet implemented 
- th:var
- th:href, th:src, th:action
- th:include, th:replace, th:insert, th:fragment
- th:attrprepend
- th:attrappend
- th:switch, th:case
- th:style
- th:field, th:label, th:option, th:optgroup, th:errorclass, th:errors
- th:inline, th:remove, th:assert, th:alias, th:data

## Installation

For the moment there is no npm package, you have to build the library and copy it inside your project:  

`npm run build:prod`

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
        <div vr:object="{user}">
          <h1>Welcome, <span vr:text="*{name}"></span>!</h1>
          <p>Your email address is: <span vr:text="*{email}"></span></p>
          <p>Your friends:</p>
          <ul>
              <li vr:each="friend : *{friends}">
                  <span vr:text="{friend.name}">Friend's Name</span>
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


## Run example  

`npm run serve`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License  

hymeleafJs is released under the MIT License. See the LICENSE file for more information.




