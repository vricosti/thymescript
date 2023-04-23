# ThymeleafJS

ThymeleafJS is a template engine for JavaScript that supports the Thymeleaf syntax. It can be used both in the browser and in Node.js.

## Usage

### Installation

You can install ThymeleafJS using npm:

```bash
npm install thymeleafjs


const ThymeleafJs = require('thymeleafjs');

const thymeleaf = new ThymeleafJs();

const html = `
  <html>
    <head></head>
    <body>
      <p th:text="@{message}">DefaultValue</p>
    </body>
  </html>
`;

const context = { message: 'ChatGPT is amazing!' };
const modifiedHtml = thymeleaf.render(html, context);
console.log(modifiedHtml);

ThymeleafJS Attributes
ThymeleafJS supports the following ThymeleafJS attributes:

th:if="@{condition-to-evaluate}": Used to test a condition and is the most prioritary attribute.
th:text="@{text}": Used to set the text of a tag.
th:attr="attribute=...": Used to set an attribute (most common use is with class attribute).
th:class="@{class}": Used to set the class attribute of a tag.
th:each="varName:@{data}": Used to repeat some tags and is evaluated as data.forEach(function (varName) { }).
Differences from Thymeleaf
To avoid conflicts when using string interpolation in JavaScript, ThymeleafJS uses @ instead of $ before braces. For example, th:text="$\{message}" in Thymeleaf should be written as th:text="@{message}" in ThymeleafJS.

Also, ThymeleafJS uses th:class for setting the class attribute of a tag, instead of th:classappend in Thymeleaf.

Examples
Example 1
javascript
Copy code
const ThymeleafJs = require('thymeleafjs');

const thymeleaf = new ThymeleafJs();

const html = `
  <html>
    <head></head>
    <body>
      <p th:text="@{message}">DefaultValue</p>
    </body>
  </html>
`;

const context = { message: 'ChatGPT is amazing!' };
const modifiedHtml = thymeleaf.render(html, context);
console.log(modifiedHtml);
Output:

php
Copy code
<html>
  <head></head>
  <body>
    <p>ChatGPT is amazing!</p>
  </body>
</html>