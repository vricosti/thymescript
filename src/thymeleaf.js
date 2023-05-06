import { JSDOM } from 'jsdom';
import prettier from 'prettier';

  // Declare constants inside the class
  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

class ThymeleafJs {


  constructor() {
    this.directives = {
      'vr:text': this.processText,
      'vr:utext': this.processUText,
      'vr:if': this.processIf,
      'vr:unless': this.processUnless,
      'vr:attr': this.processAttr,
      'vr:class': this.processClass,
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

  static render(html, userContext) {
    const thymeleaf = new ThymeleafJs();
    return thymeleaf.render(html, userContext);
  }

  render(html, userContext) {
    
    const context = {
      globalContext: userContext,
      curContexts: [],
    };

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

      let hasObjectAttr = false;
      if (node.hasAttribute('vr:object')) {
        let objectAttr = node.getAttributeNode('vr:object');
        let objectValue = objectAttr.value.replace(/\{(.*?)\}/g, '$1');
        context.curContexts.push(objectValue);
        node.removeAttribute('vr:object');
        hasObjectAttr = true;
      }


      //console.log('node.nodeType: ', node.nodeType);
      for (const attr of Array.from(node.attributes)) {
        const directiveFn = this.directives[attr.name];
        if (directiveFn) {
          directiveFn.call(this, node, attr, context);
          node.removeAttribute(attr.name);
        }
      }

      //console.log('node.childNodes: ', node.childNodes);
      for (const child of Array.from(node.childNodes)) {
        this.processNode(child, context);
      }
      if (hasObjectAttr) {
        context.curContexts.pop();
      }
    }
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
    const contextKeys = Object.keys(context.globalContext);
    const contextValues = Object.values(context.globalContext);

    let expr = expression.replace(/(\b)and(\b)/gi, ' && ')
      .replace(/(\b)or(\b)/gi, ' || ')
      .replace(/(\b)gt(\b)/gi, ' > ')
      .replace(/(\b)lt(\b)/gi, ' < ')
      .replace(/(\b)ge(\b)/gi, ' >= ')
      .replace(/(\b)le(\b)/gi, ' =< ')
      .replace(/(\b)not(\b)/gi, ' ! ');

      console.log('context.curContexts: ', context.curContexts);
    
      const curContext = context.curContexts.length ? context.curContexts.join('.') : '';
      expr = expr.replace(/(\*?){([^}]+)}/g, (match, p1, p2) => {
        return (p1 === '*' && curContext) ? curContext + '.' + p2 : p2;
      });
      console.log('expr: ', expr);

    console.log('contextKeys: ', contextKeys);
    

    const func = new Function(...contextKeys, `return (${expr});`);
    return func(...contextValues);
  }
}

export default ThymeleafJs;