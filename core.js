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

//getBoundingClientRect判断元素是否在可视区域
function isElementInViewport (el) {
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}
