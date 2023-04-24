import { JSDOM } from 'jsdom';
import prettier from 'prettier';

class ThymeleafJs {
  constructor() {
    this.directives = {
      'vr:text': this.processText,
      'vr:if': this.processIf,
      'vr:attr': this.processAttr,
      'vr:class': this.processClass,
      'vr:each': this.processEach,
    };
  }

  render(html, context) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    this.processNode(document.body, context);
    const formattedHtml = prettier.format(dom.serialize(), { parser: 'html' });
    return formattedHtml;
  }

  processNode(node, context) {
    if (node.nodeType === 1) {
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
    }
  }

  processText(node, attr, context) {
    const text = this.evaluate(attr.value, context);
    console.log('processText with text: ', text);
    node.textContent = text;
  }

  processIf(node, attr, context) {
    console.log('Entering processIf');
    console.log(`attr.value=${attr.value} context=${context}`);
    const condition = this.evaluate(attr.value, context);
    if (!condition) {
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
      this.processNode(clone, newContext);
      parent.insertBefore(clone, node);
    }

    parent.removeChild(node);
  }

  evaluate(expression, context) {
    const code = expression.replace(/\{(.*?)\}/g, (_, expr) => `\${${expr}}`);
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    console.log('code: ', code);
    console.log('contextKeys: ', contextKeys);
    console.log('contextValues: ', contextValues);
    const func = new Function(...contextKeys, `return \`${code}\`;`);
    return func(...contextValues);
  }
  
}

export default ThymeleafJs;



