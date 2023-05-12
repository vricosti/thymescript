const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

  class ThymeleafJs {


    constructor() {
      this.directives = {
        'th:each': this.processEach,
        'th:object': this.processObject,
        //
        'th:if': this.processIf,
        'th:unless': this.processUnless,
        'th:utext': this.processUText,
        'th:text': this.processText,
        'th:attr': this.processAttr,
        'th:attrappend': this.processAttrAppend,
        'th:attrprepend': this.processAttrPrepend,
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
      

      const document = ThymeleafJs.createDOMParser(`${html}`);

      const context = {
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
          const directiveFn = this.directives[attr.name];
          if (directiveFn) {
            context.attrName = attr.name;
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
        
        let hasObjectAttr = false;
        if (node.hasAttribute('th:object')) {
          this.processObject(node, node.getAttributeNode('th:object'), context);
        } else if (node.hasAttribute('th:each')) {
          this.processEach(node, node.getAttributeNode('th:each'), context);
        } else {
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
        this.processNode(clone, newContext);

        context.curContexts.pop();
      }
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


      const contextKeys = Object.keys(context.globalContext);
      const contextValues = Object.values(context.globalContext);
  
      let expr = expression.trim().replace(/(\b)and(\b)/gi, ' && ')
        .replace(/(\b)or(\b)/gi, ' || ')
        .replace(/(\b)gt(\b)/gi, ' > ')
        .replace(/(\b)lt(\b)/gi, ' < ')
        .replace(/(\b)ge(\b)/gi, ' >= ')
        .replace(/(\b)le(\b)/gi, ' =< ')
        .replace(/(\b)not(\b)/gi, ' ! ');
  
        // TODO: rewrite code below because not enought strict and robust

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
          if (expressionMatch.input[0] === '*') continue; // Ignore variables inside *{...}
          const expression = expressionMatch[1]
            .replace(quotedWordRegex, '')
            .replace(numberRegex, '');
          let variableMatch;
          while ((variableMatch = variableRegex.exec(expression)) !== null) {
            variables.add(variableMatch[1]);
          }
        }

        
        // if there is an array of curContexts ex [friends['Tom Hanks'], children['Colin Hanks']]
        // We build the full context path: friends['Tom Hanks'].children['Colin Hanks']
        const curContext = context.curContexts.length ? context.curContexts.join('.') : '';

        expr = expr.replace(/(\*?){([^}]+)}/g, (match, p1, p2) => {
          return (p1 === '*' && curContext) ? curContext + '.' + p2 : p2;
        });

        let undefinedValuesExpr = '';
        for (const variable of variables) {
          if (!contextKeys.includes(variable)) {
            const undefinedVal = (context.attrName === 'th:text' || context.attrName === 'th:utext') ? "''" : 'undefined';
            undefinedValuesExpr += `var ${variable} = ${undefinedVal};`;
          }
        }

      //console.log('contextKeys: ', contextKeys);
      const func = new Function(...contextKeys, `${undefinedValuesExpr} return (${expr});`);
      return func(...contextValues);
    }
  }

export default ThymeleafJs;