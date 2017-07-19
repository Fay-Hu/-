//这方法才能获取最终是否有display属性设置，不能style.display。
     function getStyles(elem) {

          // Support: IE<=11+, Firefox<=30+ (#15098, #14150)
          // IE throws on elements created in popups
          // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
          var view = elem.ownerDocument.defaultView;

          if (!view || !view.opener) {
               view = window;
          }
          return view.getComputedStyle(elem);
     }
