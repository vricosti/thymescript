import { JSDOM } from 'jsdom';
import prettier from 'prettier';

// Declare constants inside the class
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

class ThymeleafJs {


  constructor() {
    this.localContext = null;

    this.directives = {
      'vr:text': this.processText,
      'vr:utext': this.processUText,
      'vr:if': this.processIf,
      'vr:unless': this.processUnless,
      'vr:attr': this.processAttr,
      'vr:class': this.processClass,
      'vr:object': this.processObject, 
      'vr:each': this.processEach,
    };
  }

  // static createDOMParser(html) {
  //   if (typeof window !== 'undefined' && 'DOMParser' in window) {
  //     // Browser environment
  //     console.log('Browser environment');
  //     const parser = new DOMParser();
  //     return parser.parseFromString(html, 'text/html');
  //   } else {
  //     // Node.js environment
  //     console.log('Node.js environment');
  //     return new JSDOM(html).window.document;
  //   }
  // }

  static render(html, context) {
    const thymeleaf = new ThymeleafJs();
    return thymeleaf.render(html, context);
  }

  render(html, context) {
    const dom = new JSDOM(`${html}`);
    const document = dom.window.document;
    this.processNode(document.body, context);
    //return document.body.innerHTML;

    const hasHtmlTag = /<html[\s\S]*?>/i.test(html);
    if (hasHtmlTag) {
      const formattedHtml = dom.serialize();
      //const formattedHtml = prettier.format(dom.serialize(), { parser: 'html' });
      return formattedHtml;
    } else {
      const formattedHtml = document.body.innerHTML;
      //const formattedHtml = prettier.format(document.body.innerHTML, { parser: 'html' });
      return formattedHtml;
    }
  }


  removeEmptyTextNodes(node) {
    if (node.previousSibling && node.previousSibling.nodeType === TEXT_NODE && !/\S/.test(node.previousSibling.textContent)) {
      node.parentNode.removeChild(node.previousSibling);
    }
    if (node.nextSibling && node.nextSibling.nodeType === TEXT_NODE && !/\S/.test(node.nextSibling.textContent)) {
      node.parentNode.removeChild(node.nextSibling);
    }
  }

  processNode(node, context) {

    if (node.nodeType === ELEMENT_NODE) {

      if (node.hasAttribute('vr:object')) {
        let objectAttr = node.getAttributeNode('vr:object');
        this.processObject(node, objectAttr, context);
        node.removeAttribute('vr:object');
      }

      // Use the local context if it's set, otherwise use the original context
      let newContext = this.localContext || context;

      //console.log('node.nodeType: ', node.nodeType);
      for (const attr of Array.from(node.attributes)) {
        
        // Skip the vr:object attribute because we already processed it
        if (attr.name === 'vr:object') continue;

        const directiveFn = this.directives[attr.name];
        if (directiveFn) {
          directiveFn.call(this, node, attr, newContext);
          node.removeAttribute(attr.name);
        }
      }

      //console.log('node.childNodes: ', node.childNodes);
      for (const childNode of Array.from(node.childNodes)) {
        this.processNode(childNode, this.localContext || context);
      }
    }

    // Reset the local context to null after processing the child nodes
    this.localContext = null;
  }

  processObject(node, attr, context) {
    let localContextExpr = node.getAttribute('vr:object');
    this.localContext = this.evaluate(localContextExpr, context);
  }


  processUText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.innerHTML = text;
  }

  processText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.textContent = text;
  }

  processIf(node, attr, context) {

    console.log(`processIf: attr.value=${attr.value} context=${context}`);
    const condition = this.evaluate(attr.value, context);
    if (!condition) {
      this.removeEmptyTextNodes(node);
      node.remove();
    }
  }

  processUnless(node, attr, context) {
    const condition = this.evaluate(attr.value, context);
    if (condition) {
      this.removeEmptyTextNodes(node);
      node.remove();
    }
  }

  processAttr(node, attr, context) {
    const [name, expression] = attr.value.split('=');
    const value = this.evaluate(expression, context);
    node.setAttribute(name, value);
  }

  processClass(node, attr, context) {
    const className = this.evaluate(attr.value, context);
    node.setAttribute('class', className);
  }

  processEach(node, attr, context) {
    const [varName, expression] = attr.value.split(':');
    const dataArray = this.evaluate(expression, context);

    const parent = node.parentNode;
    node.removeAttribute(attr.name);

    for (const item of dataArray) {
      if (item === null) continue;

      const clone = node.cloneNode(true);
      const newContext = { ...context, [varName]: item };
      console.log('newContext= ', newContext);
      this.processNode(clone, newContext);
      parent.insertBefore(clone, node);
    }

    parent.removeChild(node);
  }

  evaluate(expression, context) {
    // Check if the expression uses the *{} notation
    let expr = expression.replace(/\{(.*?)\}/g, '$1');

    expr = expr.replace(/(\b)and(\b)/gi, ' && ')
      .replace(/(\b)or(\b)/gi, ' || ')
      .replace(/(\b)gt(\b)/gi, ' > ')
      .replace(/(\b)lt(\b)/gi, ' < ')
      .replace(/(\b)ge(\b)/gi, ' >= ')
      .replace(/(\b)le(\b)/gi, ' =< ')
      .replace(/(\b)not(\b)/gi, ' ! ');

    // When evaluating, use the local context if it's set, otherwise use the context passed
    let actualContext = this.localContext || context;

    // Get the keys and values of the actual context
    const actualContextKeys = Object.keys(actualContext);
    const actualContextValues = Object.values(actualContext);

    // Replace *{ with { in the expression before evaluating
    // Also, remove * if it's used outside of curly braces
    let actualExpr = expr.replace(/\*\{/g, '{').replace(/\*/g, '');

    console.log('actualExpr: ', actualExpr);
    console.log('actualContextKeys: ', actualContextKeys);
    console.log('actualContextValues: ', actualContextValues);

    const func = new Function(...actualContextKeys, `return (${actualExpr});`);
    return func(...actualContextValues);
}


  
  // evaluate(expression, context) {

  //   const contextKeys = Object.keys(context);
  //   const contextValues = Object.values(context);
  //   const expr = expression.replace(/\{(.*?)\}/g, '$1');

  //   const updatedExpr = expr.replace(/(\b)and(\b)/gi, ' && ')
  //     .replace(/(\b)or(\b)/gi, ' || ')
  //     .replace(/(\b)gt(\b)/gi, ' > ')
  //     .replace(/(\b)lt(\b)/gi, ' < ')
  //     .replace(/(\b)ge(\b)/gi, ' >= ')
  //     .replace(/(\b)le(\b)/gi, ' =< ')
  //     .replace(/(\b)not(\b)/gi, ' ! ');

  //   console.log('updatedExpr: ', updatedExpr);

  //   // When evaluating, use the local context if it's set, otherwise use the global context
  //   let actualContext = this.localContext || context || this.globalContext;

  //   // Replace *{ with { in the expression before evaluating
  //   // Also, remove * if it's used outside of curly braces
  //   let actualExpr = updatedExpr.replace(/\*\{/g, '{').replace(/\*/g, '');

  //   const func = new Function(...contextKeys, `return (${actualExpr});`);
  //   return func(...contextValues);
  // }

}

export default ThymeleafJs;