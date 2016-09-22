# -
css经验总结

## css动画

```css
.rotate{
  
  width:200px;
  background:red;
  
  
  //transition:all ease-in-out .45s;
  //transform-origin:100% 50%;
  animation:smash ease-out .5s;
}
.test{
  margin:200px;
  perspective:800px;
}
@keyframes smash{
  0%{
    opacity:0;
    
    transform:translateZ(1200px) rotate(180deg);
  }  
  100%{
    transform:translateZ(0);
  }
}
```
