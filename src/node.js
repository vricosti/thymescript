import ThymeleafJs from './thymeleaf.js';
import { JSDOM } from 'jsdom';
import pkg from 'dom-compare';

const { compare } = pkg;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;



function createDOMParser() {
  if (typeof window !== 'undefined' && 'DOMParser' in window) {
    // Browser environment
    //console.log('Browser environment');
    const parser = new DOMParser();
    return {
      parseFromString: (html, type) => { 
        //console.log('parseFromString: ', html);
        return parser.parseFromString(html, type)
      },
    };
  } else {
    // Node.js environment
    //console.log('Node.js environment');
    return {
      parseFromString: (html, type) => { 
        //console.log('parseFromString: ', html);
        return new JSDOM(html).window.document
      },
    };
  }
}

function renderAndCompare(msg, templateHtml, context, expectedHtml) {
  
  console.log(msg);

  const renderedHtml = ThymeleafJs.render(templateHtml, context);
  console.log(renderedHtml);
  const parser = createDOMParser();
  const docRendered = parser.parseFromString(renderedHtml, 'text/html');
  const docExpected = parser.parseFromString(expectedHtml, 'text/html');
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
  message: 'ChatGPT is amazing!',
  messageWelcome: 'Welcome to our <b>fantastic</b> grocery store!',
  teacher: {
    "name": "John Smith",
    "gender": "M",
    "age": 35,
    "subject": "Mathematics",
    "active": true,
  }
};

const html01 = `
<html>
  <head></head>
  <body>
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
  </body>
</html>
`;
const expectedHtml01 = `
<html>
  <head></head>
  <body>
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

// // Example04
// const context04 = {
//   anObject: [
//     { creation: "2023-04-20", requestId: "1", status: "active" },
//     { creation: "2023-04-19", requestId: "2", status: "inactive" },
//     null,
//     { creation: "2023-04-18", requestId: "3", status: "active" },
//   ]
// };
// const html04 = `
// <table class="table" style="margin-bottom: 0;">
//   <tr vr:each="value : {anObject}" vr:if="{value != null}" data-request-id="{value.requestId}" data-status-id="{value.status}">
//     <td vr:text="{value.creation}">DefaultValue</td>
//   </tr>
// </table>
// `;
// const modifiedHtml04 = ThymeleafJs.render(html04, context04);
// console.log(modifiedHtml04);

// const expectedHtml04 = `
// <table class="table" style="margin-bottom: 0;">
//   <tr data-request-id="1" data-status-id="active">
//     <td>2023-04-20</td>
//   </tr>
//   <tr data-request-id="2" data-status-id="inactive">
//     <td>2023-04-19</td>
//   </tr>
//   <tr data-request-id="3" data-status-id="active">
//     <td>2023-04-18</td>
//   </tr>
// </table>
// `;








