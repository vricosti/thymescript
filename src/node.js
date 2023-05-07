import ThymeleafJs from './thymeleaf.js';
import { JSDOM } from 'jsdom';
import pkg from 'dom-compare';

const { compare } = pkg;


function renderAndCompare(msg, templateHtml, context, expectedHtml) {
  
  console.log(msg);

  const renderedHtml = ThymeleafJs.render(templateHtml, context);
  console.log(renderedHtml);
  
  const docRendered = ThymeleafJs.createDOMParser(renderedHtml);
  const docExpected = ThymeleafJs.createDOMParser(expectedHtml);
  const result = compare(docExpected, docRendered);
  if (result.getResult()) {
    console.log('The elements are the same.\n');
  } else {
    console.log('The elements are different.\n');
    console.log(result.getDifferences());
  }
}


// Example01
const context01 = {
  name: 'Vince Ricosti',
  age: 45,
  message: 'ChatGPT is amazing!',
  messageWelcome: 'Welcome to our <b>fantastic</b> grocery store!',
  teacher: {
    "name": "John Smith",
    "gender": "M",
    "age": 35,
    "subject": "Mathematics",
    "active": true,
  },
  friends: {
    'Leonardo DiCaprio': { 
      age: 47, 
      email: 'leo.dicaprio@gmail.com' 
    },
    'Meryl Streep': { 
      age: 72, 
      email: 'meryl.streep@yahoo.com' 
    },
    'Tom Hanks': { 
      age: 65, 
      email: 'tom.hanks@hotmail.com',
      children: {
        'Colin Hanks': {
          age: 45, 
          email: 'colin.hanks@hotmail.com',
        }
      }
    }
  },
};

const html01 = `
<html>
  <head></head>
  <body>
    <p vr:text="'Simple Text'"></p>
    <p vr:text="'Simple Text: ' + {message}">DefaultValue</p>
    <p vr:text="'Escaped Text: ' + {messageWelcome}">DefaultValue</p>
    <p vr:utext="'Unescaped Text: ' + {messageWelcome}">DefaultValue</p>
    <p vr:text="{message}">DefaultValue</p>
    <p vr:text="{teacher.active} ? 'ACTIVE' : 'RETIRED'"></p>
    <p vr:text="{teacher.active ? 'ACTIVE' : 'RETIRED'}"></p>
    <p vr:text="{teacher.subject == 'Mathematics' ? 'You like mathematics' : 'You dont like mathematics'}"></p>
    <p vr:if="{teacher.gender == 'M'}">Male</p>
    <p vr:unless="{teacher.gender == 'M'}">Female</p>
    <p vr:if="{teacher.age &gt; 29 and teacher.age &lt; 49}">Middle age</p>
    <p vr:if="{teacher.age gt  29 and teacher.age lt 49}">Middle age</p>
    <div vr:object="{friends['Tom Hanks']}" class="box">
      <p><b>Tom Hanks's:</b> <span vr:utext="'age: '+ *{age} + ' email: ' + *{email}"></span></p>
      <p><b>Tom Hanks's age:</b> <span vr:utext="*{age}"></span></p>
      <p vr:object="{children['Colin Hanks']}"><b>Colin Hanks's age:</b> <span vr:utext="*{age}"></span></p>
      <p><b>Author's age:</b> <span vr:utext="{age}"></span></p>
    </div>
  </body>
</html>
`;
const expectedHtml01 = `
<html>
  <head></head>
  <body>
    <p>Simple Text</p>
    <p>Simple Text: ChatGPT is amazing!</p>
    <p>Escaped Text: Welcome to our &lt;b&gt;fantastic&lt;/b&gt; grocery store!</p>
    <p>Unescaped Text: Welcome to our <b>fantastic</b> grocery store!</p>
    <p>ChatGPT is amazing!</p>
    <p>ACTIVE</p>
    <p>ACTIVE</p>
    <p>You like mathematics</p>
    <p>Male</p>
    <p>Middle age</p>
    <p>Middle age</p>
    <div class="box">
      <p><b>Tom Hanks's:</b> <span>age: 65 email: tom.hanks@hotmail.com</span></p>
      <p><b>Tom Hanks's age:</b> <span>65</span></p>
      <p><b>Colin Hanks's age:</b> <span>45</span></p>
      <p><b>Author's age:</b> <span>45</span></p>
    </div>
  </body>
</html>
`;
renderAndCompare('Example01', html01, context01, expectedHtml01);


