import { JSDOM } from 'jsdom';
import prettier from 'prettier';

import lists from './utilities/lists.js';

// Declare constants inside the class
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

class ThymeleafJs {


  constructor() {
    this.directives = {
      'th:each': this.processEach,
      //
      'th:if': this.processIf,
      'th:unless': this.processUnless,
      'th:object': this.processObject,
      'th:attr': this.processAttr,
      'th:attrprepend': this.processAttrPrepend,
      'th:attrappend': this.processAttrAppend,
      'th:classappend': this.processClassAppend,
      'th:styleappend': this.processStyleAppend,
      'th:text': this.processText,
      'th:utext': this.processUText,
      'th:remove': this.processRemove, // WIP
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


    const document = ThymeleafJs.createDOMParser(`${html}`);

    const context = {
      document: document,
      attrName: '',
      globalContext: userContext,
      curContexts: [],
    };


    this.processNode(document.body, context);

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

  processAttributesAndChildren(node, context) {
    const regex = /th:([\w-]+)/;
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith("th:")) {
        context.attrName = attr.name;
        const directiveFn = this.directives[attr.name];
        if (directiveFn) {
          directiveFn.call(this, node, attr, context);
        } else {
          this.processStandardAttr(node, attr, context);
        }
      }
    }

    //console.log('node.childNodes: ', node.childNodes);
    for (const child of Array.from(node.childNodes)) {
      this.processNode(child, context);
    }
  }

  processNode(node, context) {
    if (node.nodeType === ELEMENT_NODE) {

      if (node.hasAttribute('th:object')) {
        this.processObject(node, node.getAttributeNode('th:object'), context);
      } else if (node.hasAttribute('th:each')) {
        this.processEach(node, node.getAttributeNode('th:each'), context);
      } else if (node.hasAttribute('th:remove')) {
        this.processRemove(node, node.getAttributeNode('th:remove'), context);
      }
      else {
        this.processAttributesAndChildren(node, context);
      }
    }
  }

  processStandardAttr(node, attr, context) {

    // handle all external tags starting with th:  
    const attrName = attr.name.slice(3);
    const attrValue = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    node.setAttribute(attrName, attrValue);
  }


  processObject(node, attr, context) {
    let objectAttr = node.getAttributeNode('th:object');
    let objectValue = objectAttr.value.replace(/\{(.*?)\}/g, '$1');
    context.curContexts.push(objectValue);

    node.removeAttribute('th:object');
    this.processAttributesAndChildren(node, context);

    context.curContexts.pop();
  }

  processEach(node, attr, context) {
    // Split the attribute value by the colon character
    const [leftPart, expression] = attr.value.split(':');
    const varNames = leftPart.trim().split(',');
    const regex = /{([^}]+)}/;
    const match = expression.match(regex);
    const exprNobraces = (match) ? match[1] : null;


    // th:each="varName, varStat : {anIterable}"
    // Extract varName and status variable varStat(if provided)
    const varName = varNames[0].trim();
    const rawStatusVarName = varNames.length > 1 ? varNames[1].trim() : null;
    // if a status var is not provided create one by appending Stat to varName
    const statusVarName = rawStatusVarName ? rawStatusVarName.trim() : `${varName}Stat`;
    const data = this.evaluate(expression, context);

    const parent = node.parentNode;
    node.removeAttribute(attr.name);

     // Create a marker node and insert it at the position of the original node
    const markerNode = context.document.createTextNode('');
    parent.insertBefore(markerNode, node);

    // We clone the current node and we remove it
    const originalClone = node.cloneNode(true);
    parent.removeChild(node);

    const dataArray = data ? (Array.isArray(data) ? data : Object.entries(data)) : [];
    for (let i = 0; dataArray && i < dataArray.length; i++) {
      const item = Array.isArray(data) ? dataArray[i] : { key: dataArray[i][0], value: dataArray[i][1] };
      if (item === null) continue;

      // Build a status variable
      const status = {
        index: i,
        count: i + 1,
        size: dataArray.length,
        current: item,
        even: i % 2 === 0,
        odd: i % 2 !== 0,
        first: i === 0,
        last: i === dataArray.length - 1,
      };

      context.curContexts.push(`${exprNobraces}[${i}]`);

      const newContext = {
        ...context,
        globalContext: {
          ...context.globalContext,
          [varName]: item,
          [statusVarName]: status,
        },
      };

      // We append a copy of the clone
      const clone = parent.appendChild(originalClone.cloneNode(true));
      parent.insertBefore(clone, markerNode);

      this.processNode(clone, newContext);

      context.curContexts.pop();
    }

