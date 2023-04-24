import ThymeleafJs from './thymeleaf.js';

const thymeleaf = new ThymeleafJs();

// Example01
const context01 = {
  message: 'ChatGPT is amazing!',
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
    <p vr:text="{message}">DefaultValue</p>
    <p vr:text="{teacher.active} ? 'ACTIVE' : 'RETIRED'"></p>
    <p th:if="{teacher.gender == 'F'}">Female</p>
    <p th:unless="{teacher.gender == 'F'}">Male</p>
  </body>
</html>
`;
const modifiedHtml01 = thymeleaf.render(html01, context01);
console.log(modifiedHtml01);
/*
const expectedHtml01 = `
<html>
  <head></head>
  <body>
    <p>ChatGPT is amazing!</p>
    <p>ACTIVE</p>
    <p>Male</p>
  </body>
</html>
`;
*/

// Example02
// const context02 = { condition: false };
// const html02 = `
// <span vr:if="{condition}" class="base condition-true">
//    This HTML is duplicated. We probably want a better solution.
// </span>
// <span vr:if="{!condition}" class="base condition-false">
//    This HTML is duplicated. We probably want a better solution.
// </span>
// `;
// const modifiedHtml02 = thymeleaf.render(html02, context02);
// console.log(modifiedHtml02);
/*
const expectedHtml02 = `
<span class="base condition-true">
   This HTML is duplicated. We probably want a better solution.
</span>
`;
*/

// const html03 = `
// <span vr:attr="class={condition ? 'base condition-true' : 'base condition-false'}">
//    This HTML is consolidated, which is good, but the Thymeleaf attribute still has some redundancy in it.
// </span>
// `;

// const context03 = { condition: true };
// const expectedHtml03 = `
// <span class="base condition-true">
//    This HTML is consolidated, which is good, but the Thymeleaf attribute still has some redundancy in it.
// </span>
// `;

// const html04 = `
// <table class="table" style="margin-bottom: 0;">
//   <tr vr:each="value : {anObject}" vr:if="{value != null}" data-request-id="{value.requestId}" data-status-id="{value.status}">
//     <td vr:text="{value.creation}">DefaultValue</td>
//   </tr>
// </table>
// `;

// const context04 = {
//   anObject: [
//     { creation: "2023-04-20", requestId: "1", status: "active" },
//     { creation: "2023-04-19", requestId: "2", status: "inactive" },
//     null,
//     { creation: "2023-04-18", requestId: "3", status: "active" },
//   ]
// };

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





// const modifiedHtml03 = thymeleaf.render(html03, context03);
// console.log(modifiedHtml03);

// const modifiedHtml04 = thymeleaf.render(html04, context04);
// console.log(modifiedHtml04);
