import { JSDOM } from 'jsdom';
const Node = new JSDOM('').window.Node;

class ThymeleafJs {
  static evaluateExpression(expression, context) {
    const matches = expression.match(/@\{(.+?)\}/g);
    if (!matches) {
      return expression;
    }
    matches.forEach((match) => {
      const expressionToEvaluate = match.slice(2, -1);
      const value = eval(expressionToEvaluate);
      expression = expression.replace(match, value || '');
    });
    return expression;
  }

  static processNode(node, context) {
    if (!node.attributes) return;
    const attributeNodes = Array.from(node.attributes);
    attributeNodes.forEach((attribute) => {
      const attributeName = attribute.name;
      const attributeValue = ThymeleafJs.evaluateExpression(attribute.value, context);
      node.setAttribute(attributeName, attributeValue);
    });
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = ThymeleafJs.evaluateExpression(node.textContent, context);
    }
  }

  static processChildNodes(node, context) {
    const nodes = Array.from(node.childNodes);
    nodes.forEach((childNode) => {
      ThymeleafJs.processNode(childNode, context);
      ThymeleafJs.processChildNodes(childNode, context);
    });
  }

  static render(html, context) {
    const dom = new JSDOM(html);
    const rootNode = dom.window.document.body;
    ThymeleafJs.processNode(rootNode, context);
    ThymeleafJs.processChildNodes(rootNode, context);
    return rootNode.innerHTML;
  }
}

export default ThymeleafJs;
