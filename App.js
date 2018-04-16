var createReactClass = require('create-react-class')
var DOM = require('react-dom-factories')
var div = DOM.div, button = DOM.button, ul = DOM.ul, li = DOM.li

// This is just a simple example of a component that can be rendered on both
// the server and browser

module.exports = createReactClass({

  // We initialise its state by using the `props` that were passed in when it
  // was first rendered. We also want the button to be disabled until the
  // component has fully mounted on the DOM
  //我们通过使用第一次渲染时传入的`props`来初始化它的状态。 我们还希望按钮被禁用，直到组件完全安装在DOM上
  getInitialState: function() {
    return {items: this.props.items, disabled: true}
  },

  // Once the component has been mounted, we can enable the button
  // 一旦组件被安装，我们可以启用按钮
  componentDidMount: function() {
    this.setState({disabled: false})
  },

  // Then we just update the state whenever its clicked by adding a new item to
  // the list - but you could imagine this being updated with the results of
  // AJAX calls, etc
  //然后,我们只要通过向列表中添加一个新项目来更新状态 - 但你可以想象这会被更新为AJAX调用的结果等等
  handleClick: function() {
    this.setState({
      items: this.state.items.concat('Item ' + this.state.items.length),
    })
  },

  // For ease of illustration, we just use the React JS methods directly
  // (no JSX compilation needed)
  // Note that we allow the button to be disabled initially, and then enable it
  // when everything has loaded
  // 为了便于说明，我们直接使用React JS方法（不需要JSX编译）
  // 请注意，我们允许最初禁用按钮，并且在加载所有内容时启用它
  render: function() {

    return div(null,

      button({onClick: this.handleClick, disabled: this.state.disabled}, 'Add Item'),

      ul({children: this.state.items.map(function(item) {
        return li(null, item)
      })})

    )
  },
})
