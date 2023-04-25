import { JSDOM } from 'jsdom';
import prettier from 'prettier';

class ThymeleafJs {
  constructor() {
    this.directives = {
      'vr:text': this.processText,
      'vr:if': this.processIf,
      'vr:unless': this.processUnless,
      'vr:attr': this.processAttr,
      'vr:class': this.processClass,
      'vr:each': this.processEach,
    };
  }

  render(html, context) {
    const dom = new JSDOM(`<!DOCTYPE html>${html}`);
    const document = dom.window.document;
    this.processNode(document.body, context);
  
    const hasHtmlTag = /<html[\s\S]*?>/i.test(html);
    if (hasHtmlTag) {
      const formattedHtml = prettier.format(dom.serialize(), { parser: 'html' });
      return formattedHtml;
    } else {
      const formattedHtml = prettier.format(document.body.innerHTML, { parser: 'html' });
      return formattedHtml;
    }
  }
  

  removeEmptyTextNodes(node) {
    if (node.previousSibling && node.previousSibling.nodeType === 3 && !/\S/.test(node.previousSibling.textContent)) {
      node.parentNode.removeChild(node.previousSibling);
    }
    if (node.nextSibling && node.nextSibling.nodeType === 3 && !/\S/.test(node.nextSibling.textContent)) {
      node.parentNode.removeChild(node.nextSibling);
    }
  }
  
  processNode(node, context) {
    if (node.nodeType === 3) {
      this.processText(node);
    } else if (node.nodeType === 1) {
      // Iterate through the attributes of the element
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        this.processAttr(attr, node);
      }
  
      node.childNodes.forEach((childNode) => {
        this.processNode(childNode);
      });
    }
  }

  processNode(node, context) {
    if (node.nodeType === 3) { // Node.TEXT_NODE is 3
      return this.processText(node.textContent, context);
    }

    if (node.nodeType !== 1) { // Node.ELEMENT_NODE is 1
      return node.cloneNode(true);
    }

    if (node.hasAttribute("vr:each")) {
      return this.processEach(node, context);
    }

    if (node.hasAttribute("vr:if")) {
      const newNode = node.cloneNode(true);
      newNode.removeAttribute("vr:if");
      const condition = this.processIf(newNode, context);
      if (condition) {
        return this.processNode(newNode, context);
      } else {
        return null;
      }
    }

    const newNode = node.cloneNode(false);

    Array.from(node.attributes).forEach((attr) => {
      if (attr.name === "vr:attr") {
        this.processAttr(newNode, attr.value, context);
      } else {
        newNode.setAttribute(attr.name, attr.value);
      }
    });

    Array.from(node.childNodes).forEach((childNode) => {
      const processedChild = this.processNode(childNode, context);
      if (processedChild) {
        newNode.appendChild(processedChild);
      }
    });

    return newNode;
  }


  processText(node, context) {
    if (node.nodeType !== 3) return;
  
    const text = this.evaluate(node.nodeValue, context);
    if (text) {
      node.nodeValue = text;
    }
  }

  processIf(node, attr, context) {
    console.log('Entering processIf');
    console.log(`attr.value=${attr.value} context=${context}`);
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
    console.log('attr:', JSON.stringify(attr, null, 2));
    if (!attr.name.startsWith(this.prefix + ':')) return;
  
    const directiveName = attr.name.substring(this.prefix.length + 1);
    const [name, expression] = attr.value.split('=');
    console.log('directiveName: ', directiveName);
    console.log('name: ', name);
    console.log('expression: ', expression);
    
    switch (directiveName) {
      case 'attr':
        const result = this.evaluate(expression, context);
        node.setAttribute(name, result);
        node.removeAttribute(attr.name);
        break;
      default:
        break;
    }
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
      this.processNode(clone, newContext);
      parent.insertBefore(clone, node);
    }

    parent.removeChild(node);
  }

  evaluate(code, context) {
    if (!code) return '';
  
    const contextKeys = Object.keys(context);
    const expr = code.replace(/\{(.*?)\}/g, '$1');
    const func = new Function(...contextKeys, `return (${expr});`);
    console.log('code: ', code);
    console.log('expr: ', expr);
    console.log('contextKeys: ', contextKeys);
  
    try {
      return func(...contextKeys.map((key) => context[key]));
    } catch (error) {
      console.error(`Error evaluating: ${code}`);
      console.error(error);
      return '';
    }
  }

  // evaluate(expression, context) {
  //   const code = expression.replace(/\{(.*?)\}/g, (_, expr) => `\${${expr}}`);
  //   const contextKeys = Object.keys(context);
  //   const contextValues = Object.values(context);

  //   console.log('code: ', code);
  //   console.log('contextKeys: ', contextKeys);
  //   console.log('contextValues: ', contextValues);
  //   const func = new Function(...contextKeys, `return \`${code}\`;`);
  //   return func(...contextValues);
  // }
  
}

export default ThymeleafJs;



