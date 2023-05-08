const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

class ThymeleafJs {


  constructor() {
    this.directives = {
      'th:each': this.processEach,
      'th:if': this.processIf,
      //'th:object': this.processObject,
      'th:unless': this.processUnless,
      'th:utext': this.processUText,
      'th:text': this.processText,
      'th:attr': this.processAttr,
      'th:attrappend': this.processAttrAppend,
      'th:attrprepend': this.processAttrPrepend,
      'th:class': this.processClass,
      'th:classappend': this.processClassAppend,
      'th:styleappend': this.processStyleAppend,
    };
  }

  static createDOMParser(html) {
    if (typeof window !== 'undefined' && 'DOMParser' in window) {
      // Browser environment
      const parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    } else {
      // Node.js environment
      return new JSDOM(html).window.document;
    }
  }

  static render(html, userContext) {
    const thymeleaf = new ThymeleafJs();
    return thymeleaf.render(html, userContext);
  }

  render(html, userContext) {
    
    const context = {
      attrName: '',
      globalContext: userContext,
      objectContexts: [],
    };

    //const dom = new JSDOM(`${html}`);
    const document = ThymeleafJs.createDOMParser(`${html}`);
    this.processNode(document.body, context);
    //return document.body.innerHTML;
  
    const hasHtmlTag = /<html[\s\S]*?>/i.test(html);
    if (hasHtmlTag) {
      const formattedHtml = document.body.innerHTML;
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
      if (node.hasAttribute('th:object')) {
        let objectAttr = node.getAttributeNode('th:object');
        let objectValue = objectAttr.value.replace(/\{(.*?)\}/g, '$1');
        context.objectContexts.push(objectValue);
        node.removeAttribute('th:object');
        hasObjectAttr = true;
      }


      //console.log('node.nodeType: ', node.nodeType);
      const regex = /th:([\w-]+)/;
      for (const attr of Array.from(node.attributes)) {
        if (attr.name.startsWith("th:")) {
          const directiveFn = this.directives[attr.name];
          if (directiveFn) {
            context.attrName = attr.name;
            directiveFn.call(this, node, attr, context);
            if (attr.name === 'th:each') {
              return;
            }
            node.removeAttribute(attr.name);
          } else {
            this.processExternalAttr(node, attr, context);
          }
        }
      }

      //console.log('node.childNodes: ', node.childNodes);
      for (const child of Array.from(node.childNodes)) {
        this.processNode(child, context);
      }
      if (hasObjectAttr) {
        context.objectContexts.pop();
      }
    }
  }

  processExternalAttr(node, attr, context) {

    // handle all external tags starting with th:  
    const attrName = attr.name.slice(3);
    const attrValue = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    node.setAttribute(attrName, attrValue);
  }


  processEach(node, attr, context) {
    const [rawVarName, expression] = attr.value.split(':');
    const varName = rawVarName.trim();
    const dataArray = this.evaluate(expression, context);

    const parent = node.parentNode;
    node.removeAttribute(attr.name);

    // We clone the current node and we remove it
    const originalClone = node.cloneNode(true);
    parent.removeChild(node);
    
    for (const item of dataArray) {
      if (item === null) continue;
      
      const newContext = { ...context, globalContext: { ...context.globalContext, [varName]: item }, };

      // We append a copy of the clone
      const clone = parent.appendChild(originalClone.cloneNode(true));
      //console.log('newContext= ', newContext);
      this.processNode(clone, newContext);
    }
  }

  processIf(node, attr, context) {
    
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

  processUText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.innerHTML = text;
  }

  processText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.textContent = text;
  }

  processAttr(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      node.setAttribute(name.trim(), value);
    }
  }
  
  processAttrAppend(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      const existingValue = node.getAttribute(name.trim()) || '';
      node.setAttribute(name.trim(), `${existingValue} ${value}`.trim());
    }
  }
  
  processAttrPrepend(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      const existingValue = node.getAttribute(name.trim()) || '';
      node.setAttribute(name.trim(), `${value} ${existingValue}`.trim());
    }
  }

  processClass(node, attr, context) {
    const className = this.evaluate(attr.value, context);
    node.setAttribute('class', className);
  }

  processClassAppend(node, attr, context) {
    const className = this.evaluate(attr.value, context);
    const existingClass = node.getAttribute('class') || '';
    node.setAttribute('class', `${existingClass} ${className}`.trim());
  }

  processStyleAppend(node, attr, context) {
    const styleValue = this.evaluate(attr.value, context);
    const existingStyle = node.getAttribute('style') || '';
    node.setAttribute('style', `${existingStyle}; ${styleValue}`.trim());
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

      //console.log('context.objectContexts: ', context.objectContexts);
    
      // if there is an array of objectContexts ex [friends['Tom Hanks'], children['Colin Hanks']]
      // We build the full context path: friends['Tom Hanks'].children['Colin Hanks']
      const curContext = context.objectContexts.length ? context.objectContexts.join('.') : '';
      expr = expr.replace(/(\*?){([^}]+)}/g, (match, p1, p2) => {
        return (p1 === '*' && curContext) ? curContext + '.' + p2 : p2;
      });
      //console.log('expr: ', expr);

    //console.log('contextKeys: ', contextKeys);
    

    const func = new Function(...contextKeys, `return (${expr});`);
    return func(...contextValues);
  }
}

export default ThymeleafJs;