// Example02
const context02 = { condition: false };
const html02 = `
<span vr:if="{condition}" class="base condition-true">
  This HTML is duplicated. We probably want a better solution.
</span>
<span vr:if="{!condition}" class="base condition-false">
  This HTML is duplicated. We probably want a better solution.
</span>
`;
const expectedHtml02 = `
<span class="base condition-false">
  This HTML is duplicated. We probably want a better solution.
</span>
`;
renderAndCompare('Example02', html02, context02, expectedHtml02);

// Example03
const context03 = { condition: true };
const html03 = `
<span vr:attr="class={condition ? 'base condition-true' : 'base condition-false'}">
   This HTML is consolidated, which is good, but the Thymeleaf attribute still has some redundancy in it.
</span>
`;
const expectedHtml03 = `
<span class="base condition-true">
   This HTML is consolidated, which is good, but the Thymeleaf attribute still has some redundancy in it.
</span>
`;
renderAndCompare('Example03', html03, context03, expectedHtml03);

// Example04
const context04 = {
  items: [
    { creation: "2023-04-20", requestId: "1", status: "active" },
    { creation: "2023-04-19", requestId: "2", status: "inactive" },
    null,
    { creation: "2023-04-18", requestId: "3", status: "active" },
  ]
};
const html04 = `
<table class="table" style="margin-bottom: 0;">
  <tr vr:each="item : {items}" vr:if="{item != null}" vr:data-request-id="{item.requestId}" vr:data-status-id="{item.status}">
    <td vr:text="{item.creation}">DefaultValue</td>
  </tr>
</table>
`;
const expectedHtml04 = `
<table class="table" style="margin-bottom: 0;">
  <tbody>
    <tr data-request-id="1" data-status-id="active">
      <td>2023-04-20</td>
    </tr>
    <tr data-request-id="2" data-status-id="inactive">
      <td>2023-04-19</td>
    </tr>
    <tr data-request-id="3" data-status-id="active">
      <td>2023-04-18</td>
    </tr>
  </tbody>
</table>
`;
renderAndCompare('Example04', html04, context04, expectedHtml04);


// Example05
const context05 = {
  condition: true,
  items: [
    { creation: "2023-04-20", requestId: "1", status: "active" },
    { creation: "2023-04-19", requestId: "2", status: "inactive" },
    null,
    { creation: "2023-04-18", requestId: "3", status: "active" },
  ]
};
const html05 = `
<table class="table" vr:classappend="{condition ? 'condition-true' : ''}" style="margin-bottom: 0;">
  <tr vr:each="item : {items}" vr:if="{item != null}" vr:attr="data-request-id={item.requestId}, data-status-id={item.status}">
    <td vr:text="{item.creation}">DefaultValue</td>
  </tr>
</table>
`;
const expectedHtml05 = `
<table class="table condition-true" style="margin-bottom: 0;">
  <tbody>
    <tr data-request-id="1" data-status-id="active">
      <td>2023-04-20</td>
    </tr>
    <tr data-request-id="2" data-status-id="inactive">
      <td>2023-04-19</td>
    </tr>
    <tr data-request-id="3" data-status-id="active">
      <td>2023-04-18</td>
    </tr>
  </tbody>
</table>
`;
renderAndCompare('Example05', html05, context05, expectedHtml05);

