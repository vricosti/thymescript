import ThymeleafJs from '../src/thymeleaf.node.js';
import pkg from 'dom-compare';

const { compare } = pkg;

////////////////////
// TO TEST AND DEBUG: temporary add type": "module" inside package.json and npm run test:node
////////////////////

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
      email: 'leo.dicaprio123@gmail.com' 
    },
    'Meryl Streep': { 
      age: 72, 
      email: 'meryl.streep456@yahoo.com' 
    },
    'Tom Hanks': { 
      age: 65, 
      email: 'tom.hanks789@hotmail.com',
      children: {
        'Colin Hanks': {
          age: 45, 
          email: 'colin.hanks253@hotmail.com',
        }
      }
    }
  },
  cssStyle: 'warning'
};

const html01 = `
<html>
  <head></head>
  <body>
    <p th:text="'Simple Text'"></p>
    <p th:text="'Simple Text: ' + {message}">DefaultValue</p>
    <p th:text="'Escaped Text: ' + {messageWelcome}">DefaultValue</p>
    <p th:utext="'Unescaped Text: ' + {messageWelcome}">DefaultValue</p>
    <p th:text="{message}">DefaultValue</p>
    <p th:text="{teacher.active} ? 'ACTIVE' : 'RETIRED'"></p>
    <p th:text="{teacher.active ? 'ACTIVE' : 'RETIRED'}"></p>
    <p th:text="{teacher.subject == 'Mathematics' ? 'You like mathematics' : 'You dont like mathematics'}"></p>
    <p th:if="{teacher.gender == 'M'}">Male</p>
    <p th:unless="{teacher.gender == 'M'}">Female</p>
    <p th:if="{teacher.age &gt; 29 and teacher.age &lt; 49}">Middle age</p>
    <p th:if="{teacher.age gt  29 and teacher.age lt 49}">Middle age</p>
    <div th:object="{friends['Tom Hanks']}" class="box">
      <p><b>Tom Hanks's:</b> <span th:utext="'age: '+ *{age} + ' email: ' + *{email}"></span></p>
      <p><b>Tom Hanks's age:</b> <span th:utext="*{age}"></span></p>
      <p th:object="{children['Colin Hanks']}"><b>Colin Hanks's age:</b> <span th:utext="*{age}"></span></p>
      <p><b>Author's age:</b> <span th:utext="{age}"></span></p>
    </div>
    <input type="button" value="Do it!" class="btn" th:attrappend="class={' ' + cssStyle}" />
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
      <p><b>Tom Hanks's:</b> <span>age: 65 email: tom.hanks789@hotmail.com</span></p>
      <p><b>Tom Hanks's age:</b> <span>65</span></p>
      <p><b>Colin Hanks's age:</b> <span>45</span></p>
      <p><b>Author's age:</b> <span>45</span></p>
    </div>
    <input type="button" value="Do it!" class="btn  warning" />
  </body>
</html>
`;
renderAndCompare('Example01', html01, context01, expectedHtml01);


// Example02
const context02 = { condition: false };
const html02 = `
<span th:if="{condition}" class="base condition-true">
  This HTML is duplicated. We probably want a better solution.
</span>
<span th:if="{!condition}" class="base condition-false">
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
<span th:attr="class={condition ? 'base condition-true' : 'base condition-false'}">
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
  <tr th:each="item : {items}" th:if="{item != null}" th:data-request-id="{item.requestId}" th:data-status-id="{item.status}">
    <td th:text="{item.creation}">DefaultValue</td>
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
<table class="table" th:classappend="{condition ? 'condition-true' : ''}" style="margin-bottom: 0;">
  <tr th:each="item : {items}" th:if="{item != null}" th:attr="data-request-id={item.requestId}, data-status-id={item.status}">
    <td th:text="{item.creation}">DefaultValue</td>
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


const context06 = {
  requestId:1367,
  creation:"2022-11-23 11:01:35",
  name:"getLoanSimulation:957",
  status:"finished_error",
  url:"/case/rest/testthymleafjs/36363/1367",
  displayBtn: true,
  btnText: "Replay"
};
const html06 = `
<tr th:data-request-id="{requestId}" th:data-status-id="{status}">
  <td th:text="{creation}"></td>
  <td th:text="{name}"></td>
  <td>
      <a th:if="{url}" th:href="{url}">
          <i class="fas fa-file-download fa-2x" style="color: #A7A8AA"></i>
      </a>
  </td>
  <td>
      <strong th:text="{status}"></strong> : <span th:text="{errorMessage}"></span>
  </td>
  <td>
      <div th:id="'divButton-WsRequest_' + {requestId}">
          <a th:if="{displayBtn and (status == 'finished_error' or status == 'finished_timeout')}"
              class="btn tul-blue-malibu" style="display: inline; margin: 0.5em;border-radius: 2em;"
              th:id="'WSREQUEST_' + {requestId} + '_button'"
              th:text="{btnText}">
          </a>
      </div>
  </td>
</tr>
`;
const expectedHtml06 = `
<tr data-request-id="1367" data-status-id="finished_error">
  <td th:text="2022-11-23 11:01:35">2022-11-23 11:01:35</td>
  <td th:text="getLoanSimulation:957">getLoanSimulation:957</td>
  <td>
    <a th:href="/case/rest/testthymleafjs/36363/1367">
      <i class="fas fa-file-download fa-2x" style="color: #A7A8AA"></i>
    </a>
  </td>
  <td>
    <strong>finished_error</strong> : <span></span>
  </td>
  <td>
      <div id="divButton-WsRequest_1367">
          <a id="WSREQUEST_1367_button"
              class="btn tul-blue-malibu" style="display: inline; margin: 0.5em;border-radius: 2em;">Replay
          </a>
      </div>
  </td>
</tr>
`;
renderAndCompare('Example06', html06, context06, expectedHtml06);