    // Remove the marker node after all new nodes have been inserted
    parent.removeChild(markerNode);
  }


  processIf(node, attr, context) {

    const condition = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    if (!condition) {
      this.removeEmptyTextNodes(node);
      node.remove();
    }
  }

  processUnless(node, attr, context) {
    const condition = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    if (condition) {
      this.removeEmptyTextNodes(node);
      node.remove();
    }
  }

  processRemove(node, attr, context) {
    const removalType = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);

    // all: Remove both the containing tag and all its children.
    // body: Do not remove the containing tag, but remove all its children.
    // tag: Remove the containing tag, but do not remove its children.
    // all-but-first: Remove all children of the containing tag except the first one.
    // none : Do nothing. This value is useful for dynamic evaluation.
    switch (removalType) {
      case 'all':
        node.parentNode.removeChild(node);
        break;

      case 'body':
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
        break;

      case 'tag':
        let fragment = context.document.createDocumentFragment();
        while (node.firstChild) {
          fragment.appendChild(node.firstChild);
        }
        node.parentNode.replaceChild(fragment, node);
        break;
        
      case 'all-but-first':
        while (node.children.length > 1) {
          node.removeChild(node.lastChild);
        }
        break;
      case 'none':
      default:
        // do nothing
        break;
    }

    this.processNode(node, context);
  }

  processUText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    node.innerHTML = text;
  }

  processText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    node.removeAttribute(attr.name);
    node.textContent = text;
  }

  processAttr(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      node.removeAttribute(attr.name);
      node.setAttribute(name.trim(), value);
    }
  }

  processAttrAppend(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      const existingValue = node.getAttribute(name.trim()) || '';
      node.removeAttribute(attr.name);
      node.setAttribute(name.trim(), `${existingValue} ${value}`.trim());
    }
  }

  processAttrPrepend(node, attr, context) {
    const assignments = attr.value.split(',');
    for (const assignment of assignments) {
      const [name, expression] = assignment.trim().split('=');
      const value = this.evaluate(expression.trim(), context);
      const existingValue = node.getAttribute(name.trim()) || '';
      node.removeAttribute(attr.name);
      node.setAttribute(name.trim(), `${value} ${existingValue}`.trim());
    }
  }

  processClassAppend(node, attr, context) {
    const className = this.evaluate(attr.value, context);
    const existingClass = node.getAttribute('class') || '';
    node.removeAttribute(attr.name);
    node.setAttribute('class', `${existingClass} ${className}`.trim());
  }

  processStyleAppend(node, attr, context) {
    const styleValue = this.evaluate(attr.value, context);
    const existingStyle = node.getAttribute('style') || '';
    node.removeAttribute(attr.name);
    node.setAttribute('style', `${existingStyle}; ${styleValue}`.trim());
  }
  injectFunctions(functionNames) {
    const namespaces = { lists };
    let code = '';

    functionNames.forEach(functionName => {
      const [namespace, func] = functionName.split('.');

      if (namespaces[namespace] && namespaces[namespace][func]) {
        if (!code.includes(`const ${namespace} = {`)) {
          code += `const ${namespace} = {\n`;
        }
        code += `  ${func}: ${namespaces[namespace][func].toString()},\n`;
      }
    });

    // Close all open objects
    Object.keys(namespaces).forEach(namespace => {
      if (code.includes(`const ${namespace} = {`)) {
        code += '};\n';
      }
    });

    return code;
  }

  // URL generation function
  convertPath(input) {
    const regex = /\((.*?)\)/g;
    let match = input.match(regex);
    if (match) {
        let parameters = match[0].slice(1, -1).split(',');
        let queryParameters = parameters.map(param => {
            let [key, value] = param.split('=');
            if (value.startsWith("{") && value.endsWith("}")) {
                value = "${" + value.slice(1, -1) + "}";
            }
            return `${key.trim()}=${value.trim()}`;
        }).join('&');
        return `\`${input.replace(regex, `?${queryParameters}`)}\``;
    }
    return `'${input}'`;
}


  evaluate(expression, context) {

    // Simply check if expression contains at least a { - it's stupid in this case
    // to use a th: attributes but we need to handle the case
    // I suppose you need a better way of detecting this but for now it works with all my cases
    const trimmedExpr = expression.trimStart();
    if (!trimmedExpr.length ||
      (trimmedExpr.length &&
        trimmedExpr.indexOf('{') === -1 &&
        trimmedExpr.indexOf('+') === -1 &&
        trimmedExpr[0] !== '\'' && trimmedExpr[0] !== '"')) {
      return expression;
    }

    let urlhandled = false;
    const contextKeys = Object.keys(context.globalContext);
    const contextValues = Object.values(context.globalContext);

    let expr = expression.trim().replace(/(\b)and(\b)/gi, ' && ')
      .replace(/(\b)or(\b)/gi, ' || ')
      .replace(/(\b)gt(\b)/gi, ' > ')
      .replace(/(\b)lt(\b)/gi, ' < ')
      .replace(/(\b)ge(\b)/gi, ' >= ')
      .replace(/(\b)le(\b)/gi, ' =< ')
      .replace(/(\b)not(\b)/gi, ' ! ');

    // For now we don't handle #{foo} internationalization syntax => replace with 'foo'
    expr = expr.replace(/#\{([^}]+)\}/g, "'$1'");

    // Detect and process Thymeleaf-style URLs @{.....} in the expression
    // '@{/product/comments(prodId=${prod.id})}' => '/product/comments?prodId=123'
    //console.log('expr: ', expr);
    const urlTemplateRegex = /@\{(.*)\}/;
    let urlTemplateMatch;
    while ((urlTemplateMatch = urlTemplateRegex.exec(expr)) !== null) {
      console.log('urlTemplateMatch[0]: ', urlTemplateMatch[0]);
      console.log('urlTemplateMatch[1]: ', urlTemplateMatch[1]);
      const urlTemplate = urlTemplateMatch[1];
      const url = this.convertPath(urlTemplate, context); // Implement this function to generate the correct URL
      expr = expr.replace(urlTemplateMatch[0], url);
      urlhandled = true;
    }


    // Code below parse an expression and identify the variables inside {} (but ignore inside *{})
    // You really think I could write this, of course not, ChatGPT powered
    // Maybe rewrite with a manual parsing easier to maintain and understand
    const variables = new Set();
    const expressionRegex = /{([^}]+)}/g;
    const variableRegex = /(?:^|[^\w'"])([\w_][\w\d_]*)(?:\s*[^\w\s\d'"]*\s*[\w\d_]*|[^\w'"]|$)/g;
    const quotedWordRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
    const numberRegex = /\b\d+\b/g;

    let expressionMatch;
    while ((expressionMatch = expressionRegex.exec(expr)) !== null) {
      if (expressionMatch.input[0] === '*') 
        continue; // Ignore variables inside *{...}
      const expression = expressionMatch[1]
        .replace(quotedWordRegex, '')
        .replace(numberRegex, '');
      let variableMatch;
      while ((variableMatch = variableRegex.exec(expression)) !== null) {
        if (!variableMatch[0].startsWith('#')) {
          variables.add(variableMatch[1]);
        }
      }
    }

    // if there is an array of curContexts ex [friends['Tom Hanks'], children['Colin Hanks']]
    // We build the full context path: friends['Tom Hanks'].children['Colin Hanks']
    const curContext = context.curContexts.length ? context.curContexts.join('.') : '';

    if (!urlhandled) {
      expr = expr.replace(/(\*?){([^}]+)}/g, (match, p1, p2) => {
        return (p1 === '*' && curContext) ? curContext + '.' + p2 : p2;
      });
    }

    let undefinedValuesExpr = '';
    for (const variable of variables) {
      if (!contextKeys.includes(variable)) {
        const undefinedVal = (context.attrName === 'th:text' || context.attrName === 'th:utext') ? "''" : 'undefined';
        undefinedValuesExpr += `var ${variable} = ${undefinedVal};`;
      }
    }

    let functionsToInject = [];
    // Extract function calls from the expression
    const functionCallRegex2 = /#\w+\.\w+\([^)]*\)/g;
    const functionCalls = expr.match(functionCallRegex2);
    if (functionCalls) {
      // Handle each function call
      functionCalls.forEach(functionCall => {
        // Extract namespace, function name, and arguments
        const namespaceWithHashAndFunction = functionCall.split('(')[0];
        const argsTrimmed = functionCall.split('(')[1].slice(0, -1); // Remove the trailing ')'
        const namespaceWithHash = namespaceWithHashAndFunction.split('.')[0];
        const functionName = namespaceWithHashAndFunction.split('.')[1];
        const namespace = namespaceWithHash.substring(1); // Remove the leading '#'

        // Replace the function call with the '#' removed in the original expression
        expr = expr.replace(functionCall, `${namespace}.${functionName}(${argsTrimmed})`);
        functionsToInject.push(`${namespace}.${functionName}`);
      });
    }
    let injectFunctions = functionsToInject.length ? this.injectFunctions(functionsToInject) : '';

    //console.log('contextKeys: ', contextKeys);
    const jsExpr = `${injectFunctions} ${undefinedValuesExpr} return (${expr});`;
    //console.log(`jsExpr: ${jsExpr}`);
    const func = new Function(...contextKeys, `${jsExpr}`);
    return func(...contextValues);
  }
}

export default ThymeleafJs;