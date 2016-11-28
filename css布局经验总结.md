# -
css经验总结 前端站点性能检测工具：yellow lab tools

## css动画

  - css实现45°折角效果 [详细参考](http://www.open-open.com/lib/view/open1451869384308.html)
```css

  background: #58a; /* Fallback */
  background:linear-gradient(-135deg, transparent 2em, #58a 0);
  
```
  -css transitionend和animationend有多个属性动画时会触发多次，使用jq的one()绑定可以保证只执行一次

  -关于input输入框页面放大的问题。解决这个问题，首先需要在头部加一个
  
  ```css
  <meta name="viewport" content="width=720,inital-scale=1.0,user-scalable=no;">
  ```
  
  再加一个如下的css样式：
  ```css
  input,input:focus,input:active{user-select: text;}
  ```
## css兼容性
  - Firefox及IE下给div设置区域滚动后，会导致容器的padding-bottom值失效，chrome下则不会
  - IE以下的媒体查询兼容库对于内联样式无法生效，所以如果要兼容IE8,不要在style标签里写媒体查询
