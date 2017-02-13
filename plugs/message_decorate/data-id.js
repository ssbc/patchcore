exports.gives = 'message_decorate'

exports.create = function (api) {
  return function (element, { msg }) {
    element.dataset.id = msg.key
    return element
  }
}
