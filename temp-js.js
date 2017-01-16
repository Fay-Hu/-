const component = {
  template: `
	  <canvas class="paint-stage"></canvas>
	`,
  style: `
    .paint-stage{
      height:100%;
      width:100%;
      background: -webkit-linear-gradient(top,#cbebdb 0,#3794c0 120%);
    }
	`,
  selector: 'x-paint-shifter'
};

/**
 * depends on Point,Dot
 */
class PaintShifter extends HTMLElement {
  constructor() {
    super();

    this.$shadowRoot = this.attachShadow({mode: 'closed'});
    this.model = {};
    this.dots = [];
    this.render();
  }

  render() {
    this.$shadowRoot.innerHTML = '<style>' + component.style + '</style>' + component.template;
    this.$stage = this.$shadowRoot.querySelector('.paint-stage');
    this.context = this.$stage.getContext('2d');
    this._init();
  }

  _init() {
    const devicePixelRatio = window.devicePixelRatio || 1; //dpr
    this.$stage.setAttribute('height', devicePixelRatio * window.getComputedStyle(this.$stage, null).height.replace(/px/, ''));
    this.$stage.setAttribute('width', devicePixelRatio * window.getComputedStyle(this.$stage, null).width.replace(/px/, ''));

    this.productRandomDots(200);
  }

  productRandomDots(num) {
    for (let i = 0; i < num; i++) {
      let ramX = Math.random() * this.$stage.width, ramY = Math.random() * this.$stage.height;
      this.addDot(ramX, ramY, 5);
    }
  }

  addDot(x, y, r) {
    new Dot(this.context,{x, y, r,fillStyle: 'white'});
  }
}

class Point {
  constructor(props) {
    let {x, y, r, a, h} = props;
    this.x = x;
    this.y = y;
    this.r = r;
    this.a = a;
    this.h = h;
  }
}

class Dot {
  constructor(context,opts) {
    this.p = new Point({
      x: opts.x,
      y: opts.y,
      r: opts.r,
      a: 1,
      h: 0
    });
    this.context = context;
    this.opts = opts;
    this.render();
  }

  render() {
    const context = this.context;
    context.fillStyle = this.opts.fillStyle;
    context.beginPath();
    context.arc(this.p.x, this.p.y, this.p.z, 0, 2 * Math.PI, true);
    context.closePath();
    context.fill();
  }

  clone() {
    let {x, y, z, a, h} = this.p;
    return new Point({
      x: x,
      y: y,
      z: z,
      a: a,
      h: h
    });
  }
}

customElements.define(component.selector, PaintShifter);
