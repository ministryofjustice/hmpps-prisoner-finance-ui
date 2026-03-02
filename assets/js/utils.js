export default function nodeListForEach(nodes, callback) {
  if (window.NodeList.prototype.forEach) {
    nodes.forEach(callback)
    return
  }

  for (let i = 0; i < nodes.length; i += 1) {
    callback.call(window, nodes[i], i, nodes)
  }
}
